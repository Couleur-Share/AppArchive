import { ref } from "vue";

// AI配置接口定义
export interface AIConfig {
	// API配置
	apiBase: string;
	apiKey: string; // 敏感信息，但允许用户设置
	model: string;
	temperature: number;
	maxTokens: number;

	// 提示词配置
	prompts: {
		softwareAnalysis: string;
		comparisonAnalysis: string;
	};
}

// 默认配置（从环境变量或代码中读取）
const defaultConfig: AIConfig = {
	apiBase: import.meta.env.VITE_KIMI_API_BASE || "https://api.moonshot.cn/v1",
	apiKey: import.meta.env.VITE_KIMI_API_KEY || "",
	model: import.meta.env.VITE_KIMI_MODEL || "kimi-k2-turbo-preview",
	temperature: Number(import.meta.env.VITE_KIMI_TEMPERATURE || 0.7),
	maxTokens: Number(import.meta.env.VITE_KIMI_MAX_TOKENS || 1024),
	prompts: {
		softwareAnalysis: `请基于下列软件信息，输出用于快速决策的精准优缺点清单（准确性优先，不要凑数，不要长篇大论）：
名称：{name}
{description}
{category}
{license}

约束：
- pros 与 cons 各输出 0-5 条；只写"有把握"的要点，不要为了凑数编造
- 若暂无可靠要点，可返回空数组
- 仅基于提供信息与行业普遍共识；对不确定的信息不要写
- 每条用短句，具体、可验证，避免空泛词（如"强大""领先"）
- 去重，避免同义重复；按影响从高到低排序
- 仅返回 JSON，不要额外文字、解释、代码块或注释

输出 JSON 模板：
{"pros":[],"cons":[]}`,
		comparisonAnalysis: `请对比这些软件并给出快速选择建议（避免长篇大论，仅列要点）。

软件信息：
{softwares}

输出要求（严格遵守）：
1. 仅使用 Markdown 标题与列表，不要段落描述
2. 每个软件分组输出：先列"优点"，再列"缺点"，各 2-4 条；每条 6-16 字
3. 最后给出"选择建议"，3-5 条，格式为"条件：选**软件名**"
4. 重点词用 **加粗** 标识

输出结构示例：
### 对比要点
- **软件A**
  - 优点：启动快；轻量；上手易
  - 缺点：功能少；插件少
- **软件B**
  - 优点：功能全；生态大
  - 缺点：学习曲线陡

### 选择建议
- 注重简单高效：选**软件A**
- 追求功能全面：选**软件B**
- 预算敏感：选**软件C**`,
	},
};

// localStorage 键名
const STORAGE_KEY = "ai-config";

// 响应式配置状态
const aiConfig = ref<AIConfig>({ ...defaultConfig });

// 从 localStorage 加载配置
export function loadAIConfig(): AIConfig {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const parsed = JSON.parse(saved);
			// 合并默认配置和保存的配置（确保所有字段都存在）
			return {
				...defaultConfig,
				...parsed,
				prompts: {
					...defaultConfig.prompts,
					...parsed.prompts,
				},
			};
		}
	} catch (error) {
		console.error("加载AI配置失败:", error);
	}
	return { ...defaultConfig };
}

// 注意：已移除数据库配置功能，统一使用 prompts.js 文件中的提示词
// 用户的其他配置（如 temperature、maxTokens 等）仅保存在 localStorage

// 保存配置到 localStorage
export function saveAIConfig(config: AIConfig) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		aiConfig.value = { ...config };
	} catch (error) {
		console.error("保存AI配置失败:", error);
		throw error;
	}
}

// 保存配置（统一使用 localStorage）
export async function saveAIConfigAuto(config: AIConfig): Promise<boolean> {
	try {
		saveAIConfig(config);
		return true;
	} catch (error) {
		console.error("保存AI配置失败:", error);
		return false;
	}
}

// 重置为默认配置
export function resetAIConfig() {
	const resetConfig = { ...defaultConfig };
	saveAIConfig(resetConfig);
}

// 初始化：从 localStorage 加载保存的配置
function initAIConfig() {
	aiConfig.value = loadAIConfig();
}

// 初始化配置
initAIConfig();

// 导出配置状态（供其他模块直接使用）
export { aiConfig };

// 导出 composable
export function useAIConfig() {
	return {
		config: aiConfig,
		loadAIConfig,
		saveAIConfig,
		saveAIConfigAuto,
		resetAIConfig,
		defaultConfig,
	};
}
