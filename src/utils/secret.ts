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
			return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50";
		case "account":
			return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50";
		case "config":
			return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-700/50";
		default:
			return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50";
	}
};
