/**
 * Safe Confirmation Modal for Destructive Operations
 */

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { formatBytesPersian, toPersianDigits } from '../../utils/persianDate';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemCount?: number;
  totalBytes?: number;
  confirmLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  itemCount,
  totalBytes,
  confirmLabel = 'تأیید و اجرا',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header Icon */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl ${
                isDestructive
                  ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20'
                  : 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">عملیات نیازمند تأیید صریح است</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message body */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{message}</p>

        {/* Quantified impact box */}
        {(itemCount !== undefined || totalBytes !== undefined) && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mb-5 flex items-center justify-around text-xs">
            {itemCount !== undefined && (
              <div className="text-center">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">تعداد فایل‌های متأثر</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {toPersianDigits(itemCount)} فایل
                </span>
              </div>
            )}
            {totalBytes !== undefined && (
              <div className="text-center border-r border-slate-200 dark:border-slate-700 pr-4">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">حجم کل حافظه</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm font-mono">
                  {formatBytesPersian(totalBytes)}
                </span>
              </div>
            )}
          </div>
        )}

        {isDestructive && (
          <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 mb-5">
            توجه: این عملیات غیرقابل بازگشت است و اطلاعات فایل از حافظه دیسک به طور دائم حذف می‌گردد.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl text-white transition-all shadow-md active:scale-95 disabled:opacity-50 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
            }`}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
