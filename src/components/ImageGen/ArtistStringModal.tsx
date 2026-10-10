import React, { useState, useEffect, useRef } from 'react';
import { ArtistStringItem } from '../../types';
import {
  X,
  Upload,
  Plus,
  Copy,
  Check,
  Image as ImageIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { useToast } from '../Toast';

interface ArtistStringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<ArtistStringItem>) => void;
  onDelete?: (id: string) => void;
  initialItem?: ArtistStringItem | null;
  categories?: string[];
  defaultCategory?: string;
  onOpenGroupManager?: () => void;
}

// Compress and convert image file to Data URL to preserve localStorage quota
async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const DEFAULT_CATEGORIES: string[] = [];

export const ArtistStringModal: React.FC<ArtistStringModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialItem,
  categories = DEFAULT_CATEGORIES,
  defaultCategory,
  onOpenGroupManager,
}) => {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [positivePrompt, setPositivePrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // URL input helper
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Copy feedback
  const [copiedPos, setCopiedPos] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialItem) {
      setName(initialItem.name || '');
      setAuthor(initialItem.author || '');
      setSource(initialItem.source || '');
      setCategory(initialItem.category || '');
      setPositivePrompt(initialItem.positivePrompt || initialItem.artistString || '');
      setNegativePrompt(initialItem.negativePrompt || '');
      setImages(initialItem.images || []);
    } else {
      setName('');
      setAuthor('');
      setSource('');
      setCategory(defaultCategory || '');
      setPositivePrompt('');
      setNegativePrompt('');
      setImages([]);
    }
    setShowUrlInput(false);
    setUrlInput('');
  }, [initialItem, isOpen, defaultCategory]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImageFile(file);
        newImages.push(compressed);
      }

      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages]);
        success(`已添加 ${newImages.length} 张预览图`);
      }
    } catch (err) {
      error('图片处理失败');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrlImage = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setImages((prev) => [...prev, trimmed]);
    setUrlInput('');
    setShowUrlInput(false);
    success('已添加图片链接');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopy = async (text: string, type: 'pos' | 'neg') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'pos') {
        setCopiedPos(true);
        setTimeout(() => setCopiedPos(false), 2000);
      } else {
        setCopiedNeg(true);
        setTimeout(() => setCopiedNeg(false), 2000);
      }
      success('提示词已复制到剪贴板');
    } catch {
      error('复制失败');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('请输入画师串名称');
      return;
    }

    onSave({
      id: initialItem?.id,
      name: name.trim(),
      author: author.trim(),
      source: source.trim(),
      category: category.trim(),
      images,
      positivePrompt: positivePrompt.trim(),
      negativePrompt: negativePrompt.trim(),
      updatedAt: Date.now(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            {initialItem ? '编辑画师串' : '新建画师串'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
          {/* 1. 画师串预览（放大模块，上方显示删除叉） */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-neutral-500" />
                <span>画师串预览</span>
                {images.length > 0 && (
                  <span className="text-[11px] font-normal text-neutral-500 dark:text-neutral-400">
                    (已选 {images.length} 张)
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>上传图片</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>图片链接</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* URL input drawer */}
            {showUrlInput && (
              <div className="flex gap-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="输入图片直链 URL (如 https://...)..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  className="px-3 py-1.5 text-xs rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium cursor-pointer"
                >
                  添加
                </button>
              </div>
            )}

            {/* 放大的图片预览网格，上方显示明确的删除叉按钮 */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200/90 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 shadow-2xs group"
                  >
                    <img
                      src={img}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* 上方常驻清晰的删除叉图标 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-90 z-10"
                      title="删除图片"
                      aria-label="删除图片"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1.5 text-[10px] px-1.5 py-0.5 rounded-md bg-black/50 text-white font-mono">
                      {idx + 1}
                    </div>
                  </div>
                ))}
                {/* 随网格并列的大号「添加图片」按钮 */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-500 flex flex-col items-center justify-center gap-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 bg-white/50 dark:bg-neutral-800/40 hover:bg-white dark:hover:bg-neutral-800 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-6 h-6 text-neutral-500" />
                  <span className="text-xs font-medium">添加图片</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="py-10 px-4 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30 text-center cursor-pointer transition-colors space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-200/60 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                    点击上传预览图片（支持本地多选）
                  </span>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">
                    也可点击右上角「图片链接」直接粘贴网络图片
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. 基本信息网格: 名称, 作者, 来源, 分类 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 名称 */}
            <div>
              <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                名称 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入画师串名称..."
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
              />
            </div>

            {/* 作者 */}
            <div>
              <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                作者
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="输入作者..."
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
              />
            </div>

            {/* 来源 */}
            <div>
              <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                来源
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="输入来源..."
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600"
              />
            </div>

            {/* 所属分组: 严格与 API 分组一致 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
                  所属分组
                </label>
                {onOpenGroupManager && (
                  <button
                    type="button"
                    onClick={onOpenGroupManager}
                    className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    + 新建/管理分组
                  </button>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    if (onOpenGroupManager) onOpenGroupManager();
                  } else {
                    setCategory(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-neutral-900 dark:text-white focus:outline-hidden cursor-pointer"
              >
                <option value="">默认 (未分组)</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__new__">+ 新建其他分组...</option>
              </select>
            </div>
          </div>

          {/* 3. 正面提示词 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-800 dark:text-neutral-200">
                正面提示词
              </label>
              {positivePrompt && (
                <button
                  type="button"
                  onClick={() => handleCopy(positivePrompt, 'pos')}
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  {copiedPos ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPos ? '已复制' : '复制'}</span>
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={positivePrompt}
              onChange={(e) => setPositivePrompt(e.target.value)}
              placeholder="输入正向提示词..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-neutral-900 dark:text-white font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 leading-relaxed"
            />
          </div>

          {/* 4. 负面提示词 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-800 dark:text-neutral-200">
                负面提示词
              </label>
              {negativePrompt && (
                <button
                  type="button"
                  onClick={() => handleCopy(negativePrompt, 'neg')}
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  {copiedNeg ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNeg ? '已复制' : '复制'}</span>
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="输入负向提示词 (如 blurry, low quality, bad anatomy)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#202020] text-neutral-900 dark:text-white font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 leading-relaxed"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            {initialItem && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialItem.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 mr-auto transition-colors cursor-pointer"
              >
                删除画师串
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
            >
              保存画师串
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
