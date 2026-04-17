import type { SoftwareListItem } from "./index";

export interface ComparisonGroup {
	id: number;
	name: string;
	description: string;
	created_at: string;
	updated_at: string;
}

export interface ComparisonTarget {
	id: number;
	target_id: number;
	group_id: number;
	created_at: string;
	target: SoftwareListItem;
	group: ComparisonGroup;
}

// 结构化对比分析：单软件在某维度上的评分
export interface DimensionRating {
	score: number; // 1-5 整数评分
	comment: string; // 对应该分值的简短评价（10-25 字）
}

// 对比维度（横向打分：一个维度下每个软件一行评分）
export interface ComparisonDimension {
	name: string; // 维度名，例如 "性能表现"、"易用性"、"生态完整度"
	ratings: Record<string, DimensionRating>; // key 为软件名
}

// 核心差异条目
export interface ComparisonDifference {
	title: string; // 差异主题（短标题）
	description: string; // 具体说明
}

// 场景推荐条目
export interface ComparisonScenario {
	scenario: string; // 场景/人群描述
	recommendation: string; // 推荐的软件名
	reason: string; // 推荐理由
}

// 完整结构化对比分析
export interface ComparisonAnalysis {
	verdict: string; // 一句话总结性建议（30-60 字）
	dimensions: ComparisonDimension[]; // 4-6 个横向维度
	key_differences: ComparisonDifference[]; // 3-5 条核心差异
	scenarios: ComparisonScenario[]; // 3-5 条场景推荐
}
