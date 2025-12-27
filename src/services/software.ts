import type { Software } from "../types";
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
	// 获取所有软件
	async getAllSoftware() {
		try {
			logger.debug("开始从 API 获取数据...");
			const result = await apiRequest("/software");

			logger.debug("成功获取数据，总数:", result.data?.length ?? 0);
			return result.data as Software[];
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

	// 搜索软件
	async searchSoftware(query: string) {
		try {
			const result = await apiRequest(
				`/software/search/${encodeURIComponent(query)}`,
			);
			return result.data as Software[];
		} catch (error) {
			throw errorHandler.handle(error);
		}
	},

	// 添加分页获取方法
	async getAllSoftwareWithPagination(page: number, pageSize: number) {
		try {
			// 先获取所有数据，然后在前端进行分页
			// 后续可以优化为后端分页
			const allData = await this.getAllSoftware();
			const startIndex = page * pageSize;
			const endIndex = startIndex + pageSize;
			const data = allData.slice(startIndex, endIndex);

			return {
				data,
				total: allData.length,
			};
		} catch (error) {
			throw errorHandler.handle(error);
		}
	},
};
