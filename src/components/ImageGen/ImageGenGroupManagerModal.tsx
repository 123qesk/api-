import React, { useState } from 'react';
import { useToast } from '../Toast';
import { Folder, Plus, Trash2, Edit2, Check, X, ArrowUp, ArrowDown } from 'lucide-react';

interface ImageGenGroupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddCategory: (name: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (name: string) => void;
  onReorderCategories?: (categories: string[]) => void;
  categoryCounts: Record<string, number>;
}

export const ImageGenGroupManagerModal: React.FC<ImageGenGroupManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onReorderCategories,
  categoryCounts,
}) => {
  const { success, error } = useToast();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editInputName, setEditInputName] = useState('');
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);

  const handleMoveUp = (index: number) => {
    if (index <= 0 || !onReorderCategories) return;
    const next = [...categories];
    const [moved] = next.splice(index, 1);
    next.splice(index - 1, 0, moved);
    onReorderCategories(next);
  };

  const handleMoveDown = (index: number) => {
    if (index >= categories.length - 1 || !onReorderCategories) return;
    const next = [...categories];
    const [moved] = next.splice(index, 1);
    next.splice(index + 1, 0, moved);
    onReorderCategories(next);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      error('分组名称不能为空');
      return;
    }
    if (categories.includes(trimmed)) {
      error('该分组名称已存在');
      return;
    }
    onAddCategory(trimmed);
    setNewCategoryName('');
    success(`新分组「${trimmed}」已创建`);
  };

  const handleStartEdit = (cat: string) => {
    setEditingName(cat);
    setEditInputName(cat);
    setConfirmDeleteName(null);
  };

  const handleSaveEdit = (oldName: string) => {
    const trimmed = editInputName.trim();
    if (!trimmed) {
      error('分组名称不能为空');
      return;
    }
    if (trimmed === oldName) {
      setEditingName(null);
      return;
    }
    if (categories.includes(trimmed)) {
      error('已存在同名分组');
      return;
    }
    onRenameCategory(oldName, trimmed);
    setEditingName(null);
    success(`分组已重命名为「${trimmed}」`);
  };

  const handleExecuteDelete = (name: string) => {
    onDeleteCategory(name);
    setConfirmDeleteName(null);
    success(`分组「${name}」已删除`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-2xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              管理生图分组
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Add Group Form */}
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="输入新分组名称..."
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#252525] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 flex items-center gap-1.5 transition-opacity cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加</span>
              </button>
            </div>
          </form>

          {/* Group List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-1">
              <span>已建分组 ({categories.length})</span>
              <span className="text-[11px] font-normal text-neutral-400">可调整顺序</span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {categories.length > 0 ? (
                categories.map((cat, index) => {
                  const isEditing = editingName === cat;
                  const count = categoryCounts[cat] || 0;
                  const isDeleting = confirmDeleteName === cat;

                  return (
                    <div
                      key={cat}
                      className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#252525]/50 flex items-center justify-between gap-2"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="text"
                            value={editInputName}
                            onChange={(e) => setEditInputName(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white focus:outline-hidden"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
                            title="保存"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingName(null)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                            title="取消"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : isDeleting ? (
                        <div className="flex items-center justify-between flex-1 gap-2">
                          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium truncate">
                            确认删除「{cat}」？
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleExecuteDelete(cat)}
                              className="px-2 py-0.5 text-xs rounded bg-rose-600 text-white font-medium hover:bg-rose-700 cursor-pointer"
                            >
                              确认
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteName(null)}
                              className="px-2 py-0.5 text-xs rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 cursor-pointer"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Reorder Buttons */}
                          {onReorderCategories && (
                            <div className="flex items-center gap-0.5 shrink-0 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg p-0.5 border border-neutral-200/60 dark:border-neutral-700/60">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveUp(index)}
                                className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-25 disabled:hover:text-neutral-400 hover:bg-white dark:hover:bg-neutral-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                title="上移分组"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === categories.length - 1}
                                onClick={() => handleMoveDown(index)}
                                className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-25 disabled:hover:text-neutral-400 hover:bg-white dark:hover:bg-neutral-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                title="下移分组"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Folder className="w-4 h-4 text-neutral-400 shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                              {cat}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono text-neutral-400">
                              {count}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(cat)}
                              className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                              title="编辑分组名称"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteName(cat)}
                              className="p-1 rounded text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="删除分组"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-neutral-400">
                  暂无自定义分组，您可在上方输入框添加新分组
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 dark:bg-[#191919] border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
