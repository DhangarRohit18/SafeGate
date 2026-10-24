import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = '560px',
  className = '',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const modalNode = (
    <div
      role="dialog"
      aria-modal="true"
      className="modal-overlay fixed inset-0 z-50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999, // Guarantees overlay is above bottom nav (z-100/999) and all page chrome
        backgroundColor: 'rgba(8, 26, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        boxSizing: 'border-box',
        animation: 'aarizoModalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      onClick={(e) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={contentRef}
        className={`aarizo-general-modal modal-content ${className}`}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: 'min(88vh, 760px)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 65px -12px rgba(8, 59, 86, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          overflow: 'hidden',
          animation: 'aarizoModalScaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          margin: 'auto',
          alignSelf: 'center',
          boxSizing: 'border-box',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div
            style={{
              padding: '1.125rem 1.25rem',
              borderBottom: '1px solid #E8F1F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              background: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
              {icon && (
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '14px',
                    backgroundColor: '#FFF0EC',
                    color: '#F06543',
                    border: '1px solid #FDF0ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#083B56',
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                    wordBreak: 'break-word',
                  }}
                >
                  {title}
                </h3>
                {subtitle && (
                  <p
                    style={{
                      margin: '0.2rem 0 0 0',
                      fontSize: '0.75rem',
                      color: '#657785',
                      fontWeight: 500,
                      wordBreak: 'break-word',
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              type="button"
              style={{
                background: '#F4FAFE',
                border: '1px solid #E8F1F5',
                color: '#657785',
                cursor: 'pointer',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#EAF6FC';
                e.currentTarget.style.color = '#083B56';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F4FAFE';
                e.currentTarget.style.color = '#657785';
              }}
            >
              <X size={18} strokeWidth={2.25} />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div
          className={`aarizo-modal-body ${!footer ? 'aarizo-modal-body-no-footer' : ''}`}
          style={{
            padding: footer ? '1.25rem 1.5rem 1.25rem 1.5rem' : '1.25rem 1.5rem 2.5rem 1.5rem',
            overflowY: 'auto',
            overflowX: 'hidden',
            flex: '1 1 auto',
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
            boxSizing: 'border-box',
            maxWidth: '100%',
          }}
        >
          {children}
        </div>

        {/* Sticky Action Footer */}
        {footer && (
          <div
            className="aarizo-modal-footer"
            style={{
              padding: '1.125rem 1.75rem 1.5rem 1.75rem',
              borderTop: '1px solid #E8F1F5',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              flexShrink: 0,
              minHeight: '74px',
              boxSizing: 'border-box',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes aarizoModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes aarizoModalScaleUp {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .aarizo-modal-body > * {
          max-width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 640px) {
          .aarizo-general-modal {
            max-height: 92vh !important;
            border-radius: 20px !important;
            width: calc(100% - 16px) !important;
            margin: auto !important;
          }
          .aarizo-modal-body {
            padding: 1rem 0.875rem !important;
          }
          .aarizo-modal-footer {
            padding: 0.875rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px)) 1rem !important;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalNode, document.body);
};

/* Reusable Choice/Segment Pills component for standard forms */
export interface ChoicePillOption<T extends string | number = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface ChoicePillsProps<T extends string | number = string> {
  options: ChoicePillOption<T>[];
  value: T;
  onChange: (val: T) => void;
  columns?: number;
  size?: 'sm' | 'md';
}

export const ChoicePills = <T extends string | number>({
  options,
  value,
  onChange,
  columns,
  size = 'md',
}: ChoicePillsProps<T>) => {
  const isGrid = !!columns;
  return (
    <div
      style={{
        display: isGrid ? 'grid' : 'flex',
        gridTemplateColumns: isGrid ? `repeat(${columns}, minmax(0, 1fr))` : undefined,
        gap: '0.5rem',
        overflowX: isGrid ? undefined : 'auto',
        paddingBottom: isGrid ? undefined : '0.25rem',
        scrollbarWidth: 'none',
      }}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: size === 'sm' ? '0.5rem 0.75rem' : '0.625rem 0.875rem',
              borderRadius: '14px',
              border: isSelected ? '2px solid #F06543' : '1px solid #E2E8F0',
              backgroundColor: isSelected ? '#FFF0EC' : '#FFFFFF',
              color: isSelected ? '#F06543' : '#334155',
              fontWeight: isSelected ? 800 : 600,
              fontSize: '0.75rem',
              textAlign: opt.description ? 'left' : 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: opt.description ? 'normal' : 'nowrap',
              display: 'flex',
              flexDirection: opt.description ? 'column' : 'row',
              alignItems: opt.description ? 'flex-start' : 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              boxShadow: isSelected ? '0 2px 8px rgba(240, 101, 67, 0.15)' : 'none',
            }}
          >
            {opt.icon && <span>{opt.icon}</span>}
            <span style={{ lineHeight: 1.2 }}>{opt.label}</span>
            {opt.description && (
              <span style={{ fontSize: '0.65rem', opacity: 0.75, fontWeight: 500 }}>{opt.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

