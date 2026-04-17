import { ref } from "vue";
import { aiService } from "@/services/ai";
import type {
	Software,
	SoftwareAvoidIf,
	SoftwareBestFor,
	SoftwareHighlight,
} from "@/types";
import logger from "@/utils/logger";
import { normalizeChinesePunctuation } from "@/utils/text";

export interface AIAnalysisResult {
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

// 将任意来源的字符串规范化：修中文标点 + 去空白 + 长度截断
const sanitizeLine = (value: unknown, maxLen: number): string => {
	if (typeof value !== "string") return "";
	const cleaned = normalizeChinesePunctuation(value)
		.replace(/\s+/g, " ")
		.trim();
	if (!cleaned) return "";
	return cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned;
};

// highlights 数组归一化：保留对象、字符串字段过滤并限长
const normalizeHighlights = (value: unknown): SoftwareHighlight[] => {
	if (!Array.isArray(value)) return [];
	const result: SoftwareHighlight[] = [];
	for (const raw of value) {
		if (!raw || typeof raw !== "object") continue;
		const item = raw as Record<string, unknown>;
		const title = sanitizeLine(item.title, 30);
		const detail = sanitizeLine(item.detail, 80);
		if (!title && !detail) continue;
		const kindRaw = typeof item.kind === "string" ? item.kind.trim() : "";
		result.push({
			title,
			detail,
			kind: kindRaw || "other",
		});
	}
	return result;
};

// best_for / avoid_if 这种 { key1, key2 } 对象数组的通用归一化
const normalizePairList = <K1 extends string, K2 extends string>(
	value: unknown,
	key1: K1,
	key2: K2,
	maxLen1: number,
	maxLen2: number,
): Array<Record<K1 | K2, string>> => {
	if (!Array.isArray(value)) return [];
	const result: Array<Record<K1 | K2, string>> = [];
	for (const raw of value) {
		if (!raw || typeof raw !== "object") continue;
		const item = raw as Record<string, unknown>;
		const v1 = sanitizeLine(item[key1], maxLen1);
		const v2 = sanitizeLine(item[key2], maxLen2);
		if (!v1 && !v2) continue;
		result.push({ [key1]: v1, [key2]: v2 } as Record<K1 | K2, string>);
	}
	return result;
};

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
				tagline: sanitizeLine(result?.tagline, 40),
				highlights: normalizeHighlights(result?.highlights),
				best_for: normalizePairList(
					result?.best_for,
					"persona",
					"reason",
					40,
					80,
				) as SoftwareBestFor[],
				avoid_if: normalizePairList(
					result?.avoid_if,
					"situation",
					"reason",
					40,
					80,
				) as SoftwareAvoidIf[],
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
