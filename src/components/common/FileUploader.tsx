import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Loader2,
  FileCheck,
} from 'lucide-react';
import {
  fileStorageService,
  type FileUploadOptions,
  type UploadResult,
} from '../../services/storage/fileStorageService';

export interface FileUploaderProps {
  label?: string;
  description?: string;
  societyId?: string;
  entityType?: 'vendor' | 'resident' | 'maintenance' | 'admin' | 'general';
  entityId?: string;
  maxSizeMB?: number;
  accept?: string;
  currentUrl?: string;
  onUploadSuccess?: (result: UploadResult) => void;
  onRemove?: () => void;
  className?: string;
  compact?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label = 'Upload Document or Photo',
  description = 'Supports JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, CSV',
  societyId = 'soc-gvs',
  entityType = 'general',
  entityId,
  maxSizeMB = 15,
  accept,
  currentUrl,
  onUploadSuccess,
  onRemove,
  className = '',
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{ name: string; size: number; mimeType?: string } | null>(null);
  const [failedFile, setFailedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setError(null);
    setFailedFile(null);

    // 1. Client-Side Validation
    const validation = fileStorageService.validateFile(file, maxSizeMB);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // 2. Generate immediate local preview for images
    if (file.type.startsWith('image/')) {
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
    } else {
      setPreviewUrl(null);
    }

    setUploadedFileMeta({ name: file.name, size: file.size, mimeType: file.type });
    setIsUploading(true);
    setProgress(5);

    try {
      const options: FileUploadOptions = {
        societyId,
        entityType,
        entityId,
        maxSizeMB,
        onProgress: (p) => setProgress(p),
      };

      const result = await fileStorageService.uploadFile(file, options);
      setProgress(100);
      setPreviewUrl(result.downloadUrl);
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err?.message || 'Upload failed. Click retry to try again.');
      setFailedFile(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setUploadedFileMeta(null);
    setError(null);
    setProgress(0);
    setFailedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onRemove) onRemove();
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (failedFile) {
      handleProcessFile(failedFile);
    }
  };

  const renderFileIcon = () => {
    if (uploadedFileMeta?.mimeType?.includes('sheet') || uploadedFileMeta?.name?.endsWith('.xlsx') || uploadedFileMeta?.name?.endsWith('.csv')) {
      return <FileSpreadsheet className="w-7 h-7 text-emerald-600" />;
    }
    if (uploadedFileMeta?.name?.endsWith('.pdf')) {
      return <FileText className="w-7 h-7 text-rose-600" />;
    }
    if (uploadedFileMeta?.name?.endsWith('.doc') || uploadedFileMeta?.name?.endsWith('.docx')) {
      return <FileCheck className="w-7 h-7 text-blue-600" />;
    }
    return <FileText className="w-7 h-7 text-[#176B91]" />;
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {label}
          </label>
          <span className="text-[11px] font-medium text-slate-400">Max {maxSizeMB}MB</span>
        </div>
      )}

      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept || 'image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.csv'}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Uploaded State */}
      {previewUrl || (uploadedFileMeta && !error) ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 p-3.5 transition-all shadow-xs">
          <div className="flex items-center gap-3">
            {previewUrl && (previewUrl.startsWith('http') || previewUrl.startsWith('blob:') || previewUrl.startsWith('data:image')) ? (
              <img
                src={previewUrl}
                alt="File preview"
                className="w-14 h-14 rounded-xl object-cover border border-emerald-200 dark:border-emerald-800 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                {renderFileIcon()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Uploaded to Firebase Storage</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 truncate mt-0.5 font-semibold">
                {uploadedFileMeta?.name || 'Attached Document'}
              </p>
              {uploadedFileMeta?.size && (
                <p className="text-[11px] text-slate-400">
                  {(uploadedFileMeta.size / 1024).toFixed(1)} KB · Metadata saved to Firestore
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-600 transition-colors shrink-0 cursor-pointer"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Dropzone / Upload Box */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
            compact ? 'p-3' : 'p-5'
          } ${
            isDragging
              ? 'border-[#176B91] bg-sky-50 dark:bg-sky-950/30 ring-2 ring-[#176B91]/20'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:border-[#176B91] hover:bg-slate-50/80'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center py-2 w-full max-w-xs">
              <Loader2 className="w-8 h-8 text-[#176B91] animate-spin mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Uploading to Firebase Storage ({progress}%)
              </p>
              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-[#176B91] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Recording metadata in Firestore</p>
            </div>
          ) : (
            <>
              <div
                className={`${
                  compact ? 'w-8 h-8 rounded-lg mb-1' : 'w-11 h-11 rounded-xl mb-2'
                } bg-[#EAF6FC] dark:bg-slate-700 flex items-center justify-center text-[#176B91] dark:text-[#83CBEA] shadow-xs`}
              >
                <Upload className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
              </div>

              <p className={`${compact ? 'text-[11px]' : 'text-xs'} font-bold text-slate-800 dark:text-slate-200 mb-0.5`}>
                Drag &amp; drop file here, or <span className="text-[#176B91] underline">browse</span>
              </p>
              <p className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-slate-500 dark:text-slate-400 max-w-sm`}>
                {description}
              </p>
            </>
          )}
        </div>
      )}

      {/* Error & Retry Banner */}
      {error && (
        <div className="mt-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 truncate">
              {error}
            </p>
          </div>
          {failedFile && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] font-bold shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
