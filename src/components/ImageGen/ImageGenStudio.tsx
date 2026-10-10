import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ArtistStringItem, PromptItem } from '../../types';
import {
  Palette,
  Sparkles,
  Search,
  Plus,
  Copy,
  Check,
  Edit3,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Globe,
  Maximize2,
  Settings2,
  Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '../Toast';
import { ArtistStringModal } from './ArtistStringModal';
import { PromptDetailModal } from './PromptDetailModal';
import { ImageGenGroupManagerModal } from './ImageGenGroupManagerModal';
import { loadImageGenCategories, saveImageGenCategories } from '../../utils/storage';

interface ImageGenStudioProps {
  artistStrings: ArtistStringItem[];
  prompts: PromptItem[];
  onSaveArtistString: (item: Partial<ArtistStringItem>) => void;
  onDeleteArtistString: (id: string) => void;
  onSavePrompt: (item: Partial<PromptItem>) => void;
  onDeletePrompt: (id: string) => void;
  initialSubTab?: 'artist-strings' | 'prompts';
  categories?: string[];
  onCategoriesChange?: (cats: string[]) => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  onOpenGroupManagerModal?: () => void;
}

export const ImageGenStudio: React.FC<ImageGenStudioProps> = ({
  artistStrings,
  prompts,
  onSaveArtistString,
  onDeleteArtistString,
  onSavePrompt,
  onDeletePrompt,
  initialSubTab = 'artist-strings',
  categories: externalCategories,
  onCategoriesChange: externalOnCategoriesChange,
  selectedCategory: externalSelectedCategory,
  onSelectCategory: externalOnSelectCategory,
  onOpenGroupManagerModal,
}) => {
  const { success, error } = useToast();

  // Tab: 画师串 vs 提示词
  const [activeTab, setActiveTab] = useState<'artist-strings' | 'prompts'>(
    initialSubTab === 'prompts' ? 'prompts' : 'artist-strings'
  );

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [internalSelectedCategory, setInternalSelectedCategory] = useState<string>('all');
  const selectedCategory = externalSelectedCategory !== undefined ? externalSelectedCategory : internalSelectedCategory;
  const setSelectedCategory = (cat: string) => {
    setInternalSelectedCategory(cat);
    if (externalOnSelectCategory) {
      externalOnSelectCategory(cat);
    }
  };

  const [sortBy, setSortBy] = useState<'default' | 'name' | 'updated'>('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Categories management
  const [internalCategories, setInternalCategories] = useState<string[]>([]);
  const categories = externalCategories !== undefined ? externalCategories : internalCategories;
  const setCategories = (newCats: string[]) => {
    setInternalCategories(newCats);
    if (externalOnCategoriesChange) {
      externalOnCategoriesChange(newCats);
    }
  };

  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);

  // Dropdown states
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<ArtistStringItem | null>(null);

  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: 'artist' | 'prompt';
  } | null>(null);

  // Image Lightbox state
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Copy tracking states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Card expanded prompt tracking
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

  const toggleCardExpand = (id: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Load categories on mount if not controlled externally
  useEffect(() => {
    if (externalCategories === undefined) {
      const loaded = loadImageGenCategories();
      setInternalCategories(loaded);
    }
  }, [externalCategories]);

  // Category management handlers
  const handleAddCategory = (name: string) => {
    const next = [...categories, name];
    setCategories(next);
    saveImageGenCategories(next);
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const next = categories.map((c) => (c === oldName ? newName : c));
    setCategories(next);
    saveImageGenCategories(next);

    // Update category in all artist strings using oldName
    artistStrings.forEach((item) => {
      if (item.category === oldName) {
        onSaveArtistString({ ...item, category: newName });
      }
    });

    // Update category in all prompts using oldName
    prompts.forEach((item) => {
      if (item.category === oldName) {
        onSavePrompt({ ...item, category: newName });
      }
    });

    if (selectedCategory === oldName) {
      setSelectedCategory(newName);
    }
  };

  const handleDeleteCategory = (catName: string) => {
    const next = categories.filter((c) => c !== catName);
    setCategories(next);
    saveImageGenCategories(next);

    // Reset deleted category on items
    artistStrings.forEach((item) => {
      if (item.category === catName) {
        onSaveArtistString({ ...item, category: '' });
      }
    });
    prompts.forEach((item) => {
      if (item.category === catName) {
        onSavePrompt({ ...item, category: '' });
      }
    });

    if (selectedCategory === catName) {
      setSelectedCategory('all');
    }
  };

  // Group counts for current tab
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      counts[cat] = 0;
    });

    if (activeTab === 'artist-strings') {
      artistStrings.forEach((item) => {
        if (item.category && counts[item.category] !== undefined) {
          counts[item.category]++;
        }
      });
    } else {
      prompts.forEach((item) => {
        if (item.category && counts[item.category] !== undefined) {
          counts[item.category]++;
        }
      });
    }
    return counts;
  }, [activeTab, artistStrings, prompts, categories]);

  const currentTotalCount = activeTab === 'artist-strings' ? artistStrings.length : prompts.length;

  // Filtered & Sorted Artists
  const filteredArtists = useMemo(() => {
    let result = [...artistStrings];

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.author && item.author.toLowerCase().includes(q)) ||
          (item.source && item.source.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.positivePrompt && item.positivePrompt.toLowerCase().includes(q)) ||
          (item.negativePrompt && item.negativePrompt.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        const comp = a.name.localeCompare(b.name, 'zh-CN');
        return sortOrder === 'asc' ? comp : -comp;
      }
      if (sortBy === 'updated') {
        const timeA = a.updatedAt || 0;
        const timeB = b.updatedAt || 0;
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      // default: natural id / createdAt
      return sortOrder === 'asc'
        ? (a.createdAt || 0) - (b.createdAt || 0)
        : (b.createdAt || 0) - (a.createdAt || 0);
    });

    return result;
  }, [artistStrings, selectedCategory, searchQuery, sortBy, sortOrder]);

  // Filtered & Sorted Prompts
  const filteredPrompts = useMemo(() => {
    let result = [...prompts];

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.author && item.author.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.positivePrompt && item.positivePrompt.toLowerCase().includes(q)) ||
          (item.negativePrompt && item.negativePrompt.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        const comp = a.name.localeCompare(b.name, 'zh-CN');
        return sortOrder === 'asc' ? comp : -comp;
      }
      if (sortBy === 'updated') {
        const timeA = a.updatedAt || 0;
        const timeB = b.updatedAt || 0;
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      // default
      return sortOrder === 'asc'
        ? (a.createdAt || 0) - (b.createdAt || 0)
        : (b.createdAt || 0) - (a.createdAt || 0);
    });

    return result;
  }, [prompts, selectedCategory, searchQuery, sortBy, sortOrder]);

  const handleCopyText = async (text: string, id: string, label: string) => {
    if (!text) {
      error(`${label}为空`);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      success(`${label}已复制到剪贴板！`);
    } catch {
      error('复制失败');
    }
  };

  const handleCopyBothPrompts = async (pos: string, neg: string, id: string) => {
    try {
      const combined = [
        pos ? `正面提示词:\n${pos}` : '',
        neg ? `负面提示词:\n${neg}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      if (!combined) {
        error('内容为空');
        return;
      }
      await navigator.clipboard.writeText(combined);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      success('正负面提示词已合并复制！');
    } catch {
      error('复制失败');
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'artist') {
      onDeleteArtistString(deleteTarget.id);
      success(`已删除画师串「${deleteTarget.name}」`);
    } else {
      onDeletePrompt(deleteTarget.id);
      success(`已删除提示词「${deleteTarget.name}」`);
    }
    setDeleteTarget(null);
  };

  const sortLabels = {
    default: '默认排序',
    updated: '最近更新',
    name: '名称排序',
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {/* 1. Top Sub-Navigation Tabs: 居中布局，优化间距 */}
      <div className="flex items-center justify-center border-b border-neutral-200 dark:border-neutral-800 pb-3 pt-0.5">
        <div className="inline-flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/60 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('artist-strings');
              setSelectedCategory('all');
            }}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap select-none ${
              activeTab === 'artist-strings'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-700/60'
            }`}
          >
            <span>画师串</span>
            <span className="font-mono text-xs opacity-75">({artistStrings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('prompts');
              setSelectedCategory('all');
            }}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap select-none ${
              activeTab === 'prompts'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-700/60'
            }`}
          >
            <span>提示词</span>
            <span className="font-mono text-xs opacity-75">({prompts.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar: 完全与 API 存储一致，无 overflow-hidden 截断，下拉菜单正常弹出 */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs space-y-3 transition-colors w-full">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'artist-strings'
                ? '搜索画师串名称、作者、来源、分类...'
                : '搜索提示词名称、作者、分类...'
            }
            className="w-full pl-9.5 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-50/70 dark:bg-[#242424] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Group Pills & Dropdown Row */}
        <div className="flex items-center gap-2">
          {/* Main Dropdown Button: 全部分组 (X) ▾ */}
          <div className="relative shrink-0" ref={groupDropdownRef}>
            <button
              type="button"
              onClick={() => setIsGroupDropdownOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 leading-normal select-none shadow-2xs ${
                selectedCategory === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs ring-1 ring-neutral-900/10 dark:ring-white/20'
                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-700'
              }`}
            >
              <span className="whitespace-nowrap">全部分组 ({currentTotalCount})</span>
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                  isGroupDropdownOpen ? 'rotate-180 opacity-100' : 'opacity-70'
                }`}
              />
            </button>

            {/* Dropdown Menu with Transparent Backdrop */}
            {isGroupDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsGroupDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1.5 w-52 rounded-2xl bg-white dark:bg-[#222222] border border-neutral-200 dark:border-neutral-700 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                  <div className="px-3.5 py-1 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                    选择分组
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsGroupDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <span>全部分组</span>
                    <span className="font-mono text-[11px] opacity-60">
                      ({currentTotalCount})
                    </span>
                  </button>

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                  {/* List of custom categories */}
                  {categories.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto scrollbar-none py-0.5">
                      {categories.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        const count = categoryCounts[cat] || 0;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat);
                              setIsGroupDropdownOpen(false);
                            }}
                            className={`w-full px-3.5 py-2 text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800'
                                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                            }`}
                          >
                            <span className="truncate">{cat}</span>
                            <span className="font-mono text-[11px] opacity-60 shrink-0 ml-2">
                              ({count})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-3.5 py-2 text-xs text-neutral-400 text-center">
                      暂无自定义分组
                    </div>
                  )}

                  {/* 管理分组按钮：保留在下拉菜单内 */}
                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsGroupDropdownOpen(false);
                      if (onOpenGroupManagerModal) {
                        onOpenGroupManagerModal();
                      } else {
                        setIsGroupManagerOpen(true);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-left flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>管理分组</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Group pills horizontal scroll container */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 py-0.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 leading-normal transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <span>{cat}</span>
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
          </div>
        </div>

        {/* Row 3: Sort & Order controls (完全与 API 存储一致) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-1.5 shrink-0">
            {/* [⇅ 默认排序 ▾] */}
            <div className="relative shrink-0" ref={sortDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/90 dark:border-neutral-700/80 bg-white dark:bg-[#202020] text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-black dark:text-white shrink-0 opacity-80" />
                <span>{sortLabels[sortBy]}</span>
                <ChevronDown className="w-3 h-3 text-neutral-500 dark:text-neutral-400 shrink-0" />
              </button>

              {isSortDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSortDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1.5 w-44 rounded-2xl bg-white dark:bg-[#222222] border border-neutral-200 dark:border-neutral-700 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    {(['default', 'updated', 'name'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSortBy(s);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs text-left transition-colors flex items-center justify-between cursor-pointer ${
                          sortBy === s
                            ? 'font-semibold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                        }`}
                      >
                        <span>{sortLabels[s]}</span>
                        {sortBy === s && <span className="text-[11px] text-black dark:text-white font-bold ml-2">✓</span>}
                      </button>
                    ))}

                    <div className="pt-1 mt-1 border-t border-neutral-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          setIsSortDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs text-left text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span>排序方向</span>
                        <span className="font-medium text-neutral-900 dark:text-white flex items-center gap-1">
                          {sortOrder === 'asc' ? (
                            <>
                              <ArrowUp className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                              <span>正序</span>
                            </>
                          ) : (
                            <>
                              <ArrowDown className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                              <span>倒序</span>
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Dedicated Order Toggle Button: [ ↑ 正序 ] / [ ↓ 倒序 ] */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-neutral-200/90 dark:border-neutral-700/80 bg-white dark:bg-[#202020] text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              title={sortOrder === 'asc' ? '当前正序，点击切换倒序' : '当前倒序，点击切换正序'}
            >
              {sortOrder === 'asc' ? (
                <>
                  <ArrowUp className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                  <span>正序</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                  <span>倒序</span>
                </>
              )}
            </button>
          </div>

          <span className="text-xs text-neutral-400">
            共计 {activeTab === 'artist-strings' ? filteredArtists.length : filteredPrompts.length} 项
          </span>
        </div>
      </div>

      {/* 3. Cards Section: 画师串卡片 (长矩形模块，居中于界面，主视觉在图片) */}
      {activeTab === 'artist-strings' && (
        <div className="w-full">
          {filteredArtists.length > 0 ? (
            <div className="space-y-3.5 sm:space-y-4">
              {filteredArtists.map((artist) => {
                const isExpanded = expandedCardIds.has(artist.id);
                const hasImages = artist.images && artist.images.length > 0;
                const coverImage = hasImages ? artist.images[0] : null;

                return (
                  <div
                    key={artist.id}
                    className="bg-white dark:bg-[#1a1a1a] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row gap-4 sm:gap-5 group relative"
                  >
                    {/* 主视觉图片区域 (长矩形左侧突出展示用户添加的图片) */}
                    <div
                      className="relative w-full sm:w-44 h-44 sm:h-36 rounded-xl overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800/80 cursor-pointer group/img select-none"
                      onClick={() => {
                        if (coverImage) {
                          setLightboxImageUrl(coverImage);
                        } else {
                          setEditingArtist(artist);
                          setIsArtistModalOpen(true);
                        }
                      }}
                    >
                      {hasImages ? (
                        <>
                          <img
                            src={coverImage!}
                            alt={artist.name}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                          />
                          {artist.images.length > 1 && (
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[11px] font-mono text-white">
                              {artist.images.length} 图
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Maximize2 className="w-5 h-5 drop-shadow-sm" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 gap-1.5 select-none bg-neutral-50 dark:bg-neutral-800/50">
                          <ImageIcon className="w-7 h-7 opacity-50" />
                          <span className="text-xs font-medium">暂无预览</span>
                        </div>
                      )}
                    </div>

                    {/* 卡片信息主体 */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                      <div>
                        {/* 标题栏与操作按钮 */}
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                            <h3
                              onClick={() => {
                                setEditingArtist(artist);
                                setIsArtistModalOpen(true);
                              }}
                              className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate cursor-pointer hover:underline"
                              title={artist.name}
                            >
                              {artist.name}
                            </h3>

                            {artist.category && (
                              <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs px-2.5 py-0.5 rounded-lg font-normal shrink-0">
                                {artist.category}
                              </span>
                            )}

                            {artist.author && (
                              <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate max-w-[140px]">
                                作者: {artist.author}
                              </span>
                            )}

                            {artist.source && (
                              <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate max-w-[140px]">
                                来源: {artist.source}
                              </span>
                            )}
                          </div>

                          {/* 右侧操作按钮 */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyBothPrompts(artist.positivePrompt, artist.negativePrompt, artist.id)}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="复制提示词"
                            >
                              {copiedId === artist.id ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingArtist(artist);
                                setIsArtistModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="编辑"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  id: artist.id,
                                  name: artist.name,
                                  type: 'artist',
                                })
                              }
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 提示词折叠展开详情 (默认隐藏，简洁美观) */}
                      {(artist.positivePrompt || artist.negativePrompt) && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => toggleCardExpand(artist.id)}
                            className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium inline-flex items-center gap-1.5 cursor-pointer py-1"
                          >
                            <span>{isExpanded ? '收起提示词' : '查看提示词详情'}</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="pt-2 space-y-2 animate-in fade-in text-xs border-t border-neutral-100 dark:border-neutral-800">
                              {artist.positivePrompt && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                                    <span className="font-semibold text-neutral-600 dark:text-neutral-300">正面提示词</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(artist.positivePrompt, `${artist.id}-pos`, '正面提示词')}
                                      className="hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                                    >
                                      {copiedId === `${artist.id}-pos` ? '已复制' : '复制'}
                                    </button>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#202020] font-mono text-xs text-neutral-700 dark:text-neutral-300 break-all select-all max-h-28 overflow-y-auto">
                                    {artist.positivePrompt}
                                  </div>
                                </div>
                              )}
                              {artist.negativePrompt && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                                    <span className="font-semibold text-neutral-600 dark:text-neutral-300">负面提示词</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(artist.negativePrompt, `${artist.id}-neg`, '负面提示词')}
                                      className="hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                                    >
                                      {copiedId === `${artist.id}-neg` ? '已复制' : '复制'}
                                    </button>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#202020] font-mono text-xs text-neutral-700 dark:text-neutral-300 break-all select-all max-h-24 overflow-y-auto">
                                    {artist.negativePrompt}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center bg-white dark:bg-[#1a1a1a] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 space-y-3">
              <Palette className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600" />
              <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                暂无画师串记录
              </h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                点击右上角「+」或下方按钮即可添加画师串。
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingArtist(null);
                  setIsArtistModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>新建画师串</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Cards Section: 提示词卡片 (长矩形模块，居中于界面，主视觉在图片) */}
      {activeTab === 'prompts' && (
        <div className="w-full">
          {filteredPrompts.length > 0 ? (
            <div className="space-y-3.5 sm:space-y-4">
              {filteredPrompts.map((prompt) => {
                const isExpanded = expandedCardIds.has(prompt.id);
                const hasImages = prompt.images && prompt.images.length > 0;
                const coverImage = hasImages ? prompt.images[0] : null;

                return (
                  <div
                    key={prompt.id}
                    className="bg-white dark:bg-[#1a1a1a] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row gap-4 sm:gap-5 group relative"
                  >
                    {/* 主视觉图片区域 (长矩形左侧突出展示用户添加的图片) */}
                    <div
                      className="relative w-full sm:w-44 h-44 sm:h-36 rounded-xl overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800/80 cursor-pointer group/img select-none"
                      onClick={() => {
                        if (coverImage) {
                          setLightboxImageUrl(coverImage);
                        } else {
                          setEditingPrompt(prompt);
                          setIsPromptModalOpen(true);
                        }
                      }}
                    >
                      {hasImages ? (
                        <>
                          <img
                            src={coverImage!}
                            alt={prompt.name}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                          />
                          {prompt.images.length > 1 && (
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[11px] font-mono text-white">
                              {prompt.images.length} 图
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Maximize2 className="w-5 h-5 drop-shadow-sm" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 gap-1.5 select-none bg-neutral-50 dark:bg-neutral-800/50">
                          <ImageIcon className="w-7 h-7 opacity-50" />
                          <span className="text-xs font-medium">暂无预览</span>
                        </div>
                      )}
                    </div>

                    {/* 卡片信息主体 */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                      <div>
                        {/* 标题栏与操作按钮 */}
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                            <h3
                              onClick={() => {
                                setEditingPrompt(prompt);
                                setIsPromptModalOpen(true);
                              }}
                              className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate cursor-pointer hover:underline"
                              title={prompt.name}
                            >
                              {prompt.name}
                            </h3>

                            {prompt.category && (
                              <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs px-2.5 py-0.5 rounded-lg font-normal shrink-0">
                                {prompt.category}
                              </span>
                            )}

                            {prompt.author && (
                              <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate max-w-[140px]">
                                作者: {prompt.author}
                              </span>
                            )}
                          </div>

                          {/* 右侧操作按钮 */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyBothPrompts(prompt.positivePrompt, prompt.negativePrompt, prompt.id)}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="复制提示词"
                            >
                              {copiedId === prompt.id ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPrompt(prompt);
                                setIsPromptModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="编辑"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  id: prompt.id,
                                  name: prompt.name,
                                  type: 'prompt',
                                })
                              }
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 提示词折叠展开详情 (默认隐藏，简洁美观) */}
                      {(prompt.positivePrompt || prompt.negativePrompt) && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => toggleCardExpand(prompt.id)}
                            className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium inline-flex items-center gap-1.5 cursor-pointer py-1"
                          >
                            <span>{isExpanded ? '收起提示词' : '查看提示词详情'}</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="pt-2 space-y-2 animate-in fade-in text-xs border-t border-neutral-100 dark:border-neutral-800">
                              {prompt.positivePrompt && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                                    <span className="font-semibold text-neutral-600 dark:text-neutral-300">正面提示词</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(prompt.positivePrompt, `${prompt.id}-pos`, '正面提示词')}
                                      className="hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                                    >
                                      {copiedId === `${prompt.id}-pos` ? '已复制' : '复制'}
                                    </button>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#202020] font-mono text-xs text-neutral-700 dark:text-neutral-300 break-all select-all max-h-28 overflow-y-auto">
                                    {prompt.positivePrompt}
                                  </div>
                                </div>
                              )}
                              {prompt.negativePrompt && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                                    <span className="font-semibold text-neutral-600 dark:text-neutral-300">负面提示词</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(prompt.negativePrompt, `${prompt.id}-neg`, '负面提示词')}
                                      className="hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                                    >
                                      {copiedId === `${prompt.id}-neg` ? '已复制' : '复制'}
                                    </button>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#202020] font-mono text-xs text-neutral-700 dark:text-neutral-300 break-all select-all max-h-24 overflow-y-auto">
                                    {prompt.negativePrompt}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center bg-white dark:bg-[#1a1a1a] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 space-y-3">
              <Sparkles className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600" />
              <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                暂无提示词记录
              </h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                点击右上角「+」或下方按钮即可添加提示词。
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingPrompt(null);
                  setIsPromptModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>新建提示词</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. Modals */}
      {/* Group Manager Modal */}
      <ImageGenGroupManagerModal
        isOpen={isGroupManagerOpen}
        onClose={() => setIsGroupManagerOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
        categoryCounts={categoryCounts}
      />

      {/* Artist String Modal (Requirement 6: 自动传参已选分组) */}
      <ArtistStringModal
        isOpen={isArtistModalOpen}
        onClose={() => {
          setIsArtistModalOpen(false);
          setEditingArtist(null);
        }}
        onSave={onSaveArtistString}
        initialItem={editingArtist}
        categories={categories}
        defaultCategory={selectedCategory !== 'all' ? selectedCategory : undefined}
        onOpenGroupManager={() => {
          if (onOpenGroupManagerModal) {
            onOpenGroupManagerModal();
          } else {
            setIsGroupManagerOpen(true);
          }
        }}
      />

      {/* Prompt Modal (Requirement 6: 自动传参已选分组) */}
      <PromptDetailModal
        isOpen={isPromptModalOpen}
        onClose={() => {
          setIsPromptModalOpen(false);
          setEditingPrompt(null);
        }}
        onSave={onSavePrompt}
        initialItem={editingPrompt}
        categories={categories}
        defaultCategory={selectedCategory !== 'all' ? selectedCategory : undefined}
        onOpenGroupManager={() => {
          if (onOpenGroupManagerModal) {
            onOpenGroupManagerModal();
          } else {
            setIsGroupManagerOpen(true);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  确认删除
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">
                  {deleteTarget.type === 'artist' ? '画师串' : '提示词'}「{deleteTarget.name}」
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              确定要删除此条记录吗？删除后数据将无法撤销恢复。
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Fullscreen Lightbox Modal */}
      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in cursor-zoom-out"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={lightboxImageUrl}
              alt="Preview full"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setLightboxImageUrl(null)}
              className="mt-3 px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-xs transition-colors cursor-pointer"
            >
              关闭大图 (ESC)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
