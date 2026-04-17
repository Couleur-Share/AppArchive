// Release AI 摘要生成与缓存
// 按 (software_id, tag_name) 维度缓存，全站同一版本只生成一次
// AI 失败时降级到截取 release.body 前 200 字（保证推送不阻塞）
import { callAI } from "./ai.js";
import { pool } from "./database.js";

// ========== 对外接口 ==========

// 仅查询缓存，未命中返回 null
export async function getCachedSummary(softwareId, tagName) {
	if (!softwareId || !tagName) return null;
	const { rows } = await pool.query(
		`SELECT software_id, tag_name, summary, highlights, breaking,
		        provider, model, generated_at
		   FROM release_ai_summaries
		  WHERE software_id = $1 AND tag_name = $2`,
		[softwareId, tagName],
	);
	return rows[0] || null;
}

// 命中缓存直接返回；未命中调 AI 生成，失败降级并写库
// release: 来自 github_releases_cache 或 GitHub API 的单个 release 对象
// softwareMeta: { name, category?, description? }
export async function getOrCreateSummary(softwareId, release, softwareMeta) {
	if (!softwareId || !release?.tag_name) {
		return makeFallbackPayload(release, null);
	}

	const cached = await getCachedSummary(softwareId, release.tag_name);
	if (cached) {
		return {
			summary: cached.summary || "",
			highlights: normalizeHighlights(cached.highlights),
			breaking: Boolean(cached.breaking),
			fromCache: true,
			provider: cached.provider || null,
			model: cached.model || null,
		};
	}

	// 调用 AI
	let payload = null;
	let meta = null;
	try {
		const messages = buildSummaryMessages(release, softwareMeta || {});
		const data = await callAI(messages);
		const raw = data?.choices?.[0]?.message?.content || "";
		meta = data?.analysis_meta || null;
		payload = parseAISummary(raw);
	} catch (err) {
		console.error(
			`[SUMMARY] AI 调用失败 software=${softwareId} tag=${release.tag_name}:`,
			err.message,
		);
		payload = null;
	}

	// AI 失败或解析失败：用 fallback
	if (!payload || (!payload.summary && !payload.highlights?.length)) {
		payload = makeFallbackPayload(release, null);
	}

	// 写库（AI 失败也写，避免下次继续重试失败）
	try {
		await pool.query(
			`INSERT INTO release_ai_summaries
			   (software_id, tag_name, summary, highlights, breaking, provider, model)
			 VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
			 ON CONFLICT (software_id, tag_name) DO UPDATE SET
			   summary = EXCLUDED.summary,
			   highlights = EXCLUDED.highlights,
			   breaking = EXCLUDED.breaking,
			   provider = EXCLUDED.provider,
			   model = EXCLUDED.model,
			   generated_at = NOW()`,
			[
				softwareId,
				release.tag_name,
				payload.summary || "",
				JSON.stringify(payload.highlights || []),
				Boolean(payload.breaking),
				meta?.provider || null,
				meta?.model || null,
			],
		);
	} catch (err) {
		console.error("[SUMMARY] 写入 release_ai_summaries 失败:", err.message);
	}

	return {
		summary: payload.summary || "",
		highlights: normalizeHighlights(payload.highlights),
		breaking: Boolean(payload.breaking),
		fromCache: false,
		provider: meta?.provider || null,
		model: meta?.model || null,
	};
}

// ========== Prompt 构造 ==========

function buildSummaryMessages(release, softwareMeta) {
	const softwareName = String(softwareMeta?.name || "未知软件").trim();
	const tag = String(release.tag_name || "").trim();
	const title = String(release.name || tag).trim();
	const body = String(release.body || "").slice(0, 4000); // 防止过长拖垮上下文

	const system = {
		role: "system",
		content: [
			"你是中文技术编辑，任务是把 GitHub Release 的英文/中文更新日志浓缩成面向终端用户的中文摘要。",
			"",
			"必须严格返回 JSON，结构如下，绝不要返回 markdown 或多余说明：",
			'{"summary": "...", "highlights": [{"title": "...", "detail": "..."}], "breaking": false}',
			"",
			"字段要求：",
			"- summary：一到两句中文总结本次更新的核心内容，不超过 100 字",
			"- highlights：3-5 条结构化要点，每条 title 不超过 12 字，detail 不超过 50 字",
			"- breaking：本次更新是否包含破坏性变更（true/false）",
			"",
			"语气要求：直白、对用户有信息量，不要商业吹捧用语。",
		].join("\n"),
	};

	const user = {
		role: "user",
		content: [
			`软件名称: ${softwareName}`,
			`版本号: ${tag}`,
			`Release 标题: ${title}`,
			"",
			"Release 原文：",
			body || "(空)",
		].join("\n"),
	};

	return [system, user];
}

// ========== 解析 ==========

// 尝试从模型输出中提取 JSON，支持被 ```json 包裹
function parseAISummary(rawText) {
	if (!rawText || typeof rawText !== "string") return null;

	let text = rawText.trim();

	// 去除可能的 code fence
	const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fenceMatch) text = fenceMatch[1].trim();

	// 首次尝试直接 parse
	try {
		const obj = JSON.parse(text);
		return normalizePayload(obj);
	} catch (_err) {
		// 继续尝试
	}

	// 退一步：取首个 {...} 块
	const braceStart = text.indexOf("{");
	const braceEnd = text.lastIndexOf("}");
	if (braceStart >= 0 && braceEnd > braceStart) {
		try {
			const obj = JSON.parse(text.slice(braceStart, braceEnd + 1));
			return normalizePayload(obj);
		} catch (_err) {
			return null;
		}
	}
	return null;
}

function normalizePayload(obj) {
	if (!obj || typeof obj !== "object") return null;
	return {
		summary: typeof obj.summary === "string" ? obj.summary.trim() : "",
		highlights: normalizeHighlights(obj.highlights),
		breaking: Boolean(obj.breaking),
	};
}

function normalizeHighlights(value) {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => {
			if (!item || typeof item !== "object") return null;
			const title = typeof item.title === "string" ? item.title.trim() : "";
			const detail = typeof item.detail === "string" ? item.detail.trim() : "";
			if (!title && !detail) return null;
			return { title, detail };
		})
		.filter(Boolean)
		.slice(0, 8);
}

// ========== Fallback ==========

// AI 不可用时，直接取 release body 头部文本当摘要
function makeFallbackPayload(release, _errMsg) {
	const body = String(release?.body || "").trim();
	if (!body) {
		return {
			summary: `${release?.name || release?.tag_name || "新版本"} 已发布`,
			highlights: [],
			breaking: false,
		};
	}
	// 去掉 markdown 标记，保留纯文本语义
	const cleaned = body
		.replace(/```[\s\S]*?```/g, "")
		.replace(/!\[[^\]]*\]\([^)]+\)/g, "")
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/[#*_>`~]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	const summary =
		cleaned.length > 200 ? `${cleaned.slice(0, 200)}...` : cleaned;
	return { summary, highlights: [], breaking: false };
}
