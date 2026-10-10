import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ApiKeyItem,
  GroupItem,
  VaultSecurityConfig,
  ExportData,
  ArtistStringItem,
  PromptItem,
} from './types';
import {
  loadSavedApiKeys,
  saveApiKeys,
  loadSavedGroups,
  saveGroups,
  loadVaultConfig,
  saveVaultConfig,
  loadThemeMode,
  saveThemeMode,
  loadSavedArtistStrings,
  saveArtistStrings,
  loadSavedPrompts,
  savePrompts,
  loadImageGenCategories,
  saveImageGenCategories,
} from './utils/storage';
import {
  createPasswordVerifier,
  verifyPassword,
  encryptText,
  decryptText,
} from './utils/crypto';
import { pullModelsFromProvider } from './utils/fetchModels';
import { ToastProvider, useToast } from './components/Toast';
import { Header } from './components/Header';
import { SearchFilterBar } from './components/SearchFilterBar';
import { ApiKeyCard } from './components/ApiKeyCard';
import { ApiKeyDetailModal } from './components/ApiKeyDetailModal';
import { MenuDrawer } from './components/MenuDrawer';
import { VaultUnlockModal } from './components/VaultUnlockModal';
import { BackupModal } from './components/BackupModal';
import { GroupManagerModal } from './components/GroupManagerModal';
import { ImageGenStudio } from './components/ImageGen/ImageGenStudio';
import { AddChoiceModal } from './components/ImageGen/AddChoiceModal';
import { ArtistStringModal } from './components/ImageGen/ArtistStringModal';
import { PromptDetailModal } from './components/ImageGen/PromptDetailModal';
import { ImageGenGroupManagerModal } from './components/ImageGen/ImageGenGroupManagerModal';
import { Plus, FileText, Download, Trash2, Palette, Sparkles, KeyRound } from 'lucide-react';

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}

function MainApp() {
  const { success, error, info } = useToast();

  // Theme state: defaults cleanly, ensures dark mode works seamlessly
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Core Data
  const [currentView, setCurrentView] = useState<'api-keys' | 'image-gen'>('api-keys');
  const [imageGenSubTab, setImageGenSubTab] = useState<'artist-strings' | 'prompts'>('artist-strings');
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [artistStrings, setArtistStrings] = useState<ArtistStringItem[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [vaultConfig, setVaultConfig] = useState<VaultSecurityConfig>({
    isVaultInitialized: false,
    isVaultLocked: false,
    autoLockMinutes: 15,
  });

  // Master password in memory
  const [sessionPassword, setSessionPassword] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'models' | 'updated'>('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  // Batch selection mode
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiKeyItem | null>(null);
  const [addModalDefaultGroupId, setAddModalDefaultGroupId] = useState<string | null>(null);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isGroupManagerOpen, setIsGroupManagerOpen] = useState(false);

  // Direct modal trigger for Image Gen from Header/Sidebar
  const [isAddChoiceModalOpen, setIsAddChoiceModalOpen] = useState(false);
  const [isDirectArtistModalOpen, setIsDirectArtistModalOpen] = useState(false);
  const [isDirectPromptModalOpen, setIsDirectPromptModalOpen] = useState(false);
  const [imageGenCategories, setImageGenCategories] = useState<string[]>([]);
  const [selectedImageGenCategory, setSelectedImageGenCategory] = useState<string>('all');
  const [isImageGenGroupManagerOpen, setIsImageGenGroupManagerOpen] = useState(false);

  const handleAddImageGenCategory = (name: string) => {
    const next = [...imageGenCategories, name];
    setImageGenCategories(next);
    saveImageGenCategories(next);
  };

  const handleRenameImageGenCategory = (oldName: string, newName: string) => {
    const next = imageGenCategories.map((c) => (c === oldName ? newName : c));
    setImageGenCategories(next);
    saveImageGenCategories(next);

    setArtistStrings((prev) =>
      prev.map((item) => (item.category === oldName ? { ...item, category: newName } : item))
    );
    setPrompts((prev) =>
      prev.map((item) => (item.category === oldName ? { ...item, category: newName } : item))
    );

    if (selectedImageGenCategory === oldName) {
      setSelectedImageGenCategory(newName);
    }
  };

  const handleDeleteImageGenCategory = (catName: string) => {
    const next = imageGenCategories.filter((c) => c !== catName);
    setImageGenCategories(next);
    saveImageGenCategories(next);

    setArtistStrings((prev) =>
      prev.map((item) => (item.category === catName ? { ...item, category: '' } : item))
    );
    setPrompts((prev) =>
      prev.map((item) => (item.category === catName ? { ...item, category: '' } : item))
    );

    if (selectedImageGenCategory === catName) {
      setSelectedImageGenCategory('all');
    }
  };

  // Helper to open Add API modal with group auto-following
  const handleOpenAddModal = (presetGroupId?: string | null) => {
    setEditingItem(null);
    const target = presetGroupId !== undefined ? presetGroupId : selectedGroupId;
    setAddModalDefaultGroupId(target && target !== 'all' ? target : (groups[0]?.id || null));
    setIsDetailModalOpen(true);
  };

  // Card model pulling state
  const [pullingCardId, setPullingCardId] = useState<string | null>(null);

  // Initial Data & Theme Loading
  useEffect(() => {
    const savedTheme = loadThemeMode();
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const loadedKeys = loadSavedApiKeys();
    const loadedGroups = loadSavedGroups();
    const loadedVault = loadVaultConfig();
    const loadedArtists = loadSavedArtistStrings();
    const loadedPrompts = loadSavedPrompts();
    const loadedImageGenCats = loadImageGenCategories();

    setApiKeys(loadedKeys);
    setGroups(loadedGroups);
    setVaultConfig(loadedVault);
    setArtistStrings(loadedArtists);
    setPrompts(loadedPrompts);
    setImageGenCategories(loadedImageGenCats);
  }, []);

  const applyTheme = (targetTheme: 'light' | 'dark') => {
    if (targetTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    saveThemeMode(next);
    applyTheme(next);
  };

  // Auto-lock timer
  useEffect(() => {
    if (!vaultConfig.isVaultInitialized || vaultConfig.isVaultLocked || !vaultConfig.autoLockMinutes) {
      return;
    }
    const timer = setTimeout(() => {
      handleLockVault();
      info('金库超时已自动锁定');
    }, vaultConfig.autoLockMinutes * 60 * 1000);
    return () => clearTimeout(timer);
  }, [vaultConfig, sessionPassword]);

  const handleLockVault = useCallback(() => {
    setSessionPassword(null);
    const updated = { ...vaultConfig, isVaultLocked: true };
    setVaultConfig(updated);
    saveVaultConfig(updated);
  }, [vaultConfig]);

  const handleInitVault = async (password: string, autoLockMinutes: number): Promise<boolean> => {
    try {
      const { verifier, salt } = await createPasswordVerifier(password);
      const newConfig: VaultSecurityConfig = {
        isVaultInitialized: true,
        isVaultLocked: false,
        salt,
        verifierHash: verifier,
        autoLockMinutes,
        lastUnlockedAt: Date.now(),
      };
      setSessionPassword(password);
      setVaultConfig(newConfig);
      saveVaultConfig(newConfig);
      return true;
    } catch {
      return false;
    }
  };

  const handleUnlockVault = async (password: string): Promise<boolean> => {
    if (!vaultConfig.verifierHash || !vaultConfig.salt) return false;
    const isValid = await verifyPassword(password, vaultConfig.verifierHash, vaultConfig.salt);
    if (!isValid) return false;

    setSessionPassword(password);
    const updated = { ...vaultConfig, isVaultLocked: false, lastUnlockedAt: Date.now() };
    setVaultConfig(updated);
    saveVaultConfig(updated);
    return true;
  };

  const handleChangePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    if (!vaultConfig.verifierHash || !vaultConfig.salt) return false;
    const isValid = await verifyPassword(oldPass, vaultConfig.verifierHash, vaultConfig.salt);
    if (!isValid) return false;

    const { verifier, salt } = await createPasswordVerifier(newPass);
    const newConfig = {
      ...vaultConfig,
      salt,
      verifierHash: verifier,
      isVaultLocked: false,
    };
    setSessionPassword(newPass);
    setVaultConfig(newConfig);
    saveVaultConfig(newConfig);
    return true;
  };

  // Save or edit API item
  const handleSaveApiKey = (data: Partial<ApiKeyItem>) => {
    const defaultKey = data.keys?.[0]?.key || data.apiKey || '';
    if (data.id) {
      // Update
      const updated = apiKeys.map((item) =>
        item.id === data.id
          ? {
              ...item,
              name: data.name || item.name,
              baseUrl: data.baseUrl || item.baseUrl,
              keys: data.keys || item.keys || [{ id: 'k-1', key: defaultKey, note: '' }],
              apiKey: defaultKey,
              groupId: data.groupId || item.groupId,
              tags: data.tags || item.tags,
              models: data.models || item.models,
              description: data.description !== undefined ? data.description : item.description,
              updatedAt: Date.now(),
            }
          : item
      );
      setApiKeys(updated);
      saveApiKeys(updated);
      success('API 配置已更新');
    } else {
      // Create new
      const newItem: ApiKeyItem = {
        id: 'key-' + Math.random().toString(36).substring(2, 10),
        name: data.name || '未命名 API',
        baseUrl: data.baseUrl || '',
        keys: data.keys || [{ id: 'k-1', key: defaultKey, note: '' }],
        apiKey: defaultKey,
        groupId: data.groupId || groups[0]?.id || 'default',
        tags: data.tags || [],
        models: data.models || [],
        description: data.description || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      // 默认首先添加的在上面，其次添加的在首次添加的模块的后面
      const nextList = [...apiKeys, newItem];
      setApiKeys(nextList);
      saveApiKeys(nextList);
      success('已添加新 API 记录');
    }

    setIsDetailModalOpen(false);
    setEditingItem(null);
  };

  // Delete API item
  const handleDeleteApiKey = (id: string) => {
    const nextList = apiKeys.filter((k) => k.id !== id);
    setApiKeys(nextList);
    saveApiKeys(nextList);
    if (editingItem?.id === id) {
      setIsDetailModalOpen(false);
      setEditingItem(null);
    }
    success('已删除该记录');
  };

  // Artist Strings Management
  const handleSaveArtistString = (data: Partial<ArtistStringItem>) => {
    if (data.id) {
      const next = artistStrings.map((a) =>
        a.id === data.id
          ? {
              ...a,
              name: data.name !== undefined ? data.name : a.name,
              author: data.author !== undefined ? data.author : a.author,
              source: data.source !== undefined ? data.source : a.source,
              category: data.category !== undefined ? data.category : a.category,
              images: data.images !== undefined ? data.images : a.images,
              positivePrompt: data.positivePrompt !== undefined ? data.positivePrompt : a.positivePrompt,
              negativePrompt: data.negativePrompt !== undefined ? data.negativePrompt : a.negativePrompt,
              updatedAt: Date.now(),
            }
          : a
      );
      setArtistStrings(next);
      saveArtistStrings(next);
      success('画师串已更新');
    } else {
      const newItem: ArtistStringItem = {
        id: 'art-' + Math.random().toString(36).substring(2, 9),
        name: data.name || '未命名画师串',
        author: data.author || '',
        source: data.source || '',
        category: data.category || '默认',
        images: data.images || [],
        positivePrompt: data.positivePrompt || '',
        negativePrompt: data.negativePrompt || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const next = [newItem, ...artistStrings];
      setArtistStrings(next);
      saveArtistStrings(next);
      success('已添加新画师串');
    }
  };

  const handleDeleteArtistString = (id: string) => {
    const next = artistStrings.filter((a) => a.id !== id);
    setArtistStrings(next);
    saveArtistStrings(next);
    success('已删除画师串');
  };

  // Prompts Management
  const handleSavePrompt = (data: Partial<PromptItem>) => {
    if (data.id) {
      const next = prompts.map((p) =>
        p.id === data.id
          ? {
              ...p,
              name: data.name !== undefined ? data.name : p.name,
              author: data.author !== undefined ? data.author : p.author,
              category: data.category !== undefined ? data.category : p.category,
              images: data.images !== undefined ? data.images : p.images,
              positivePrompt: data.positivePrompt !== undefined ? data.positivePrompt : p.positivePrompt,
              negativePrompt: data.negativePrompt !== undefined ? data.negativePrompt : p.negativePrompt,
              updatedAt: Date.now(),
            }
          : p
      );
      setPrompts(next);
      savePrompts(next);
      success('提示词已更新');
    } else {
      const newItem: PromptItem = {
        id: 'pmt-' + Math.random().toString(36).substring(2, 9),
        name: data.name || '未命名提示词',
        author: data.author || '',
        category: data.category || '默认',
        images: data.images || [],
        positivePrompt: data.positivePrompt || '',
        negativePrompt: data.negativePrompt || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const next = [newItem, ...prompts];
      setPrompts(next);
      savePrompts(next);
      success('已添加新提示词');
    }
  };

  const handleDeletePrompt = (id: string) => {
    const next = prompts.filter((p) => p.id !== id);
    setPrompts(next);
    savePrompts(next);
    success('已删除提示词');
  };

  // Pull models: Open detail modal so user can view list and choose models
  const handleQuickFetchModels = (item: ApiKeyItem) => {
    setEditingItem(item);
    setIsDetailModalOpen(true);
  };

  // Batch actions
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    const next = apiKeys.filter((k) => !selectedIds.has(k.id));
    setApiKeys(next);
    saveApiKeys(next);
    success(`已批量删除 ${selectedIds.size} 项记录`);
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const handleBatchExport = () => {
    if (selectedIds.size === 0) return;
    const exportItems = apiKeys.filter((k) => selectedIds.has(k.id));
    const jsonStr = JSON.stringify(exportItems, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyvault-selected-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success(`已导出 ${selectedIds.size} 项选中记录`);
  };

  // Groups Management
  const handleAddGroup = (name: string, description?: string) => {
    const newGroup: GroupItem = {
      id: 'grp-' + Math.random().toString(36).substring(2, 9),
      name,
      description,
    };
    const next = [...groups, newGroup];
    setGroups(next);
    saveGroups(next);
    // 自动跟随新建立的分组
    setSelectedGroupId(newGroup.id);
    setAddModalDefaultGroupId(newGroup.id);
  };

  const handleUpdateGroup = (id: string, name: string, description?: string) => {
    const next = groups.map((g) => (g.id === id ? { ...g, name, description } : g));
    setGroups(next);
    saveGroups(next);
  };

  const handleDeleteGroup = (id: string) => {
    const fallbackId = groups.find((g) => g.id !== id)?.id || '';
    const nextGroups = groups.filter((g) => g.id !== id);
    const nextKeys = apiKeys.map((k) => (k.groupId === id ? { ...k, groupId: fallbackId } : k));
    setGroups(nextGroups);
    saveGroups(nextGroups);
    setApiKeys(nextKeys);
    saveApiKeys(nextKeys);
    if (selectedGroupId === id) setSelectedGroupId('all');
  };

  // Group counts calculation
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    apiKeys.forEach((k) => {
      counts[k.groupId] = (counts[k.groupId] || 0) + 1;
    });
    return counts;
  }, [apiKeys]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return apiKeys
      .filter((item) => {
        // Group filter
        if (selectedGroupId !== 'all' && item.groupId !== selectedGroupId) {
          return false;
        }

        // Search query: supports name, url, description, keys, tags, models, and group
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const cleanQ = q.replace(/^#/, '');
          const matchName = item.name.toLowerCase().includes(q);
          const matchUrl = item.baseUrl.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q) || false;
          const matchKeys = item.keys?.some((k) => k.key.toLowerCase().includes(q) || k.note?.toLowerCase().includes(q)) || false;
          const matchTags = item.tags?.some((t) => {
            const lt = t.toLowerCase();
            return lt.includes(q) || (cleanQ ? lt.includes(cleanQ) : false);
          }) || false;
          const matchModels = item.models?.some((m) => m.toLowerCase().includes(q)) || false;
          const groupName = groups.find((g) => g.id === item.groupId)?.name?.toLowerCase() || '';
          const matchGroup = groupName.includes(q);
          return matchName || matchUrl || matchDesc || matchKeys || matchTags || matchModels || matchGroup;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'updated') {
          const timeA = a.updatedAt || a.createdAt || 0;
          const timeB = b.updatedAt || b.createdAt || 0;
          return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        }
        if (sortBy === 'name') {
          const comp = a.name.localeCompare(b.name, 'zh-CN');
          return sortOrder === 'asc' ? comp : -comp;
        }
        if (sortBy === 'models') {
          const countA = a.models?.length || 0;
          const countB = b.models?.length || 0;
          return sortOrder === 'desc' ? countB - countA : countA - countB;
        }
        // Default sort:
        // 正序 (asc): 首次添加的在上面，其次添加的在首次添加的后面
        // 倒序 (desc): 最新添加的在上面
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        if (timeA !== timeB) {
          return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        }
        const idxA = apiKeys.indexOf(a);
        const idxB = apiKeys.indexOf(b);
        return sortOrder === 'asc' ? idxA - idxB : idxB - idxA;
      });
  }, [apiKeys, selectedGroupId, searchQuery, sortBy, sortOrder, groups]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      {/* Top Header matching Screenshot 1 */}
      <Header
        onOpenMenu={() => setIsMenuOpen(true)}
        onAddNew={() => {
          if (currentView === 'image-gen') {
            setIsAddChoiceModalOpen(true);
          } else {
            handleOpenAddModal(selectedGroupId);
          }
        }}
        theme={theme}
        toggleTheme={toggleTheme}
        activeView={currentView}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:py-6 flex flex-col gap-4">
        {currentView === 'image-gen' ? (
          <ImageGenStudio
            artistStrings={artistStrings}
            prompts={prompts}
            onSaveArtistString={handleSaveArtistString}
            onDeleteArtistString={handleDeleteArtistString}
            onSavePrompt={handleSavePrompt}
            onDeletePrompt={handleDeletePrompt}
            initialSubTab={imageGenSubTab}
            categories={imageGenCategories}
            onCategoriesChange={(cats) => {
              setImageGenCategories(cats);
              saveImageGenCategories(cats);
            }}
            selectedCategory={selectedImageGenCategory}
            onSelectCategory={setSelectedImageGenCategory}
            onOpenGroupManagerModal={() => setIsImageGenGroupManagerOpen(true)}
          />
        ) : (
          <>
            {/* Top Search & Filter Card */}
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              groups={groups}
              selectedGroupId={selectedGroupId}
              onSelectGroup={setSelectedGroupId}
              groupCounts={groupCounts}
              totalCount={apiKeys.length}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              onToggleSortOrder={toggleSortOrder}
              isSelectMode={isSelectMode}
              onToggleSelectMode={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedIds(new Set());
              }}
              selectedCount={selectedIds.size}
              onBatchDelete={handleBatchDelete}
              onBatchExport={handleBatchExport}
              onSelectAll={handleSelectAll}
              onOpenGroupManager={() => setIsGroupManagerOpen(true)}
            />

            {/* Cards List matching Screenshot 1 */}
            {filteredItems.length > 0 ? (
              <div className="space-y-3.5">
                {filteredItems.map((item) => (
                  <ApiKeyCard
                    key={item.id}
                    item={item}
                    groups={groups}
                    isVaultLocked={vaultConfig.isVaultLocked}
                    onViewEdit={(target) => {
                      setEditingItem(target);
                      setIsDetailModalOpen(true);
                    }}
                    isSelectMode={isSelectMode}
                    isSelected={selectedIds.has(item.id)}
                    onToggleSelect={toggleSelect}
                    onQuickFetchModels={handleQuickFetchModels}
                    isFetchingModels={pullingCardId === item.id}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  暂无匹配的 API 记录
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mb-4">
                  您可以调整搜索词或分组筛选，或点击下方按钮添加新 API。
                </p>
                <button
                  onClick={() => handleOpenAddModal(selectedGroupId)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {selectedGroupId && selectedGroupId !== 'all' && groups.find((g) => g.id === selectedGroupId)
                      ? `在「${groups.find((g) => g.id === selectedGroupId)?.name}」添加 API`
                      : '添加 API'}
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Slide-out Menu Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
        }}
        apiKeyCount={apiKeys.length}
        artistStringsCount={artistStrings.length}
        promptsCount={prompts.length}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenVault={() => setIsVaultModalOpen(true)}
        vaultConfig={vaultConfig}
      />

      {/* Add / Edit Detail Modal matching Screenshot 2 */}
      <ApiKeyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveApiKey}
        onDelete={handleDeleteApiKey}
        initialItem={editingItem}
        groups={groups}
        defaultGroupId={
          addModalDefaultGroupId ||
          (selectedGroupId && selectedGroupId !== 'all' ? selectedGroupId : groups[0]?.id)
        }
        onOpenGroupManager={() => setIsGroupManagerOpen(true)}
      />

      {/* Group Manager Modal */}
      <GroupManagerModal
        isOpen={isGroupManagerOpen}
        onClose={() => setIsGroupManagerOpen(false)}
        groups={groups}
        onAddGroup={handleAddGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        groupCounts={groupCounts}
        onAddApiToGroup={(targetGroupId) => {
          setIsGroupManagerOpen(false);
          handleOpenAddModal(targetGroupId);
        }}
      />

      {/* Top/Drawer Triggered Add Choice Modal for Image Gen */}
      <AddChoiceModal
        isOpen={isAddChoiceModalOpen}
        onClose={() => setIsAddChoiceModalOpen(false)}
        onChooseArtist={() => setIsDirectArtistModalOpen(true)}
        onChoosePrompt={() => setIsDirectPromptModalOpen(true)}
      />

      {/* Direct Artist String Modal */}
      <ArtistStringModal
        isOpen={isDirectArtistModalOpen}
        onClose={() => setIsDirectArtistModalOpen(false)}
        onSave={handleSaveArtistString}
        onDelete={handleDeleteArtistString}
        initialItem={null}
        categories={imageGenCategories}
        defaultCategory={selectedImageGenCategory !== 'all' ? selectedImageGenCategory : undefined}
        onOpenGroupManager={() => setIsImageGenGroupManagerOpen(true)}
      />

      {/* Direct Prompt Modal */}
      <PromptDetailModal
        isOpen={isDirectPromptModalOpen}
        onClose={() => setIsDirectPromptModalOpen(false)}
        onSave={handleSavePrompt}
        onDelete={handleDeletePrompt}
        initialItem={null}
        categories={imageGenCategories}
        defaultCategory={selectedImageGenCategory !== 'all' ? selectedImageGenCategory : undefined}
        onOpenGroupManager={() => setIsImageGenGroupManagerOpen(true)}
      />

      {/* Image Gen Group Manager Modal from Header/Direct flow */}
      <ImageGenGroupManagerModal
        isOpen={isImageGenGroupManagerOpen}
        onClose={() => setIsImageGenGroupManagerOpen(false)}
        categories={imageGenCategories}
        onAddCategory={handleAddImageGenCategory}
        onRenameCategory={handleRenameImageGenCategory}
        onDeleteCategory={handleDeleteImageGenCategory}
        categoryCounts={{}}
      />

      {/* Security Vault Modal */}
      <VaultUnlockModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        config={vaultConfig}
        onInitializeVault={handleInitVault}
        onUnlockVault={handleUnlockVault}
        onLockVault={handleLockVault}
        onChangePassword={handleChangePassword}
      />

      {/* Data Backup Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        apiKeys={apiKeys}
        groups={groups}
        artistStrings={artistStrings}
        prompts={prompts}
        isVaultInitialized={vaultConfig.isVaultInitialized}
        isVaultLocked={vaultConfig.isVaultLocked}
        onImportSuccess={(data, mode) => {
          if (mode === 'overwrite') {
            setApiKeys(data.apiKeys || []);
            saveApiKeys(data.apiKeys || []);
            if (data.groups && data.groups.length > 0) {
              setGroups(data.groups);
              saveGroups(data.groups);
            }
            if (data.artistStrings) {
              setArtistStrings(data.artistStrings);
              saveArtistStrings(data.artistStrings);
            }
            if (data.prompts) {
              setPrompts(data.prompts);
              savePrompts(data.prompts);
            }
          } else {
            const map = new Map(apiKeys.map((k) => [k.id, k]));
            (data.apiKeys || []).forEach((k) => map.set(k.id, k));
            const merged = Array.from(map.values());
            setApiKeys(merged);
            saveApiKeys(merged);

            const gMap = new Map(groups.map((g) => [g.id, g]));
            (data.groups || []).forEach((g) => {
              if (!gMap.has(g.id)) gMap.set(g.id, g);
            });
            const mergedG = Array.from(gMap.values());
            setGroups(mergedG);
            saveGroups(mergedG);

            if (data.artistStrings && data.artistStrings.length > 0) {
              const aMap = new Map(artistStrings.map((a) => [a.id, a]));
              data.artistStrings.forEach((a) => aMap.set(a.id, a));
              const mergedA = Array.from(aMap.values());
              setArtistStrings(mergedA);
              saveArtistStrings(mergedA);
            }

            if (data.prompts && data.prompts.length > 0) {
              const pMap = new Map(prompts.map((p) => [p.id, p]));
              data.prompts.forEach((p) => pMap.set(p.id, p));
              const mergedP = Array.from(pMap.values());
              setPrompts(mergedP);
              savePrompts(mergedP);
            }
          }
          success('数据已成功恢复！');
        }}
      />
    </div>
  );
}
