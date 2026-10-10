import React from 'react';
import { Menu, Plus, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  onOpenMenu: () => void;
  onAddNew: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeView?: 'api-keys' | 'image-gen';
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMenu,
  onAddNew,
  theme,
  toggleTheme,
  activeView = 'api-keys',
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#121212]/95 border-b border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-sm transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Menu Hamburger + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMenu}
            className="p-2 -ml-2 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="打开功能侧边栏"
            aria-label="打开侧边菜单"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 select-none">
              {activeView === 'image-gen' ? '生图' : 'API储存'}
            </h1>
            {activeView === 'image-gen' && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hidden sm:inline-block">
                画师串 · 提示词
              </span>
            )}
          </div>
        </div>

        {/* Right: [+] and [Moon/Sun] buttons matching screenshot */}
        <div className="flex items-center gap-2.5">
          {/* Add API / Item [+] button */}
          <button
            onClick={onAddNew}
            className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-[#1e1e1e] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center shadow-xs focus:outline-none cursor-pointer"
            title={activeView === 'image-gen' ? '添加画师串或提示词' : '添加 API'}
            aria-label={activeView === 'image-gen' ? '添加画师串或提示词' : '添加 API'}
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Theme toggle [🌙] button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-[#1e1e1e] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center shadow-xs focus:outline-none"
            title={theme === 'dark' ? '切换为日间模式' : '切换为夜间模式'}
            aria-label="切换夜间模式"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-white" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
