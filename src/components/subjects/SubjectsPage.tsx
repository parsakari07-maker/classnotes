/**
 * Public Subjects Index Page (/subjects)
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SubjectList } from './SubjectList';
import { Search, FolderTree, ArrowRight } from 'lucide-react';

export const SubjectsPage: React.FC = () => {
  const { navigate, subjects } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <FolderTree className="w-7 h-7 text-indigo-500" />
            <span>درس‌ها و دسته‌بندی‌های کلاسی</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            انتخاب درس جهت مشاهده تمامی جزوه‌ها، تصاویر تخته و دانلود یکجای بسته آموزشی
          </p>
        </div>

        <button
          onClick={() => navigate({ type: 'home' })}
          className="text-xs font-semibold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به صفحه اصلی</span>
        </button>
      </div>

      <SubjectList />
    </div>
  );
};
