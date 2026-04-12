import type { SecretKind } from "../types";

// 将后端的私密类型标识映射为中文标签
export const getSecretKindLabel = (kind: SecretKind): string => {
	switch (kind) {
		case "license":
			return "激活码";
		case "account":
			return "账号";
		case "config":
			return "配置";
		default:
			return "其他";
	}
};

// 返回用于徽章展示的样式类（Tailwind 类名）
export const getSecretKindClass = (kind: SecretKind): string => {
	switch (kind) {
		case "license":
			return "bg-primary/12 dark:bg-primary/[0.16] text-[hsl(var(--primary-h)_72%_28%)] dark:text-[hsl(var(--primary-h)_74%_82%)] border border-primary/20 dark:border-primary/24";
		case "account":
			return "bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 border border-gray-200/70 dark:border-white/10";
		case "config":
			return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-700/50";
		default:
			return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50";
	}
};
