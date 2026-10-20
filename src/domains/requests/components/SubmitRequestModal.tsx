import React, { useState } from 'react';
import type { SocietyRequestCategory } from '../types';
import { FileUpload } from '../../../components/ui/FileUpload';
import { Modal } from '../../../components/ui/Modal';
import { FileText, CheckCircle2, Send, Tag, Clock } from 'lucide-react';

interface SubmitRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleCreateRequest: (e: React.FormEvent) => void;
  newTitle: string;
  setNewTitle: (v: string) => void;
  newCategory: SocietyRequestCategory;
  setNewCategory: (v: any) => void;
  newDescription: string;
  setNewDescription: (v: string) => void;
  newPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  setNewPriority: (v: any) => void;
  newFileName: string;
  setNewFileName: (v: string) => void;
  newFileUrl?: string;
  setNewFileUrl?: (v: string) => void;
}

export const SubmitRequestModal: React.FC<SubmitRequestModalProps> = ({
  isOpen,
  onClose,
  handleCreateRequest,
  newTitle,
  setNewTitle,
  newCategory,
  setNewCategory,
  newDescription,
  setNewDescription,
  newPriority,
  setNewPriority,
  newFileName,
  setNewFileName,
  newFileUrl,
  setNewFileUrl,
}) => {
  const [uploadedUrl, setUploadedUrl] = useState<string>(newFileUrl || '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit New Request / NOC"
      subtitle="Apply for society certificates, approvals, and permissions"
      icon={<FileText size={20} />}
      maxWidth="540px"
      footer={
        <div style={{ display: 'flex', gap: '0.625rem', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              background: '#FFFFFF',
              border: '1px solid #DCE8EF',
              color: '#475569',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              minHeight: '44px',
              transition: 'all 0.15s ease',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="societyRequestForm"
            style={{
              flex: 1.5,
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: 'var(--aarizo-coral, #F06543)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.8125rem',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
              minHeight: '44px',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <Send size={15} />
            <span>Submit Request</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleCreateRequest} id="societyRequestForm" className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Request Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Balcony Grill Expansion Permission"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.875rem',
              borderRadius: '12px',
              background: '#F8FAFC',
              border: '1px solid #DCE8EF',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#083B56',
              outline: 'none',
            }}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Tag size={13} className="text-[#0284C7]" />
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.65rem 0.875rem',
                borderRadius: '12px',
                background: '#F8FAFC',
                border: '1px solid #DCE8EF',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#083B56',
                outline: 'none',
              }}
            >
              <option value="NOC">No Objection Certificate (NOC)</option>
              <option value="TENANT_REGISTRATION">Tenant Registration</option>
              <option value="OWNERSHIP_CHANGE">Ownership Transfer</option>
              <option value="RENOVATION_PERMISSION">Renovation Permit</option>
              <option value="EVENT_PERMISSION">Lawn / Hall Event</option>
              <option value="PARKING_REQUEST">Parking Allocation</option>
              <option value="SOCIETY_CERTIFICATE">Society Certificate</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Clock size={13} className="text-[#F06543]" />
              Priority Level
            </label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.65rem 0.875rem',
                borderRadius: '12px',
                background: '#F8FAFC',
                border: '1px solid #DCE8EF',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#083B56',
                outline: 'none',
              }}
            >
              <option value="LOW">Low (72 hrs)</option>
              <option value="MEDIUM">Medium (48 hrs)</option>
              <option value="HIGH">High (24 hrs)</option>
              <option value="URGENT">Urgent (Immediate)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Description &amp; Details <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Provide complete explanation for committee review..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.875rem',
              borderRadius: '12px',
              background: '#F8FAFC',
              border: '1px solid #DCE8EF',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: '#083B56',
              outline: 'none',
            }}
            required
          />
        </div>

        {/* File Upload Section */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileText size={14} className="text-[#0284C7]" />
            Supporting Document / Agreement (Optional)
          </label>

          <FileUpload
            label=""
            category="general"
            accept="application/pdf,image/*"
            currentUrl={uploadedUrl}
            onUploadSuccess={(url, filename) => {
              setUploadedUrl(url);
              setNewFileName(filename);
              if (setNewFileUrl) setNewFileUrl(url);
            }}
            onRemove={() => {
              setUploadedUrl('');
              setNewFileName('');
              if (setNewFileUrl) setNewFileUrl('');
            }}
          />

          {newFileName && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span className="truncate">Attached: <strong>{newFileName}</strong></span>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
