-- ====================================================================
-- ClassNotes (جزوه‌های کلاس ما) - Neon PostgreSQL Database Migration
-- Version: 0001_initial_schema.sql
-- Target: Neon PostgreSQL (Edge-compatible serverless SQL)
-- ====================================================================

-- 1. Create Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(64) NOT NULL DEFAULT 'BookOpen',
    color VARCHAR(32) NOT NULL DEFAULT '#2563EB',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Files Table (Unified for PDFs and Images stored in Cloudflare R2)
CREATE TABLE IF NOT EXISTS files (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    subject_id VARCHAR(64) NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    description TEXT,
    file_type VARCHAR(16) NOT NULL CHECK (file_type IN ('pdf', 'image')),
    mime_type VARCHAR(128) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL UNIQUE, -- Path inside Cloudflare R2 bucket (e.g. notes/physics/1742081234_file.pdf)
    file_size BIGINT NOT NULL,                  -- in bytes
    page_count INT,
    download_count INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id VARCHAR(64) PRIMARY KEY,
    subject_id VARCHAR(64) NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    title VARCHAR(500) NOT NULL,
    exam_date DATE NOT NULL,
    exam_time VARCHAR(10) NOT NULL DEFAULT '08:00',
    description TEXT,
    topics JSONB NOT NULL DEFAULT '[]'::JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
    teacher_name VARCHAR(255),
    attachment_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    affected_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- Performance Indexes for Low-Latency Queries in Cloudflare Workers
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_files_subject_id ON files(subject_id);
CREATE INDEX IF NOT EXISTS idx_files_slug ON files(slug);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_storage_path ON files(storage_path);

CREATE INDEX IF NOT EXISTS idx_exams_exam_date ON exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);

CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned, priority);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published, expires_at);

-- ====================================================================
-- Initial Seed Data
-- ====================================================================

-- Insert Initial Admin Account (admin / ClassNotes@1405!)
INSERT INTO admin_users (id, username, password_hash, must_change_password)
VALUES ('admin-01', 'admin', 'ClassNotes@1405!', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Insert Initial Subjects
INSERT INTO subjects (id, name, slug, description, icon, color, display_order, is_active)
VALUES
    ('sub-physics', 'فیزیک', 'physics', 'مباحث حرکت‌شناسی، دینامیک، نوسان، امواج و فیزیک اتمی', 'Atom', '#2563EB', 1, TRUE),
    ('sub-chemistry', 'شیمی', 'chemistry', 'سینتیک، تعادل‌های شیمیایی، اسیدها و بازها، الکتروشیمی', 'FlaskConical', '#059669', 2, TRUE),
    ('sub-calculus', 'حسابان و دیفرانسیل', 'calculus', 'حد و پیوستگی، مشتق و کاربرد مشتق، انتگرال و رفتار توابع', 'Sigma', '#7C3AED', 3, TRUE),
    ('sub-geometry', 'هندسه تحلیلی', 'geometry', 'ماتریس و کاربردها، مقاطع مخروطی، بردارها در فضای سه‌بعدی', 'Shapes', '#D97706', 4, TRUE),
    ('sub-persian', 'ادبیات فارسی', 'persian', 'آرایه‌های ادبی، قرابت معنایی، دستور زبان و متون کهن', 'BookOpen', '#DC2626', 5, TRUE),
    ('sub-english', 'زبان انگلیسی', 'english', 'واژگان کنکور، گرامر، درک مطلب و کلوز تست', 'Languages', '#0891B2', 6, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert Initial Site Settings
INSERT INTO site_settings (key, value)
VALUES
    ('general', '{"site_name": "کلاس‌نوت", "class_name": "کلاس دوازدهم ریاضی و علوم پایه", "description": "کتابخانه دیجیتال و مخزن رسمی جزوه‌ها و تخته‌های هوشمند کلاس", "max_upload_size_mb": 50, "storage_quota_mb": 500, "allow_public_downloads": true}'::JSONB)
ON CONFLICT (key) DO NOTHING;
