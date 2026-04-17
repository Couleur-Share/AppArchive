/**
 * 批量重跑 AI 分析任务的前端服务
 *
 * 与后端 /api/admin/rerun/* 系列接口对接：
 *  - startRerun  POST  /start
 *  - getRerunStatus GET   /status
 *  - cancelRerun POST  /cancel
 *  - resetRerun  POST  /reset
 *
 * 任务在后端 Node 进程内执行，浏览器关闭、刷新都不影响进度。
 */

import { getApiBase } from "./apiBase";
import { getAuthHeaders } from "./auth";

const API_BASE = getApiBase();

export type RerunMode = "all" | "missing_structured" | "selected";

export type RerunJobStatus =
	| "idle"
	| "running"
	| "completed"
	| "cancelled"
	| "failed";

export interface RerunErrorEntry {
	id: number;
	name: string;
	error: string;
}

export interface RerunStatus {
	jobId: string | null;
	mode: RerunMode | null;
	status: RerunJobStatus;
	total: number;
	processed: number;
	failed: number;
	skippedCount: number;
	currentId: number | null;
	currentName: string;
	startedAt: string | null;
	finishedAt: string | null;
	avgMs: number;
	etaMs: number;
	errors: RerunErrorEntry[];
	processedIds: number[];
	startedByUserId: number | string | null;
	sleepMs: number;
	lastError: string;
}

interface ApiEnvelope<T> {
	success: boolean;
	data: T;
	error?: string;
	message?: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const url = `${API_BASE}${path}`;
	const res = await fetch(url, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...getAuthHeaders(),
			...(init.headers || {}),
		},
	});
	const payload = (await res.json().catch(() => ({}))) as ApiEnvelope<T> & {
		data?: T;
	};
	if (!res.ok) {
		const err = new Error(payload.message || payload.error || "请求失败");
		// 透传 409 + 当前 status 给上层
		(err as Error & { status?: number; data?: T }).status = res.status;
		(err as Error & { status?: number; data?: T }).data = payload.data;
		throw err;
	}
	return payload.data as T;
}

export async function startRerun(
	mode: RerunMode,
	ids?: number[],
): Promise<RerunStatus> {
	return request<RerunStatus>("/admin/rerun/start", {
		method: "POST",
		body: JSON.stringify({ mode, ids: ids ?? [] }),
	});
}

export async function getRerunStatus(): Promise<RerunStatus> {
	return request<RerunStatus>("/admin/rerun/status", { method: "GET" });
}

export async function cancelRerun(): Promise<RerunStatus> {
	return request<RerunStatus>("/admin/rerun/cancel", { method: "POST" });
}

export async function resetRerun(): Promise<RerunStatus> {
	return request<RerunStatus>("/admin/rerun/reset", { method: "POST" });
}

/**
 * 把毫秒数格式化为 mm:ss；超过 1 小时则显示 hh:mm:ss
 * 0 或负数返回空字符串，由上层决定是否显示"计算中…"
 */
export function formatEta(ms: number): string {
	if (!Number.isFinite(ms) || ms <= 0) return "";
	const totalSec = Math.round(ms / 1000);
	const hours = Math.floor(totalSec / 3600);
	const minutes = Math.floor((totalSec % 3600) / 60);
	const seconds = totalSec % 60;
	const pad = (n: number) => String(n).padStart(2, "0");
	if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
	return `${pad(minutes)}:${pad(seconds)}`;
}
