// 订阅调度器：Node 进程内 setInterval 1 分钟 tick
// 软件级扫描复用 github_releases_cache，按用户订阅独立投递
// 所有状态持久化在 DB，进程重启后 next_check_at 驱动自动恢复
import { pool } from "./database.js";
import { ensureGitHubReleasesCache } from "./githubReleases.js";
import { decryptChannelConfig, sendNotification } from "./notifier.js";
import { getOrCreateSummary } from "./releaseSummary.js";

// ========== 可调参数 ==========
const TICK_INTERVAL_MS = Number(
	process.env.SUBSCRIPTION_TICK_INTERVAL_MS || 60 * 1000,
);
const MAX_SOFTWARE_PER_TICK = 50; // 单次 tick 最多处理的软件数
const MAX_CONCURRENT_SOFTWARES = 5; // 软件并发上限
const MAX_CONCURRENT_DELIVERIES = 5; // 单软件投递并发上限
const MAX_FAILURES_BEFORE_PAUSE = 3;

// ========== 内部状态 ==========
let timer = null;
let running = false;
let lastTickAt = null;

// ========== 启动/停止 ==========

export function start() {
	if (timer) return;
	console.log(`[SUB_SCHED] 启动调度器，tick 间隔=${TICK_INTERVAL_MS}ms`);
	// 立即跑一次，避免启动后要等一个 tick 周期
	tick().catch((err) => console.error("[SUB_SCHED] 启动 tick 失败:", err));
	timer = setInterval(() => {
		tick().catch((err) => console.error("[SUB_SCHED] tick 异常:", err));
	}, TICK_INTERVAL_MS);
	// Node 默认 keep-alive 不要阻塞进程退出
	if (timer.unref) timer.unref();
}

export function stop() {
	if (timer) {
		clearInterval(timer);
		timer = null;
		console.log("[SUB_SCHED] 调度器已停止");
	}
}

export function getStatus() {
	return {
		running,
		lastTickAt,
		tickIntervalMs: TICK_INTERVAL_MS,
	};
}

// ========== tick 主流程 ==========

async function tick() {
	if (running) {
		// 上次还没跑完，本轮直接跳过
		return;
	}
	running = true;
	lastTickAt = new Date().toISOString();

	try {
		// 1. 捞出到期订阅
		const { rows: dueSubs } = await pool.query(
			`SELECT s.*, sw.name AS sw_name, sw.icon AS sw_icon,
			        sw.website AS sw_website, sw.category AS sw_category,
			        sw.description AS sw_description
			   FROM subscriptions s
			   JOIN softwares sw ON sw.id = s.software_id
			  WHERE s.paused_reason IS NULL
			    AND s.next_check_at <= NOW()
			  ORDER BY s.next_check_at
			  LIMIT $1`,
			[MAX_SOFTWARE_PER_TICK * 10],
		);

		if (dueSubs.length === 0) return;

		// 2. 按 software_id 分组
		const bySoftware = new Map();
		for (const sub of dueSubs) {
			if (!bySoftware.has(sub.software_id)) {
				bySoftware.set(sub.software_id, { software: sub, subs: [] });
			}
			bySoftware.get(sub.software_id).subs.push(sub);
		}

		// 3. 取前 MAX_SOFTWARE_PER_TICK 个软件组
		const groups = Array.from(bySoftware.values()).slice(
			0,
			MAX_SOFTWARE_PER_TICK,
		);

		console.log(
			`[SUB_SCHED] tick: 待扫描软件=${groups.length}, 待投递订阅=${dueSubs.length}`,
		);

		// 4. 软件级并发扫描
		await runWithConcurrency(groups, MAX_CONCURRENT_SOFTWARES, processSoftware);
	} finally {
		running = false;
	}
}

// ========== 处理单个软件的所有订阅 ==========

async function processSoftware(group) {
	const { software, subs } = group;
	const softwareMeta = {
		name: software.sw_name,
		category: software.sw_category,
		description: software.sw_description,
	};

	let ghResult = null;
	try {
		ghResult = await ensureGitHubReleasesCache(
			software.software_id,
			software.sw_website,
		);
	} catch (err) {
		console.error(
			`[SUB_SCHED] 抓取 GitHub 失败 software=${software.software_id}:`,
			err.message,
		);
		// 整个软件都推不了，仅推迟下次检查时间，不累加失败次数
		for (const sub of subs) {
			await rescheduleOnly(sub.id, sub.check_interval_minutes);
		}
		return;
	}

	// 非 GitHub 仓库：没什么可推的，直接推迟
	if (!ghResult.isGitHub || !ghResult.releases?.length) {
		for (const sub of subs) {
			await rescheduleOnly(sub.id, sub.check_interval_minutes);
		}
		return;
	}

	// 按订阅并发投递
	await runWithConcurrency(subs, MAX_CONCURRENT_DELIVERIES, async (sub) => {
		await deliverToSubscription(sub, softwareMeta, ghResult.releases);
	});
}

// ========== 投递到单个订阅 ==========

async function deliverToSubscription(sub, softwareMeta, releases) {
	const target = selectTargetRelease(releases, sub);

	// 没有可推的 release：只更新时间
	if (!target) {
		await rescheduleOnly(sub.id, sub.check_interval_minutes);
		return;
	}

	// 版本未变：只更新时间
	if (sub.last_notified_version === target.tag_name) {
		await rescheduleOnly(sub.id, sub.check_interval_minutes);
		return;
	}

	// 解析目标通道
	const channel = await resolveChannel(sub.user_id, sub.channel_id);
	if (!channel) {
		// 无可用通道：记 skipped，暂停订阅
		await insertLog({
			subscription_id: sub.id,
			channel_type: "none",
			tag_name: target.tag_name,
			status: "skipped",
			error: "未找到可用通道",
			http_status: null,
			latency_ms: null,
		});
		await pool.query(
			`UPDATE subscriptions
			    SET paused_reason = 'no_channel',
			        last_checked_at = NOW(),
			        updated_at = NOW()
			  WHERE id = $1`,
			[sub.id],
		);
		return;
	}

	// 生成 AI 摘要（失败自带 fallback）
	const summary = await getOrCreateSummary(
		sub.software_id,
		target,
		softwareMeta,
	);

	// 组装 payload
	const payload = buildPayload(softwareMeta, target, summary);

	// 推送
	const sendResult = await sendNotification(channel, payload);

	if (sendResult.ok) {
		await recordSuccess(
			sub.id,
			target.tag_name,
			channel.channel_type,
			sendResult,
		);
	} else {
		await recordFailure(
			sub.id,
			channel.channel_type,
			target.tag_name,
			sendResult,
		);
	}
}

// ========== 单条订阅立即检查（HTTP 接口调用）==========

export async function checkSubscriptionNow(subscriptionId) {
	const { rows } = await pool.query(
		`SELECT s.*, sw.name AS sw_name, sw.icon AS sw_icon,
		        sw.website AS sw_website, sw.category AS sw_category,
		        sw.description AS sw_description
		   FROM subscriptions s
		   JOIN softwares sw ON sw.id = s.software_id
		  WHERE s.id = $1`,
		[subscriptionId],
	);
	const sub = rows[0];
	if (!sub) return { triggered: false, message: "订阅不存在" };
	if (sub.paused_reason) {
		return {
			triggered: false,
			message: `订阅已暂停: ${sub.paused_reason}`,
		};
	}

	const softwareMeta = {
		name: sub.sw_name,
		category: sub.sw_category,
		description: sub.sw_description,
	};

	let ghResult;
	try {
		ghResult = await ensureGitHubReleasesCache(
			sub.software_id,
			sub.sw_website,
			{
				forceRefresh: true,
			},
		);
	} catch (err) {
		return {
			triggered: false,
			message: `GitHub 抓取失败: ${err.message}`,
		};
	}

	if (!ghResult.isGitHub) {
		return { triggered: false, message: "该软件未关联 GitHub 仓库" };
	}

	await deliverToSubscription(sub, softwareMeta, ghResult.releases);
	return { triggered: true, message: "已触发检查" };
}

// ========== 子流程工具函数 ==========

// 选择应推的 release：按发布时间倒序，过滤 prerelease（若未开启）
function selectTargetRelease(releases, sub) {
	if (!Array.isArray(releases) || releases.length === 0) return null;
	const sorted = [...releases].sort((a, b) => {
		const ta = a.published_at ? Date.parse(a.published_at) : 0;
		const tb = b.published_at ? Date.parse(b.published_at) : 0;
		return tb - ta;
	});
	for (const r of sorted) {
		if (!sub.include_prerelease && r.prerelease) continue;
		return r;
	}
	return null;
}

// 构造推送 payload（纯文本格式）
// MeoW 锁屏/横幅只会按纯文本渲染；靠 emoji + 换行做结构化，靠独立 url 字段承载链接
function buildPayload(softwareMeta, release, summary) {
	const isPre = Boolean(release.prerelease);
	const tag = String(release.tag_name || "").trim();
	const name = String(softwareMeta.name || "").trim();

	const titleIcon = isPre ? "🧪" : "📦";
	const title = `${titleIcon} ${name} ${tag}${isPre ? "（预发布）" : ""}`;

	const lines = [];

	if (summary?.breaking) {
		lines.push("⚠ 包含破坏性变更");
		lines.push("");
	}

	const summaryText = (summary?.summary || "").trim();
	if (summaryText) {
		lines.push(summaryText);
	}

	const hls = Array.isArray(summary?.highlights) ? summary.highlights : [];
	if (hls.length) {
		if (lines.length && lines[lines.length - 1] !== "") lines.push("");
		lines.push("亮点：");
		for (const h of hls) {
			const t = String(h.title || "").trim();
			const d = String(h.detail || "").trim();
			if (!t && !d) continue;
			lines.push(`• ${t}${t && d ? "：" : ""}${d}`);
		}
	}

	// 发布时间（若有，便于用户一眼判定时效）
	if (release.published_at) {
		const ts = formatReleaseTime(release.published_at);
		if (ts) {
			if (lines.length && lines[lines.length - 1] !== "") lines.push("");
			lines.push(`🕒 ${ts}`);
		}
	}

	// 没有任何正文时兜底一句，避免推送空 body
	const body = lines.length ? lines.join("\n") : `${name} ${tag} 已发布`;

	return {
		title,
		body,
		url: release.html_url || null,
	};
}

// 按东八区格式化 ISO 时间为「YYYY-MM-DD HH:mm」
function formatReleaseTime(iso) {
	try {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return "";
		const opts = {
			timeZone: "Asia/Shanghai",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		};
		const parts = new Intl.DateTimeFormat("zh-CN", opts).formatToParts(d);
		const get = (t) => parts.find((p) => p.type === t)?.value || "";
		return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
	} catch {
		return "";
	}
}

// 根据 channel_id 解析通道；若 NULL 则取用户主通道
async function resolveChannel(userId, channelId) {
	let row = null;
	if (channelId) {
		const res = await pool.query(
			`SELECT id, user_id, channel_type, config, label, is_primary, enabled
			   FROM user_channels
			  WHERE id = $1 AND user_id = $2`,
			[channelId, userId],
		);
		row = res.rows[0] || null;
	}
	if (!row) {
		// 尝试主通道
		const res = await pool.query(
			`SELECT id, user_id, channel_type, config, label, is_primary, enabled
			   FROM user_channels
			  WHERE user_id = $1 AND is_primary = TRUE
			  LIMIT 1`,
			[userId],
		);
		row = res.rows[0] || null;
	}
	if (!row) return null;
	if (!row.enabled) return null;
	return {
		id: row.id,
		channel_type: row.channel_type,
		config: decryptChannelConfig(row.config),
	};
}

// 记录成功：清零失败计数 + 更新版本时间戳 + 写日志
async function recordSuccess(subscriptionId, tagName, channelType, sendResult) {
	const interval = await getIntervalMinutes(subscriptionId);
	await pool.query(
		`UPDATE subscriptions
		    SET last_notified_version = $2,
		        last_notified_at = NOW(),
		        last_checked_at = NOW(),
		        next_check_at = NOW() + ($3 || ' minutes')::interval,
		        consecutive_failures = 0,
		        updated_at = NOW()
		  WHERE id = $1`,
		[subscriptionId, tagName, String(interval)],
	);
	await insertLog({
		subscription_id: subscriptionId,
		channel_type: channelType,
		tag_name: tagName,
		status: "success",
		error: null,
		http_status: sendResult.httpStatus,
		latency_ms: sendResult.latencyMs,
	});
}

// 记录失败：累加失败计数，>= 3 次自动暂停
async function recordFailure(subscriptionId, channelType, tagName, sendResult) {
	const { rows } = await pool.query(
		`SELECT consecutive_failures FROM subscriptions WHERE id = $1`,
		[subscriptionId],
	);
	const failures = (rows[0]?.consecutive_failures || 0) + 1;
	const interval = await getIntervalMinutes(subscriptionId);

	if (failures >= MAX_FAILURES_BEFORE_PAUSE) {
		await pool.query(
			`UPDATE subscriptions
			    SET consecutive_failures = $2,
			        paused_reason = 'channel_error',
			        last_checked_at = NOW(),
			        next_check_at = NOW() + ($3 || ' minutes')::interval,
			        updated_at = NOW()
			  WHERE id = $1`,
			[subscriptionId, failures, String(interval)],
		);
	} else {
		await pool.query(
			`UPDATE subscriptions
			    SET consecutive_failures = $2,
			        last_checked_at = NOW(),
			        next_check_at = NOW() + ($3 || ' minutes')::interval,
			        updated_at = NOW()
			  WHERE id = $1`,
			[subscriptionId, failures, String(interval)],
		);
	}

	await insertLog({
		subscription_id: subscriptionId,
		channel_type: channelType,
		tag_name: tagName,
		status: "failed",
		error: sendResult.error || "推送失败",
		http_status: sendResult.httpStatus,
		latency_ms: sendResult.latencyMs,
	});
}

// 只推迟下次检查时间（无新版本、非 GitHub 等非失败场景）
async function rescheduleOnly(subscriptionId, intervalMinutes) {
	await pool.query(
		`UPDATE subscriptions
		    SET last_checked_at = NOW(),
		        next_check_at = NOW() + ($2 || ' minutes')::interval,
		        updated_at = NOW()
		  WHERE id = $1`,
		[subscriptionId, String(intervalMinutes)],
	);
}

async function getIntervalMinutes(subscriptionId) {
	const { rows } = await pool.query(
		`SELECT check_interval_minutes FROM subscriptions WHERE id = $1`,
		[subscriptionId],
	);
	return rows[0]?.check_interval_minutes || 60;
}

async function insertLog(row) {
	try {
		await pool.query(
			`INSERT INTO notification_logs
			   (subscription_id, channel_type, tag_name, status, error, http_status, latency_ms)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			[
				row.subscription_id,
				row.channel_type,
				row.tag_name,
				row.status,
				row.error,
				row.http_status,
				row.latency_ms,
			],
		);
	} catch (err) {
		console.error("[SUB_SCHED] 写日志失败:", err.message);
	}
}

// 简单的并发控制工具（无外部依赖）
async function runWithConcurrency(items, limit, worker) {
	const queue = items.slice();
	const workers = [];
	const count = Math.min(limit, queue.length);
	for (let i = 0; i < count; i += 1) {
		workers.push(
			(async () => {
				while (queue.length > 0) {
					const item = queue.shift();
					try {
						await worker(item);
					} catch (err) {
						console.error("[SUB_SCHED] worker 异常:", err);
					}
				}
			})(),
		);
	}
	await Promise.all(workers);
}
