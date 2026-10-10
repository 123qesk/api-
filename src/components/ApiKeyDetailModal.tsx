import React, { useState, useEffect, useMemo } from 'react';
import { ApiKeyItem, GroupItem, KeyEntry } from '../types';
import { pullModelsFromProvider } from '../utils/fetchModels';
import { useToast } from './Toast';
import {
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Layers,
  Search,
  CheckSquare,
  Square,
  Tag,
} from 'lucide-react';

interface ApiKeyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<ApiKeyItem>) => void;
  onDelete?: (id: string) => void;
  initialItem?: ApiKeyItem | null;
  groups: GroupItem[];
  defaultGroupId?: string | null;
  onOpenGroupManager?: () => void;
}

export const ApiKeyDetailModal: React.FC<ApiKeyDetailModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialItem,
  groups,
  defaultGroupId,
  onOpenGroupManager,
}) => {
  const { success, error, info } = useToast();

  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [keys, setKeys] = useState<KeyEntry[]>([
    { id: 'k-1', key: '', note: '' },
  ]);
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  // Pull models state
  const [isPullingModels, setIsPullingModels] = useState(false);
  const [pulledModelCandidates, setPulledModelCandidates] = useState<string[]>([]);
  const [modelSearchKeyword, setModelSearchKeyword] = useState('');
  const [customModelInput, setCustomModelInput] = useState('');

  // Show/hide key visibility
  const [visibleKeyIds, setVisibleKeyIds] = useState<Record<string, boolean>>({});
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialItem) {
      setName(initialItem.name || '');
      setBaseUrl(initialItem.baseUrl || '');
      if (initialItem.keys && initialItem.keys.length > 0) {
        setKeys(initialItem.keys.map((k) => ({ ...k })));
      } else if (initialItem.apiKey) {
        setKeys([{ id: 'k-1', key: initialItem.apiKey, note: '' }]);
      } else {
        setKeys([{ id: 'k-1', key: '', note: '' }]);
      }
      setGroupId(initialItem.groupId || groups[0]?.id || '');
      setTags(initialItem.tags || []);
      setModels(initialItem.models || []);
      setDescription(initialItem.description || initialItem.notes || '');
    } else {
      setName('');
      setBaseUrl('');
      setKeys([{ id: 'k-1', key: '', note: '' }]);
      // 自动跟随建立的分组（优先使用传入的预设建立分组或当前筛选的分组）
      const effectiveGroup =
        defaultGroupId && defaultGroupId !== 'all' && groups.some((g) => g.id === defaultGroupId)
          ? defaultGroupId
          : (groups[0]?.id || '');
      setGroupId(effectiveGroup);
      setTags([]);
      setModels([]);
      setDescription('');
    }
    setPulledModelCandidates([]);
    setModelSearchKeyword('');
    setVisibleKeyIds({});
    setCopiedUrl(false);
  }, [initialItem, isOpen, groups, defaultGroupId]);

  // Filtered pulled models based on search keyword (Hook called unconditionally at top level)
  const filteredPulledModels = useMemo(() => {
    if (!modelSearchKeyword.trim()) return pulledModelCandidates;
    const kw = modelSearchKeyword.toLowerCase().trim();
    return pulledModelCandidates.filter((m) => m.toLowerCase().includes(kw));
  }, [pulledModelCandidates, modelSearchKeyword]);

  // Add another Key row
  const handleAddKeyRow = () => {
    setKeys([
      ...keys,
      { id: 'k-' + Math.random().toString(36).substring(2, 9), key: '', note: '' },
    ]);
  };

  // Remove a Key row
  const handleRemoveKeyRow = (id: string) => {
    if (keys.length <= 1) {
      setKeys([{ id: 'k-1', key: '', note: '' }]);
      return;
    }
    setKeys(keys.filter((k) => k.id !== id));
  };

  // Update a Key row field
  const handleUpdateKey = (id: string, field: 'key' | 'note', value: string) => {
    setKeys(
      keys.map((k) => (k.id === id ? { ...k, [field]: value } : k))
    );
  };

  // Toggle reveal
  const toggleKeyVisibility = (id: string) => {
    setVisibleKeyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy key
  const handleCopyKey = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      success('Key 已复制');
    } catch {
      error('复制失败');
    }
  };

  // Copy URL (Task 1: API 地址 URL 复制)
  const handleCopyUrl = async () => {
    if (!baseUrl.trim()) {
      error('API 地址为空');
      return;
    }
    try {
      await navigator.clipboard.writeText(baseUrl.trim());
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      success('API 地址已复制到剪贴板');
    } catch {
      error('复制失败');
    }
  };

  // Pull Models: User request: "去掉测试，只留下拉取模型"
  const handlePullModels = async () => {
    if (!baseUrl.trim()) {
      error('请先输入 API 地址 (URL)');
      return;
    }

    const firstValidKey = keys.find((k) => k.key.trim())?.key || '';
    setIsPullingModels(true);
    info('正在拉取模型列表...');

    try {
      const res = await pullModelsFromProvider(baseUrl, firstValidKey);
      if (res.success && res.models.length > 0) {
        setPulledModelCandidates(res.models);
        // 默认全部不选，让用户在下方列表中自行勾选需要保存的模型
        success(`成功拉取到 ${res.models.length} 个模型，请在下方列表勾选`);
      } else if (res.success && res.models.length === 0) {
        info('端点响应成功，但未返回模型列表，您可手动补充自定义模型。');
      } else {
        error(res.error || '拉取模型失败，请检查 API 地址与 Key');
      }
    } catch (err: any) {
      error('拉取异常: ' + err.message);
    } finally {
      setIsPullingModels(false);
    }
  };

  // Toggle candidate model from pulled list
  const toggleCandidateModel = (modelName: string) => {
    if (models.includes(modelName)) {
      setModels(models.filter((m) => m !== modelName));
    } else {
      setModels([...models, modelName]);
    }
  };

  // Select / Deselect all filtered
  const handleSelectAllFiltered = () => {
    const merged = Array.from(new Set([...models, ...filteredPulledModels]));
    setModels(merged);
    success(`已批量添加 ${filteredPulledModels.length} 个模型`);
  };

  const handleDeselectAllFiltered = () => {
    const filterSet = new Set(filteredPulledModels);
    setModels(models.filter((m) => !filterSet.has(m)));
  };

  // Add custom tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  // Manual model addition
  const handleAddCustomModel = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = customModelInput.trim();
    if (val && !models.includes(val)) {
      setModels([...models, val]);
      setCustomModelInput('');
    }
  };

  const handleRemoveModel = (m: string) => {
    setModels(models.filter((item) => item !== m));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('请输入 API 名称');
      return;
    }
    if (!baseUrl.trim()) {
      error('请输入 API 地址 (URL)');
      return;
    }

    const validKeys = keys.filter((k) => k.key.trim() || k.note?.trim());

    onSave({
      id: initialItem?.id,
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      keys: validKeys.length > 0 ? validKeys : keys,
      groupId,
      tags,
      models,
      description: description.trim(),
      isEncrypted: initialItem?.isEncrypted ?? false,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-6 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {initialItem ? '编辑 API' : '添加 API'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* 1. API 名称 * */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
              API 名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入 API 名称..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#262626] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500"
            />
          </div>

          {/* 2. API 地址 (URL) * + 复制功能 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                API 地址 (URL) <span className="text-rose-500">*</span>
              </label>
              {baseUrl && (
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">已复制地址</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>复制地址</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="请输入 API 地址，例如 https:/"
                className="w-full px-3.5 py-2.5 pr-10 text-sm font-mono rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#262626] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500"
              />
              {baseUrl && (
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  title="复制地址"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 3. API Key 列表 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                API Key 列表
              </label>
              <button
                type="button"
                onClick={handleAddKeyRow}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加 Key</span>
              </button>
            </div>

            <div className="space-y-2">
              {keys.map((k) => {
                const isVisible = visibleKeyIds[k.id];
                return (
                  <div key={k.id} className="flex items-center gap-2">
                    {/* Note input: [ 备注 ] */}
                    <input
                      type="text"
                      value={k.note || ''}
                      onChange={(e) => handleUpdateKey(k.id, 'note', e.target.value)}
                      placeholder="备注"
                      className="w-20 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#262626] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-center shrink-0 focus:outline-none"
                    />

                    {/* Key input: [ sk-... ] */}
                    <div className="relative flex-1">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={k.key}
                        onChange={(e) => handleUpdateKey(k.id, 'key', e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-3.5 py-2 pr-16 text-xs font-mono rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#262626] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-neutral-400">
                        <button
                          type="button"
                          onClick={() => toggleKeyVisibility(k.id)}
                          className="p-1 hover:text-neutral-700 dark:hover:text-neutral-200"
                          title={isVisible ? '隐藏' : '显示'}
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {k.key && (
                          <button
                            type="button"
                            onClick={() => handleCopyKey(k.key)}
                            className="p-1 hover:text-neutral-700 dark:hover:text-neutral-200"
                            title="复制"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delete button if more than 1 key */}
                    {keys.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyRow(k.id)}
                        className="p-2 text-neutral-400 hover:text-rose-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
                        title="删除此 Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. 模型管理模块：常用模型快捷添加 + 拉取模型列表展开 + 模型搜索 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/70 dark:bg-[#242424] p-3.5 space-y-3">
            {/* Header with 拉取模型 button */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-neutral-900 dark:text-white shrink-0" />
                <span>模型配置</span>
                {models.length > 0 && (
                  <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                    (已选 {models.length})
                  </span>
                )}
              </span>

              {/* Clean [拉取模型] button */}
              <button
                type="button"
                onClick={handlePullModels}
                disabled={isPullingModels}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isPullingModels ? 'animate-spin' : ''}`} />
                <span>{isPullingModels ? '正在拉取...' : '拉取模型'}</span>
              </button>
            </div>

            {/* 已保存的模型标签预览 */}
            {models.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                  <span>已保存的模型 ({models.length})：</span>
                  <button
                    type="button"
                    onClick={() => setModels([])}
                    className="text-rose-500 hover:underline cursor-pointer"
                  >
                    全部清空
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-xl bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-700/80">
                  {models.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200/90 dark:border-neutral-700 font-medium transition-colors"
                    >
                      <span>{m}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveModel(m)}
                        className="text-neutral-400 hover:text-rose-500 dark:text-neutral-400 dark:hover:text-rose-400 p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 拉取后的模型列表展开 + 搜索模型名称 (Task 2: 以列表的形式展开，可以搜索模型名称) */}
            {pulledModelCandidates.length > 0 && (
              <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-700/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    站点模型列表 ({pulledModelCandidates.length})
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline"
                    >
                      全选匹配项
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllFiltered}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                      取消匹配项
                    </button>
                  </div>
                </div>

                {/* 搜索模型名称输入框 */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={modelSearchKeyword}
                    onChange={(e) => setModelSearchKeyword(e.target.value)}
                    placeholder="搜索模型名称 (如 gpt, claude, deepseek)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1e1e1e] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
                  />
                  {modelSearchKeyword && (
                    <button
                      type="button"
                      onClick={() => setModelSearchKeyword('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* 垂直列表结构展开显示模型 (List View) */}
                <div className="max-h-48 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1e1e1e] divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredPulledModels.length > 0 ? (
                    filteredPulledModels.map((m) => {
                      const isSelected = models.includes(m);
                      return (
                        <div
                          key={m}
                          onClick={() => toggleCandidateModel(m)}
                          className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-900 dark:text-white'
                              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-neutral-900 dark:text-white shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-400 shrink-0" />
                            )}
                            <span className="font-mono truncate">{m}</span>
                          </div>

                          <span
                            className={`text-[11px] px-2 py-0.5 rounded shrink-0 ${
                              isSelected
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium'
                                : 'text-neutral-400'
                            }`}
                          >
                            {isSelected ? '已选' : '添加'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-xs text-neutral-400">
                      未找到包含 &quot;{modelSearchKeyword}&quot; 的模型
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 手动添加自定义模型输入框 */}
            <div className="flex items-center gap-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
              <input
                type="text"
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                onKeyDown={handleAddCustomModel}
                placeholder="手动补充自定义模型 (按回车添加)"
                className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1e1e1e] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomModel}
                className="px-3 py-1.5 text-xs rounded-xl bg-neutral-200/70 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              >
                添加
              </button>
            </div>
          </div>

          {/* 5. 描述 */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
              描述
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入描述信息（选填）..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#262626] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          {/* 6. 所属分组 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                所属分组
              </label>
              {onOpenGroupManager && (
                <button
                  type="button"
                  onClick={onOpenGroupManager}
                  className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  + 新建/管理分组
                </button>
              )}
            </div>
            <select
              value={groupId}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  if (onOpenGroupManager) onOpenGroupManager();
                } else {
                  setGroupId(e.target.value);
                }
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#262626] text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer"
            >
              <option value="">默认 (未分组)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
              <option value="__new__">+ 新建其他分组...</option>
            </select>
          </div>

          {/* 7. 自定义标签 */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-neutral-900 dark:text-white shrink-0" />
              <span>标签 (选填)</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#262626]">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700/60 font-normal transition-colors"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="输入标签按回车 (如: 公益站, 生图)..."
                className="flex-1 min-w-[140px] text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none py-0.5"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            {initialItem && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(initialItem.id)}
                className="px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              >
                删除
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:opacity-90 transition-opacity shadow-xs"
              >
                确定
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
