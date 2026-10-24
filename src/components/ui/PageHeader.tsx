import React from 'react';
import { RealtimeSyncBadge } from '../common/RealtimeSyncBadge';
import type { SyncState } from '../../hooks/useFirestoreRealtime';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType | React.ReactNode;
  syncStatus?: SyncState;
  onReconnect?: () => void;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  syncStatus,
  onReconnect,
  breadcrumbs,
  actions,
  badge,
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {/* Optional Breadcrumb navigation */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="hover:text-[#176B91] dark:hover:text-[#83CBEA] transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-[#EAF6FC] dark:bg-sky-950/50 text-[#176B91] dark:text-[#83CBEA] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              {React.isValidElement(Icon) ? (
                Icon
              ) : (
                React.createElement(Icon as React.ElementType, { className: 'w-5 h-5' })
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white break-words">
                {title}
              </h1>
              {badge}
              {syncStatus && (
                <RealtimeSyncBadge status={syncStatus} onReconnect={onReconnect} />
              )}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed break-words">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons Slot */}
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
