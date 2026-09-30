/**
 * Student Note Card Component
 * Adheres to Zero-Pill discipline (metadata uses clean unboxed text with separators)
 */

import React from 'react';
import { NoteFile } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Share2,
} from 'lucide-react';
import { formatBytesPersian, formatPersianRelativeTime, toPersianDigits } from '../../utils/persianDate';
import { storageEngine } from '../../services/storageEngine';
import { db } from '../../services/database';

interface NoteCardProps {
  note: NoteFile;
  onSelect?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const { subjects, openPdfViewer, openImageViewer, navigate, showToast } = useApp();

  const subject = subjects.find((s) => s.id === note.subject_id);

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (note.file_type === 'pdf') {
      openPdfViewer(note);
    } else {
      openImageViewer(note);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = await storageEngine.getFileBlob(note.storage_path);
    if (blob) {
      storageEngine.triggerDownload(blob, note.original_filename);
      await db.incrementDownload(note.id);
      showToast(`دانلود «${note.title}» آغاز شد.`, 'success');
    } else {
      showToast('فایل در حافظه پیدا نشد.', 'error');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const noteUrl = `${window.location.origin}/#note-${note.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: `جزوه ${subject?.name || ''}: ${note.title}`,
          url: noteUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(noteUrl);
      showToast('لینک جزوه کپی شد.', 'info');
    } catch {
      showToast('خطا در کپی کردن پیوند.', 'error');
    }
  };

  const isPdf = note.file_type === 'pdf';

  return (
    <div
      onClick={() => navigate({ type: 'note', slug: note.slug })}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-cyan-500/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Top unboxed metadata line */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
          <div className="flex items-center gap-1.5 font-medium">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: subject?.color || '#6366f1' }}
            />
            <span className="text-slate-700 dark:text-slate-300">{subject?.name || 'عمومی'}</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span>{isPdf ? 'فایل PDF' : 'تصویر تخته'}</span>
          </div>

          <span className="tabular-nums">{formatPersianRelativeTime(note.created_at)}</span>
        </div>

        {/* Note Title */}
        <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 leading-relaxed mb-2">
          {note.title}
        </h4>

        {/* Description snippet */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {note.description || 'بدون توضیحات تکمیلی.'}
        </p>
      </div>

      <div>
        {/* File metrics without candy pills */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="font-mono tabular-nums">{formatBytesPersian(note.file_size)}</span>
          {note.page_count && (
            <>
              <span aria-hidden="true">·</span>
              <span>{toPersianDigits(note.page_count)} صفحه</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{toPersianDigits(note.download_count)} بار مشاهده/دانلود</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePreview}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
              title="مشاهده آنلاین"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>مشاهده</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-cyan-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
              title="دانلود فایل"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود</span>
            </button>
          </div>

          <button
            onClick={handleShare}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="اشتراک‌گذاری پیوند"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
