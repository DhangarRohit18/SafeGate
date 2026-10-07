import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Search } from 'lucide-react';

// ── 1. PageHero Component ──
export interface PageHeroProps {
  icon: LucideIcon | React.ElementType;
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeType?: 'active' | 'warning' | 'info' | 'neutral';
  actions?: React.ReactNode;
}

export const PageHero: React.FC<PageHeroProps> = ({
  icon: Icon,
  title,
  subtitle,
  badgeText,
  badgeType = 'active',
  actions,
}) => {
  return (
    <div className="bg-gradient-to-r from-[#083B56] via-[#0D4767] to-[#231715] text-white rounded-2xl p-4 sm:p-5 shadow-md mb-5 border border-white/10 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-[#E5B842] shrink-0 shadow-inner">
            <Icon size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white m-0">
                {title}
              </h1>
              {badgeText && (
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    badgeType === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : badgeType === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                      : badgeType === 'info'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                      : 'bg-white/10 text-slate-200 border-white/20'
                  }`}
                >
                  {badgeText}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-medium m-0 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};

// ── 2. StatCard Component ──
export interface StatCardProps {
  icon: LucideIcon | React.ElementType;
  value: string | number;
  label: string;
  subtext?: string;
  colorTheme?: 'coral' | 'gold' | 'emerald' | 'amber' | 'rose' | 'navy';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  subtext,
  colorTheme = 'coral',
  onClick,
}) => {
  const themeClasses = {
    coral: 'bg-[#FFF0EC] text-[#F06543]',
    gold: 'bg-[#FEF9E7] text-[#D97706]',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    navy: 'bg-slate-100 text-[#083B56]',
  }[colorTheme];

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm hover:border-[#F06543]/40 transition-all ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${themeClasses}`}>
          <Icon size={18} />
        </div>
        {subtext && <span className="text-[10px] font-bold text-slate-400">{subtext}</span>}
      </div>
      <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-0.5">{value}</div>
      <div className="text-xs font-bold text-slate-500 truncate">{label}</div>
    </div>
  );
};

// ── 3. SegmentedTabs Component ──
export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon | React.ElementType;
}

export interface SegmentedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 border border-slate-300/50 rounded-xl overflow-x-auto scrollbar-none mb-4">
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center ${
              isSelected
                ? 'bg-[#231715] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
            }`}
          >
            {Icon && <Icon size={14} className={isSelected ? 'text-[#E5B842]' : 'text-slate-400'} />}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-300/80 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ── 4. StatusBadge Component ──
export type StatusType =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'ACTIVE'
  | 'OPEN'
  | 'SLA_BREACHED'
  | 'ON_DUTY'
  | 'OFF_DUTY'
  | 'DUE'
  | 'PAID'
  | 'OVERDUE'
  | string;

export const StatusBadge: React.FC<{ status: StatusType; text?: string }> = ({ status, text }) => {
  const normalized = (status || '').toUpperCase();
  const label = text || status;

  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['APPROVED', 'RESOLVED', 'ACTIVE', 'ON_DUTY', 'PAID', 'SUCCESS', 'VERIFIED'].includes(normalized)) {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold';
  } else if (['PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'DUE'].includes(normalized)) {
    style = 'bg-amber-50 text-amber-700 border-amber-200 font-extrabold';
  } else if (['REJECTED', 'SLA_BREACHED', 'OVERDUE', 'BLOCKED', 'MISSING', 'HIGH'].includes(normalized)) {
    style = 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold';
  } else if (['OPEN', 'INFO'].includes(normalized)) {
    style = 'bg-sky-50 text-sky-700 border-sky-200 font-extrabold';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] border ${style}`}>
      {label}
    </span>
  );
};

// ── 5. Reusable FilterBar Component ──
export interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  children,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-4">
      <div className="relative w-full sm:w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F06543]"
        />
      </div>
      {children && <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">{children}</div>}
    </div>
  );
};
