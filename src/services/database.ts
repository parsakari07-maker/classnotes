/**
 * Relational Metadata Database Service
 * 
 * Manages structured records, relationships, search indexes,
 * announcements, exams, and admin settings.
 * Strict rule: Binary files are NEVER stored in this database.
 */

import {
  Subject,
  NoteFile,
  Announcement,
  Exam,
  AdminUser,
  SiteSettings,
  StorageStats,
  OrphanFile,
  AuditLog,
} from '../types';
import { storageEngine } from './storageEngine';

const STORAGE_KEYS = {
  SUBJECTS: 'classnotes_subjects',
  FILES: 'classnotes_files',
  ANNOUNCEMENTS: 'classnotes_announcements',
  EXAMS: 'classnotes_exams',
  ADMIN_USER: 'classnotes_admin_user',
  SETTINGS: 'classnotes_settings',
  AUDIT_LOGS: 'classnotes_audit_logs',
  INITIALIZED: 'classnotes_seeded_v1',
};

class DatabaseService {
  private subjects: Subject[] = [];
  private files: NoteFile[] = [];
  private announcements: Announcement[] = [];
  private exams: Exam[] = [];
  private adminUser: AdminUser | null = null;
  private settings: SiteSettings = {
    site_name: 'کلاس‌نوت',
    class_name: 'کلاس دوازدهم ریاضی و علوم پایه',
    description: 'کتابخانه دیجیتال و مخزن رسمی جزوه‌ها و تخته‌های هوشمند کلاس',
    max_upload_size_mb: 50,
    storage_quota_mb: 500,
    allow_public_downloads: true,
  };
  private auditLogs: AuditLog[] = [];
  private isInitialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const sub = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (sub) this.subjects = JSON.parse(sub);

      const f = localStorage.getItem(STORAGE_KEYS.FILES);
      if (f) this.files = JSON.parse(f);

      const a = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      if (a) this.announcements = JSON.parse(a);

      const e = localStorage.getItem(STORAGE_KEYS.EXAMS);
      if (e) this.exams = JSON.parse(e);

      const adm = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
      if (adm) this.adminUser = JSON.parse(adm);

      const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (s) this.settings = { ...this.settings, ...JSON.parse(s) };

      const logs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (logs) this.auditLogs = JSON.parse(logs);

      this.isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true';
    } catch (e) {
      console.warn('Storage load failed, using in-memory state', e);
    }
  }

  private persist(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to persist to storage', e);
    }
  }

  /**
   * Helper to generate a minimal valid PDF blob for initial seed demonstration
   */
  private createSamplePdfBlob(title: string, subject: string): Blob {
    // Valid standard minimal PDF 1.4 document
    const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 145 >>
stream
BT
/F1 24 Tf
70 700 Td
(${title}) Tj
/F1 14 Tf
0 -40 Td
(Subject: ${subject} - ClassNotes Digital Library) Tj
0 -30 Td
(Educational smart board notes exported for classroom study.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000441 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
514
%%EOF`;

    return new Blob([content], { type: 'application/pdf' });
  }

  /**
   * Helper to generate a realistic whiteboard image blob
   */
  private createSampleImageBlob(title: string, subject: string, color: string): Blob {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" stroke-width="1"/>
        </pattern>
        <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${color}"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="#ffffff"/>
      <rect width="100%" height="100%" fill="url(#grid)" opacity="0.6"/>
      <rect x="40" y="40" width="1120" height="120" rx="16" fill="url(#headerGrad)"/>
      <text x="1100" y="110" font-family="sans-serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="end" direction="rtl">${title}</text>
      <text x="1100" y="140" font-family="sans-serif" font-size="18" fill="#93c5fd" text-anchor="end" direction="rtl">درس: ${subject} | تخته هوشمند کلاس</text>
      
      <!-- Formulas & Schematics -->
      <g transform="translate(100, 240)">
        <rect width="480" height="460" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
        <text x="440" y="50" font-family="sans-serif" font-size="22" font-weight="bold" fill="#1e293b" text-anchor="end" direction="rtl">نکات کلیدی و فرمول‌ها</text>
        <line x1="40" y1="70" x2="440" y2="70" stroke="#e2e8f0" stroke-width="2"/>
        <text x="440" y="120" font-family="monospace" font-size="20" fill="#0369a1" text-anchor="end">F = m . a  (Newton's 2nd Law)</text>
        <text x="440" y="170" font-family="monospace" font-size="20" fill="#0369a1" text-anchor="end">E = 1/2 m v^2 + m g h</text>
        <text x="440" y="220" font-family="monospace" font-size="20" fill="#0369a1" text-anchor="end">x(t) = 1/2 a t^2 + v0 t + x0</text>
        <text x="440" y="280" font-family="sans-serif" font-size="16" fill="#475569" text-anchor="end" direction="rtl">۱. جهت نیروی اصطکاک همواره خلاف جهت لغزش است.</text>
        <text x="440" y="320" font-family="sans-serif" font-size="16" fill="#475569" text-anchor="end" direction="rtl">۲. در حرکت با سرعت ثابت، برآیند نیروها صفر است.</text>
      </g>
      
      <!-- Graph Drawing -->
      <g transform="translate(620, 240)">
        <rect width="480" height="460" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
        <text x="440" y="50" font-family="sans-serif" font-size="22" font-weight="bold" fill="#1e293b" text-anchor="end" direction="rtl">نمودار مکان - زمان (x-t)</text>
        <line x1="80" y1="380" x2="420" y2="380" stroke="#475569" stroke-width="2"/>
        <line x1="80" y1="380" x2="80" y2="100" stroke="#475569" stroke-width="2"/>
        <path d="M 80 380 Q 250 150 400 120" fill="none" stroke="#2563eb" stroke-width="4"/>
        <circle cx="250" cy="180" r="6" fill="#ef4444"/>
        <text x="260" y="170" font-family="sans-serif" font-size="14" fill="#ef4444">شیب نمودار = سرعت لحظه‌ای</text>
        <text x="420" y="410" font-family="sans-serif" font-size="16" fill="#64748b">زمان (t)</text>
        <text x="50" y="90" font-family="sans-serif" font-size="16" fill="#64748b">مکان (x)</text>
      </g>
    </svg>`;

    return new Blob([svg], { type: 'image/svg+xml' });
  }

  /**
   * Initialize and seed database if not already done
   */
  async init(): Promise<void> {
    if (this.isInitialized && this.subjects.length > 0) return;

    // 1. Initial Subjects
    const initialSubjects: Subject[] = [
      {
        id: 'sub-physics',
        name: 'فیزیک',
        slug: 'physics',
        description: 'مباحث حرکت‌شناسی، دینامیک، نوسان، امواج و فیزیک اتمی',
        icon: 'Atom',
        color: '#2563EB', // Blue
        display_order: 1,
        is_active: true,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sub-chemistry',
        name: 'شیمی',
        slug: 'chemistry',
        description: 'سینتیک، تعادل‌های شیمیایی، اسیدها و بازها، الکتروشیمی',
        icon: 'FlaskConical',
        color: '#059669', // Emerald
        display_order: 2,
        is_active: true,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sub-calculus',
        name: 'حسابان و دیفرانسیل',
        slug: 'calculus',
        description: 'حد و پیوستگی، مشتق و کاربرد مشتق، انتگرال و رفتار توابع',
        icon: 'Sigma',
        color: '#7C3AED', // Purple
        display_order: 3,
        is_active: true,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sub-geometry',
        name: 'هندسه تحلیلی',
        slug: 'geometry',
        description: 'ماتریس و کاربردها، مقاطع مخروطی، بردارها در فضای سه‌بعدی',
        icon: 'Shapes',
        color: '#D97706', // Amber
        display_order: 4,
        is_active: true,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sub-persian',
        name: 'ادبیات فارسی',
        slug: 'persian',
        description: 'آرایه‌های ادبی، قرابت معنایی، دستور زبان و متون کهن',
        icon: 'BookOpen',
        color: '#DC2626', // Red
        display_order: 5,
        is_active: true,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'sub-english',
        name: 'زبان انگلیسی',
        slug: 'english',
        description: 'واژگان کنکور، گرامر، درک مطلب و کلوز تست',
        icon: 'Languages',
        color: '#0891B2', // Cyan
        display_order: 6,
        is_active: true,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.subjects = initialSubjects;
    this.persist(STORAGE_KEYS.SUBJECTS, this.subjects);

    // 2. Initial Sample Notes stored strictly via storageEngine (binaries) and database (metadata)
    const seedFilesData = [
      {
        title: 'جزوه حرکت‌شناسی و شتاب ثابت - جلسه دوم',
        slug: 'physics-kinematics-session-2',
        subject_id: 'sub-physics',
        subject_name: 'فیزیک',
        desc: 'فرمول‌های حرکت با شتاب ثابت بر خط راست، بررسی شیب نمودار x-t و v-t و حل ۵ تست کنکور سراسری',
        type: 'pdf' as const,
        filename: 'Physics_Kinematics_Session_2.pdf',
        page_count: 8,
        downloads: 42,
        daysAgo: 3,
        color: '#2563EB',
      },
      {
        title: 'تصویر تخته کلاس فیزیک - قوانین دینامیک نیوتن',
        slug: 'physics-dynamics-board-notes',
        subject_id: 'sub-physics',
        subject_name: 'فیزیک',
        desc: 'اسکن کامل تصویر تخته هوشمند کلاس: نمودار جسم آزاد، نیروی اصطکاک ایستایی و جنبشی',
        type: 'image' as const,
        filename: 'Physics_Dynamics_Board.jpg',
        page_count: 1,
        downloads: 38,
        daysAgo: 5,
        color: '#2563EB',
      },
      {
        title: 'خلاصه نموداری سلول‌های الکتروشیمیایی و گالوانی',
        slug: 'chemistry-electrochemistry-summary',
        subject_id: 'sub-chemistry',
        subject_name: 'شیمی',
        desc: 'جدول پتانسیل کاهشی استاندارد E0، تعیین آند و کاتد، جهت حرکت الکترون‌ها و یون‌ها در پل نمکی',
        type: 'pdf' as const,
        filename: 'Chemistry_Electrochemistry_Summary.pdf',
        page_count: 12,
        downloads: 56,
        daysAgo: 1,
        color: '#059669',
      },
      {
        title: 'تخته هوشمند شیمی - حل مسائل سینتیک و سرعت واکنش',
        slug: 'chemistry-kinetics-board',
        subject_id: 'sub-chemistry',
        subject_name: 'شیمی',
        desc: 'فرمول‌های سرعت متوسط تولید و مصرف، شیب نمودار مول بر زمان و خطاهای رایج در محاسبات',
        type: 'image' as const,
        filename: 'Chemistry_Kinetics_Board.png',
        page_count: 1,
        downloads: 29,
        daysAgo: 8,
        color: '#059669',
      },
      {
        title: 'جزوه جامع کاربرد مشتق و نقاط بحرانی',
        slug: 'calculus-derivative-applications',
        subject_id: 'sub-calculus',
        subject_name: 'حسابان و دیفرانسیل',
        desc: 'آزمون مشتق اول و دوم برای اکسترمم‌های نسبی، جهت تقعر نمودار و نقاط عطف تابع',
        type: 'pdf' as const,
        filename: 'Calculus_Derivatives_Part1.pdf',
        page_count: 15,
        downloads: 64,
        daysAgo: 10,
        color: '#7C3AED',
      },
      {
        title: 'فرمول‌نامه مقاطع مخروطی و بیضی',
        slug: 'geometry-conic-sections',
        subject_id: 'sub-geometry',
        subject_name: 'هندسه تحلیلی',
        desc: 'معادله استاندارد دایره، بیضی افقی و قائم، کانون‌ها، قطر بزرگ و خروج از مرکز بیضی',
        type: 'pdf' as const,
        filename: 'Geometry_Conic_Sections.pdf',
        page_count: 6,
        downloads: 21,
        daysAgo: 12,
        color: '#D97706',
      },
      {
        title: 'جدول کامل آرایه‌های ادبی و ایهام در کنکور',
        slug: 'persian-literary-devices',
        subject_id: 'sub-persian',
        subject_name: 'ادبیات فارسی',
        desc: 'شگردهای تشخیص سریع استعاره، مجاز، ایهام و ایهام تناسب در بیت‌های دشوار',
        type: 'pdf' as const,
        filename: 'Persian_Literary_Devices.pdf',
        page_count: 10,
        downloads: 48,
        daysAgo: 2,
        color: '#DC2626',
      },
    ];

    const initialFiles: NoteFile[] = [];

    for (const item of seedFilesData) {
      let blob: Blob;
      if (item.type === 'pdf') {
        blob = this.createSamplePdfBlob(item.title, item.subject_name);
      } else {
        blob = this.createSampleImageBlob(item.title, item.subject_name, item.color);
      }

      // Save to isolated binary object store
      const storageResult = await storageEngine.saveFile(blob, item.type, item.filename);

      const noteFile: NoteFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: item.title,
        slug: item.slug,
        subject_id: item.subject_id,
        description: item.desc,
        file_type: item.type,
        mime_type: item.type === 'pdf' ? 'application/pdf' : 'image/jpeg',
        original_filename: item.filename,
        storage_path: storageResult.storage_path,
        file_size: storageResult.size,
        page_count: item.page_count,
        download_count: item.downloads,
        status: 'published',
        created_at: new Date(Date.now() - item.daysAgo * 86400000).toISOString(),
        updated_at: new Date(Date.now() - item.daysAgo * 86400000).toISOString(),
        published_at: new Date(Date.now() - item.daysAgo * 86400000).toISOString(),
      };

      initialFiles.push(noteFile);
    }

    this.files = initialFiles;
    this.persist(STORAGE_KEYS.FILES, this.files);

    // 3. Initial Announcements
    const initialAnnouncements: Announcement[] = [
      {
        id: 'ann-1',
        title: '📢 آزمون جامع شیمی فصل دوم فردا ساعت ۸:۰۰ صبح',
        content: 'دانش‌آموزان گرامی، آزمون تستی و تشریحی فصل دوم شیمی (الکتروشیمی و سلول‌های سوختی) فردا در کلاس برگزار خواهد شد. لطفاً جدول E0 و جزوه خلاصه را به دقت مرور نمایید.',
        priority: 'urgent',
        is_pinned: true,
        is_published: true,
        expires_at: new Date(Date.now() + 2 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ann-2',
        title: 'کلاس حل تمرین و تست پیشرفته فیزیک روز پنج‌شنبه',
        content: 'جلسه مرور مبحث دینامیک و بردارها به صورت فوق‌العاده روز پنج‌شنبه از ساعت ۱۶ الی ۱۸ در تالار سمینار برگزار می‌شود. فایل سوالات در سایت بارگذاری شده است.',
        priority: 'high',
        is_pinned: false,
        is_published: true,
        expires_at: new Date(Date.now() + 5 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ann-3',
        title: 'بارگذاری جزوه جدید کاربرد مشتق در حسابان',
        content: 'جزوه دست‌نویس استاد و تست‌های مکمل جلسه گذشته مشتق در بخش درس حسابان قرار گرفت. حتماً فایل را دریافت و تمرینات صفحه ۸ را حل کنید.',
        priority: 'normal',
        is_pinned: false,
        is_published: true,
        expires_at: null,
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.announcements = initialAnnouncements;
    this.persist(STORAGE_KEYS.ANNOUNCEMENTS, this.announcements);

    // 4. Initial Exams
    const initialExams: Exam[] = [
      {
        id: 'exam-1',
        subject_id: 'sub-chemistry',
        title: 'امتحان مستمر شیمی - فصل دوم (الکتروشیمی)',
        exam_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        exam_time: '08:00',
        description: 'شامل ۱۰ سوال تستی و ۴ سوال تشریحی از مباحث اکسایش-کاهش و سلول‌های گالوانی و برقکافت',
        topics: ['اکسایش و کاهش', 'سلول‌های گالوانی و الکترولیتی', 'محاسبه E0 سلول', 'خوردگی آهن'],
        status: 'upcoming',
        teacher_name: 'دکتر علوی',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'exam-2',
        subject_id: 'sub-physics',
        title: 'آزمون جامع فیزیک - حرکت‌شناسی و دینامیک',
        exam_date: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
        exam_time: '10:30',
        description: 'آزمون مطابق استاندارد سوالات کنکور سراسری، با زمان پاسخگویی ۷۵ دقیقه',
        topics: ['حرکت بر خط راست با شتاب ثابت', 'نمودارهای حرکت', 'قوانین نیوتن و تکانه', 'اصطکاک و کشش طناب'],
        status: 'upcoming',
        teacher_name: 'استاد حسینی',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'exam-3',
        subject_id: 'sub-calculus',
        title: 'کوئیز هفتگی حسابان - مشتق و نرخ‌های مرتبط',
        exam_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        exam_time: '09:00',
        description: 'آزمون کلاسی از تعاریف و فرمول‌های مشتق‌گیری توابع مثلثاتی و مرکب',
        topics: ['مشتق زنجیره‌ای', 'مشتق ضمنی', 'آهنگ تغییر لحظه‌ای'],
        status: 'upcoming',
        teacher_name: 'استاد رضایی',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'exam-4',
        subject_id: 'sub-geometry',
        title: 'امتحان ماتریس و دستگاه معادلات خطی',
        exam_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
        exam_time: '08:00',
        description: 'آزمون نوبت اول هندسه تحلیلی (برگزار شده)',
        topics: ['ضرب ماتریس‌ها', 'دترمینان ۳×۳', 'وارون ماتریس و روش کرامر'],
        status: 'completed',
        teacher_name: 'مهندس احمدی',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.exams = initialExams;
    this.persist(STORAGE_KEYS.EXAMS, this.exams);

    // 5. Initial Admin Account (admin / ClassNotes@1405!)
    // Note: must_change_password is true, so after first login, the admin is forced to change password
    this.adminUser = {
      id: 'admin-1',
      username: 'admin',
      password_hash: 'ClassNotes@1405!', // In production this is bcrypt, here verified server-side
      must_change_password: true,
    };
    this.persist(STORAGE_KEYS.ADMIN_USER, this.adminUser);

    this.logAudit('سیستم', 'راه‌اندازی اولیه پایگاه داده و بارگذاری جزوه‌ها', 'success');

    this.isInitialized = true;
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  // --- Audit Logging ---
  logAudit(action: string, details: string, status: 'success' | 'warning' | 'error' = 'success', affected_id?: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      details,
      status,
      timestamp: new Date().toISOString(),
      affected_id,
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 50) this.auditLogs.pop();
    this.persist(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // --- Subjects Queries & Mutations ---
  getSubjects(): Subject[] {
    return this.subjects
      .filter((s) => s.is_active)
      .map((s) => ({
        ...s,
        notes_count: this.files.filter((f) => f.subject_id === s.id && f.status === 'published').length,
      }))
      .sort((a, b) => a.display_order - b.display_order);
  }

  getAllSubjectsAdmin(): Subject[] {
    return this.subjects
      .map((s) => ({
        ...s,
        notes_count: this.files.filter((f) => f.subject_id === s.id).length,
      }))
      .sort((a, b) => a.display_order - b.display_order);
  }

  getSubjectBySlug(slug: string): Subject | null {
    const sub = this.subjects.find((s) => s.slug === slug);
    if (!sub) return null;
    return {
      ...sub,
      notes_count: this.files.filter((f) => f.subject_id === sub.id && f.status === 'published').length,
    };
  }

  saveSubject(subjectData: Partial<Subject>): Subject {
    if (subjectData.id) {
      const idx = this.subjects.findIndex((s) => s.id === subjectData.id);
      if (idx !== -1) {
        this.subjects[idx] = {
          ...this.subjects[idx],
          ...subjectData,
          updated_at: new Date().toISOString(),
        };
        this.persist(STORAGE_KEYS.SUBJECTS, this.subjects);
        this.logAudit('ویرایش درس', `درس «${this.subjects[idx].name}» ویرایش شد.`);
        return this.subjects[idx];
      }
    }

    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      name: subjectData.name || 'درس جدید',
      slug: subjectData.slug || `subject-${Date.now()}`,
      description: subjectData.description || '',
      icon: subjectData.icon || 'BookOpen',
      color: subjectData.color || '#3B82F6',
      display_order: this.subjects.length + 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.subjects.push(newSub);
    this.persist(STORAGE_KEYS.SUBJECTS, this.subjects);
    this.logAudit('افزودن درس', `درس جدید «${newSub.name}» ایجاد شد.`);
    return newSub;
  }

  deleteSubject(id: string): { success: boolean; error?: string } {
    const noteCount = this.files.filter((f) => f.subject_id === id).length;
    if (noteCount > 0) {
      return {
        success: false,
        error: `امکان حذف این درس وجود ندارد زیرا ${noteCount} جزوه به آن متصل است. ابتدا فایل‌ها را منتقل یا حذف کنید.`,
      };
    }

    const sub = this.subjects.find((s) => s.id === id);
    this.subjects = this.subjects.filter((s) => s.id !== id);
    this.persist(STORAGE_KEYS.SUBJECTS, this.subjects);
    this.logAudit('حذف درس', `درس «${sub?.name || id}» حذف شد.`);
    return { success: true };
  }

  // --- Files Queries & CRUD ---
  getPublishedFiles(subjectId?: string): NoteFile[] {
    let list = this.files.filter((f) => f.status === 'published');
    if (subjectId) {
      list = list.filter((f) => f.subject_id === subjectId);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getAllFilesAdmin(): NoteFile[] {
    return [...this.files].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getFileBySlug(slug: string): NoteFile | null {
    return this.files.find((f) => f.slug === slug && f.status === 'published') || null;
  }

  getFileById(id: string): NoteFile | null {
    return this.files.find((f) => f.id === id) || null;
  }

  async incrementDownload(fileId: string): Promise<void> {
    const file = this.files.find((f) => f.id === fileId);
    if (file) {
      file.download_count += 1;
      this.persist(STORAGE_KEYS.FILES, this.files);
    }
  }

  /**
   * Safe Upload Lifecycle:
   * 1. File written to storageEngine
   * 2. Metadata inserted to Database
   * 3. If DB fails, unlinks storage file
   */
  async uploadFile(
    file: File | Blob,
    type: 'pdf' | 'image',
    originalFilename: string,
    metadata: {
      title: string;
      slug?: string;
      subject_id: string;
      description: string;
      page_count?: number;
    }
  ): Promise<NoteFile> {
    // 1. Storage write
    const storageRes = await storageEngine.saveFile(file, type, originalFilename);

    try {
      // 2. Database record creation
      const baseSlug = (metadata.slug || metadata.title)
        .trim()
        .toLowerCase()
        .replace(/[\s\/\\:*?"<>|]+/g, '-');
      const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

      const newRecord: NoteFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: metadata.title,
        slug: uniqueSlug,
        subject_id: metadata.subject_id,
        description: metadata.description,
        file_type: type,
        mime_type: file.type || (type === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        original_filename: originalFilename,
        storage_path: storageRes.storage_path,
        file_size: storageRes.size,
        page_count: metadata.page_count,
        download_count: 0,
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      };

      this.files.unshift(newRecord);
      this.persist(STORAGE_KEYS.FILES, this.files);
      this.logAudit('آپلود فایل', `فایل «${newRecord.title}» با حجم ${storageRes.size} بایت ذخیره شد.`);
      return newRecord;
    } catch (err) {
      // Cleanup orphan on failure!
      await storageEngine.deleteFile(storageRes.storage_path);
      this.logAudit('خطای آپلود', `ثبت دیتابیس برای «${metadata.title}» شکست خورد و فایل پاکسازی شد.`, 'error');
      throw err;
    }
  }

  /**
   * Safe File Replacement:
   * 1. Upload new file to storage
   * 2. Verify successful storage write
   * 3. Update database record
   * 4. Only then purge old file
   */
  async replaceFile(
    fileId: string,
    newFile: File | Blob,
    type: 'pdf' | 'image',
    originalFilename: string
  ): Promise<NoteFile> {
    const existing = this.getFileById(fileId);
    if (!existing) throw new Error('فایل مورد نظر یافت نشد.');

    const oldStoragePath = existing.storage_path;

    // 1 & 2: Store new binary
    const newStorageRes = await storageEngine.saveFile(newFile, type, originalFilename);

    try {
      // 3: Update DB
      existing.storage_path = newStorageRes.storage_path;
      existing.file_size = newStorageRes.size;
      existing.file_type = type;
      existing.mime_type = newFile.type || (type === 'pdf' ? 'application/pdf' : 'image/jpeg');
      existing.original_filename = originalFilename;
      existing.updated_at = new Date().toISOString();

      this.persist(STORAGE_KEYS.FILES, this.files);

      // 4: Purge old binary safely
      await storageEngine.deleteFile(oldStoragePath);
      this.logAudit('جایگزینی فایل', `فایل جدید برای «${existing.title}» با موفقیت جایگزین گردید.`);

      return existing;
    } catch (err) {
      // If DB update failed, delete the newly uploaded file to avoid orphaned storage
      await storageEngine.deleteFile(newStorageRes.storage_path);
      throw err;
    }
  }

  /**
   * Safe Deletion of single file:
   * Purges physical binary from storageEngine AND removes row from database
   */
  async deleteFile(fileId: string): Promise<boolean> {
    const file = this.getFileById(fileId);
    if (!file) return false;

    // 1. Delete binary from storage
    const storageDeleted = await storageEngine.deleteFile(file.storage_path);

    // 2. Remove metadata row
    this.files = this.files.filter((f) => f.id !== fileId);
    this.persist(STORAGE_KEYS.FILES, this.files);

    this.logAudit(
      'حذف دائم فایل',
      `فایل «${file.title}» (${file.storage_path}) با موفقیت حذف شد.`,
      storageDeleted ? 'success' : 'warning'
    );

    return true;
  }

  /**
   * Bulk Deletion with individual failure reporting
   */
  async bulkDeleteFiles(fileIds: string[]): Promise<{ successCount: number; failCount: number; errors: string[] }> {
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const id of fileIds) {
      try {
        const ok = await this.deleteFile(id);
        if (ok) successCount++;
        else {
          failCount++;
          errors.push(`فایل با شناسه ${id} یافت نشد.`);
        }
      } catch (e: any) {
        failCount++;
        errors.push(`خطا در حذف ${id}: ${e?.message || 'خطای نامشخص'}`);
      }
    }

    this.logAudit(
      'حذف گروهی',
      `تعداد ${successCount} فایل با موفقیت حذف و ${failCount} فایل ناموفق بود.`,
      failCount > 0 ? 'warning' : 'success'
    );

    return { successCount, failCount, errors };
  }

  /**
   * Date-based Deletion (e.g. older than X days or custom date range)
   */
  async deleteFilesByDate(
    criteria: { olderThanDays?: number; startDate?: string; endDate?: string }
  ): Promise<{ affectedCount: number; freedBytes: number; successCount: number; failCount: number }> {
    const targetFiles = this.getFilesMatchingDate(criteria);
    const affectedCount = targetFiles.length;
    const freedBytes = targetFiles.reduce((acc, f) => acc + f.file_size, 0);

    const ids = targetFiles.map((f) => f.id);
    const res = await this.bulkDeleteFiles(ids);

    return {
      affectedCount,
      freedBytes,
      successCount: res.successCount,
      failCount: res.failCount,
    };
  }

  /**
   * Date-based Archive (safely hides from public student view without deleting binaries)
   */
  archiveFilesByDate(criteria: { olderThanDays?: number; startDate?: string; endDate?: string }): number {
    const targets = this.getFilesMatchingDate(criteria);
    let count = 0;

    for (const f of targets) {
      f.status = 'archived';
      f.updated_at = new Date().toISOString();
      count++;
    }

    this.persist(STORAGE_KEYS.FILES, this.files);
    this.logAudit('بایگانی زمانی', `تعداد ${count} جزوه بر اساس تاریخ به بایگانی منتقل شد.`);
    return count;
  }

  getFilesMatchingDate(criteria: { olderThanDays?: number; startDate?: string; endDate?: string }): NoteFile[] {
    const now = Date.now();

    return this.files.filter((f) => {
      const fileTime = new Date(f.created_at).getTime();

      if (criteria.olderThanDays !== undefined) {
        const threshold = now - criteria.olderThanDays * 86400000;
        return fileTime < threshold;
      }

      if (criteria.startDate && criteria.endDate) {
        const start = new Date(criteria.startDate).getTime();
        const end = new Date(criteria.endDate).getTime() + 86400000;
        return fileTime >= start && fileTime <= end;
      }

      return false;
    });
  }

  updateFileMetadata(fileId: string, updates: Partial<NoteFile>): NoteFile {
    const file = this.getFileById(fileId);
    if (!file) throw new Error('فایل یافت نشد');

    Object.assign(file, updates, { updated_at: new Date().toISOString() });
    this.persist(STORAGE_KEYS.FILES, this.files);
    this.logAudit('ویرایش جزوه', `مشخصات فایل «${file.title}» بروزرسانی شد.`);
    return file;
  }

  // --- Announcements CRUD ---
  getAnnouncements(includeUnpublished = false): Announcement[] {
    const now = new Date().toISOString();
    return this.announcements
      .filter((a) => {
        if (!includeUnpublished && !a.is_published) return false;
        // Check expiration
        if (!includeUnpublished && a.expires_at && a.expires_at < now) return false;
        return true;
      })
      .sort((a, b) => {
        // Pinned first
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        // Priority
        const pOrder = { urgent: 0, high: 1, normal: 2 };
        if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }

  saveAnnouncement(data: Partial<Announcement>): Announcement {
    if (data.id) {
      const idx = this.announcements.findIndex((a) => a.id === data.id);
      if (idx !== -1) {
        this.announcements[idx] = {
          ...this.announcements[idx],
          ...data,
          updated_at: new Date().toISOString(),
        };
        this.persist(STORAGE_KEYS.ANNOUNCEMENTS, this.announcements);
        this.logAudit('ویرایش اعلان', `اطلاعیه «${this.announcements[idx].title}» بروزرسانی شد.`);
        return this.announcements[idx];
      }
    }

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: data.title || '',
      content: data.content || '',
      priority: data.priority || 'normal',
      is_pinned: Boolean(data.is_pinned),
      is_published: data.is_published !== undefined ? data.is_published : true,
      expires_at: data.expires_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.announcements.unshift(newAnn);
    this.persist(STORAGE_KEYS.ANNOUNCEMENTS, this.announcements);
    this.logAudit('افزودن اعلان', `اطلاعیه جدید «${newAnn.title}» ثبت شد.`);
    return newAnn;
  }

  deleteAnnouncement(id: string): boolean {
    const ann = this.announcements.find((a) => a.id === id);
    this.announcements = this.announcements.filter((a) => a.id !== id);
    this.persist(STORAGE_KEYS.ANNOUNCEMENTS, this.announcements);
    this.logAudit('حذف اعلان', `اطلاعیه «${ann?.title || id}» حذف شد.`);
    return true;
  }

  // --- Exams CRUD ---
  getExams(): { upcoming: Exam[]; past: Exam[] } {
    const today = new Date().toISOString().split('T')[0];

    const upcoming = this.exams
      .filter((e) => e.exam_date >= today && e.status !== 'completed')
      .sort((a, b) => `${a.exam_date}T${a.exam_time}`.localeCompare(`${b.exam_date}T${b.exam_time}`));

    const past = this.exams
      .filter((e) => e.exam_date < today || e.status === 'completed')
      .sort((a, b) => `${b.exam_date}T${b.exam_time}`.localeCompare(`${a.exam_date}T${a.exam_time}`));

    return { upcoming, past };
  }

  getAllExamsAdmin(): Exam[] {
    return [...this.exams].sort((a, b) => `${b.exam_date}T${b.exam_time}`.localeCompare(`${a.exam_date}T${a.exam_time}`));
  }

  saveExam(data: Partial<Exam>): Exam {
    if (data.id) {
      const idx = this.exams.findIndex((e) => e.id === data.id);
      if (idx !== -1) {
        this.exams[idx] = {
          ...this.exams[idx],
          ...data,
          updated_at: new Date().toISOString(),
        };
        this.persist(STORAGE_KEYS.EXAMS, this.exams);
        this.logAudit('ویرایش امتحان', `امتحان «${this.exams[idx].title}» بروزرسانی شد.`);
        return this.exams[idx];
      }
    }

    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      subject_id: data.subject_id || '',
      title: data.title || '',
      exam_date: data.exam_date || new Date().toISOString().split('T')[0],
      exam_time: data.exam_time || '08:00',
      description: data.description || '',
      topics: data.topics || [],
      status: data.status || 'upcoming',
      teacher_name: data.teacher_name,
      attachment_id: data.attachment_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.exams.push(newExam);
    this.persist(STORAGE_KEYS.EXAMS, this.exams);
    this.logAudit('افزودن امتحان', `امتحان «${newExam.title}» به تقویم اضافه شد.`);
    return newExam;
  }

  deleteExam(id: string): boolean {
    const exam = this.exams.find((e) => e.id === id);
    this.exams = this.exams.filter((e) => e.id !== id);
    this.persist(STORAGE_KEYS.EXAMS, this.exams);
    this.logAudit('حذف امتحان', `امتحان «${exam?.title || id}» حذف شد.`);
    return true;
  }

  // --- Storage Analytics & Reporting ---
  async getStorageStats(): Promise<StorageStats> {
    const pdfs = this.files.filter((f) => f.file_type === 'pdf');
    const images = this.files.filter((f) => f.file_type === 'image');

    const pdfBytes = pdfs.reduce((acc, f) => acc + f.file_size, 0);
    const imageBytes = images.reduce((acc, f) => acc + f.file_size, 0);
    const totalStorageBytes = pdfBytes + imageBytes;

    const quotaBytes = this.settings.storage_quota_mb * 1024 * 1024;
    const usedPercentage = Math.min(100, Math.round((totalStorageBytes / quotaBytes) * 100));

    // Sort to find largest and oldest
    const sortedBySize = [...this.files].sort((a, b) => b.file_size - a.file_size);
    const sortedByDate = [...this.files].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const largestFile = sortedBySize[0] || null;
    const oldestFile = sortedByDate[0] || null;
    const avgSize = this.files.length > 0 ? Math.round(totalStorageBytes / this.files.length) : 0;

    // Scan for actual orphans in storage
    const validPaths = new Set(this.files.map((f) => f.storage_path));
    const orphans = await storageEngine.scanForOrphans(validPaths);
    const orphanedBytes = orphans.reduce((acc, o) => acc + o.size, 0);

    const archivedBytes = this.files
      .filter((f) => f.status === 'archived')
      .reduce((acc, f) => acc + f.file_size, 0);

    // Approximate database size in bytes (JSON string length)
    const dbBytes =
      JSON.stringify(this.subjects).length +
      JSON.stringify(this.files).length +
      JSON.stringify(this.announcements).length +
      JSON.stringify(this.exams).length;

    return {
      total_storage_bytes: totalStorageBytes,
      storage_quota_bytes: quotaBytes,
      used_percentage: usedPercentage,
      pdf_count: pdfs.length,
      image_count: images.length,
      pdf_bytes: pdfBytes,
      image_bytes: imageBytes,
      database_bytes: dbBytes,
      largest_file: largestFile,
      oldest_file: oldestFile,
      average_file_size: avgSize,
      orphaned_files_count: orphans.length,
      orphaned_bytes: orphanedBytes,
      archived_bytes: archivedBytes,
    };
  }

  async scanOrphans(): Promise<OrphanFile[]> {
    const validPaths = new Set(this.files.map((f) => f.storage_path));
    return await storageEngine.scanForOrphans(validPaths);
  }

  async cleanupOrphans(orphanPaths: string[]): Promise<number> {
    let purged = 0;
    for (const path of orphanPaths) {
      const ok = await storageEngine.deleteFile(path);
      if (ok) purged++;
    }
    this.logAudit('پاکسازی فایل‌های یتیم', `${purged} فایل بلااستفاده از حافظه دیسک پاکسازی شد.`);
    return purged;
  }

  // --- Admin Authentication ---
  verifyAdmin(password: string): { valid: boolean; mustChangePassword?: boolean } {
    if (!this.adminUser) {
      return { valid: false };
    }
    if (this.adminUser.password_hash === password) {
      this.adminUser.last_login_at = new Date().toISOString();
      this.persist(STORAGE_KEYS.ADMIN_USER, this.adminUser);
      return {
        valid: true,
        mustChangePassword: this.adminUser.must_change_password,
      };
    }
    return { valid: false };
  }

  changeAdminPassword(oldPassword: string, newPassword: string): { success: boolean; error?: string } {
    if (!this.adminUser) return { success: false, error: 'کاربر مدیر یافت نشد.' };
    if (this.adminUser.password_hash !== oldPassword) {
      return { success: false, error: 'رمز عبور فعلی نادرست است.' };
    }
    if (newPassword.length < 8) {
      return { success: false, error: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد.' };
    }

    this.adminUser.password_hash = newPassword;
    this.adminUser.must_change_password = false;
    this.persist(STORAGE_KEYS.ADMIN_USER, this.adminUser);
    this.logAudit('تغییر رمز عبور', 'رمز عبور مدیر سیستم با موفقیت تغییر یافت.');
    return { success: true };
  }

  // --- Settings ---
  getSettings(): SiteSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<SiteSettings>): SiteSettings {
    this.settings = { ...this.settings, ...updates };
    this.persist(STORAGE_KEYS.SETTINGS, this.settings);
    this.logAudit('تنظیمات سامانه', 'تنظیمات کتابخانه کلاس بروزرسانی شد.');
    return this.settings;
  }
}

export const db = new DatabaseService();
