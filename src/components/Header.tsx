import React from 'react';
import { Menu, Plus, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  onOpenMenu: () => void;
  onAddNew: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMenu,
  onAddNew,
  theme,
  toggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#121212]/95 border-b border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-sm transition-colors">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Menu Hamburger + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMenu}
            className="p-2 -ml-2 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="菜单与分组管理"
            aria-label="打开侧边菜单"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 select-none">
            API 存储
          </h1>
        </div>

        {/* Right: [+] and [Moon/Sun] buttons matching screenshot */}
        <div className="flex items-center gap-2.5">
          {/* Add API [+] button */}
          <button
            onClick={onAddNew}
            className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-[#1e1e1e] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center shadow-xs focus:outline-none"
            title="添加 API"
            aria-label="添加 API"
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
