import { ref } from "vue";
import { aiService } from "@/services/ai";
import type { Software } from "@/types";
import logger from "@/utils/logger";
import { normalizeChinesePunctuation } from "@/utils/text";

export interface AIAnalysisResult {
	description?: string;
	pros: string[];
	cons: string[];
	systems?: string[];
	warnings?: string[];
	analysis_provider?: string;
	analysis_model?: string;
	analysis_at?: string;
	analysis_sources?: string[];
}

export function useAIAnalysis() {
	const isAnalyzing = ref(false);
	const errorMessage = ref<string | null>(null);

	const analyze = async (
		software: Software,
		options: { forceFresh?: boolean } = {},
	): Promise<AIAnalysisResult | null> => {
		if (isAnalyzing.value) return null;
		errorMessage.value = null;
		try {
			isAnalyzing.value = true;
			const result = await aiService.analyzeSoftware(software, options);
			// 归一化结果，确保结构完整，并规范中文标点
			return {
				description:
					typeof result?.description === "string"
						? normalizeChinesePunctuation(result.description)
						: "",
				pros: Array.isArray(result?.pros) ? result.pros : [],
				cons: Array.isArray(result?.cons) ? result.cons : [],
				systems: Array.isArray(result?.systems) ? result.systems : [],
				warnings: Array.isArray(result?.warnings) ? result.warnings : [],
				analysis_provider:
					typeof result?.analysis_provider === "string"
						? result.analysis_provider
						: undefined,
				analysis_model:
					typeof result?.analysis_model === "string"
						? result.analysis_model
						: undefined,
				analysis_at:
					typeof result?.analysis_at === "string"
						? result.analysis_at
						: undefined,
				analysis_sources: Array.isArray(result?.analysis_sources)
					? result.analysis_sources
					: undefined,
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : "AI 分析失败";
			errorMessage.value = message;
			logger.error("AI 分析失败:", err);
			return null;
		} finally {
			isAnalyzing.value = false;
		}
	};

	return { isAnalyzing, errorMessage, analyze };
}
