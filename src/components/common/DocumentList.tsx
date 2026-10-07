import React, { useState, useEffect } from 'react';
import {
  FileText,
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  Search,
  FileCheck,
  FileSpreadsheet,
  Calendar,
  User,
  Shield,
} from 'lucide-react';
import {
  fileStorageService,
} from '../../services/storage/fileStorageService';
import type { StoredDocument } from '../../repositories/documents/DocumentRepository';
import { FileUploader } from './FileUploader';
import { Modal } from '../ui/Modal';

export interface DocumentListProps {
  societyId?: string;
  entityType?: 'vendor' | 'resident' | 'maintenance' | 'admin' | 'general';
  entityId?: string;
  title?: string;
  allowUpload?: boolean;
  allowDelete?: boolean;
  canDelete?: boolean;
  className?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  societyId = 'soc-gvs',
  entityType,
  entityId,
  title = 'Documents & Attachments',
  allowUpload = true,
  allowDelete = true,
  canDelete,
  className = '',
}) => {
  const effectiveAllowDelete = canDelete !== undefined ? canDelete : allowDelete;
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Subscribe to live Firestore documents
    const unsubscribe = fileStorageService.subscribeDocuments(
      societyId,
      (docs) => {
        let filtered = docs;
        if (entityId) {
          filtered = docs.filter((d) => d.entityId === entityId);
        }
        setDocuments(filtered);
        setLoading(false);
      },
      entityType
    );

    return () => unsubscribe();
  }, [societyId, entityType, entityId]);

  const handleDelete = async (docId: string, storagePath?: string) => {
    if (!window.confirm('Are you sure you want to remove this document?')) return;
    setDeletingId(docId);
    try {
      await fileStorageService.deleteDocument(docId, storagePath);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error('Delete document failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.uploaderName && doc.uploaderName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderDocIcon = (doc: StoredDocument) => {
    if (doc.type === 'IMAGE' || doc.mimeType?.startsWith('image/')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
      );
    }
    if (doc.type === 'SPREADSHEET' || doc.name.endsWith('.xls') || doc.name.endsWith('.xlsx') || doc.name.endsWith('.csv')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
      );
    }
    if (doc.type === 'PDF' || doc.name.endsWith('.pdf')) {
      return (
        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-[#EAF6FC] dark:bg-sky-950/40 text-[#176B91] flex items-center justify-center shrink-0">
        <FileCheck className="w-5 h-5" />
      </div>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--aarizo-border, #DCE8EF)',
        borderRadius: '16px',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
      }}
      className={className}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-[#F06543] shrink-0" />
            <h3 className="text-sm font-extrabold text-[#083B56] leading-tight">
              {title}
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EAF6FC] text-[#083B56] border border-[#DCE8EF] shrink-0">
              {documents.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Cloud verified storage with live Firestore audit synchronization
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {documents.length > 3 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                style={{ paddingLeft: '2.25rem' }}
                className="pr-3 py-1.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-slate-800 w-36 sm:w-44 focus:outline-none focus:border-[#F06543]"
              />
            </div>
          )}

          {allowUpload && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              style={{
                background: '#F06543',
                color: '#ffffff',
                fontWeight: 800,
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#F06543]" />
          <p className="text-xs font-medium">Syncing documents from Firestore...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="py-8 px-4 text-center border-2 border-dashed border-[#DCE8EF] bg-[#F7FBFE] rounded-xl flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#EAF6FC] border border-[#DCE8EF] flex items-center justify-center mb-2 text-[#F06543]">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-xs font-extrabold text-[#083B56]">No documents found</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {allowUpload ? 'Click "Upload Document" to attach files.' : 'No attachments available.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] hover:border-[#F06543]/40 transition-all gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {renderDocIcon(doc)}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#083B56] truncate" title={doc.name}>
                    {doc.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-medium">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                    {doc.uploaderName && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 truncate max-w-[80px]">
                          <User className="w-3 h-3" />
                          {doc.uploaderName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {doc.downloadUrl && (
                  <a
                    href={doc.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#176B91] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="View / Download"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {effectiveAllowDelete && (
                  <button
                    type="button"
                    disabled={deletingId === doc.id}
                    onClick={() => handleDelete(doc.id, doc.storagePath)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Delete document"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Document to Society Vault"
      >
        <div className="space-y-4">
          <FileUploader
            societyId={societyId}
            entityType={entityType}
            entityId={entityId}
            onUploadSuccess={() => {
              setIsUploadModalOpen(false);
            }}
          />
        </div>
      </Modal>
    </div>
  );
};
