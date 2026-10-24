import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) => {
  const getButtonBg = () => {
    switch (variant) {
      case 'danger':
        return 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)';
      case 'warning':
        return 'linear-gradient(135deg, #D97706 0%, #B45309 100%)';
      default:
        return 'linear-gradient(135deg, #176B91 0%, #0E4864 100%)';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="440px"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              border: 'none',
              background: getButtonBg(),
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              boxShadow: variant === 'danger' ? '0 4px 14px rgba(220, 38, 38, 0.3)' : '0 4px 14px rgba(23, 107, 145, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: variant === 'danger' ? '#FEF2F2' : variant === 'warning' ? '#FFFBEB' : '#EAF6FC',
            color: variant === 'danger' ? '#DC2626' : variant === 'warning' ? '#D97706' : '#176B91',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            border: variant === 'danger' ? '1px solid #FEE2E2' : '1px solid #E8F1F5',
          }}
        >
          <AlertTriangle size={26} strokeWidth={2.25} />
        </div>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: '#083B56', fontWeight: 800, wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: 1.35 }}>{title}</h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'break-word', fontWeight: 500 }}>{message}</p>
      </div>
    </Modal>
  );
};
