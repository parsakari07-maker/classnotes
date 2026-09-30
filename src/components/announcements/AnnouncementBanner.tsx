/**
 * Announcements Display Banner and Full Announcements Hub
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Announcement } from '../../types';
import { Bell, Pin, AlertCircle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { formatPersianDate, formatPersianRelativeTime } from '../../utils/persianDate';

export const AnnouncementBanner: React.FC = () => {
  const { announcements, navigate } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  // Active published announcements, pinned first
  const activeAnnouncements = announcements.filter((a) => a.is_published);
  const pinnedOrUrgent = activeAnnouncements.filter((a) => a.is_pinned || a.priority === 'urgent');

  if (activeAnnouncements.length === 0) return null;

  const topAnnouncement = pinnedOrUrgent[0] || activeAnnouncements[0];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/40 via-slate-900/60 to-cyan-950/40 border border-indigo-500/20 dark:border-cyan-500/20 backdrop-blur-md p-4 sm:p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 dark:text-cyan-400 shrink-0 mt-0.5">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {topAnnouncement.is_pinned && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <Pin className="w-3 h-3 rotate-45" /> سنجاق شده
                </span>
              )}
              {topAnnouncement.priority === 'urgent' && (
                <span className="text-[11px] font-bold text-rose-400">● فوری و مهم</span>
              )}
              <span className="text-xs text-slate-400">
                {formatPersianRelativeTime(topAnnouncement.created_at)}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white mb-1.5 leading-snug">
              {topAnnouncement.title}
            </h3>

            {!collapsed && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                {topAnnouncement.content}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            title={collapsed ? 'گسترش' : 'جمع‌کردن'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => navigate({ type: 'announcements' })}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 py-1 px-2.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/50 transition-colors border border-cyan-800/40"
          >
            همه اطلاعیه‌ها ({activeAnnouncements.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export const AnnouncementsPage: React.FC = () => {
  const { announcements, navigate } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">اطلاعیه‌های کلاسی</h1>
          <p className="text-xs text-slate-500 mt-1">آخرین اخبار، تغییرات برنامه و یادآوری‌های مهم دبیران</p>
        </div>
        <button
          onClick={() => navigate({ type: 'home' })}
          className="text-xs font-medium text-indigo-600 dark:text-cyan-400 hover:underline"
        >
          بازگشت به خانه
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <Bell className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">در حال حاضر اطلاعیه‌ای ثبت نشده است</p>
          <p className="text-xs text-slate-400 mt-1">اطلاعیه‌های جدید به محض ثبت توسط دبیر در اینجا نمایش می‌یابد.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-5 rounded-2xl border transition-all ${
                ann.is_pinned
                  ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-xs mb-2">
                <div className="flex items-center gap-2">
                  {ann.is_pinned && (
                    <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                      <Pin className="w-3.5 h-3.5 rotate-45" /> سنجاق شده
                    </span>
                  )}
                  {ann.priority === 'urgent' && (
                    <span className="font-bold text-rose-500">فوری</span>
                  )}
                  {ann.priority === 'high' && (
                    <span className="font-bold text-amber-500">مهم</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatPersianDate(ann.created_at)}</span>
                </div>
              </div>

              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-relaxed">
                {ann.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
