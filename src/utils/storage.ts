import { ApiKeyItem, GroupItem, VaultSecurityConfig } from '../types';

export const DEFAULT_GROUPS: GroupItem[] = [];

export const INITIAL_API_KEYS: ApiKeyItem[] = [];

const STORAGE_KEYS = {
  API_KEYS: 'keyvault_api_keys_v4',
  GROUPS: 'keyvault_groups_v4',
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
