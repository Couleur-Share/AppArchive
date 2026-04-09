import { pool } from "./database.js";
import { encryptValue, decryptValue } from "./ai.js";

const TAVILY_API_BASE = "https://api.tavily.com";

// ========== 配置读写 ==========

async function getTavilyConfig() {
	try {
		const { rows } = await pool.query(
			"SELECT * FROM search_config ORDER BY id LIMIT 1",
		);
		if (rows.length > 0 && rows[0].tavily_api_key_cipher) {
			return {
				api_key: decryptValue(rows[0].tavily_api_key_cipher),
				enabled: rows[0].tavily_enabled,
			};
		}
	} catch {
		// search_config 表可能尚未创建，降级到环境变量
	}

	const envKey = process.env.TAVILY_API_KEY;
	if (envKey) {
		return { api_key: envKey, enabled: true };
	}
	return null;
}

async function getTavilyConfigForClient() {
	try {
		const { rows } = await pool.query(
			"SELECT * FROM search_config ORDER BY id LIMIT 1",
		);
		if (rows.length > 0 && rows[0].tavily_api_key_cipher) {
			const rawKey = decryptValue(rows[0].tavily_api_key_cipher);
			const masked =
				rawKey.length > 8
					? `${rawKey.slice(0, 4)}${"*".repeat(Math.min(rawKey.length - 8, 20))}${rawKey.slice(-4)}`
					: "****";
			return {
				tavily_api_key_masked: masked,
				tavily_enabled: rows[0].tavily_enabled,
				source: "database",
			};
		}
	} catch {
		// 表不存在时降级
	}

	const envKey = process.env.TAVILY_API_KEY;
	if (envKey) {
		const masked =
			envKey.length > 8
				? `${envKey.slice(0, 4)}${"*".repeat(Math.min(envKey.length - 8, 20))}${envKey.slice(-4)}`
				: "****";
		return {
			tavily_api_key_masked: masked,
			tavily_enabled: true,
			source: "env",
		};
	}
	return { tavily_api_key_masked: "", tavily_enabled: false, source: "none" };
}

async function saveTavilyConfig({ api_key, enabled }) {
	const cipher = api_key ? encryptValue(api_key) : null;

	const { rows } = await pool.query(
		"SELECT id FROM search_config ORDER BY id LIMIT 1",
	);

	if (rows.length > 0) {
		const setClauses = ["tavily_enabled = $1", "updated_at = NOW()"];
		const params = [enabled !== false];

		if (cipher) {
			setClauses.push(`tavily_api_key_cipher = $${params.length + 1}`);
			params.push(cipher);
		}

		params.push(rows[0].id);
		await pool.query(
			`UPDATE search_config SET ${setClauses.join(", ")} WHERE id = $${params.length}`,
			params,
		);
	} else {
		await pool.query(
			"INSERT INTO search_config (tavily_api_key_cipher, tavily_enabled) VALUES ($1, $2)",
			[cipher, enabled !== false],
		);
	}
}

// ========== 搜索执行 ==========

function buildSearchQuery(softwareName, options = {}) {
	const { category, website } = options;
	const parts = [softwareName];

	if (category) {
		parts.push(category);
	}
	parts.push("software");

	// 如果有官网，让搜索引擎也注意到这个网站
	if (website) {
		try {
			const hostname = new URL(
				/^https?:\/\//i.test(website) ? website : `https://${website}`,
			).hostname;
			parts.push(hostname);
		} catch {
			// URL 解析失败，忽略
		}
	}

	return parts.join(" ");
}

/**
 * 调用 Tavily Search API 获取软件相关的网络搜索结果。
 * 失败时不抛错，返回 searched=false，避免影响主分析流程。
 */
async function searchTavily(softwareName, options = {}) {
	const { category, website, timeoutMs = 10000 } = options;

	const config = await getTavilyConfig();
	if (!config || !config.api_key || !config.enabled) {
		return { searched: false, reason: "Tavily 未配置或未启用" };
	}

	const query = buildSearchQuery(softwareName, { category, website });

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(`${TAVILY_API_BASE}/search`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.api_key}`,
			},
			body: JSON.stringify({
				query,
				search_depth: "basic",
				max_results: 5,
				include_answer: "basic",
				include_raw_content: false,
				include_images: false,
				topic: "general",
			}),
			signal: controller.signal,
		});

		if (!response.ok) {
			const text = await response.text().catch(() => "");
			console.error(
				`[TAVILY] API 错误: ${response.status} ${text.slice(0, 200)}`,
			);
			return {
				searched: false,
				query,
				error: `Tavily API 错误: ${response.status}`,
			};
		}

		const data = await response.json();

		const results = (data.results || []).map((r) => ({
			title: r.title || "",
			url: r.url || "",
			content: r.content || "",
			score: r.score || 0,
		}));

		console.log(
			`[TAVILY] 搜索完成: "${query}" → ${results.length} 条结果, ${data.response_time || "?"}s`,
		);

		return {
			searched: true,
			query,
			answer: data.answer || "",
			results,
			response_time: data.response_time || 0,
		};
	} catch (error) {
		const message =
			error?.name === "AbortError"
				? "Tavily 搜索超时"
				: error instanceof Error
					? error.message
					: "Tavily 搜索异常";
		console.error(`[TAVILY] 搜索失败: ${message}`);
		return { searched: false, query, error: message };
	} finally {
		clearTimeout(timer);
	}
}

// ========== 安全风险专项搜索 ==========

function buildSafetySearchQuery(softwareName, options = {}) {
	const { website } = options;
	const parts = [
		`"${softwareName}"`,
		"安全事件 投毒 数据泄露 隐私争议 恶意代码 黑历史",
	];

	if (website) {
		try {
			const hostname = new URL(
				/^https?:\/\//i.test(website) ? website : `https://${website}`,
			).hostname;
			parts.push(hostname);
		} catch {
			// URL 解析失败，忽略
		}
	}

	return parts.join(" ");
}

/**
 * 针对软件安全风险/黑历史的专项搜索。
 * 与 searchTavily 共用配置和错误处理逻辑，但使用安全风险导向的查询词。
 */
async function searchTavilySafety(softwareName, options = {}) {
	const { website, timeoutMs = 10000 } = options;

	const config = await getTavilyConfig();
	if (!config || !config.api_key || !config.enabled) {
		return { searched: false, reason: "Tavily 未配置或未启用" };
	}

	const query = buildSafetySearchQuery(softwareName, { website });

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(`${TAVILY_API_BASE}/search`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.api_key}`,
			},
			body: JSON.stringify({
				query,
				search_depth: "advanced",
				max_results: 5,
				include_answer: "basic",
				include_raw_content: false,
				include_images: false,
				topic: "general",
			}),
			signal: controller.signal,
		});

		if (!response.ok) {
			const text = await response.text().catch(() => "");
			console.error(
				`[TAVILY_SAFETY] API 错误: ${response.status} ${text.slice(0, 200)}`,
			);
			return {
				searched: false,
				query,
				error: `Tavily Safety API 错误: ${response.status}`,
			};
		}

		const data = await response.json();

		const results = (data.results || []).map((r) => ({
			title: r.title || "",
			url: r.url || "",
			content: r.content || "",
			score: r.score || 0,
		}));

		console.log(
			`[TAVILY_SAFETY] 搜索完成: "${query}" → ${results.length} 条结果, ${data.response_time || "?"}s`,
		);

		return {
			searched: true,
			query,
			answer: data.answer || "",
			results,
			response_time: data.response_time || 0,
		};
	} catch (error) {
		const message =
			error?.name === "AbortError"
				? "Tavily Safety 搜索超时"
				: error instanceof Error
					? error.message
					: "Tavily Safety 搜索异常";
		console.error(`[TAVILY_SAFETY] 搜索失败: ${message}`);
		return { searched: false, query, error: message };
	} finally {
		clearTimeout(timer);
	}
}

/**
 * 测试 Tavily API Key 有效性（发一次轻量搜索）
 */
async function testTavilyApiKey(apiKey) {
	if (!apiKey || typeof apiKey !== "string") {
		throw new Error("Tavily API Key 不能为空");
	}

	const response = await fetch(`${TAVILY_API_BASE}/search`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			query: "test",
			search_depth: "basic",
			max_results: 1,
			include_answer: false,
		}),
	});

	if (!response.ok) {
		if (response.status === 401) {
			throw new Error("Tavily API Key 无效或已过期");
		}
		if (response.status === 429) {
			throw new Error("Tavily API 请求频率超限");
		}
		const text = await response.text().catch(() => "");
		throw new Error(`Tavily 连接测试失败: ${response.status} ${text.slice(0, 100)}`);
	}

	return { success: true, message: "Tavily 连接测试成功" };
}

export {
	getTavilyConfig,
	getTavilyConfigForClient,
	saveTavilyConfig,
	searchTavily,
	searchTavilySafety,
	testTavilyApiKey,
};
