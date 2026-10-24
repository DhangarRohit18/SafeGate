import React, { useState } from 'react';
import type { SecretaryResidentRecord } from '../../../domains/secretary/types';
import { UserCheck, UserX, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import '../secretary.css';

interface ResidentApprovalModalProps {
  resident: SecretaryResidentRecord;
  onClose: () => void;
  onApprove: (id: string, note?: string) => void;
  onReject: (id: string, reason: string) => void;
}

export const ResidentApprovalModal: React.FC<ResidentApprovalModalProps> = ({
  resident,
  onClose,
  onApprove,
  onReject,
}) => {
  const [mode, setMode] = useState<'review' | 'reject'>('review');
  const [approvalNote, setApprovalNote] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('Invalid Ownership Document');
  const [customReason, setCustomReason] = useState<string>('');

  const handleApproveSubmit = () => {
    onApprove(resident.id, approvalNote.trim() || 'Ownership documents verified by Secretary.');
    onClose();
  };

  const handleRejectSubmit = () => {
    const finalReason =
      rejectionReason === 'Other' ? customReason.trim() || 'KYC requirements not met.' : rejectionReason;
    onReject(resident.id, finalReason);
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Resident Approval Audit"
      subtitle={`Application for ${resident.canonicalDisplay}`}
      icon={<UserCheck size={18} className="text-[#0284C7]" />}
      maxWidth="500px"
      footer={
        mode === 'review' ? (
          <div className="flex items-center justify-between gap-3 w-full">
            <button
              type="button"
              onClick={() => setMode('reject')}
              className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/60 text-rose-700 font-bold text-xs hover:bg-rose-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserX size={15} />
              <span>Reject</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleApproveSubmit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Approve Resident</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setMode('review')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleRejectSubmit}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert size={15} />
              <span>Confirm Rejection</span>
            </button>
          </div>
        )
      }
    >
      <div className="space-y-3.5">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[11px] font-bold">
              {resident.canonicalDisplay}
            </span>
            <span className={`text-[11px] font-bold ${resident.type === 'Owner' ? 'text-sky-700' : 'text-amber-700'}`}>
              {resident.type}
            </span>
          </div>
          <h4 className="m-0 text-sm font-bold text-[#083B56]">{resident.name}</h4>
          <p className="m-0 text-[11px] text-slate-500 mt-0.5">
            Submitted: {resident.submittedAt} • Phone: {resident.phone}
          </p>
        </div>

        <div className="bg-slate-100/70 p-3 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
            <FileText size={14} className="text-sky-600" />
            <span>Attached Document Verification</span>
          </div>
          <div className="text-slate-600 font-medium">
            📄 {resident.kycDocType || 'National ID & Rent Agreement'}
          </div>
        </div>

        {mode === 'review' ? (
          <div>
            <label className="block text-xs font-bold text-[#083B56] mb-1">
              Secretary Approval Note (Optional)
            </label>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F06543]"
              placeholder="e.g. Verified flat sale deed with registrar records..."
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
              <ShieldAlert size={16} />
              <span>Select Application Rejection Reason</span>
            </div>

            <select
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            >
              <option value="Invalid Ownership Document">Invalid Ownership Document</option>
              <option value="Unmatched Flat / Unit Records">Unmatched Flat / Unit Records</option>
              <option value="Expired Rent Agreement">Expired Rent Agreement</option>
              <option value="Incomplete KYC Identification">Incomplete KYC Identification</option>
              <option value="Other">Other Custom Reason</option>
            </select>

            {rejectionReason === 'Other' && (
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500"
                placeholder="Type specific rejection reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

