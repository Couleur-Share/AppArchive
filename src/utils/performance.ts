import logger from "./logger";

/**
 * 开发环境性能提示工具
 * 用于检查常见的性能问题并给出提示
 */
export const devPerformanceTips = {
	checkForCommonIssues: () => {
		logger.debug("正在检查常见性能问题...");
		// TODO: 实现具体的性能检查逻辑
		// 例如：检查是否存在过大的图片、过多的 DOM 元素、重复的 API 请求等
	},
};

/**
 * 性能检查器
 * 用于运行完整的性能检查
 */
export const performanceChecker = {
	runFullCheck: () => {
		logger.debug("正在运行完整性能检查...");
		// TODO: 实现完整的性能检查逻辑
		// 例如：使用 Performance API 收集指标、分析渲染性能等
		if (window.performance) {
			const navigationEntry = performance.getEntriesByType(
				"navigation",
			)[0] as PerformanceNavigationTiming;
			if (navigationEntry) {
				logger.debug(`页面加载耗时: ${navigationEntry.loadEventEnd}ms`);
				logger.debug(`DOM 解析耗时: ${navigationEntry.domInteractive}ms`);
			}
		}
	},
};

export default {
	devPerformanceTips,
	performanceChecker,
};
