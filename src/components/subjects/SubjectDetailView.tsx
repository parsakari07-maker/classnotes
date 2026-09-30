/**
 * Subject Details Page View (/subjects/[slug])
 * Includes real Bulk Download as ZIP for all subject notes
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { NoteCard } from '../notes/NoteCard';
import { storageEngine } from '../../services/storageEngine';
import {
  FolderArchive,
  Search,
  ArrowUpDown,
  Filter,
  FileText,
  Download,
  ArrowRight,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/persianDate';

interface SubjectDetailViewProps {
  slug: string;
}

type SortOption = 'newest' | 'oldest' | 'downloads' | 'largest' | 'smallest';

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({ slug }) => {
  const { subjects, files, navigate, showToast } = useApp();
  const [searchLocal, setSearchLocal] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isZipping, setIsZipping] = useState(false);

  const subject = subjects.find((s) => s.slug === slug);

  const subjectFiles = useMemo(() => {
    if (!subject) return [];
    return files.filter((f) => f.subject_id === subject.id && f.status === 'published');
  }, [files, subject]);

  const filteredAndSortedFiles = useMemo(() => {
    let list = [...subjectFiles];

    if (searchLocal.trim()) {
      const q = searchLocal.toLowerCase();
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.original_filename.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'newest':
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'downloads':
        return list.sort((a, b) => b.download_count - a.download_count);
      case 'largest':
        return list.sort((a, b) => b.file_size - a.file_size);
      case 'smallest':
        return list.sort((a, b) => a.file_size - b.file_size);
      default:
        return list;
    }
  }, [subjectFiles, searchLocal, sortBy]);

  if (!subject) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">درس مورد نظر یافت نشد</h2>
        <button
          onClick={() => navigate({ type: 'subjects' })}
          className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          بازگشت به فهرست درس‌ها
        </button>
      </div>
    );
  }

  // Real Bulk Download as ZIP
  const handleBulkDownload = async () => {
    if (subjectFiles.length === 0) {
      showToast('هیچ جزوه‌ای برای دانلود در این درس موجود نیست.', 'warning');
      return;
    }

    try {
      setIsZipping(true);
      showToast(`در حال فشرده‌سازی ${toPersianDigits(subjectFiles.length)} جزوه...`, 'info');

      const items = subjectFiles.map((f) => ({
        storage_path: f.storage_path,
        filename: f.original_filename,
        title: f.title,
        file_type: f.file_type,
      }));

      const zipBlob = await storageEngine.generateBulkZip(items, subject.name);
      const zipFilename = `جزوه‌های_${subject.name.replace(/\s+/g, '_')}.zip`;

      storageEngine.triggerDownload(zipBlob, zipFilename);
      showToast(`بسته زیپ جزوه‌های «${subject.name}» با موفقیت دانلود شد.`, 'success');
    } catch (err) {
      showToast('خطا در ایجاد فایل زیپ.', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6">
        <button
          onClick={() => navigate({ type: 'home' })}
          className="hover:text-indigo-600 dark:hover:text-cyan-400"
        >
          صفحه اصلی
        </button>
        <span aria-hidden="true">/</span>
        <button
          onClick={() => navigate({ type: 'subjects' })}
          className="hover:text-indigo-600 dark:hover:text-cyan-400"
        >
          درس‌ها
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium">{subject.name}</span>
      </div>

      {/* Subject Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 mb-8 shadow-sm">
        <div
          className="absolute top-0 right-0 left-0 h-1.5"
          style={{ backgroundColor: subject.color }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: subject.color }}
              />
              <span className="text-xs font-bold text-slate-500">
                {toPersianDigits(subjectFiles.length)} جزوه بارگذاری‌شده
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
              درس {subject.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {subject.description || 'مجموعه جزوه‌ها، تخته‌های هوشمند و تمرینات مرتبط با این درس.'}
            </p>
          </div>

          {/* Real Bulk Download Action Button */}
          <button
            onClick={handleBulkDownload}
            disabled={isZipping || subjectFiles.length === 0}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all self-start md:self-auto"
          >
            {isZipping ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FolderArchive className="w-5 h-5 text-indigo-200" />
            )}
            <span>دانلود یکجای تمام جزوه‌ها (ZIP)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
        {/* Local Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={`جستجو در جزوه‌های ${subject.name}...`}
            value={searchLocal}
            onChange={(e) => setSearchLocal(e.target.value)}
            className="w-full pl-4 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            مرتب‌سازی:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-1.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="downloads">بیشترین دانلود</option>
            <option value="largest">بزرگ‌ترین حجم</option>
            <option value="smallest">کمترین حجم</option>
          </select>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredAndSortedFiles.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {searchLocal ? 'هیچ جزوه‌ای با این عنوان یافت نشد.' : 'هنوز جزوه‌ای برای این درس اضافه نشده است.'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            به محض انتشار جزوه جدید توسط دبیر، در اینجا قرار خواهد گرفت.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedFiles.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
};
