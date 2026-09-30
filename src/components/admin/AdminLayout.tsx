/**
 * Standalone Admin Portal Layout
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Files,
  FolderTree,
  Bell,
  Calendar,
  HardDrive,
  Settings,
  LogOut,
  ArrowRight,
  PlusCircle,
  Menu,
  X,
  Upload,
} from 'lucide-react';
import { AdminUploadModal } from './AdminUploadModal';

interface AdminLayoutProps {
  currentSubView: 'dashboard' | 'files' | 'subjects' | 'announcements' | 'exams' | 'storage' | 'settings';
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentSubView, children }) => {
  const { navigate, logoutAdmin, settings } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'داشبورد مدیریت', icon: LayoutDashboard },
    { id: 'files', label: 'مدیریت جزوه‌ها و فایل‌ها', icon: Files },
    { id: 'storage', label: 'مدیریت حافظه و دیسک', icon: HardDrive },
    { id: 'subjects', label: 'مدیریت درس‌ها', icon: FolderTree },
    { id: 'announcements', label: 'مدیریت اطلاعیه‌ها', icon: Bell },
    { id: 'exams', label: 'مدیریت امتحانات', icon: Calendar },
    { id: 'settings', label: 'تنظیمات سامانه', icon: Settings },
  ] as const;

  const handleSubNav = (sub: typeof navItems[number]['id']) => {
    navigate({ type: 'admin', subView: sub });
    setSidebarOpen(false);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl text-slate-300 hover:bg-slate-800"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="font-bold text-sm text-white">پنل مدیریت {settings.site_name}</span>
        <button
          onClick={() => navigate({ type: 'home' })}
          className="p-2 text-slate-400 hover:text-white"
          title="بازگشت به سایت"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Standalone Sidebar */}
      <aside
        className={`fixed md:sticky top-0 right-0 z-40 h-screen w-64 bg-slate-900/95 border-l border-slate-800 p-5 flex flex-col justify-between transition-transform duration-200 backdrop-blur-md ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Admin Header */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-cyan-400 tracking-wider block uppercase">
                کنترل پنل دبیر
              </span>
              <h2 className="text-base font-extrabold text-white mt-0.5">{settings.site_name}</h2>
            </div>
            <button
              onClick={() => navigate({ type: 'home' })}
              className="text-slate-400 hover:text-cyan-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
              title="مشاهده نمای دانش‌آموزی"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Upload Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-6 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>آپلود جزوه یا تصویر جدید</span>
          </button>

          {/* Nav Items */}
          <nav className="space-y-1 text-xs font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSubView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSubNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-right ${
                    isActive
                      ? 'bg-indigo-600/20 text-cyan-400 font-bold border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer with Logout */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={logoutAdmin}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از پنل مدیریت</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Upload Modal */}
      <AdminUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};
