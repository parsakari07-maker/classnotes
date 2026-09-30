# ClassNotes Infrastructure: Cloudflare Workers + Cloudflare R2 + Neon PostgreSQL

An enterprise-grade, zero-cost-tier infrastructure migration for ClassNotes (جزوه‌های کلاس ما), transitioning the backend to Cloudflare Workers, object file storage to Cloudflare R2 with direct CDN delivery, and relational metadata persistence to Neon PostgreSQL, fully versioned on GitHub.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Key Architecture Decisions for Cloudflare Workers, R2 & Neon**:
> - **Non-Proxy Direct R2 Delivery**: Large educational PDFs and whiteboard images are delivered directly to students via Cloudflare R2 public bucket/custom CDN domain (`User → R2 → PDF/Image`), bypassing the Cloudflare Worker runtime to prevent bandwidth bottlenecking and CPU/memory exhaustion.
> - **Two-Phase Upload Authorization**: File uploads initiate via the Cloudflare Worker (`/api/admin/files/upload-intent`), which validates admin JWT authorization, magic bytes/MIME headers, and generates a pre-signed or direct PUT ticket to R2. Only after R2 confirms the upload is the metadata transactionally inserted into Neon PostgreSQL. If Neon insertion fails, the R2 object is immediately deleted.
> - **Zero-Bloat Neon PostgreSQL Schema**: Neon stores only relational entities (`subjects`, `files`, `announcements`, `exams`, `admin_users`, `site_settings`, `audit_logs`), indexes, and download counters. No binary objects are stored in SQL rows.
> - **Safe Replacement & Deletion Protocol**: Old R2 objects are never removed until the new file is verified in R2 and updated in Neon. Deletion purges both R2 and Neon, accurately returning partial failure diagnostics to the admin.
> - **Dual-Target Development & Wrangler Deploy**: Includes `worker/index.ts`, `wrangler.jsonc`, and SQL migration scripts (`migrations/0001_initial_schema.sql`) for Cloudflare Workers deployment, accompanied by a local development adapter.

---

### 1. Overview & Core Concept

- **What It Does**: Upgrades the ClassNotes class library platform to run on the serverless edge with Cloudflare Workers as the API/business-logic gateway, Cloudflare R2 for zero-egress-fee object storage, and Neon serverless PostgreSQL for relational metadata.
- **Target Audience / Persona**: High school and university classes needing instant, low-latency mobile and desktop access to lecture notes, whiteboard photos, announcements, and exam timetables without paying cloud hosting fees.
- **Key Value**: 100% free-tier compliant, global edge latency (<50ms), zero egress costs for educational downloads, and robust transactional consistency between Neon metadata and R2 storage.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Student Direct Note Streaming**:
   - Student visits `/notes/:slug` or `/subjects/:slug`.
   - The browser queries the Worker API (`GET /api/notes/:slug`) for lightweight JSON metadata from Neon.
   - In-browser PDF reader and image lightbox load the actual binary directly from the Cloudflare R2 CDN endpoint.
2. **Subject Bulk Download (Streaming ZIP)**:
   - On clicking "دانلود یکجای تمام جزوه‌ها", the browser or Worker coordinates on-the-fly streaming of files into a single ZIP without server-side persistent disk bloat.
3. **Admin Storage Telemetry & Orphan Scan**:
   - Admin navigates to `/admin/storage`.
   - Worker queries Neon for registered `storage_path` values and queries R2 via `bucket.list()` to detect unlinked or orphaned storage objects, providing one-click purge.

#### Visual Identity & Theme
- Preserves the approved Persian RTL design:
  - Vazirmatn typography with standard Persian numerals.
  - Deep Indigo (`#1e1b4b`), Electric Cyan (`#06b6d4`), and Slate neutrals.
  - Subtle floating math formulas background with `prefers-reduced-motion` compliance.
  - Zero-pill metadata discipline with unboxed text and typographic dots (`·`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct R2 Asset Delivery vs Worker Proxying**:
  - *Chosen Approach*: R2 public custom domain / presigned URLs directly consumed by the frontend.
  - *Why*: Cloudflare Workers have request duration and memory limits; streaming 40MB PDF scans through Workers would deplete free-tier CPU limits and add latency.
- **Decision 2: Neon Serverless PostgreSQL Connection**:
  - *Chosen Approach*: `@neondatabase/serverless` connection driver over HTTP/WebSocket.
  - *Why*: Designed specifically for edge environments like Cloudflare Workers without connection pool exhaustion.
- **Decision 3: Two-Phase Rollback File Replacement**:
  - *Chosen Approach*: Upload new R2 object $\to$ Verify $\to$ Update Neon record $\to$ Delete previous R2 object.
  - *Why*: Eliminates risk of file loss during network disruptions.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STUDENT & ADMIN FRONTEND                           │
│     (Vite + React + Tailwind CSS + Lucide Icons + Persian RTL Layout)       │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │ 1. Metadata / Auth API        │ 2. Direct Media Stream
                       ▼                               ▼
┌──────────────────────────────────────────┐    ┌─────────────────────────────┐
│       CLOUDFLARE WORKERS BACKEND         │    │        CLOUDFLARE R2        │
│  - /api/subjects                         │    │      (Object Storage)       │
│  - /api/notes                            │    │  - notes/physics/ch1.pdf    │
│  - /api/announcements                    │    │  - images/chem/board.png    │
│  - /api/exams                            │    │  - exams/calculus/quiz.pdf  │
│  - /api/admin/auth (JWT)                 │    │  (Zero egress fee CDN)      │
│  - /api/admin/files/upload-ticket        │    │                             │
│  - /api/admin/storage/orphans            │    │                             │
└──────────────────────┬───────────────────┘    └─────────────────────────────┘
                       │ SQL Queries / Mutations               ▲
                       ▼                                       │ 3. Storage
┌──────────────────────────────────────────┐                   │    Unlink/Sync
│            NEON POSTGRESQL               ├───────────────────┘
│  - subjects (id, name, slug, color)      │
│  - files (id, title, storage_path, size) │
│  - announcements (pinned, expires_at)    │
│  - exams (date, topics, status)          │
│  - admin_users (bcrypt hash)             │
│  - site_settings & audit_logs            │
└──────────────────────────────────────────┘
```

#### Database DDL & Schema (`migrations/0001_initial_schema.sql`):
- `subjects`: `id UUID PRIMARY KEY`, `name TEXT`, `slug TEXT UNIQUE`, `description TEXT`, `icon TEXT`, `color TEXT`, `display_order INT`, `is_active BOOLEAN`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
- `files`: `id UUID PRIMARY KEY`, `title TEXT`, `slug TEXT UNIQUE`, `subject_id UUID REFERENCES subjects(id)`, `description TEXT`, `file_type VARCHAR(10)`, `mime_type VARCHAR(100)`, `original_filename TEXT`, `storage_path TEXT UNIQUE`, `file_size BIGINT`, `page_count INT`, `download_count INT DEFAULT 0`, `status VARCHAR(20)`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `published_at TIMESTAMPTZ`.
- `announcements`: `id UUID PRIMARY KEY`, `title TEXT`, `content TEXT`, `priority VARCHAR(20)`, `is_pinned BOOLEAN`, `is_published BOOLEAN`, `expires_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
- `exams`: `id UUID PRIMARY KEY`, `subject_id UUID REFERENCES subjects(id)`, `title TEXT`, `exam_date DATE`, `exam_time VARCHAR(10)`, `description TEXT`, `topics JSONB`, `status VARCHAR(20)`, `teacher_name TEXT`, `attachment_id UUID`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
- `admin_users`: `id UUID PRIMARY KEY`, `username VARCHAR(50) UNIQUE`, `password_hash TEXT`, `must_change_password BOOLEAN`, `last_login_at TIMESTAMPTZ`.
- `site_settings`: `key VARCHAR(100) PRIMARY KEY`, `value JSONB`.
- `audit_logs`: `id UUID PRIMARY KEY`, `action TEXT`, `details TEXT`, `status VARCHAR(20)`, `timestamp TIMESTAMPTZ`.

#### Repository & Configuration Files
- `wrangler.jsonc`: Cloudflare Workers configuration with R2 bucket binding (`NOTES_BUCKET`) and Neon database connection secrets (`DATABASE_URL`).
- `worker/index.ts`: Modular edge API handler supporting all public routes, admin authentication, orphan scanner, and pre-signed upload tickets.
- `src/services/neonClient.ts`: Neon PostgreSQL query adapter.
- `src/services/r2Client.ts`: Cloudflare R2 storage client with orphan scanner and direct URL generator.
- `migrations/`: Versioned SQL migrations for Neon PostgreSQL.
- `.env.example`: Standardized environment variable documentation (`DATABASE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `AUTH_SECRET`).
