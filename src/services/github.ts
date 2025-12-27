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
			const { default: logger } = await import("../utils/logger");
			logger.error("GitHub 数据获取错误:", error);
			throw new Error("无法获取 GitHub 仓库信息");
		}
	},
};
