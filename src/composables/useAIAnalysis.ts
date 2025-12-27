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
}

export function useAIAnalysis() {
	const isAnalyzing = ref(false);
	const errorMessage = ref<string | null>(null);

	const analyze = async (
		software: Software,
	): Promise<AIAnalysisResult | null> => {
		if (isAnalyzing.value) return null;
		errorMessage.value = null;
		try {
			isAnalyzing.value = true;
			const result = await aiService.analyzeSoftware(software);
			// 归一化结果，确保结构完整，并规范中文标点
			return {
				description:
					typeof result?.description === "string"
						? normalizeChinesePunctuation(result.description)
						: "",
				pros: Array.isArray(result?.pros) ? result.pros : [],
				cons: Array.isArray(result?.cons) ? result.cons : [],
				systems: Array.isArray(result?.systems) ? result.systems : [],
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
