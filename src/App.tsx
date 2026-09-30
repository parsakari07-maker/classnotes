/**
 * Root Application Router & Component Orchestration
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { BackgroundAnimation } from './components/common/BackgroundAnimation';
import { ToastContainer } from './components/common/ToastContainer';
import { HomePage } from './components/home/HomePage';
import { SubjectsPage } from './components/subjects/SubjectsPage';
import { SubjectDetailView } from './components/subjects/SubjectDetailView';
import { NoteDetailsView } from './components/notes/NoteDetailsView';
import { ExamSection } from './components/exams/ExamSection';
import { AnnouncementsPage } from './components/announcements/AnnouncementBanner';
import { PdfViewerModal } from './components/notes/PdfViewerModal';
import { ImageViewerModal } from './components/notes/ImageViewerModal';

// Admin Components
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminFiles } from './components/admin/AdminFiles';
import { AdminStorage } from './components/admin/AdminStorage';
import { AdminSubjects } from './components/admin/AdminSubjects';
import { AdminAnnouncements } from './components/admin/AdminAnnouncements';
import { AdminExams } from './components/admin/AdminExams';
import { AdminSettings } from './components/admin/AdminSettings';

const AppContent: React.FC = () => {
  const { activeView, navigate, isAdminAuthenticated, mustChangePassword } = useApp();

  // Handle browser URL hash changes for deep linking (e.g. /#note-xyz or /#admin)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;

      if (hash === 'admin') {
        navigate({ type: 'admin', subView: 'dashboard' });
      } else if (hash === 'exams') {
        navigate({ type: 'exams' });
      } else if (hash === 'subjects') {
        navigate({ type: 'subjects' });
      } else if (hash === 'announcements') {
        navigate({ type: 'announcements' });
      } else if (hash.startsWith('subject-')) {
        const slug = hash.replace('subject-', '');
        navigate({ type: 'subject', slug });
      } else if (hash.startsWith('note-')) {
        const slug = hash.replace('note-', '');
        navigate({ type: 'note', slug });
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [navigate]);

  // Admin Routes Rendering
  if (activeView.type === 'admin') {
    if (!isAdminAuthenticated || mustChangePassword) {
      return (
        <>
          <AdminLogin />
          <ToastContainer />
        </>
      );
    }

    const subView = activeView.subView || 'dashboard';

    let contentNode = <AdminDashboard />;
    switch (subView) {
      case 'dashboard':
        contentNode = <AdminDashboard />;
        break;
      case 'files':
        contentNode = <AdminFiles />;
        break;
      case 'storage':
        contentNode = <AdminStorage />;
        break;
      case 'subjects':
        contentNode = <AdminSubjects />;
        break;
      case 'announcements':
        contentNode = <AdminAnnouncements />;
        break;
      case 'exams':
        contentNode = <AdminExams />;
        break;
      case 'settings':
        contentNode = <AdminSettings />;
        break;
      default:
        contentNode = <AdminDashboard />;
    }

    return (
      <AdminLayout currentSubView={subView}>
        {contentNode}
        <PdfViewerModal />
        <ImageViewerModal />
        <ToastContainer />
      </AdminLayout>
    );
  }

  // Public Student App Routes Rendering
  return (
    <div className="relative min-h-screen flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      {/* Subtle Animated Educational Background */}
      <BackgroundAnimation />

      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic Route Content */}
        <main className="flex-1">
          {activeView.type === 'home' && <HomePage />}
          {activeView.type === 'subjects' && <SubjectsPage />}
          {activeView.type === 'subject' && <SubjectDetailView slug={activeView.slug} />}
          {activeView.type === 'note' && <NoteDetailsView slug={activeView.slug} />}
          {activeView.type === 'exams' && <ExamSection />}
          {activeView.type === 'announcements' && <AnnouncementsPage />}
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Global Modals and Overlay Toasts */}
      <PdfViewerModal />
      <ImageViewerModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
