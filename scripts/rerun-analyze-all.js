/**
 * 批量重跑 AI 分析脚本
 *
 * 用途：结构化字段迁移后，为存量软件生成 tagline / highlights / best_for / avoid_if。
 * 设计：
 *  - 串行调用，每次间隔 sleep 2000ms，避免打爆 AI 供应商限速。
 *  - 仅回写 4 个新字段 + analysis_* 元数据，不覆盖用户手动编辑的 description / pros / cons。
 *  - 断点续跑：进度写入 logs/rerun-progress.json；错误写入 logs/rerun-errors.log。
 *  - 需要 AUTH_TOKEN 环境变量（JWT），否则拒绝运行。
 *
 * 用法：
 *   AUTH_TOKEN=<jwt> pnpm rerun:analyze
 *   AUTH_TOKEN=<jwt> API_BASE=http://localhost:3001 pnpm rerun:analyze
 *   AUTH_TOKEN=<jwt> SLEEP_MS=3000 pnpm rerun:analyze
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../server/database.js";
import { buildRerunPatch } from "../server/rerunPatch.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LOG_DIR = path.join(ROOT, "logs");
const PROGRESS_FILE = path.join(LOG_DIR, "rerun-progress.json");
const ERROR_LOG = path.join(LOG_DIR, "rerun-errors.log");

const AUTH_TOKEN = (process.env.AUTH_TOKEN || "").trim();
const API_BASE = (process.env.API_BASE || "http://localhost:3001").replace(
	/\/$/,
	"",
);
const SLEEP_MS = Math.max(
	500,
	Number.parseInt(process.env.SLEEP_MS || "2000", 10),
);

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureLogDir() {
	if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function loadProgress() {
	if (!fs.existsSync(PROGRESS_FILE)) return { processed: [], startedAt: null };
	try {
		const raw = fs.readFileSync(PROGRESS_FILE, "utf8");
		const parsed = JSON.parse(raw);
		return {
			processed: Array.isArray(parsed.processed) ? parsed.processed : [],
			startedAt: parsed.startedAt || null,
		};
	} catch (err) {
		console.warn("⚠️ 进度文件损坏，将重头开始:", err.message);
		return { processed: [], startedAt: null };
	}
}

function saveProgress(state) {
	fs.writeFileSync(PROGRESS_FILE, JSON.stringify(state, null, 2), "utf8");
}

function appendError(entry) {
	const line = `[${new Date().toISOString()}] ${JSON.stringify(entry)}\n`;
	fs.appendFileSync(ERROR_LOG, line, "utf8");
}

async function fetchAllIds() {
	const { rows } = await pool.query(
		"SELECT id, name FROM softwares ORDER BY id ASC",
	);
	return rows;
}

async function fetchSoftwareDetail(id) {
	const url = `${API_BASE}/api/software/${id}`;
	const res = await fetch(url, {
		headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`GET software failed: ${res.status} ${text}`);
	}
	const payload = await res.json();
	return payload?.data || payload;
}

async function callAnalyze(software) {
	const url = `${API_BASE}/api/ai/analyze`;
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${AUTH_TOKEN}`,
		},
		body: JSON.stringify({ software }),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`POST analyze failed: ${res.status} ${text}`);
	}
	const data = await res.json();
	const raw = data?.choices?.[0]?.message?.content;
	if (typeof raw !== "string") {
		throw new Error("AI 返回内容为空或非字符串");
	}
	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch (_err) {
		// 部分模型会包一层代码块，剥掉再试一次
		const stripped = raw
			.replace(/^```[a-zA-Z]*\n?/, "")
			.replace(/```$/, "")
			.trim();
		try {
			parsed = JSON.parse(stripped);
		} catch (innerErr) {
			throw new Error(`AI 返回解析失败: ${innerErr.message}`);
		}
	}
	return { parsed, meta: data?.analysis_meta || null };
}

async function patchSoftware(id, patch) {
	const url = `${API_BASE}/api/software/${id}`;
	const res = await fetch(url, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${AUTH_TOKEN}`,
		},
		body: JSON.stringify(patch),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`PUT software failed: ${res.status} ${text}`);
	}
	return await res.json();
}

// 补丁构造逻辑已抽到 server/rerunPatch.js，CLI 与 Web Job 共用

async function main() {
	if (!AUTH_TOKEN) {
		console.error("❌ 缺少 AUTH_TOKEN 环境变量（需要一个有效的 JWT）");
		process.exit(1);
	}

	ensureLogDir();
	const progress = loadProgress();
	if (!progress.startedAt) progress.startedAt = new Date().toISOString();
	const processedSet = new Set(progress.processed);

	const rows = await fetchAllIds();
	console.log(`发现 ${rows.length} 条软件记录，已处理 ${processedSet.size} 条`);

	let okCount = 0;
	let errCount = 0;

	for (const row of rows) {
		if (processedSet.has(row.id)) {
			console.log(`⏭  [${row.id}] ${row.name}：已处理，跳过`);
			continue;
		}

		console.log(`▶  [${row.id}] ${row.name}：开始分析`);
		try {
			const software = await fetchSoftwareDetail(row.id);
			if (!software || !software.name) {
				throw new Error("软件详情为空或缺 name");
			}
			const { parsed, meta } = await callAnalyze(software);
			const patch = buildRerunPatch(parsed, meta);
			await patchSoftware(row.id, patch);
			okCount++;
			processedSet.add(row.id);
			progress.processed = [...processedSet];
			saveProgress(progress);
			console.log(
				`✅ [${row.id}] 完成：tagline=${Boolean(patch.tagline)} highlights=${(patch.highlights || []).length} best_for=${(patch.best_for || []).length} avoid_if=${(patch.avoid_if || []).length}`,
			);
		} catch (err) {
			errCount++;
			const message = err?.message || String(err);
			console.error(`❌ [${row.id}] 失败: ${message}`);
			appendError({ id: row.id, name: row.name, error: message });
		}

		await sleep(SLEEP_MS);
	}

	console.log("");
	console.log("======================================");
	console.log(`任务结束：成功 ${okCount} 条 / 失败 ${errCount} 条`);
	console.log(`进度文件：${PROGRESS_FILE}`);
	if (errCount > 0) console.log(`错误日志：${ERROR_LOG}`);
	console.log("======================================");
}

main()
	.catch((err) => {
		console.error("未捕获异常:", err);
		process.exit(1);
	})
	.finally(async () => {
		try {
			await pool.end();
		} catch (_err) {
			// 忽略关闭错误
		}
	});
