// 可复用的系统、许可证、分类、形态常量
// 使用 as const 以便与 zod 的 z.enum 直接协作

import type { SoftwareKind, SystemType } from "./base";
import type { AppCategory, ExtCategory, SoftwareCategory } from "./software";

// 全量运行环境：OS 6 项 + 浏览器 4 项 + 脚本宿主 3 项
export const SYSTEMS = [
	"Windows",
	"macOS",
	"Linux",
	"Android",
	"iOS",
	"HarmonyOS",
	"Chrome",
	"Edge",
	"Firefox",
	"Safari",
	"Tampermonkey",
	"Violentmonkey",
	"ScriptCat",
] as const;

// 按形态分组的运行环境候选集
export const OS_SYSTEMS = [
	"Windows",
	"macOS",
	"Linux",
	"Android",
	"iOS",
	"HarmonyOS",
] as const satisfies readonly SystemType[];

export const BROWSER_SYSTEMS = [
	"Chrome",
	"Edge",
	"Firefox",
	"Safari",
] as const satisfies readonly SystemType[];

export const USERSCRIPT_HOSTS = [
	"Tampermonkey",
	"Violentmonkey",
	"ScriptCat",
] as const satisfies readonly SystemType[];

// 许可证
export const LICENSES = ["免费", "收费", "开源", "已购"] as const;

// 形态
export const KINDS = ["app", "extension", "userscript"] as const;

// 应用分类（桌面/移动应用，生活化口径）
export const APP_CATEGORIES = [
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
] as const satisfies readonly AppCategory[];

// 插件/脚本共用分类（功能化口径，10 项）
export const EXT_CATEGORIES = [
	"广告拦截",
	"隐私安全",
	"样式美化",
	"下载增强",
	"生产力",
	"开发者工具",
	"自动化",
	"AI 增强",
	"媒体抓取",
	"其它",
] as const satisfies readonly ExtCategory[];

// 按形态获取候选分类
export const getCategoriesByKind = (
	kind: SoftwareKind | string | undefined | null,
): readonly SoftwareCategory[] => {
	if (kind === "extension" || kind === "userscript") {
		return EXT_CATEGORIES;
	}
	return APP_CATEGORIES;
};

// 按形态获取候选运行环境
export const getSystemsByKind = (
	kind: SoftwareKind | string | undefined | null,
): readonly SystemType[] => {
	if (kind === "extension") {
		return BROWSER_SYSTEMS;
	}
	if (kind === "userscript") {
		return USERSCRIPT_HOSTS;
	}
	return OS_SYSTEMS;
};

// 规整外部传入的 kind，非法值统一归为 'app'
export const normalizeKind = (
	kind: string | undefined | null,
): SoftwareKind => {
	if (kind === "extension" || kind === "userscript") {
		return kind;
	}
	return "app";
};
