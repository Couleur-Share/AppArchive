/**
 * AI 分析核心：抽离自 server/index.js 的 POST /api/ai/analyze 内部逻辑
 *
 * 设计目标：
 *  - HTTP 路由与 CLI 脚本共用同一份分析流程，避免重复维护
 *  - 纯函数：输入 software 对象，输出最终响应体（含 analysis_meta / website_context / search_context）
 *  - 不抛 401/400/HTTP 错误，所有失败统一抛 Error，由调用方决定如何回包
 */

import { callAI } from "./ai.js";
import { buildAnalyzeMessages } from "./prompts.js";
import { searchTavily, searchTavilySafety } from "./tavilySearch.js";
import { fetchWebsiteContext } from "./websiteContext.js";

/**
 * 执行一次完整的软件分析
 * @param {object} software 软件对象（至少包含 name；可选 website / category）
 * @returns {Promise<{data: object, parsed: object|null, meta: object|null}>}
 *   - data: 等价于原 HTTP 接口的完整响应体，包含 choices/analysis_meta/website_context/search_context
 *   - parsed: 解析后的 AI JSON（若解析失败为 null，由上层再处理）
 *   - meta: data.analysis_meta 的引用（便于上层快速取用）
 */
export async function runSoftwareAnalyze(software) {
	if (!software || !software.name) {
		throw new Error("软件名称不能为空");
	}

	const kind =
		software.kind === "extension" || software.kind === "userscript"
			? software.kind
			: "app";
	const shouldRunSafetySearch = kind === "app";

	// 并行：官网爬取 + Tavily 通用搜索；应用条目额外执行安全搜索
	const tasks = [];

	if (software.website) {
		tasks.push(
			fetchWebsiteContext(software.website).catch((err) => {
				console.error("[WEBSITE_CONTEXT] 爬取异常:", err?.message);
				return null;
			}),
		);
	} else {
		tasks.push(Promise.resolve(null));
	}

	tasks.push(
		searchTavily(software.name, {
			category: software.category,
			website: software.website,
		}).catch((err) => {
			console.error("[TAVILY] 搜索异常:", err?.message);
			return { searched: false, error: err?.message };
		}),
	);

	tasks.push(
		shouldRunSafetySearch
			? searchTavilySafety(software.name, {
					website: software.website,
				}).catch((err) => {
					console.error("[TAVILY_SAFETY] 搜索异常:", err?.message);
					return { searched: false, error: err?.message };
				})
			: Promise.resolve(null),
	);

	const [websiteContext, searchResults, safetySearchResults] =
		await Promise.all(tasks);

	const messages = buildAnalyzeMessages(software, {
		websiteContext,
		searchResults,
		safetySearchResults,
	});
	const data = await callAI(messages);

	// 汇总数据来源标签
	const sources = [];
	const hasWebsiteInput =
		typeof software.website === "string" && software.website.trim();
	if (websiteContext?.fetched) {
		sources.push("website");
	} else if (hasWebsiteInput) {
		sources.push("website-error");
	}
	if (searchResults?.searched) {
		sources.push("tavily");
		if (
			!Array.isArray(searchResults.results) ||
			searchResults.results.length === 0
		) {
			sources.push("tavily-empty");
		}
	} else if (searchResults?.error) {
		sources.push("tavily-error");
	}
	if (safetySearchResults?.searched) sources.push("tavily-safety");
	if (data.analysis_meta) {
		data.analysis_meta.sources = sources;
	}

	if (websiteContext) {
		data.website_context = {
			fetched: Boolean(websiteContext.fetched),
			resolved_url:
				websiteContext.resolved_url ||
				websiteContext.requested_url ||
				software.website,
			error: websiteContext.error || "",
		};
	}

	if (searchResults) {
		data.search_context = {
			searched: Boolean(searchResults.searched),
			query: searchResults.query || "",
			result_count: searchResults.results?.length || 0,
			response_time: searchResults.response_time || 0,
			error: searchResults.error || searchResults.reason || "",
		};
	}

	// 尝试解析 AI 返回内容（容忍 ```json 代码块包裹）
	let parsed = null;
	const raw = data?.choices?.[0]?.message?.content;
	if (typeof raw === "string") {
		try {
			parsed = JSON.parse(raw);
		} catch (_err) {
			const stripped = raw
				.replace(/^```[a-zA-Z]*\n?/, "")
				.replace(/```$/, "")
				.trim();
			try {
				parsed = JSON.parse(stripped);
			} catch (_innerErr) {
				parsed = null;
			}
		}
	}

	return { data, parsed, meta: data?.analysis_meta || null };
}
