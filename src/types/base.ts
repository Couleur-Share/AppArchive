// 基础实体接口
export interface BaseEntity {
	id: number;
	created_at: string;
	updated_at?: string;
}

// 通用状态类型
export type Status = "active" | "inactive" | "deleted";
export type LoadingState = "idle" | "loading" | "success" | "error";
export type ComparisonStatus = "pending" | "analyzing" | "completed" | "error";
export type ImportStatus = "idle" | "importing" | "success" | "error";

// 运行环境类型：
// - 操作系统：Windows / macOS / Linux / Android / iOS / HarmonyOS
// - 浏览器（面向 extension 条目）：Chrome / Edge / Firefox / Safari
// - 脚本宿主（面向 userscript 条目）：Tampermonkey / Violentmonkey / ScriptCat
export type SystemType =
	| "Windows"
	| "macOS"
	| "Linux"
	| "Android"
	| "iOS"
	| "HarmonyOS"
	| "Chrome"
	| "Edge"
	| "Firefox"
	| "Safari"
	| "Tampermonkey"
	| "Violentmonkey"
	| "ScriptCat";

// 软件形态：app（桌面/移动应用）/ extension（浏览器插件）/ userscript（用户脚本）
export type SoftwareKind = "app" | "extension" | "userscript";

// 许可证类型
export type LicenseType = "免费" | "收费" | "开源" | "已购";
