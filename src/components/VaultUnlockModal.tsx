import React, { useState } from 'react';
import { VaultSecurityConfig } from '../types';
import { useToast } from './Toast';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  X,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface VaultUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VaultSecurityConfig;
  onInitializeVault: (password: string, autoLockMinutes: number) => Promise<boolean>;
  onUnlockVault: (password: string) => Promise<boolean>;
  onLockVault: () => void;
  onChangePassword: (oldPass: string, newPass: string) => Promise<boolean>;
}

export const VaultUnlockModal: React.FC<VaultUnlockModalProps> = ({
  isOpen,
  onClose,
  config,
  onInitializeVault,
  onUnlockVault,
  onLockVault,
  onChangePassword,
}) => {
  const { success, error, info } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [autoLockMinutes, setAutoLockMinutes] = useState(config.autoLockMinutes || 15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'unlock' | 'change' | 'init'>(
    !config.isVaultInitialized ? 'init' : config.isVaultLocked ? 'unlock' : 'change'
  );
  const [showPassword, setShowPassword] = useState(false);

  const handleInit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      error('主密码长度至少需为 6 位字符');
      return;
    }
    if (password !== confirmPassword) {
      error('两次输入的主密码不一致');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onInitializeVault(password, autoLockMinutes);
      if (ok) {
        success('加密金库已成功初始化并启用！所有新数据将被 AES-256 加密。');
        setPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        error('初始化失败，请重试');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      error('请输入主密码');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onUnlockVault(password);
      if (ok) {
        success('金库已成功解锁，已还原密钥查看权限');
        setPassword('');
        onClose();
      } else {
        error('密码错误，无法解密金库');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      error('请输入当前主密码');
      return;
    }
    if (password.length < 6) {
      error('新主密码至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      error('新密码两次输入不匹配');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onChangePassword(oldPassword, password);
      if (ok) {
        success('主密码已修改，所有密钥已重新加密！');
        setOldPassword('');
        setPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        error('原主密码错误，无法修改');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {!config.isVaultInitialized
                ? '初始化加密金库'
                : config.isVaultLocked
                ? '解锁加密金库'
                : '金库安全设置'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status summary */}
          <div className="mb-5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
            {config.isVaultInitialized ? (
              config.isVaultLocked ? (
                <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <Unlock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              )
            ) : (
              <ShieldCheck className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            )}
            <div className="text-xs text-neutral-600 dark:text-neutral-400 leading-normal">
              {!config.isVaultInitialized ? (
                <span>
                  设置一个独立的<strong>主密码 (Master Password)</strong>。系统将采用行业标准的
                  <strong> AES-GCM 256 位与 PBKDF2 算法</strong>在浏览器端对 API 密钥进行加密。
                </span>
              ) : config.isVaultLocked ? (
                <span>
                  当前金库处于<strong>锁定状态</strong>，API 密钥均以密文保存，无法直接查看或复制。请输入主密码解锁。
                </span>
              ) : (
                <div className="flex items-center justify-between">
                  <span>
                    金库目前已<strong>解锁</strong>，可正常查看与复制密钥。
                  </span>
                  <button
                    onClick={() => {
                      onLockVault();
                      info('金库已锁定');
                      onClose();
                    }}
                    className="ml-2 text-rose-500 hover:underline font-semibold text-xs whitespace-nowrap"
                  >
                    立即锁定
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form: Init Vault */}
          {!config.isVaultInitialized && (
            <form onSubmit={handleInit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  设置主密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入至少 6 位的主密码"
                    className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  确认主密码
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次确认主密码"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>自动锁定时限</span>
                </label>
                <select
                  value={autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                >
                  <option value={5}>5 分钟无操作自动锁定</option>
                  <option value={15}>15 分钟无操作自动锁定</option>
                  <option value={60}>1 小时后自动锁定</option>
                  <option value={0}>从不自动锁定 (仅手动锁定)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? '正在计算哈希与加密...' : '启用安全金库'}
                </button>
              </div>
            </form>
          )}

          {/* Form: Unlock Vault */}
          {config.isVaultInitialized && config.isVaultLocked && (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  输入主密码解锁
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入主密码"
                    className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? '校验中...' : '解锁金库'}
                </button>
              </div>
            </form>
          )}

          {/* Form: Change Password (when already unlocked) */}
          {config.isVaultInitialized && !config.isVaultLocked && (
            <form onSubmit={handleChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  原主密码
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="输入旧主密码"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  新主密码
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位新密码"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  确认新主密码
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次确认新主密码"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? '重新加密所有数据中...' : '更新主密码并重新加密'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
