import crypto from "node:crypto";
import fs from "node:fs";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import multer from "multer";
import jwt from "jsonwebtoken";
import {
	deleteFileFromCOS,
	extractKeyFromCosUrl,
	generateUniqueFileName,
	generateUniqueFileNameFromSoftwareName,
	renameFileInCOS,
	uploadToCOS,
} from "./cos.js";
import { handleDatabaseError, pool, testConnection } from "./database.js";
import { buildAnalyzeMessages, buildCompareMessages } from "./prompts.js";
import authRouter, { JWT_SECRET } from "./auth.js";
import {
	PROVIDER_PRESETS,
	callAI,
	getAIConfigForClient,
	saveAIConfig,
	testAIConfig,
} from "./ai.js";
import { fetchWebsiteContext } from "./websiteContext.js";
import {
	getTavilyConfigForClient,
	saveTavilyConfig,
	searchTavily,
	searchTavilySafety,
	testTavilyApiKey,
} from "./tavilySearch.js";
import {
	prerenderHome,
	prerenderDetail,
	prerenderShare,
	generateSitemap,
	generateRobotsTxt,
	invalidateSoftwareCache,
} from "./seo.js";

// 加载环境变量（允许覆盖已存在的变量，避免系统级 PG* 干扰）
dotenv.config({ override: true }); // 默认读取 .env
dotenv.config({ path: ".env.local", override: true }); // 额外读取 .env.local（若存在）

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
// 安全头
app.use(
        helmet({
                contentSecurityPolicy: false,
        }),
);

// CORS: 仅生产环境限制来源
const allowedOrigins = (process.env.CORS_ORIGINS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
app.use(
        cors({
                origin: (origin, callback) => {
                        if (!origin) return callback(null, true);
                        if (!allowedOrigins.length || allowedOrigins.includes(origin))
                                return callback(null, true);
                        return callback(new Error("Not allowed by CORS"));
                },
        }),
);

// 请求体大小限制
app.use(express.json({ limit: process.env.JSON_LIMIT || "1mb" }));
app.use(
        express.urlencoded({
                extended: true,
                limit: process.env.JSON_LIMIT || "1mb",
        }),
);
// 静态服务图标目录，便于部署后直接从后端读取最新上传的图标
app.use(
        "/icons",
        express.static(
                path.join(
                        path.dirname(fileURLToPath(import.meta.url)),
                        "..",
                        "public",
                        "icons",
                ),
        ),
);

// 启动时做一次基础连接验证，便于快速发现凭据配置问题
testConnection().catch((err) => {
        console.error("数据库连接自检失败，请检查环境变量与网络连通性:", err);
});

// 仅校验 schema，提醒先执行迁移
async function verifySchema() {
        try {
                const { rows } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'softwares' 
        AND column_name IN (
          'download_links',
          'secrets',
          'related_articles',
          'analysis_provider',
          'analysis_model',
          'analysis_at',
          'analysis_sources',
          'warnings'
        )
    `);
                const existing = new Set(rows.map((r) => r.column_name));
                const missing = [
                        "download_links",
                        "secrets",
                        "related_articles",
                        "analysis_provider",
                        "analysis_model",
                        "analysis_at",
                        "analysis_sources",
                        "warnings",
                ].filter((c) => !existing.has(c));
                if (missing.length) {
                        console.warn(
                                `[SCHEMA] softwares 缺少列: ${missing.join(", ")}，请先执行迁移脚本 (npm run migrate:up)。`,
                        );
                }

		// 检查 search_config 表
		const { rows: scRows } = await pool.query(`
			SELECT table_name FROM information_schema.tables
			WHERE table_schema = 'public' AND table_name = 'search_config'
		`);
		if (scRows.length === 0) {
			console.warn(
				"[SCHEMA] 缺少 search_config 表，请执行迁移脚本: node scripts/migrate-search-config.js",
			);
		}

	} catch (error) {
		console.error("[SCHEMA] 校验失败，请先执行迁移或检查数据库连接。", error);
	}
}

verifySchema();

// ========== 简单加密工具（服务端加密存储，AES-256-GCM） ==========
const SECRET_KEY = (process.env.APP_SECRET_KEY || "dev-secret-key")
        .padEnd(32, "0")
        .slice(0, 32);
function encryptValue(plainText) {
        if (!plainText) return null;
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(
                "aes-256-gcm",
                Buffer.from(SECRET_KEY),
                iv,
        );
        const encrypted = Buffer.concat([
                cipher.update(String(plainText), "utf8"),
                cipher.final(),
        ]);
        const tag = cipher.getAuthTag();
        return Buffer.concat([iv, tag, encrypted]).toString("base64");
}
function decryptValue(payload) {
        if (!payload) return "";
        const raw = Buffer.from(payload, "base64");
        const iv = raw.slice(0, 12);
        const tag = raw.slice(12, 28);
        const data = raw.slice(28);
        const decipher = crypto.createDecipheriv(
                "aes-256-gcm",
                Buffer.from(SECRET_KEY),
                iv,
        );
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
        return decrypted.toString("utf8");
}

// 将前端传入的 secrets（包含明文 value）转为仅元信息 + 密文
function normalizeSecretsForInsert(secrets) {
        if (!Array.isArray(secrets)) return [];
        const now = new Date().toISOString();
        return secrets.map((item) => {
                const { id, kind, label, notes, expiresAt, value } = item || {};
                const cipher = value ? encryptValue(value) : null;
                return {
                        id: id || String(Date.now()),
                        kind: kind || "other",
                        label: label || "",
                        notes: notes || "",
                        expiresAt: expiresAt || null,
                        createdAt: now,
                        // 仅存密文字段为 _cipher，不回传给前端
                        _cipher: cipher,
                };
        });
}

// 基于现有行进行合并更新：
// - 若入参项未提供 value 字段，则保留旧密文 _cipher（按 id 匹配）
// - 若提供了 value，则用新值加密覆盖
// - 仅保留传入的项（即支持前端删除）
function normalizeSecretsForUpdate(incoming, existingRow) {
        const now = new Date().toISOString();
        const existingMap = new Map(
                (Array.isArray(existingRow) ? existingRow : []).map((s) => [s.id, s]),
        );
        if (!Array.isArray(incoming)) return [];
        return incoming.map((item) => {
                const src = item || {};
                const prev = existingMap.get(src.id);
                const hasValueField = Object.hasOwn(src, "value");
                const wantsClear = hasValueField && src.value === null; // 前端显式传 null 代表清空
                const hasNewValue =
                        hasValueField &&
                        typeof src.value === "string" &&
                        src.value.trim().length > 0;
                const cipher = hasValueField
                        ? wantsClear
                                ? null
                                : hasNewValue
                                        ? encryptValue(src.value)
                                        : prev
                                                ? (prev._cipher ?? null)
                                                : null // 空字符串视为“未修改”
                        : prev
                                ? (prev._cipher ?? null)
                                : null;
                return {
                        id: src.id || prev?.id || String(Date.now()),
                        kind: src.kind || prev?.kind || "other",
                        label: src.label || "",
                        notes: src.notes || "",
                        expiresAt: src.expiresAt || null,
                        createdAt: prev?.createdAt || now,
                        _cipher: cipher,
                };
        });
}

// 从数据库读出的 secrets 去掉密文，仅保留元信息
function maskSecretsForClient(secretsRow) {
        if (!Array.isArray(secretsRow)) return [];
        return secretsRow.map((item) => ({
                id: item.id,
                kind: item.kind,
                label: item.label,
                notes: item.notes,
                expiresAt: item.expiresAt,
                createdAt: item.createdAt,
                hasValue: Boolean(item._cipher),
        }));
}

// ========== 用户认证中间件（JWT 验证） ==========
const requireAuth = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith("Bearer ")) {
		return res.status(401).json({
			error: "未授权",
			message: "缺少认证令牌，请先登录",
		});
	}

	try {
		const token = authHeader.slice(7);
		const decoded = jwt.verify(token, JWT_SECRET);
		req.userId = decoded.userId;
		next();
	} catch (err) {
		const message =
			err.name === "TokenExpiredError" ? "登录已过期，请重新登录" : "无效的认证令牌";
		return res.status(401).json({ error: "未授权", message });
	}
};


// ========== 认证路由 ==========
app.use("/api/auth", authRouter);

// 测试路由
app.get("/api/test", async (_req, res) => {
        try {
                const result = await pool.query("SELECT NOW() as current_time");
                res.json({
                        success: true,
                        message: "数据库连接成功",
                        data: result.rows[0],
                });
        } catch (error) {
                handleDatabaseError(error, res);
        }
});

// ========== 图标上传（支持腾讯云COS） ==========
// 保留本地icons目录用于向后兼容（现有本地图标）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconsDir = path.join(__dirname, "..", "public", "icons");

// 确保目录存在（用于向后兼容本地图标）
if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
}

// 将任意名称转为文件安全的基础名（保留中英文、数字、下划线和连字符）
function _sanitizeBaseName(name) {
        if (!name) return "icon";
        return String(name)
                .trim()
                .replace(/[\\/:*?"<>|]+/g, "") // 去除非法字符
                .replace(/\s+/g, "_") // 空格转下划线
                .replace(/[^\w\-\u4e00-\u9fa5]/g, "_"); // 其它非常见字符替换
}

// 获取不冲突的文件名，例如 app.png, app_1.png, app_2.png（用于本地图标重命名）
function _getUniqueFilename(base, ext) {
        let candidate = `${base}${ext}`;
        let index = 1;
        while (fs.existsSync(path.join(iconsDir, candidate))) {
                candidate = `${base}_${index}${ext}`;
                index += 1;
        }
        return candidate;
}

// 将COS图标重命名为基于软件名的文件名，并返回新的COS URL
// 例如：将 AppArchive/icon_1234567890_123.png 重命名为 AppArchive/MyApp.png
async function renameCosIconToSoftwareName(softwareName, iconUrl) {
        try {
                if (!iconUrl || typeof iconUrl !== "string") return iconUrl;

                // 只处理COS URL
                if (!iconUrl.includes("cos.") || !iconUrl.includes("myqcloud.com")) {
                        return iconUrl;
                }

                console.log(
                        `🔄 准备重命名图标，软件名: ${softwareName}, 原URL: ${iconUrl}`,
                );

                // 从URL中提取COS key（路径部分）
                // 例如：https://image-1252749317.cos.ap-guangzhou.myqcloud.com/AppArchive/icon_123.png
                // 提取出：AppArchive/icon_123.png
                const urlObj = new URL(iconUrl);
                // 解码URL编码的路径（处理中文等特殊字符）
                const oldKey = decodeURIComponent(
                        urlObj.pathname.startsWith("/")
                                ? urlObj.pathname.substring(1)
                                : urlObj.pathname,
                );

                console.log(`📁 提取的旧Key: ${oldKey}`);

                // 提取文件扩展名
                const ext = oldKey.includes(".")
                        ? oldKey.substring(oldKey.lastIndexOf("."))
                        : "";

                // 生成基于软件名的唯一文件名
                const newFileName = await generateUniqueFileNameFromSoftwareName(
                        softwareName,
                        ext,
                );

                console.log(`📝 生成的新文件名: ${newFileName}`);

                // 构建新的COS key
                const storagePath = process.env.COS_STORAGE_PATH || "AppArchive/";
                const newKey = `${storagePath}${newFileName}`;

                console.log(`📁 新Key: ${newKey}`);

                // 如果文件名已经相同，不需要重命名
                if (oldKey === newKey) {
                        console.log(`ℹ️ 文件名已相同，跳过重命名`);
                        return iconUrl;
                }

                // 执行重命名操作
                const newUrl = await renameFileInCOS(oldKey, newKey);
                console.log(`✅ 重命名完成，新URL: ${newUrl}`);
                return newUrl;
        } catch (error) {
                console.error("❌ 重命名COS图标失败:", error);
                console.error("错误详情:", {
                        softwareName,
                        iconUrl,
                        error: error.message,
                        stack: error.stack,
                });
                // 重命名失败时返回原URL，避免影响整体流程
                return iconUrl;
        }
}

// 允许的图片类型
const allowedMimeTypes = new Set([
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/svg+xml",
        "image/x-icon",
        "image/vnd.microsoft.icon",
]);

// 统一限流 key：优先使用已认证的 userId（由 requireAuth 中间件设置），其次 IP
const rateLimitKey = (req) =>
	(req.userId || req.ip || "anonymous").toString();

const uploadRateLimiter = rateLimit({
        windowMs: Number(process.env.UPLOAD_WINDOW_MS || 15 * 60 * 1000),
        max: Number(process.env.UPLOAD_MAX || 20),
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: rateLimitKey,
});

const aiRateLimiter = rateLimit({
        windowMs: Number(process.env.AI_WINDOW_MS || 15 * 60 * 1000),
        max: Number(process.env.AI_MAX || 40),
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: rateLimitKey,
});

const writeRateLimiter = rateLimit({
        windowMs: Number(process.env.WRITE_WINDOW_MS || 15 * 60 * 1000),
        max: Number(process.env.WRITE_MAX || 300),
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: rateLimitKey,
});

// 使用内存存储，文件将上传到COS而不是本地
const upload = multer({
        storage: multer.memoryStorage(),
        fileFilter: (_req, file, cb) => {
                if (!allowedMimeTypes.has(file.mimetype)) {
                        return cb(new Error("仅支持上传 PNG/JPEG/WebP/SVG/ICO 格式的图片"));
                }
                cb(null, true);
        },
        limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
        },
});

// 上传接口：上传到腾讯云COS，返回COS URL
app.post(
        "/api/upload/icon",
        requireAuth,
        uploadRateLimiter,
        upload.single("icon"),
        async (req, res) => {
                const startedAt = Date.now();
                const userId = req.userId || "anonymous";
                try {
                        if (!req.file) {
                                return res
                                        .status(400)
                                        .json({ error: "缺少文件", message: "请上传图片文件" });
                        }

                        console.log(`📤 收到上传请求，文件信息:`, {
                                originalname: req.file.originalname,
                                mimetype: req.file.mimetype,
                                size: req.file.size,
                                bufferLength: req.file.buffer?.length,
                        });

                        // 生成唯一文件名（使用MIME类型而不是原始文件名）
                        const fileName = generateUniqueFileName(req.file.mimetype);

                        console.log(`📤 生成的临时文件名: ${fileName}`);

                        // 上传到COS
                        const cosUrl = await uploadToCOS(
                                req.file.buffer,
                                fileName,
                                req.file.mimetype,
                        );

                        console.log(`✅ 上传成功，返回URL: ${cosUrl}`);

                        // 提取文件名（不包含路径前缀）
                        const filename = fileName;

                        return res.json({
                                success: true,
                                path: cosUrl, // 返回完整的COS URL
                                filename: filename,
                        });
                } catch (error) {
                        console.error("❌ 上传失败:", error);
                        console.error("错误堆栈:", error.stack);
                        const message = error?.message || "上传失败";
                        console.error(
                                `[UPLOAD_FAIL] user=${userId} duration=${Date.now() - startedAt}ms message=${message}`,
                        );
                        // 确保返回JSON格式的错误响应，而不是HTML
                        return res.status(400).json({
                                error: "上传失败",
                                message: message,
                                details:
                                        process.env.NODE_ENV === "development" ? error.stack : undefined,
                        });
                } finally {
                        const duration = Date.now() - startedAt;
                        console.log(
                                `[UPLOAD_METRIC] user=${userId} mime=${req.file?.mimetype || "unknown"} size=${req.file?.size || 0}B duration=${duration}ms`,
                        );
                }
        },
);

// ===== AI 代理路由 =====
// 软件优缺点分析
app.post("/api/ai/analyze", requireAuth, aiRateLimiter, async (req, res) => {
	const startedAt = Date.now();
	const userId = req.userId || "anonymous";
	try {
		const { software } = req.body || {};
		if (!software || !software.name) {
			return res
				.status(400)
				.json({ error: "缺少必要信息", message: "软件名称不能为空" });
		}

		// 并行执行：官网爬取 + Tavily 网络搜索
		const tasks = [];

		// 官网爬取
		if (software.website) {
			tasks.push(
				fetchWebsiteContext(software.website).catch((err) => {
					console.error("[WEBSITE_CONTEXT] 爬取异常:", err?.message);
					return null;
				}),
			);
		} else {
			tasks.push(Promise.resolve(null));
		}

		// Tavily 搜索（始终尝试，模块内部判断是否配置）
		tasks.push(
			searchTavily(software.name, {
				category: software.category,
				website: software.website,
			}).catch((err) => {
				console.error("[TAVILY] 搜索异常:", err?.message);
				return { searched: false, error: err?.message };
			}),
		);

		// Tavily 安全风险专项搜索
		tasks.push(
			searchTavilySafety(software.name, {
				website: software.website,
			}).catch((err) => {
				console.error("[TAVILY_SAFETY] 搜索异常:", err?.message);
				return { searched: false, error: err?.message };
			}),
		);

		const [websiteContext, searchResults, safetySearchResults] =
			await Promise.all(tasks);

		const messages = buildAnalyzeMessages(software, {
			websiteContext,
			searchResults,
			safetySearchResults,
		});
		const data = await callAI(messages);

		// 收集本次分析的数据来源标签
		const sources = [];
		const hasWebsiteInput =
			typeof software.website === "string" && software.website.trim();
		if (websiteContext?.fetched) {
			sources.push("website");
		} else if (hasWebsiteInput) {
			sources.push("website-error");
		}
		if (searchResults?.searched) {
			sources.push("tavily");
			if (!Array.isArray(searchResults.results) || searchResults.results.length === 0) {
				sources.push("tavily-empty");
			}
		} else if (searchResults?.error) {
			sources.push("tavily-error");
		}
		if (safetySearchResults?.searched) sources.push("tavily-safety");
		if (data.analysis_meta) {
			data.analysis_meta.sources = sources;
		}
		// 附加官网校验元数据
		if (websiteContext) {
			data.website_context = {
				fetched: Boolean(websiteContext.fetched),
				resolved_url:
					websiteContext.resolved_url ||
					websiteContext.requested_url ||
					software.website,
				error: websiteContext.error || "",
			};
		}

		// 附加 Tavily 搜索元数据
		if (searchResults) {
			data.search_context = {
				searched: Boolean(searchResults.searched),
				query: searchResults.query || "",
				result_count: searchResults.results?.length || 0,
				response_time: searchResults.response_time || 0,
				error: searchResults.error || searchResults.reason || "",
			};
		}

		return res.json(data);
	} catch (error) {
		console.error("AI分析错误:", error);
		res
			.status(error.status || 500)
			.json({ error: "AI分析失败", message: error.message });
	} finally {
		const duration = Date.now() - startedAt;
		console.log(
			`[AI_ANALYZE_METRIC] user=${userId} duration=${duration}ms`,
		);
	}
});

// 多软件对比
app.post("/api/ai/compare", requireAuth, aiRateLimiter, async (req, res) => {
	const startedAt = Date.now();
	const userId = req.userId || "anonymous";
	try {
		const { softwares } = req.body || {};
		if (!Array.isArray(softwares) || softwares.length < 2) {
			return res.status(400).json({
				error: "缺少必要信息",
				message: "至少需要两个软件才能进行对比",
			});
		}

		const messages = buildCompareMessages(softwares);
		const data = await callAI(messages);
		res.json(data);
	} catch (error) {
		console.error("AI对比错误:", error);
		res
			.status(error.status || 500)
			.json({ error: "AI对比失败", message: error.message });
	} finally {
		const duration = Date.now() - startedAt;
		console.log(
			`[AI_COMPARE_METRIC] user=${userId} duration=${duration}ms`,
		);
	}
});

// ========== AI 配置 API ==========

// 获取支持的供应商列表
app.get("/api/ai/providers", (_req, res) => {
	const providers = Object.entries(PROVIDER_PRESETS).map(([key, preset]) => ({
		id: key,
		name: preset.name,
		api_base: preset.api_base,
		models: preset.models,
		default_model: preset.default_model,
	}));
	res.json({ success: true, data: providers });
});

// 获取当前 AI 配置（脱敏）
app.get("/api/ai/config", requireAuth, async (_req, res) => {
	try {
		const config = await getAIConfigForClient();
		res.json({ success: true, data: config });
	} catch (error) {
		console.error("获取AI配置失败:", error);
		res.status(500).json({ error: "获取AI配置失败", message: error.message });
	}
});

// 保存 AI 配置
app.put("/api/ai/config", requireAuth, async (req, res) => {
	try {
		const { provider, api_base, api_key, model } = req.body || {};
		if (!provider || !model) {
			return res.status(400).json({
				error: "参数不完整",
				message: "供应商和模型名称为必填项",
			});
		}
		await saveAIConfig({ provider, api_base, api_key, model });
		const config = await getAIConfigForClient();
		res.json({ success: true, data: config, message: "AI 配置已保存" });
	} catch (error) {
		console.error("保存AI配置失败:", error);
		res.status(400).json({ error: "保存失败", message: error.message });
	}
});

// 测试 AI 配置连通性
app.post("/api/ai/config/test", requireAuth, async (req, res) => {
	try {
		const { provider, api_base, api_key, model } = req.body || {};
		if (!provider || !api_key || !model) {
			return res.status(400).json({
				error: "参数不完整",
				message: "供应商、API Key 和模型名称为必填项",
			});
		}
		const result = await testAIConfig({ provider, api_base, api_key, model });
		res.json({ success: true, ...result });
	} catch (error) {
		console.error("AI配置测试失败:", error);
		res.status(400).json({ success: false, error: "测试失败", message: error.message });
	}
});

// ========== 搜索增强配置 API（Tavily） ==========

// 获取搜索配置（脱敏）
app.get("/api/search/config", requireAuth, async (_req, res) => {
	try {
		const config = await getTavilyConfigForClient();
		res.json({ success: true, data: config });
	} catch (error) {
		console.error("获取搜索配置失败:", error);
		res.status(500).json({ error: "获取搜索配置失败", message: error.message });
	}
});

// 保存搜索配置
app.put("/api/search/config", requireAuth, async (req, res) => {
	try {
		const { tavily_api_key, tavily_enabled } = req.body || {};
		await saveTavilyConfig({
			api_key: tavily_api_key,
			enabled: tavily_enabled,
		});
		const config = await getTavilyConfigForClient();
		res.json({ success: true, data: config, message: "搜索配置已保存" });
	} catch (error) {
		console.error("保存搜索配置失败:", error);
		res.status(400).json({ error: "保存失败", message: error.message });
	}
});

// 测试 Tavily API Key
app.post("/api/search/config/test", requireAuth, async (req, res) => {
	try {
		const { tavily_api_key } = req.body || {};
		if (!tavily_api_key) {
			return res.status(400).json({
				error: "参数不完整",
				message: "Tavily API Key 不能为空",
			});
		}
		const result = await testTavilyApiKey(tavily_api_key);
		res.json({ success: true, ...result });
	} catch (error) {
		console.error("Tavily 测试失败:", error);
		res.status(400).json({ success: false, error: "测试失败", message: error.message });
	}
});

// 获取所有软件 (支持分页、筛选、排序)
app.get("/api/software", async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			search,
			category,
			systems,
			sortField = "created_at",
			sortOrder = "desc",
			addedSince,
		} = req.query;

		const offset = (Number(page) - 1) * Number(limit);
		const params = [];
		let paramIndex = 1;
		let whereConditions = [];

		// 搜索条件
		if (search) {
			whereConditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
			params.push(`%${search}%`);
			paramIndex++;
		}

		// 分类筛选
		if (category && category !== "all") {
			whereConditions.push(`category = $${paramIndex}`);
			params.push(category);
			paramIndex++;
		}

		// 系统筛选 (逗号分隔)
		if (systems) {
			const systemList = systems.split(",");
			// 假设 systems 是 text[] 类型，使用 overlap 操作符 &&
			// 或者如果是 JSONB，可能需要不同的写法
			// 这里假设是 text[]，Postgres 数组包含判断：systems && $param
			whereConditions.push(`systems && $${paramIndex}`);
			params.push(systemList);
			paramIndex++;
		}

		// 新增时间筛选
		if (addedSince) {
			const parsedSince = new Date(String(addedSince));
			if (!Number.isNaN(parsedSince.getTime())) {
				whereConditions.push(`created_at >= $${paramIndex}`);
				params.push(parsedSince.toISOString());
				paramIndex++;
			}
		}

		const whereClause =
			whereConditions.length > 0
				? `WHERE ${whereConditions.join(" AND ")}`
				: "";

		// 排序字段白名单
		const validSortFields = ["name", "created_at", "updated_at", "downloads", "rating"];
		const finalSortField = validSortFields.includes(sortField) ? sortField : "created_at";
		const finalSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

		// 核心字段 (Field Optimization)
		// 排除 secrets, download_links, pros, cons (如果内容很长)
		// 保留列表展示需要的字段
		const selectFields = "id, name, icon, description, category, license, systems, website, created_at";

		// 获取总数
		const countQuery = `SELECT COUNT(*) FROM softwares ${whereClause}`;
		const countResult = await pool.query(countQuery, params);
		const total = Number(countResult.rows[0].count);

		// 获取数据
		const dataQuery = `
			SELECT ${selectFields} 
			FROM softwares 
			${whereClause} 
			ORDER BY ${finalSortField} ${finalSortOrder} 
			LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
		`;
		
		params.push(limit, offset);
		
		const result = await pool.query(dataQuery, params);

		res.json({
			success: true,
			data: result.rows,
			pagination: {
				total,
				page: Number(page),
				limit: Number(limit),
				totalPages: Math.ceil(total / Number(limit))
			}
		});
	} catch (error) {
		handleDatabaseError(error, res);
	}
});

// 获取单个软件详情
app.get("/api/software/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query("SELECT * FROM softwares WHERE id = $1", [id]);
		
		if (result.rows.length === 0) {
			return res.status(404).json({ error: "软件不存在" });
		}

		const row = result.rows[0];
		// 屏蔽 secrets 明文
		const data = {
			...row,
			secrets: maskSecretsForClient(row.secrets || []),
		};
		
		res.json({ success: true, data });
	} catch (error) {
		handleDatabaseError(error, res);
	}
});

// 添加软件
app.post("/api/software", requireAuth, writeRateLimiter, async (req, res) => {
        try {
                const {
                        name,
                        category,
                        description,
                        icon,
                        license,
                        systems,
                        website,
                        pros,
                        cons,
                        download_links,
                        secrets,
                        related_articles,
                        analysis_provider,
                        analysis_model,
                        analysis_at,
                        analysis_sources,
                        warnings,
                } = req.body;

                if (!name || !category) {
                        return res.status(400).json({
                                error: "缺少必要信息",
                                message: "软件名称和分类是必填项",
                        });
                }

                // 验证图标路径：仅允许COS URL
                if (icon && typeof icon === "string") {
                        const isCosUrl =
                                icon.startsWith("https://") &&
                                icon.includes("cos.") &&
                                icon.includes("myqcloud.com");
                        if (!isCosUrl) {
                                return res.status(400).json({
                                        error: "无效的图标路径",
                                        message: "图标必须上传到腾讯云COS",
                                });
                        }
                }

                // COS URL重命名为基于软件名的文件名
                const finalIcon = icon ? await renameCosIconToSoftwareName(name, icon) : "";
                const safeAnalysisProvider =
                        typeof analysis_provider === "string" && analysis_provider.trim()
                                ? analysis_provider.trim()
                                : null;
                const safeAnalysisModel =
                        typeof analysis_model === "string" && analysis_model.trim()
                                ? analysis_model.trim()
                                : null;
                const safeAnalysisAt =
                        typeof analysis_at === "string" && analysis_at.trim()
                                ? analysis_at
                                : null;
                const safeAnalysisSources = Array.isArray(analysis_sources)
                        ? analysis_sources.filter((s) => typeof s === "string")
                        : [];
                const safeWarnings = Array.isArray(warnings)
                        ? warnings.filter((s) => typeof s === "string")
                        : [];
                const query = `
      INSERT INTO softwares (
        name, category, description, icon, license, systems, website, pros, cons,
        download_links, secrets, related_articles, analysis_provider, analysis_model, analysis_at, analysis_sources,
        warnings
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10::jsonb, $11::jsonb, $12::jsonb, $13, $14, $15::timestamptz, $16,
        $17
      )
      RETURNING *
    `;
                const values = [
                        name,
                        category,
                        description || "",
                        finalIcon || "",
                        license || "免费",
                        Array.isArray(systems) ? systems : [],
                        website || "",
                        Array.isArray(pros) ? pros : [],
                        Array.isArray(cons) ? cons : [],
                        JSON.stringify(Array.isArray(download_links) ? download_links : []),
                        JSON.stringify(normalizeSecretsForInsert(secrets)),
                        JSON.stringify(Array.isArray(related_articles) ? related_articles : []),
                        safeAnalysisProvider,
                        safeAnalysisModel,
                        safeAnalysisAt,
                        safeAnalysisSources,
                        safeWarnings,
                ];

                const result = await pool.query(query, values);
                const row = result.rows[0];
                invalidateSoftwareCache(row.id);
                res.json({
                        success: true,
                        data: { ...row, secrets: maskSecretsForClient(row.secrets || []) },
                });
        } catch (error) {
                handleDatabaseError(error, res);
        }
});

// 更新软件
app.put(
        "/api/software/:id",
        requireAuth,
        writeRateLimiter,
        async (req, res) => {
                try {
                        const { id } = req.params;
                        const updateData = { ...req.body };

                        // 移除不需要更新的字段
                        delete updateData.id;
                        delete updateData.created_at;

                        // 先查询软件的当前信息（用于图标重命名和删除旧图标）
                        const existingRes = await pool.query(
                                "SELECT name, icon FROM softwares WHERE id = $1",
                                [id],
                        );
                        if (existingRes.rows.length === 0) {
                                return res.status(404).json({ error: "软件不存在" });
                        }
                        const existingSoftware = existingRes.rows[0];
                        const oldIconUrl = existingSoftware.icon;
                        const softwareName = updateData.name || existingSoftware.name; // 如果更新了名称，使用新名称

                        // 验证并处理图标路径
                        if (Object.hasOwn(updateData, "icon")) {
                                const iconValue = updateData.icon;
                                if (iconValue && typeof iconValue === "string") {
                                        const isCosUrl =
                                                iconValue.startsWith("https://") &&
                                                iconValue.includes("cos.") &&
                                                iconValue.includes("myqcloud.com");
                                        if (!isCosUrl) {
                                                return res.status(400).json({
                                                        error: "无效的图标路径",
                                                        message: "图标必须上传到腾讯云COS",
                                                });
                                        }

                                        // 检查是否是临时文件名（icon_xxx格式），如果是则重命名为基于软件名的文件名
                                        const iconKey = extractKeyFromCosUrl(iconValue);
                                        if (iconKey?.match(/icon_\d+_\d+\./)) {
                                                // 是临时文件名，需要重命名
                                                const finalIconUrl = await renameCosIconToSoftwareName(
                                                        softwareName,
                                                        iconValue,
                                                );
                                                updateData.icon = finalIconUrl;

                                                // 如果旧图标与新图标不同，删除旧图标
                                                if (oldIconUrl && oldIconUrl !== finalIconUrl) {
                                                        const oldIconKey = extractKeyFromCosUrl(oldIconUrl);
                                                        if (oldIconKey) {
                                                                try {
                                                                        await deleteFileFromCOS(oldIconKey);
                                                                        console.log(`✅ 已删除软件 ${id} 的旧COS图标: ${oldIconKey}`);
                                                                } catch (error) {
                                                                        console.error(`⚠️ 删除旧COS图标失败:`, error);
                                                                }
                                                        }
                                                }
                                        } else if (oldIconUrl && oldIconUrl !== iconValue) {
                                                // 不是临时文件名，但图标改变了，删除旧图标
                                                const oldIconKey = extractKeyFromCosUrl(oldIconUrl);
                                                if (oldIconKey) {
                                                        try {
                                                                await deleteFileFromCOS(oldIconKey);
                                                                console.log(`✅ 已删除软件 ${id} 的旧COS图标: ${oldIconKey}`);
                                                        } catch (error) {
                                                                console.error(`⚠️ 删除旧COS图标失败:`, error);
                                                        }
                                                }
                                        }
                                } else if (!iconValue && oldIconUrl) {
                                        // 图标被清空，删除旧图标
                                        const oldIconKey = extractKeyFromCosUrl(oldIconUrl);
                                        if (oldIconKey) {
                                                try {
                                                        await deleteFileFromCOS(oldIconKey);
                                                        console.log(
                                                                `✅ 已删除软件 ${id} 的COS图标（图标已清空）: ${oldIconKey}`,
                                                        );
                                                } catch (error) {
                                                        console.error(`⚠️ 删除COS图标失败:`, error);
                                                }
                                        }
                                }
                        }

                        // 规范化数组与 JSON 字段，过滤 undefined
                        if (
                                Object.hasOwn(updateData, "pros") &&
                                !Array.isArray(updateData.pros)
                        ) {
                                updateData.pros = [];
                        }
                        if (
                                Object.hasOwn(updateData, "cons") &&
                                !Array.isArray(updateData.cons)
                        ) {
                                updateData.cons = [];
                        }
                        if (
                                Object.hasOwn(updateData, "systems") &&
                                !Array.isArray(updateData.systems)
                        ) {
                                updateData.systems = [];
                        }
                        if (Object.hasOwn(updateData, "analysis_sources")) {
                                const v = updateData.analysis_sources;
                                updateData.analysis_sources = Array.isArray(v)
                                        ? v.filter((s) => typeof s === "string")
                                        : [];
                        }
                        if (Object.hasOwn(updateData, "warnings")) {
                                const v = updateData.warnings;
                                updateData.warnings = Array.isArray(v)
                                        ? v.filter((s) => typeof s === "string")
                                        : [];
                        }
                        if (Object.hasOwn(updateData, "download_links")) {
                                const v = updateData.download_links;
                                if (typeof v === "string") {
                                        try {
                                                const parsed = JSON.parse(v);
                                                if (!Array.isArray(parsed)) {
                                                        return res.status(400).json({
                                                                error: "无效的下载链接格式",
                                                                message: "download_links 必须是数组",
                                                        });
                                                }
                                                updateData.download_links = parsed;
                                        } catch (_e) {
                                                return res.status(400).json({
                                                        error: "无效的 JSON",
                                                        message: "download_links 不是合法的 JSON",
                                                });
                                        }
                                } else if (v != null && !Array.isArray(v)) {
                                        return res.status(400).json({
                                                error: "无效的下载链接格式",
                                                message: "download_links 必须是数组",
                                        });
                                }
                        }

                        // 处理 secrets：
                        // - 若传入数组：与数据库现有记录按 id 合并，未提供 value 的保留旧密文
                        // - 若传入字符串：解析后同上
                        if (Object.hasOwn(updateData, "secrets")) {
                                const v = updateData.secrets;
                                if (typeof v === "string") {
                                        try {
                                                const parsed = JSON.parse(v);
                                                if (!Array.isArray(parsed)) {
                                                        return res.status(400).json({
                                                                error: "无效的 secrets 格式",
                                                                message: "secrets 必须是数组",
                                                        });
                                                }
                                                // 读取现有 secrets 以便合并
                                                const existingRes = await pool.query(
                                                        "SELECT secrets FROM softwares WHERE id = $1",
                                                        [id],
                                                );
                                                const existing = existingRes.rows[0]?.secrets || [];
                                                updateData.secrets = normalizeSecretsForUpdate(parsed, existing);
                                        } catch (_e) {
                                                return res.status(400).json({
                                                        error: "无效的 JSON",
                                                        message: "secrets 不是合法的 JSON",
                                                });
                                        }
                                } else if (Array.isArray(v)) {
                                        const existingRes = await pool.query(
                                                "SELECT secrets FROM softwares WHERE id = $1",
                                                [id],
                                        );
                                        const existing = existingRes.rows[0]?.secrets || [];
                                        updateData.secrets = normalizeSecretsForUpdate(v, existing);
                                } else if (v != null) {
                                        return res.status(400).json({
                                                error: "无效的 secrets 格式",
                                                message: "secrets 必须是数组",
                                        });
                                }
                        }

                        // 删除值为 undefined 的字段，避免传入无效 JSON
                        Object.keys(updateData).forEach((key) => {
                                if (typeof updateData[key] === "undefined") {
                                        delete updateData[key];
                                }
                        });

                        const fields = Object.keys(updateData);
                        // 将 download_links 序列化为 JSONB
                        const values = [id];
                        const setClause = fields
                                .map((field, index) => {
                                        const value = updateData[field];
                                        if (field === "download_links") {
                                                values.push(JSON.stringify(value));
                                                return `${field} = $${index + 2}::jsonb`;
                                        } else if (field === "secrets") {
                                                values.push(JSON.stringify(value));
                                                return `${field} = $${index + 2}::jsonb`;
                                        } else if (field === "related_articles") {
                                                values.push(JSON.stringify(Array.isArray(value) ? value : []));
                                                return `${field} = $${index + 2}::jsonb`;
                                        }
                                        values.push(value);
                                        return `${field} = $${index + 2}`;
                                })
                                .join(", ");

                        const query = `
      UPDATE softwares 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

                        const result = await pool.query(query, values);

                        if (result.rows.length === 0) {
                                return res.status(404).json({ error: "软件不存在" });
                        }

                        const row = result.rows[0];
                        invalidateSoftwareCache(row.id);
                        res.json({
                                success: true,
                                data: { ...row, secrets: maskSecretsForClient(row.secrets || []) },
                        });
                } catch (error) {
                        handleDatabaseError(error, res);
                }
        },
);

// 受保护的接口：获取某条软件的某个 secret 明文（仅本地私用）
// 速率限制：每个 IP 每 15 分钟最多 30 次
const secretRateLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: Number(process.env.SECRET_RATE_LIMIT || 30),
        standardHeaders: true,
        legacyHeaders: false,
});

// 可选白名单（逗号分隔 IP）
const ipWhitelist = new Set(
        (process.env.IP_WHITELIST || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
);

app.get(
        "/api/software/:id/secret/:secretId",
        secretRateLimiter,
        async (req, res) => {
                try {
                        const clientIp =
                                req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
                                req.socket.remoteAddress ||
                                "";
                        if (ipWhitelist.size && !ipWhitelist.has(clientIp)) {
                                console.warn(
                                        `[SECRET_DENY] ip=${clientIp} id=${req.params.id} secretId=${req.params.secretId} ua=${req.headers["user-agent"]}`,
                                );
                                return res.status(403).json({ error: "Forbidden" });
                        }

                        const { id, secretId } = req.params;
                        const result = await pool.query(
                                "SELECT secrets FROM softwares WHERE id = $1",
                                [id],
                        );
                        if (result.rows.length === 0)
                                return res.status(404).json({ error: "软件不存在" });
                        const secrets = result.rows[0].secrets || [];
                        const found = (secrets || []).find((s) => s.id === secretId);
                        if (!found || !found._cipher)
                                return res.status(404).json({ error: "密钥不存在" });
                        const value = decryptValue(found._cipher);
                        console.log(
                                `[SECRET_ACCESS] time=${new Date().toISOString()} ip=${clientIp} softwareId=${id} secretId=${secretId}`,
                        );
                        res.json({ success: true, value });
                } catch (error) {
                        handleDatabaseError(error, res);
                }
        },
);

// 删除软件
app.delete(
        "/api/software/:id",
        requireAuth,
        writeRateLimiter,
        async (req, res) => {
                try {
                        const { id } = req.params;

                        // 先查询软件的图标URL，以便删除COS中的文件
                        const queryResult = await pool.query(
                                "SELECT icon FROM softwares WHERE id = $1",
                                [id],
                        );

                        if (queryResult.rows.length === 0) {
                                return res.status(404).json({ error: "软件不存在" });
                        }

                        const iconUrl = queryResult.rows[0]?.icon;

                        // 如果图标是COS URL，删除COS中的文件
                        if (iconUrl) {
                                const cosKey = extractKeyFromCosUrl(iconUrl);
                                if (cosKey) {
                                        try {
                                                await deleteFileFromCOS(cosKey);
                                                console.log(`✅ 已删除软件 ${id} 的COS图标: ${cosKey}`);
                                        } catch (error) {
                                                // 删除COS文件失败不影响软件删除，只记录日志
                                                console.error(`⚠️ 删除COS图标失败，但继续删除软件记录:`, error);
                                        }
                                }
                        }

                        // 删除数据库记录
                        const _result = await pool.query("DELETE FROM softwares WHERE id = $1", [
                                id,
                        ]);

                        invalidateSoftwareCache(id);
                        res.json({ success: true, message: "软件删除成功" });
                } catch (error) {
                        handleDatabaseError(error, res);
                }
        },
);

// 获取软件的关联文章
app.get("/api/software/:id/articles", async (req, res) => {
        try {
                const { id } = req.params;
                const result = await pool.query(
                        "SELECT related_articles FROM softwares WHERE id = $1",
                        [id],
                );
                if (result.rows.length === 0) {
                        return res.status(404).json({ error: "软件不存在" });
                }
                res.json({ success: true, data: result.rows[0].related_articles || [] });
        } catch (error) {
                handleDatabaseError(error, res);
        }
});

// ===== GitHub Releases 版本跟踪 API =====

// 从 URL 中解析 GitHub owner/repo
function parseGitHubRepo(url) {
	if (!url || typeof url !== "string") return null;
	try {
		const parsed = new URL(url);
		if (parsed.hostname !== "github.com") return null;
		const parts = parsed.pathname.replace(/\/$/, "").split("/").filter(Boolean);
		if (parts.length < 2) return null;
		return { owner: parts[0], repo: parts[1] };
	} catch {
		return null;
	}
}

// 缓存有效期（秒），默认 6 小时
const GITHUB_CACHE_TTL = Number(process.env.GITHUB_CACHE_TTL || 21600);

// 调用 GitHub Releases API（支持 ETag 条件请求）
async function fetchGitHubReleases(owner, repo, etag = null) {
	const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=50`;
	const headers = {
		Accept: "application/vnd.github+json",
		"User-Agent": "AppArchive-Bot/1.0",
	};

	// 若配置了 GitHub Token，使用认证请求（5000 次/小时）
	const token = process.env.GITHUB_TOKEN;
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	// ETag 条件请求：如果数据没变 GitHub 返回 304，不计入 rate limit
	if (etag) {
		headers["If-None-Match"] = etag;
	}

	const response = await fetch(url, { headers });

	// 304 Not Modified —— 数据没变
	if (response.status === 304) {
		return { notModified: true };
	}

	if (!response.ok) {
		const rateRemaining = response.headers.get("x-ratelimit-remaining");
		const rateReset = response.headers.get("x-ratelimit-reset");
		console.error(
			`[GITHUB_API] ${response.status} ${response.statusText} ` +
				`remaining=${rateRemaining} reset=${rateReset ? new Date(Number(rateReset) * 1000).toISOString() : "?"}`,
		);
		throw new Error(`GitHub API 请求失败: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	const newEtag = response.headers.get("etag") || null;

	// 格式化 Release 数据，只保留前端需要的字段
	const releases = data.map((release) => ({
		tag_name: release.tag_name,
		name: release.name || release.tag_name,
		body: release.body || "",
		published_at: release.published_at,
		prerelease: release.prerelease || false,
		draft: release.draft || false,
		html_url: release.html_url,
		assets: (release.assets || []).map((asset) => ({
			name: asset.name,
			download_url: asset.browser_download_url,
			size: asset.size,
			download_count: asset.download_count,
		})),
	}));

	// 过滤掉 draft 版本
	const publicReleases = releases.filter((r) => !r.draft);

	return {
		notModified: false,
		releases: publicReleases,
		etag: newEtag,
		latestVersion: publicReleases.length > 0 ? publicReleases[0].tag_name : null,
	};
}

// GitHub Releases 限流（公共端点，但有外部 API 调用，需要限流）
const githubReleasesRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 60,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: rateLimitKey,
});

// GET /api/software/:id/releases — 获取软件的 GitHub Release 列表
app.get(
	"/api/software/:id/releases",
	githubReleasesRateLimiter,
	async (req, res) => {
		try {
			const { id } = req.params;

			// 1. 查询软件的 website 字段
			const softwareRes = await pool.query(
				"SELECT website FROM softwares WHERE id = $1",
				[id],
			);
			if (softwareRes.rows.length === 0) {
				return res.status(404).json({ error: "软件不存在" });
			}

			const { website } = softwareRes.rows[0];
			const ghRepo = parseGitHubRepo(website);

			if (!ghRepo) {
				return res.json({
					success: true,
					data: [],
					message: "该软件未关联 GitHub 仓库",
					isGitHub: false,
				});
			}

			const { owner, repo } = ghRepo;

			// 2. 查缓存
			const cacheRes = await pool.query(
				"SELECT * FROM github_releases_cache WHERE software_id = $1",
				[id],
			);

			const cache = cacheRes.rows[0] || null;
			const now = new Date();
			const cacheAge = cache
				? (now.getTime() - new Date(cache.fetched_at).getTime()) / 1000
				: Infinity;

			// 3. 缓存命中且未过期 → 直接返回
			if (cache && cacheAge < GITHUB_CACHE_TTL) {
				console.log(
					`[GITHUB] 缓存命中 ${owner}/${repo} (age=${Math.round(cacheAge)}s)`,
				);
				return res.json({
					success: true,
					data: cache.releases || [],
					latestVersion: cache.latest_version,
					isGitHub: true,
					cached: true,
					cachedAt: cache.fetched_at,
				});
			}

			// 4. 缓存过期或不存在 → 调用 GitHub API
			console.log(
				`[GITHUB] 请求 ${owner}/${repo} ` +
					(cache ? `(ETag=${cache.etag?.slice(0, 16)}...)` : "(无缓存)"),
			);

			const result = await fetchGitHubReleases(
				owner,
				repo,
				cache?.etag || null,
			);

			// 5. 304 Not Modified → 更新 fetched_at，保留旧数据
			if (result.notModified && cache) {
				await pool.query(
					"UPDATE github_releases_cache SET fetched_at = NOW() WHERE software_id = $1",
					[id],
				);
				console.log(`[GITHUB] 304 Not Modified ${owner}/${repo}`);
				return res.json({
					success: true,
					data: cache.releases || [],
					latestVersion: cache.latest_version,
					isGitHub: true,
					cached: true,
					cachedAt: new Date().toISOString(),
				});
			}

			// 6. 有新数据 → 写入/更新缓存
			if (cache) {
				await pool.query(
					`UPDATE github_releases_cache 
					 SET releases = $1::jsonb, etag = $2, latest_version = $3, 
					     fetched_at = NOW(), updated_at = NOW()
					 WHERE software_id = $4`,
					[
						JSON.stringify(result.releases),
						result.etag,
						result.latestVersion,
						id,
					],
				);
			} else {
				await pool.query(
					`INSERT INTO github_releases_cache 
					 (software_id, owner, repo, releases, etag, latest_version)
					 VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
					[
						id,
						owner,
						repo,
						JSON.stringify(result.releases),
						result.etag,
						result.latestVersion,
					],
				);
			}

			console.log(
				`[GITHUB] 已缓存 ${owner}/${repo} (${result.releases.length} releases, latest=${result.latestVersion})`,
			);

			return res.json({
				success: true,
				data: result.releases,
				latestVersion: result.latestVersion,
				isGitHub: true,
				cached: false,
			});
		} catch (error) {
			console.error("[GITHUB] Releases 获取失败:", error.message);
			// 如果 GitHub API 失败但有过期缓存，返回过期缓存
			try {
				const { id } = req.params;
				const fallback = await pool.query(
					"SELECT * FROM github_releases_cache WHERE software_id = $1",
					[id],
				);
				if (fallback.rows.length > 0) {
					console.log("[GITHUB] GitHub API 失败，返回过期缓存");
					return res.json({
						success: true,
						data: fallback.rows[0].releases || [],
						latestVersion: fallback.rows[0].latest_version,
						isGitHub: true,
						cached: true,
						stale: true,
						cachedAt: fallback.rows[0].fetched_at,
					});
				}
			} catch (_) {
				// 缓存查询也失败，忽略
			}
			res.status(502).json({
				error: "GitHub API 请求失败",
				message: error.message,
			});
		}
	},
);

// POST /api/software/:id/releases/refresh — 强制刷新（需登录）
app.post(
	"/api/software/:id/releases/refresh",
	requireAuth,
	githubReleasesRateLimiter,
	async (req, res) => {
		try {
			const { id } = req.params;

			const softwareRes = await pool.query(
				"SELECT website FROM softwares WHERE id = $1",
				[id],
			);
			if (softwareRes.rows.length === 0) {
				return res.status(404).json({ error: "软件不存在" });
			}

			const ghRepo = parseGitHubRepo(softwareRes.rows[0].website);
			if (!ghRepo) {
				return res.status(400).json({
					error: "该软件未关联 GitHub 仓库",
				});
			}

			const { owner, repo } = ghRepo;

			// 强制刷新：不使用 ETag，直接拉取最新数据
			const result = await fetchGitHubReleases(owner, repo);

			if (result.notModified) {
				return res.json({
					success: true,
					message: "数据无变化",
				});
			}

			// 写入缓存（upsert）
			await pool.query(
				`INSERT INTO github_releases_cache 
				 (software_id, owner, repo, releases, etag, latest_version)
				 VALUES ($1, $2, $3, $4::jsonb, $5, $6)
				 ON CONFLICT (software_id) DO UPDATE SET
				   releases = EXCLUDED.releases,
				   etag = EXCLUDED.etag,
				   latest_version = EXCLUDED.latest_version,
				   fetched_at = NOW(),
				   updated_at = NOW()`,
				[
					id,
					owner,
					repo,
					JSON.stringify(result.releases),
					result.etag,
					result.latestVersion,
				],
			);

			console.log(
				`[GITHUB] 强制刷新 ${owner}/${repo} (${result.releases.length} releases)`,
			);

			return res.json({
				success: true,
				data: result.releases,
				latestVersion: result.latestVersion,
				message: `已刷新，共 ${result.releases.length} 个版本`,
			});
		} catch (error) {
			console.error("[GITHUB] 强制刷新失败:", error.message);
			res.status(502).json({
				error: "GitHub API 请求失败",
				message: error.message,
			});
		}
	},
);

// 按分类获取软件
app.get("/api/software/category/:category", async (req, res) => {
        try {
                const { category } = req.params;
                const result = await pool.query(
                        "SELECT * FROM softwares WHERE category = $1 ORDER BY created_at DESC",
                        [category],
                );
                res.json({ success: true, data: result.rows });
        } catch (error) {
                handleDatabaseError(error, res);
        }
});

// 搜索软件
app.get("/api/software/search/:query", async (req, res) => {
        try {
                const { query } = req.params;
                const result = await pool.query(
                        `SELECT * FROM softwares 
       WHERE name ILIKE $1 OR description ILIKE $1 
       ORDER BY created_at DESC`,
                        [`%${query}%`],
                );
                res.json({ success: true, data: result.rows });
        } catch (error) {
                handleDatabaseError(error, res);
        }
});

// ===== 比较功能 API =====

// 获取所有比较组
app.get("/api/comparison/groups", async (_req, res) => {
        try {
                const result = await pool.query(
                        "SELECT * FROM comparison_groups ORDER BY created_at DESC",
                );
                res.json({ success: true, data: result.rows });
        } catch (error) {
                handleDatabaseError(error, res);
        }
});

// 创建比较组
app.post(
        "/api/comparison/groups",
        requireAuth,
        writeRateLimiter,
        async (req, res) => {
                try {
                        const { name, description } = req.body;

                        if (!name) {
                                return res.status(400).json({
                                        error: "缺少必要信息",
                                        message: "比较组名称是必填项",
                                });
                        }

                        const result = await pool.query(
                                `
      INSERT INTO comparison_groups (name, description, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `,
                                [name, description || ""],
                        );

                        res.json({ success: true, data: result.rows[0] });
                } catch (error) {
                        handleDatabaseError(error, res);
                }
        },
);

// 获取比较组中的软件
app.get("/api/comparison/groups/:groupId/software", async (req, res) => {
        try {
                const { groupId } = req.params;
                const result = await pool.query(
                        `
      SELECT s.* FROM softwares s
      INNER JOIN comparison_group_softwares cgs ON s.id = cgs.software_id
      WHERE cgs.group_id = $1
      ORDER BY s.name
    `,
                        [groupId],
                );

                res.json({ success: true, data: result.rows });
        } catch (error) {
                handleDatabaseError(error, res);
        }
});

// 向比较组添加软件
app.post(
        "/api/comparison/groups/:groupId/software/:softwareId",
        requireAuth,
        writeRateLimiter,
        async (req, res) => {
                try {
                        const { groupId, softwareId } = req.params;

                        await pool.query(
                                `
      INSERT INTO comparison_group_softwares (group_id, software_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (group_id, software_id) DO NOTHING
    `,
                                [groupId, softwareId],
                        );

                        res.json({ success: true, message: "软件已添加到比较组" });
                } catch (error) {
                        handleDatabaseError(error, res);
                }
        },
);

// 从比较组移除软件
app.delete(
        "/api/comparison/groups/:groupId/software/:softwareId",
        requireAuth,
        writeRateLimiter,
        async (req, res) => {
                try {
                        const { groupId, softwareId } = req.params;

                        const result = await pool.query(
                                `
      DELETE FROM comparison_group_softwares 
      WHERE group_id = $1 AND software_id = $2
    `,
                                [groupId, softwareId],
                        );

                        if (result.rowCount === 0) {
                                return res.status(404).json({ error: "关联关系不存在" });
                        }

                        res.json({ success: true, message: "软件已从比较组移除" });
                } catch (error) {
                        handleDatabaseError(error, res);
                }
        },
);

// 获取软件所属的比较组
app.get("/api/comparison/software/:softwareId/groups", async (req, res) => {
        try {
                const { softwareId } = req.params;
                const result = await pool.query(
                        `
      SELECT DISTINCT s.*, cg.id as group_id, cg.name as group_name, 
             cg.description as group_description, cg.created_at as group_created_at,
             cg.updated_at as group_updated_at
      FROM softwares s
      INNER JOIN comparison_group_softwares cgs1 ON s.id = cgs1.software_id
      INNER JOIN comparison_group_softwares cgs2 ON cgs1.group_id = cgs2.group_id
      INNER JOIN comparison_groups cg ON cgs1.group_id = cg.id
      WHERE cgs2.software_id = $1 AND s.id != $1
      ORDER BY s.name
    `,
                        [softwareId],
                );

                // 将结果格式化为前端期望的格式
                const formattedData = result.rows.map((row) => ({
                        id: row.id,
                        name: row.name,
                        category: row.category,
                        description: row.description,
                        icon: row.icon,
                        website: row.website,
                        license: row.license,
                        systems: row.systems,
                        pros: row.pros,
                        cons: row.cons,
                        created_at: row.created_at,
                        groupInfo: {
                                id: row.group_id,
                                name: row.group_name,
                                description: row.group_description,
                                created_at: row.group_created_at,
                                updated_at: row.group_updated_at,
                        },
                }));

                res.json({ success: true, data: formattedData });
        } catch (error) {
                handleDatabaseError(error, res);
        }
});

// 保存/更新比较分析
app.post(
        "/api/comparison/groups/:groupId/analysis",
        requireAuth,
        writeRateLimiter,
        async (req, res) => {
                try {
                        const { groupId } = req.params;
                        const { content } = req.body;

                        if (!content) {
                                return res.status(400).json({
                                        error: "缺少必要信息",
                                        message: "分析内容是必填项",
                                });
                        }

                        const result = await pool.query(
                                `
      INSERT INTO comparison_analyses (group_id, content, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (group_id) 
      DO UPDATE SET content = $2, updated_at = NOW()
      RETURNING *
    `,
                                [groupId, content],
                        );

                        res.json({ success: true, data: result.rows[0] });
                } catch (error) {
                        handleDatabaseError(error, res);
                }
        },
);

// 更新比较分析
app.put(
        "/api/comparison/groups/:groupId/analysis",
        requireAuth,
        writeRateLimiter,
        async (req, res) => {
                try {
                        const { groupId } = req.params;
                        const { content } = req.body;

                        if (!content) {
                                return res.status(400).json({
                                        error: "缺少必要信息",
                                        message: "分析内容是必填项",
                                });
                        }

                        const result = await pool.query(
                                `
      UPDATE comparison_analyses 
      SET content = $2, updated_at = NOW()
      WHERE group_id = $1
      RETURNING *
    `,
                                [groupId, content],
                        );

                        if (result.rows.length === 0) {
                                // 如果不存在，则创建新的
                                const insertResult = await pool.query(
                                        `
        INSERT INTO comparison_analyses (group_id, content, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING *
      `,
                                        [groupId, content],
                                );

                                res.json({ success: true, data: insertResult.rows[0] });
                        } else {
                                res.json({ success: true, data: result.rows[0] });
                        }
                } catch (error) {
                        handleDatabaseError(error, res);
                }
        },
);

// 获取比较分析
app.get("/api/comparison/groups/:groupId/analysis", async (req, res) => {
        try {
                const { groupId } = req.params;
                const result = await pool.query(
                        `
      SELECT * FROM comparison_analyses WHERE group_id = $1
    `,
                        [groupId],
                );

                if (result.rows.length === 0) {
                        return res.json({ success: true, data: null });
                }

                res.json({ success: true, data: result.rows[0] });
        } catch (error) {
                handleDatabaseError(error, res);
        }
});

// ========== 动态 SEO 端点（无论是否有 dist 目录都需要） ==========

// 动态 robots.txt：包含基于请求的绝对 Sitemap URL
app.get("/robots.txt", (req, res) => {
        res.type("text/plain").send(generateRobotsTxt(req));
});

// 动态 sitemap.xml：从数据库生成
app.get("/sitemap.xml", async (req, res) => {
        try {
                const xml = await generateSitemap(req);
                res.type("application/xml").send(xml);
        } catch (error) {
                console.error("[SEO] sitemap 生成失败:", error.message);
                res.status(500).type("text/plain").send("Sitemap generation failed");
        }
});

// ========== 生产环境：静态文件服务和SPA路由fallback ==========
// 在所有API路由之后，启动服务器之前配置
const distPath = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "dist",
);

if (fs.existsSync(distPath)) {
        // 静态文件服务：提供dist目录中的CSS、JS、图片等资源
        app.use(express.static(distPath));

        // 预读 index.html 模板，避免每次请求都读文件
        const indexHtml = fs.readFileSync(
                path.join(distPath, "index.html"),
                "utf-8",
        );

        // SEO 预渲染：为每个路由注入 meta/JSON-LD/HTML 内容
        // Express 5.x (path-to-regexp v8) 不支持内联正则，用纯参数 + 函数内校验
        app.get("/share/software/:id", async (req, res, next) => {
                if (!/^\d+$/.test(req.params.id)) return next();
                await prerenderShare(req, res, indexHtml);
        });
        app.get("/software/:id", async (req, res, next) => {
                if (!/^\d+$/.test(req.params.id)) return next();
                await prerenderDetail(req, res, indexHtml);
        });

        // SPA路由fallback：所有非API路由都返回index.html，让Vue Router处理前端路由
        // 首页走预渲染，其余路由返回原始 index.html
        // Express 5.x 需要使用命名通配符语法
        app.get("/{*splat}", async (req, res, next) => {
                // 排除API路由和静态资源路由
                if (req.path.startsWith("/api/") || req.path.startsWith("/icons/")) {
                        return next();
                }
                // 首页走预渲染
                if (req.path === "/" || req.path === "") {
                        await prerenderHome(req, res, indexHtml);
                        return;
                }
                // 其余路由返回原始 SPA HTML
                res.send(indexHtml);
        });

        console.log("✅ 已启用生产模式：静态文件服务 + SEO预渲染 + SPA路由fallback");
} else {
        console.log("⚠️  未找到dist目录，跳过静态文件服务（开发模式）");
}

// 获取本机IP地址的函数
const getLocalIPAddress = () => {
        const nets = networkInterfaces();
        for (const name of Object.keys(nets)) {
                for (const net of nets[name]) {
                        // 跳过内部地址（如127.0.0.1）和IPv6地址
                        if (net.family === "IPv4" && !net.internal) {
                                return net.address;
                        }
                }
        }
        return "localhost";
};

// 启动服务器
app.listen(PORT, "0.0.0.0", () => {
        const localIP = getLocalIPAddress();
        console.log(`🚀 后端服务器已启动，监听所有网络接口`);
        console.log(`📍 本地访问: http://localhost:${PORT}`);
        console.log(`🌐 网络访问: http://${localIP}:${PORT}`);
        console.log(`📊 API测试: http://localhost:${PORT}/api/test`);
        console.log(`🔧 软件管理: http://localhost:${PORT}/api/software`);
        console.log(`📋 比较功能: http://localhost:${PORT}/api/comparison/groups`);
        console.log(`---`);
        console.log(`💡 提示: 现在可以通过本机IP在其他设备上访问此服务`);
});

// 处理进程退出
process.on("SIGINT", async () => {
        console.log("正在关闭服务器...");
        await pool.end();
        process.exit(0);
});
