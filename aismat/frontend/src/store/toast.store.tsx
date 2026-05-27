import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  show: (toast: Omit<Toast, 'id'>) => number;
  success: (title: string, description?: string) => number;
  error: (title: string, description?: string) => number;
  info: (title: string, description?: string) => number;
  warning: (title: string, description?: string) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (toast: Omit<Toast, 'id'>): number => {
      const id = ++toastIdCounter;
      const duration = toast.duration ?? 4000;
      setToasts((list) => [...list, { id, ...toast }]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (title, description) => show({ type: 'success', title, description }),
      error: (title, description) => show({ type: 'error', title, description, duration: 6000 }),
      info: (title, description) => show({ type: 'info', title, description }),
      warning: (title, description) => show({ type: 'warning', title, description }),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: number) => void;
}): JSX.Element {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }): JSX.Element {
  const [show, setShow] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  const config = toastConfig(toast.type);

  return (
    <div
      className={`pointer-events-auto flex w-[min(380px,calc(100vw-3rem))] items-start gap-3 rounded-2xl border p-4 shadow-mint-lg backdrop-blur-xl transition-all duration-300 ${config.bg} ${
        show ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      }`}
      role="status"
    >
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.iconBg} text-white shadow`}
      >
        {config.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className={`font-display font-bold ${config.title}`}>{toast.title}</div>
        {toast.description && (
          <div className={`mt-0.5 text-sm ${config.desc}`}>{toast.description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className={`shrink-0 rounded-lg p-1 transition ${config.close}`}
        aria-label="Закрити"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

interface VisualCfg {
  bg: string;
  iconBg: string;
  title: string;
  desc: string;
  close: string;
  icon: JSX.Element;
}

function toastConfig(type: ToastType): VisualCfg {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-white/90 border-mint-200 dark:bg-mint-950/85 dark:border-mint-700',
        iconBg: 'bg-mint-gradient',
        title: 'text-mint-900 dark:text-mint-100',
        desc: 'text-mint-700 dark:text-mint-300',
        close: 'text-mint-600 hover:bg-mint-100 dark:text-mint-300 dark:hover:bg-mint-800',
        icon: <CheckCircle2 size={18} strokeWidth={2.5} />,
      };
    case 'error':
      return {
        bg: 'bg-white/90 border-rose-200 dark:bg-mint-950/85 dark:border-rose-700/60',
        iconBg: 'bg-gradient-to-br from-rose-400 to-rose-600',
        title: 'text-rose-700 dark:text-rose-300',
        desc: 'text-rose-600 dark:text-rose-400',
        close: 'text-rose-500 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40',
        icon: <XCircle size={18} strokeWidth={2.5} />,
      };
    case 'warning':
      return {
        bg: 'bg-white/90 border-amber-200 dark:bg-mint-950/85 dark:border-amber-700/60',
        iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
        title: 'text-amber-800 dark:text-amber-300',
        desc: 'text-amber-700 dark:text-amber-400',
        close: 'text-amber-600 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40',
        icon: <AlertTriangle size={18} strokeWidth={2.5} />,
      };
    case 'info':
    default:
      return {
        bg: 'bg-white/90 border-mint-200 dark:bg-mint-950/85 dark:border-mint-700',
        iconBg: 'bg-gradient-to-br from-cyan-400 to-mint-500',
        title: 'text-mint-900 dark:text-mint-100',
        desc: 'text-mint-700 dark:text-mint-300',
        close: 'text-mint-600 hover:bg-mint-100 dark:text-mint-300 dark:hover:bg-mint-800',
        icon: <Info size={18} strokeWidth={2.5} />,
      };
  }
}
