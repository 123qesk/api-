export interface KeyEntry {
  id: string;
  key: string;
  note?: string; // 备注，如 "主用", "生图", "备用"
  isEncrypted?: boolean;
  encryptedKey?: string;
  iv?: string;
  salt?: string;
}

export interface ApiKeyItem {
  id: string;
  name: string; // API 名称 (e.g. 薄荷, 公益站, GG, 柚子)
  baseUrl: string; // API 地址 (URL) (e.g. https://x666.me/v1)
  apiKey?: string; // 单 key 兼容字段
  keys: KeyEntry[]; // 支持一个 API 下存储多个 Key (带备注)
  groupId: string; // 所属分组ID (e.g. default, public, etc.)
  tags: string[]; // 自定义标签 (e.g. 公益站, 生图)
  models: string[]; // 已拉取的模型列表
  description?: string; // 描述信息 (选填)
  notes?: string;
  isEncrypted?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GroupItem {
  id: string;
  name: string; // e.g. 默认, 公益站, LLM, 生图
  description?: string;
}

export interface VaultSecurityConfig {
  isVaultInitialized: boolean;
  isVaultLocked: boolean;
  salt?: string;
  verifierHash?: string;
  autoLockMinutes: number;
  lastUnlockedAt?: number;
}

export interface ArtistStringItem {
  id: string;
  name: string; // 名称
  author?: string; // 作者
  source?: string; // 来源
  category: string; // 分类
  images: string[]; // 画师串预览（可多选图）
  positivePrompt: string; // 正面提示词
  negativePrompt: string; // 负面提示词
  createdAt: number;
  updatedAt: number;
  // 兼容旧字段
  artistString?: string;
  style?: string;
  tags?: string[];
  description?: string;
  weight?: string;
}

export interface PromptItem {
  id: string;
  name: string; // 名称
  author?: string; // 作者
  category: string; // 分类
  images: string[]; // 提示词预览（可多选图）
  positivePrompt: string; // 正面提示词
  negativePrompt: string; // 负面提示词
  createdAt: number;
  updatedAt: number;
  // 兼容旧字段
  title?: string;
  style?: string;
  tags?: string[];
  description?: string;
  parameters?: any;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  app: string;
  isEncrypted: boolean;
  groups: GroupItem[];
  apiKeys: ApiKeyItem[];
  artistStrings?: ArtistStringItem[];
  prompts?: PromptItem[];
}
