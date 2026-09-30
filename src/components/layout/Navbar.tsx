/**
 * Public Navigation Bar adhering to the Top Bar Contract
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Search,
  Calendar,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Shield,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeView,
    navigate,
    theme,
    toggleTheme,
    settings,
    searchQuery,
    setSearchQuery,
    announcements,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadAnnouncements = announcements.filter((a) => a.is_published).length;

  const handleNavClick = (view: any) => {
    navigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNavClick({ type: 'home' })}
              className="flex items-center gap-2.5 text-right group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white block leading-none">
                  {settings.site_name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {settings.class_name}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Clean text navigation links (4-5 items) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <button
              onClick={() => handleNavClick({ type: 'home' })}
              className={`transition-colors py-1 ${
                activeView.type === 'home'
                  ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              صفحه اصلی
            </button>

            <button
              onClick={() => handleNavClick({ type: 'subjects' })}
              className={`transition-colors py-1 ${
                activeView.type === 'subjects' || activeView.type === 'subject'
                  ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              درس‌ها و جزوه‌ها
            </button>

            <button
              onClick={() => handleNavClick({ type: 'exams' })}
              className={`flex items-center gap-1.5 transition-colors py-1 ${
                activeView.type === 'exams'
                  ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>تقویم امتحانات</span>
            </button>

            <button
              onClick={() => handleNavClick({ type: 'announcements' })}
              className={`flex items-center gap-1.5 transition-colors py-1 ${
                activeView.type === 'announcements'
                  ? 'text-indigo-600 dark:text-cyan-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4 text-slate-400" />
              <span>اطلاعیه‌ها</span>
              {unreadAnnouncements > 0 && (
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              )}
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions (Search input + Theme toggle + Admin gateway) */}
          <div className="flex items-center gap-2.5">
            {/* Quick search input */}
            <div className="relative hidden sm:block w-48 lg:w-64">
              <input
                type="text"
                placeholder="جستجوی جزوه، درس..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Admin Portal Gateway */}
            <button
              onClick={() => handleNavClick({ type: 'admin', subView: 'dashboard' })}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span>پنل دبیر</span>
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="منوی موبایل"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg px-4 py-4 space-y-3">
          {/* Mobile Search */}
          <div className="relative w-full mb-3">
            <input
              type="text"
              placeholder="جستجوی عنوان جزوه یا مبحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
          </div>

          <div className="flex flex-col gap-1 text-sm font-medium">
            <button
              onClick={() => handleNavClick({ type: 'home' })}
              className="text-right px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              صفحه اصلی
            </button>
            <button
              onClick={() => handleNavClick({ type: 'subjects' })}
              className="text-right px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              درس‌ها و دسته‌بندی‌ها
            </button>
            <button
              onClick={() => handleNavClick({ type: 'exams' })}
              className="text-right px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              تقویم و برنامه امتحانات
            </button>
            <button
              onClick={() => handleNavClick({ type: 'announcements' })}
              className="text-right px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              اطلاعیه‌های کلاسی
            </button>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleNavClick({ type: 'admin', subView: 'dashboard' })}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium"
              >
                <Shield className="w-4 h-4" />
                <span>ورود به پنل مدیریت دبیر</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
