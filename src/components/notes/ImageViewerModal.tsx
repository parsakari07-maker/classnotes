/**
 * In-Browser Responsive Image Lightbox Modal for whiteboard notes
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storageEngine } from '../../services/storageEngine';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Image as ImageIcon,
  Share2,
} from 'lucide-react';
import { formatBytesPersian } from '../../utils/persianDate';

export const ImageViewerModal: React.FC = () => {
  const { activeImageNote, closeImageViewer, showToast } = useApp();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeImageNote) {
      setImageUrl(null);
      return;
    }

    setLoading(true);
    setZoom(100);

    let activeUrl: string | null = null;
    storageEngine
      .getFileURL(activeImageNote.storage_path)
      .then((url) => {
        if (url) {
          activeUrl = url;
          setImageUrl(url);
        } else {
          showToast('تصویر تخته در حافظه پیدا نشد.', 'error');
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        showToast('خطا در بارگذاری تصویر تخته.', 'error');
      });

    return () => {
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [activeImageNote, showToast]);

  if (!activeImageNote) return null;

  const handleDownload = async () => {
    const blob = await storageEngine.getFileBlob(activeImageNote.storage_path);
    if (blob) {
      storageEngine.triggerDownload(blob, activeImageNote.original_filename);
      showToast(`دانلود «${activeImageNote.title}» آغاز شد.`, 'success');
    }
  };

  const handleShare = async () => {
    const noteUrl = `${window.location.origin}/#note-${activeImageNote.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeImageNote.title,
          url: noteUrl,
        });
        return;
      } catch {
        // Fallback
      }
    }
    navigator.clipboard.writeText(noteUrl);
    showToast('لینک جزوه کپی شد.', 'info');
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
    >
      <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 shrink-0 gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {activeImageNote.title}
              </h3>
              <p className="text-xs text-slate-400">{formatBytesPersian(activeImageNote.file_size)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-slate-300">
              <button
                onClick={() => setZoom((z) => Math.max(50, z - 20))}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                title="کوچک‌نمایی"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(250, z + 20))}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                title="بزرگ‌نمایی"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(100)}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                title="اندازه پیش‌فرض"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleShare}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 rounded-xl transition-colors border border-slate-700/60"
              title="اشتراک‌گذاری لینک"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors shadow-md"
              title="دانلود تصویر"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">دانلود تصویر</span>
            </button>

            <button
              onClick={closeImageViewer}
              className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/80 rounded-xl transition-colors border border-slate-700/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas */}
        <div className="flex-1 bg-slate-950/90 overflow-auto flex items-center justify-center p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">در حال بارگذاری تصویر تخته هوشمند...</p>
            </div>
          ) : imageUrl ? (
            <div className="flex items-center justify-center w-full h-full overflow-auto">
              <img
                src={imageUrl}
                alt={activeImageNote.title}
                referrerPolicy="no-referrer"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl select-none"
              />
            </div>
          ) : (
            <div className="text-slate-400 text-sm">تصویر در دسترس نیست.</div>
          )}
        </div>
      </div>
    </div>
  );
};
