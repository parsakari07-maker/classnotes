/**
 * Admin File Upload Modal with Magic Byte Validation & Storage Sync
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storageEngine } from '../../services/storageEngine';
import { db } from '../../services/database';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { formatBytesPersian, toPersianDigits } from '../../utils/persianDate';

interface AdminUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSubjectId?: string;
}

export const AdminUploadModal: React.FC<AdminUploadModalProps> = ({
  isOpen,
  onClose,
  preselectedSubjectId,
}) => {
  const { subjects, refreshData, showToast, settings } = useApp();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image'>('pdf');
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(preselectedSubjectId || (subjects[0]?.id || ''));
  const [description, setDescription] = useState('');
  const [pageCount, setPageCount] = useState<number | ''>('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [sizeWarning, setSizeWarning] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError('');
    setSizeWarning('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size limit (from site settings)
    const maxBytes = settings.max_upload_size_mb * 1024 * 1024;
    if (file.size > maxBytes) {
      setValidationError(
        `حجم فایل (${formatBytesPersian(file.size)}) بیش از حداکثر مجاز (${settings.max_upload_size_mb} مگابایت) است.`
      );
      return;
    }

    // Size warning if > 15MB
    if (file.size > 15 * 1024 * 1024) {
      setSizeWarning('این فایل نسبتاً حجیم است و فضای قابل توجهی از حافظه کلاس مصرف خواهد کرد.');
    }

    // Validate magic bytes
    const check = await storageEngine.validateMagicBytes(file);
    if (!check.valid) {
      setValidationError(check.error || 'فایل انتخاب‌شده نامعتبر است.');
      return;
    }

    setSelectedFile(file);
    setFileType(check.detectedType || (file.type === 'application/pdf' ? 'pdf' : 'image'));

    // Auto-fill title from filename if empty
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError('لطفاً یک فایل انتخاب نمایید.');
      return;
    }
    if (!title.trim()) {
      setValidationError('لطفاً عنوان جزوه را وارد کنید.');
      return;
    }
    if (!subjectId) {
      setValidationError('لطفاً درس مرتبط را انتخاب نمایید.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      // Progress simulation for user feedback
      const timer = setInterval(() => {
        setUploadProgress((p) => (p < 85 ? p + 25 : p));
      }, 150);

      await db.uploadFile(selectedFile, fileType, selectedFile.name, {
        title,
        subject_id: subjectId,
        description,
        page_count: pageCount ? Number(pageCount) : undefined,
      });

      clearInterval(timer);
      setUploadProgress(100);

      showToast(`جزوه «${title}» با موفقیت در مخزن ذخیره شد.`, 'success');
      await refreshData();
      onClose();

      // Reset form
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setPageCount('');
      setUploadProgress(0);
    } catch (err: any) {
      setValidationError(err?.message || 'خطا در آپلود فایل و ذخیره‌سازی.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">آپلود جزوه یا تصویر جدید</h2>
              <p className="text-xs text-slate-400 mt-0.5">افزودن محتوا به کتابخانه دیجیتال کلاس</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {sizeWarning && (
          <div className="flex items-center gap-2 p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-300 text-xs mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{sizeWarning}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* File Picker Drag Box */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">انتخاب فایل</label>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/50 rounded-2xl p-5 text-center cursor-pointer transition-colors">
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3 text-right">
                  {fileType === 'pdf' ? (
                    <FileText className="w-8 h-8 text-indigo-400 shrink-0" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-cyan-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-white block truncate max-w-xs">{selectedFile.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatBytesPersian(selectedFile.size)} · {fileType === 'pdf' ? 'PDF' : 'تصویر'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="font-semibold text-slate-300">برای انتخاب فایل اینجا کلیک کنید</span>
                  <span className="text-[11px] text-slate-500">
                    فرمت‌های مجاز: PDF، JPG، PNG، WebP (حداکثر {settings.max_upload_size_mb} مگابایت)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Subject Dropdown */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">درس مربوطه</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={isUploading}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">عنوان جزوه / مبحث</label>
            <input
              type="text"
              placeholder="مثال: جزوه حرکت با شتاب ثابت - جلسه سوم"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Page count (optional for PDFs) */}
          {fileType === 'pdf' && (
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">تعداد صفحات (اختیاری)</label>
              <input
                type="number"
                placeholder="مثال: ۱۰"
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value ? Number(e.target.value) : '')}
                disabled={isUploading}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">توضیحات و نکات کلیدی</label>
            <textarea
              rows={3}
              placeholder="توضیح مختصری درباره سرفصل‌های تدریس‌شده در این جلسه..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>در حال آپلود و ذخیره‌سازی در مخزن دیسک...</span>
                <span className="font-mono tabular-nums">{toPersianDigits(uploadProgress)}٪</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl"
            >
              انصراف
            </button>

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 active:scale-95 transition-all"
            >
              {isUploading ? 'در حال ثبت...' : 'آپلود و انتشار در سایت'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
