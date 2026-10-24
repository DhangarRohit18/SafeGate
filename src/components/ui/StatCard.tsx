import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType | React.ReactNode;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  onClick?: () => void;
  className?: string;
}

const COLOR_MAP = {
  blue: {
    bg: 'bg-[#EAF6FC] dark:bg-sky-950/40',
    text: 'text-[#176B91] dark:text-[#83CBEA]',
    border: 'hover:border-[#176B91]/30',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'hover:border-emerald-500/30',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'hover:border-amber-500/30',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'hover:border-rose-500/30',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'hover:border-purple-500/30',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'hover:border-slate-400/30',
  },
};

const VARIANT_TO_COLOR: Record<string, keyof typeof COLOR_MAP> = {
  primary: 'blue',
  success: 'emerald',
  warning: 'amber',
  danger: 'rose',
  info: 'blue',
  neutral: 'slate',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
  variant,
  onClick,
  className = '',
}) => {
  const resolvedColor = color || (variant ? VARIANT_TO_COLOR[variant] : 'blue');
  const styles = COLOR_MAP[resolvedColor] || COLOR_MAP.blue;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-2xs transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      } ${styles.border} ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2 min-w-0">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 truncate min-w-0 flex-1">
          {title}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${styles.bg} ${styles.text} flex items-center justify-center shrink-0`}>
            {React.isValidElement(Icon) ? (
              Icon
            ) : (
              React.createElement(Icon as React.ElementType, { className: 'w-4 h-4' })
            )}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 min-w-0">
        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums whitespace-nowrap">
          {value}
        </span>
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-2 pt-1 text-xs min-w-0">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold shrink-0 ${
                trend.isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{trend.value}</span>
            </span>
          )}
          {subtitle && (
            <span className="text-slate-600 dark:text-slate-300 font-medium truncate min-w-0 flex-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
