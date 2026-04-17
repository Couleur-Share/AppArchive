import { getApiBase } from "./apiBase";
import { getAuthHeaders } from "./auth";

const API_BASE = getApiBase();

export interface AIProvider {
	id: string;
	name: string;
	api_base: string;
	models: string[];
	default_model: string;
}

export interface AIConfig {
	id: number;
	provider: string;
	api_base: string;
	api_key_masked: string;
	model: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface AIConfigInput {
	provider: string;
	api_base: string;
	api_key: string;
	model: string;
}

export interface SearchConfig {
	tavily_api_key_masked: string;
	tavily_enabled: boolean;
	source: "database" | "env" | "none";
}

export interface SearchConfigInput {
	tavily_api_key?: string;
	tavily_enabled?: boolean;
}

export const searchConfigService = {
	async getConfig(): Promise<SearchConfig> {
		const response = await fetch(`${API_BASE}/search/config`, {
			headers: { ...getAuthHeaders() },
		});
		if (!response.ok) throw new Error("获取搜索配置失败");
		const data = await response.json();
		return data.data;
	},

	async saveConfig(config: SearchConfigInput): Promise<SearchConfig> {
		const response = await fetch(`${API_BASE}/search/config`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				...getAuthHeaders(),
			},
			body: JSON.stringify(config),
		});
		if (!response.ok) {
			const err = await response.json().catch(() => ({ message: "保存失败" }));
			throw new Error(err.message || "保存搜索配置失败");
		}
		const data = await response.json();
		return data.data;
	},

	async testTavily(
		apiKey: string,
	): Promise<{ success: boolean; message: string }> {
		const response = await fetch(`${API_BASE}/search/config/test`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...getAuthHeaders(),
			},
			body: JSON.stringify({ tavily_api_key: apiKey }),
		});
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.message || "Tavily 连接测试失败");
		}
		return data;
	},
};

export const aiConfigService = {
	async getProviders(): Promise<AIProvider[]> {
		const response = await fetch(`${API_BASE}/ai/providers`);
		if (!response.ok) throw new Error("获取供应商列表失败");
		const data = await response.json();
		return data.data;
	},

	async getConfig(): Promise<AIConfig | null> {
		const response = await fetch(`${API_BASE}/ai/config`, {
			headers: { ...getAuthHeaders() },
		});
		if (!response.ok) throw new Error("获取AI配置失败");
		const data = await response.json();
		return data.data;
	},

	async saveConfig(config: AIConfigInput): Promise<AIConfig> {
		const response = await fetch(`${API_BASE}/ai/config`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				...getAuthHeaders(),
			},
			body: JSON.stringify(config),
		});
		if (!response.ok) {
			const err = await response.json().catch(() => ({ message: "保存失败" }));
			throw new Error(err.message || "保存AI配置失败");
		}
		const data = await response.json();
		return data.data;
	},

	async testConfig(
		config: AIConfigInput,
	): Promise<{ success: boolean; message: string }> {
		const response = await fetch(`${API_BASE}/ai/config/test`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...getAuthHeaders(),
			},
			body: JSON.stringify(config),
		});
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.message || "连接测试失败");
		}
		return data;
	},
};
