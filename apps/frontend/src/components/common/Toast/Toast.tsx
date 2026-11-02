import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastItem { id: number; type: ToastType; message: string; }
interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const DURATION_MS = 4500;

/** Mount once near the app root. Renders the stack of toasts (bottom-right) and provides useToast(). */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const dismiss = useCallback((id: number) => setItems(prev => prev.filter(item => item.id !== id)), []);
  const show = useCallback((type: ToastType, message: string) => {
    const id = nextId.current++;
    setItems(prev => [...prev, { id, type, message }]);
    window.setTimeout(() => dismiss(id), DURATION_MS);
  }, [dismiss]);
  const api = useMemo<ToastApi>(() => ({
    success: m => show('success', m), error: m => show('error', m), info: m => show('info', m), warning: m => show('warning', m)
  }), [show]);
  return <ToastContext.Provider value={api}>
    {children}
    <div className="ui-toast-stack">
      {items.map(item => <div key={item.id} role={item.type === 'error' || item.type === 'warning' ? 'alert' : 'status'} className={`ui-toast ui-toast--${item.type}`}>
        <span>{item.message}</span>
        <button type="button" className="ui-toast__close" aria-label="Dismiss" onClick={() => dismiss(item.id)}>×</button>
      </div>)}
    </div>
  </ToastContext.Provider>;
};

/** `const toast = useToast(); toast.error('Something failed')`. */
export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

export default ToastProvider;
