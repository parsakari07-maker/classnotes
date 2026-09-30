/**
 * Dedicated Note Details Page View (/notes/[slug])
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NoteFile } from '../../types';
import { db } from '../../services/database';
import { storageEngine } from '../../services/storageEngine';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Share2,
  Calendar,
  Layers,
  ArrowRight,
  HardDrive,
  Clock,
} from 'lucide-react';
import {
  formatBytesPersian,
  formatPersianDate,
  formatPersianRelativeTime,
  toPersianDigits,
} from '../../utils/persianDate';

interface NoteDetailsViewProps {
  slug: string;
}

export const NoteDetailsView: React.FC<NoteDetailsViewProps> = ({ slug }) => {
  const { subjects, navigate, openPdfViewer, openImageViewer, showToast } = useApp();
  const [note, setNote] = useState<NoteFile | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const item = db.getFileBySlug(slug);
    setNote(item);

    if (item) {
      storageEngine.getFileURL(item.storage_path).then((url) => {
        if (url) setPreviewBlobUrl(url);
      });
    }

    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [slug]);

  if (!note) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">جزوه پیدا نشد</h2>
        <p className="text-sm text-slate-500 mb-6">ممکن است این فایل حذف شده یا آدرس وارد شده نادرست باشد.</p>
        <button
          onClick={() => navigate({ type: 'home' })}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
        >
          بازگشت به صفحه اصلی
        </button>
      </div>
    );
  }

  const subject = subjects.find((s) => s.id === note.subject_id);
  const isPdf = note.file_type === 'pdf';

  const handleShare = async () => {
    const noteUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: `جزوه کلاسی ${note.title}`,
          url: noteUrl,
        });
        return;
      } catch {
        // Fallback
      }
    }

    try {
      await navigator.clipboard.writeText(noteUrl);
      showToast('لینک جزوه کپی شد.', 'info');
    } catch {
      showToast('خطا در کپی لینک.', 'error');
    }
  };

  const handleDownload = async () => {
    const blob = await storageEngine.getFileBlob(note.storage_path);
    if (blob) {
      storageEngine.triggerDownload(blob, note.original_filename);
      await db.incrementDownload(note.id);
      showToast(`دانلود «${note.title}» آغاز شد.`, 'success');
    }
  };

  const handleOpenViewer = () => {
    if (isPdf) openPdfViewer(note);
    else openImageViewer(note);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6">
        <button
          onClick={() => navigate({ type: 'home' })}
          className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
        >
          صفحه اصلی
        </button>
        <span aria-hidden="true">/</span>
        {subject && (
          <>
            <button
              onClick={() => navigate({ type: 'subject', slug: subject.slug })}
              className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
            >
              {subject.name}
            </button>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span className="text-slate-800 dark:text-slate-200 truncate">{note.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* Subject badge and date line */}
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: subject?.color || '#3b82f6' }}
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {subject?.name || 'عمومی'}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span>{isPdf ? 'جزوه PDF' : 'تصویر تخته کلاس'}</span>
              </div>
              <span className="tabular-nums">{formatPersianRelativeTime(note.created_at)}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed mb-4">
              {note.title}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line mb-8">
              {note.description || 'توضیحات تکمیلی برای این جزوه ثبت نشده است.'}
            </p>

            {/* In-page interactive preview card */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[260px] text-center">
              {isPdf ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-base mb-1">پیش‌نمایش آنلاین جزوه</p>
                    <p className="text-slate-400 text-xs mb-4">
                      امکان مطالعه مستقیم درون وب‌سایت با قابلیت بزرگ‌نمایی و تمام‌صفحه
                    </p>
                  </div>
                  <button
                    onClick={handleOpenViewer}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30"
                  >
                    <Eye className="w-4 h-4" />
                    <span>باز کردن و مطالعه جزوه</span>
                  </button>
                </div>
              ) : previewBlobUrl ? (
                <div className="relative group cursor-pointer w-full" onClick={handleOpenViewer}>
                  <img
                    src={previewBlobUrl}
                    alt={note.title}
                    referrerPolicy="no-referrer"
                    className="max-h-64 mx-auto rounded-lg object-contain shadow-lg"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <span className="px-4 py-2 bg-slate-900/90 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5">
                      <Eye className="w-4 h-4" /> بزرگ‌نمایی تصویر
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <ImageIcon className="w-12 h-12 text-slate-500" />
                  <button
                    onClick={handleOpenViewer}
                    className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold"
                  >
                    نمایش تصویر تخته
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Metadata & Actions (1 col) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              مشخصات فایل و دریافت
            </h3>

            {/* Details list */}
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                  حجم فایل
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {formatBytesPersian(note.file_size)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  تاریخ بارگذاری
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {formatPersianDate(note.created_at)}
                </span>
              </div>

              {note.page_count && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    تعداد صفحات
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {toPersianDigits(note.page_count)} صفحه
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  دفعات مشاهده و دانلود
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {toPersianDigits(note.download_count)} بار
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>دانلود مستقیم فایل ({formatBytesPersian(note.file_size)})</span>
              </button>

              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>اشتراک‌گذاری با همکلاسی‌ها</span>
              </button>
            </div>
          </div>

          {/* Quick back to subject */}
          {subject && (
            <button
              onClick={() => navigate({ type: 'subject', slug: subject.slug })}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-cyan-500/50 rounded-2xl transition-colors text-right"
            >
              <div>
                <span className="text-xs text-slate-400 block">مشاهده سایر جزوه‌های</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  درس {subject.name}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 rotate-180" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
