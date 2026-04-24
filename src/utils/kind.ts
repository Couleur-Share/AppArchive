import type { SoftwareKind } from "@/types";

// kind 对外中文标签
const kindLabelMap: Record<SoftwareKind, string> = {
	app: "应用",
	extension: "插件",
	userscript: "脚本",
};

// kind 的代表性 emoji 图标（tab 与徽章使用）
const kindIconMap: Record<SoftwareKind, string> = {
	app: "📦",
	extension: "🧩",
	userscript: "📜",
};

// kind 徽章配色：
// - app: neutral，视觉与默认一致
// - extension: info-blue，匹配设计系统 announcement blue
// - userscript: violet，与 license "已购" 同色系但语义不同路径
const kindTagClassMap: Record<SoftwareKind, string> = {
	app: "bg-gray-100/85 text-gray-700 border-gray-200/80 dark:bg-[#252525] dark:text-gray-300 dark:border-white/10",
	extension:
		"bg-[#539df5]/12 text-[#2563eb] border-[#539df5]/30 dark:bg-[#539df5]/[0.18] dark:text-[#93c5fd] dark:border-[#539df5]/35",
	userscript:
		"bg-violet-500/12 text-violet-700 border-violet-500/30 dark:bg-violet-500/[0.18] dark:text-violet-300 dark:border-violet-500/35",
};

export const getKindLabel = (
	kind?: SoftwareKind | string | null,
): string => {
	if (!kind) return kindLabelMap.app;
	return kindLabelMap[kind as SoftwareKind] ?? kindLabelMap.app;
};

export const getKindIcon = (kind?: SoftwareKind | string | null): string => {
	if (!kind) return kindIconMap.app;
	return kindIconMap[kind as SoftwareKind] ?? kindIconMap.app;
};

export const getKindTagClass = (
	kind?: SoftwareKind | string | null,
): string => {
	if (!kind) return kindTagClassMap.app;
	return kindTagClassMap[kind as SoftwareKind] ?? kindTagClassMap.app;
};

// 将外部（可能为空/非法）kind 规整为合法值，默认 'app'
export const normalizeKind = (
	kind?: string | null,
): SoftwareKind => {
	if (kind === "extension" || kind === "userscript") return kind;
	return "app";
};
