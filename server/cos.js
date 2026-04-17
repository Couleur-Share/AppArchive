import COS from "cos-nodejs-sdk-v5";
import dotenv from "dotenv";

// ESM import 会在 index.js 的 dotenv.config() 之前执行，因此这里需先加载环境变量
dotenv.config({ override: true });
dotenv.config({ path: ".env.local", override: true });

// 从环境变量构建 COS 配置，严禁再使用硬编码密钥
const COS_CONFIG = {
	SecretId: process.env.COS_SECRET_ID || "",
	SecretKey: process.env.COS_SECRET_KEY || "",
	Bucket: process.env.COS_BUCKET || "",
	Region: process.env.COS_REGION || "",
	StoragePath: process.env.COS_STORAGE_PATH || "AppArchive/",
	Domain: process.env.COS_DOMAIN || "",
};

const missingCosFields = ["SecretId", "SecretKey", "Bucket", "Region"].filter(
	(key) => !COS_CONFIG[key],
);

const COS_ENABLED = missingCosFields.length === 0;

let cos = null;
if (COS_ENABLED) {
	const derivedDomain = `https://${COS_CONFIG.Bucket}.cos.${COS_CONFIG.Region}.myqcloud.com`;
	COS_CONFIG.Domain = COS_CONFIG.Domain || derivedDomain;
	cos = new COS({
		SecretId: COS_CONFIG.SecretId,
		SecretKey: COS_CONFIG.SecretKey,
	});
	console.log("✅ COS 已配置并启用");
} else {
	console.warn(
		`⚠️ COS 未配置 (缺少: ${missingCosFields.join(", ")})。图片上传功能将不可用。`,
	);
}

/**
 * 上传文件到腾讯云COS
 * @param {Buffer} fileBuffer 文件内容（Buffer）
 * @param {string} fileName 文件名
 * @param {string} contentType MIME类型
 * @returns {Promise<string>} 返回完整的COS访问URL
 */
export async function uploadToCOS(fileBuffer, fileName, contentType) {
	if (!COS_ENABLED) {
		throw new Error(
			"COS 未配置，无法上传文件。请配置 COS_SECRET_ID、COS_SECRET_KEY、COS_BUCKET、COS_REGION 环境变量。",
		);
	}
	try {
		const key = `${COS_CONFIG.StoragePath}${fileName}`;
		const _result = await cos.putObject({
			Bucket: COS_CONFIG.Bucket,
			Region: COS_CONFIG.Region,
			Key: key,
			Body: fileBuffer,
			ContentType: contentType,
		});
		const url = `${COS_CONFIG.Domain}/${key}`;
		console.log(`✅ 文件上传成功到COS: ${url}`);
		return url;
	} catch (error) {
		console.error("❌ COS上传失败:", error);
		throw new Error(`COS上传失败: ${error.message}`);
	}
}

/**
 * 生成唯一的临时文件名（用于上传时）
 * 完全忽略原始文件名，只使用时间戳和随机数确保唯一性
 * @param {string} mimeType MIME类型（用于推断扩展名）
 * @returns {string} 生成的文件名，格式：icon_时间戳_随机数.扩展名
 */
export function generateUniqueFileName(mimeType) {
	// 根据MIME类型确定扩展名
	const mimeToExt = {
		"image/png": ".png",
		"image/jpeg": ".jpg",
		"image/jpg": ".jpg",
		"image/webp": ".webp",
		"image/svg+xml": ".svg",
		"image/x-icon": ".ico",
		"image/vnd.microsoft.icon": ".ico",
	};

	const ext = mimeToExt[mimeType] || ".png";

	// 生成简单的临时文件名：icon_时间戳_随机数.扩展名
	const timestamp = Date.now();
	const random = Math.round(Math.random() * 1e9);

	return `icon_${timestamp}_${random}${ext}`;
}

/**
 * 检查COS中文件是否存在
 * @param {string} fileName 文件名（可能包含中文）
 * @returns {Promise<boolean>} 文件是否存在
 */
export async function checkFileExists(fileName) {
	if (!COS_ENABLED) {
		return false;
	}
	try {
		const key = `${COS_CONFIG.StoragePath}${fileName}`;
		await cos.headObject({
			Bucket: COS_CONFIG.Bucket,
			Region: COS_CONFIG.Region,
			Key: key,
		});
		return true;
	} catch (error) {
		if (error.statusCode === 404) {
			return false;
		}
		console.warn(`检查文件是否存在时出错: ${fileName}`, error.message);
		return false;
	}
}

/**
 * 在COS中重命名文件
 * @param {string} oldKey COS中的旧文件路径（完整key，可能包含中文）
 * @param {string} newKey COS中的新文件路径（完整key，可能包含中文）
 * @returns {Promise<string>} 返回新的完整访问URL
 */
export async function renameFileInCOS(oldKey, newKey) {
	if (!COS_ENABLED) {
		throw new Error("COS 未配置，无法重命名文件。");
	}
	try {
		console.log(`🔄 开始重命名COS文件: ${oldKey} -> ${newKey}`);

		// CopySource需要使用完整URL格式：{Bucket}.cos.{Region}.myqcloud.com/{Key}
		// Key部分需要URL编码（特别是包含中文时），但路径分隔符/不需要编码
		// 分段编码：对每个路径段进行编码，然后拼接
		const encodedOldKey = oldKey
			.split("/")
			.map((segment) => encodeURIComponent(segment))
			.join("/");
		const copySource = `${COS_CONFIG.Bucket}.cos.${COS_CONFIG.Region}.myqcloud.com/${encodedOldKey}`;

		console.log(`📋 CopySource: ${copySource}`);

		// 先复制文件到新位置
		await cos.putObjectCopy({
			Bucket: COS_CONFIG.Bucket,
			Region: COS_CONFIG.Region,
			Key: newKey, // 新Key不需要编码，SDK会自动处理
			CopySource: copySource,
		});

		console.log(`✅ 文件复制成功`);

		// 复制成功后删除旧文件
		await cos.deleteObject({
			Bucket: COS_CONFIG.Bucket,
			Region: COS_CONFIG.Region,
			Key: oldKey, // 删除时Key不需要编码，SDK会自动处理
		});

		console.log(`✅ 旧文件删除成功`);

		// 返回新的完整访问URL
		// URL中的中文需要编码
		const encodedNewKey = newKey
			.split("/")
			.map((segment) => encodeURIComponent(segment))
			.join("/");
		const url = `${COS_CONFIG.Domain}/${encodedNewKey}`;
		console.log(`✅ COS文件重命名成功: ${oldKey} -> ${newKey}`);
		return url;
	} catch (error) {
		console.error("❌ COS文件重命名失败:", error);
		console.error("错误详情:", {
			oldKey,
			newKey,
			message: error.message,
			code: error.code,
			statusCode: error.statusCode,
		});
		throw new Error(`COS文件重命名失败: ${error.message}`);
	}
}

/**
 * 生成基于软件名的唯一文件名（检查COS中是否已存在）
 * @param {string} softwareName 软件名称
 * @param {string} ext 文件扩展名（如 .png）
 * @returns {Promise<string>} 唯一的文件名
 */
export async function generateUniqueFileNameFromSoftwareName(
	softwareName,
	ext,
) {
	// 清理软件名，保留中文字符、英文字母、数字、下划线和连字符
	const sanitizeBaseName = (name) => {
		if (!name) return "icon";
		let result = String(name)
			.trim()
			.replace(/[\\/:*?"<>|]+/g, "") // 去除非法字符
			.replace(/\s+/g, "_"); // 空格转下划线

		// 只保留中文字符、英文字母、数字、下划线、连字符和点号
		// 使用更明确的正则表达式：[\u4e00-\u9fa5] 匹配中文，[a-zA-Z0-9_.-] 匹配英文、数字、下划线、点、连字符
		result = result.replace(/[^\u4e00-\u9fa5a-zA-Z0-9_.-]/g, "");

		// 如果清理后为空，返回默认值
		return result || "icon";
	};

	const base = sanitizeBaseName(softwareName) || "icon";
	let candidate = `${base}${ext}`;
	let index = 1;

	// 检查COS中是否已存在该文件
	while (await checkFileExists(candidate)) {
		candidate = `${base}_${index}${ext}`;
		index += 1;
	}

	return candidate;
}

/**
 * 从COS中删除文件
 * @param {string} key COS中的文件路径（完整key）
 * @returns {Promise<void>}
 */
export async function deleteFileFromCOS(key) {
	if (!COS_ENABLED) {
		console.warn("COS 未配置，跳过删除操作");
		return;
	}
	try {
		console.log(`🗑️ 开始删除COS文件: ${key}`);

		await cos.deleteObject({
			Bucket: COS_CONFIG.Bucket,
			Region: COS_CONFIG.Region,
			Key: key,
		});

		console.log(`✅ COS文件删除成功: ${key}`);
	} catch (error) {
		console.error("❌ COS文件删除失败:", error);
		// 如果是404错误（文件不存在），不抛出异常，因为文件可能已经被删除
		if (error.statusCode === 404) {
			console.warn(`⚠️ 文件不存在，跳过删除: ${key}`);
			return;
		}
		throw new Error(`COS文件删除失败: ${error.message}`);
	}
}

/**
 * 从COS URL中提取Key
 * @param {string} url COS文件的完整URL
 * @returns {string|null} 返回COS Key，如果不是COS URL则返回null
 */
export function extractKeyFromCosUrl(url) {
	if (!url || typeof url !== "string") return null;

	// 检查是否为COS URL
	if (!url.includes("cos.") || !url.includes("myqcloud.com")) {
		return null;
	}

	try {
		const urlObj = new URL(url);
		// 解码URL编码的路径（处理中文等特殊字符）
		const key = decodeURIComponent(
			urlObj.pathname.startsWith("/")
				? urlObj.pathname.substring(1)
				: urlObj.pathname,
		);
		return key;
	} catch (error) {
		console.error("提取COS Key失败:", error);
		return null;
	}
}

export default {
	uploadToCOS,
	generateUniqueFileName,
	checkFileExists,
	renameFileInCOS,
	generateUniqueFileNameFromSoftwareName,
	deleteFileFromCOS,
	extractKeyFromCosUrl,
};
