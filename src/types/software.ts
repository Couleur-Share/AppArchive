import type { BaseEntity, LicenseType, SystemType } from "./base";

// 下载链接提供方
export type DownloadProvider =
	| "baidu" // 百度网盘
	| "quark" // 夸克网盘
	| "lanzou" // 蓝奏云
	| "aliyun" // 阿里云盘
	| "115" // 115网盘
	| "magnet" // 磁力链接
	| "ed2k" // 电驴 ED2K
	| "official" // 官方直链
	| "other";

// 下载链接记录（私密）
export interface DownloadLink {
	id: string;
	provider: DownloadProvider;
	url: string;
	code?: string; // 提取码
	password?: string; // 压缩包密码
	versionLabel?: string; // 版本说明：如 v1.2.3 便携/破解版
	notes?: string; // 备注
	status?: "unknown" | "alive" | "dead";
	createdAt: string;
	expiresAt?: string;
}

// 私密信息类型
export type SecretKind = "license" | "account" | "config" | "other";

// 返回给前端展示用（不包含明文）的私密项
export interface SecretItem {
	id: string;
	kind: SecretKind;
	label: string;
	notes?: string;
	expiresAt?: string;
	createdAt: string;
	hasValue?: boolean; // 后端用于告知是否存在受保护的值
}

// 软件类别
export type SoftwareCategory =
	| "社交"
	| "生活"
	| "购物"
	| "影音"
	| "阅读"
	| "休闲"
	| "旅行"
	| "办公"
	| "工具"
	| "编程";

// 关联文章类型
export type RelatedArticleType =
	| "document"
	| "tips"
	| "faq"
	| "changelog"
	| "other";

// 关联文章记录
export interface RelatedArticle {
	id: string;
	title: string;
	url: string;
	type: RelatedArticleType;
	description?: string;
	sortOrder: number;
	createdAt: string;
}

// 核心亮点分类：用于概览页按语义选取图标与强调色
export type HighlightKind =
	| "performance"
	| "privacy"
	| "security"
	| "ecosystem"
	| "ux"
	| "integration"
	| "pricing"
	| "other";

// 核心亮点：标题 + 详情 + 分类
export interface SoftwareHighlight {
	title: string;
	detail: string;
	kind?: HighlightKind | string;
}

// 适用场景：目标人群/场景 + 推荐理由
export interface SoftwareBestFor {
	persona: string;
	reason: string;
}

// 规避场景：不适合的情况 + 原因
export interface SoftwareAvoidIf {
	situation: string;
	reason: string;
}

// 软件接口
export interface Software extends BaseEntity {
	name: string;
	category: SoftwareCategory;
	description: string;
	icon: string;
	license: LicenseType;
	systems: SystemType[];
	website: string;
	version?: string; // 最新版本号
	rating?: number; // 评分 (0-5)
	downloads?: number; // 下载量
	pros: string[];
	cons: string[];
	warnings?: string[];
	// 一句话价值主张（15-25 字），用于概览页 hero 标语
	tagline?: string;
	// 核心亮点（2-4 条），概览页结构化卡片数据源
	highlights?: SoftwareHighlight[];
	// 适用场景（2-4 条），详细信息页「适合谁用」
	best_for?: SoftwareBestFor[];
	// 规避场景（0-3 条），详细信息页「什么情况别用」
	avoid_if?: SoftwareAvoidIf[];
	// 最近一次 AI 分析元数据（用于详情页溯源展示）
	analysis_provider?: string;
	analysis_model?: string;
	analysis_at?: string;
	analysis_sources?: string[];
	// 私密保存的安装包/网盘链接列表
	download_links?: DownloadLink[];
	// 私密信息（后端仅返回元信息，不含明文）
	secrets?: SecretItem[];
	// 关联文章列表
	related_articles?: RelatedArticle[];
}

// 列表接口的轻量字段（详情字段为可选）
export interface SoftwareListItem extends BaseEntity {
	name: string;
	category?: SoftwareCategory;
	description?: string;
	icon?: string;
	license?: LicenseType;
	systems?: SystemType[];
	website?: string;
	version?: string;
	rating?: number;
	downloads?: number;
	pros?: string[];
	cons?: string[];
	warnings?: string[];
	tagline?: string;
	highlights?: SoftwareHighlight[];
	best_for?: SoftwareBestFor[];
	avoid_if?: SoftwareAvoidIf[];
	analysis_provider?: string;
	analysis_model?: string;
	analysis_at?: string;
	analysis_sources?: string[];
	download_links?: DownloadLink[];
	secrets?: SecretItem[];
	related_articles?: RelatedArticle[];
}

// 软件比较组
export interface ComparisonGroup extends BaseEntity {
	name: string;
	description?: string;
}

// 比较组软件关系
export interface ComparisonGroupSoftware extends BaseEntity {
	group_id: number;
	software_id: number;
}

// 比较分析
export interface ComparisonAnalysis extends BaseEntity {
	group_id: number;
	content: string;
}

// GitHub Release 资产
export interface GitHubReleaseAsset {
	name: string;
	download_url: string;
	size: number;
	download_count: number;
}

// GitHub Release 版本
export interface GitHubRelease {
	tag_name: string;
	name: string;
	body: string; // Markdown 格式的更新日志
	published_at: string;
	prerelease: boolean;
	html_url: string;
	assets: GitHubReleaseAsset[];
}

// GitHub Releases API 响应
export interface GitHubReleasesResponse {
	success: boolean;
	data: GitHubRelease[];
	latestVersion?: string | null;
	isGitHub: boolean;
	cached?: boolean;
	stale?: boolean;
	cachedAt?: string;
	message?: string;
}
