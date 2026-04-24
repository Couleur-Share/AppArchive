// 订阅推送的所有路由（通道管理、订阅管理、通知日志）
// 所有路由都需要登录；测试推送和立即检查独立更严限流
import express from "express";
import rateLimit from "express-rate-limit";
import { pool } from "./database.js";
import { ensureGitHubReleasesCache } from "./githubReleases.js";
import {
	CHANNEL_REGISTRY,
	decryptChannelConfig,
	encryptChannelConfig,
	listSupportedChannels,
	maskChannelConfig,
	testChannel as runTestChannel,
	validateChannelConfig,
} from "./notifier.js";
import { checkSubscriptionNow } from "./subscriptionScheduler.js";

const ALLOWED_INTERVALS = new Set([15, 60, 360, 720, 1440]);
const MAX_SUBSCRIPTIONS_PER_USER = 100;

export function createSubscriptionRoutes({
	requireAuth,
	rateLimitKey,
	writeRateLimiter,
}) {
	const router = express.Router();

	// 更严格的限流：测试推送 / 立即检查（5/min）
	const testPushLimiter = rateLimit({
		windowMs: 60 * 1000,
		max: 5,
		standardHeaders: true,
		legacyHeaders: false,
		keyGenerator: rateLimitKey,
	});

	// ========== 通道支持列表（引导用） ==========
	router.get("/channels/supported", requireAuth, (_req, res) => {
		res.json({ success: true, data: listSupportedChannels() });
	});

	// ========== 通道 CRUD ==========

	router.get("/channels", requireAuth, async (req, res) => {
		try {
			const { rows } = await pool.query(
				`SELECT id, channel_type, config, label, is_primary, enabled,
				        last_test_at, last_test_status, last_test_error,
				        created_at, updated_at
				   FROM user_channels
				  WHERE user_id = $1
				  ORDER BY is_primary DESC, created_at DESC`,
				[req.userId],
			);
			const data = rows.map((row) => serializeChannel(row));
			res.json({ success: true, data });
		} catch (err) {
			console.error("[SUB_ROUTES] 列出通道失败:", err);
			res.status(500).json({ error: "列出通道失败", message: err.message });
		}
	});

	router.post("/channels", requireAuth, writeRateLimiter, async (req, res) => {
		try {
			const { channel_type, config, label, is_primary } = req.body || {};
			if (!channel_type || !CHANNEL_REGISTRY[channel_type]) {
				return res.status(400).json({ error: "通道类型不受支持" });
			}
			const validation = validateChannelConfig(channel_type, config);
			if (!validation.ok) {
				return res
					.status(400)
					.json({ error: "配置无效", message: validation.error });
			}

			const encrypted = encryptChannelConfig(config);
			const client = await pool.connect();
			try {
				await client.query("BEGIN");

				// 如果设为主通道，先把现有主通道降级
				if (is_primary) {
					await client.query(
						"UPDATE user_channels SET is_primary = FALSE WHERE user_id = $1 AND is_primary = TRUE",
						[req.userId],
					);
				}

				// 若用户目前还没有任何通道，自动把本通道设为主通道
				const { rows: existRows } = await client.query(
					"SELECT COUNT(*)::int AS cnt FROM user_channels WHERE user_id = $1",
					[req.userId],
				);
				const autoPrimary = is_primary || existRows[0].cnt === 0;

				const insertRes = await client.query(
					`INSERT INTO user_channels
					   (user_id, channel_type, config, label, is_primary, enabled)
					 VALUES ($1, $2, $3, $4, $5, TRUE)
					 RETURNING *`,
					[
						req.userId,
						channel_type,
						encrypted,
						String(label || "").slice(0, 64),
						autoPrimary,
					],
				);
				await client.query("COMMIT");
				res.json({ success: true, data: serializeChannel(insertRes.rows[0]) });
			} catch (err) {
				await client.query("ROLLBACK");
				throw err;
			} finally {
				client.release();
			}
		} catch (err) {
			console.error("[SUB_ROUTES] 创建通道失败:", err);
			res.status(500).json({ error: "创建通道失败", message: err.message });
		}
	});

	router.put(
		"/channels/:id",
		requireAuth,
		writeRateLimiter,
		async (req, res) => {
			try {
				const id = Number(req.params.id);
				const existing = await getChannelOr404(id, req.userId, res);
				if (!existing) return;

				const patch = req.body || {};
				const nextConfig = patch.config ? patch.config : null;

				if (nextConfig) {
					const v = validateChannelConfig(existing.channel_type, nextConfig);
					if (!v.ok) {
						return res
							.status(400)
							.json({ error: "配置无效", message: v.error });
					}
				}

				const fields = [];
				const params = [];
				let idx = 1;
				if (typeof patch.label === "string") {
					fields.push(`label = $${idx++}`);
					params.push(patch.label.slice(0, 64));
				}
				if (typeof patch.enabled === "boolean") {
					fields.push(`enabled = $${idx++}`);
					params.push(patch.enabled);
				}
				if (nextConfig) {
					fields.push(`config = $${idx++}`);
					params.push(encryptChannelConfig(nextConfig));
				}
				fields.push(`updated_at = NOW()`);

				if (fields.length === 1) {
					return res.json({ success: true, data: serializeChannel(existing) });
				}

				params.push(id, req.userId);
				const sql = `UPDATE user_channels SET ${fields.join(", ")}
				              WHERE id = $${idx++} AND user_id = $${idx++}
				          RETURNING *`;
				const { rows } = await pool.query(sql, params);
				res.json({ success: true, data: serializeChannel(rows[0]) });
			} catch (err) {
				console.error("[SUB_ROUTES] 更新通道失败:", err);
				res.status(500).json({ error: "更新通道失败", message: err.message });
			}
		},
	);

	router.delete(
		"/channels/:id",
		requireAuth,
		writeRateLimiter,
		async (req, res) => {
			try {
				const id = Number(req.params.id);
				const existing = await getChannelOr404(id, req.userId, res);
				if (!existing) return;

				// 引用订阅 channel_id 会自动 SET NULL（外键约束），这里不需要额外处理
				await pool.query(
					"DELETE FROM user_channels WHERE id = $1 AND user_id = $2",
					[id, req.userId],
				);
				res.json({ success: true });
			} catch (err) {
				console.error("[SUB_ROUTES] 删除通道失败:", err);
				res.status(500).json({ error: "删除通道失败", message: err.message });
			}
		},
	);

	router.post(
		"/channels/:id/primary",
		requireAuth,
		writeRateLimiter,
		async (req, res) => {
			try {
				const id = Number(req.params.id);
				const existing = await getChannelOr404(id, req.userId, res);
				if (!existing) return;

				const client = await pool.connect();
				try {
					await client.query("BEGIN");
					await client.query(
						"UPDATE user_channels SET is_primary = FALSE WHERE user_id = $1 AND is_primary = TRUE",
						[req.userId],
					);
					const { rows } = await client.query(
						`UPDATE user_channels SET is_primary = TRUE, updated_at = NOW()
						  WHERE id = $1 AND user_id = $2 RETURNING *`,
						[id, req.userId],
					);
					await client.query("COMMIT");
					res.json({ success: true, data: serializeChannel(rows[0]) });
				} catch (err) {
					await client.query("ROLLBACK");
					throw err;
				} finally {
					client.release();
				}
			} catch (err) {
				console.error("[SUB_ROUTES] 设主通道失败:", err);
				res.status(500).json({ error: "设主通道失败", message: err.message });
			}
		},
	);

	router.post(
		"/channels/:id/test",
		requireAuth,
		testPushLimiter,
		async (req, res) => {
			try {
				const id = Number(req.params.id);
				const existing = await getChannelOr404(id, req.userId, res);
				if (!existing) return;

				const config = decryptChannelConfig(existing.config);
				const result = await runTestChannel({
					channel_type: existing.channel_type,
					config,
				});

				await pool.query(
					`UPDATE user_channels
					    SET last_test_at = NOW(),
					        last_test_status = $2,
					        last_test_error = $3,
					        updated_at = NOW()
					  WHERE id = $1`,
					[
						id,
						result.ok ? "success" : "failed",
						result.ok ? null : result.error || "失败",
					],
				);

				if (result.ok) {
					res.json({ success: true, message: "测试推送成功" });
				} else {
					res.status(502).json({
						success: false,
						error: "测试推送失败",
						message: result.error || "未知错误",
					});
				}
			} catch (err) {
				console.error("[SUB_ROUTES] 测试推送失败:", err);
				res.status(500).json({ error: "测试推送失败", message: err.message });
			}
		},
	);

	// ========== 订阅 CRUD ==========

	router.get("/subscriptions", requireAuth, async (req, res) => {
		try {
			const { rows } = await pool.query(
				`SELECT s.*,
				        sw.name AS sw_name, sw.icon AS sw_icon, sw.website AS sw_website,
				        c.id AS ch_id, c.channel_type AS ch_type, c.label AS ch_label,
				        c.config AS ch_config, c.is_primary AS ch_is_primary
				   FROM subscriptions s
				   JOIN softwares sw ON sw.id = s.software_id
				   LEFT JOIN user_channels c
				         ON c.id = s.channel_id
				  WHERE s.user_id = $1
				  ORDER BY s.created_at DESC`,
				[req.userId],
			);

			// 对于 channel_id 为 NULL 的订阅，也尝试查出主通道用于展示
			const { rows: primaryRows } = await pool.query(
				`SELECT id, channel_type, label, config
				   FROM user_channels
				  WHERE user_id = $1 AND is_primary = TRUE
				  LIMIT 1`,
				[req.userId],
			);
			const primary = primaryRows[0] || null;

			const data = rows.map((row) => serializeSubscription(row, primary));
			res.json({ success: true, data });
		} catch (err) {
			console.error("[SUB_ROUTES] 列出订阅失败:", err);
			res.status(500).json({ error: "列出订阅失败", message: err.message });
		}
	});

	router.post(
		"/subscriptions",
		requireAuth,
		writeRateLimiter,
		async (req, res) => {
			try {
				const {
					software_id,
					channel_id,
					check_interval_minutes,
					include_prerelease,
				} = req.body || {};

				if (!Number.isInteger(software_id)) {
					return res.status(400).json({ error: "software_id 非法" });
				}
				const interval = Number(check_interval_minutes);
				if (!ALLOWED_INTERVALS.has(interval)) {
					return res.status(400).json({
						error: "检查频率非法",
						message: "必须是 15/60/360/720/1440 中之一",
					});
				}

				// 检查订阅上限
				const { rows: cntRows } = await pool.query(
					`SELECT COUNT(*)::int AS cnt FROM subscriptions WHERE user_id = $1`,
					[req.userId],
				);
				if (cntRows[0].cnt >= MAX_SUBSCRIPTIONS_PER_USER) {
					return res.status(400).json({
						error: "订阅数量已达上限",
						message: `最多订阅 ${MAX_SUBSCRIPTIONS_PER_USER} 条`,
					});
				}

				// 检查软件存在 + 是 GitHub
				const { rows: swRows } = await pool.query(
					"SELECT id, website FROM softwares WHERE id = $1",
					[software_id],
				);
				if (swRows.length === 0) {
					return res.status(404).json({ error: "软件不存在" });
				}
				const { website } = swRows[0];

				// 预热 GitHub 缓存，顺便拿 latest_version 作为 last_notified_version
				let initVersion = null;
				try {
					const gh = await ensureGitHubReleasesCache(software_id, website);
					if (!gh.isGitHub) {
						return res.status(400).json({
							error: "该软件不是 GitHub 仓库",
							message: "订阅功能仅支持 GitHub 开源项目",
						});
					}
					initVersion = gh.latestVersion || null;
				} catch (err) {
					// GitHub API 失败不阻断订阅创建，仅 init 为 null（首次 tick 再补）
					console.warn("[SUB_ROUTES] 创建订阅时预热 GitHub 失败:", err.message);
				}

				// 校验 channel_id 归属
				if (channel_id != null) {
					const { rows } = await pool.query(
						"SELECT id FROM user_channels WHERE id = $1 AND user_id = $2",
						[channel_id, req.userId],
					);
					if (rows.length === 0) {
						return res.status(400).json({ error: "通道不属于当前用户" });
					}
				}

				const insertRes = await pool.query(
					`INSERT INTO subscriptions
					   (user_id, software_id, channel_id, check_interval_minutes,
					    include_prerelease, last_notified_version, next_check_at)
					 VALUES ($1, $2, $3, $4, $5, $6,
					         NOW() + (($4::int)::text || ' minutes')::interval)
					 RETURNING *`,
					[
						req.userId,
						software_id,
						channel_id || null,
						interval,
						Boolean(include_prerelease),
						initVersion,
					],
				);
				const row = insertRes.rows[0];

				const detail = await getSubscriptionDetail(row.id, req.userId);
				res.json({ success: true, data: detail });
			} catch (err) {
				// 唯一约束冲突
				if (err.code === "23505") {
					return res.status(400).json({ error: "已订阅该软件" });
				}
				console.error("[SUB_ROUTES] 创建订阅失败:", err);
				res.status(500).json({ error: "创建订阅失败", message: err.message });
			}
		},
	);

	router.get("/subscriptions/:id", requireAuth, async (req, res) => {
		try {
			const id = Number(req.params.id);
			const data = await getSubscriptionDetail(id, req.userId);
			if (!data) return res.status(404).json({ error: "订阅不存在" });
			res.json({ success: true, data });
		} catch (err) {
			console.error("[SUB_ROUTES] 获取订阅失败:", err);
			res.status(500).json({ error: "获取订阅失败", message: err.message });
		}
	});

	router.put(
		"/subscriptions/:id",
		requireAuth,
		writeRateLimiter,
		async (req, res) => {
			try {
				const id = Number(req.params.id);
				const { rows: existingRows } = await pool.query(
					"SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2",
					[id, req.userId],
				);
				if (existingRows.length === 0) {
					return res.status(404).json({ error: "订阅不存在" });
				}

				const patch = req.body || {};
				if (patch.pause === true && patch.resume === true) {
					return res.status(400).json({
						error: "暂停状态非法",
						message: "不能同时暂停和恢复订阅",
					});
				}

				const fields = [];
				const params = [];
				let idx = 1;

				if (patch.check_interval_minutes !== undefined) {
					const v = Number(patch.check_interval_minutes);
					if (!ALLOWED_INTERVALS.has(v)) {
						return res.status(400).json({ error: "检查频率非法" });
					}
					fields.push(`check_interval_minutes = $${idx++}`);
					params.push(v);
					// 同步刷新 next_check_at
					fields.push(
						`next_check_at = NOW() + ($${idx++} || ' minutes')::interval`,
					);
					params.push(String(v));
				}
				if (patch.channel_id !== undefined) {
					if (patch.channel_id !== null) {
						const { rows } = await pool.query(
							"SELECT id FROM user_channels WHERE id = $1 AND user_id = $2",
							[patch.channel_id, req.userId],
						);
						if (rows.length === 0) {
							return res.status(400).json({ error: "通道不属于当前用户" });
						}
					}
					fields.push(`channel_id = $${idx++}`);
					params.push(patch.channel_id);
				}
				if (patch.include_prerelease !== undefined) {
					fields.push(`include_prerelease = $${idx++}`);
					params.push(Boolean(patch.include_prerelease));
				}
				if (patch.pause === true) {
					// 用户主动暂停：调度器会跳过该订阅，保留配置与历史。
					fields.push(`paused_reason = 'user_paused'`);
					fields.push(`consecutive_failures = 0`);
				}
				if (patch.resume === true) {
					// 用户主动恢复暂停的订阅
					fields.push(`paused_reason = NULL`);
					fields.push(`consecutive_failures = 0`);
					if (patch.check_interval_minutes === undefined) {
						fields.push(
							`next_check_at = NOW() + ($${idx++} || ' minutes')::interval`,
						);
						params.push(String(existingRows[0].check_interval_minutes || 60));
					}
				}

				fields.push(`updated_at = NOW()`);
				if (fields.length === 1) {
					const detail = await getSubscriptionDetail(id, req.userId);
					return res.json({ success: true, data: detail });
				}

				params.push(id, req.userId);
				const sql = `UPDATE subscriptions SET ${fields.join(", ")}
				              WHERE id = $${idx++} AND user_id = $${idx++}`;
				await pool.query(sql, params);
				const detail = await getSubscriptionDetail(id, req.userId);
				res.json({ success: true, data: detail });
			} catch (err) {
				console.error("[SUB_ROUTES] 更新订阅失败:", err);
				res.status(500).json({ error: "更新订阅失败", message: err.message });
			}
		},
	);

	router.delete(
		"/subscriptions/:id",
		requireAuth,
		writeRateLimiter,
		async (req, res) => {
			try {
				const id = Number(req.params.id);
				const { rowCount } = await pool.query(
					"DELETE FROM subscriptions WHERE id = $1 AND user_id = $2",
					[id, req.userId],
				);
				if (rowCount === 0) {
					return res.status(404).json({ error: "订阅不存在" });
				}
				res.json({ success: true });
			} catch (err) {
				console.error("[SUB_ROUTES] 删除订阅失败:", err);
				res.status(500).json({ error: "删除订阅失败", message: err.message });
			}
		},
	);

	router.post(
		"/subscriptions/:id/check-now",
		requireAuth,
		testPushLimiter,
		async (req, res) => {
			try {
				const id = Number(req.params.id);
				const { rows } = await pool.query(
					"SELECT id FROM subscriptions WHERE id = $1 AND user_id = $2",
					[id, req.userId],
				);
				if (rows.length === 0) {
					return res.status(404).json({ error: "订阅不存在" });
				}
				const result = await checkSubscriptionNow(id);
				res.json({ success: true, data: result });
			} catch (err) {
				console.error("[SUB_ROUTES] 立即检查失败:", err);
				res.status(500).json({ error: "立即检查失败", message: err.message });
			}
		},
	);

	router.get("/subscriptions/:id/logs", requireAuth, async (req, res) => {
		try {
			const id = Number(req.params.id);
			const { rows: ownRows } = await pool.query(
				"SELECT id FROM subscriptions WHERE id = $1 AND user_id = $2",
				[id, req.userId],
			);
			if (ownRows.length === 0) {
				return res.status(404).json({ error: "订阅不存在" });
			}
			const limit = Math.min(Number(req.query.limit || 50), 200);
			const { rows } = await pool.query(
				`SELECT id, channel_type, tag_name, status, error,
				        http_status, latency_ms, sent_at
				   FROM notification_logs
				  WHERE subscription_id = $1
				  ORDER BY sent_at DESC
				  LIMIT $2`,
				[id, limit],
			);
			res.json({ success: true, data: rows });
		} catch (err) {
			console.error("[SUB_ROUTES] 获取日志失败:", err);
			res.status(500).json({ error: "获取日志失败", message: err.message });
		}
	});

	// 详情页专用：查当前用户对指定软件的订阅状态
	router.get(
		"/software/:id/subscription-state",
		requireAuth,
		async (req, res) => {
			try {
				const swId = Number(req.params.id);
				const { rows } = await pool.query(
					`SELECT id FROM subscriptions WHERE software_id = $1 AND user_id = $2`,
					[swId, req.userId],
				);
				if (rows.length === 0) {
					return res.json({ success: true, data: null });
				}
				const detail = await getSubscriptionDetail(rows[0].id, req.userId);
				res.json({ success: true, data: detail });
			} catch (err) {
				console.error("[SUB_ROUTES] 查询订阅状态失败:", err);
				res
					.status(500)
					.json({ error: "查询订阅状态失败", message: err.message });
			}
		},
	);

	return router;
}

// ========== 私有工具函数 ==========

async function getChannelOr404(id, userId, res) {
	const { rows } = await pool.query(
		"SELECT * FROM user_channels WHERE id = $1 AND user_id = $2",
		[id, userId],
	);
	if (rows.length === 0) {
		res.status(404).json({ error: "通道不存在" });
		return null;
	}
	return rows[0];
}

function serializeChannel(row) {
	const config = decryptChannelConfig(row.config);
	return {
		id: row.id,
		channel_type: row.channel_type,
		label: row.label || "",
		is_primary: Boolean(row.is_primary),
		enabled: Boolean(row.enabled),
		config_masked: maskChannelConfig(row.channel_type, config),
		last_test_at: row.last_test_at,
		last_test_status: row.last_test_status,
		last_test_error: row.last_test_error,
		created_at: row.created_at,
		updated_at: row.updated_at,
	};
}

function serializeSubscription(row, primaryChannel) {
	let channelSnapshot = null;
	if (row.ch_id) {
		channelSnapshot = {
			id: row.ch_id,
			type: row.ch_type,
			label: row.ch_label || "",
			is_primary: Boolean(row.ch_is_primary),
		};
	} else if (primaryChannel) {
		channelSnapshot = {
			id: primaryChannel.id,
			type: primaryChannel.channel_type,
			label: primaryChannel.label || "",
			is_primary: true,
			is_default: true,
		};
	}

	return {
		id: row.id,
		software_id: row.software_id,
		software_snapshot: {
			name: row.sw_name,
			icon: row.sw_icon,
			website: row.sw_website,
		},
		channel_id: row.channel_id,
		channel_snapshot: channelSnapshot,
		check_interval_minutes: row.check_interval_minutes,
		include_prerelease: row.include_prerelease,
		last_notified_version: row.last_notified_version,
		last_notified_at: row.last_notified_at,
		last_checked_at: row.last_checked_at,
		next_check_at: row.next_check_at,
		consecutive_failures: row.consecutive_failures,
		paused_reason: row.paused_reason,
		created_at: row.created_at,
		updated_at: row.updated_at,
	};
}

async function getSubscriptionDetail(subscriptionId, userId) {
	const { rows } = await pool.query(
		`SELECT s.*,
		        sw.name AS sw_name, sw.icon AS sw_icon, sw.website AS sw_website,
		        c.id AS ch_id, c.channel_type AS ch_type, c.label AS ch_label,
		        c.is_primary AS ch_is_primary
		   FROM subscriptions s
		   JOIN softwares sw ON sw.id = s.software_id
		   LEFT JOIN user_channels c ON c.id = s.channel_id
		  WHERE s.id = $1 AND s.user_id = $2`,
		[subscriptionId, userId],
	);
	if (rows.length === 0) return null;

	const { rows: primaryRows } = await pool.query(
		`SELECT id, channel_type, label FROM user_channels
		  WHERE user_id = $1 AND is_primary = TRUE LIMIT 1`,
		[userId],
	);
	const primary = primaryRows[0] || null;
	return serializeSubscription(rows[0], primary);
}
