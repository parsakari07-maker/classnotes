/**
 * Cloudflare Worker API Gateway
 * 
 * Infrastructure: Cloudflare Workers + Cloudflare R2 + Neon PostgreSQL
 * 
 * Critical Architecture Rule:
 * Large binary files (PDFs, Images) are served directly by Cloudflare R2 CDN,
 * never proxied through this Worker to ensure maximum edge performance and zero CPU bottlenecking.
 */

import { neon } from '@neondatabase/serverless';

export interface R2ObjectItem {
  key: string;
  size: number;
  uploaded: Date;
}

export interface R2Bucket {
  put(key: string, value: any, options?: any): Promise<any>;
  get(key: string): Promise<any>;
  delete(key: string | string[]): Promise<void>;
  list(options?: { limit?: number; cursor?: string; prefix?: string }): Promise<{ objects: R2ObjectItem[] }>;
}

export interface Env {
  NOTES_BUCKET: R2Bucket;
  DATABASE_URL: string;
  R2_PUBLIC_URL: string;
  AUTH_SECRET?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Edge Health Check
    if (path === '/api/health') {
      return jsonResponse({
        status: 'ok',
        platform: 'Cloudflare Workers',
        r2_attached: Boolean(env.NOTES_BUCKET),
        neon_configured: Boolean(env.DATABASE_URL),
        timestamp: new Date().toISOString(),
      });
    }

    const sql = env.DATABASE_URL ? neon(env.DATABASE_URL) : null;

    try {
      // -------------------------------------------------------------
      // PUBLIC ENDPOINTS
      // -------------------------------------------------------------

      // 1. Get Subjects
      if (path === '/api/subjects' && request.method === 'GET') {
        if (!sql) return jsonResponse({ error: 'DATABASE_URL not configured' }, 500);

        const rows = await sql`
          SELECT s.*, 
                 COUNT(f.id) FILTER (WHERE f.status = 'published') AS notes_count
          FROM subjects s
          LEFT JOIN files f ON f.subject_id = s.id
          WHERE s.is_active = TRUE
          GROUP BY s.id
          ORDER BY s.display_order ASC;
        `;
        return jsonResponse(rows);
      }

      // 2. Get Published Notes (with optional subject filtering)
      if (path === '/api/notes' && request.method === 'GET') {
        if (!sql) return jsonResponse({ error: 'DATABASE_URL not configured' }, 500);

        const subjectId = url.searchParams.get('subject_id');
        let rows;
        if (subjectId) {
          rows = await sql`
            SELECT * FROM files
            WHERE status = 'published' AND subject_id = ${subjectId}
            ORDER BY created_at DESC;
          `;
        } else {
          rows = await sql`
            SELECT * FROM files
            WHERE status = 'published'
            ORDER BY created_at DESC;
          `;
        }

        // Attach direct R2 CDN URL to each file (Non-proxy rule)
        const enriched = rows.map((f: any) => ({
          ...f,
          direct_r2_url: `${env.R2_PUBLIC_URL || ''}/${f.storage_path}`,
        }));

        return jsonResponse(enriched);
      }

      // 3. Get Single Note by Slug
      if (path.startsWith('/api/notes/') && request.method === 'GET') {
        if (!sql) return jsonResponse({ error: 'DATABASE_URL not configured' }, 500);

        const slug = path.replace('/api/notes/', '');
        const rows = await sql`
          SELECT * FROM files
          WHERE slug = ${slug} AND status = 'published'
          LIMIT 1;
        `;

        if (rows.length === 0) {
          return jsonResponse({ error: 'جزوه یافت نشد' }, 404);
        }

        const note = rows[0];
        note.direct_r2_url = `${env.R2_PUBLIC_URL || ''}/${note.storage_path}`;
        return jsonResponse(note);
      }

      // 4. Increment Download Count
      if (path.match(/^\/api\/files\/[^\/]+\/download$/) && request.method === 'POST') {
        if (!sql) return jsonResponse({ error: 'DATABASE_URL not configured' }, 500);

        const fileId = path.split('/')[3];
        await sql`
          UPDATE files
          SET download_count = download_count + 1
          WHERE id = ${fileId};
        `;
        return jsonResponse({ success: true });
      }

      // 5. Get Announcements
      if (path === '/api/announcements' && request.method === 'GET') {
        if (!sql) return jsonResponse({ error: 'DATABASE_URL not configured' }, 500);

        const rows = await sql`
          SELECT * FROM announcements
          WHERE is_published = TRUE
            AND (expires_at IS NULL OR expires_at > NOW())
          ORDER BY is_pinned DESC,
                   CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END,
                   created_at DESC;
        `;
        return jsonResponse(rows);
      }

      // 6. Get Exams
      if (path === '/api/exams' && request.method === 'GET') {
        if (!sql) return jsonResponse({ error: 'DATABASE_URL not configured' }, 500);

        const upcoming = await sql`
          SELECT * FROM exams
          WHERE exam_date >= CURRENT_DATE AND status != 'completed'
          ORDER BY exam_date ASC, exam_time ASC;
        `;

        const past = await sql`
          SELECT * FROM exams
          WHERE exam_date < CURRENT_DATE OR status = 'completed'
          ORDER BY exam_date DESC, exam_time DESC;
        `;

        return jsonResponse({ upcoming, past });
      }

      // -------------------------------------------------------------
      // ADMIN & STORAGE MANAGEMENT ENDPOINTS
      // -------------------------------------------------------------

      // 7. Admin Authentication
      if (path === '/api/admin/auth/login' && request.method === 'POST') {
        if (!sql) return jsonResponse({ error: 'DATABASE_URL not configured' }, 500);

        const body: any = await request.json();
        const { username, password } = body;

        const users = await sql`
          SELECT * FROM admin_users
          WHERE username = ${username || 'admin'}
          LIMIT 1;
        `;

        if (users.length === 0 || users[0].password_hash !== password) {
          return jsonResponse({ error: 'نام کاربری یا رمز عبور اشتباه است' }, 401);
        }

        const user = users[0];
        await sql`
          UPDATE admin_users
          SET last_login_at = NOW()
          WHERE id = ${user.id};
        `;

        return jsonResponse({
          success: true,
          must_change_password: user.must_change_password,
          username: user.username,
        });
      }

      // 8. Admin Password Change
      if (path === '/api/admin/auth/change-password' && request.method === 'POST') {
        if (!sql) return jsonResponse({ error: 'DATABASE_URL not configured' }, 500);

        const body: any = await request.json();
        const { oldPassword, newPassword } = body;

        const users = await sql`
          SELECT * FROM admin_users
          WHERE username = 'admin'
          LIMIT 1;
        `;

        if (users.length === 0 || users[0].password_hash !== oldPassword) {
          return jsonResponse({ error: 'رمز عبور فعلی نامعتبر است' }, 400);
        }

        await sql`
          UPDATE admin_users
          SET password_hash = ${newPassword},
              must_change_password = FALSE,
              updated_at = NOW()
          WHERE id = ${users[0].id};
        `;

        return jsonResponse({ success: true });
      }

      // 9. Safe Upload: Uploads binary directly to R2 and writes metadata to Neon
      if (path === '/api/admin/files/upload' && request.method === 'POST') {
        if (!sql) return jsonResponse({ error: 'DATABASE_URL not configured' }, 500);

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string;
        const subjectId = formData.get('subject_id') as string;
        const description = (formData.get('description') as string) || '';
        const pageCount = formData.get('page_count') ? Number(formData.get('page_count')) : null;

        if (!file || !title || !subjectId) {
          return jsonResponse({ error: 'اطلاعات ارسالی ناقص است' }, 400);
        }

        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        const fileType = isPdf ? 'pdf' : 'image';
        const timestamp = Date.now();
        const sanitized = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const folder = fileType === 'pdf' ? 'pdfs' : 'images';
        const storagePath = `notes/${folder}/${timestamp}_${sanitized}`;

        // 1. Write to Cloudflare R2
        if (env.NOTES_BUCKET) {
          const fileBuffer = await file.arrayBuffer();
          await env.NOTES_BUCKET.put(storagePath, fileBuffer, {
            httpMetadata: {
              contentType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
            },
          });
        }

        // 2. Insert into Neon PostgreSQL
        try {
          const fileId = `file-${timestamp}-${Math.random().toString(36).substring(2, 6)}`;
          const slug = `${title.trim().toLowerCase().replace(/[\s\/\\:*?"<>|]+/g, '-')}-${timestamp}`;

          await sql`
            INSERT INTO files (
              id, title, slug, subject_id, description, file_type, mime_type,
              original_filename, storage_path, file_size, page_count, status
            ) VALUES (
              ${fileId}, ${title}, ${slug}, ${subjectId}, ${description},
              ${fileType}, ${file.type || 'application/octet-stream'},
              ${file.name}, ${storagePath}, ${file.size}, ${pageCount}, 'published'
            );
          `;

          await sql`
            INSERT INTO audit_logs (id, action, details, affected_id)
            VALUES (${`log-${timestamp}`}, 'آپلود به R2 و Neon', ${`فایل «${title}» با حجم ${file.size} بایت ذخیره شد.`}, ${fileId});
          `;

          return jsonResponse({ success: true, storage_path: storagePath, id: fileId });
        } catch (dbError) {
          // Rollback R2 upload to prevent orphaned object!
          if (env.NOTES_BUCKET) {
            await env.NOTES_BUCKET.delete(storagePath);
          }
          throw dbError;
        }
      }

      // 10. Safe Deletion: Unlinks R2 object and removes Neon row
      if (path.match(/^\/api\/admin\/files\/[^\/]+$/) && request.method === 'DELETE') {
        if (!sql) return jsonResponse({ error: 'DATABASE_URL not configured' }, 500);

        const fileId = path.split('/')[4];
        const existing = await sql`
          SELECT * FROM files WHERE id = ${fileId} LIMIT 1;
        `;

        if (existing.length === 0) {
          return jsonResponse({ error: 'فایل یافت نشد' }, 404);
        }

        const fileRecord = existing[0];

        // 1. Delete physical R2 object
        if (env.NOTES_BUCKET && fileRecord.storage_path) {
          await env.NOTES_BUCKET.delete(fileRecord.storage_path);
        }

        // 2. Delete metadata row from Neon
        await sql`DELETE FROM files WHERE id = ${fileId};`;

        await sql`
          INSERT INTO audit_logs (id, action, details, affected_id)
          VALUES (${`log-${Date.now()}`}, 'حذف از R2 و Neon', ${`فایل «${fileRecord.title}» حذف شد.`}, ${fileId});
        `;

        return jsonResponse({ success: true });
      }

      // 11. Storage Orphan Scanner (Compares R2 objects against Neon database)
      if (path === '/api/admin/storage/orphans' && request.method === 'GET') {
        if (!sql) return jsonResponse({ error: 'DATABASE_URL not configured' }, 500);

        // Get all storage_path values in Neon
        const dbRecords = await sql`SELECT storage_path FROM files;`;
        const registeredPaths = new Set(dbRecords.map((r: any) => r.storage_path));

        const orphans: any[] = [];

        // Scan Cloudflare R2 bucket listing
        if (env.NOTES_BUCKET) {
          const list = await env.NOTES_BUCKET.list({ limit: 1000 });
          for (const object of list.objects) {
            if (!registeredPaths.has(object.key)) {
              orphans.push({
                path: object.key,
                filename: object.key.split('/').pop() || object.key,
                size: object.size,
                created_at: object.uploaded.toISOString(),
              });
            }
          }
        }

        return jsonResponse(orphans);
      }

      // 12. Purge Orphan Files from R2
      if (path === '/api/admin/storage/cleanup-orphans' && request.method === 'POST') {
        const body: any = await request.json();
        const paths: string[] = body.paths || [];

        let purged = 0;
        if (env.NOTES_BUCKET) {
          for (const p of paths) {
            await env.NOTES_BUCKET.delete(p);
            purged++;
          }
        }

        return jsonResponse({ success: true, purged_count: purged });
      }

      // 13. Storage Telemetry
      if (path === '/api/admin/storage/telemetry' && request.method === 'GET') {
        if (!sql) return jsonResponse({ error: 'DATABASE_URL not configured' }, 500);

        const filesStats = await sql`
          SELECT 
            COUNT(id) AS total_files,
            COALESCE(SUM(file_size), 0) AS total_storage_bytes,
            COUNT(id) FILTER (WHERE file_type = 'pdf') AS pdf_count,
            COALESCE(SUM(file_size) FILTER (WHERE file_type = 'pdf'), 0) AS pdf_bytes,
            COUNT(id) FILTER (WHERE file_type = 'image') AS image_count,
            COALESCE(SUM(file_size) FILTER (WHERE file_type = 'image'), 0) AS image_bytes
          FROM files;
        `;

        return jsonResponse(filesStats[0]);
      }

      return jsonResponse({ error: 'Endpoint not found' }, 404);
    } catch (err: any) {
      return jsonResponse({ error: err?.message || 'Internal Edge Server Error' }, 500);
    }
  },
};
