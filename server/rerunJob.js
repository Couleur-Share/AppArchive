/**
 * 批量重跑 AI 分析的单例 Job 管理器（后端常驻态）
 *
 * 设计：
 *  - 同一进程内同一时刻只允许一个 Job 运行；第二次 startJob 抛 JobBusyError
 *  - 进度同时维护在内存与磁盘 logs/rerun-progress.json，供 Node 重启 / CLI 续跑使用
 *  - 取消是协作式的：循环顶部检查 cancelRequested，下一条不再开跑
 *  - ETA：avgMs = elapsed / processedCount；processedCount < 3 时返回 0（前端展示"计算中"）
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSoftwareAnalyze } from "./analyzeCore.js";
import { pool } from "./database.js";
import { buildRerunPatch } from "./rerunPatch.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LOG_DIR = path.join(ROOT, "logs");
const PROGRESS_FILE = path.join(LOG_DIR, "rerun-progress.json");
const ERROR_LOG = path.join(LOG_DIR, "rerun-errors.log");

const SLEEP_MS = Math.max(
	500,
	Number.parseInt(process.env.RERUN_SLEEP_MS || "20000", 10),
);

const ETA_WARMUP_COUNT = 3; // 前 N 条不计算 ETA，避免大幅抖动

export class JobBusyError extends Error {
	constructor(status) {
		super("已有批量重跑任务正在运行");
		this.code = "JOB_BUSY";
		this.status = status;
	}
}

// ========== 内存状态 ==========
const state = {
	jobId: null,
	mode: null, // 'all' | 'missing_structured' | 'selected'
	status: "idle", // 'idle' | 'running' | 'completed' | 'cancelled' | 'failed'
	total: 0,
	processed: 0,
	failed: 0,
	currentId: null,
	currentName: "",
	startedAt: null, // 本轮 Job 起始 ISO 时间
	finishedAt: null,
	avgMs: 0,
	etaMs: 0,
	errors: [], // [{ id, name, error }]
	processedIds: [], // 全局累计处理过的 id（跨 Job、跨重启）
	skippedCount: 0, // 本轮跳过的已处理条数
	cancelRequested: false,
	startedByUserId: null,
	lastError: "", // 致命错误（启动期失败）
};

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureLogDir() {
	if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function persistProgress() {
	try {
		ensureLogDir();
		fs.writeFileSync(
			PROGRESS_FILE,
			JSON.stringify(
				{
					processed: state.processedIds,
					startedAt: state.startedAt,
					updatedAt: new Date().toISOString(),
				},
				null,
				2,
			),
			"utf8",
		);
	} catch (err) {
		console.error("[RERUN_JOB] 持久化进度失败:", err?.message);
	}
}

function appendErrorLog(entry) {
	try {
		ensureLogDir();
		const line = `[${new Date().toISOString()}] ${JSON.stringify(entry)}\n`;
		fs.appendFileSync(ERROR_LOG, line, "utf8");
	} catch (err) {
		console.error("[RERUN_JOB] 写入错误日志失败:", err?.message);
	}
}

/**
 * 服务启动时调用：从磁盘恢复 processedIds，但不自动续跑
 * 前端通过 status 看到 processedIds.length > 0 && status === 'idle' 即可判断"上次中断"
 */
export function restoreFromDisk() {
	try {
		if (!fs.existsSync(PROGRESS_FILE)) return;
		const raw = fs.readFileSync(PROGRESS_FILE, "utf8");
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed.processed)) {
			state.processedIds = parsed.processed.filter(
				(v) => Number.isInteger(v) && v > 0,
			);
		}
		console.log(
			`[RERUN_JOB] 已从磁盘恢复进度，累计已处理 ${state.processedIds.length} 条`,
		);
	} catch (err) {
		console.warn("[RERUN_JOB] 进度文件损坏，忽略:", err?.message);
	}
}

/**
 * 计算并返回当前 ETA（毫秒）
 */
function computeEtaMs() {
	if (state.status !== "running") return 0;
	if (state.processed < ETA_WARMUP_COUNT) return 0;
	const remaining = Math.max(0, state.total - state.processed - state.failed);
	if (remaining === 0) return 0;
	return Math.round(remaining * state.avgMs);
}

/**
 * 公开的状态快照（供 GET /status 直接序列化返回）
 */
export function getStatus() {
	return {
		jobId: state.jobId,
		mode: state.mode,
		status: state.status,
		total: state.total,
		processed: state.processed,
		failed: state.failed,
		skippedCount: state.skippedCount,
		currentId: state.currentId,
		currentName: state.currentName,
		startedAt: state.startedAt,
		finishedAt: state.finishedAt,
		avgMs: state.avgMs,
		etaMs: computeEtaMs(),
		errors: state.errors.slice(-50), // 最多回包最近 50 条错误，避免过大
		processedIds: state.processedIds,
		startedByUserId: state.startedByUserId,
		sleepMs: SLEEP_MS,
		lastError: state.lastError,
	};
}

export function isRunning() {
	return state.status === "running";
}

/**
 * 请求取消当前任务（协作式）。立即返回，不等待循环退出。
 */
export function requestCancel() {
	if (state.status !== "running") return false;
	state.cancelRequested = true;
	return true;
}

/**
 * 重置历史进度：清空 processedIds 与磁盘文件，仅在 idle 时允许
 */
export function resetProgress() {
	if (state.status === "running") {
		throw new JobBusyError(getStatus());
	}
	state.processedIds = [];
	state.errors = [];
	state.processed = 0;
	state.failed = 0;
	state.skippedCount = 0;
	state.total = 0;
	state.currentId = null;
	state.currentName = "";
	state.startedAt = null;
	state.finishedAt = null;
	state.avgMs = 0;
	state.etaMs = 0;
	state.mode = null;
	state.jobId = null;
	state.lastError = "";
	try {
		if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
	} catch (err) {
		console.warn("[RERUN_JOB] 删除进度文件失败:", err?.message);
	}
}

/**
 * 根据 mode 与 ids 计算待处理目标软件列表
 * @returns {Promise<Array<{id:number,name:string}>>}
 */
async function resolveTargets(mode, ids) {
	if (mode === "selected") {
		const filtered = (Array.isArray(ids) ? ids : [])
			.map((v) => Number.parseInt(v, 10))
			.filter((v) => Number.isInteger(v) && v > 0);
		if (filtered.length === 0) return [];
		const { rows } = await pool.query(
			"SELECT id, name FROM softwares WHERE id = ANY($1::int[]) ORDER BY id ASC",
			[filtered],
		);
		return rows;
	}

	if (mode === "missing_structured") {
		const { rows } = await pool.query(`
			SELECT id, name FROM softwares
			WHERE tagline IS NULL
			   OR tagline = ''
			   OR highlights IS NULL
			   OR jsonb_array_length(highlights) = 0
			   OR best_for IS NULL
			   OR jsonb_array_length(best_for) = 0
			   OR avoid_if IS NULL
			   OR jsonb_array_length(avoid_if) = 0
			ORDER BY id ASC
		`);
		return rows;
	}

	// 默认：all
	const { rows } = await pool.query(
		"SELECT id, name FROM softwares ORDER BY id ASC",
	);
	return rows;
}

/**
 * 直接读取一条软件详情（避免走 HTTP 自调用）
 */
async function fetchSoftwareDetail(id) {
	const { rows } = await pool.query("SELECT * FROM softwares WHERE id = $1", [
		id,
	]);
	if (rows.length === 0) throw new Error("软件不存在");
	return rows[0];
}

/**
 * 直接更新软件的结构化字段 + analysis 元数据
 * 仅触达白名单字段，绝不影响其他列；与 PUT /api/software/:id 行为等价但只覆盖这些字段
 */
async function applyRerunPatch(id, patch) {
	if (!patch || typeof patch !== "object") return;
	const sets = [];
	const values = [];
	let idx = 1;

	const pushScalar = (col, val) => {
		sets.push(`${col} = $${idx}`);
		values.push(val);
		idx += 1;
	};

	const pushJsonb = (col, val) => {
		sets.push(`${col} = $${idx}::jsonb`);
		values.push(JSON.stringify(Array.isArray(val) ? val : []));
		idx += 1;
	};

	const pushTextArray = (col, val) => {
		sets.push(`${col} = $${idx}`);
		values.push(
			Array.isArray(val) ? val.filter((s) => typeof s === "string") : [],
		);
		idx += 1;
	};

	if (Object.hasOwn(patch, "tagline")) {
		pushScalar(
			"tagline",
			typeof patch.tagline === "string" ? patch.tagline.trim() : "",
		);
	}
	if (Object.hasOwn(patch, "highlights")) {
		pushJsonb(
			"highlights",
			Array.isArray(patch.highlights)
				? patch.highlights.filter((h) => h && typeof h === "object")
				: [],
		);
	}
	if (Object.hasOwn(patch, "best_for")) {
		pushJsonb(
			"best_for",
			Array.isArray(patch.best_for)
				? patch.best_for.filter((h) => h && typeof h === "object")
				: [],
		);
	}
	if (Object.hasOwn(patch, "avoid_if")) {
		pushJsonb(
			"avoid_if",
			Array.isArray(patch.avoid_if)
				? patch.avoid_if.filter((h) => h && typeof h === "object")
				: [],
		);
	}
	if (Object.hasOwn(patch, "warnings")) {
		pushTextArray("warnings", patch.warnings);
	}
	if (Object.hasOwn(patch, "analysis_provider"))
		pushScalar(
			"analysis_provider",
			typeof patch.analysis_provider === "string"
				? patch.analysis_provider
				: "",
		);
	if (Object.hasOwn(patch, "analysis_model"))
		pushScalar(
			"analysis_model",
			typeof patch.analysis_model === "string" ? patch.analysis_model : "",
		);
	if (Object.hasOwn(patch, "analysis_at"))
		pushScalar(
			"analysis_at",
			typeof patch.analysis_at === "string" ? patch.analysis_at : null,
		);
	if (Object.hasOwn(patch, "analysis_sources"))
		pushTextArray("analysis_sources", patch.analysis_sources);

	if (sets.length === 0) return;

	values.push(id);
	const sql = `UPDATE softwares SET ${sets.join(", ")} WHERE id = $${idx}`;
	await pool.query(sql, values);
}

/**
 * 启动批量重跑任务
 * @param {object} opts
 * @param {'all'|'missing_structured'|'selected'} opts.mode
 * @param {number[]} [opts.ids] selected 模式下的软件 id 数组
 * @param {number|string} [opts.userId] 触发本次任务的用户 id（用于审计）
 * @returns {Promise<object>} 立即返回当前 status 快照（status: 'running'）
 */
export async function startJob({ mode = "all", ids = [], userId = null } = {}) {
	if (state.status === "running") {
		throw new JobBusyError(getStatus());
	}

	const targets = await resolveTargets(mode, ids);
	const processedSet = new Set(state.processedIds);
	// 待跑队列 = 目标 - 已处理
	const queue = targets.filter((row) => !processedSet.has(row.id));

	// 重置本轮 Job 字段（保留 processedIds 累计值，用于 ETA / 显示）
	state.jobId = crypto.randomUUID();
	state.mode = mode;
	state.status = "running";
	state.total = targets.length;
	state.processed = 0;
	state.failed = 0;
	state.skippedCount = targets.length - queue.length;
	state.currentId = null;
	state.currentName = "";
	state.startedAt = new Date().toISOString();
	state.finishedAt = null;
	state.avgMs = 0;
	state.etaMs = 0;
	state.errors = [];
	state.cancelRequested = false;
	state.startedByUserId = userId;
	state.lastError = "";

	// 后台跑循环（不 await）；只持有 status 快照立即返回
	void runQueue(queue).catch((err) => {
		state.status = "failed";
		state.finishedAt = new Date().toISOString();
		state.lastError = err?.message || String(err);
		console.error("[RERUN_JOB] 任务异常退出:", err);
	});

	return getStatus();
}

/**
 * 串行处理队列；每条做：fetch detail → analyze → patch → 持久化进度
 */
async function runQueue(queue) {
	const startWallclock = Date.now();

	for (const row of queue) {
		if (state.cancelRequested) {
			state.status = "cancelled";
			state.finishedAt = new Date().toISOString();
			console.log(`[RERUN_JOB] 已取消，已处理 ${state.processed} 条`);
			return;
		}

		state.currentId = row.id;
		state.currentName = row.name || "";

		try {
			const software = await fetchSoftwareDetail(row.id);
			const { parsed, meta } = await runSoftwareAnalyze(software);
			if (!parsed) throw new Error("AI 返回内容解析失败");
			const patch = buildRerunPatch(parsed, meta);
			await applyRerunPatch(row.id, patch);
			state.processed += 1;
			if (!state.processedIds.includes(row.id)) {
				state.processedIds.push(row.id);
			}
			persistProgress();
			console.log(
				`[RERUN_JOB] ✅ [${row.id}] ${row.name} 完成（tagline=${Boolean(patch.tagline)} highlights=${(patch.highlights || []).length} best_for=${(patch.best_for || []).length} avoid_if=${(patch.avoid_if || []).length}）`,
			);
		} catch (err) {
			const message = err?.message || String(err);
			state.failed += 1;
			state.errors.push({ id: row.id, name: row.name, error: message });
			appendErrorLog({ id: row.id, name: row.name, error: message });
			console.error(`[RERUN_JOB] ❌ [${row.id}] ${row.name} 失败: ${message}`);
		}

		// 更新 avgMs（仅基于已处理 + 已失败的有效尝试次数）
		const attempted = state.processed + state.failed;
		if (attempted > 0) {
			const elapsed = Date.now() - startWallclock;
			state.avgMs = Math.round(elapsed / attempted);
		}

		// 节流：取消时不再 sleep
		if (state.cancelRequested) continue;
		await sleep(SLEEP_MS);
	}

	state.status = "completed";
	state.currentId = null;
	state.currentName = "";
	state.finishedAt = new Date().toISOString();
	console.log(
		`[RERUN_JOB] 任务完成：成功 ${state.processed} / 失败 ${state.failed} / 跳过 ${state.skippedCount}`,
	);
}
