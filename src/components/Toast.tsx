import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (title: string, description?: string, type?: ToastType) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, description?: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const success = useCallback((title: string, description?: string) => {
    showToast(title, description, 'success');
  }, [showToast]);

  const error = useCallback((title: string, description?: string) => {
    showToast(title, description, 'error');
  }, [showToast]);

  const info = useCallback((title: string, description?: string) => {
    showToast(title, description, 'info');
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {/* Toast notifications anchored at the bottom center of the screen, never at the top */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 max-w-[92vw] sm:max-w-md w-auto pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full border shadow-2xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${
              toast.type === 'success'
                ? 'bg-neutral-900/95 dark:bg-[#1a1a1a]/95 border-emerald-500/40 text-white'
                : toast.type === 'error'
                ? 'bg-neutral-900/95 dark:bg-[#1a1a1a]/95 border-rose-500/40 text-white'
                : 'bg-neutral-900/95 dark:bg-[#1a1a1a]/95 border-neutral-700/60 text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-neutral-300 shrink-0" />}
            
            <div className="flex items-center gap-2 text-center">
              <span className="text-xs sm:text-sm font-medium tracking-tight whitespace-nowrap">{toast.title}</span>
              {toast.description && (
                <span className="text-xs text-neutral-400">· {toast.description}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
