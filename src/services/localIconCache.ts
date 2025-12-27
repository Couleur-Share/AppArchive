import { ref } from "vue";

// 本地图标缓存管理
const iconCache = ref<Map<string, string>>(new Map());

// 默认占位图标
const DEFAULT_PLACEHOLDER = "/icons/placeholder.svg";

// 常用的错误占位图标
const ERROR_PLACEHOLDER =
	"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTYiIGZpbGw9IiNGRUY5RkYiLz4KPHBhdGggZD0iTTMyIDIwQzM3LjUyMjggMjAgNDIgMjQuNDc3MiA0MiAzMEM0MiAzNS41MjI4IDM3LjUyMjggNDAgMzIgNDBDMjYuNDc3MiA0MCAyMiAzNS41MjI4IDIyIDMwQzIyIDI0LjQ3NzIgMjYuNDc3MiAyMCAzMiAyMFoiIGZpbGw9IiNGRUY5RkYiLz4KPHBhdGggZD0iTTMyIDQ0QzM4LjYyNzQgNDQgNDQgMzguNjI3NCA0NCAzMkM0NCAyNS4zNzI2IDM4LjYyNzQgMjAgMzIgMjBDMjUuMzcyNiAyMCAyMCAyNS4zNzI2IDIwIDMyQzIwIDM4LjYyNzQgMjUuMzcyNiA0NCAzMiA0NFoiIHN0cm9rZT0iI0Y1NzlBQSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTI4IDI4TDM2IDM2IiBzdHJva2U9IiNGNTc5QUEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0zNiAyOEwyOCAzNiIgc3Ryb2tlPSIjRjU3OUFBIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K";

/**
 * 获取软件图标URL
 * @param iconPath 图标路径（仅支持COS URL）
 * @returns 处理后的图标URL
 */
export const getIconUrl = (iconPath: string | null | undefined): string => {
	if (!iconPath) {
		return DEFAULT_PLACEHOLDER;
	}

	// 只支持COS URL（腾讯云对象存储）
	if (iconPath.startsWith("https://") || iconPath.startsWith("http://")) {
		// 验证是否为COS URL
		if (
			iconPath.includes("cos.ap-guangzhou.myqcloud.com") ||
			iconPath.includes("cos.") ||
			iconPath.includes("myqcloud.com")
		) {
			return iconPath;
		}
		// 其他HTTP URL返回占位图
		return DEFAULT_PLACEHOLDER;
	}

	// 不支持本地路径，返回占位图标
	return DEFAULT_PLACEHOLDER;
};

/**
 * 获取错误占位图标
 * @returns 错误占位图标URL
 */
export const getErrorPlaceholder = (): string => {
	return ERROR_PLACEHOLDER;
};

/**
 * 预加载图标
 * @param iconPath 图标路径
 * @returns Promise<boolean> 是否加载成功
 */
export const preloadIcon = (iconPath: string): Promise<boolean> => {
	return new Promise((resolve) => {
		const img = new Image();

		img.onload = () => {
			iconCache.value.set(iconPath, "loaded");
			resolve(true);
		};

		img.onerror = () => {
			iconCache.value.set(iconPath, "error");
			resolve(false);
		};

		img.src = getIconUrl(iconPath);
	});
};

/**
 * 批量预加载图标
 * @param iconPaths 图标路径数组
 * @returns Promise<number> 成功加载的数量
 */
export const preloadIcons = async (iconPaths: string[]): Promise<number> => {
	const results = await Promise.allSettled(
		iconPaths.map((path) => preloadIcon(path)),
	);

	return results.filter(
		(result) => result.status === "fulfilled" && result.value === true,
	).length;
};

/**
 * 检查图标是否已加载
 * @param iconPath 图标路径
 * @returns 加载状态
 */
export const getIconLoadStatus = (
	iconPath: string,
): "loaded" | "error" | "pending" => {
	const status = iconCache.value.get(iconPath);
	return status === "loaded"
		? "loaded"
		: status === "error"
			? "error"
			: "pending";
};

/**
 * 清除图标缓存
 */
export const clearIconCache = (): void => {
	iconCache.value.clear();
};

/**
 * 获取图标缓存大小
 * @returns 缓存项数量
 */
export const getIconCacheSize = (): number => {
	return iconCache.value.size;
};
