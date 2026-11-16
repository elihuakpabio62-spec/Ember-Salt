import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastMessage, ToastVariant } from '@/src/types';

interface ToastContextValue {
  showToast: (variant: ToastVariant, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, variant, title, description }]);
      window.setTimeout(() => {
        dismiss(id);
      }, 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0 pointer-events-none"
      >
        {toasts.map((toast) => {
          const borderStyle =
            toast.variant === 'error'
              ? 'border-[#B91C1C]/30 bg-white text-[#1A1917]'
              : toast.variant === 'success'
                ? 'border-[#1F4E3D]/30 bg-white text-[#1A1917]'
                : 'border-[#E6E1D8] bg-white text-[#1A1917]';

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all ${borderStyle}`}
            >
              {toast.variant === 'success' && (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1F4E3D]" />
              )}
              {toast.variant === 'error' && (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#B91C1C]" />
              )}
              {toast.variant === 'info' && (
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#645F58]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1A1917]">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-[#645F58]">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-[#645F58] hover:bg-[#F2EFE9] hover:text-[#1A1917] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
