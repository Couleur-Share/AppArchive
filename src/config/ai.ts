// 导入AI配置（从composable中导出配置状态）
import { aiConfig } from "../composables/useAIConfig";
import type { Software } from "../types";

// 导出配置对象（响应式，会自动更新）
export const AI_CONFIG = {
	get API_KEY() {
		return aiConfig.value.apiKey;
	},
	get API_BASE() {
		return aiConfig.value.apiBase;
	},
	get MODEL() {
		return aiConfig.value.model;
	},
	get MAX_TOKENS() {
		return aiConfig.value.maxTokens;
	},
	get TEMPERATURE() {
		return aiConfig.value.temperature;
	},
	RETRY_TIMES: 3,
	TIMEOUT: 30000,
};

// 提示词模板函数
export const AI_PROMPTS = {
	softwareAnalysis: (software: Software) => {
		const template = aiConfig.value.prompts.softwareAnalysis;
		return template
			.replace("{name}", software.name || "")
			.replace(
				"{description}",
				software.description ? `描述：${software.description}` : "",
			)
			.replace(
				"{category}",
				software.category ? `类别：${software.category}` : "",
			)
			.replace(
				"{license}",
				software.license ? `授权：${software.license}` : "",
			);
	},

	comparisonAnalysis: (softwares: Software[]) => {
		const template = aiConfig.value.prompts.comparisonAnalysis;
		const softwaresText = softwares
			.map((s, index) => `${index + 1}. ${s.name}（${s.description || ""}）`)
			.join("\n");
		return template.replace("{softwares}", softwaresText);
	},
};
