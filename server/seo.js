/**
 * SEO 预渲染模块
 *
 * 为搜索引擎爬虫提供服务端预渲染的 HTML 内容。
 * 百度爬虫不执行 JavaScript，必须在 HTML 中直接包含内容。
 * 本模块扩展了原有 injectOgMeta 机制，在 <head> 注入 meta/JSON-LD，
 * 在 <body> 的 #app 容器内注入预渲染 HTML，Vue 挂载后会自动替换。
 */

import { pool } from "./database.js";

// ========== 工具函数 ==========

const SITE_NAME = "软件清单";
const SITE_DESC =
	"发现、记录和管理优质软件应用，涵盖社交、工具、编程、办公等多个分类。";

function getBaseUrl(req) {
	if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
	return `${req.protocol}://${req.get("host")}`;
}

function escapeHtml(str) {
	if (!str) return "";
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function truncate(str, maxLen) {
	if (!str) return "";
	return str.length > maxLen ? `${str.slice(0, maxLen)}...` : str;
}

// 许可证 → schema.org Offer 映射
function licenseToOffer(license) {
	switch (license) {
		case "免费":
		case "开源":
			return { "@type": "Offer", price: "0", priceCurrency: "CNY" };
		case "收费":
			return {
				"@type": "Offer",
				price: "0",
				priceCurrency: "CNY",
				description: "付费软件",
			};
		case "已购":
			return {
				"@type": "Offer",
				price: "0",
				priceCurrency: "CNY",
				description: "已购买",
			};
		default:
			return undefined;
	}
}

// 分类 → schema.org applicationCategory 映射
function categoryToSchema(cat) {
	const map = {
		社交: "SocialNetworkingApplication",
		生活: "LifestyleApplication",
		购物: "ShoppingApplication",
		影音: "MultimediaApplication",
		阅读: "ReferenceApplication",
		休闲: "GameApplication",
		旅行: "TravelApplication",
		办公: "BusinessApplication",
		工具: "UtilitiesApplication",
		编程: "DeveloperApplication",
	};
	return map[cat] || "SoftwareApplication";
}

// ========== LRU 缓存 ==========

class LRUCache {
	constructor(maxSize = 500) {
		this.maxSize = maxSize;
		this.cache = new Map();
	}

	get(key) {
		const entry = this.cache.get(key);
		if (!entry) return null;
		if (Date.now() - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}
		// LRU: 移到末尾
		this.cache.delete(key);
		this.cache.set(key, entry);
		return entry.html;
	}

	set(key, html, ttl) {
		if (this.cache.size >= this.maxSize) {
			// 淘汰最老的条目
			const firstKey = this.cache.keys().next().value;
			this.cache.delete(firstKey);
		}
		this.cache.set(key, { html, timestamp: Date.now(), ttl });
	}

	invalidate(pattern) {
		for (const key of this.cache.keys()) {
			if (
				typeof pattern === "string" ? key.includes(pattern) : pattern.test(key)
			) {
				this.cache.delete(key);
			}
		}
	}

	clear() {
		this.cache.clear();
	}
}

const pageCache = new LRUCache(500);
const HOME_CACHE_TTL = 30 * 60 * 1000; // 30 分钟
const DETAIL_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 小时
const SITEMAP_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 小时

// ========== Meta 标签构建 ==========

function buildMetaTags({
	title,
	description,
	image,
	url,
	type = "website",
	canonical,
}) {
	const tags = [];

	if (description) {
		tags.push(
			`<meta name="description" content="${escapeHtml(description)}" />`,
		);
	}
	if (canonical) {
		tags.push(`<link rel="canonical" href="${escapeHtml(canonical)}" />`);
	}

	// Open Graph
	tags.push(`<meta property="og:title" content="${escapeHtml(title)}" />`);
	if (description)
		tags.push(
			`<meta property="og:description" content="${escapeHtml(description)}" />`,
		);
	if (image)
		tags.push(`<meta property="og:image" content="${escapeHtml(image)}" />`);
	if (url) tags.push(`<meta property="og:url" content="${escapeHtml(url)}" />`);
	tags.push(`<meta property="og:type" content="${type}" />`);
	tags.push(`<meta property="og:site_name" content="${SITE_NAME}" />`);

	// Twitter Card
	tags.push(`<meta name="twitter:card" content="summary" />`);
	tags.push(`<meta name="twitter:title" content="${escapeHtml(title)}" />`);
	if (description)
		tags.push(
			`<meta name="twitter:description" content="${escapeHtml(description)}" />`,
		);
	if (image)
		tags.push(`<meta name="twitter:image" content="${escapeHtml(image)}" />`);

	return tags.join("\n    ");
}

// ========== JSON-LD 结构化数据 ==========

function buildJsonLdWebSite(baseUrl) {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: SITE_NAME,
		description: SITE_DESC,
		url: baseUrl,
	};
}

function buildJsonLdItemList(items, baseUrl) {
	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		itemListElement: items.map((sw, i) => ({
			"@type": "ListItem",
			position: i + 1,
			item: {
				"@type": "SoftwareApplication",
				name: sw.name,
				description: truncate(sw.description, 160),
				url: `${baseUrl}/software/${sw.id}`,
				...(sw.icon ? { image: sw.icon } : {}),
				applicationCategory: categoryToSchema(sw.category),
				...(sw.systems?.length
					? { operatingSystem: sw.systems.join(", ") }
					: {}),
			},
		})),
	};
}

function buildJsonLdSoftware(sw, baseUrl) {
	const ld = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: sw.name,
		description: truncate(sw.description, 300),
		url: `${baseUrl}/software/${sw.id}`,
		applicationCategory: categoryToSchema(sw.category),
	};
	if (sw.icon) ld.image = sw.icon;
	if (sw.systems?.length) ld.operatingSystem = sw.systems.join(", ");
	if (sw.website) ld.sameAs = sw.website;
	const offer = licenseToOffer(sw.license);
	if (offer) ld.offers = offer;
	return ld;
}

function buildJsonLdBreadcrumb(items, baseUrl) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: item.name,
			item: item.url ? `${baseUrl}${item.url}` : undefined,
		})),
	};
}

function jsonLdScript(data) {
	return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

// ========== Body 内容 HTML 构建 ==========

const CATEGORIES = [
	"社交",
	"生活",
	"购物",
	"影音",
	"阅读",
	"休闲",
	"旅行",
	"办公",
	"工具",
	"编程",
];

function buildHomeContentHtml(items, baseUrl) {
	const categoryLinks = CATEGORIES.map(
		(c) =>
			`<a href="${baseUrl}/?category=${encodeURIComponent(c)}">${escapeHtml(c)}</a>`,
	).join("\n        ");

	const softwareCards = items
		.map((sw) => {
			const systems = (sw.systems || []).map((s) => escapeHtml(s)).join(" / ");
			const desc = escapeHtml(truncate(sw.description, 120));
			return `      <article>
        <h2><a href="${baseUrl}/software/${sw.id}">${escapeHtml(sw.name)}</a></h2>
        ${desc ? `<p>${desc}</p>` : ""}
        ${sw.category ? `<span>${escapeHtml(sw.category)}</span>` : ""}
        ${sw.license ? `<span>${escapeHtml(sw.license)}</span>` : ""}
        ${systems ? `<span>${systems}</span>` : ""}
      </article>`;
		})
		.join("\n");

	return `<h1>${SITE_NAME}</h1>
    <nav aria-label="软件分类">
        ${categoryLinks}
    </nav>
    <main>
${softwareCards}
    </main>`;
}

function buildDetailContentHtml(sw, baseUrl) {
	const systems = (sw.systems || []).map((s) => escapeHtml(s)).join(" / ");
	const desc = escapeHtml(sw.description || "");

	let prosHtml = "";
	if (sw.pros?.length) {
		const items = sw.pros
			.map((p) => `<li>${escapeHtml(p)}</li>`)
			.join("\n          ");
		prosHtml = `
      <section>
        <h2>优点</h2>
        <ul>
          ${items}
        </ul>
      </section>`;
	}

	let consHtml = "";
	if (sw.cons?.length) {
		const items = sw.cons
			.map((c) => `<li>${escapeHtml(c)}</li>`)
			.join("\n          ");
		consHtml = `
      <section>
        <h2>缺点</h2>
        <ul>
          ${items}
        </ul>
      </section>`;
	}

	let articlesHtml = "";
	const articles = (sw.related_articles || []).filter((a) => a.title && a.url);
	if (articles.length) {
		const items = articles
			.map(
				(a) =>
					`<li><a href="${escapeHtml(a.url)}" rel="noopener noreferrer">${escapeHtml(a.title)}</a>${a.description ? ` - ${escapeHtml(a.description)}` : ""}</li>`,
			)
			.join("\n          ");
		articlesHtml = `
      <section>
        <h2>相关资源</h2>
        <ul>
          ${items}
        </ul>
      </section>`;
	}

	return `<nav aria-label="面包屑导航">
      <a href="${baseUrl}/">首页</a> &gt;
      ${sw.category ? `<a href="${baseUrl}/?category=${encodeURIComponent(sw.category)}">${escapeHtml(sw.category)}</a> &gt;` : ""}
      <span>${escapeHtml(sw.name)}</span>
    </nav>
    <article>
      <h1>${escapeHtml(sw.name)}</h1>
      ${sw.icon ? `<img src="${escapeHtml(sw.icon)}" alt="${escapeHtml(sw.name)}" width="96" height="96" />` : ""}
      ${sw.category ? `<span>${escapeHtml(sw.category)}</span>` : ""}
      ${sw.license ? `<span>${escapeHtml(sw.license)}</span>` : ""}
      ${systems ? `<span>${systems}</span>` : ""}
      ${sw.website ? `<p><a href="${escapeHtml(sw.website)}" rel="noopener noreferrer">访问官网</a></p>` : ""}
      ${desc ? `<section><h2>关于软件</h2><p>${desc}</p></section>` : ""}
${prosHtml}
${consHtml}
${articlesHtml}
    </article>`;
}

// ========== 页面渲染核心 ==========

function renderPage(indexHtml, { title, headTags, jsonLdList, contentHtml }) {
	let html = indexHtml;

	// 替换 title
	if (title) {
		html = html.replace(
			/<title>[^<]*<\/title>/,
			`<title>${escapeHtml(title)}</title>`,
		);
	}

	// 注入 head 标签（meta + JSON-LD）
	const headInjection = [
		headTags || "",
		...(jsonLdList || []).map((ld) => jsonLdScript(ld)),
	]
		.filter(Boolean)
		.join("\n    ");

	if (headInjection) {
		html = html.replace("</head>", `    ${headInjection}\n  </head>`);
	}

	// 注入 body 内容到 #app 容器内
	if (contentHtml) {
		html = html.replace(
			'<div id="app"></div>',
			`<div id="app">${contentHtml}</div>`,
		);
	}

	return html;
}

// ========== 路由预渲染函数 ==========

async function prerenderHome(req, res, indexHtml) {
	const cacheKey = "page:/";
	const cached = pageCache.get(cacheKey);
	if (cached) {
		res.send(cached);
		return;
	}

	try {
		const baseUrl = getBaseUrl(req);

		const result = await pool.query(
			`SELECT id, name, icon, description, category, license, systems, website
			 FROM softwares ORDER BY created_at DESC LIMIT 20`,
		);
		const items = result.rows;

		const title = `${SITE_NAME} - 发现和管理优质软件`;
		const description = SITE_DESC;
		const url = baseUrl;
		const canonical = baseUrl + "/";

		const headTags = buildMetaTags({
			title,
			description,
			url,
			type: "website",
			canonical,
		});
		const jsonLdList = [
			buildJsonLdWebSite(baseUrl),
			buildJsonLdItemList(items, baseUrl),
		];
		const contentHtml = buildHomeContentHtml(items, baseUrl);

		const html = renderPage(indexHtml, {
			title,
			headTags,
			jsonLdList,
			contentHtml,
		});
		pageCache.set(cacheKey, html, HOME_CACHE_TTL);
		res.send(html);
	} catch (error) {
		console.error("[SEO] 首页预渲染失败:", error.message);
		res.send(indexHtml);
	}
}

async function prerenderDetail(req, res, indexHtml) {
	const softwareId = req.params.id;
	const cacheKey = `page:/software/${softwareId}`;
	const cached = pageCache.get(cacheKey);
	if (cached) {
		res.send(cached);
		return;
	}

	try {
		const baseUrl = getBaseUrl(req);

		const result = await pool.query(
			"SELECT id, name, description, icon, category, license, systems, website, pros, cons, related_articles FROM softwares WHERE id = $1",
			[softwareId],
		);

		if (result.rows.length === 0) {
			res.send(indexHtml);
			return;
		}

		const sw = result.rows[0];
		const systems = (sw.systems || []).join(" / ");
		const badge = [sw.category, sw.license, systems]
			.filter(Boolean)
			.join(" · ");
		const shortDesc = truncate(sw.description, 200);
		const fullDesc = badge ? `${badge} — ${shortDesc}` : shortDesc;

		const title = `${sw.name} - ${SITE_NAME}`;
		const canonical = `${baseUrl}/software/${sw.id}`;

		const headTags = buildMetaTags({
			title,
			description: fullDesc,
			image: sw.icon,
			url: canonical,
			type: "article",
			canonical,
		});
		const jsonLdList = [
			buildJsonLdSoftware(sw, baseUrl),
			buildJsonLdBreadcrumb(
				[
					{ name: "首页", url: "/" },
					...(sw.category
						? [
								{
									name: sw.category,
									url: `/?category=${encodeURIComponent(sw.category)}`,
								},
							]
						: []),
					{ name: sw.name },
				],
				baseUrl,
			),
		];
		const contentHtml = buildDetailContentHtml(sw, baseUrl);

		const html = renderPage(indexHtml, {
			title,
			headTags,
			jsonLdList,
			contentHtml,
		});
		pageCache.set(cacheKey, html, DETAIL_CACHE_TTL);
		res.send(html);
	} catch (error) {
		console.error("[SEO] 详情页预渲染失败:", error.message);
		res.send(indexHtml);
	}
}

async function prerenderShare(req, res, indexHtml) {
	const softwareId = req.params.id;
	const cacheKey = `page:/share/software/${softwareId}`;
	const cached = pageCache.get(cacheKey);
	if (cached) {
		res.send(cached);
		return;
	}

	try {
		const baseUrl = getBaseUrl(req);

		const result = await pool.query(
			"SELECT id, name, description, icon, category, license, systems, website, pros, cons, related_articles FROM softwares WHERE id = $1",
			[softwareId],
		);

		if (result.rows.length === 0) {
			res.send(indexHtml);
			return;
		}

		const sw = result.rows[0];
		const systems = (sw.systems || []).join(" / ");
		const badge = [sw.category, sw.license, systems]
			.filter(Boolean)
			.join(" · ");
		const shortDesc = truncate(sw.description, 200);
		const fullDesc = badge ? `${badge} — ${shortDesc}` : shortDesc;

		const title = `${sw.name} - ${SITE_NAME}`;
		// 分享页 canonical 指向详情页，避免重复内容
		const canonical = `${baseUrl}/software/${sw.id}`;
		const shareUrl = `${baseUrl}/share/software/${sw.id}`;

		const headTags = buildMetaTags({
			title,
			description: fullDesc,
			image: sw.icon,
			url: shareUrl,
			type: "article",
			canonical,
		});
		const jsonLdList = [buildJsonLdSoftware(sw, baseUrl)];
		const contentHtml = buildDetailContentHtml(sw, baseUrl);

		const html = renderPage(indexHtml, {
			title,
			headTags,
			jsonLdList,
			contentHtml,
		});
		pageCache.set(cacheKey, html, DETAIL_CACHE_TTL);
		res.send(html);
	} catch (error) {
		console.error("[SEO] 分享页预渲染失败:", error.message);
		res.send(indexHtml);
	}
}

// ========== Sitemap XML 生成 ==========

let sitemapCache = { xml: null, timestamp: 0 };

async function generateSitemap(req) {
	const now = Date.now();
	if (sitemapCache.xml && now - sitemapCache.timestamp < SITEMAP_CACHE_TTL) {
		return sitemapCache.xml;
	}

	const baseUrl = getBaseUrl(req);
	const result = await pool.query(
		"SELECT id, updated_at FROM softwares ORDER BY updated_at DESC",
	);

	const today = new Date().toISOString().split("T")[0];

	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
	xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

	// 首页
	xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

	// 软件详情页
	for (const row of result.rows) {
		const lastmod = row.updated_at
			? new Date(row.updated_at).toISOString().split("T")[0]
			: today;
		xml += `  <url>\n    <loc>${baseUrl}/software/${row.id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
	}

	xml += "</urlset>";

	sitemapCache = { xml, timestamp: now };
	return xml;
}

// 动态 robots.txt（含正确的 Sitemap 绝对 URL）
function generateRobotsTxt(req) {
	const baseUrl = getBaseUrl(req);
	return `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
}

// ========== 缓存失效 ==========

function invalidateSoftwareCache(softwareId) {
	if (softwareId) {
		pageCache.invalidate(`/software/${softwareId}`);
	}
	// 首页缓存也需清除（列表可能变化）
	pageCache.invalidate("page:/");
	// sitemap 缓存也清除
	sitemapCache = { xml: null, timestamp: 0 };
}

function invalidateAllCache() {
	pageCache.clear();
	sitemapCache = { xml: null, timestamp: 0 };
}

// ========== 导出 ==========

export {
	escapeHtml,
	prerenderHome,
	prerenderDetail,
	prerenderShare,
	generateSitemap,
	generateRobotsTxt,
	invalidateSoftwareCache,
	invalidateAllCache,
	pageCache,
};
