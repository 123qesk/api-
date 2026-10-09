import React, { useState } from 'react';
import { ApiKeyItem, GroupItem } from '../types';
import { maskApiKey } from '../utils/crypto';
import { useToast } from './Toast';
import { Copy, Check, CheckSquare, Square, Layers, RefreshCw, Tag } from 'lucide-react';

interface ApiKeyCardProps {
  item: ApiKeyItem;
  groups: GroupItem[];
  isVaultLocked: boolean;
  onViewEdit: (item: ApiKeyItem) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onQuickFetchModels?: (item: ApiKeyItem) => void;
  isFetchingModels?: boolean;
}

export const ApiKeyCard: React.FC<ApiKeyCardProps> = ({
  item,
  groups,
  isVaultLocked,
  onViewEdit,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  onQuickFetchModels,
  isFetchingModels = false,
}) => {
  const { success, error } = useToast();
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>({});

  const group = groups.find((g) => g.id === item.groupId);

  // Normalize keys list
  const keysList = item.keys && item.keys.length > 0
    ? item.keys
    : item.apiKey
    ? [{ id: 'k-default', key: item.apiKey, note: '' }]
    : [];

  const handleCopyKey = async (e: React.MouseEvent, keyText: string, keyId: string) => {
    e.stopPropagation();
    if (!keyText) return;
    try {
      await navigator.clipboard.writeText(keyText);
      setCopiedKeyId(keyId);
      setTimeout(() => setCopiedKeyId(null), 2000);
      success('API Key 已复制到剪贴板');
    } catch {
      error('复制失败');
    }
  };

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.baseUrl) return;
    try {
      await navigator.clipboard.writeText(item.baseUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      success('API 地址已复制');
    } catch {
      error('复制失败');
    }
  };

  const toggleRevealKey = (e: React.MouseEvent, keyId: string) => {
    e.stopPropagation();
    if (isVaultLocked && item.isEncrypted) return;
    setRevealedKeyIds((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  return (
    <div
      onClick={() => {
        if (isSelectMode && onToggleSelect) {
          onToggleSelect(item.id);
        }
      }}
      className={`bg-white dark:bg-[#1a1a1a] border rounded-2xl p-4 sm:p-5 transition-all shadow-2xs relative ${
        isSelected
          ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900 dark:ring-white'
          : 'border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
      }`}
    >
      {/* 1. Top Row: Select Checkbox (if active) + Name + Group Badge */}
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {isSelectMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleSelect) onToggleSelect(item.id);
              }}
              className="text-neutral-700 dark:text-neutral-300 hover:scale-105 transition-transform"
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-neutral-900 dark:text-white" />
              ) : (
                <Square className="w-4 h-4 text-neutral-400" />
              )}
            </button>
          )}

          <h3
            onClick={(e) => {
              e.stopPropagation();
              onViewEdit(item);
            }}
            className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate cursor-pointer hover:underline"
          >
            {item.name}
          </h3>

          {/* Group Badge */}
          {group && (
            <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs px-2.5 py-0.5 rounded-lg font-normal shrink-0">
              {group.name}
            </span>
          )}
        </div>
      </div>

      {/* 2. Second Row: API Base URL with Copy Button */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          onClick={handleCopyUrl}
          className="text-xs font-mono text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer select-all truncate block"
          title="点击复制 URL"
        >
          {item.baseUrl}
        </span>
        <button
          type="button"
          onClick={handleCopyUrl}
          className="inline-flex items-center gap-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
          title="复制 API 地址"
          aria-label="复制 API 地址"
        >
          {copiedUrl ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 text-[11px]">已复制</span>
            </>
          ) : (
            <Copy className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
          )}
        </button>
      </div>

      {/* 3. Third Row: API Keys Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {keysList.map((k) => {
          const isRevealed = revealedKeyIds[k.id];
          const isCopied = copiedKeyId === k.id;
          const displayKey = isVaultLocked && item.isEncrypted
            ? '••••••••••••••••'
            : isRevealed
            ? k.key
            : maskApiKey(k.key);

          return (
            <div
              key={k.id}
              onClick={(e) => handleCopyKey(e, k.key, k.id)}
              onDoubleClick={(e) => toggleRevealKey(e, k.id)}
              title="单击复制，双击显隐"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-200/90 dark:border-neutral-700/80 bg-neutral-50 dark:bg-neutral-800/60 font-mono text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700/80 transition-colors select-none group"
            >
              {k.note && (
                <span className="text-[11px] font-sans text-neutral-400 dark:text-neutral-500 mr-0.5">
                  {k.note}:
                </span>
              )}
              <span>{displayKey}</span>
              {isCopied ? (
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-neutral-400 opacity-60 group-hover:opacity-100 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Fourth Section: Model Selection */}
      <div className="mb-2.5">
        {item.models && item.models.length > 0 ? (
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 shrink-0 font-medium">
              <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>已存模型 ({item.models.length}):</span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {item.models.slice(0, 5).map((m) => (
                <span
                  key={m}
                  className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 font-medium"
                >
                  {m}
                </span>
              ))}
              {item.models.length > 5 && (
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono px-1">
                  +{item.models.length - 5} 更多
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
            <Layers className="w-3.5 h-3.5 opacity-50 shrink-0" />
            <span>未选择模型</span>
          </div>
        )}
      </div>

      {/* 5. Fifth Section: Description - Placed below Model Selection */}
      {item.description && (
        <div className="mb-2.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-neutral-800/40 rounded-xl px-3 py-2 border border-neutral-100 dark:border-neutral-800/70 break-words">
          <p className="line-clamp-3 whitespace-pre-wrap">{item.description}</p>
        </div>
      )}

      {/* 6. Sixth Section: Tags - Placed below Description */}
      {item.tags && item.tags.length > 0 && (
        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
          {item.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs border border-neutral-200/80 dark:border-neutral-700/60 font-normal"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* 7. Bottom Actions Row */}
      <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/60">
        <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
          {item.updatedAt ? `更新于 ${new Date(item.updatedAt).toLocaleDateString()}` : ''}
        </div>

        {/* Action Button: [ 查看/编辑 ] & [ 拉取模型 ] */}
        <div className="flex items-center gap-2 shrink-0">
          {(!item.models || item.models.length === 0) && onQuickFetchModels && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickFetchModels(item);
              }}
              disabled={isFetchingModels}
              className="px-2.5 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              title="拉取模型"
            >
              <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
              <span>拉取模型</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewEdit(item);
            }}
            className="px-3 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-[#202020] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-2xs font-medium cursor-pointer"
          >
            查看/编辑
          </button>
        </div>
      </div>
    </div>
  );
};
