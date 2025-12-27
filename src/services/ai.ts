import type { Software } from "../types";
import { AppError, ErrorCode } from "../types/error";
import {
	extractProsConsFromContent,
	fetchWithRetry,
	validateAIResponse,
} from "../utils/ai-utils";
import { getApiBase } from "./apiBase";
import { getAuthHeaders } from "./auth";
import { cacheService } from "./cache";

const API_BASE = getApiBase();

export const aiService = {
	async analyzeSoftware(software: Software) {
		if (!software.name) {
			throw new AppError("软件名称不能为空", ErrorCode.VALIDATION);
		}

		try {
			// 检查缓存
			const cached = await cacheService.getAnalysisCache(software);
			if (cached) {
				return cached;
			}

			const response = await fetchWithRetry(`${API_BASE}/ai/analyze`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...getAuthHeaders(),
				},
				body: JSON.stringify({
					software,
				}),
			});

			const data = await response.json();
			const content = validateAIResponse(data);
			const result = extractProsConsFromContent(content);

			// 保存到缓存
			await cacheService.setAnalysisCache(software, result as any);

			return result;
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError(
				error instanceof Error ? error.message : "AI分析失败",
				ErrorCode.API_ERROR,
			);
		}
	},

	async generateComparison(softwares: Software[]) {
		if (softwares.length < 2) {
			throw new AppError("至少需要两个软件才能进行对比", ErrorCode.VALIDATION);
		}

		try {
			const response = await fetchWithRetry(`${API_BASE}/ai/compare`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...getAuthHeaders(),
				},
				body: JSON.stringify({
					softwares,
				}),
			});

			const data = await response.json();
			return validateAIResponse(data);
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError(
				error instanceof Error ? error.message : "AI分析失败",
				ErrorCode.API_ERROR,
			);
		}
	},
};
