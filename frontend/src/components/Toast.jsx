import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: { Icon: CheckCircle2, color: 'text-success-600', bg: 'bg-success-50 border-success-200' },
  error: { Icon: XCircle, color: 'text-danger-500', bg: 'bg-danger-50 border-danger-200' },
  warning: { Icon: AlertTriangle, color: 'text-warning-600', bg: 'bg-warning-50 border-warning-200' },
  info: { Icon: Info, color: 'text-primary-600', bg: 'bg-primary-50 border-primary-200' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'success', duration = 3000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Toast container — centered at top, constrained to 420px app width */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-[400px] px-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const { Icon, color, bg } = ICONS[toast.type] || ICONS.info;
          return (
            <div
              key={toast.id}
              className={`
                flex items-start gap-3 p-3.5 rounded-2xl border shadow-lg
                pointer-events-auto animate-slide-in
                ${bg}
              `}
              style={{ animation: 'slideDown 0.25s ease-out' }}
            >
              <Icon size={18} className={`${color} flex-shrink-0 mt-0.5`} strokeWidth={2.5} />
              <p className="flex-1 text-sm font-semibold text-gray-800">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

export default ToastProvider;
