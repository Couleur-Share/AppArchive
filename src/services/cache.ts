import { Storage } from "@plasmohq/storage";
import type { Software } from "../types";

const storage = new Storage();
const CACHE_PREFIX = "ai_analysis_";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

interface CacheItem<T> {
	data: T;
	timestamp: number;
}

export const cacheService = {
	async set<T>(key: string, data: T): Promise<void> {
		const cacheItem: CacheItem<T> = {
			data,
			timestamp: Date.now(),
		};
		await storage.set(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheItem));
	},

	async get<T>(key: string): Promise<T | null> {
		const cached = await storage.get(`${CACHE_PREFIX}${key}`);
		if (!cached) return null;

		const cacheItem: CacheItem<T> = JSON.parse(cached);
		if (Date.now() - cacheItem.timestamp > CACHE_DURATION) {
			await this.remove(key);
			return null;
		}

		return cacheItem.data;
	},

	async remove(key: string): Promise<void> {
		await storage.remove(`${CACHE_PREFIX}${key}`);
	},

	// 软件分析缓存
	async getAnalysisCache(software: Software) {
		return this.get<{
			description?: string;
			pros: string[];
			cons: string[];
			systems?: string[];
		}>(`analysis_${software.id}`);
	},

	async setAnalysisCache(
		software: Software,
		result: {
			description?: string;
			pros: string[];
			cons: string[];
			systems?: string[];
		},
	) {
		return this.set(`analysis_${software.id}`, result);
	},

	// 比较分析缓存
	async getComparisonCache(softwareIds: number[]) {
		const key = `comparison_${softwareIds.sort().join("_")}`;
		return this.get<string>(key);
	},

	async setComparisonCache(softwareIds: number[], result: string) {
		const key = `comparison_${softwareIds.sort().join("_")}`;
		return this.set(key, result);
	},
};
