import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'right' | 'left' | 'bottom';
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  width = '85vw',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isBottom = position === 'bottom';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: isBottom ? 'center' : position === 'right' ? 'flex-end' : 'flex-start',
        alignItems: isBottom ? 'flex-end' : 'stretch',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: isBottom ? '100%' : width,
          maxWidth: '100%',
          maxHeight: isBottom ? '90vh' : '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          borderTopLeftRadius: isBottom ? '20px' : '0',
          borderTopRightRadius: isBottom ? '20px' : '0',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              minWidth: 0,
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', minWidth: 0, flex: 1, wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: 1.35 }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};
