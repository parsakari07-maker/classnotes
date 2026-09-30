/**
 * Admin Settings & Password Configuration
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { Settings, Lock, Save, HardDrive, KeyRound } from 'lucide-react';
import { toPersianDigits } from '../../utils/persianDate';

export const AdminSettings: React.FC = () => {
  const { settings, refreshData, showToast, changePassword } = useApp();

  // General Settings State
  const [siteName, setSiteName] = useState(settings.site_name);
  const [className, setClassName] = useState(settings.class_name);
  const [description, setDescription] = useState(settings.description);
  const [maxUploadSize, setMaxUploadSize] = useState(settings.max_upload_size_mb);
  const [storageQuota, setStorageQuota] = useState(settings.storage_quota_mb);

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings({
      site_name: siteName,
      class_name: className,
      description,
      max_upload_size_mb: Number(maxUploadSize),
      storage_quota_mb: Number(storageQuota),
    });
    showToast('تنظیمات سامانه با موفقیت ذخیره گردید.', 'success');
    refreshData();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('تکرار رمز عبور جدید همخوانی ندارد.', 'error');
      return;
    }

    const res = changePassword(oldPassword, newPassword);
    if (res.success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast(res.error || 'خطا در تغییر رمز عبور.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in text-xs max-w-4xl">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>تنظیمات سامانه و امنیت</span>
        </h1>
        <p className="text-slate-400 mt-1">مدیریت هویت سایت، محدودیت‌های آپلود، سهمیه حافظه و تغییر رمز عبور مدیر</p>
      </div>

      {/* General Settings */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800">
          هویت و پیکربندی کتابخانه
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">نام سامانه (عنوان سایت)</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">نام یا عنوان کلاس</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">توضیحات معرفی کلاس</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                حداکثر حجم مجاز هر آپلود (مگابایت)
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={maxUploadSize}
                onChange={(e) => setMaxUploadSize(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                سقف سهمیه کل حافظه (مگابایت)
              </label>
              <input
                type="number"
                min={100}
                max={5000}
                value={storageQuota}
                onChange={(e) => setStorageQuota(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره تنظیمات</span>
            </button>
          </div>
        </form>
      </div>

      {/* Admin Password Change Form */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-cyan-400" />
          <span>تغییر رمز عبور مدیر</span>
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">رمز عبور فعلی</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">رمز عبور جدید (حداقل ۸ نویسه)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">تکرار رمز عبور جدید</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-md transition-all"
            >
              به‌روزرسانی رمز عبور
            </button>
          </div>
        </form>
      </div>

      {/* Finalized Cloud Infrastructure Info Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-indigo-400" />
          <span>پیکربندی زیرساخت ابری (Cloudflare Workers + R2 + Neon PostgreSQL)</span>
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          معماری پایدار و استاندارد بر پایه پلن رایگان برای یک کلاس مدرسه
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block mb-1">کنترل سورس و مخزن</span>
            <span className="font-bold text-white block">GitHub (Source Code & CI/CD)</span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              فایل‌های آموزشی هرگز در گیت نگهداری نمی‌شوند و در R2 ذخیره می‌گردند.
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block mb-1">موتور پردازش لبه و وب‌سرویس</span>
            <span className="font-bold text-cyan-400 block">Cloudflare Workers</span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              قانون کلیدی کارایی: فایل‌های حجیم از ورکر پروکسی نمی‌شوند.
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block mb-1">مخزن آبجکت و فایل‌ها</span>
            <span className="font-bold text-indigo-400 block">Cloudflare R2 Bucket (classnotes-storage)</span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              تحویل مستقیم با پهنای باند رایگان (Zero Egress Fee)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block mb-1">پایگاه داده رابطه‌ای متادیتا</span>
            <span className="font-bold text-emerald-400 block">Neon PostgreSQL</span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              اتصال از طریق درایور سرورلس @neondatabase/serverless
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
