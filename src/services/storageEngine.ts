/**
 * Dedicated Binary Object Storage Engine
 * 
 * Implements strict separation:
 * Binary assets (PDFs, Images) are stored in this isolated object store,
 * completely decoupled from database metadata rows.
 */

import JSZip from 'jszip';
import { FileType, OrphanFile } from '../types';

const DB_NAME = 'ClassNotes_ObjectStorage_v1';
const STORE_NAME = 'binary_objects';

interface StorageItem {
  path: string;
  filename: string;
  file_type: FileType;
  mime_type: string;
  blob: Blob;
  size: number;
  created_at: string;
}

class StorageEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryCache: Map<string, StorageItem> = new Map();

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'path' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Validate file headers (magic bytes) to prevent disguised files
   */
  async validateMagicBytes(file: File | Blob): Promise<{ valid: boolean; detectedType?: FileType; error?: string }> {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // PDF magic bytes: %PDF (0x25, 0x50, 0x44, 0x46)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return { valid: true, detectedType: 'pdf' };
    }

    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return { valid: true, detectedType: 'image' };
    }

    // JPEG magic bytes: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { valid: true, detectedType: 'image' };
    }

    // WebP magic bytes: RIFF....WEBP (bytes 0-3 = RIFF, 8-11 = WEBP)
    if (
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) {
      return { valid: true, detectedType: 'image' };
    }

    // Fallback if file is SVG or standard text representation
    if (file.type === 'application/pdf') {
      return { valid: true, detectedType: 'pdf' };
    }
    if (file.type.startsWith('image/')) {
      return { valid: true, detectedType: 'image' };
    }

    return { valid: false, error: 'فرمت فایل معتبر نیست. تنها فایل‌های PDF و تصاویر (PNG, JPG, WebP) مجاز هستند.' };
  }

  /**
   * Save a binary file to the object storage
   */
  async saveFile(
    file: File | Blob,
    type: FileType,
    originalFilename: string
  ): Promise<{ storage_path: string; size: number }> {
    const timestamp = Date.now();
    const sanitizedName = originalFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const folder = type === 'pdf' ? 'pdfs' : 'images';
    const storagePath = `storage/uploads/${folder}/${timestamp}_${sanitizedName}`;

    const item: StorageItem = {
      path: storagePath,
      filename: originalFilename,
      file_type: type,
      mime_type: file.type || (type === 'pdf' ? 'application/pdf' : 'image/jpeg'),
      blob: file,
      size: file.size,
      created_at: new Date().toISOString(),
    };

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Memory fallback if IndexedDB fails in restricted iframe sandbox
      this.memoryCache.set(storagePath, item);
    }

    return { storage_path: storagePath, size: file.size };
  }

  /**
   * Retrieve a file blob and generate an object URL for reading/previewing
   */
  async getFileBlob(storagePath: string): Promise<Blob | null> {
    try {
      const db = await this.getDB();
      const item = await new Promise<StorageItem | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(storagePath);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (item && item.blob) {
        return item.blob;
      }
    } catch {
      // Check memory cache
    }

    const cached = this.memoryCache.get(storagePath);
    if (cached) return cached.blob;

    return null;
  }

  /**
   * Create an ephemeral Object URL for previewing in PDF viewer or Image Lightbox
   */
  async getFileURL(storagePath: string): Promise<string | null> {
    const blob = await this.getFileBlob(storagePath);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  /**
   * Delete a physical file from the storage engine
   */
  async deleteFile(storagePath: string): Promise<boolean> {
    let success = false;
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(storagePath);
        req.onsuccess = () => {
          success = true;
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback
    }

    if (this.memoryCache.has(storagePath)) {
      this.memoryCache.delete(storagePath);
      success = true;
    }

    return success;
  }

  /**
   * List all stored binary items in storage
   */
  async listAllStorageItems(): Promise<StorageItem[]> {
    const results: StorageItem[] = [];

    try {
      const db = await this.getDB();
      const items = await new Promise<StorageItem[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      results.push(...items);
    } catch {
      // Fallback
    }

    // Merge memory items that are not in DB
    for (const [path, item] of this.memoryCache.entries()) {
      if (!results.some((r) => r.path === path)) {
        results.push(item);
      }
    }

    return results;
  }

  /**
   * Identify Orphan Files (Storage items that have NO corresponding Database row)
   */
  async scanForOrphans(validDatabasePaths: Set<string>): Promise<OrphanFile[]> {
    const allItems = await this.listAllStorageItems();
    const orphans: OrphanFile[] = [];

    for (const item of allItems) {
      if (!validDatabasePaths.has(item.path)) {
        orphans.push({
          path: item.path,
          filename: item.filename,
          size: item.size,
          file_type: item.file_type,
          created_at: item.created_at,
        });
      }
    }

    return orphans;
  }

  /**
   * Generate streaming ZIP archive for subject files or admin multi-selection
   */
  async generateBulkZip(
    files: Array<{ storage_path: string; filename: string; title: string; file_type: string }>,
    zipName: string
  ): Promise<Blob> {
    const zip = new JSZip();

    for (const file of files) {
      const blob = await this.getFileBlob(file.storage_path);
      if (blob) {
        // Ensure proper extension
        const ext = file.file_type === 'pdf' ? '.pdf' : (file.filename.includes('.') ? '' : '.jpg');
        const safeName = `${file.title.replace(/[\/\\:*?"<>|]/g, '_')}${ext}`;
        zip.file(safeName, blob);
      }
    }

    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  }

  /**
   * Trigger direct browser download of a blob or file
   */
  triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

export const storageEngine = new StorageEngine();
