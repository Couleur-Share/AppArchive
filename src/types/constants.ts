// 可复用的系统与许可证常量
// 使用 as const 以便与 zod 的 z.enum 直接协作

export const SYSTEMS = [
	"Windows",
	"Linux",
	"Android",
	"iOS",
	"HarmonyOS",
] as const;

export const LICENSES = ["免费", "收费", "开源", "已购"] as const;
