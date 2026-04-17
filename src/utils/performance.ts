import logger from "./logger";

/**
 * 开发环境性能提示工具
 * 用于检查常见的性能问题并给出提示
 */
export const devPerformanceTips = {
	checkForCommonIssues: () => {
		console.group("🚀 [Performance] 性能审计报告 (Audit Report)");

		// 1. 检查 DOM 元素数量
		const domCount = document.getElementsByTagName("*").length;
		if (domCount > 1500) {
			console.warn(`[Performance] DOM 元素过多: ${domCount} (建议 < 1500)`);
		} else {
			console.log(`[Performance] DOM 元素数量: ${domCount}`);
		}

		// 2. 检查未压缩或过大的资源
		const entries = performance.getEntriesByType(
			"resource",
		) as PerformanceResourceTiming[];
		const largeResources = entries.filter((e) => e.transferSize > 500 * 1024); // > 500KB
		if (largeResources.length > 0) {
			console.warn(
				"[Performance] 检测到大资源请求:",
				largeResources.map((e) => ({
					name: e.name,
					size: `${(e.transferSize / 1024).toFixed(2)} KB`,
				})),
			);
		}

		// 3. 检查是否有重复的 API 请求
		const apiRequests = entries.filter((e) => e.name.includes("/api/"));
		const counts = apiRequests.reduce(
			(acc, req) => {
				acc[req.name] = (acc[req.name] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);
		const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);
		if (duplicates.length > 0) {
			console.warn("[Performance] 检测到重复的 API 请求:", duplicates);
		}

		console.groupEnd();
	},
};

/**
 * 性能检查器
 * 用于运行完整的性能检查
 */
export const performanceChecker = {
	runFullCheck: () => {
		if (!window.performance) return;

		console.log("[Performance] 正在收集 Web Vitals 指标...");

		const timing = window.performance.timing;
		const navigationEntry = performance.getEntriesByType(
			"navigation",
		)[0] as PerformanceNavigationTiming;

		const metrics: Record<string, string | number> = {
			"[Performance] DOM 解析时间": `${(navigationEntry ? navigationEntry.domInteractive : timing.domInteractive - timing.navigationStart).toFixed(2)}ms`,
			"[Performance] 页面完全加载": `${(navigationEntry ? navigationEntry.loadEventEnd : timing.loadEventEnd - timing.navigationStart).toFixed(2)}ms`,
			"[Performance] TTFB (首字节)": `${(navigationEntry ? navigationEntry.responseStart : timing.responseStart - timing.navigationStart).toFixed(2)}ms`,
			"[Performance] 白屏时间 (FP)": "等待中...",
			"[Performance] 首屏时间 (FCP)": "等待中...",
		};

		let hasPrinted = false;
		const printMetrics = () => {
			if (hasPrinted) return;

			// 兜底逻辑：如果 FP 缺失但 FCP 存在，尝试直接从 performance 对象获取
			if (metrics["[Performance] 白屏时间 (FP)"] === "等待中...") {
				const fpEntry = performance.getEntriesByName("first-paint")[0];
				if (fpEntry)
					metrics["[Performance] 白屏时间 (FP)"] =
						`${fpEntry.startTime.toFixed(2)}ms`;
			}
			if (metrics["[Performance] 首屏时间 (FCP)"] === "等待中...") {
				const fcpEntry = performance.getEntriesByName(
					"first-contentful-paint",
				)[0];
				if (fcpEntry)
					metrics["[Performance] 首屏时间 (FCP)"] =
						`${fcpEntry.startTime.toFixed(2)}ms`;
			}

			console.table(metrics);
			hasPrinted = true;
		};

		// 1. 定义获取指标的函数
		const updateMetrics = (entries: PerformanceEntry[]) => {
			entries.forEach((entry) => {
				if (entry.name === "first-paint") {
					metrics["[Performance] 白屏时间 (FP)"] =
						`${entry.startTime.toFixed(2)}ms`;
				} else if (entry.name === "first-contentful-paint") {
					metrics["[Performance] 首屏时间 (FCP)"] =
						`${entry.startTime.toFixed(2)}ms`;
				}
			});
		};

		// 2. 初始获取并启动观察者
		updateMetrics(performance.getEntriesByType("paint"));

		const observer = new PerformanceObserver((list) => {
			updateMetrics(list.getEntries());
			// 监听到新条目时尝试打印（如果已经有足够数据）
			if (metrics["[Performance] 首屏时间 (FCP)"] !== "等待中...") {
				printMetrics();
			}
		});

		try {
			observer.observe({ type: "paint", buffered: true });
		} catch (e) {
			// fallback
		}

		// 3. 200ms 后强制打印一次（处理所有情况，确保不漏掉也不重复）
		setTimeout(printMetrics, 200);
	},
};

export default {
	devPerformanceTips,
	performanceChecker,
};
