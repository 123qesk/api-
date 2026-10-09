import React, { useState, useRef, useEffect } from 'react';
import { GroupItem } from '../types';
import { Search, ChevronDown, ArrowUpDown, CheckSquare, Square, Trash2, Download, Plus, Settings2 } from 'lucide-react';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  groups: GroupItem[];
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  groupCounts: Record<string, number>;
  totalCount: number;
  sortBy: 'default' | 'name' | 'models' | 'updated';
  onSortChange: (sort: 'default' | 'name' | 'models' | 'updated') => void;
  isSelectMode: boolean;
  onToggleSelectMode: () => void;
  selectedCount: number;
  onBatchDelete?: () => void;
  onBatchExport?: () => void;
  onSelectAll?: () => void;
  onOpenGroupManager?: () => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  groups,
  selectedGroupId,
  onSelectGroup,
  groupCounts,
  totalCount,
  sortBy,
  onSortChange,
  isSelectMode,
  onToggleSelectMode,
  selectedCount,
  onBatchDelete,
  onBatchExport,
  onSelectAll,
  onOpenGroupManager,
}) => {
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
        setIsGroupDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortLabels = {
    default: '默认排序',
    updated: '最近更新',
    name: '名称排序',
    models: '模型最多',
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs transition-colors space-y-3">
      {/* 1. Search Bar matching Screenshot 1 */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索 API 名称、地址、Key、描述..."
          className="w-full pl-9.5 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-50/70 dark:bg-[#242424] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            ×
          </button>
        )}
      </div>

      {/* 2. Group Pills & Dropdown Row */}
      <div className="flex items-center gap-2">
        {/* [全部分组 (X) ▾] Main Dropdown Button - Positioned outside overflow container so dropdown is not clipped */}
        <div className="relative shrink-0" ref={groupDropdownRef}>
          <button
            type="button"
            onClick={() => setIsGroupDropdownOpen((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 leading-normal select-none shadow-2xs ${
              selectedGroupId === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs ring-1 ring-neutral-900/10 dark:ring-white/20'
                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-700'
            }`}
          >
            <span className="whitespace-nowrap">全部分组 ({totalCount})</span>
            <ChevronDown
              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                isGroupDropdownOpen ? 'rotate-180 opacity-100' : 'opacity-70'
              }`}
            />
          </button>

          {/* Dropdown Menu when clicking ▾ */}
          {isGroupDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-52 rounded-2xl bg-white dark:bg-[#222222] border border-neutral-200 dark:border-neutral-700 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-1 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                选择分组
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectGroup('all');
                  setIsGroupDropdownOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                  selectedGroupId === 'all'
                    ? 'font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <span>全部分组</span>
                <span className="font-mono text-[11px] opacity-60">({totalCount})</span>
              </button>

              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

              {groups.length > 0 ? (
                <div className="max-h-48 overflow-y-auto scrollbar-none py-0.5">
                  {groups.map((g) => {
                    const isSelected = selectedGroupId === g.id;
                    const count = groupCounts[g.id] || 0;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          onSelectGroup(g.id);
                          setIsGroupDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                        }`}
                      >
                        <span className="truncate">{g.name}</span>
                        <span className="font-mono text-[11px] opacity-60 shrink-0 ml-2">({count})</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3.5 py-2 text-xs text-neutral-400 text-center">暂无自定义分组</div>
              )}

              {onOpenGroupManager && (
                <>
                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                  <button
                    type="button"
                    onClick={() => {
                      onOpenGroupManager();
                      setIsGroupDropdownOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-left flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>管理分组</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Dynamic User Groups Horizontal Scrollable Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 py-0.5">
          {groups.map((g) => {
            const isSelected = selectedGroupId === g.id;
            const count = groupCounts[g.id] || 0;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onSelectGroup(isSelected ? 'all' : g.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 leading-normal transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <span>{g.name}</span>
                <span
                  className={`font-mono text-[11px] px-1.5 py-0.5 rounded-lg ${
                    isSelected
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                      : 'bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Add Group Quick Button */}
          {onOpenGroupManager && (
            <button
              type="button"
              onClick={onOpenGroupManager}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              title="添加或管理分组"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>分组</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Second Controls Row: [⇅ 默认排序 ▾] and [☑ 选择] matching Screenshot 1 */}
      <div className="flex items-center justify-between pt-1">
        {/* [⇅ 默认排序 ▾] */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/90 dark:border-neutral-700/80 bg-white dark:bg-[#202020] text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
            <span>{sortLabels[sortBy]}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isSortDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-36 rounded-2xl bg-white dark:bg-[#222222] border border-neutral-200 dark:border-neutral-700 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              {(['default', 'updated', 'name', 'models'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onSortChange(s);
                    setIsSortDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                    sortBy === s
                      ? 'font-semibold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-700/60'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/40'
                  }`}
                >
                  {sortLabels[s]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* [☑ 选择] Batch select button */}
        <div className="flex items-center gap-2">
          {isSelectMode && (
            <>
              {onSelectAll && (
                <button
                  onClick={onSelectAll}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  全选
                </button>
              )}
              {selectedCount > 0 && onBatchDelete && (
                <button
                  onClick={onBatchDelete}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>删除 ({selectedCount})</span>
                </button>
              )}
              {selectedCount > 0 && onBatchExport && (
                <button
                  onClick={onBatchExport}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>导出 ({selectedCount})</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={onToggleSelectMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              isSelectMode
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
                : 'border-neutral-200/90 dark:border-neutral-700/80 bg-white dark:bg-[#202020] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 opacity-70" />
            <span>{isSelectMode ? '完成' : '选择'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
