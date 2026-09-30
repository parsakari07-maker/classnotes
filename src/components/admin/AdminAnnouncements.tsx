/**
 * Admin Announcements Management (Create, Edit, Pin, Priority, Expiration)
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Announcement, AnnouncementPriority } from '../../types';
import { db } from '../../services/database';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Bell,
  Plus,
  Pin,
  Edit2,
  Trash2,
  Calendar,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { formatPersianDate, formatPersianRelativeTime } from '../../utils/persianDate';

export const AdminAnnouncements: React.FC = () => {
  const { announcements, refreshData, showToast } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('normal');
  const [isPinned, setIsPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const handleOpenCreate = () => {
    setEditingAnn(null);
    setTitle('');
    setContent('');
    setPriority('normal');
    setIsPinned(false);
    setIsPublished(true);
    setExpiresAt('');
    setModalOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingAnn(ann);
    setTitle(ann.title);
    setContent(ann.content);
    setPriority(ann.priority);
    setIsPinned(ann.is_pinned);
    setIsPublished(ann.is_published);
    setExpiresAt(ann.expires_at ? ann.expires_at.split('T')[0] : '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    db.saveAnnouncement({
      id: editingAnn ? editingAnn.id : undefined,
      title,
      content,
      priority,
      is_pinned: isPinned,
      is_published: isPublished,
      expires_at: expiresAt ? `${expiresAt}T23:59:59Z` : null,
    });

    showToast(editingAnn ? 'اطلاعیه ویرایش شد.' : 'اطلاعیه جدید با موفقیت منتشر گردید.', 'success');
    setModalOpen(false);
    refreshData();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    db.deleteAnnouncement(deleteTarget.id);
    showToast(`اطلاعیه «${deleteTarget.title}» حذف شد.`, 'success');
    setDeleteTarget(null);
    refreshData();
  };

  return (
    <div className="space-y-6 animate-in fade-in text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <span>مدیریت اطلاعیه‌های کلاسی</span>
          </h1>
          <p className="text-slate-400 mt-1">ایجاد هشدارهای کلاسی، امتحانات ناگهانی، اطلاعیه‌های سنجاق‌شده و تاریخ انقضا</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن اطلاعیه جدید</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {ann.is_pinned && (
                  <span className="flex items-center gap-1 font-bold text-amber-400">
                    <Pin className="w-3 h-3 rotate-45" /> سنجاق شده
                  </span>
                )}
                {ann.priority === 'urgent' && (
                  <span className="font-bold text-rose-400">● فوری</span>
                )}
                {ann.priority === 'high' && (
                  <span className="font-bold text-amber-400">● مهم</span>
                )}
                <span className="text-slate-500">
                  ثبت شده در {formatPersianRelativeTime(ann.created_at)}
                </span>
                {!ann.is_published && (
                  <span className="text-slate-500 bg-slate-800 px-2 py-0.5 rounded">پیش‌نویس</span>
                )}
              </div>

              <h3 className="text-base font-bold text-white">{ann.title}</h3>
              <p className="text-slate-400 leading-relaxed max-w-3xl">{ann.content}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                onClick={() => handleOpenEdit(ann)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl"
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>ویرایش</span>
              </button>

              <button
                onClick={() => setDeleteTarget(ann)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl border border-rose-800/40"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>حذف</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingAnn ? 'ویرایش اطلاعیه' : 'ایجاد اطلاعیه جدید'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">عنوان اطلاعیه</label>
                <input
                  type="text"
                  placeholder="مثال: برگزاری آزمون شیمی فردا رأس ساعت ۸:۰۰"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">متن کامل اطلاعیه</label>
                <textarea
                  rows={4}
                  placeholder="شرح جزئیات یا پیام دبیر برای دانش‌آموزان..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">اولویت نمایش</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="normal">عادی</option>
                    <option value="high">مهم</option>
                    <option value="urgent">فوری و اضطراری</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">تاریخ انقضا (اختیاری)</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-left"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                  />
                  <span>سنجاق در بالای صفحه اصلی</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                  />
                  <span>انتشار عمومی در سایت</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  ثبت اطلاعیه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="حذف اطلاعیه"
        message={`آیا از حذف اطلاعیه «${deleteTarget?.title}» اطمینان دارید؟`}
        confirmLabel="حذف اطلاعیه"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
