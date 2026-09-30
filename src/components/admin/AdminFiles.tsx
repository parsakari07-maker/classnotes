/**
 * Admin File Management Table with Bulk Actions, Safe Replacement & Date-Based Deletion
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { NoteFile } from '../../types';
import { db } from '../../services/database';
import { storageEngine } from '../../services/storageEngine';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Search,
  Filter,
  Trash2,
  Archive,
  Download,
  Eye,
  RefreshCw,
  FolderArchive,
  FileText,
  Image as ImageIcon,
  Edit2,
  Calendar,
  AlertTriangle,
  Upload,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import {
  formatBytesPersian,
  formatPersianDateShort,
  toPersianDigits,
} from '../../utils/persianDate';

export const AdminFiles: React.FC = () => {
  const { files, subjects, refreshData, showToast, openPdfViewer, openImageViewer } = useApp();

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'image'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'largest' | 'smallest' | 'downloads'>('newest');

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    mode: 'single' | 'bulk' | 'date';
    singleFile?: NoteFile;
    criteria?: { olderThanDays?: number };
    affectedCount?: number;
    affectedBytes?: number;
  }>({ isOpen: false, mode: 'single' });

  // Replacement State
  const [replaceTargetFile, setReplaceTargetFile] = useState<NoteFile | null>(null);
  const [replaceFileInput, setReplaceFileInput] = useState<File | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Edit Metadata State
  const [editingFile, setEditingFile] = useState<NoteFile | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');

  // Date Filter Picker
  const [olderThanDays, setOlderThanDays] = useState<number>(14);

  // Filtered & Sorted files list
  const filteredFiles = useMemo(() => {
    let list = [...files];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.original_filename.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      );
    }

    if (filterSubject !== 'all') {
      list = list.filter((f) => f.subject_id === filterSubject);
    }

    if (filterType !== 'all') {
      list = list.filter((f) => f.file_type === filterType);
    }

    if (filterStatus !== 'all') {
      list = list.filter((f) => f.status === filterStatus);
    }

    switch (sortBy) {
      case 'newest':
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'largest':
        return list.sort((a, b) => b.file_size - a.file_size);
      case 'smallest':
        return list.sort((a, b) => a.file_size - b.file_size);
      case 'downloads':
        return list.sort((a, b) => b.download_count - a.download_count);
      default:
        return list;
    }
  }, [files, search, filterSubject, filterType, filterStatus, sortBy]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFiles.map((f) => f.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Bulk ZIP download
  const handleBulkDownloadSelected = async () => {
    if (selectedIds.length === 0) return;
    const targetFiles = files.filter((f) => selectedIds.includes(f.id));

    try {
      showToast(`در حال آماده‌سازی فایل زیپ برای ${toPersianDigits(targetFiles.length)} مورد...`, 'info');
      const items = targetFiles.map((f) => ({
        storage_path: f.storage_path,
        filename: f.original_filename,
        title: f.title,
        file_type: f.file_type,
      }));

      const blob = await storageEngine.generateBulkZip(items, 'منتخب_مدیر');
      storageEngine.triggerDownload(blob, `منتخب_جزوه‌های_کلاس_${Date.now()}.zip`);
      showToast('دانلود بسته زیپ با موفقیت انجام شد.', 'success');
    } catch {
      showToast('خطا در فشرده‌سازی فایل‌های منتخب.', 'error');
    }
  };

  // Execution of Delete
  const handleExecuteDelete = async () => {
    if (deleteModal.mode === 'single' && deleteModal.singleFile) {
      await db.deleteFile(deleteModal.singleFile.id);
      showToast(`فایل «${deleteModal.singleFile.title}» حذف گردید.`, 'success');
    } else if (deleteModal.mode === 'bulk') {
      const res = await db.bulkDeleteFiles(selectedIds);
      if (res.failCount > 0) {
        showToast(
          `${toPersianDigits(res.successCount)} فایل حذف شد، ${toPersianDigits(res.failCount)} فایل با خطا مواجه شد.`,
          'warning'
        );
      } else {
        showToast(`تعداد ${toPersianDigits(res.successCount)} فایل با موفقیت حذف دائم شد.`, 'success');
      }
      setSelectedIds([]);
    } else if (deleteModal.mode === 'date' && deleteModal.criteria) {
      const res = await db.deleteFilesByDate(deleteModal.criteria);
      showToast(
        `تعداد ${toPersianDigits(res.successCount)} فایل قدیمی با موفقیت حذف و ${formatBytesPersian(res.freedBytes)} حافظه آزاد شد.`,
        'success'
      );
      setSelectedIds([]);
    }

    setDeleteModal({ isOpen: false, mode: 'single' });
    await refreshData();
  };

  // Trigger Date-based Deletion Preview
  const handlePromptDateDelete = (days: number) => {
    const targets = db.getFilesMatchingDate({ olderThanDays: days });
    const bytes = targets.reduce((acc, f) => acc + f.file_size, 0);

    if (targets.length === 0) {
      showToast(`هیچ فایلی قدیمی‌تر از ${toPersianDigits(days)} روز در سامانه یافت نشد.`, 'info');
      return;
    }

    setDeleteModal({
      isOpen: true,
      mode: 'date',
      criteria: { olderThanDays: days },
      affectedCount: targets.length,
      affectedBytes: bytes,
    });
  };

  // Safe Replacement Flow
  const handleExecuteReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceTargetFile || !replaceFileInput) return;

    setIsReplacing(true);
    try {
      const check = await storageEngine.validateMagicBytes(replaceFileInput);
      if (!check.valid) {
        showToast(check.error || 'فرمت فایل معتبر نیست.', 'error');
        setIsReplacing(false);
        return;
      }

      await db.replaceFile(
        replaceTargetFile.id,
        replaceFileInput,
        check.detectedType || (replaceFileInput.type === 'application/pdf' ? 'pdf' : 'image'),
        replaceFileInput.name
      );

      showToast(`فایل جدید برای «${replaceTargetFile.title}» جایگزین شد.`, 'success');
      setReplaceTargetFile(null);
      setReplaceFileInput(null);
      await refreshData();
    } catch (err: any) {
      showToast(err?.message || 'خطا در جایگزینی فایل.', 'error');
    } finally {
      setIsReplacing(false);
    }
  };

  // Edit Metadata
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;

    db.updateFileMetadata(editingFile.id, {
      title: editTitle,
      description: editDesc,
      subject_id: editSubjectId,
    });

    showToast('مشخصات جزوه با موفقیت به‌روزرسانی شد.', 'success');
    setEditingFile(null);
    refreshData();
  };

  const selectedFilesList = files.filter((f) => selectedIds.includes(f.id));
  const selectedTotalBytes = selectedFilesList.reduce((acc, f) => acc + f.file_size, 0);

  return (
    <div className="space-y-6 animate-in fade-in text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white">مدیریت فایل‌ها و جزوه‌ها</h1>
          <p className="text-slate-400 mt-1">
            مشاهده، ویرایش مشخصات، حذف دائم، جایگزینی امن فایل و دانلود گروهی
          </p>
        </div>

        {/* Date Cleanup Shortcut Button */}
        <div className="flex items-center gap-2">
          <select
            value={olderThanDays}
            onChange={(e) => setOlderThanDays(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-300"
          >
            <option value={7}>قدیمی‌تر از ۷ روز</option>
            <option value={14}>قدیمی‌تر از ۱۴ روز</option>
            <option value={30}>قدیمی‌تر از ۳۰ روز</option>
            <option value={60}>قدیمی‌تر از ۶۰ روز</option>
          </select>
          <button
            onClick={() => handlePromptDateDelete(olderThanDays)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 text-rose-300 border border-rose-600/30 hover:bg-rose-600/30 rounded-xl font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف بر اساس تاریخ</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <input
            type="text"
            placeholder="جستجوی نام فایل یا عنوان جزوه..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
        </div>

        {/* Subject Filter */}
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 py-2 px-3 rounded-xl focus:outline-none"
        >
          <option value="all">همه درس‌ها</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 text-slate-200 py-2 px-3 rounded-xl focus:outline-none"
        >
          <option value="all">همه فرمت‌ها</option>
          <option value="pdf">فقط PDF</option>
          <option value="image">فقط تصاویر تخته</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 text-slate-200 py-2 px-3 rounded-xl focus:outline-none"
        >
          <option value="newest">جدیدترین</option>
          <option value="oldest">قدیمی‌ترین</option>
          <option value="largest">بزرگ‌ترین حجم</option>
          <option value="smallest">کمترین حجم</option>
          <option value="downloads">بیشترین دانلود</option>
        </select>
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">
              {toPersianDigits(selectedIds.length)} فایل انتخاب شده
            </span>
            <span className="text-slate-400">({formatBytesPersian(selectedTotalBytes)})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDownloadSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>دانلود فشرده (ZIP)</span>
            </button>

            <button
              onClick={() =>
                setDeleteModal({
                  isOpen: true,
                  mode: 'bulk',
                  affectedCount: selectedIds.length,
                  affectedBytes: selectedTotalBytes,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-colors shadow-md shadow-rose-600/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف گروهی دائم</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Files Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
              <th className="p-3 w-10 text-center">
                <button onClick={handleToggleSelectAll} className="p-1 text-slate-400 hover:text-white">
                  {selectedIds.length === filteredFiles.length && filteredFiles.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-3 font-semibold">عنوان و نام فایل</th>
              <th className="p-3 font-semibold">درس</th>
              <th className="p-3 font-semibold">نوع</th>
              <th className="p-3 font-semibold">حجم</th>
              <th className="p-3 font-semibold">دانلود</th>
              <th className="p-3 font-semibold">تاریخ</th>
              <th className="p-3 font-semibold">وضعیت</th>
              <th className="p-3 font-semibold text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  هیچ فایلی با این مشخصات یافت نشد.
                </td>
              </tr>
            ) : (
              filteredFiles.map((file) => {
                const sub = subjects.find((s) => s.id === file.subject_id);
                const isSelected = selectedIds.includes(file.id);

                return (
                  <tr
                    key={file.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleSelectOne(file.id)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="p-3 max-w-xs">
                      <div className="flex items-center gap-2.5">
                        {file.file_type === 'pdf' ? (
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="font-bold text-white block truncate">{file.title}</span>
                          <span className="text-[11px] text-slate-500 font-mono block truncate">
                            {file.original_filename}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-medium text-slate-300">{sub?.name || '—'}</td>

                    <td className="p-3 uppercase font-mono text-[11px] text-slate-400">
                      {file.file_type}
                    </td>

                    <td className="p-3 font-mono tabular-nums text-slate-300">
                      {formatBytesPersian(file.file_size)}
                    </td>

                    <td className="p-3 font-mono tabular-nums text-slate-300">
                      {toPersianDigits(file.download_count)}
                    </td>

                    <td className="p-3 font-mono text-slate-400">
                      {formatPersianDateShort(file.created_at)}
                    </td>

                    <td className="p-3">
                      <span
                        className={`text-[11px] font-semibold ${
                          file.status === 'published' ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {file.status === 'published' ? 'منتشر شده' : 'بایگانی'}
                      </span>
                    </td>

                    {/* Row Actions */}
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        {/* View in browser */}
                        <button
                          onClick={() => {
                            if (file.file_type === 'pdf') openPdfViewer(file);
                            else openImageViewer(file);
                          }}
                          className="p-1.5 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="مشاهده"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Replace safe action */}
                        <button
                          onClick={() => {
                            setReplaceTargetFile(file);
                            setReplaceFileInput(null);
                          }}
                          className="p-1.5 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="جایگزینی امن فایل جدید"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit metadata */}
                        <button
                          onClick={() => {
                            setEditingFile(file);
                            setEditTitle(file.title);
                            setEditDesc(file.description);
                            setEditSubjectId(file.subject_id);
                          }}
                          className="p-1.5 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="ویرایش مشخصات"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete single */}
                        <button
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              mode: 'single',
                              singleFile: file,
                              affectedCount: 1,
                              affectedBytes: file.file_size,
                            })
                          }
                          className="p-1.5 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="حذف دائم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Metadata Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">ویرایش جزوه: {editingFile.title}</h3>
              <button onClick={() => setEditingFile(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">عنوان جزوه</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">درس مربوطه</label>
                <select
                  value={editSubjectId}
                  onChange={(e) => setEditSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">توضیحات</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe File Replacement Modal */}
      {replaceTargetFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">جایگزینی امن فایل</h3>
              <button
                onClick={() => setReplaceTargetFile(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs mb-4">
              فایل جدید ابتدا در حافظه ذخیره و صحت‌سنجی می‌شود و تنها پس از اطمینان، فایل قدیمی پاک خواهد شد.
            </div>

            <form onSubmit={handleExecuteReplace} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">جزوه در حال جایگزینی:</span>
                <span className="font-bold text-white block">{replaceTargetFile.title}</span>
                <span className="font-mono text-slate-500">
                  فعلی: {replaceTargetFile.original_filename} (
                  {formatBytesPersian(replaceTargetFile.file_size)})
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  انتخاب فایل جایگزین جدید
                </label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => setReplaceFileInput(e.target.files?.[0] || null)}
                  required
                  className="w-full text-xs text-slate-400 file:ml-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReplaceTargetFile(null)}
                  disabled={isReplacing}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isReplacing || !replaceFileInput}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReplacing ? 'animate-spin' : ''}`} />
                  <span>{isReplacing ? 'در حال جایگزینی...' : 'جایگزینی و ثبت نهایی'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Single/Bulk/Date Deletion */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={
          deleteModal.mode === 'single'
            ? 'حذف دائم جزوه'
            : deleteModal.mode === 'bulk'
            ? 'حذف گروهی فایل‌ها'
            : 'حذف فایل‌ها بر اساس تاریخ'
        }
        message={
          deleteModal.mode === 'single'
            ? `آیا از حذف دائم فایل «${deleteModal.singleFile?.title}» از پایگاه داده و حافظه دیسک مطمئن هستید؟`
            : deleteModal.mode === 'bulk'
            ? `آیا از حذف دائم ${toPersianDigits(deleteModal.affectedCount || 0)} فایل انتخاب‌شده اطمینان دارید؟`
            : `آیا از پاکسازی تمام فایل‌های قدیمی‌تر از ${toPersianDigits(
                deleteModal.criteria?.olderThanDays || 14
              )} روز اطمینان دارید؟`
        }
        itemCount={deleteModal.affectedCount}
        totalBytes={deleteModal.affectedBytes}
        confirmLabel="حذف دائم از سرور"
        isDestructive={true}
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeleteModal({ isOpen: false, mode: 'single' })}
      />
    </div>
  );
};
