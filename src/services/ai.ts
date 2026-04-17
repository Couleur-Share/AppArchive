import type {
	Software,
	SoftwareAvoidIf,
	SoftwareBestFor,
	SoftwareHighlight,
} from "../types";
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

export interface AIAnalyzeResult {
	description?: string;
	pros: string[];
	cons: string[];
	systems?: string[];
	warnings?: string[];
	tagline?: string;
	highlights?: SoftwareHighlight[];
	best_for?: SoftwareBestFor[];
	avoid_if?: SoftwareAvoidIf[];
	analysis_provider?: string;
	analysis_model?: string;
	analysis_at?: string;
	analysis_sources?: string[];
}

export const aiService = {
	async analyzeSoftware(
		software: Software,
		options: { forceFresh?: boolean } = {},
	): Promise<AIAnalyzeResult> {
		if (!software.name) {
			throw new AppError("软件名称不能为空", ErrorCode.VALIDATION);
		}

		try {
			const canUseCache = Number.isFinite(software.id) && software.id > 0;
			// 检查缓存（可强制跳过）
			if (!options.forceFresh && canUseCache) {
				const cached = await cacheService.getAnalysisCache(software);
				if (cached) {
					return cached;
				}
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
			const baseResult = extractProsConsFromContent(content);
			const meta =
				typeof data?.analysis_meta === "object" && data.analysis_meta !== null
					? (data.analysis_meta as Record<string, unknown>)
					: null;

			const result: AIAnalyzeResult = {
				...baseResult,
				analysis_provider:
					typeof meta?.provider === "string"
						? meta.provider
						: typeof data?.analysis_provider === "string"
							? data.analysis_provider
							: undefined,
				analysis_model:
					typeof meta?.model === "string"
						? meta.model
						: typeof data?.analysis_model === "string"
							? data.analysis_model
							: undefined,
				analysis_at:
					typeof meta?.analysis_at === "string"
						? meta.analysis_at
						: typeof data?.analysis_at === "string"
							? data.analysis_at
							: undefined,
				analysis_sources: Array.isArray(meta?.sources)
					? (meta.sources as string[])
					: undefined,
			};

			// 保存到缓存（仅缓存已落库的软件）
			if (canUseCache) {
				await cacheService.setAnalysisCache(software, result);
			}

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
