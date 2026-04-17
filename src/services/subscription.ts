import type {
	NotificationLog,
	Subscription,
	SubscriptionCreateInput,
	SubscriptionUpdateInput,
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

export const subscriptionService = {
	async list(): Promise<Subscription[]> {
		const response = await fetch(`${API_BASE}/subscriptions`, {
			headers: { ...getAuthHeaders() },
		});
		if (!response.ok) {
			throw new Error(await parseError(response, "获取订阅列表失败"));
		}
		const data = await response.json();
		return data.data as Subscription[];
	},

	async get(id: number): Promise<Subscription> {
		const response = await fetch(`${API_BASE}/subscriptions/${id}`, {
			headers: { ...getAuthHeaders() },
		});
		if (!response.ok) {
			throw new Error(await parseError(response, "获取订阅失败"));
		}
		const data = await response.json();
		return data.data as Subscription;
	},

	async create(input: SubscriptionCreateInput): Promise<Subscription> {
		const response = await fetch(`${API_BASE}/subscriptions`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...getAuthHeaders() },
			body: JSON.stringify(input),
		});
		if (!response.ok) {
			throw new Error(await parseError(response, "创建订阅失败"));
		}
		const data = await response.json();
		return data.data as Subscription;
	},

	async update(
		id: number,
		patch: SubscriptionUpdateInput,
	): Promise<Subscription> {
		const response = await fetch(`${API_BASE}/subscriptions/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json", ...getAuthHeaders() },
			body: JSON.stringify(patch),
		});
		if (!response.ok) {
			throw new Error(await parseError(response, "更新订阅失败"));
		}
		const data = await response.json();
		return data.data as Subscription;
	},

	async remove(id: number): Promise<void> {
		const response = await fetch(`${API_BASE}/subscriptions/${id}`, {
			method: "DELETE",
			headers: { ...getAuthHeaders() },
		});
		if (!response.ok) {
			throw new Error(await parseError(response, "删除订阅失败"));
		}
	},

	async checkNow(id: number): Promise<{ triggered: boolean; message: string }> {
		const response = await fetch(`${API_BASE}/subscriptions/${id}/check-now`, {
			method: "POST",
			headers: { ...getAuthHeaders() },
		});
		if (!response.ok) {
			throw new Error(await parseError(response, "立即检查失败"));
		}
		const data = await response.json();
		return data.data as { triggered: boolean; message: string };
	},

	async logs(id: number, limit = 50): Promise<NotificationLog[]> {
		const response = await fetch(
			`${API_BASE}/subscriptions/${id}/logs?limit=${limit}`,
			{
				headers: { ...getAuthHeaders() },
			},
		);
		if (!response.ok) {
			throw new Error(await parseError(response, "获取通知日志失败"));
		}
		const data = await response.json();
		return data.data as NotificationLog[];
	},

	async getForSoftware(softwareId: number): Promise<Subscription | null> {
		try {
			const response = await fetch(
				`${API_BASE}/software/${softwareId}/subscription-state`,
				{
					headers: { ...getAuthHeaders() },
				},
			);
			if (!response.ok) {
				// 未登录（401）不视为致命错误，返回 null
				if (response.status === 401) return null;
				throw new Error(await parseError(response, "查询订阅状态失败"));
			}
			const data = await response.json();
			return (data.data as Subscription | null) || null;
		} catch (err) {
			logger.error(`查询软件订阅状态失败 (${softwareId}):`, err);
			return null;
		}
	},
};
