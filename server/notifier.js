// 通道抽象层：统一不同推送服务（MeoW / Bark / Telegram ...）的接口
// config 永远以 AES-256-GCM 加密的 JSON 字符串形态存库，对外只暴露脱敏版
import { decryptValue, encryptValue } from "./ai.js";

// ========== 通道类型常量 ==========
export const CHANNEL_TYPES = {
	MEOW: "meow",
};

// MeoW 推送网关根地址，允许通过环境变量覆盖
const MEOW_API_BASE = (
	process.env.MEOW_API_BASE || "https://api.chuckfang.com"
).replace(/\/+$/, "");

// MeoW HTTP 超时（毫秒）
const MEOW_TIMEOUT_MS = Number(process.env.MEOW_TIMEOUT_MS || 10000);

// ========== 序列化与加密 ==========

// 将明文 config 对象序列化为 JSON 并加密，写库前使用
export function encryptChannelConfig(configObject) {
	if (!configObject || typeof configObject !== "object") {
		throw new Error("通道配置必须为对象");
	}
	const json = JSON.stringify(configObject);
	const encrypted = encryptValue(json);
	if (!encrypted) {
		throw new Error("通道配置加密失败");
	}
	return encrypted;
}

// 从库里读到 TEXT 后调用此函数还原对象
export function decryptChannelConfig(encryptedText) {
	if (!encryptedText) return {};
	try {
		const json = decryptValue(encryptedText);
		if (!json) return {};
		return JSON.parse(json);
	} catch (err) {
		console.error("[NOTIFIER] 解密通道配置失败:", err.message);
		return {};
	}
}

// ========== 脱敏 ==========

function maskNickname(nickname) {
	if (!nickname || typeof nickname !== "string") return "";
	const str = String(nickname);
	if (str.length <= 4) return "***";
	return `${str.slice(0, 2)}***${str.slice(-2)}`;
}

// 返回给前端的脱敏 config（保证明文昵称绝不返回）
export function maskChannelConfig(channelType, config) {
	const safe = {};
	if (!config) return safe;
	if (channelType === CHANNEL_TYPES.MEOW) {
		safe.nickname_masked = maskNickname(config.nickname);
	}
	return safe;
}

// ========== 校验 ==========

function validateMeowConfig(config) {
	if (!config || typeof config !== "object") {
		return { ok: false, error: "配置不能为空" };
	}
	const nickname = String(config.nickname || "").trim();
	if (!nickname) return { ok: false, error: "MeoW 昵称不能为空" };
	if (nickname.length > 64)
		return { ok: false, error: "MeoW 昵称长度不能超过 64" };
	if (nickname.includes("/"))
		return { ok: false, error: "MeoW 昵称不允许包含斜杠" };
	return { ok: true };
}

// ========== MeoW 实现 ==========

async function sendMeowNotification(config, payload) {
	const nickname = encodeURIComponent(String(config.nickname || "").trim());
	// 采用 MeoW 默认的纯文本格式：横幅/锁屏上不会泄露 HTML/Markdown 标记
	// 消息详情页也会按换行正常展示；链接通过独立的 url 字段承载
	const url = `${MEOW_API_BASE}/${nickname}`;

	const body = {
		title: payload.title || "AppArchive",
		msg: String(payload.body || ""),
	};
	if (payload.url) body.url = String(payload.url);

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), MEOW_TIMEOUT_MS);
	const startedAt = Date.now();

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			signal: controller.signal,
		});

		const latencyMs = Date.now() - startedAt;
		const text = await response.text().catch(() => "");
		let parsed = null;
		try {
			parsed = text ? JSON.parse(text) : null;
		} catch (_err) {
			parsed = null;
		}

		if (!response.ok) {
			return {
				ok: false,
				httpStatus: response.status,
				latencyMs,
				error: `HTTP ${response.status}: ${parsed?.message || text || "未知错误"}`,
			};
		}

		// MeoW 文档：status 200 表示成功
		if (parsed && typeof parsed.status === "number" && parsed.status !== 200) {
			return {
				ok: false,
				httpStatus: response.status,
				latencyMs,
				error: `MeoW 返回 status=${parsed.status}: ${parsed.message || ""}`,
			};
		}

		return { ok: true, httpStatus: response.status, latencyMs };
	} catch (err) {
		const latencyMs = Date.now() - startedAt;
		if (err.name === "AbortError") {
			return { ok: false, httpStatus: 0, latencyMs, error: "请求超时" };
		}
		return {
			ok: false,
			httpStatus: 0,
			latencyMs,
			error: err.message || "网络错误",
		};
	} finally {
		clearTimeout(timer);
	}
}

async function testMeowChannel(config) {
	return sendMeowNotification(config, {
		title: "AppArchive 测试推送",
		body: [
			"✅ MeoW 通道绑定成功",
			"",
			"这是一条来自 AppArchive 的测试消息。",
			"收到即说明今后的版本更新通知可以正常送达。",
		].join("\n"),
	});
}

// ========== 通道注册表 ==========

export const CHANNEL_REGISTRY = {
	[CHANNEL_TYPES.MEOW]: {
		label: "MeoW",
		configFields: ["nickname"],
		validate: validateMeowConfig,
		send: sendMeowNotification,
		test: testMeowChannel,
	},
};

// ========== 对外统一入口 ==========

// 校验原始 config 对象是否合法（新建/编辑通道前调用）
export function validateChannelConfig(channelType, config) {
	const handler = CHANNEL_REGISTRY[channelType];
	if (!handler) {
		return { ok: false, error: `未知通道类型: ${channelType}` };
	}
	return handler.validate(config);
}

// 统一发送：channel 必须已带有解密后的 config 对象
// payload: { title, body?, htmlBody?, url? }
export async function sendNotification(channel, payload) {
	const handler = CHANNEL_REGISTRY[channel.channel_type];
	if (!handler) {
		return {
			ok: false,
			httpStatus: 0,
			latencyMs: 0,
			error: `未知通道类型: ${channel.channel_type}`,
		};
	}
	return handler.send(channel.config, payload);
}

// 测试通道（发送固定测试文案）
export async function testChannel(channel) {
	const handler = CHANNEL_REGISTRY[channel.channel_type];
	if (!handler) {
		return {
			ok: false,
			httpStatus: 0,
			latencyMs: 0,
			error: `未知通道类型: ${channel.channel_type}`,
		};
	}
	return handler.test(channel.config);
}

// 列出支持的通道类型（供前端引导用）
export function listSupportedChannels() {
	return Object.entries(CHANNEL_REGISTRY).map(([type, meta]) => ({
		type,
		label: meta.label,
		config_fields: meta.configFields,
	}));
}
