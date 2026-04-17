// GitHub Releases 抓取与缓存的统一入口
// 抽离自 server/index.js，供路由处理器和订阅调度器共同复用
import { pool } from "./database.js";

// 缓存有效期（秒），默认 6 小时
const GITHUB_CACHE_TTL = Number(process.env.GITHUB_CACHE_TTL || 21600);

// 从 URL 中解析 GitHub owner/repo，非 github.com 链接返回 null
export function parseGitHubRepo(url) {
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

// 调用 GitHub Releases API（支持 ETag 条件请求）
// 返回 { notModified, releases?, etag?, latestVersion? }
export async function fetchGitHubReleases(owner, repo, etag = null) {
	const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=50`;
	const headers = {
		Accept: "application/vnd.github+json",
		"User-Agent": "AppArchive-Bot/1.0",
	};

	const token = process.env.GITHUB_TOKEN;
	if (token) headers.Authorization = `Bearer ${token}`;

	if (etag) headers["If-None-Match"] = etag;

	const response = await fetch(url, { headers });

	if (response.status === 304) {
		return { notModified: true };
	}

	if (!response.ok) {
		const rateRemaining = response.headers.get("x-ratelimit-remaining");
		const rateReset = response.headers.get("x-ratelimit-reset");
		console.error(
			`[GITHUB_API] ${response.status} ${response.statusText} ` +
				`remaining=${rateRemaining} reset=${
					rateReset ? new Date(Number(rateReset) * 1000).toISOString() : "?"
				}`,
		);
		throw new Error(
			`GitHub API 请求失败: ${response.status} ${response.statusText}`,
		);
	}

	const data = await response.json();
	const newEtag = response.headers.get("etag") || null;

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

	// 过滤草稿
	const publicReleases = releases.filter((r) => !r.draft);

	return {
		notModified: false,
		releases: publicReleases,
		etag: newEtag,
		latestVersion:
			publicReleases.length > 0 ? publicReleases[0].tag_name : null,
	};
}

// 高层包装：根据 softwareId + website 保证 github_releases_cache 新鲜
// 返回 { releases, latestVersion, cachedAt, isGitHub, stale?, fromCache, fromNotModified }
// - forceRefresh=true 时不使用 ETag，直接拉取最新
// - 非 GitHub 仓库返回 { isGitHub:false, releases:[], latestVersion:null }
// - 缓存未过期直接返回缓存
// - 缓存过期调 fetchGitHubReleases；若 304 则只更新 fetched_at；若网络失败且有旧缓存则返回 stale=true
export async function ensureGitHubReleasesCache(
	softwareId,
	website,
	options = {},
) {
	const { forceRefresh = false } = options;
	const ghRepo = parseGitHubRepo(website);
	if (!ghRepo) {
		return {
			isGitHub: false,
			releases: [],
			latestVersion: null,
			cachedAt: null,
			fromCache: false,
			fromNotModified: false,
		};
	}

	const { owner, repo } = ghRepo;

	// 1. 查缓存
	const cacheRes = await pool.query(
		"SELECT * FROM github_releases_cache WHERE software_id = $1",
		[softwareId],
	);
	const cache = cacheRes.rows[0] || null;
	const now = new Date();
	const cacheAge = cache
		? (now.getTime() - new Date(cache.fetched_at).getTime()) / 1000
		: Infinity;

	// 2. 缓存命中且未过期（非强制刷新） → 直接返回
	if (!forceRefresh && cache && cacheAge < GITHUB_CACHE_TTL) {
		return {
			isGitHub: true,
			releases: cache.releases || [],
			latestVersion: cache.latest_version,
			cachedAt: cache.fetched_at,
			fromCache: true,
			fromNotModified: false,
		};
	}

	// 3. 缓存过期/不存在/强制刷新 → 调 GitHub API
	try {
		const result = await fetchGitHubReleases(
			owner,
			repo,
			forceRefresh ? null : cache?.etag || null,
		);

		// 4. 304 → 保留旧数据，更新 fetched_at
		if (result.notModified && cache) {
			await pool.query(
				"UPDATE github_releases_cache SET fetched_at = NOW() WHERE software_id = $1",
				[softwareId],
			);
			return {
				isGitHub: true,
				releases: cache.releases || [],
				latestVersion: cache.latest_version,
				cachedAt: new Date().toISOString(),
				fromCache: true,
				fromNotModified: true,
			};
		}

		// 5. 有新数据 → upsert 缓存
		const serialized = JSON.stringify(result.releases || []);
		if (cache) {
			await pool.query(
				`UPDATE github_releases_cache
				   SET releases = $1::jsonb, etag = $2, latest_version = $3,
				       fetched_at = NOW(), updated_at = NOW()
				 WHERE software_id = $4`,
				[serialized, result.etag, result.latestVersion, softwareId],
			);
		} else {
			await pool.query(
				`INSERT INTO github_releases_cache
				   (software_id, owner, repo, releases, etag, latest_version)
				 VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
				[
					softwareId,
					owner,
					repo,
					serialized,
					result.etag,
					result.latestVersion,
				],
			);
		}

		return {
			isGitHub: true,
			releases: result.releases || [],
			latestVersion: result.latestVersion,
			cachedAt: new Date().toISOString(),
			fromCache: false,
			fromNotModified: false,
		};
	} catch (err) {
		// 6. API 失败但有旧缓存 → 返回 stale
		if (cache) {
			console.error(
				`[GITHUB] API 失败回落到过期缓存 ${owner}/${repo}:`,
				err.message,
			);
			return {
				isGitHub: true,
				releases: cache.releases || [],
				latestVersion: cache.latest_version,
				cachedAt: cache.fetched_at,
				fromCache: true,
				fromNotModified: false,
				stale: true,
			};
		}
		// 没有任何缓存，上抛让调用者处理
		throw err;
	}
}
