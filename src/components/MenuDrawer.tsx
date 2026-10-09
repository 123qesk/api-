import React from 'react';
import { GroupItem, VaultSecurityConfig } from '../types';
import {
  X,
  Folder,
  Settings2,
  Database,
  ShieldCheck,
  ShieldAlert,
  Plus,
} from 'lucide-react';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  groups: GroupItem[];
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  groupCounts: Record<string, number>;
  totalCount: number;
  onOpenGroupManager: () => void;
  onOpenBackup: () => void;
  onOpenVault: () => void;
  vaultConfig: VaultSecurityConfig;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  groups,
  selectedGroupId,
  onSelectGroup,
  groupCounts,
  totalCount,
  onOpenGroupManager,
  onOpenBackup,
  onOpenVault,
  vaultConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-2xs transition-opacity animate-in fade-in"
      />

      {/* Drawer Content */}
      <div className="relative w-72 max-w-[80vw] bg-white dark:bg-[#181818] border-r border-neutral-200 dark:border-neutral-800 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-mono font-bold text-xs">
              API
            </span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              API 存储管理
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                全部分组 ({groups.length})
              </span>
              <button
                onClick={() => {
                  onOpenGroupManager();
                  onClose();
                }}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                title="管理分组"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => {
                  onSelectGroup('all');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedGroupId === 'all'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-3.5 h-3.5 opacity-70" />
                  <span>全部 API</span>
                </div>
                <span className="font-mono tabular-nums opacity-60">({totalCount})</span>
              </button>

              {groups.map((g) => {
                const isSelected = selectedGroupId === g.id;
                const count = groupCounts[g.id] || 0;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      onSelectGroup(g.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      <span className="truncate">{g.name}</span>
                    </div>
                    <span className="font-mono tabular-nums opacity-60 shrink-0">({count})</span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  onOpenGroupManager();
                  onClose();
                }}
                className="w-full mt-2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 border border-dashed border-neutral-300 dark:border-neutral-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>管理与新建分组</span>
              </button>
            </div>
          </div>

          {/* Quick Tools */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block px-2 mb-2">
              工具与安全
            </span>

            <button
              onClick={() => {
                onOpenBackup();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Database className="w-4 h-4 text-neutral-500" />
              <span>数据备份与恢复</span>
            </button>

            <button
              onClick={() => {
                onOpenVault();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {vaultConfig.isVaultInitialized && vaultConfig.isVaultLocked ? (
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              )}
              <span>
                {!vaultConfig.isVaultInitialized
                  ? '启用安全金库'
                  : vaultConfig.isVaultLocked
                  ? '金库锁定中 (点击解锁)'
                  : '金库已保护 (设置)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
