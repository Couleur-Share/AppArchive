import type {
	AIService,
	ComparisonService,
	SoftwareService,
} from "../types/services";
import { aiService } from "./ai";
import { comparisonService } from "./comparison";
import { softwareService } from "./software";

export const serviceFactory = {
	getAIService(): AIService {
		return aiService;
	},

	getSoftwareService(): SoftwareService {
		return softwareService;
	},

	getComparisonService(): ComparisonService {
		return comparisonService;
	},
};

// 导出服务实例
export const services = {
	ai: serviceFactory.getAIService(),
	software: serviceFactory.getSoftwareService(),
	comparison: serviceFactory.getComparisonService(),
};
