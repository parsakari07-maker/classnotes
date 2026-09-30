/**
 * In-Browser Responsive PDF Viewer Modal
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { storageEngine } from '../../services/storageEngine';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  FileText,
  Share2,
} from 'lucide-react';
import { formatBytesPersian, toPersianDigits } from '../../utils/persianDate';

export const PdfViewerModal: React.FC = () => {
  const { activePdfNote, closePdfViewer, showToast } = useApp();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activePdfNote) {
      setPdfUrl(null);
      return;
    }

    setLoading(true);
    setZoom(100);

    let activeUrl: string | null = null;
    storageEngine
      .getFileURL(activePdfNote.storage_path)
      .then((url) => {
        if (url) {
          activeUrl = url;
          setPdfUrl(url);
        } else {
          showToast('فایل PDF در حافظه پیدا نشد.', 'error');
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        showToast('خطا در بارگذاری فایل PDF.', 'error');
      });

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [activePdfNote, showToast]);

  if (!activePdfNote) return null;

  const handleDownload = async () => {
    const blob = await storageEngine.getFileBlob(activePdfNote.storage_path);
    if (blob) {
      storageEngine.triggerDownload(blob, activePdfNote.original_filename);
      showToast(`دانلود «${activePdfNote.title}» آغاز شد.`, 'success');
    }
  };

  const handleShare = async () => {
    const noteUrl = `${window.location.origin}/#note-${activePdfNote.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: activePdfNote.title,
          url: noteUrl,
        });
        return;
      } catch {
        // fallback
      }
    }
    navigator.clipboard.writeText(noteUrl);
    showToast('لینک جزوه کپی شد.', 'info');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div
        className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[90vh]'
        }`}
      >
        {/* Top Control Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 shrink-0 gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {activePdfNote.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{formatBytesPersian(activePdfNote.file_size)}</span>
                {activePdfNote.page_count && (
                  <>
                    <span>·</span>
                    <span>{toPersianDigits(activePdfNote.page_count)} صفحه</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-slate-300">
              <button
                onClick={() => setZoom((z) => Math.max(50, z - 15))}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                title="کوچک‌نمایی"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-1.5 tabular-nums">{toPersianDigits(zoom)}٪</span>
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 15))}
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
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/60"
              title="اشتراک‌گذاری لینک"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-md"
              title="دانلود فایل PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">دانلود</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/60"
              title={isFullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={closePdfViewer}
              className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-rose-950/40 rounded-xl transition-colors border border-slate-700/60"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Reader Canvas Area */}
        <div className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-2 sm:p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">در حال بارگذاری جزوه پی‌دی‌اف...</p>
            </div>
          ) : pdfUrl ? (
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="w-full h-full flex flex-col items-center max-w-4xl"
            >
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                title={activePdfNote.title}
                className="w-full h-[75vh] rounded-xl border border-slate-800 shadow-2xl bg-white"
              />
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <p className="text-sm">امکان نمایش مستقیم این فایل وجود ندارد.</p>
              <button
                onClick={handleDownload}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                دریافت و ذخیره فایل
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
