import { BaseEntity, SystemType, LicenseType } from './base';

// 下载链接提供方
export type DownloadProvider =
  | 'baidu'     // 百度网盘
  | 'quark'     // 夸克网盘
  | 'lanzou'    // 蓝奏云
  | 'aliyun'    // 阿里云盘
  | '115'       // 115网盘
  | 'magnet'    // 磁力链接
  | 'ed2k'      // 电驴 ED2K
  | 'official'  // 官方直链
  | 'other';

// 下载链接记录（私密）
export interface DownloadLink {
  id: string;
  provider: DownloadProvider;
  url: string;
  code?: string;         // 提取码
  password?: string;     // 压缩包密码
  versionLabel?: string; // 版本说明：如 v1.2.3 便携/破解版
  notes?: string;        // 备注
  status?: 'unknown' | 'alive' | 'dead';
  createdAt: string;
  expiresAt?: string;
}

// 私密信息类型
export type SecretKind = 'license' | 'account' | 'config' | 'other';

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
  | '社交'
  | '生活'
  | '购物'
  | '影音'
  | '阅读'
  | '休闲'
  | '旅行'
  | '办公'
  | '工具'
  | '编程';

// 软件接口
export interface Software extends BaseEntity {
  name: string;
  category: SoftwareCategory;
  description: string;
  icon: string;
  license: LicenseType;
  systems: SystemType[];
  website: string;
  pros: string[];
  cons: string[];
  // 私密保存的安装包/网盘链接列表
  download_links?: DownloadLink[];
  // 私密信息（后端仅返回元信息，不含明文）
  secrets?: SecretItem[];
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