import type { Software, SoftwareListItem } from "../types";
import { AppError, ErrorCode } from "../types/error";
import { errorHandler } from "../utils/error-handler";
import logger from "../utils/logger";
import { getApiBase } from "./apiBase";
import { getAuthHeaders } from "./auth";

const API_BASE_URL = getApiBase();

// HTTP请求辅助函数
const apiRequest = async (
	endpoint: string,
	options: RequestInit = {},
	requireAuth = false,
) => {
	const url = `${API_BASE_URL}${endpoint}`;
	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			...(options.headers || {}),
			...(requireAuth ? getAuthHeaders() : {}),
		},
		...options,
	});

	if (!response.ok) {
		const errorData = await response
			.json()
			.catch(() => ({ error: "网络错误" }));
		throw new Error(errorData.message || errorData.error || "请求失败");
	}

	return response.json();
};

export const softwareService = {
	// 获取软件列表 (支持分页、筛选、排序)
	async getSoftwareList(params: {
		page?: number;
		limit?: number;
		search?: string;
		category?: string;
		systems?: string[];
		sortField?: string;
		sortOrder?: "asc" | "desc";
	} = {}) {
		try {
			logger.debug("开始从 API 获取数据...", params);
			
			const queryParams = new URLSearchParams();
			if (params.page) queryParams.append("page", params.page.toString());
			if (params.limit) queryParams.append("limit", params.limit.toString());
			if (params.search) queryParams.append("search", params.search);
			if (params.category && params.category !== 'all') queryParams.append("category", params.category);
			if (params.systems && params.systems.length > 0) queryParams.append("systems", params.systems.join(","));
			if (params.sortField) queryParams.append("sortField", params.sortField);
			if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

			const result = await apiRequest(`/software?${queryParams.toString()}`);

			logger.debug("成功获取数据，当前页数量:", result.data?.length ?? 0);
			return {
				data: result.data as SoftwareListItem[],
				pagination: result.pagination
			};
		} catch (error) {
			logger.error("获取数据失败:", error);
			throw errorHandler.handle(error);
		}
	},

	// 获取单个软件详情
	async getSoftwareById(id: number) {
		try {
			const result = await apiRequest(`/software/${id}`);
			return result.data as Software;
		} catch (error) {
			logger.error(`获取软件详情失败 (ID: ${id}):`, error);
			throw errorHandler.handle(error);
		}
	},

	// 获取所有软件 (已弃用，仅用于向后兼容，只返回第一页)
	async getAllSoftware() {
		try {
			logger.warn("getAllSoftware 已弃用，请使用 getSoftwareList");
			const result = await this.getSoftwareList({ page: 1, limit: 1000 }); // 尝试获取较多数据以兼容
			return result.data;
		} catch (error) {
			logger.error("获取数据失败:", error);
			throw errorHandler.handle(error);
		}
	},

	// 添加新软件
	async addSoftware(data: Partial<Software>) {
		try {
			const softwareData = {
				...data,
				pros: Array.isArray(data.pros) ? data.pros : [],
				cons: Array.isArray(data.cons) ? data.cons : [],
				download_links: Array.isArray((data as any).download_links)
					? (data as any).download_links
					: undefined,
				secrets: Array.isArray((data as any).secrets)
					? (data as any).secrets
					: undefined,
				related_articles: Array.isArray(data.related_articles)
					? data.related_articles
					: undefined,
			};

			if (!softwareData.name || !softwareData.category) {
				throw new AppError("缺少必要信息", ErrorCode.VALIDATION);
			}

			const result = await apiRequest(
				"/software",
				{
					method: "POST",
					body: JSON.stringify(softwareData),
				},
				true,
			);

			return result.data as Software;
		} catch (error) {
			throw errorHandler.handle(error);
		}
	},

	// 更新软件
	async updateSoftware(id: number, data: Partial<Software>) {
		try {
			// 确保 pros 和 cons 是数组
			const {
				id: _,
				created_at,
				...updateData
			} = {
				...data,
				pros: Array.isArray(data.pros) ? data.pros : [],
				cons: Array.isArray(data.cons) ? data.cons : [],
				download_links: Array.isArray((data as any).download_links)
					? (data as any).download_links
					: undefined,
				secrets: Array.isArray((data as any).secrets)
					? (data as any).secrets
					: undefined,
				related_articles: Array.isArray(data.related_articles)
					? data.related_articles
					: undefined,
			};

			logger.debug("更新数据:", updateData);

			// 过滤 undefined 字段，避免无效 JSON
			const sanitized = Object.fromEntries(
				Object.entries(updateData).filter(([_, v]) => v !== undefined),
			);

			const result = await apiRequest(
				`/software/${id}`,
				{
					method: "PUT",
					body: JSON.stringify(sanitized),
				},
				true,
			);

			return result.data as Software;
		} catch (error) {
			logger.error("更新错误:", error);
			throw errorHandler.handle(error);
		}
	},

	// 删除软件
	async deleteSoftware(id: number) {
		try {
			await apiRequest(
				`/software/${id}`,
				{
					method: "DELETE",
				},
				true,
			);
		} catch (error) {
			throw errorHandler.handle(error);
		}
	},

	// 按类别获取软件
	async getSoftwareByCategory(category: string) {
		try {
			const result = await apiRequest(
				`/software/category/${encodeURIComponent(category)}`,
			);
			return result.data as Software[];
		} catch (error) {
			throw errorHandler.handle(error);
		}
	},

	// 搜索软件 (已合并到 getSoftwareList)
	async searchSoftware(query: string) {
		try {
			return (await this.getSoftwareList({ search: query })).data;
		} catch (error) {
			throw errorHandler.handle(error);
		}
	},

	// 移除 getAllSoftwareWithPagination

};
