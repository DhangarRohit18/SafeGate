import React from 'react';
import { Inbox, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
      <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed font-medium">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-[#083B56] hover:bg-[#176B91] text-white text-xs font-semibold rounded-xl shadow transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
