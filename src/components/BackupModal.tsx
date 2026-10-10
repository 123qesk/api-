import React, { useState } from 'react';
import { ApiKeyItem, GroupItem, ExportData, ArtistStringItem, PromptItem } from '../types';
import { createExportData, downloadJsonFile, validateImportContent } from '../utils/exportImport';
import { useToast } from './Toast';
import {
  Download,
  Upload,
  Copy,
  X,
  FileJson,
  Check,
  AlertCircle,
  Database,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeyItem[];
  groups: GroupItem[];
  isVaultInitialized: boolean;
  isVaultLocked: boolean;
  onImportSuccess: (importedData: ExportData, mode: 'merge' | 'overwrite') => void;
  artistStrings?: ArtistStringItem[];
  prompts?: PromptItem[];
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  apiKeys,
  groups,
  isVaultInitialized,
  isVaultLocked,
  onImportSuccess,
  artistStrings = [],
  prompts = [],
}) => {
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [copiedExport, setCopiedExport] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<ExportData | null>(null);

  const totalModelsCount = apiKeys.reduce((acc, cur) => acc + (cur.models?.length || 0), 0);

  const handleExportDownload = () => {
    const data = createExportData(
      apiKeys,
      groups,
      isVaultInitialized && !isVaultLocked,
      artistStrings,
      prompts
    );
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `keyvault-backup-${dateStr}.json`;
    downloadJsonFile(data, filename);
    success(`已导出备份文件: ${filename}`);
  };

  const handleCopyExportJson = async () => {
    const data = createExportData(
      apiKeys,
      groups,
      isVaultInitialized && !isVaultLocked,
      artistStrings,
      prompts
    );
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2000);
      success('备份 JSON 已复制到剪贴板');
    } catch {
      error('复制失败');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        const check = validateImportContent(content);
        if (check.valid && check.data) {
          setParsedPreview(check.data);
          info(`文件解析成功，包含 ${check.data.apiKeys.length} 个 API 配置项`);
        } else {
          setParsedPreview(null);
          error(check.error || '文件解析失败');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleTextChange = (val: string) => {
    setImportText(val);
    if (!val.trim()) {
      setParsedPreview(null);
      return;
    }
    const check = validateImportContent(val);
    if (check.valid && check.data) {
      setParsedPreview(check.data);
    } else {
      setParsedPreview(null);
    }
  };

  const handleConfirmImport = () => {
    const check = validateImportContent(importText);
    if (!check.valid || !check.data) {
      error(check.error || '请先提供有效的备份 JSON 数据');
      return;
    }

    onImportSuccess(check.data, importMode);
    success(
      importMode === 'merge'
        ? `合并导入完成，新增/更新了 ${check.data.apiKeys.length} 项记录`
        : `覆盖导入完成，共载入 ${check.data.apiKeys.length} 项记录`
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              数据备份与导入导出
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/40">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white bg-white dark:bg-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>导出备份 (Export)</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white bg-white dark:bg-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>导入恢复 (Import)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-5">
              {/* Export stats overview */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center">
                <div>
                  <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                    {apiKeys.length}
                  </div>
                  <div className="text-[11px] text-neutral-500">API 站点记录</div>
                </div>
                <div>
                  <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                    {groups.length}
                  </div>
                  <div className="text-[11px] text-neutral-500">配置分组</div>
                </div>
                <div>
                  <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                    {totalModelsCount}
                  </div>
                  <div className="text-[11px] text-neutral-500">关联模型数</div>
                </div>
              </div>

              <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
                <p>
                  导出将生成标准的结构化 JSON 文件，包含所有的 API 站点名称、URL 端点、密钥、标签、分组以及已保存的模型配置。
                </p>
                {isVaultInitialized && isVaultLocked && (
                  <p className="text-amber-600 dark:text-amber-400 font-medium">
                    提示：当前金库处于锁定状态，密钥将以原始密文方式导出；若需在其他设备明文解密，请先解锁金库后再导出。
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleExportDownload}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>下载 .json 备份文件</span>
                </button>
                <button
                  onClick={handleCopyExportJson}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  {copiedExport ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedExport ? '已复制' : '复制 JSON'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File upload trigger */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  选择本地备份文件 (.json)
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-900 file:text-white dark:file:bg-neutral-100 dark:file:text-neutral-900 hover:file:opacity-90 cursor-pointer"
                />
              </div>

              {/* Paste textarea */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  或直接粘贴备份 JSON 文本
                </label>
                <textarea
                  rows={4}
                  value={importText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="在此粘贴导出的 JSON 备份文本..."
                  className="w-full p-2.5 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                />
              </div>

              {/* Parsed preview badge */}
              {parsedPreview && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      已验证数据：检测到 <strong>{parsedPreview.apiKeys?.length || 0}</strong> 个 API
                      记录与 <strong>{parsedPreview.groups?.length || 0}</strong> 个分组
                    </span>
                  </div>
                </div>
              )}

              {/* Import mode strategy */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  导入模式
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      importMode === 'merge'
                        ? 'border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-950 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <div>合并导入 (推荐)</div>
                    <div className="text-[11px] font-normal text-neutral-400 mt-0.5">
                      保留现有配置，新增导入项
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('overwrite')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      importMode === 'overwrite'
                        ? 'border-rose-600 bg-rose-50 dark:border-rose-500 dark:bg-rose-950/30 font-semibold text-rose-700 dark:text-rose-300'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-950 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <div>覆盖全部导入</div>
                    <div className="text-[11px] font-normal text-neutral-400 mt-0.5">
                      清空并完全替换当前数据
                    </div>
                  </button>
                </div>
              </div>

              {/* Confirm button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={!parsedPreview}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm disabled:opacity-40"
                >
                  确认导入数据
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
