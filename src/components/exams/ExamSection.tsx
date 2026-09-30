/**
 * Dedicated Exams Page & Widget Section (/exams)
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Exam } from '../../types';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Timer,
} from 'lucide-react';
import {
  formatPersianDate,
  formatPersianDateShort,
  getExamCountdown,
  toPersianDigits,
} from '../../utils/persianDate';

export const ExamSection: React.FC = () => {
  const { exams, subjects, navigate } = useApp();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const { upcoming, past } = exams;
  const currentList = activeTab === 'upcoming' ? upcoming : past;

  // Nearest upcoming exam for highlight countdown widget
  const nearestExam = upcoming[0];
  const countdown = nearestExam ? getExamCountdown(nearestExam.exam_date, nearestExam.exam_time) : null;
  const nearestSubject = nearestExam ? subjects.find((s) => s.id === nearestExam.subject_id) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">تقویم و برنامه امتحانات</h1>
          <p className="text-xs text-slate-500 mt-1">زمان‌بندی آزمون‌های کلاسی، نوبت اول، کوئیزها و بودجه‌بندی مباحث</p>
        </div>
        <button
          onClick={() => navigate({ type: 'home' })}
          className="text-xs font-medium text-indigo-600 dark:text-cyan-400 hover:underline self-start sm:self-auto"
        >
          بازگشت به خانه
        </button>
      </div>

      {/* Featured Nearest Exam Countdown Card */}
      {nearestExam && countdown && (
        <div className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
                  <Timer className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  نزدیک‌ترین آزمون پیش‌رو
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {nearestSubject?.name || ''}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white mb-2 leading-relaxed">
                {nearestExam.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {nearestExam.description}
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center shrink-0 min-w-[200px] backdrop-blur-sm">
              <span className="text-xs text-slate-400 block mb-1">زمان باقی‌مانده</span>
              <div className="text-lg font-black text-cyan-400 tracking-tight mb-2">
                {countdown.text}
              </div>
              <div className="text-[11px] text-slate-300 flex items-center justify-center gap-2 pt-2 border-t border-slate-700/60">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{formatPersianDateShort(nearestExam.exam_date)}</span>
                <span>·</span>
                <Clock className="w-3 h-3 text-slate-400" />
                <span>ساعت {toPersianDigits(nearestExam.exam_time)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'upcoming'
              ? 'border-indigo-600 text-indigo-600 dark:border-cyan-400 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          امتحانات پیش‌رو ({toPersianDigits(upcoming.length)})
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'past'
              ? 'border-indigo-600 text-indigo-600 dark:border-cyan-400 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          امتحانات برگزار شده ({toPersianDigits(past.length)})
        </button>
      </div>

      {/* Exam Cards List */}
      {currentList.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {activeTab === 'upcoming' ? 'امتحان پیش‌رویی در تقویم نیست.' : 'آزمون برگزار شده‌ای ثبت نشده است.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {currentList.map((exam) => {
            const sub = subjects.find((s) => s.id === exam.subject_id);
            const count = getExamCountdown(exam.exam_date, exam.exam_time);

            return (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top metadata line without pills */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: sub?.color || '#6366f1' }}
                      />
                      <span className="text-slate-800 dark:text-slate-200">{sub?.name || 'عمومی'}</span>
                      {exam.teacher_name && (
                        <>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                          <span>دبیر: {exam.teacher_name}</span>
                        </>
                      )}
                    </div>

                    {activeTab === 'upcoming' ? (
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold tabular-nums">
                        {count.text}
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> برگزار شد
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-relaxed">
                    {exam.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {exam.description}
                  </p>

                  {/* Topics List */}
                  {exam.topics && exam.topics.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">مباحث آزمون:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {exam.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Date & Time Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatPersianDate(exam.exam_date)}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>ساعت {toPersianDigits(exam.exam_time)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
