import type {
	ChannelCreateInput,
	ChannelUpdateInput,
	UserChannel,
} from "../types/subscription";
import logger from "../utils/logger";
import { getApiBase } from "./apiBase";
import { getAuthHeaders } from "./auth";

const API_BASE = getApiBase();

async function parseError(
	response: Response,
	fallback: string,
): Promise<string> {
	try {
		const data = await response.json();
		return data.message || data.error || fallback;
	} catch {
		return fallback;
	}
}

export const channelsService = {
	async list(): Promise<UserChannel[]> {
		const response = await fetch(`${API_BASE}/channels`, {
			headers: { ...getAuthHeaders() },
		});
		if (!response.ok) {
			throw new Error(await parseError(response, "获取通道列表失败"));
		}
		const data = await response.json();
		return data.data as UserChannel[];
	},

	async create(input: ChannelCreateInput): Promise<UserChannel> {
		const response = await fetch(`${API_BASE}/channels`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...getAuthHeaders() },
			body: JSON.stringify(input),
		});
		if (!response.ok) {
			throw new Error(await parseError(response, "创建通道失败"));
		}
		const data = await response.json();
		return data.data as UserChannel;
	},

	async update(id: number, patch: ChannelUpdateInput): Promise<UserChannel> {
		const response = await fetch(`${API_BASE}/channels/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json", ...getAuthHeaders() },
			body: JSON.stringify(patch),
		});
		if (!response.ok) {
			throw new Error(await parseError(response, "更新通道失败"));
		}
		const data = await response.json();
		return data.data as UserChannel;
	},

	async remove(id: number): Promise<void> {
		const response = await fetch(`${API_BASE}/channels/${id}`, {
			method: "DELETE",
			headers: { ...getAuthHeaders() },
		});
		if (!response.ok) {
			throw new Error(await parseError(response, "删除通道失败"));
		}
	},

	async setPrimary(id: number): Promise<UserChannel> {
		const response = await fetch(`${API_BASE}/channels/${id}/primary`, {
			method: "POST",
			headers: { ...getAuthHeaders() },
		});
		if (!response.ok) {
			throw new Error(await parseError(response, "设置主通道失败"));
		}
		const data = await response.json();
		return data.data as UserChannel;
	},

	async test(id: number): Promise<{ ok: boolean; error?: string }> {
		try {
			const response = await fetch(`${API_BASE}/channels/${id}/test`, {
				method: "POST",
				headers: { ...getAuthHeaders() },
			});
			if (response.ok) return { ok: true };
			const message = await parseError(response, "测试推送失败");
			return { ok: false, error: message };
		} catch (err) {
			logger.error("测试通道失败:", err);
			return { ok: false, error: (err as Error).message || "网络错误" };
		}
	},
};
