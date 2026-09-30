/**
 * Admin Subject Management (Create, Edit, Reorder, Delete Protection)
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Subject } from '../../types';
import { db } from '../../services/database';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/persianDate';

export const AdminSubjects: React.FC = () => {
  const { subjects, refreshData, showToast } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [icon, setIcon] = useState('BookOpen');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setName('');
    setSlug('');
    setDescription('');
    setColor('#3B82F6');
    setIcon('BookOpen');
    setModalOpen(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setSlug(sub.slug);
    setDescription(sub.description);
    setColor(sub.color);
    setIcon(sub.icon);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const baseSlug = (slug || name).trim().toLowerCase().replace(/[\s\/\\:*?"<>|]+/g, '-');

    db.saveSubject({
      id: editingSubject ? editingSubject.id : undefined,
      name,
      slug: baseSlug,
      description,
      color,
      icon,
    });

    showToast(editingSubject ? 'درس با موفقیت ویرایش شد.' : 'درس جدید با موفقیت اضافه شد.', 'success');
    setModalOpen(false);
    refreshData();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    const res = db.deleteSubject(deleteTarget.id);
    if (!res.success) {
      showToast(res.error || 'خطا در حذف درس.', 'error');
    } else {
      showToast(`درس «${deleteTarget.name}» با موفقیت حذف شد.`, 'success');
    }
    setDeleteTarget(null);
    refreshData();
  };

  return (
    <div className="space-y-6 animate-in fade-in text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-400" />
            <span>مدیریت درس‌ها و دسته‌بندی‌ها</span>
          </h1>
          <p className="text-slate-400 mt-1">ایجاد، ویرایش نام، رنگ سازمانی و نظارت بر جزوه‌های هر درس</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن درس جدید</span>
        </button>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((sub) => (
          <div
            key={sub.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: sub.color }}
                  />
                  <h3 className="text-base font-bold text-white">{sub.name}</h3>
                </div>

                <span className="font-mono text-slate-400 font-semibold">
                  {toPersianDigits(sub.notes_count || 0)} جزوه
                </span>
              </div>

              <p className="text-slate-400 leading-relaxed mb-4">{sub.description || 'بدون توضیح.'}</p>
              <div className="text-[11px] font-mono text-slate-500 mb-4">آدرس اینترنتی: /subjects/{sub.slug}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => handleOpenEdit(sub)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl"
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>ویرایش</span>
              </button>

              <button
                onClick={() => setDeleteTarget(sub)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl border border-rose-800/40"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>حذف</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Subject Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingSubject ? `ویرایش درس: ${editingSubject.name}` : 'افزودن درس جدید'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">نام درس</label>
                <input
                  type="text"
                  placeholder="مثال: هندسه تحلیلی"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">نامک انگلیسی (Slug)</label>
                <input
                  type="text"
                  placeholder="مثال: geometry"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">توضیح کوتاه</label>
                <textarea
                  rows={2}
                  placeholder="مباحث و سرفصل‌های کلی این درس..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">رنگ سازمانی کارت</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-slate-700"
                  />
                  <span className="font-mono text-slate-400">{color}</span>
                </div>
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
                  ذخیره درس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subject Guard Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="حذف درس"
        message={`آیا از حذف درس «${deleteTarget?.name}» اطمینان دارید؟ اگر این درس دارای جزوه باشد، سیستم به جهت حفظ ایمنی اجازه حذف نخواهد داد.`}
        confirmLabel="حذف درس"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
