import { ApiKeyItem, GroupItem, VaultSecurityConfig, ArtistStringItem, PromptItem } from '../types';

export const DEFAULT_GROUPS: GroupItem[] = [];

export const INITIAL_API_KEYS: ApiKeyItem[] = [];

export const INITIAL_ARTIST_STRINGS: ArtistStringItem[] = [];

export const INITIAL_PROMPTS: PromptItem[] = [];

const STORAGE_KEYS = {
  API_KEYS: 'keyvault_api_keys_v4',
  GROUPS: 'keyvault_groups_v4',
  ARTIST_STRINGS: 'keyvault_artist_strings_v3',
  PROMPTS: 'keyvault_prompts_v3',
  IMAGEGEN_CATEGORIES: 'keyvault_imagegen_categories_v4',
  VAULT_CONFIG: 'keyvault_security_config_v1',
  THEME: 'keyvault_theme_mode_v1',
};

// Normalize keys to support both single and multiple keys format
function normalizeItem(raw: any): ApiKeyItem {
  let keys = Array.isArray(raw.keys) ? raw.keys : [];
  if (keys.length === 0 && raw.apiKey) {
    keys = [{ id: 'k-default', key: raw.apiKey, note: '' }];
  }
  return {
    ...raw,
    keys,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    models: Array.isArray(raw.models) ? raw.models : [],
    description: raw.description || raw.notes || '',
  };
}

export function loadSavedApiKeys(): ApiKeyItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.API_KEYS);
    if (!data) {
      saveApiKeys([]);
      return [];
    }
    const parsed = JSON.parse(data);
    return parsed.map(normalizeItem);
  } catch (e) {
    console.error('Failed to load api keys', e);
    return [];
  }
}

export function saveApiKeys(items: ApiKeyItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save api keys', e);
  }
}

export function loadSavedGroups(): GroupItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (!data) {
      saveGroups([]);
      return [];
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load groups', e);
    return [];
  }
}

export function saveGroups(groups: GroupItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  } catch (e) {
    console.error('Failed to save groups', e);
  }
}

export function loadSavedArtistStrings(): ArtistStringItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ARTIST_STRINGS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      id: item.id || 'art-' + Math.random().toString(36).substring(2, 9),
      name: item.name || '未命名画师串',
      author: item.author || '',
      source: item.source || '',
      category: item.category || item.style || '默认',
      images: Array.isArray(item.images) ? item.images : item.previewImageUrl ? [item.previewImageUrl] : [],
      positivePrompt: item.positivePrompt || item.artistString || '',
      negativePrompt: item.negativePrompt || '',
      createdAt: item.createdAt || Date.now(),
      updatedAt: item.updatedAt || Date.now(),
    }));
  } catch (e) {
    console.error('Failed to load artist strings', e);
    return [];
  }
}

export function saveArtistStrings(items: ArtistStringItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ARTIST_STRINGS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save artist strings', e);
  }
}

export function loadSavedPrompts(): PromptItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROMPTS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      id: item.id || 'pmt-' + Math.random().toString(36).substring(2, 9),
      name: item.name || item.title || '未命名提示词',
      author: item.author || '',
      category: item.category || item.style || '默认',
      images: Array.isArray(item.images) ? item.images : item.previewImageUrl ? [item.previewImageUrl] : [],
      positivePrompt: item.positivePrompt || '',
      negativePrompt: item.negativePrompt || '',
      createdAt: item.createdAt || Date.now(),
      updatedAt: item.updatedAt || Date.now(),
    }));
  } catch (e) {
    console.error('Failed to load prompts', e);
    return [];
  }
}

export function savePrompts(items: PromptItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save prompts', e);
  }
}

export function loadImageGenCategories(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.IMAGEGEN_CATEGORIES);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveImageGenCategories(cats: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.IMAGEGEN_CATEGORIES, JSON.stringify(cats));
  } catch (e) {
    console.error('Failed to save imagegen categories', e);
  }
}

export function loadVaultConfig(): VaultSecurityConfig {
  const defaultConfig: VaultSecurityConfig = {
    isVaultInitialized: false,
    isVaultLocked: false,
    autoLockMinutes: 15,
  };
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VAULT_CONFIG);
    if (!data) return defaultConfig;
    return { ...defaultConfig, ...JSON.parse(data) };
  } catch {
    return defaultConfig;
  }
}

export function saveVaultConfig(config: VaultSecurityConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VAULT_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save vault config', e);
  }
}

export function loadThemeMode(): 'light' | 'dark' {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (theme === 'light' || theme === 'dark') return theme;
  } catch {}
  return 'light'; // 初始默认模式为日间模式
}

export function saveThemeMode(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {}
}
