import { ApiKeyItem, GroupItem, ExportData, ArtistStringItem, PromptItem } from '../types';

export function createExportData(
  apiKeys: ApiKeyItem[],
  groups: GroupItem[],
  isEncrypted: boolean,
  artistStrings?: ArtistStringItem[],
  prompts?: PromptItem[]
): ExportData {
  return {
    version: '1.1.0',
    app: 'KeyVault',
    exportedAt: new Date().toISOString(),
    isEncrypted,
    groups,
    apiKeys,
    artistStrings,
    prompts,
  };
}

export function downloadJsonFile(data: object, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ImportValidationResult {
  valid: boolean;
  error?: string;
  data?: ExportData;
}

export function validateImportContent(content: string): ImportValidationResult {
  try {
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: '导入的文件格式不正确，不是有效的 JSON 数据。' };
    }
    if (!Array.isArray(parsed.apiKeys)) {
      return { valid: false, error: '文件中缺少有效的 API 密钥列表 (apiKeys)。' };
    }
    return {
      valid: true,
      data: parsed as ExportData,
    };
  } catch (err: any) {
    return { valid: false, error: 'JSON 解析失败: ' + err.message };
  }
}
