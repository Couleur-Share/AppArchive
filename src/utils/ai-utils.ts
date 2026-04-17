import { AI_CONFIG } from "../config/ai";
import { AppError, ErrorCode } from "../types/error";

export async function fetchWithRetry(
	url: string,
	options: RequestInit,
	retries = AI_CONFIG.RETRY_TIMES,
): Promise<Response> {
	for (let i = 0; i < retries; i++) {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), AI_CONFIG.TIMEOUT);

			const response = await fetch(url, {
				...options,
				signal: controller.signal,
			});

			clearTimeout(timeout);

			if (response.ok) return response;

			let detail: string | undefined;
			try {
				const text = await response.clone().text();
				detail = text;
			} catch {}

			// AI 未配置
			if (response.status === 503) {
				throw new AppError(
					"AI 尚未配置，请在「设置 → AI 设置」中配置供应商和 API Key",
					ErrorCode.API_ERROR,
					response.status,
				);
			}

			// 针对 401/403 提供更明确的提示
			if (response.status === 401 || response.status === 403) {
				throw new AppError(
					`认证失败(${response.status})，请检查 API Key 是否正确以及是否拥有调用权限。${detail ? ` 详情: ${detail}` : ""}`,
					ErrorCode.API_ERROR,
					response.status,
				);
			}

			throw new AppError(
				`API请求失败: ${response.status}${detail ? ` - ${detail}` : ""}`,
				ErrorCode.API_ERROR,
				response.status,
			);
		} catch (error) {
			if (i === retries - 1) throw error;
			await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
		}
	}

	throw new AppError("重试次数已用完", ErrorCode.API_ERROR);
}

export function validateAIResponse(data: any) {
	if (!data?.choices?.[0]?.message?.content) {
		throw new AppError("无效的 API 响应", ErrorCode.API_ERROR);
	}
	return data.choices[0].message.content;
}

// 结构化洞察：highlights / best_for / avoid_if 的对象数组条目
export interface ParsedHighlight {
	title: string;
	detail: string;
	kind?: string;
}
export interface ParsedBestFor {
	persona: string;
	reason: string;
}
export interface ParsedAvoidIf {
	situation: string;
	reason: string;
}

// 过滤并规范 string 数组字段
function sanitizeStringArray(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.filter((x) => typeof x === "string")
		.map((s: string) => s.trim())
		.filter(Boolean);
}

// highlights 对象数组专用
function sanitizeHighlights(raw: unknown): ParsedHighlight[] {
	if (!Array.isArray(raw)) return [];
	const out: ParsedHighlight[] = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const obj = item as Record<string, unknown>;
		const title = typeof obj.title === "string" ? obj.title.trim() : "";
		const detail = typeof obj.detail === "string" ? obj.detail.trim() : "";
		if (!title && !detail) continue;
		const kind =
			typeof obj.kind === "string" && obj.kind.trim() ? obj.kind.trim() : "other";
		out.push({ title, detail, kind });
	}
	return out;
}

// best_for / avoid_if 的通用两字段对象数组
function sanitizePairArray<K1 extends string, K2 extends string>(
	raw: unknown,
	key1: K1,
	key2: K2,
): Array<Record<K1 | K2, string>> {
	if (!Array.isArray(raw)) return [];
	const out: Array<Record<K1 | K2, string>> = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const obj = item as Record<string, unknown>;
		const v1 = typeof obj[key1] === "string" ? (obj[key1] as string).trim() : "";
		const v2 = typeof obj[key2] === "string" ? (obj[key2] as string).trim() : "";
		if (!v1 && !v2) continue;
		out.push({ [key1]: v1, [key2]: v2 } as Record<K1 | K2, string>);
	}
	return out;
}

export interface ParsedAIResult {
	description?: string;
	pros: string[];
	cons: string[];
	systems?: string[];
	warnings?: string[];
	tagline?: string;
	highlights?: ParsedHighlight[];
	best_for?: ParsedBestFor[];
	avoid_if?: ParsedAvoidIf[];
}

// 把 JSON.parse 后的通用对象映射到 ParsedAIResult
function buildParsedResult(parsed: any): ParsedAIResult {
	const description =
		typeof parsed?.description === "string" ? parsed.description.trim() : "";
	const tagline =
		typeof parsed?.tagline === "string" ? parsed.tagline.trim() : "";
	return {
		description,
		tagline,
		pros: sanitizeStringArray(parsed?.pros),
		cons: sanitizeStringArray(parsed?.cons),
		systems: sanitizeStringArray(parsed?.systems),
		warnings: sanitizeStringArray(parsed?.warnings),
		highlights: sanitizeHighlights(parsed?.highlights),
		best_for: sanitizePairArray(parsed?.best_for, "persona", "reason") as ParsedBestFor[],
		avoid_if: sanitizePairArray(parsed?.avoid_if, "situation", "reason") as ParsedAvoidIf[],
	};
}

// 尝试从模型返回的文本中提取并纠正 JSON
export function extractProsConsFromContent(content: string): ParsedAIResult {
	if (typeof content !== "string") {
		return { description: "", pros: [], cons: [] };
	}

	let text = content.trim();

	// 去除代码块围栏
	text = text
		.replace(/^\s*```(?:json)?\s*/i, "")
		.replace(/\s*```\s*$/i, "")
		.trim();

	// 先尝试直接解析“原始 JSON 片段”（优先兼容 JSON Mode）
	const rawStart = text.indexOf("{");
	const rawEnd = text.lastIndexOf("}");
	const rawJsonCandidate =
		rawStart !== -1 && rawEnd !== -1 && rawEnd > rawStart
			? text.slice(rawStart, rawEnd + 1)
			: text;
	try {
		return buildParsedResult(JSON.parse(rawJsonCandidate));
	} catch {}

	// 若直接解析失败，再进入修复流程（兼容非 JSON Mode 或不规范输出）
	// 截取第一个 { 到最后一个 } 之间的内容
	const start = text.indexOf("{");
	const end = text.lastIndexOf("}");
	if (start !== -1 && end !== -1 && end > start) {
		text = text.slice(start, end + 1);
	}

	// 规范化常见标点与引号、键名、尾随逗号
	text = text
		.replace(/[：]/g, ":")
		.replace(/[，]/g, ",")
		.replace(/[“”]/g, '"')
		.replace(/[‘’]/g, '"')
		.replace(/(\bdescription\b)\s*:/gi, '"description":')
		.replace(/(\btagline\b)\s*:/gi, '"tagline":')
		.replace(/(\bpros\b)\s*:/gi, '"pros":')
		.replace(/(\bcons\b)\s*:/gi, '"cons":')
		.replace(/(\bsystems\b)\s*:/gi, '"systems":')
		.replace(/(\bwarnings\b)\s*:/gi, '"warnings":')
		.replace(/(\bhighlights\b)\s*:/gi, '"highlights":')
		.replace(/(\bbest_for\b)\s*:/gi, '"best_for":')
		.replace(/(\bavoid_if\b)\s*:/gi, '"avoid_if":')
		// 移除数组/对象末尾多余逗号
		.replace(/,(\s*[}\]])/g, "$1");

	// 再次尝试解析
	try {
		return buildParsedResult(JSON.parse(text));
	} catch {}

	// 回退方案：用更稳健的正则分别提取字段
	// 1) description：支持转义引号与中文引号
	const descMatch =
		text.match(/"?description"?\s*:\s*"((?:\\.|[^"\\])*)"/i) ||
		text.match(/description\s*:\s*"((?:\\.|[^"\\])*)"/i);
	// 2) pros/cons/systems：匹配到最近的方括号并提取内部
	const bracketContent = (key: string) =>
		text.match(new RegExp(`"?${key}"?\\s*:\\s*\\[([\\s\\S]*?)\\]`, "i")) ||
		text.match(new RegExp(`${key}\\s*:\\s*\\[([\\s\\S]*?)\\]`, "i"));
	const prosMatch = bracketContent("pros");
	const consMatch = bracketContent("cons");
	const systemsMatch = bracketContent("systems");
	const warningsMatch = bracketContent("warnings");

	const splitItems = (inner?: string | null) => {
		if (!inner) return [] as string[];
		return (
			inner
				// 逗号分割（忽略引号内的逗号）
				.split(/,(?=(?:[^"'\\]|\\.|"[^"]*"|'[^']*')*$)/)
				.map((s) => s.replace(/^[\s"'`\-·•]+|[\s"'`\-·•]+$/g, "").trim())
				.filter(Boolean)
		);
	};

	const pros = splitItems(prosMatch?.[1]);
	const cons = splitItems(consMatch?.[1]);
	// 反转义常见序列，防止被截断
	const unescape = (s: string) =>
		s
			.replace(/\\n/g, "\n")
			.replace(/\\r/g, "\r")
			.replace(/\\t/g, "\t")
			.replace(/\\"/g, '"');
	const description = unescape((descMatch?.[1] || "").trim());
	const systems = splitItems(systemsMatch?.[1]);
	const warnings = splitItems(warningsMatch?.[1]);

	return { description, pros, cons, systems, warnings };
}
