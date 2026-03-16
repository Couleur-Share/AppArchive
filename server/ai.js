import crypto from "node:crypto";
import { pool } from "./database.js";

// ========== 加密工具（复用 index.js 的 AES-256-GCM 方案） ==========
const SECRET_KEY = (process.env.APP_SECRET_KEY || "dev-secret-key")
	.padEnd(32, "0")
	.slice(0, 32);

function encryptValue(plainText) {
	if (!plainText) return null;
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(SECRET_KEY), iv);
	const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decryptValue(payload) {
	if (!payload) return "";
	const raw = Buffer.from(payload, "base64");
	const iv = raw.slice(0, 12);
	const tag = raw.slice(12, 28);
	const data = raw.slice(28);
	const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(SECRET_KEY), iv);
	decipher.setAuthTag(tag);
	const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
	return decrypted.toString("utf8");
}

// ========== 供应商预置配置 ==========
const PROVIDER_PRESETS = {
	perplexity: {
		name: "Perplexity",
		api_base: "https://api.perplexity.ai",
		models: ["sonar", "sonar-pro", "sonar-reasoning", "sonar-reasoning-pro"],
		default_model: "sonar",
		temperature: 0.6,
		max_tokens: 1024,
		supports_search: true,
	},
	openai: {
		name: "OpenAI",
		api_base: "https://api.openai.com/v1",
		models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "o3-mini"],
		default_model: "gpt-4o-mini",
		temperature: 0.7,
		max_tokens: 2048,
		supports_search: false,
	},
	moonshot: {
		name: "Moonshot (Kimi)",
		api_base: "https://api.moonshot.cn/v1",
		models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
		default_model: "moonshot-v1-8k",
		temperature: 0.7,
		max_tokens: 2048,
		supports_search: false,
	},
	deepseek: {
		name: "DeepSeek",
		api_base: "https://api.deepseek.com",
		models: ["deepseek-chat", "deepseek-reasoner"],
		default_model: "deepseek-chat",
		temperature: 0.7,
		max_tokens: 2048,
		supports_search: false,
	},
	custom: {
		name: "自定义 (OpenAI 兼容)",
		api_base: "",
		models: [],
		default_model: "",
		temperature: 0.7,
		max_tokens: 2048,
		supports_search: false,
	},
};

// ========== 数据库操作 ==========

/**
 * 获取当前激活的 AI 配置（从数据库读取）
 * @returns {Promise<object|null>} 配置对象或 null
 */
async function getActiveAIConfig() {
	const { rows } = await pool.query(
		"SELECT * FROM ai_config WHERE is_active = true LIMIT 1",
	);
	if (rows.length === 0) return null;

	const row = rows[0];
	return {
		id: row.id,
		provider: row.provider,
		api_base: row.api_base,
		api_key: decryptValue(row.api_key_cipher),
		model: row.model,
		is_active: row.is_active,
		created_at: row.created_at,
		updated_at: row.updated_at,
	};
}

/**
 * 获取当前配置（返回给前端，API Key 脱敏）
 */
async function getAIConfigForClient() {
	const { rows } = await pool.query(
		"SELECT * FROM ai_config WHERE is_active = true LIMIT 1",
	);
	if (rows.length === 0) return null;

	const row = rows[0];
	const rawKey = decryptValue(row.api_key_cipher);
	const maskedKey = rawKey.length > 8
		? `${rawKey.slice(0, 4)}${"*".repeat(Math.min(rawKey.length - 8, 20))}${rawKey.slice(-4)}`
		: "****";

	return {
		id: row.id,
		provider: row.provider,
		api_base: row.api_base,
		api_key_masked: maskedKey,
		model: row.model,
		is_active: row.is_active,
		created_at: row.created_at,
		updated_at: row.updated_at,
	};
}

/**
 * 保存或更新 AI 配置
 * 采用"单条激活"策略：先将所有记录设为非激活，再 upsert 当前配置
 */
async function saveAIConfig({ provider, api_base, api_key, model }) {
	const preset = PROVIDER_PRESETS[provider];
	if (!preset && provider !== "custom") {
		throw new Error(`不支持的供应商: ${provider}`);
	}

	const finalBase = api_base || preset?.api_base || "";
	if (!finalBase) {
		throw new Error("API 地址不能为空");
	}
	if (!api_key) {
		throw new Error("API Key 不能为空");
	}
	if (!model) {
		throw new Error("模型名称不能为空");
	}

	const cipher = encryptValue(api_key);

	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		// 取消所有激活状态
		await client.query("UPDATE ai_config SET is_active = false WHERE is_active = true");
		// 插入或更新（按 provider 匹配）
		const { rows } = await client.query(
			`INSERT INTO ai_config (provider, api_base, api_key_cipher, model, is_active, updated_at)
			 VALUES ($1, $2, $3, $4, true, NOW())
			 ON CONFLICT (id) DO UPDATE SET
			   provider = EXCLUDED.provider,
			   api_base = EXCLUDED.api_base,
			   api_key_cipher = EXCLUDED.api_key_cipher,
			   model = EXCLUDED.model,
			   is_active = true,
			   updated_at = NOW()
			 RETURNING *`,
			[provider, finalBase, cipher, model],
		);
		await client.query("COMMIT");
		return rows[0];
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

// ========== 统一 AI 调用 ==========

// 移除 Perplexity 返回内容中的引用序号
const removeCitationMarkers = (text) => {
	if (typeof text !== "string") return text;
	return text.replace(/\[\d+\]/g, "").replace(/\s{2,}/g, " ").trim();
};

/**
 * 统一调用 AI Chat Completions 接口
 * 所有支持的供应商都兼容 OpenAI Chat Completions 协议
 */
async function callAI(messages, options = {}) {
	const config = await getActiveAIConfig();
	if (!config) {
		const error = new Error("AI 未配置，请在设置中配置 AI 供应商和 API Key");
		error.status = 503;
		throw error;
	}

	const preset = PROVIDER_PRESETS[config.provider] || PROVIDER_PRESETS.custom;

	const body = {
		model: config.model,
		messages,
		temperature: preset.temperature,
		max_tokens: preset.max_tokens,
		...options,
	};

	// Perplexity 特有：搜索增强参数
	if (config.provider === "perplexity" && !body.search_recency_filter) {
		body.search_recency_filter = "month";
	}

	const response = await fetch(`${config.api_base}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${config.api_key}`,
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		const error = new Error(`AI API 调用失败: ${response.status} ${text}`);
		error.status = response.status;
		throw error;
	}

	const data = await response.json();

	// Perplexity 返回内容需要去除引用标记
	if (config.provider === "perplexity" && data?.choices?.[0]?.message?.content) {
		data.choices[0].message.content = removeCitationMarkers(data.choices[0].message.content);
	}

	return data;
}

/**
 * 测试 AI 配置连通性
 * 发送一条简单消息验证 API Key 和地址是否有效
 */
async function testAIConfig({ provider, api_base, api_key, model }) {
	const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.custom;
	const finalBase = api_base || preset?.api_base || "";

	if (!finalBase || !api_key || !model) {
		throw new Error("配置不完整：需要 API 地址、API Key 和模型名称");
	}

	const body = {
		model,
		messages: [{ role: "user", content: "Hi" }],
		max_tokens: 5,
	};

	const response = await fetch(`${finalBase}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${api_key}`,
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		if (response.status === 401) {
			throw new Error("API Key 无效或已过期");
		}
		if (response.status === 404) {
			throw new Error("API 地址不正确或模型名称无效");
		}
		throw new Error(`连接测试失败: ${response.status} ${text}`);
	}

	return { success: true, message: "连接测试成功" };
}

export {
	PROVIDER_PRESETS,
	callAI,
	getAIConfigForClient,
	getActiveAIConfig,
	saveAIConfig,
	testAIConfig,
};
