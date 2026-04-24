/**
 * 批量重跑补丁构造工具
 *
 * 共用方：scripts/rerun-analyze-all.js (CLI)
 *
 * 设计目标：
 *  - 仅回写 4 个新结构化字段 + warnings + analysis_* 元数据
 *  - 不覆盖用户手动编辑过的 description / pros / cons / 链接 / 图标 等字段
 */

/**
 * 从 AI 解析结果与元数据构造软件补丁对象
 * @param {object|null} parsed AI 返回 JSON 解析后的对象
 * @param {object|null} meta analysis_meta 对象（可选）
 * @returns {object} 补丁对象，可直接喂给 PUT /api/software/:id 或 DB 更新逻辑
 */
export function buildRerunPatch(parsed, meta) {
	const patch = {};
	if (!parsed || typeof parsed !== "object") return patch;

	if (typeof parsed.tagline === "string") patch.tagline = parsed.tagline;
	if (Array.isArray(parsed.highlights)) patch.highlights = parsed.highlights;
	if (Array.isArray(parsed.best_for)) patch.best_for = parsed.best_for;
	if (Array.isArray(parsed.avoid_if)) patch.avoid_if = parsed.avoid_if;
	// 安全风险也一并刷新（历史数据可能缺失，刷新后更准确）
	if (Array.isArray(parsed.warnings)) patch.warnings = parsed.warnings;

	if (meta && typeof meta === "object") {
		if (typeof meta.provider === "string")
			patch.analysis_provider = meta.provider;
		if (typeof meta.model === "string") patch.analysis_model = meta.model;
		if (typeof meta.analysis_at === "string")
			patch.analysis_at = meta.analysis_at;
		if (Array.isArray(meta.sources)) patch.analysis_sources = meta.sources;
	}

	return patch;
}
