/**
 * Data models and interfaces for ClassNotes digital class library
 */

export type FileType = 'pdf' | 'image';
export type FileStatus = 'published' | 'archived';
export type AnnouncementPriority = 'normal' | 'high' | 'urgent';
export type ExamStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string; // Tailwind color token or hex
  display_order: number;
  is_active: boolean;
  notes_count?: number;
  created_at: string;
  updated_at: string;
}

export interface NoteFile {
  id: string;
  title: string;
  slug: string;
  subject_id: string;
  description: string;
  file_type: FileType;
  mime_type: string;
  original_filename: string;
  storage_path: string; // Physical storage location in storage engine
  file_size: number; // in bytes
  page_count?: number;
  download_count: number;
  status: FileStatus;
  created_at: string;
  updated_at: string;
  published_at: string;
  // Optional preview blob URL or data URL
  preview_url?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  is_published: boolean;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  subject_id: string;
  title: string;
  exam_date: string; // YYYY-MM-DD
  exam_time: string; // HH:mm
  description: string;
  topics: string[];
  status: ExamStatus;
  teacher_name?: string;
  attachment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  must_change_password: boolean;
  last_login_at?: string;
}

export interface SiteSettings {
  site_name: string;
  class_name: string;
  description: string;
  max_upload_size_mb: number;
  storage_quota_mb: number;
  allow_public_downloads: boolean;
}

export interface StorageStats {
  total_storage_bytes: number;
  storage_quota_bytes: number;
  used_percentage: number;
  pdf_count: number;
  image_count: number;
  pdf_bytes: number;
  image_bytes: number;
  database_bytes: number;
  largest_file: NoteFile | null;
  oldest_file: NoteFile | null;
  average_file_size: number;
  orphaned_files_count: number;
  orphaned_bytes: number;
  archived_bytes: number;
}

export interface OrphanFile {
  path: string;
  filename: string;
  size: number;
  file_type: FileType;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  affected_id?: string;
  status: 'success' | 'warning' | 'error';
}

export type ActiveView = 
  | { type: 'home' }
  | { type: 'subjects' }
  | { type: 'subject'; slug: string }
  | { type: 'note'; slug: string }
  | { type: 'exams' }
  | { type: 'announcements' }
  | { type: 'admin'; subView?: 'dashboard' | 'files' | 'subjects' | 'announcements' | 'exams' | 'storage' | 'settings' };
