import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="480px"
      icon={
        <AlertTriangle
          className={`w-5 h-5 ${isDestructive ? 'text-rose-600' : 'text-[#F06543]'}`}
        />
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-[#F06543] hover:bg-[#d85434]'
            }`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="py-1">
        <p className="text-xs text-slate-600 leading-relaxed font-medium">{message}</p>
      </div>
    </Modal>
  );
};

