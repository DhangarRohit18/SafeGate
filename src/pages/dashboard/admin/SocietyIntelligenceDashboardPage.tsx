import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Building2,
  Car,
  ShieldAlert,
  Wrench,
  Clock,
  DollarSign,
  TrendingUp,
  Store,
  HardHat,
  Package,
  Sparkles,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle2,
  Download,
  ArrowLeft,
} from 'lucide-react';
import { societyIntelligenceService } from '../../../services/societyIntelligenceService';
import type { DateRangePreset, IntelligenceAnalytics } from '../../../services/societyIntelligenceService';
import { SocietyHealthScoreCard, PracticalAIHub } from '../../../domains/analytics';

export const SocietyIntelligenceDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HEALTH' | 'AI_SUITE' | 'ANALYTICS'>('OVERVIEW');

  // Filters
  const [preset, setPreset] = useState<DateRangePreset>('30_DAYS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const analytics: IntelligenceAnalytics = useMemo(() => {
    return societyIntelligenceService.getAnalytics({
      preset,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }, [preset, startDate, endDate]);

  const { kpis, charts } = analytics;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleExportReport = () => {
    const reportData = JSON.stringify(analytics, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Society_Intelligence_Report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: '2.5rem' }}>
      {/* ── Subheader / Top Bar ── */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--aarizo-border, #DCE8EF)',
          padding: '0.875rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 1px 3px rgba(8, 59, 86, 0.03)',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--aarizo-card-blue, #F4FAFE)',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--aarizo-navy, #083B56)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Society Analytics &amp; Overview
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Operations &amp; financial insights
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleExportReport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.875rem',
              borderRadius: '10px',
              background: 'var(--aarizo-coral, #F06543)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            <Download size={15} /> Export Report
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 space-y-5">
        {/* ── Sub-Tab Navigation Bar - Integrated Segmented Control Container ── */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #DCE8EF',
            borderRadius: '16px',
            padding: '0.4rem',
            boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: 'OVERVIEW', label: 'Overview KPIs', icon: Activity },
              { key: 'HEALTH', label: 'Health Score', icon: ShieldAlert },
              { key: 'AI_SUITE', label: 'Practical AI', icon: Sparkles },
              { key: 'ANALYTICS', label: 'Analytics Graphs', icon: PieChart },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    background: active ? '#F06543' : '#F7FBFE',
                    color: active ? '#ffffff' : '#083B56',
                    border: active ? '1px solid #F06543' : '1px solid #DCE8EF',
                    borderRadius: '12px',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: active ? '0 3px 10px rgba(240, 101, 67, 0.28)' : 'none',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    transition: 'all 0.18s ease-in-out',
                  }}
                >
                  <Icon size={15} color={active ? '#ffffff' : '#F06543'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TAB 1: EXECUTIVE KPIS & TIME WINDOW FILTER ── */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-4">
            {/* Time Filter Control Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#083B56]">
                <Filter className="w-4 h-4 text-[#F06543]" />
                <span>Time Window:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { label: 'Today', value: 'TODAY' },
                    { label: '7 Days', value: '7_DAYS' },
                    { label: '30 Days', value: '30_DAYS' },
                    { label: '3 Months', value: '3_MONTHS' },
                    { label: 'Custom', value: 'CUSTOM' },
                  ] as { label: string; value: DateRangePreset }[]
                ).map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setPreset(item.value)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: preset === item.value ? '1px solid #F06543' : '1px solid #DCE8EF',
                      background: preset === item.value ? '#F06543' : '#F7FBFE',
                      color: preset === item.value ? '#ffffff' : '#083B56',
                      boxShadow: preset === item.value ? '0 2px 6px rgba(240, 101, 67, 0.25)' : 'none',
                      transition: 'all 0.15s ease-in-out',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {preset === 'CUSTOM' && (
                <div className="flex items-center gap-2 bg-[#F7FBFE] border border-[#DCE8EF] p-2 rounded-xl text-xs">
                  <Calendar className="w-3.5 h-3.5 text-[#F06543]" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white text-[#083B56] font-bold border border-[#DCE8EF] rounded px-2 py-1 text-xs"
                  />
                  <span className="text-slate-500 font-medium">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white text-[#083B56] font-bold border border-[#DCE8EF] rounded px-2 py-1 text-xs"
                  />
                </div>
              )}
            </div>

            {/* 15 Admin Executive KPIs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {/* KPI 1 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Residents</span>
                  <div className="p-2 rounded-xl bg-[#F4FAFE] border border-[#DCE8EF] text-[#083B56]">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#083B56]">{kpis.totalResidents}</div>
                  <div className="text-[11px] text-[#059669] font-extrabold mt-1">Verified Resident Accounts</div>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Visitors Today</span>
                  <div className="p-2 rounded-xl bg-[#F4FAFE] border border-[#DCE8EF] text-[#083B56]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#083B56]">{kpis.visitorsToday}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Total Pass Check-ins</div>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Visitors Inside</span>
                  <div className="p-2 rounded-xl bg-[#FFF5F2] border border-[#FDBA74] text-[#F06543]">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#F06543]">{kpis.visitorsInside}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Currently On Campus</div>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Vehicles Inside</span>
                  <div className="p-2 rounded-xl bg-[#F4FAFE] border border-[#DCE8EF] text-[#083B56]">
                    <Car className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#083B56]">{kpis.vehiclesInside}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Active Parking Passes</div>
                </div>
              </div>

              {/* KPI 5 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Parking Rate</span>
                  <div className="p-2 rounded-xl bg-[#F4FAFE] border border-[#DCE8EF] text-[#083B56]">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#083B56]">{kpis.parkingOccupancyRate}%</div>
                  <div className="w-full bg-[#EAF6FC] h-2 rounded-full mt-2 overflow-hidden border border-[#DCE8EF]">
                    <div
                      className="bg-[#F06543] h-full rounded-full"
                      style={{ width: `${Math.min(100, kpis.parkingOccupancyRate)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* KPI 6 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Open Tickets</span>
                  <div className="p-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626]">
                    <Wrench className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#DC2626]">{kpis.openComplaints}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Pending Maintenance</div>
                </div>
              </div>

              {/* KPI 7 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Maintenance SLA</span>
                  <div className="p-2 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669]">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#059669]">{kpis.maintenanceSlaCompliance}%</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">On-Time Resolution</div>
                </div>
              </div>

              {/* KPI 8 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
                  <div className="p-2 rounded-xl bg-[#F4FAFE] border border-[#DCE8EF] text-[#083B56]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#083B56]">{kpis.pendingApprovals}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Action Required</div>
                </div>
              </div>

              {/* KPI 9 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Monthly Collection</span>
                  <div className="p-2 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xl font-extrabold text-[#083B56]">{formatCurrency(kpis.monthlyCollection)}</div>
                  <div className="text-[11px] text-[#059669] font-extrabold mt-1">Billing Revenues</div>
                </div>
              </div>

              {/* KPI 10 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Outstanding Dues</span>
                  <div className="p-2 rounded-xl bg-[#FFF5F2] border border-[#FDBA74] text-[#F06543]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xl font-extrabold text-[#F06543]">{formatCurrency(kpis.outstandingDues)}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Pending Invoices</div>
                </div>
              </div>

              {/* KPI 11 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Active Vendors</span>
                  <div className="p-2 rounded-xl bg-[#F4FAFE] border border-[#DCE8EF] text-[#083B56]">
                    <Store className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#083B56]">{kpis.activeVendors}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Marketplace Partners</div>
                </div>
              </div>

              {/* KPI 12 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Worker Entries</span>
                  <div className="p-2 rounded-xl bg-[#F4FAFE] border border-[#DCE8EF] text-[#083B56]">
                    <HardHat className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#083B56]">{kpis.workerEntriesToday}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Domestic Help Checked-in</div>
                </div>
              </div>

              {/* KPI 13 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Deliveries Today</span>
                  <div className="p-2 rounded-xl bg-[#FFF5F2] border border-[#FDBA74] text-[#F06543]">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#083B56]">{kpis.deliveriesToday}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">E-Commerce &amp; Courier</div>
                </div>
              </div>

              {/* KPI 14 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Amenity Usage</span>
                  <div className="p-2 rounded-xl bg-[#F4FAFE] border border-[#DCE8EF] text-[#083B56]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#083B56]">{kpis.amenityUtilizationRate}%</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Slot Capacity Rate</div>
                </div>
              </div>

              {/* KPI 15 */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Emergencies</span>
                  <div className="p-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626]">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-[#DC2626]">{kpis.emergencyIncidents}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Platform SOS Logged</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: HEALTH SCORE CARD ── */}
        {activeTab === 'HEALTH' && <SocietyHealthScoreCard />}

        {/* ── TAB 3: PRACTICAL AI SUITE ── */}
        {activeTab === 'AI_SUITE' && <PracticalAIHub />}

        {/* ── TAB 4: VISUAL GRAPH ANALYTICS ── */}
        {activeTab === 'ANALYTICS' && (
          <div className="flex flex-col gap-6">
            {/* Row 1: Visitor Trends & Payment Collection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1 */}
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-2xs border border-[#DCE8EF]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-[#083B56] flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#F06543]" /> 1. Visitor Flow &amp; Delivery Trends
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Daily entry volume vs delivery portion</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#EAF6FC] text-[#083B56] border border-[#DCE8EF] font-extrabold">
                    Daily Entries
                  </span>
                </div>

                <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-[#DCE8EF]">
                  {charts.visitorTrends.map((pt, i) => {
                    const maxVal = Math.max(...charts.visitorTrends.map((p) => p.value), 1);
                    const heightPct = Math.round((pt.value / maxVal) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="w-full bg-[#F4FAFE] border border-[#DCE8EF] rounded-t h-full flex items-end">
                          <div
                            className="w-full bg-[#F06543] rounded-t transition-all duration-300"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#083B56] font-bold truncate w-full text-center">{pt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2 */}
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-2xs border border-[#DCE8EF]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-[#083B56] flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#059669]" /> 2. Payment Collection &amp; Dues
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Monthly breakdown (Collected vs Outstanding)</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-[#059669] font-extrabold">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#059669] inline-block" /> Collected
                    </span>
                    <span className="flex items-center gap-1 text-[#F06543] font-extrabold">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F06543] inline-block" /> Outstanding
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {charts.paymentCollection.map((pt, i) => {
                    const total = (pt.value || 0) + (pt.secondaryValue || 0);
                    const collectedPct = total > 0 ? Math.round((pt.value / total) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-extrabold">
                          <span className="text-[#083B56]">{pt.label}</span>
                          <span className="text-slate-500">
                            {formatCurrency(pt.value)} / {formatCurrency(total)}
                          </span>
                        </div>
                        <div className="w-full bg-[#EAF6FC] h-3 rounded-full overflow-hidden border border-[#DCE8EF] flex">
                          <div className="bg-[#059669] h-full" style={{ width: `${collectedPct}%` }} />
                          <div className="bg-[#F06543] h-full" style={{ width: `${100 - collectedPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row 2: Maintenance Trends & Parking Utilization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 3 */}
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-2xs border border-[#DCE8EF]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-[#083B56] flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#DC2626]" /> 3. Maintenance Ticket Lifecycle
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Current ticket status distribution</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  {charts.maintenanceTrends.map((pt, i) => {
                    const colors: Record<string, { bg: string; text: string; border: string }> = {
                      OPEN: { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', border: 'border-[#FECACA]' },
                      IN_PROGRESS: { bg: 'bg-[#FFF5F2]', text: 'text-[#F06543]', border: 'border-[#FDBA74]' },
                      COMPLETED: { bg: 'bg-[#ECFDF5]', text: 'text-[#059669]', border: 'border-[#A7F3D0]' },
                      CLOSED: { bg: 'bg-[#F4FAFE]', text: 'text-[#083B56]', border: 'border-[#DCE8EF]' },
                    };
                    const style = colors[pt.category || 'OPEN'] || colors.OPEN;

                    return (
                      <div key={i} className={`p-4 rounded-xl border ${style.bg} ${style.border} text-center`}>
                        <div className={`text-2xl font-black ${style.text}`}>{pt.value}</div>
                        <div className="text-xs font-extrabold text-[#083B56] mt-1">{pt.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 4 */}
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-2xs border border-[#DCE8EF]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-[#083B56] flex items-center gap-2">
                      <Car className="w-4 h-4 text-[#083B56]" /> 4. Parking Space Allocation &amp; Occupancy
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Distribution across resident, visitor, and vacant slots</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {charts.parkingUtilization.map((pt, i) => {
                    const colors = ['bg-[#083B56]', 'bg-[#F06543]', 'bg-[#657785]'];
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-extrabold">
                          <span className="text-[#083B56]">{pt.label}</span>
                          <span className="text-slate-500">
                            {pt.value} Slots ({pt.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#EAF6FC] h-2.5 rounded-full overflow-hidden border border-[#DCE8EF]">
                          <div
                            className={`${colors[i % colors.length]} h-full rounded-full`}
                            style={{ width: `${pt.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row 3: Amenity Usage & Complaint Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 5 */}
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-2xs border border-[#DCE8EF]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-[#083B56] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#F06543]" /> 5. Amenity Booking Breakdown
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Total reservations logged per amenity facility</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {charts.amenityUsage.map((pt, i) => {
                    const maxVal = Math.max(...charts.amenityUsage.map((p) => p.value), 1);
                    const pct = Math.round((pt.value / maxVal) * 100);
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 text-xs">
                        <span className="w-32 font-extrabold text-[#083B56] truncate">{pt.label}</span>
                        <div className="flex-1 bg-[#EAF6FC] h-2.5 rounded-full overflow-hidden border border-[#DCE8EF]">
                          <div
                            className="bg-[#083B56] h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-extrabold text-[#083B56]">{pt.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 6 */}
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-2xs border border-[#DCE8EF]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-[#083B56] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#083B56]" /> 6. Complaint Categories Breakdown
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Issues reported by operational domain</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {charts.complaintCategories.map((pt, i) => {
                    const maxVal = Math.max(...charts.complaintCategories.map((p) => p.value), 1);
                    const pct = Math.round((pt.value / maxVal) * 100);
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 text-xs">
                        <span className="w-36 font-extrabold text-[#083B56] truncate">{pt.label}</span>
                        <div className="flex-1 bg-[#EAF6FC] h-2.5 rounded-full overflow-hidden border border-[#DCE8EF]">
                          <div
                            className="bg-[#F06543] h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-extrabold text-[#083B56]">{pt.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row 4: Worker Attendance Trends */}
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-2xs border border-[#DCE8EF]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-[#083B56] flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-[#F06543]" /> 7. Staff &amp; Worker Daily Attendance Flow
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Daily present staff vs absent count</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-[#059669] font-extrabold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#059669] inline-block" /> Present
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 font-extrabold">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Absent
                  </span>
                </div>
              </div>

              <div className="h-44 flex items-end justify-between gap-3 pt-4 border-b border-[#DCE8EF]">
                {charts.workerAttendance.map((pt, i) => {
                  const total = (pt.value || 0) + (pt.secondaryValue || 0);
                  const presentPct = total > 0 ? Math.round((pt.value / total) * 100) : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="w-full bg-[#F4FAFE] border border-[#DCE8EF] rounded-t h-full flex items-end">
                        <div
                          className="w-full bg-[#083B56] rounded-t transition-all duration-300"
                          style={{ height: `${presentPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#083B56] font-bold truncate w-full text-center">{pt.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocietyIntelligenceDashboardPage;
