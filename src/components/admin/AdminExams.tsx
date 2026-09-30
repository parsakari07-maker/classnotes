/**
 * Admin Exam Management (Create, Edit, Set Dates & Topics, Delete)
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Exam, ExamStatus } from '../../types';
import { db } from '../../services/database';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Calendar,
  Plus,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  User,
} from 'lucide-react';
import { formatPersianDate, formatPersianDateShort, toPersianDigits } from '../../utils/persianDate';

export const AdminExams: React.FC = () => {
  const { exams, subjects, refreshData, showToast } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('08:00');
  const [description, setDescription] = useState('');
  const [topicsInput, setTopicsInput] = useState('');
  const [status, setStatus] = useState<ExamStatus>('upcoming');
  const [teacherName, setTeacherName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);

  const allExams = [...exams.upcoming, ...exams.past];

  const handleOpenCreate = () => {
    setEditingExam(null);
    setTitle('');
    setSubjectId(subjects[0]?.id || '');
    setExamDate(new Date().toISOString().split('T')[0]);
    setExamTime('08:00');
    setDescription('');
    setTopicsInput('');
    setStatus('upcoming');
    setTeacherName('');
    setModalOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setTitle(exam.title);
    setSubjectId(exam.subject_id);
    setExamDate(exam.exam_date);
    setExamTime(exam.exam_time);
    setDescription(exam.description);
    setTopicsInput(exam.topics ? exam.topics.join('، ') : '');
    setStatus(exam.status);
    setTeacherName(exam.teacher_name || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) return;

    const topics = topicsInput
      .split(/[،,]/)
      .map((t) => t.trim())
      .filter(Boolean);

    db.saveExam({
      id: editingExam ? editingExam.id : undefined,
      title,
      subject_id: subjectId,
      exam_date: examDate,
      exam_time: examTime,
      description,
      topics,
      status,
      teacher_name: teacherName || undefined,
    });

    showToast(editingExam ? 'امتحان ویرایش شد.' : 'امتحان جدید به تقویم اضافه شد.', 'success');
    setModalOpen(false);
    refreshData();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    db.deleteExam(deleteTarget.id);
    showToast(`امتحان «${deleteTarget.title}» حذف شد.`, 'success');
    setDeleteTarget(null);
    refreshData();
  };

  return (
    <div className="space-y-6 animate-in fade-in text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <span>مدیریت تقویم امتحانات</span>
          </h1>
          <p className="text-slate-400 mt-1">زمان‌بندی امتحانات نوبت اول، کوئیزها، مباحث سوالات و تغییر وضعیت</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن آزمون جدید</span>
        </button>
      </div>

      {/* Exams Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allExams.map((exam) => {
          const sub = subjects.find((s) => s.id === exam.subject_id);

          return (
            <div
              key={exam.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: sub?.color || '#3b82f6' }}
                    />
                    <span className="font-bold text-slate-200">{sub?.name || 'عمومی'}</span>
                    {exam.teacher_name && (
                      <span className="text-slate-400">· دبیر: {exam.teacher_name}</span>
                    )}
                  </div>

                  <span
                    className={`font-semibold ${
                      exam.status === 'upcoming' ? 'text-cyan-400' : 'text-emerald-400'
                    }`}
                  >
                    {exam.status === 'upcoming' ? 'پیش‌رو' : 'برگزار شده'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2 leading-relaxed">{exam.title}</h3>
                <p className="text-slate-400 leading-relaxed mb-3">{exam.description}</p>

                {exam.topics && exam.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {exam.topics.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="flex items-center gap-3 text-slate-400">
                  <span>{formatPersianDateShort(exam.exam_date)}</span>
                  <span>ساعت {toPersianDigits(exam.exam_time)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(exam)}
                    className="p-1.5 hover:text-indigo-400 rounded-lg hover:bg-slate-800 text-slate-400"
                    title="ویرایش"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(exam)}
                    className="p-1.5 hover:text-rose-400 rounded-lg hover:bg-slate-800 text-slate-400"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingExam ? 'ویرایش امتحان' : 'افزودن امتحان جدید'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">درس مربوطه</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">عنوان آزمون</label>
                <input
                  type="text"
                  placeholder="مثال: آزمون میان‌ترم دوم فیزیک"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">تاریخ آزمون</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ساعت برگزاری</label>
                  <input
                    type="time"
                    value={examTime}
                    onChange={(e) => setExamTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">نام دبیر (اختیاری)</label>
                  <input
                    type="text"
                    placeholder="مثال: دکتر علوی"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">وضعیت آزمون</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="upcoming">پیش‌رو</option>
                    <option value="completed">برگزار شده</option>
                    <option value="cancelled">لغو شده</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  مباحث آزمون (با ویرگول جدا کنید)
                </label>
                <input
                  type="text"
                  placeholder="حرکت‌شناسی، نمودارهای سرعت-زمان، سقوط آزاد"
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">توضیحات تکمیلی و بارم</label>
                <textarea
                  rows={3}
                  placeholder="تعداد سوالات، بارم‌بندی و نکات ویژه آزمون..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
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
                  ذخیره آزمون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="حذف امتحان"
        message={`آیا از حذف آزمون «${deleteTarget?.title}» از تقویم کلاس اطمینان دارید؟`}
        confirmLabel="حذف آزمون"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
