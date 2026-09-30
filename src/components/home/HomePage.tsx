/**
 * Student-Facing Public Homepage
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { SubjectList } from '../subjects/SubjectList';
import { NoteCard } from '../notes/NoteCard';
import { AnnouncementBanner } from '../announcements/AnnouncementBanner';
import {
  Search,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  formatPersianDateShort,
  getExamCountdown,
  toPersianDigits,
} from '../../utils/persianDate';

export const HomePage: React.FC = () => {
  const {
    settings,
    searchQuery,
    setSearchQuery,
    files,
    subjects,
    exams,
    navigate,
    selectedSubjectFilter,
    setSelectedSubjectFilter,
  } = useApp();

  // Search Filtering
  const filteredNotes = files.filter((f) => {
    if (f.status !== 'published') return false;

    if (selectedSubjectFilter && f.subject_id !== selectedSubjectFilter) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const sub = subjects.find((s) => s.id === f.subject_id);

    return (
      f.title.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.original_filename.toLowerCase().includes(q) ||
      (sub && sub.name.toLowerCase().includes(q))
    );
  });

  const latestNotes = filteredNotes.slice(0, 9);
  const nearestExam = exams.upcoming[0];
  const examCountdown = nearestExam
    ? getExamCountdown(nearestExam.exam_date, nearestExam.exam_time)
    : null;
  const examSubject = nearestExam
    ? subjects.find((s) => s.id === nearestExam.subject_id)
    : null;

  return (
    <div className="space-y-12 pb-16 animate-in fade-in">
      {/* 1. Hero Section */}
      <section className="relative text-center pt-8 pb-10 sm:pt-14 sm:pb-16 max-w-4xl mx-auto px-4">
        {/* Class Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-indigo-600 dark:text-cyan-400 text-xs font-bold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>کتابخانه و مخزن دیجیتال {settings.class_name}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight sm:leading-tight mb-4 text-balance">
          جزوه‌های کلاس ما
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium max-w-2xl mx-auto mb-8 leading-relaxed">
          همه مطالب، تخته‌های هوشمند و جزوه‌های تدریس‌شده در کلاس؛ مرتب و همیشه در دسترس
        </p>

        {/* Prominent Search Bar */}
        <div className="relative max-w-2xl mx-auto shadow-2xl shadow-indigo-500/10 rounded-2xl">
          <input
            type="text"
            placeholder="جستجوی سریع در جزوه‌ها، عنوان مبحث، نام درس یا دبیر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-4.5 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-4 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              پاک کردن
            </button>
          )}
        </div>
      </section>

      {/* 2. Announcements Ticker / Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnnouncementBanner />
      </section>

      {/* 3. Nearest Exam Countdown Teaser (if upcoming exam exists) */}
      {nearestExam && examCountdown && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            onClick={() => navigate({ type: 'exams' })}
            className="group cursor-pointer p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-cyan-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {examSubject?.name || 'آزمون کلاسی'}
                  </span>
                  <span>·</span>
                  <span>{formatPersianDateShort(nearestExam.exam_date)}</span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {nearestExam.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-slate-400 block">زمان باقیمانده</span>
                <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                  {examCountdown.text}
                </span>
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </section>
      )}

      {/* 4. Subjects Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              درس‌ها و دسته‌بندی‌ها
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              برای دسترسی به تمام جزوه‌ها و دانلود یکجای بسته درس کلیک کنید
            </p>
          </div>

          <button
            onClick={() => navigate({ type: 'subjects' })}
            className="text-xs font-semibold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>مشاهده همه</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <SubjectList />
      </section>

      {/* 5. Recent Notes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {searchQuery ? `نتایج جستجو برای «${searchQuery}»` : 'آخرین جزوه‌ها و فایل‌های بارگذاری‌شده'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              جزوه‌های جلسات اخیر همراه با قابلیت مطالعه مستقیم درون سایت و دانلود رایگان
            </p>
          </div>

          {/* Interactive Subject Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
            <button
              onClick={() => setSelectedSubjectFilter(null)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
                selectedSubjectFilter === null
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              همه ({toPersianDigits(files.length)})
            </button>
            {subjects.map((sub) => {
              const count = files.filter((f) => f.subject_id === sub.id && f.status === 'published').length;
              if (count === 0) return null;

              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubjectFilter(sub.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
                    selectedSubjectFilter === sub.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {sub.name} ({toPersianDigits(count)})
                </button>
              );
            })}
          </div>
        </div>

        {/* Note Cards Grid */}
        {latestNotes.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              هیچ جزوه‌ای با این مشخصات یافت نشد
            </h3>
            <p className="text-xs text-slate-400">
              می‌توانید عبارت جستجو را تغییر دهید یا فیلتر دسته‌بندی را حذف نمایید.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
