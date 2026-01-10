'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`} onClick={() => removeToast(toast.id)}>
            <span className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && 'ℹ'}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}>×</button>
          </div>
        ))}
      </div>
      <style jsx global>{`
        .toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 400px;
          width: 100%;
          pointer-events: none;
        }
        .toast {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: var(--radius);
          background: var(--card-elevated);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          animation: slideIn 0.3s ease-out;
          cursor: pointer;
          pointer-events: auto;
          overflow: hidden;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .toast-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .toast-success .toast-icon {
          background: var(--success-bg);
          color: var(--success);
        }
        .toast-error .toast-icon {
          background: var(--danger-bg);
          color: var(--danger);
        }
        .toast-warning .toast-icon {
          background: var(--warning-bg);
          color: var(--warning);
        }
        .toast-info .toast-icon {
          background: var(--accent-bg);
          color: var(--accent);
        }
        .toast-message {
          flex: 1;
          color: var(--text);
          font-size: 14px;
          line-height: 1.5;
          font-weight: 500;
        }
        .toast-close {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          border-radius: var(--radius-sm);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toast-close:hover {
          color: var(--text);
          background: var(--bg-tertiary);
        }
        .toast-success { border-left: 4px solid var(--success); }
        .toast-error { border-left: 4px solid var(--danger); }
        .toast-warning { border-left: 4px solid var(--warning); }
        .toast-info { border-left: 4px solid var(--accent); }
      `}</style>
    </ToastContext.Provider>
  );
}

