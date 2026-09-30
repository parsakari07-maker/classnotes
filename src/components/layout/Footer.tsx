/**
 * Clean Educational Footer with stats, zero pseudo-telemetry tickers, and quiet admin access
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, Shield, Heart } from 'lucide-react';
import { toPersianDigits } from '../../utils/persianDate';

export const Footer: React.FC = () => {
  const { settings, subjects, files, navigate } = useApp();

  return (
    <footer className="relative z-10 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 mt-20 text-slate-500 dark:text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand Info */}
          <div className="flex items-center gap-3 text-center md:text-right">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-cyan-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{settings.site_name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                مخزن مرکزی جزوه‌ها و تخته‌های هوشمند {settings.class_name}
              </p>
            </div>
          </div>

          {/* Quick Stats overview without pill capsules */}
          <div className="flex items-center gap-5 text-slate-500 dark:text-slate-400">
            <span>{toPersianDigits(subjects.length)} درس فعال</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span>{toPersianDigits(files.length)} جزوه بارگذاری‌شده</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <button
              onClick={() => navigate({ type: 'admin', subView: 'dashboard' })}
              className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>پنل مدیریت</span>
            </button>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>طراحی‌شده برای تسهیل یادگیری کلاس</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>۱۴۰۵ - ۱۴۰۴</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
