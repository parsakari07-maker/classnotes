/**
 * Global Toast Notification Overlay
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-cyan-500 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200',
          error: 'border-rose-500/30 bg-rose-950/80 text-rose-200',
          warning: 'border-amber-500/30 bg-amber-950/80 text-amber-200',
          info: 'border-cyan-500/30 bg-cyan-950/80 text-cyan-200',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl text-sm transition-all animate-in fade-in slide-in-from-bottom-2 ${borders[toast.type]}`}
          >
            <div className="flex items-center gap-3">
              {icons[toast.type]}
              <span className="font-medium leading-relaxed">{toast.message}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              aria-label="بستن اعلان"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
