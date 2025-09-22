import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  timeout?: number;
}

interface ToastContextType {
  toasts: Toast[];
  push: (t: Omit<Toast,'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast,'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, timeout: 4000, ...t };
    setToasts(prev => [...prev, toast]);
    if (toast.timeout) {
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== id));
      }, toast.timeout);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
      <div style={{ position:'fixed', top:16, right:16, display:'flex', flexDirection:'column', gap:8, zIndex:1000 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ minWidth:260, padding:'0.75rem 1rem', borderRadius:8, boxShadow:'0 4px 14px rgba(0,0,0,0.12)', background: t.type==='error' ? '#fee' : t.type==='success' ? '#e6f9ef' : '#eef5ff', border:'1px solid '+(t.type==='error' ? '#f99' : t.type==='success' ? '#5abf89' : '#8cb6ff'), fontSize:14 }}>
            <strong style={{ display:'block', marginBottom:4, fontWeight:600 }}>
              {t.type === 'error' ? 'Error' : t.type === 'success' ? 'Success' : 'Info'}
            </strong>
            <span>{t.message}</span>
            <button onClick={()=>dismiss(t.id)} style={{ position:'absolute', top:4, right:6, background:'none', border:'none', cursor:'pointer', fontSize:16 }}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if(!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
