import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: 'var(--aarizo-success-bg, #EDF8F0)', color: '#166534', border: '#bbf7d0' };
      case 'warning':
        return { bg: 'var(--aarizo-warning-bg, #FFF8E8)', color: '#92400E', border: '#fde68a' };
      case 'danger':
        return { bg: 'var(--aarizo-danger-bg, #FFF0F1)', color: '#991B1B', border: '#fecaca' };
      case 'info':
        return { bg: 'var(--aarizo-info-bg, #EAF6FC)', color: '#075985', border: '#bae6fd' };
      case 'purple':
        return { bg: '#F4FAFE', color: '#075985', border: '#d0e5f2' };
      default:
        return { bg: 'var(--aarizo-pale-blue, #F4FAFE)', color: '#334155', border: 'var(--aarizo-border, #DCE8EF)' };
    }
  };

  const style = getColors();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: size === 'sm' ? '0.15rem 0.5rem' : '0.2rem 0.65rem',
        fontSize: size === 'sm' ? '0.6875rem' : '0.75rem',
        fontWeight: 700,
        borderRadius: '9999px',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
        lineHeight: 1.25,
        maxWidth: '100%',
        verticalAlign: 'middle',
      }}
    >
      {icon}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', display: 'inline-block' }}>
        {label}
      </span>
    </span>
  );
};
