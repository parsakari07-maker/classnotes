/**
 * Admin Dashboard View with Storage Quota meters and quick shortcuts
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { StorageStats } from '../../types';
import {
  Files,
  HardDrive,
  Download,
  FolderTree,
  Calendar,
  Bell,
  Upload,
  Sparkles,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { formatBytesPersian, formatPersianRelativeTime, toPersianDigits } from '../../utils/persianDate';

export const AdminDashboard: React.FC = () => {
  const { files, subjects, announcements, exams, navigate } = useApp();
  const [stats, setStats] = useState<StorageStats | null>(null);

  useEffect(() => {
    db.getStorageStats().then(setStats);
  }, [files]);

  const totalDownloads = files.reduce((acc, f) => acc + f.download_count, 0);
  const auditLogs = db.getAuditLogs().slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">پیشخوان مدیریت کلاس‌نوت</h1>
          <p className="text-xs text-slate-400 mt-1">
            وضعیت کلی کتابخانه دیجیتال، آمار دانلودها، فضای دیسک و کنترل فایل‌ها
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate({ type: 'admin', subView: 'files' })}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            مدیریت جزوه‌ها
          </button>
          <button
            onClick={() => navigate({ type: 'admin', subView: 'storage' })}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>مدیریت و پاک‌سازی حافظه</span>
          </button>
        </div>
      </div>

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Files */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">کل جزوه‌ها و فایل‌ها</span>
            <Files className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">
              {toPersianDigits(files.length)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>{toPersianDigits(files.filter((f) => f.file_type === 'pdf').length)} پی‌دی‌اف</span>
              <span>·</span>
              <span>{toPersianDigits(files.filter((f) => f.file_type === 'image').length)} تصویر</span>
            </div>
          </div>
        </div>

        {/* Total Storage Used */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">حجم مصرفی فایل‌ها</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-cyan-400 font-mono">
              {stats ? formatBytesPersian(stats.total_storage_bytes) : '...'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats ? `${toPersianDigits(stats.used_percentage)}٪ از سهمیه کل` : 'در حال محاسبه'}
            </div>
          </div>
        </div>

        {/* Total Downloads */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">مجموع مشاهده و دانلود</span>
            <Download className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {toPersianDigits(totalDownloads)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">توسط دانش‌آموزان کلاس</div>
          </div>
        </div>

        {/* Subjects & Active Exams */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">درس‌ها و امتحانات</span>
            <FolderTree className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">
              {toPersianDigits(subjects.length)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {toPersianDigits(exams.upcoming.length)} امتحان پیش‌رو در تقویم
            </div>
          </div>
        </div>
      </div>

      {/* Storage Progress Gauge & Orphans Alert */}
      {stats && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <span>وضعیت سهمیه حافظه ذخیره‌سازی</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تفکیک داده‌های ذخیره‌شده بر روی دیسک نسبت به کل سهمیه اختصاص‌یافته
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">
              {formatBytesPersian(stats.total_storage_bytes)} از{' '}
              {formatBytesPersian(stats.storage_quota_bytes)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-indigo-500 h-full transition-all"
              style={{
                width: `${stats.total_storage_bytes > 0 ? (stats.pdf_bytes / stats.storage_quota_bytes) * 100 : 0}%`,
              }}
              title={`PDF: ${formatBytesPersian(stats.pdf_bytes)}`}
            />
            <div
              className="bg-cyan-400 h-full transition-all"
              style={{
                width: `${stats.total_storage_bytes > 0 ? (stats.image_bytes / stats.storage_quota_bytes) * 100 : 0}%`,
              }}
              title={`تصاویر: ${formatBytesPersian(stats.image_bytes)}`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>فایل‌های PDF: {formatBytesPersian(stats.pdf_bytes)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>تصاویر تخته: {formatBytesPersian(stats.image_bytes)}</span>
              </span>
            </div>

            {stats.orphaned_files_count > 0 && (
              <button
                onClick={() => navigate({ type: 'admin', subView: 'storage' })}
                className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  {toPersianDigits(stats.orphaned_files_count)} فایل یتیم شناسایی شد (
                  {formatBytesPersian(stats.orphaned_bytes)})
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2-Column: Recent Uploads + Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Files className="w-4 h-4 text-indigo-400" />
              <span>آخرین جزوه‌های بارگذاری‌شده</span>
            </h3>
            <button
              onClick={() => navigate({ type: 'admin', subView: 'files' })}
              className="text-xs text-indigo-400 hover:underline"
            >
              مدیریت همه
            </button>
          </div>

          <div className="space-y-3">
            {files.slice(0, 5).map((file) => {
              const sub = subjects.find((s) => s.id === file.subject_id);
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {file.file_type === 'pdf' ? (
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="font-bold text-slate-200 block truncate">{file.title}</span>
                      <span className="text-[11px] text-slate-400">
                        {sub?.name || 'عمومی'} · {formatBytesPersian(file.file_size)}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 shrink-0 tabular-nums">
                    {formatPersianRelativeTime(file.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Log */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>گزارش رویدادها و فعالیت‌های اخیر</span>
            </h3>
            <span className="text-xs text-slate-500">تاریخچه تغییرات</span>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs gap-3"
              >
                <div>
                  <span className="font-bold text-slate-200 block mb-0.5">{log.action}</span>
                  <span className="text-slate-400 text-[11px] leading-relaxed">{log.details}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0 tabular-nums">
                  {formatPersianRelativeTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
