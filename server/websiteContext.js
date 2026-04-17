import net from "node:net";
import { load } from "cheerio";

function normalizeWebsiteUrl(rawUrl) {
	if (!rawUrl || typeof rawUrl !== "string") return null;
	const trimmed = rawUrl.trim();
	if (!trimmed) return null;

	const withProtocol = /^https?:\/\//i.test(trimmed)
		? trimmed
		: `https://${trimmed}`;

	try {
		const url = new URL(withProtocol);
		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return null;
		}
		return url;
	} catch {
		return null;
	}
}

function isPrivateIPv4(hostname) {
	const parts = hostname.split(".").map((v) => Number(v));
	if (parts.length !== 4 || parts.some((v) => Number.isNaN(v))) return false;

	const [a, b] = parts;
	if (a === 10) return true;
	if (a === 127) return true;
	if (a === 169 && b === 254) return true;
	if (a === 172 && b >= 16 && b <= 31) return true;
	if (a === 192 && b === 168) return true;
	return false;
}

function isPrivateHost(hostname) {
	if (!hostname) return true;
	const host = hostname.toLowerCase();

	if (host === "localhost" || host.endsWith(".local")) return true;

	if (net.isIP(host)) {
		if (net.isIPv4(host)) return isPrivateIPv4(host);
		// IPv6 常见本地/链路本地地址
		return (
			host === "::1" ||
			host.startsWith("fc") ||
			host.startsWith("fd") ||
			host.startsWith("fe80:")
		);
	}

	return false;
}

function normalizeWhitespace(text) {
	return String(text || "")
		.replace(/\s+/g, " ")
		.trim();
}

function pickFirstMetaContent($, selectors) {
	for (const selector of selectors) {
		const value = normalizeWhitespace($(selector).attr("content"));
		if (value) return value;
	}
	return "";
}

function extractMainSnippet($, maxChars) {
	const mainRoot = $("main").first().length
		? $("main").first()
		: $("article").first().length
			? $("article").first()
			: $("body").first();

	mainRoot.find("script,style,noscript,svg,iframe").remove();

	let text = mainRoot
		.find("p,li")
		.map((_, el) => normalizeWhitespace($(el).text()))
		.get()
		.filter(Boolean)
		.join(" ");

	if (!text) {
		text = normalizeWhitespace(mainRoot.text());
	}

	if (!text) return "";
	return text.slice(0, maxChars);
}

function extractHeadings($, maxCount = 8) {
	return $("h1,h2")
		.map((_, el) => normalizeWhitespace($(el).text()))
		.get()
		.filter(Boolean)
		.slice(0, maxCount);
}

/**
 * 获取官网上下文，作为 AI 分析的“事实锚点”。
 * 失败时不抛错，返回 fetched=false，避免影响主流程。
 */
async function fetchWebsiteContext(website, options = {}) {
	const { timeoutMs = 7000, maxChars = 2400 } = options;

	const normalizedUrl = normalizeWebsiteUrl(website);
	if (!normalizedUrl) {
		return {
			fetched: false,
			requested_url: website || "",
			error: "官网地址无效",
		};
	}

	if (isPrivateHost(normalizedUrl.hostname)) {
		return {
			fetched: false,
			requested_url: normalizedUrl.toString(),
			error: "不允许访问内网或本地地址",
		};
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(normalizedUrl.toString(), {
			method: "GET",
			redirect: "follow",
			signal: controller.signal,
			headers: {
				"User-Agent": "AppArchiveBot/1.0 (+website-grounding)",
				Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
			},
		});

		if (!response.ok) {
			return {
				fetched: false,
				requested_url: normalizedUrl.toString(),
				error: `官网访问失败: ${response.status}`,
			};
		}

		const contentType = response.headers.get("content-type") || "";
		if (!contentType.toLowerCase().includes("text/html")) {
			return {
				fetched: false,
				requested_url: normalizedUrl.toString(),
				resolved_url: response.url || normalizedUrl.toString(),
				error: "官网返回非 HTML 内容",
			};
		}

		const html = await response.text();
		if (!html || !html.trim()) {
			return {
				fetched: false,
				requested_url: normalizedUrl.toString(),
				resolved_url: response.url || normalizedUrl.toString(),
				error: "官网内容为空",
			};
		}

		const $ = load(html);
		$("script,style,noscript,svg,iframe").remove();

		const title = normalizeWhitespace($("title").first().text());
		const description = pickFirstMetaContent($, [
			'meta[name="description"]',
			'meta[property="og:description"]',
			'meta[name="twitter:description"]',
		]);
		const siteName = pickFirstMetaContent($, [
			'meta[property="og:site_name"]',
			'meta[name="application-name"]',
		]);
		const headings = extractHeadings($);
		const snippet = extractMainSnippet($, maxChars);

		return {
			fetched: true,
			requested_url: normalizedUrl.toString(),
			resolved_url: response.url || normalizedUrl.toString(),
			title,
			description,
			site_name: siteName,
			headings,
			snippet,
			fetched_at: new Date().toISOString(),
		};
	} catch (error) {
		const message =
			error?.name === "AbortError"
				? "官网访问超时"
				: error instanceof Error
					? error.message
					: "官网访问异常";
		return {
			fetched: false,
			requested_url: normalizedUrl.toString(),
			error: message,
		};
	} finally {
		clearTimeout(timer);
	}
}

export { fetchWebsiteContext };
