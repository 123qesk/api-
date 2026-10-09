import React, { useState } from 'react';
import { GroupItem } from '../types';
import { useToast } from './Toast';
import { Folder, Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';

interface GroupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: GroupItem[];
  onAddGroup: (name: string, description?: string) => void;
  onUpdateGroup: (id: string, name: string, description?: string) => void;
  onDeleteGroup: (id: string) => void;
  groupCounts: Record<string, number>;
}

export const GroupManagerModal: React.FC<GroupManagerModalProps> = ({
  isOpen,
  onClose,
  groups,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  groupCounts,
}) => {
  const { success, error } = useToast();

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      error('分组名称不能为空');
      return;
    }
    onAddGroup(newGroupName.trim(), newGroupDesc.trim());
    setNewGroupName('');
    setNewGroupDesc('');
    success('新分组已创建');
  };

  const handleStartEdit = (g: GroupItem) => {
    setEditingId(g.id);
    setEditName(g.name);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      error('分组名称不能为空');
      return;
    }
    onUpdateGroup(id, editName.trim());
    setEditingId(null);
    success('分组名称已更新');
  };

  const handleExecuteDelete = (id: string, name: string) => {
    onDeleteGroup(id);
    setConfirmDeleteId(null);
    success(`分组「${name}」已删除`);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
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
              分组与分类管理
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
          <form onSubmit={handleAdd} className="space-y-2 p-3 rounded-xl bg-neutral-50 dark:bg-[#252525] border border-neutral-200 dark:border-neutral-700/80">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
              创建新分组
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="分组名称 (如: 默认 / 公益站 / 生图)"
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1e1e1e] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:opacity-90 transition-opacity shrink-0 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加</span>
              </button>
            </div>
          </form>

          {/* Existing Groups List */}
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
              现有分组列表 ({groups.length})
            </span>

            {groups.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                暂无自定义分组，您可以在上方直接创建。
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80 max-h-60 overflow-y-auto">
                {groups.map((group) => {
                  const count = groupCounts[group.id] || 0;
                  const isEditing = editingId === group.id;
                  const isConfirmingDelete = confirmDeleteId === group.id;

                  return (
                    <div
                      key={group.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-sm"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1e1e1e] text-neutral-900 dark:text-neutral-100 focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveEdit(group.id)}
                            className="p-1 text-emerald-600 hover:text-emerald-700"
                            title="保存"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-neutral-400 hover:text-neutral-600"
                            title="取消"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : isConfirmingDelete ? (
                        <div className="flex-1 flex items-center justify-between gap-2 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-xs">
                          <span className="text-rose-700 dark:text-rose-300">
                            确认删除「{group.name}」? ({count} 项)
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleExecuteDelete(group.id, group.name)}
                              className="px-2 py-0.5 rounded bg-rose-600 text-white font-medium hover:bg-rose-700"
                            >
                              确定删除
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                              {group.name}
                            </div>
                            <div className="text-[11px] text-neutral-400 tabular-nums">
                              {count} 个关联 API
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleStartEdit(group)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              title="重命名"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(group.id)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="删除分组"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1a1a1a] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 hover:opacity-90 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
