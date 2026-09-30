/**
 * Application Global State & Navigation Context
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ActiveView,
  Subject,
  NoteFile,
  Announcement,
  Exam,
  SiteSettings,
} from '../types';
import { db } from '../services/database';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
  // Navigation
  activeView: ActiveView;
  navigate: (view: ActiveView) => void;

  // Dark Mode
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Data
  subjects: Subject[];
  files: NoteFile[];
  announcements: Announcement[];
  exams: { upcoming: Exam[]; past: Exam[] };
  settings: SiteSettings;
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Search & Filtering
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedSubjectFilter: string | null;
  setSelectedSubjectFilter: (id: string | null) => void;

  // Modals & Viewers
  activePdfNote: NoteFile | null;
  openPdfViewer: (note: NoteFile) => void;
  closePdfViewer: () => void;
  activeImageNote: NoteFile | null;
  openImageViewer: (note: NoteFile) => void;
  closeImageViewer: () => void;

  // Admin Auth Session
  isAdminAuthenticated: boolean;
  mustChangePassword: boolean;
  loginAdmin: (password: string) => { success: boolean; mustChange?: boolean };
  logoutAdmin: () => void;
  changePassword: (oldP: string, newP: string) => { success: boolean; error?: string };

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'home' });
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [files, setFiles] = useState<NoteFile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [exams, setExams] = useState<{ upcoming: Exam[]; past: Exam[] }>({ upcoming: [], past: [] });
  const [settings, setSettings] = useState<SiteSettings>(db.getSettings());
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null);

  // Viewers
  const [activePdfNote, setActivePdfNote] = useState<NoteFile | null>(null);
  const [activeImageNote, setActiveImageNote] = useState<NoteFile | null>(null);

  // Admin Session
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('classnotes_admin_auth') === 'true';
  });
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(() => {
    return sessionStorage.getItem('classnotes_admin_must_change') === 'true';
  });

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Theme synchronization with document element
  useEffect(() => {
    const savedTheme = localStorage.getItem('classnotes_theme') as 'light' | 'dark';
    const initial = savedTheme || 'dark';
    setTheme(initial);
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('classnotes_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  const refreshData = useCallback(async () => {
    await db.init();
    setSubjects(db.getSubjects());
    setFiles(db.getPublishedFiles());
    setAnnouncements(db.getAnnouncements());
    setExams(db.getExams());
    setSettings(db.getSettings());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const navigate = useCallback((view: ActiveView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openPdfViewer = useCallback((note: NoteFile) => {
    setActivePdfNote(note);
    db.incrementDownload(note.id); // count view/preview
  }, []);

  const closePdfViewer = useCallback(() => {
    setActivePdfNote(null);
  }, []);

  const openImageViewer = useCallback((note: NoteFile) => {
    setActiveImageNote(note);
    db.incrementDownload(note.id);
  }, []);

  const closeImageViewer = useCallback(() => {
    setActiveImageNote(null);
  }, []);

  // Admin login
  const loginAdmin = useCallback((password: string) => {
    const res = db.verifyAdmin(password);
    if (res.valid) {
      setIsAdminAuthenticated(true);
      setMustChangePassword(Boolean(res.mustChangePassword));
      sessionStorage.setItem('classnotes_admin_auth', 'true');
      sessionStorage.setItem('classnotes_admin_must_change', String(Boolean(res.mustChangePassword)));
      return { success: true, mustChange: res.mustChangePassword };
    }
    return { success: false };
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdminAuthenticated(false);
    setMustChangePassword(false);
    sessionStorage.removeItem('classnotes_admin_auth');
    sessionStorage.removeItem('classnotes_admin_must_change');
    showToast('با موفقیت از پنل مدیریت خارج شدید.', 'info');
    navigate({ type: 'home' });
  }, [navigate, showToast]);

  const changePassword = useCallback((oldP: string, newP: string) => {
    const res = db.changeAdminPassword(oldP, newP);
    if (res.success) {
      setMustChangePassword(false);
      sessionStorage.setItem('classnotes_admin_must_change', 'false');
      showToast('رمز عبور مدیر با موفقیت به‌روزرسانی شد.', 'success');
    }
    return res;
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        activeView,
        navigate,
        theme,
        toggleTheme,
        subjects,
        files,
        announcements,
        exams,
        settings,
        isLoading,
        refreshData,
        searchQuery,
        setSearchQuery,
        selectedSubjectFilter,
        setSelectedSubjectFilter,
        activePdfNote,
        openPdfViewer,
        closePdfViewer,
        activeImageNote,
        openImageViewer,
        closeImageViewer,
        isAdminAuthenticated,
        mustChangePassword,
        loginAdmin,
        logoutAdmin,
        changePassword,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
