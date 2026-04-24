import type { SoftwareCategory } from "../types";

const neutralTagClass =
	"bg-gray-100/85 text-gray-700 border-gray-200/80 dark:bg-[#252525] dark:text-gray-300 dark:border-white/10";

const primaryTagClass =
	"bg-primary/12 text-[hsl(var(--primary-h)_72%_28%)] border-primary/25 dark:bg-primary/[0.16] dark:text-[hsl(var(--primary-h)_74%_82%)] dark:border-primary/[0.28]";

const categoryTagClassMap: Record<SoftwareCategory, string> = {
	社交: neutralTagClass,
	生活: neutralTagClass,
	购物: neutralTagClass,
	影音: neutralTagClass,
	阅读: neutralTagClass,
	休闲: neutralTagClass,
	旅行: neutralTagClass,
	办公: neutralTagClass,
	工具: primaryTagClass,
	编程: primaryTagClass,
	// 插件/脚本共用的功能化分类
	广告拦截: primaryTagClass,
	隐私安全: primaryTagClass,
	样式美化: neutralTagClass,
	下载增强: neutralTagClass,
	生产力: neutralTagClass,
	开发者工具: primaryTagClass,
	自动化: primaryTagClass,
	"AI 增强": primaryTagClass,
	媒体抓取: neutralTagClass,
	其它: neutralTagClass,
};

export const getCategoryTagClass = (
	category?: SoftwareCategory | string | null,
): string => {
	if (!category) {
		return neutralTagClass;
	}

	return categoryTagClassMap[category as SoftwareCategory] ?? neutralTagClass;
};
