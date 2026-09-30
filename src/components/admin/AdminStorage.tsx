/**
 * Dedicated Storage Management & Orphan Files Cleanup Dashboard
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { storageEngine } from '../../services/storageEngine';
import { StorageStats, OrphanFile, NoteFile } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  HardDrive,
  Sparkles,
  Trash2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  FolderTree,
  Calendar,
  EyeOff,
  Search,
} from 'lucide-react';
import {
  formatBytesPersian,
  formatPersianDateShort,
  toPersianDigits,
} from '../../utils/persianDate';

export const AdminStorage: React.FC = () => {
  const { files, subjects, settings, refreshData, showToast } = useApp();

  const [stats, setStats] = useState<StorageStats | null>(null);
  const [orphans, setOrphans] = useState<OrphanFile[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedOrphanPaths, setSelectedOrphanPaths] = useState<string[]>([]);

  // Cleanup Confirmation
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [cleanupAction, setCleanupAction] = useState<'orphans' | 'oldFiles' | null>(null);
  const [oldDaysTarget, setOldDaysTarget] = useState<number>(30);

  const loadStorageTelemetry = async () => {
    const s = await db.getStorageStats();
    setStats(s);
  };

  useEffect(() => {
    loadStorageTelemetry();
  }, [files]);

  // Scan storage for orphaned binary objects
  const handleScanOrphans = async () => {
    setIsScanning(true);
    showToast('در حال اسکن عمیق مخزن دیسک و تطبیق با پایگاه داده...', 'info');
    try {
      const detected = await db.scanOrphans();
      setOrphans(detected);
      setSelectedOrphanPaths(detected.map((o) => o.path));
      if (detected.length === 0) {
        showToast('هیچ فایل یتیمی در مخزن یافت نشد. تمام فایل‌ها متصل هستند.', 'success');
      } else {
        showToast(`${toPersianDigits(detected.length)} فایل یتیم شناسایی گردید.`, 'warning');
      }
    } catch {
      showToast('خطا در انجام اسکن حافظه.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Purge selected orphan files
  const handlePurgeOrphans = async () => {
    if (selectedOrphanPaths.length === 0) return;
    const purgedCount = await db.cleanupOrphans(selectedOrphanPaths);
    showToast(`تعداد ${toPersianDigits(purgedCount)} فایل یتیم با موفقیت از دیسک پاکسازی شد.`, 'success');
    setOrphans((prev) => prev.filter((o) => !selectedOrphanPaths.includes(o.path)));
    setSelectedOrphanPaths([]);
    setConfirmModalOpen(false);
    loadStorageTelemetry();
  };

  // Old files list
  const oldFiles = files.filter(
    (f) => new Date(f.created_at).getTime() < Date.now() - oldDaysTarget * 86400000
  );
  const oldFilesBytes = oldFiles.reduce((acc, f) => acc + f.file_size, 0);

  // Never downloaded files list
  const neverDownloadedFiles = files.filter((f) => f.download_count === 0);

  // Subject storage breakdown
  const subjectStorageBreakdown = subjects.map((sub) => {
    const subFiles = files.filter((f) => f.subject_id === sub.id);
    const totalBytes = subFiles.reduce((acc, f) => acc + f.file_size, 0);
    return {
      id: sub.id,
      name: sub.name,
      color: sub.color,
      fileCount: subFiles.length,
      bytes: totalBytes,
    };
  }).sort((a, b) => b.bytes - a.bytes);

  return (
    <div className="space-y-8 animate-in fade-in text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <span>داشبورد جامع مدیریت حافظه و دیسک</span>
          </h1>
          <p className="text-slate-400 mt-1">
            پایش لحظه‌ای فضای دیسک، کشف فایل‌های یتیم (Orphan)، فایل‌های بدون دانلود و پاک‌سازی هوشمند
          </p>
        </div>

        <button
          onClick={handleScanOrphans}
          disabled={isScanning}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'در حال اسکن دیسک...' : 'اسکن فایل‌های یتیم مخزن'}</span>
        </button>
      </div>

      {/* Finalized Infrastructure Architecture Status */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/60 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">زیرساخت فعال: Cloudflare R2 + Neon PostgreSQL</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                اتصال برقرار
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              متادیتا و شاخص‌ها در Neon Postgres ذخیره شده و فایل‌های سنگین مستقیماً از Cloudflare R2 بدون واسطه‌گری تحویل داده می‌شوند.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
            Edge: Cloudflare Workers
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
            Storage: R2 Bucket
          </span>
        </div>
      </div>

      {/* Main Quota Progress Card */}
      {stats && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-slate-400 block text-xs">سهمیه کلی فضای کلاس</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
                {formatBytesPersian(stats.total_storage_bytes)} /{' '}
                {formatBytesPersian(stats.storage_quota_bytes)}
              </span>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block">درصد استفاده</span>
              <span className="text-2xl font-black text-cyan-400 font-mono">
                {toPersianDigits(stats.used_percentage)}٪
              </span>
            </div>
          </div>

          {/* Meter Bar */}
          <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-indigo-500 h-full transition-all"
              style={{ width: `${(stats.pdf_bytes / stats.storage_quota_bytes) * 100}%` }}
              title={`PDF: ${formatBytesPersian(stats.pdf_bytes)}`}
            />
            <div
              className="bg-cyan-400 h-full transition-all"
              style={{ width: `${(stats.image_bytes / stats.storage_quota_bytes) * 100}%` }}
              title={`تصاویر: ${formatBytesPersian(stats.image_bytes)}`}
            />
          </div>

          {/* Breakdown Pills unboxed */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <div>
              <span className="text-slate-500 block mb-1">فایل‌های پی‌دی‌اف ({toPersianDigits(stats.pdf_count)})</span>
              <span className="font-bold text-slate-200 font-mono">{formatBytesPersian(stats.pdf_bytes)}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">تصاویر تخته ({toPersianDigits(stats.image_count)})</span>
              <span className="font-bold text-slate-200 font-mono">{formatBytesPersian(stats.image_bytes)}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">متوسط حجم هر جزوه</span>
              <span className="font-bold text-slate-200 font-mono">{formatBytesPersian(stats.average_file_size)}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">حجم متادیتای پایگاه داده</span>
              <span className="font-bold text-slate-200 font-mono">{formatBytesPersian(stats.database_bytes)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Orphan File Scanner Results */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>فایل‌های یتیم مخزن دیسک (Orphan Files)</span>
            </h2>
            <p className="text-slate-400 mt-1">
              فایل‌هایی که در مخزن دیسک وجود دارند اما هیچ رکوردی در پایگاه داده به آن‌ها متصل نیست.
            </p>
          </div>

          {orphans.length > 0 && (
            <button
              onClick={() => {
                setCleanupAction('orphans');
                setConfirmModalOpen(true);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-600/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاکسازی {toPersianDigits(selectedOrphanPaths.length)} فایل یتیم</span>
            </button>
          )}
        </div>

        {orphans.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-white">مخزن کاملاً پاک و یکپارچه است</p>
            <p className="text-slate-400 mt-1">هیچ فایل بدون شناسه یا یتیمی در حافظه وجود ندارد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-2.5">مسیر فایل در دیسک</th>
                  <th className="p-2.5">نام فایل</th>
                  <th className="p-2.5">نوع</th>
                  <th className="p-2.5">حجم</th>
                  <th className="p-2.5">تاریخ ثبت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {orphans.map((o) => (
                  <tr key={o.path} className="hover:bg-slate-800/30">
                    <td className="p-2.5 text-slate-400 truncate max-w-xs">{o.path}</td>
                    <td className="p-2.5 text-white font-medium">{o.filename}</td>
                    <td className="p-2.5 uppercase">{o.file_type}</td>
                    <td className="p-2.5">{formatBytesPersian(o.size)}</td>
                    <td className="p-2.5 text-slate-500">{formatPersianDateShort(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2-Columns: Subject Consumption & Old/Unused Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage by Subject */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-indigo-400" />
            <span>حجم مصرفی به تفکیک درس‌ها</span>
          </h3>

          <div className="space-y-4">
            {subjectStorageBreakdown.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name} ({toPersianDigits(item.fileCount)} جزوه)
                  </span>
                  <span className="font-mono text-slate-400">{formatBytesPersian(item.bytes)}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${stats && stats.total_storage_bytes > 0 ? (item.bytes / stats.total_storage_bytes) * 100 : 0}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Never Downloaded Files */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-cyan-400" />
              <span>جزوه‌های بدون مشاهده و دانلود ({toPersianDigits(neverDownloadedFiles.length)})</span>
            </h3>
            <span className="text-[11px] text-slate-500">پیشنهاد بررسی جهت پاکسازی</span>
          </div>

          {neverDownloadedFiles.length === 0 ? (
            <p className="text-slate-400 text-center py-8">تمامی جزوه‌ها حداقل یک بار دانلود یا مشاهده شده‌اند.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {neverDownloadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs"
                >
                  <div className="truncate max-w-xs">
                    <span className="font-bold text-slate-200 block truncate">{file.title}</span>
                    <span className="text-[11px] text-slate-400">
                      بارگذاری در {formatPersianDateShort(file.created_at)}
                    </span>
                  </div>
                  <span className="font-mono text-slate-400 shrink-0">
                    {formatBytesPersian(file.file_size)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title="تأیید پاکسازی فایل‌های یتیم"
        message="آیا از پاکسازی تمام فایل‌های یتیم شناسایی شده اطمینان دارید؟ این فایل‌ها هیچ رکوردی در پایگاه داده ندارند و از دیسک حذف خواهند شد."
        itemCount={selectedOrphanPaths.length}
        confirmLabel="پاکسازی فایل‌های یتیم"
        isDestructive={true}
        onConfirm={handlePurgeOrphans}
        onCancel={() => setConfirmModalOpen(false)}
      />
    </div>
  );
};
