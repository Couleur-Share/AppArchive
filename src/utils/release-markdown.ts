// GitHub Release Notes 渲染管线：unified/remark + rehype + Shiki
// 特性：GFM、GitHub 语法（@user / #issue / SHA）、GitHub Alerts、
// Shiki 双主题代码高亮、<details>/<kbd>/<img> 等原生 HTML（经 sanitize 白名单净化）。

import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkGithub from "remark-github";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import {
	createHighlighterCore,
	type HighlighterCore,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { unified } from "unified";
import logger from "./logger";

export interface ReleaseMarkdownContext {
	owner: string;
	repo: string;
}

// ---------- Shiki 高亮器（单例） ----------
// 使用 createHighlighterCore 按需动态 import 语言/主题，避免 shiki 主入口
// 自动打包全部 grammar（200+ 语言 9MB+）。JS 引擎相比 Oniguruma wasm 小约 500KB，
// 对常见的 bash/js/ts/json/yaml/diff 等语言准确度足够。

const SHIKI_THEMES = {
	light: "github-light",
	dark: "github-dark",
} as const;

// 动态 import 的语言列表：每个语法文件将成为独立 chunk 由 Vite 按需加载
// 选择标准：GitHub Release Notes 中出现频率高 + 体积合理
function loadLangs() {
	return [
		import("shiki/langs/bash.mjs"),
		import("shiki/langs/shellscript.mjs"),
		import("shiki/langs/powershell.mjs"),
		import("shiki/langs/javascript.mjs"),
		import("shiki/langs/typescript.mjs"),
		import("shiki/langs/jsx.mjs"),
		import("shiki/langs/tsx.mjs"),
		import("shiki/langs/json.mjs"),
		import("shiki/langs/jsonc.mjs"),
		import("shiki/langs/yaml.mjs"),
		import("shiki/langs/toml.mjs"),
		import("shiki/langs/ini.mjs"),
		import("shiki/langs/xml.mjs"),
		import("shiki/langs/html.mjs"),
		import("shiki/langs/css.mjs"),
		import("shiki/langs/scss.mjs"),
		import("shiki/langs/vue.mjs"),
		import("shiki/langs/diff.mjs"),
		import("shiki/langs/markdown.mjs"),
		import("shiki/langs/python.mjs"),
		import("shiki/langs/rust.mjs"),
		import("shiki/langs/go.mjs"),
		import("shiki/langs/c.mjs"),
		import("shiki/langs/cpp.mjs"),
		import("shiki/langs/java.mjs"),
		import("shiki/langs/sql.mjs"),
		import("shiki/langs/dockerfile.mjs"),
	];
}

function loadThemes() {
	return [
		import("shiki/themes/github-light.mjs"),
		import("shiki/themes/github-dark.mjs"),
	];
}

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighterCore({
			themes: loadThemes(),
			langs: loadLangs(),
			engine: createJavaScriptRegexEngine(),
		}).catch((err) => {
			// 失败后允许下一次重试
			highlighterPromise = null;
			throw err;
		});
	}
	return highlighterPromise;
}

// ---------- 白名单 schema（基于 defaultSchema 扩展） ----------
// 放行：
//   - GitHub Alerts：div / p / svg / path
//   - Shiki：pre[class|style|tabindex] / code[class] / span[class|style]
//   - 原生折叠与键帽：details / summary / kbd / sub / sup
//   - 媒体：img 扩展属性 / video / source / picture / audio
// 危险协议仍受 protocols 限制（只允许 http/https/mailto/tel）

type SanitizeSchema = typeof defaultSchema;

const schema: SanitizeSchema = {
	...defaultSchema,
	tagNames: [
		...(defaultSchema.tagNames ?? []),
		"details",
		"summary",
		"kbd",
		"sub",
		"sup",
		"svg",
		"path",
		"g",
		"circle",
		"rect",
		"polyline",
		"line",
		"video",
		"source",
		"picture",
		"audio",
	],
	attributes: {
		...(defaultSchema.attributes ?? {}),
		// 全局属性：允许 class / style / dir / role / aria-*
		"*": [
			...(defaultSchema.attributes?.["*"] ?? []),
			"className",
			"style",
			"dir",
			"role",
			"ariaHidden",
			"ariaLabel",
			"ariaLabelledBy",
			"ariaDescribedBy",
			"tabIndex",
		],
		a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
		img: [
			...(defaultSchema.attributes?.img ?? []),
			"loading",
			"decoding",
			"width",
			"height",
		],
		input: [
			...(defaultSchema.attributes?.input ?? []),
			"disabled",
			"checked",
			"type",
		],
		pre: ["className", "style", "tabIndex"],
		code: ["className"],
		span: ["className", "style"],
		div: ["className", "dir"],
		p: ["className", "dir"],
		details: ["open"],
		summary: ["className"],
		video: [
			"src",
			"controls",
			"muted",
			"loop",
			"poster",
			"width",
			"height",
			"preload",
		],
		source: ["src", "type"],
		audio: ["src", "controls", "muted", "loop", "preload"],
		svg: [
			"className",
			"viewBox",
			"width",
			"height",
			"ariaHidden",
			"role",
			"xmlns",
			"fill",
		],
		path: ["d", "fillRule", "clipRule", "fill", "stroke", "strokeWidth"],
		g: ["fill", "stroke"],
	},
	protocols: {
		...(defaultSchema.protocols ?? {}),
		href: ["http", "https", "mailto", "tel"],
		src: ["http", "https"],
		cite: ["http", "https"],
	},
	// 保留 GFM 任务列表与 alert 原样透传
	clobberPrefix: defaultSchema.clobberPrefix,
	clobber: defaultSchema.clobber,
};

// ---------- 自定义 rehype 插件：补回 shiki 的 pre 标记类 ----------
// @shikijs/rehype 4.x 双主题模式输出的 <pre> 仅带 inline style、不带 .shiki 类，
// 这会让 CSS 的 `.shiki` 选择器（暗色覆盖、主题切换）与 `pre:not(.shiki)` 的
// 兜底背景全部错位。识别 style 中包含 `--shiki-dark` 的 pre 节点，补回 class。
function rehypeMarkShikiPre() {
	return (tree: unknown) => {
		const walk = (node: any): void => {
			if (
				node?.type === "element" &&
				node.tagName === "pre" &&
				node.properties &&
				typeof node.properties.style === "string" &&
				node.properties.style.includes("--shiki-dark")
			) {
				const existing = node.properties.className;
				const classes = Array.isArray(existing)
					? [...existing]
					: typeof existing === "string"
						? existing.split(/\s+/).filter(Boolean)
						: [];
				if (!classes.includes("shiki")) classes.push("shiki");
				node.properties.className = classes;
			}
			if (Array.isArray(node?.children)) {
				for (const child of node.children) walk(child);
			}
		};
		walk(tree);
	};
}

// ---------- 自定义 rehype 插件：外链安全属性 ----------
// 将 http(s) 外链的 <a> 追加 target="_blank" rel="noopener nofollow"
function rehypeExternalLinks() {
	return (tree: unknown) => {
		const walk = (node: any): void => {
			if (
				node &&
				node.type === "element" &&
				node.tagName === "a" &&
				node.properties
			) {
				const href = node.properties.href;
				if (typeof href === "string" && /^https?:\/\//i.test(href)) {
					node.properties.target = "_blank";
					// 保留既有 rel（若有），合并 noopener nofollow
					const existingRel =
						typeof node.properties.rel === "string"
							? node.properties.rel.split(/\s+/)
							: Array.isArray(node.properties.rel)
								? node.properties.rel
								: [];
					const relSet = new Set<string>(existingRel);
					relSet.add("noopener");
					relSet.add("nofollow");
					node.properties.rel = Array.from(relSet).join(" ");
				}
			}
			if (node && Array.isArray(node.children)) {
				for (const child of node.children) walk(child);
			}
		};
		walk(tree);
	};
}

// ---------- LRU 缓存 ----------

const CACHE_CAP = 50;
const cache = new Map<string, string>();

// FNV-1a 32-bit hash，足够在 release body 场景避免碰撞
function hashKey(body: string, ctx?: ReleaseMarkdownContext): string {
	const combined = ctx
		? `${ctx.owner}/${ctx.repo}\u0000${body}`
		: `\u0000${body}`;
	let h = 0x811c9dc5 >>> 0;
	for (let i = 0; i < combined.length; i++) {
		h ^= combined.charCodeAt(i);
		h = Math.imul(h, 0x01000193) >>> 0;
	}
	return `${h.toString(16)}:${combined.length}`;
}

function cacheGet(key: string): string | undefined {
	const v = cache.get(key);
	if (v !== undefined) {
		// 刷新到 Map 末尾（保持 LRU 顺序）
		cache.delete(key);
		cache.set(key, v);
	}
	return v;
}

function cacheSet(key: string, value: string): void {
	if (cache.has(key)) cache.delete(key);
	cache.set(key, value);
	while (cache.size > CACHE_CAP) {
		const oldest = cache.keys().next().value;
		if (oldest === undefined) break;
		cache.delete(oldest);
	}
}

// ---------- 对外渲染函数 ----------

export async function renderReleaseMarkdown(
	body: string,
	ctx?: ReleaseMarkdownContext,
): Promise<string> {
	if (!body) return "";

	const key = hashKey(body, ctx);
	const cached = cacheGet(key);
	if (cached !== undefined) return cached;

	try {
		const highlighter = await getHighlighter();

		// unified 链式类型参数过深，这里统一降级为 any（插件运行时无影响）
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let processor: any = unified().use(remarkParse).use(remarkGfm);

		if (ctx?.owner && ctx?.repo) {
			processor = processor.use(remarkGithub, {
				repository: `${ctx.owner}/${ctx.repo}`,
			});
		}

		const file = await processor
			.use(remarkAlert)
			.use(remarkRehype, { allowDangerousHtml: true })
			.use(rehypeRaw)
			.use(rehypeShikiFromHighlighter, highlighter, {
				themes: SHIKI_THEMES,
				defaultLanguage: "text",
				fallbackLanguage: "text",
			})
			.use(rehypeMarkShikiPre)
			.use(rehypeExternalLinks)
			.use(rehypeSanitize, schema)
			.use(rehypeStringify, { allowDangerousHtml: false })
			.process(body);

		const html = String(file);
		cacheSet(key, html);
		return html;
	} catch (err) {
		logger.error("renderReleaseMarkdown 失败:", err);
		throw err;
	}
}

// 仅用于测试或手动清理（例如切换账号后想清理缓存）
export function clearReleaseMarkdownCache(): void {
	cache.clear();
}
