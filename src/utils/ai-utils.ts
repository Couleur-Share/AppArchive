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

			// 针对 401/403 提供更明确的提示
			if (response.status === 401 || response.status === 403) {
				throw new AppError(
					`认证失败(${response.status})，请检查 VITE_KIMI_API_KEY 是否正确以及是否拥有调用权限。${detail ? ` 详情: ${detail}` : ""}`,
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

// 尝试从模型返回的文本中提取并纠正 JSON（仅需要 pros/cons 两个字段）
export function extractProsConsFromContent(content: string): {
	description?: string;
	pros: string[];
	cons: string[];
	systems?: string[];
} {
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
		const parsed: any = JSON.parse(rawJsonCandidate);
		const pros = Array.isArray(parsed?.pros) ? parsed.pros : [];
		const cons = Array.isArray(parsed?.cons) ? parsed.cons : [];
		const systems = Array.isArray(parsed?.systems) ? parsed.systems : [];
		const description =
			typeof parsed?.description === "string" ? parsed.description.trim() : "";
		return {
			description,
			pros: pros
				.filter((x: any) => typeof x === "string")
				.map((s: string) => s.trim())
				.filter(Boolean),
			cons: cons
				.filter((x: any) => typeof x === "string")
				.map((s: string) => s.trim())
				.filter(Boolean),
			systems: systems
				.filter((x: any) => typeof x === "string")
				.map((s: string) => s.trim())
				.filter(Boolean),
		};
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
		.replace(/(\bpros\b)\s*:/gi, '"pros":')
		.replace(/(\bcons\b)\s*:/gi, '"cons":')
		.replace(/(\bsystems\b)\s*:/gi, '"systems":')
		// 移除数组/对象末尾多余逗号
		.replace(/,(\s*[}\]])/g, "$1");

	// 再次尝试解析
	try {
		const parsed: any = JSON.parse(text);
		const pros = Array.isArray(parsed?.pros) ? parsed.pros : [];
		const cons = Array.isArray(parsed?.cons) ? parsed.cons : [];
		const systems = Array.isArray(parsed?.systems) ? parsed.systems : [];
		const description =
			typeof parsed?.description === "string" ? parsed.description.trim() : "";
		return {
			description,
			pros: pros
				.filter((x: any) => typeof x === "string")
				.map((s: string) => s.trim())
				.filter(Boolean),
			cons: cons
				.filter((x: any) => typeof x === "string")
				.map((s: string) => s.trim())
				.filter(Boolean),
			systems: systems
				.filter((x: any) => typeof x === "string")
				.map((s: string) => s.trim())
				.filter(Boolean),
		};
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

	return { description, pros, cons, systems };
}
