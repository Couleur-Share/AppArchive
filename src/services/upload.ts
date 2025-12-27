import logger from "../utils/logger";
import { getApiBase } from "./apiBase";
import { getAuthHeaders } from "./auth";

const API_BASE_URL = getApiBase();

export const uploadService = {
	async uploadIcon(file: File): Promise<{ path: string; filename: string }> {
		const form = new FormData();
		form.append("icon", file);

		try {
			const response = await fetch(`${API_BASE_URL}/upload/icon`, {
				method: "POST",
				body: form,
				headers: {
					...getAuthHeaders(),
				},
			});

			// 检查响应内容类型
			const contentType = response.headers.get("content-type");
			if (contentType?.includes("text/html")) {
				// 如果返回的是HTML，说明可能是服务器错误页面
				const text = await response.text();
				logger.error("服务器返回HTML错误页面:", text.substring(0, 500));
				throw new Error(
					"服务器错误：返回了HTML错误页面，请检查服务器代码是否已更新",
				);
			}

			if (!response.ok) {
				const text = await response.text().catch(() => "");
				// 尝试解析JSON错误
				try {
					const errorData = JSON.parse(text);
					throw new Error(errorData.message || errorData.error || "上传失败");
				} catch {
					// 如果不是JSON，直接抛出文本错误
					throw new Error(text || "上传失败");
				}
			}

			const data = await response.json();
			if (!data?.success || !data?.path) {
				logger.error("上传响应异常:", data);
				throw new Error(data?.message || "上传失败");
			}
			return { path: data.path, filename: data.filename };
		} catch (error) {
			logger.error("上传图标失败:", error);
			if (error instanceof Error) {
				throw error;
			}
			throw new Error("上传失败，请重试");
		}
	},
};
