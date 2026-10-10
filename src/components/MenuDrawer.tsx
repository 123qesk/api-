import React from 'react';
import { VaultSecurityConfig } from '../types';
import {
  X,
  KeyRound,
  Palette,
  Database,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: 'api-keys' | 'image-gen';
  onSelectView: (view: 'api-keys' | 'image-gen') => void;
  apiKeyCount: number;
  artistStringsCount: number;
  promptsCount: number;
  onOpenBackup: () => void;
  onOpenVault: () => void;
  vaultConfig: VaultSecurityConfig;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  activeView,
  onSelectView,
  apiKeyCount,
  artistStringsCount,
  promptsCount,
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
          <h2 className="font-bold text-base text-neutral-900 dark:text-neutral-100 select-none tracking-tight">
            工具箱导航
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="关闭侧边栏"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Modules Navigation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block px-2 mb-2">
              功能模块
            </span>

            <div className="space-y-1.5">
              {/* 1. API 储存 */}
              <button
                type="button"
                onClick={() => {
                  onSelectView('api-keys');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  activeView === 'api-keys'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <KeyRound className="w-4 h-4 shrink-0 opacity-80" />
                  <span className="truncate">API储存</span>
                </div>
                <span className="font-mono tabular-nums opacity-60 text-[11px]">
                  ({apiKeyCount})
                </span>
              </button>

              {/* 2. 生图 (严格按要求：左侧栏只有“生图”两个字！！！无彩色、图标与主题一致) */}
              <button
                type="button"
                onClick={() => {
                  onSelectView('image-gen');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  activeView === 'image-gen'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Palette className="w-4 h-4 shrink-0 opacity-80" />
                  <span className="truncate">生图</span>
                </div>
                <span className="font-mono tabular-nums opacity-60 text-[11px]">
                  ({artistStringsCount + promptsCount})
                </span>
              </button>
            </div>
          </div>

          {/* Tools & Security */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block px-2 mb-2">
              工具与安全
            </span>

            <button
              type="button"
              onClick={() => {
                onOpenBackup();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4 text-neutral-500" />
              <span>数据备份与恢复</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenVault();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {vaultConfig.isVaultInitialized && vaultConfig.isVaultLocked ? (
                <ShieldAlert className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
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
