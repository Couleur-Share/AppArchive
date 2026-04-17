import type {
	ComparisonAnalysis,
	ComparisonDifference,
	ComparisonDimension,
	ComparisonScenario,
	DimensionRating,
} from "../types/comparison";

// 清理可能包裹 JSON 的代码块围栏与前后垃圾字符
const stripCodeFence = (text: string): string => {
	let t = text.trim();
	t = t.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
	return t.trim();
};

// 截取字符串中第一个 { 到最后一个 } 之间的内容，兼容模型前后多余文字
const extractJsonRegion = (text: string): string => {
	const start = text.indexOf("{");
	const end = text.lastIndexOf("}");
	if (start === -1 || end === -1 || end <= start) return text;
	return text.slice(start, end + 1);
};

// 容错解析：支持标准 JSON 与带中文标点的准 JSON
const tryParseJson = (text: string): unknown | null => {
	try {
		return JSON.parse(text);
	} catch {}
	// 兜底：替换中文标点与引号
	const normalized = text
		.replace(/[：]/g, ":")
		.replace(/[，]/g, ",")
		.replace(/[“”]/g, '"')
		.replace(/[‘’]/g, '"')
		.replace(/,(\s*[}\]])/g, "$1");
	try {
		return JSON.parse(normalized);
	} catch {
		return null;
	}
};

const sanitizeString = (v: unknown): string => {
	if (typeof v !== "string") return "";
	return v.trim();
};

const clampScore = (v: unknown): number => {
	const n = typeof v === "number" ? v : Number(v);
	if (!Number.isFinite(n)) return 0;
	return Math.max(1, Math.min(5, Math.round(n)));
};

const parseRating = (raw: unknown): DimensionRating | null => {
	if (!raw || typeof raw !== "object") return null;
	const obj = raw as Record<string, unknown>;
	const score = clampScore(obj.score);
	const comment = sanitizeString(obj.comment);
	if (!score) return null;
	return { score, comment };
};

const parseDimensions = (raw: unknown): ComparisonDimension[] => {
	if (!Array.isArray(raw)) return [];
	const out: ComparisonDimension[] = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const obj = item as Record<string, unknown>;
		const name = sanitizeString(obj.name);
		if (!name) continue;
		const ratingsRaw = obj.ratings;
		if (!ratingsRaw || typeof ratingsRaw !== "object") continue;
		const ratings: Record<string, DimensionRating> = {};
		for (const [swName, ratingRaw] of Object.entries(
			ratingsRaw as Record<string, unknown>,
		)) {
			const trimmedName = sanitizeString(swName);
			if (!trimmedName) continue;
			const parsed = parseRating(ratingRaw);
			if (parsed) ratings[trimmedName] = parsed;
		}
		if (Object.keys(ratings).length === 0) continue;
		out.push({ name, ratings });
	}
	return out;
};

const parseDifferences = (raw: unknown): ComparisonDifference[] => {
	if (!Array.isArray(raw)) return [];
	const out: ComparisonDifference[] = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const obj = item as Record<string, unknown>;
		const title = sanitizeString(obj.title);
		const description = sanitizeString(obj.description);
		if (!title && !description) continue;
		out.push({ title, description });
	}
	return out;
};

const parseScenarios = (raw: unknown): ComparisonScenario[] => {
	if (!Array.isArray(raw)) return [];
	const out: ComparisonScenario[] = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const obj = item as Record<string, unknown>;
		const scenario = sanitizeString(obj.scenario);
		const recommendation = sanitizeString(obj.recommendation);
		const reason = sanitizeString(obj.reason);
		if (!scenario && !recommendation && !reason) continue;
		out.push({ scenario, recommendation, reason });
	}
	return out;
};

/**
 * 尝试把对比分析内容解析为结构化对象
 * 返回 null 表示非结构化（legacy Markdown），调用方应回退到 Markdown 渲染
 */
export function parseComparisonContent(
	content: string | null | undefined,
): ComparisonAnalysis | null {
	if (!content || typeof content !== "string") return null;
	const trimmed = content.trim();
	if (!trimmed) return null;

	// 快速判断：如果不包含 {，基本不可能是 JSON
	if (!trimmed.includes("{")) return null;

	const stripped = stripCodeFence(trimmed);
	const region = extractJsonRegion(stripped);
	const parsed = tryParseJson(region);
	if (!parsed || typeof parsed !== "object") return null;

	const obj = parsed as Record<string, unknown>;

	// 最核心的结构化证据：必须至少有 dimensions 或 scenarios 其中之一
	const hasStructuredKey =
		Array.isArray(obj.dimensions) ||
		Array.isArray(obj.scenarios) ||
		Array.isArray(obj.key_differences) ||
		typeof obj.verdict === "string";
	if (!hasStructuredKey) return null;

	const verdict = sanitizeString(obj.verdict);
	const dimensions = parseDimensions(obj.dimensions);
	const key_differences = parseDifferences(obj.key_differences);
	const scenarios = parseScenarios(obj.scenarios);

	// 全空说明解析失败，回退到 Markdown
	if (
		!verdict &&
		dimensions.length === 0 &&
		key_differences.length === 0 &&
		scenarios.length === 0
	) {
		return null;
	}

	return {
		verdict,
		dimensions,
		key_differences,
		scenarios,
	};
}

// 给定维度，找出最高分，用于前端高亮
export function getDimensionTopScore(dim: ComparisonDimension): number {
	let max = 0;
	for (const r of Object.values(dim.ratings)) {
		if (r.score > max) max = r.score;
	}
	return max;
}
