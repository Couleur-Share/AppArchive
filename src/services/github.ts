import type { GitHubReleasesResponse } from "../types/software";
import { getApiBase } from "./apiBase";
import logger from "../utils/logger";

const API_BASE_URL = getApiBase();

export const githubService = {
	async fetchGithubData(url: string) {
		try {
			// 从 URL 中提取 owner 和 repo
			const [, owner, repo] = new URL(url).pathname.split("/");
			if (!owner || !repo) {
				throw new Error("无效的 GitHub 链接");
			}

			const response = await fetch(
				`https://api.github.com/repos/${owner}/${repo}`,
			);
			if (!response.ok) {
				throw new Error("GitHub API 请求失败");
			}

			const data = await response.json();

			return {
				name: data.name,
				description: data.description || "",
				website: data.html_url,
				icon: data.owner.avatar_url,
				category: "工具",
				license: "开源" as const,
				systems: ["Windows"],
			};
		} catch (error) {
			// 在服务失败时记录错误
			// 延用统一 logger（生产环境也会输出 error）
			logger.error("GitHub 数据获取错误:", error);
			throw new Error("无法获取 GitHub 仓库信息");
		}
	},

	/**
	 * 获取软件的 GitHub Release 列表
	 * 后端会自动从 website 字段检测 GitHub 仓库并管理缓存
	 */
	async getReleases(softwareId: number): Promise<GitHubReleasesResponse> {
		try {
			const response = await fetch(
				`${API_BASE_URL}/software/${softwareId}/releases`,
			);
			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ error: "请求失败" }));
				throw new Error(
					errorData.message || errorData.error || "获取版本信息失败",
				);
			}
			return await response.json();
		} catch (error) {
			logger.error(`获取 GitHub Releases 失败 (ID: ${softwareId}):`, error);
			throw error;
		}
	},

	/**
	 * 强制刷新 GitHub Release 数据（需登录）
	 */
	async refreshReleases(softwareId: number): Promise<GitHubReleasesResponse> {
		try {
			const { getAuthHeaders } = await import("./auth");
			const response = await fetch(
				`${API_BASE_URL}/software/${softwareId}/releases/refresh`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...getAuthHeaders(),
					},
				},
			);
			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ error: "请求失败" }));
				throw new Error(errorData.message || errorData.error || "刷新失败");
			}
			return await response.json();
		} catch (error) {
			logger.error(`刷新 GitHub Releases 失败 (ID: ${softwareId}):`, error);
			throw error;
		}
	},

	/**
	 * 检测 URL 是否为 GitHub 仓库
	 */
	isGitHubRepo(url: string | undefined | null): boolean {
		if (!url) return false;
		try {
			const parsed = new URL(url);
			if (parsed.hostname !== "github.com") return false;
			const parts = parsed.pathname
				.replace(/\/$/, "")
				.split("/")
				.filter(Boolean);
			return parts.length >= 2;
		} catch {
			return false;
		}
	},

	/**
	 * 从 GitHub URL 中提取 owner/repo
	 */
	parseRepo(url: string): { owner: string; repo: string } | null {
		try {
			const parsed = new URL(url);
			if (parsed.hostname !== "github.com") return null;
			const parts = parsed.pathname
				.replace(/\/$/, "")
				.split("/")
				.filter(Boolean);
			if (parts.length < 2) return null;
			return { owner: parts[0], repo: parts[1] };
		} catch {
			return null;
		}
	},
};
