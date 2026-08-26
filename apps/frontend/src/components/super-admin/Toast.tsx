import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, message, duration = 3500 }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast]);
  const error = useCallback((title: string, message?: string) => toast({ type: 'error', title, message }), [toast]);
  const info = useCallback((title: string, message?: string) => toast({ type: 'info', title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: 'warning', title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      {/* Toast Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          width: 'calc(100% - 48px)',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((t) => {
          const colors = {
            success: { bg: '#ffffff', border: '#137333', icon: '#137333', text: '#137333', badge: '#e6f4ea' },
            error: { bg: '#ffffff', border: '#c5221f', icon: '#c5221f', text: '#c5221f', badge: '#fce8e6' },
            warning: { bg: '#ffffff', border: '#b06000', icon: '#b06000', text: '#b06000', badge: '#fef7e0' },
            info: { bg: '#ffffff', border: '#084b83', icon: '#084b83', text: '#084b83', badge: '#EFF6FC' }
          }[t.type];

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}40`,
                borderLeft: `4px solid ${colors.border}`,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: colors.badge,
                  color: colors.icon,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  flexShrink: 0
                }}
              >
                {t.type === 'success' && '✓'}
                {t.type === 'error' && '✕'}
                {t.type === 'warning' && '!'}
                {t.type === 'info' && 'i'}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#502419' }}>{t.title}</div>
                {t.message && (
                  <div style={{ fontSize: '12px', color: '#805c54', marginTop: '2px', lineHeight: '1.4' }}>
                    {t.message}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#805c54',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '2px',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
