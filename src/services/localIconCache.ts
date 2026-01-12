import { ref } from "vue";
import { buildApiUrl } from "./apiBase";

// 签名 URL 缓存
const signedUrlCache = new Map<string, string>();

// 缓存版本号（用于触发响应式更新）
// 每次缓存更新时递增，组件可以 watch 这个值来响应变化
const cacheVersion = ref(0);

// 签名 URL 获取状态（避免重复请求）
const pendingRequests = new Map<string, Promise<string | null>>();

// 签名 URL 缓存时间戳（用于判断是否过期）
const cacheTimestamps = new Map<string, number>();

// 签名 URL 缓存有效期（50 分钟，因为签名有效期是 1 小时）
const CACHE_TTL = 50 * 60 * 1000;

// 本地图标缓存管理
const iconCache = ref<Map<string, string>>(new Map());

// 默认占位图标
const DEFAULT_PLACEHOLDER = "/icons/placeholder.svg";

// 常用的错误占位图标
const ERROR_PLACEHOLDER =
	"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTYiIGZpbGw9IiNGRUY5RkYiLz4KPHBhdGggZD0iTTMyIDIwQzM3LjUyMjggMjAgNDIgMjQuNDc3MiA0MiAzMEM0MiAzNS41MjI4IDM3LjUyMjggNDAgMzIgNDBDMjYuNDc3MiA0MCAyMiAzNS41MjI4IDIyIDMwQzIyIDI0LjQ3NzIgMjYuNDc3MiAyMCAzMiAyMFoiIGZpbGw9IiNGRUY5RkYiLz4KPHBhdGggZD0iTTMyIDQ0QzM4LjYyNzQgNDQgNDQgMzguNjI3NCA0NCAzMkM0NCAyNS4zNzI2IDM4LjYyNzQgMjAgMzIgMjBDMjUuMzcyNiAyMCAyMCAyNS4zNzI2IDIwIDMyQzIwIDM4LjYyNzQgMjUuMzcyNiA0NCAzMiA0NFoiIHN0cm9rZT0iI0Y1NzlBQSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTI4IDI4TDM2IDM2IiBzdHJva2U9IiNGNTc5QUEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0zNiAyOEwyOCAzNiIgc3Ryb2tlPSIjRjU3OUFBIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K";

/**
 * 检查是否为 COS URL
 */
function isCosUrl(url: string): boolean {
	return (
		url.startsWith("https://") &&
		(url.includes("cos.ap-guangzhou.myqcloud.com") ||
			url.includes("cos.") ||
			url.includes("myqcloud.com"))
	);
}

/**
 * 检查签名 URL 缓存是否过期
 */
function isSignedUrlExpired(originalUrl: string): boolean {
	const timestamp = cacheTimestamps.get(originalUrl);
	if (!timestamp) return true;
	return Date.now() - timestamp > CACHE_TTL;
}

/**
 * 从后端获取签名 URL
 */
async function fetchSignedUrl(originalUrl: string): Promise<string | null> {
	try {
		const response = await fetch(
			`${buildApiUrl("/icon/signed")}?url=${encodeURIComponent(originalUrl)}`,
		);

		if (!response.ok) {
			console.error("获取签名 URL 失败:", response.status);
			return null;
		}

		const data = await response.json();
		if (data.success && data.signedUrl) {
			return data.signedUrl;
		}

		return null;
	} catch (error) {
		console.error("获取签名 URL 请求失败:", error);
		return null;
	}
}

/**
 * 获取签名 URL（带缓存和去重）
 */
async function getSignedUrlWithCache(
	originalUrl: string,
): Promise<string | null> {
	// 检查缓存
	if (!isSignedUrlExpired(originalUrl)) {
		const cached = signedUrlCache.get(originalUrl);
		if (cached) {
			return cached;
		}
	}

	// 检查是否有正在进行的请求
	const pending = pendingRequests.get(originalUrl);
	if (pending) {
		return pending;
	}

	// 发起新请求
	const request = fetchSignedUrl(originalUrl).then((signedUrl) => {
		pendingRequests.delete(originalUrl);

		if (signedUrl) {
			signedUrlCache.set(originalUrl, signedUrl);
			cacheTimestamps.set(originalUrl, Date.now());
			// 递增版本号，触发响应式更新
			cacheVersion.value++;
		}

		return signedUrl;
	});

	pendingRequests.set(originalUrl, request);
	return request;
}

/**
 * 批量获取签名 URL
 */
async function batchFetchSignedUrls(
	urls: string[],
): Promise<Record<string, string | null>> {
	// 过滤出需要获取的 URL（未缓存或已过期）
	const urlsToFetch = urls.filter(
		(url) =>
			isCosUrl(url) &&
			(isSignedUrlExpired(url) || !signedUrlCache.has(url)),
	);

	if (urlsToFetch.length === 0) {
		// 所有 URL 都已缓存
		const results: Record<string, string | null> = {};
		for (const url of urls) {
			results[url] = signedUrlCache.get(url) || null;
		}
		return results;
	}

	try {
		const response = await fetch(buildApiUrl("/icon/signed/batch"), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ urls: urlsToFetch }),
		});

		if (!response.ok) {
			console.error("批量获取签名 URL 失败:", response.status);
			return {};
		}

		const data = await response.json();
		if (data.success && data.signedUrls) {
			const now = Date.now();
			let hasUpdates = false;
			for (const [originalUrl, signedUrl] of Object.entries(
				data.signedUrls as Record<string, string | null>,
			)) {
				if (signedUrl) {
					signedUrlCache.set(originalUrl, signedUrl);
					cacheTimestamps.set(originalUrl, now);
					hasUpdates = true;
				}
			}
			// 批量更新完成后递增一次版本号
			if (hasUpdates) {
				cacheVersion.value++;
			}
		}

		// 返回所有请求的 URL 的结果（包括已缓存的）
		const results: Record<string, string | null> = {};
		for (const url of urls) {
			results[url] = signedUrlCache.get(url) || null;
		}
		return results;
	} catch (error) {
		console.error("批量获取签名 URL 请求失败:", error);
		return {};
	}
}

/**
 * 获取软件图标URL（同步版本，用于模板绑定）
 * 对于 COS URL，会返回缓存的签名 URL 或占位图，并在后台异步获取签名 URL
 * @param iconPath 图标路径（仅支持COS URL）
 * @returns 处理后的图标URL
 */
export const getIconUrl = (iconPath: string | null | undefined): string => {
	if (!iconPath) {
		return DEFAULT_PLACEHOLDER;
	}

	// 检查是否为 COS URL
	if (isCosUrl(iconPath)) {
		// 检查是否有缓存的签名 URL（且未过期）
		if (!isSignedUrlExpired(iconPath)) {
			const cached = signedUrlCache.get(iconPath);
			if (cached) {
				return cached;
			}
		}

		// 异步获取签名 URL（不阻塞）
		getSignedUrlWithCache(iconPath);

		// 返回占位图，等签名 URL 获取后会自动更新
		return DEFAULT_PLACEHOLDER;
	}

	// 其他 HTTP URL 返回占位图
	if (iconPath.startsWith("https://") || iconPath.startsWith("http://")) {
		return DEFAULT_PLACEHOLDER;
	}

	// 不支持本地路径，返回占位图标
	return DEFAULT_PLACEHOLDER;
};

/**
 * 获取软件图标URL（异步版本，确保返回有效URL）
 * @param iconPath 图标路径
 * @returns 处理后的图标URL
 */
export const getIconUrlAsync = async (
	iconPath: string | null | undefined,
): Promise<string> => {
	if (!iconPath) {
		return DEFAULT_PLACEHOLDER;
	}

	if (isCosUrl(iconPath)) {
		const signedUrl = await getSignedUrlWithCache(iconPath);
		return signedUrl || DEFAULT_PLACEHOLDER;
	}

	return DEFAULT_PLACEHOLDER;
};

/**
 * 预加载图标的签名 URL（批量）
 * 在获取软件列表后调用此方法，可以提前获取所有图标的签名 URL
 * @param iconPaths 图标路径数组
 */
export const preloadSignedUrls = async (iconPaths: string[]): Promise<void> => {
	const cosUrls = iconPaths.filter(
		(path) => path && typeof path === "string" && isCosUrl(path),
	);

	if (cosUrls.length === 0) return;

	await batchFetchSignedUrls(cosUrls);
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
export const preloadIcon = async (iconPath: string): Promise<boolean> => {
	// 先获取签名 URL（如果是 COS URL）
	const url = await getIconUrlAsync(iconPath);

	return new Promise((resolve) => {
		const img = new Image();
		// 设置 referrerPolicy 以确保发送 Referer 头，适配 COS 防盗链
		img.referrerPolicy = "origin";

		img.onload = () => {
			iconCache.value.set(iconPath, "loaded");
			resolve(true);
		};

		img.onerror = () => {
			iconCache.value.set(iconPath, "error");
			resolve(false);
		};

		img.src = url;
	});
};

/**
 * 批量预加载图标
 * @param iconPaths 图标路径数组
 * @returns Promise<number> 成功加载的数量
 */
export const preloadIcons = async (iconPaths: string[]): Promise<number> => {
	// 先批量获取签名 URL
	await preloadSignedUrls(iconPaths);

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
	signedUrlCache.clear();
	cacheTimestamps.clear();
	pendingRequests.clear();
};

/**
 * 获取图标缓存大小
 * @returns 缓存项数量
 */
export const getIconCacheSize = (): number => {
	return iconCache.value.size;
};

/**
 * 获取缓存版本号（响应式 ref）
 * 组件可以通过 watch 这个版本号来响应签名 URL 的变化
 */
export const getCacheVersion = () => cacheVersion;

/**
 * 获取签名 URL 缓存
 * 返回原始的 Map 对象，用于直接读取缓存的签名 URL
 */
export const getSignedUrlCache = () => signedUrlCache;

/**
 * 刷新签名 URL（当图片加载失败时调用）
 * 清除该 URL 的缓存，下次调用 getIconUrl 时会重新获取
 */
export const refreshSignedUrl = (originalUrl: string): void => {
	signedUrlCache.delete(originalUrl);
	cacheTimestamps.delete(originalUrl);
};
