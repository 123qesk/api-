import React from 'react';
import { GroupItem } from '../types';
import { Folder, Plus, Tag, Settings2 } from 'lucide-react';

interface SidebarProps {
  groups: GroupItem[];
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  onOpenGroupManager: () => void;
  availableTags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  groupCounts: Record<string, number>;
  totalCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  groups,
  selectedGroupId,
  onSelectGroup,
  onOpenGroupManager,
  availableTags,
  selectedTag,
  onSelectTag,
  groupCounts,
  totalCount,
}) => {
  return (
    <aside className="w-full md:w-64 shrink-0 flex flex-col gap-6">
      {/* Groups Section */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            分类与分组
          </span>
          <button
            onClick={onOpenGroupManager}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="管理分组"
            aria-label="管理分组"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {/* All Items */}
          <button
            onClick={() => onSelectGroup('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
              selectedGroupId === 'all'
                ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Folder className="w-4 h-4 shrink-0 opacity-70" />
              <span className="truncate">全部 API</span>
            </div>
            <span
              className={`text-xs tabular-nums font-mono ${
                selectedGroupId === 'all'
                  ? 'text-neutral-300'
                  : 'text-neutral-400 dark:text-neutral-500'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* Group items */}
          {groups.map((group) => {
            const count = groupCounts[group.id] || 0;
            const isSelected = selectedGroupId === group.id;
            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Folder className="w-4 h-4 shrink-0 opacity-70" />
                  <span className="truncate">{group.name}</span>
                </div>
                <span
                  className={`text-xs tabular-nums font-mono ${
                    isSelected
                      ? 'text-neutral-300'
                      : 'text-neutral-400 dark:text-neutral-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={onOpenGroupManager}
            className="w-full mt-1.5 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/40 transition-colors border border-dashed border-neutral-300 dark:border-neutral-800"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>添加或编辑分组</span>
          </button>
        </nav>
      </div>

      {/* Tags Section */}
      {availableTags.length > 0 && (
        <div className="border-t border-neutral-200 dark:border-neutral-800/80 pt-5">
          <div className="flex items-center justify-between px-2 mb-2.5">
            <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>常用标签</span>
            </span>
            {selectedTag && (
              <button
                onClick={() => onSelectTag(null)}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                清除
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 px-1">
            {availableTags.map((tag) => {
              const active = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onSelectTag(active ? null : tag)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    active
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Security Info Card */}
      <div className="border-t border-neutral-200 dark:border-neutral-800/80 pt-5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed px-2">
        <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          本地隐私优先存储
        </p>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
          密钥与端点数据完全驻留于您当前浏览器，支持 AES-GCM 高强度加密与随时导出备份。
        </p>
      </div>
    </aside>
  );
};
