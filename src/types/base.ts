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

// 系统类型（已移除 macOS）
export type SystemType = "Windows" | "Linux" | "Android" | "iOS" | "HarmonyOS";

// 许可证类型
export type LicenseType = "免费" | "收费" | "开源" | "已购";
