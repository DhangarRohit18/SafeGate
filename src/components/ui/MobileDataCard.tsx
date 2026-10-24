import React from 'react';

interface MobileDataCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  status?: React.ReactNode;
  attributes?: { label: string; value: React.ReactNode }[];
  actions?: React.ReactNode;
  onClick?: () => void;
}

export const MobileDataCard: React.FC<MobileDataCardProps> = ({
  title,
  subtitle,
  status,
  attributes = [],
  actions,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
        padding: '1rem',
        marginBottom: '0.75rem',
        boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem', minWidth: 0 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--aarizo-text, #1E293B)', wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: 1.35 }}>{title}</div>
          {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #475569)', marginTop: '0.125rem', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{subtitle}</div>}
        </div>
        {status && <div style={{ flexShrink: 0 }}>{status}</div>}
      </div>

      {attributes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
          {attributes.map((attr, idx) => (
            <div key={idx} style={{ flex: '1 1 45%', minWidth: 0 }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #475569)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                {attr.label}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--aarizo-text, #1E293B)', fontWeight: 700, wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: 1.35 }}>
                {attr.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {actions && (
        <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid var(--aarizo-border-soft, #E8F1F5)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          {actions}
        </div>
      )}
    </div>
  );
};
