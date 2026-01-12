import { computed, ref, watch } from "vue";
import {
	getIconUrl,
	getSignedUrlCache,
	refreshSignedUrl,
} from "../services/localIconCache";

// 默认占位图标
const DEFAULT_PLACEHOLDER = "/icons/placeholder.svg";

/**
 * 响应式图标 URL composable
 * 用于在组件中获取图标 URL，并自动响应签名 URL 缓存的变化
 *
 * @param iconPath 图标路径（可以是 ref 或 computed）
 * @returns 响应式的图标 URL
 */
export function useIconUrl(
	iconPath: string | null | undefined | (() => string | null | undefined),
) {
	const signedUrlCache = getSignedUrlCache();

	// 将 iconPath 转换为响应式值
	const path = computed(() => {
		if (typeof iconPath === "function") {
			return iconPath();
		}
		return iconPath;
	});

	// 用于强制更新的计数器
	const updateCounter = ref(0);

	// 监听签名 URL 缓存的变化
	watch(
		() => {
			const p = path.value;
			if (!p) return null;
			// 触发响应式追踪
			return signedUrlCache.get(p);
		},
		() => {
			// 签名 URL 更新时，增加计数器触发重新计算
			updateCounter.value++;
		},
	);

	// 计算图标 URL
	const iconUrl = computed(() => {
		// 依赖 updateCounter 来触发重新计算
		const _ = updateCounter.value;
		const p = path.value;
		if (!p) return DEFAULT_PLACEHOLDER;
		return getIconUrl(p);
	});

	// 刷新签名 URL（当图片加载失败时调用）
	const refresh = () => {
		const p = path.value;
		if (p) {
			refreshSignedUrl(p);
			updateCounter.value++;
		}
	};

	return {
		iconUrl,
		refresh,
	};
}

/**
 * 批量获取响应式图标 URL
 * 用于列表组件中批量获取图标 URL
 *
 * @param iconPaths 图标路径数组（可以是 ref 或 computed）
 * @returns 响应式的图标 URL 映射
 */
export function useIconUrls(
	iconPaths:
		| (string | null | undefined)[]
		| (() => (string | null | undefined)[]),
) {
	const signedUrlCache = getSignedUrlCache();

	// 将 iconPaths 转换为响应式值
	const paths = computed(() => {
		if (typeof iconPaths === "function") {
			return iconPaths();
		}
		return iconPaths;
	});

	// 用于强制更新的计数器
	const updateCounter = ref(0);

	// 监听签名 URL 缓存的变化
	watch(
		signedUrlCache,
		() => {
			updateCounter.value++;
		},
		{ deep: true },
	);

	// 计算图标 URL 映射
	const iconUrls = computed(() => {
		// 依赖 updateCounter 来触发重新计算
		const _ = updateCounter.value;
		const result = new Map<string, string>();
		for (const p of paths.value) {
			if (p) {
				result.set(p, getIconUrl(p));
			}
		}
		return result;
	});

	return {
		iconUrls,
		getUrl: (path: string | null | undefined) => {
			if (!path) return DEFAULT_PLACEHOLDER;
			return iconUrls.value.get(path) || DEFAULT_PLACEHOLDER;
		},
	};
}
