import logger from "./logger";

// 通过环境变量控制是否输出性能相关日志
const ENABLE_PERFORMANCE_LOGS =
	import.meta.env.VITE_ENABLE_PERF_LOGS === "true";
export const performanceMonitor = {
	startTime: 0,

	start() {
		this.startTime = performance.now();
	},

	end(operation: string) {
		const duration = performance.now() - this.startTime;
		if (ENABLE_PERFORMANCE_LOGS) {
			logger.debug(`${operation} 耗时: ${duration.toFixed(2)}ms`);
		}
		return duration;
	},

	async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
		this.start();
		const result = await fn();
		this.end(operation);
		return result;
	},
};

// 滚动性能监控
export const scrollPerformanceMonitor = {
	isMonitoring: false,
	frameCount: 0,
	lastTimestamp: 0,
	fps: 0,

	start() {
		if (this.isMonitoring) return;

		this.isMonitoring = true;
		this.frameCount = 0;
		this.lastTimestamp = performance.now();

		const measureFrame = (timestamp: number) => {
			if (!this.isMonitoring) return;

			this.frameCount++;
			const elapsed = timestamp - this.lastTimestamp;

			if (elapsed >= 1000) {
				this.fps = Math.round((this.frameCount * 1000) / elapsed);
				if (ENABLE_PERFORMANCE_LOGS) {
					logger.debug(`滚动 FPS: ${this.fps}`);
				}

				// 检测性能问题
				if (this.fps < 30) {
					if (ENABLE_PERFORMANCE_LOGS) {
						logger.warn("⚠️ 滚动性能较差，建议检查以下问题：");
						logger.warn("1. 减少 backdrop-blur 效果");
						logger.warn("2. 启用虚拟滚动");
						logger.warn("3. 优化图片加载");
						logger.warn("4. 减少复杂动画");
					}
				}

				this.frameCount = 0;
				this.lastTimestamp = timestamp;
			}

			requestAnimationFrame(measureFrame);
		};

		requestAnimationFrame(measureFrame);
	},

	stop() {
		this.isMonitoring = false;
	},
};

// 内存监控
export const memoryMonitor = {
	logMemoryUsage() {
		if ("memory" in performance) {
			const memory = (performance as any).memory;
			if (ENABLE_PERFORMANCE_LOGS)
				logger.debug("内存使用情况：", {
					used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
					total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
					limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
				});
		}
	},

	checkMemoryLeaks() {
		const usage = this.getMemoryUsage();
		if (usage > 100) {
			if (ENABLE_PERFORMANCE_LOGS) {
				logger.warn("⚠️ 内存使用过高，可能存在内存泄漏");
			}
		}
	},

	getMemoryUsage(): number {
		if ("memory" in performance) {
			const memory = (performance as any).memory;
			return Math.round(memory.usedJSHeapSize / 1024 / 1024);
		}
		return 0;
	},
};

// DOM 性能监控
export const domPerformanceMonitor = {
	observeElementCount() {
		const elementCount = document.getElementsByTagName("*").length;
		if (ENABLE_PERFORMANCE_LOGS) logger.debug(`DOM 元素数量: ${elementCount}`);

		if (elementCount > 1000) {
			if (ENABLE_PERFORMANCE_LOGS)
				logger.warn("⚠️ DOM 元素过多，建议启用虚拟滚动");
		}
	},

	observeImageLoading() {
		const images = document.querySelectorAll("img");
		let loadedCount = 0;

		images.forEach((img) => {
			if (img.complete) {
				loadedCount++;
			}
		});

		if (ENABLE_PERFORMANCE_LOGS)
			logger.debug(`图片加载情况: ${loadedCount}/${images.length}`);
	},
};

// 综合性能检查
export const performanceChecker = {
	runFullCheck() {
		if (ENABLE_PERFORMANCE_LOGS) logger.debug("🔍 开始性能检查...");

		// 检查 DOM 元素数量
		domPerformanceMonitor.observeElementCount();

		// 检查内存使用
		memoryMonitor.logMemoryUsage();

		// 检查图片加载
		domPerformanceMonitor.observeImageLoading();

		// 检查滚动性能
		scrollPerformanceMonitor.start();

		// 5秒后停止监控
		setTimeout(() => {
			scrollPerformanceMonitor.stop();
			if (ENABLE_PERFORMANCE_LOGS) logger.debug("✅ 性能检查完成");
		}, 5000);
	},
};

// 开发环境性能提示
export const devPerformanceTips = {
	checkForCommonIssues() {
		// 检查是否使用了过多的模糊效果
		const blurElements = document.querySelectorAll('[class*="backdrop-blur"]');
		if (blurElements.length > 5) {
			if (ENABLE_PERFORMANCE_LOGS)
				logger.warn("⚠️ 检测到过多的模糊效果，这可能影响滚动性能");
		}

		// 检查是否有未优化的图片
		const images = document.querySelectorAll('img:not([loading="lazy"])');
		if (images.length > 3) {
			if (ENABLE_PERFORMANCE_LOGS)
				logger.warn('⚠️ 检测到未启用懒加载的图片，建议添加 loading="lazy"');
		}

		// 检查是否有过多的动画
		const animatedElements = document.querySelectorAll(
			'[class*="transition-all"]',
		);
		if (animatedElements.length > 10) {
			if (ENABLE_PERFORMANCE_LOGS)
				logger.warn("⚠️ 检测到过多的 transition-all，建议使用具体的过渡属性");
		}
	},
};
