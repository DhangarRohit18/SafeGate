import React, { useState, useEffect } from 'react';
import {
  Droplet,
  Zap,
  ArrowUpRight,
  Wifi,
  Trash2,
  Sparkles,
  Waves,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Edit3,
  History,
  Radio,
  Cpu,
} from 'lucide-react';
import { societyOperationsService } from '../services/societyOperationsService';
import type { UtilityItem, OutageHistoryRecord, SocietyOperationsSummary, UtilityCategory, OperationsStatus } from '../types';
import { useAuth } from '../../../context/AuthContext';
import { realTimeSync } from '../../../services/realTimeSync';
import { Modal } from '../../../components/ui/Modal';

const CATEGORY_ICONS: Record<UtilityCategory, any> = {
  WATER: Droplet,
  POWER: Zap,
  LIFT: ArrowUpRight,
  EV: Zap,
  INTERNET: Wifi,
  GARBAGE: Trash2,
  CLEANING: Sparkles,
  SWIMMING_POOL: Waves,
  COMMON_AREAS: Building2,
};

interface SocietyOperationsBoardProps {
  hideHeader?: boolean;
}

export const SocietyOperationsBoard: React.FC<SocietyOperationsBoardProps> = ({ hideHeader = false }) => {
  const { currentUser } = useAuth();
  const activeRole = (currentUser?.role || '').toLowerCase();
  const isAdminOrFacility = ['admin', 'secretary', 'facility_manager'].includes(activeRole);

  const [activeTab, setActiveTab] = useState<'LIVE_BOARD' | 'OUTAGE_HISTORY' | 'IOT_TERMINAL'>('LIVE_BOARD');
  const [summary, setSummary] = useState<SocietyOperationsSummary>(() => societyOperationsService.getSummary());
  const [utilities, setUtilities] = useState<UtilityItem[]>(() => societyOperationsService.getUtilities());
  const [outages, setOutages] = useState<OutageHistoryRecord[]>(() => societyOperationsService.getOutageHistory());

  const [selectedUtility, setSelectedUtility] = useState<UtilityItem | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Update Form
  const [updateStatus, setUpdateStatus] = useState<OperationsStatus>('NORMAL');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateMetric, setUpdateMetric] = useState('');

  // IoT Simulator Form
  const [iotForm, setIotForm] = useState({
    category: 'WATER' as UtilityCategory,
    sensorId: 'SENSOR-WATER-TANK-01',
    metricValue: 'Water Level Critical (12% Drop)',
    suggestedStatus: 'DEGRADED' as OperationsStatus,
  });

  const loadData = () => {
    setSummary(societyOperationsService.getSummary());
    setUtilities(societyOperationsService.getUtilities());
    setOutages(societyOperationsService.getOutageHistory());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = realTimeSync.subscribe('UTILITY_STATUS_UPDATED', () => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUtility) return;

    societyOperationsService.updateUtilityStatus(
      selectedUtility.id,
      updateStatus,
      updateNotes,
      updateMetric,
      currentUser?.name || 'Facility Manager'
    );

    setIsUpdateModalOpen(false);
    loadData();
    alert('Operations Board status updated in real-time across society dashboards.');
  };

  const handleSimulateIoT = (e: React.FormEvent) => {
    e.preventDefault();
    societyOperationsService.ingestIoTSensorPayload({
      sensorId: iotForm.sensorId,
      category: iotForm.category,
      metricValue: iotForm.metricValue,
      suggestedStatus: iotForm.suggestedStatus,
      rawPayload: { sensorId: iotForm.sensorId, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });

    loadData();
    alert(`IoT Sensor Payload [${iotForm.sensorId}] ingested! Operations status updated.`);
  };

  const getStatusBadge = (status: OperationsStatus) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full flex items-center gap-1">
            <CheckCircle2 size={13} /> NORMAL
          </span>
        );
      case 'RESTORED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
            <CheckCircle2 size={13} /> RESTORED
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-700 rounded-full flex items-center gap-1">
            <AlertTriangle size={13} /> DEGRADED
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-[#EAF6FC] text-[#083B56] rounded-full flex items-center gap-1">
            <Clock size={13} /> MAINTENANCE
          </span>
        );
      case 'OUTAGE':
        return (
          <span className="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-800 rounded-full flex items-center gap-1 animate-pulse">
            <XCircle size={13} /> OUTAGE
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header Banner - Clean Minimal Style */}
      {!hideHeader && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: 'var(--aarizo-card-blue, #F4FAFE)',
                border: '1px solid var(--aarizo-border, #DCE8EF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--aarizo-navy, #083B56)',
              }}
            >
              <Radio size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.01em' }}>
                Society Operations Centre &amp; Live Utility Health Board
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
                Live status board for 9 key utility categories with real-time resident streams &amp; IoT event mapping.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={loadData}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '10px',
                background: 'var(--aarizo-card-blue, #F4FAFE)',
                border: '1px solid var(--aarizo-border, #DCE8EF)',
                color: 'var(--aarizo-navy, #083B56)',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={14} /> Refresh Live Stream
            </button>
          </div>
        </div>
      )}

      {/* Operations Uptime Metrics Cards - Clean Mobile Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {/* Overall Uptime Health Score Card */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1rem', boxShadow: '0 2px 6px rgba(8, 59, 86, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#657785' }}>
                Overall Society Uptime
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.15rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#083B56', lineHeight: 1 }}>
                  {summary.overallUptimePercent}%
                </span>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: summary.overallUptimePercent >= 90 ? '#059669' : summary.overallUptimePercent >= 70 ? '#D97706' : '#DC2626',
                  background: summary.overallUptimePercent >= 90 ? '#ECFDF5' : summary.overallUptimePercent >= 70 ? '#FFFBEB' : '#FEF2F2',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  border: `1px solid ${summary.overallUptimePercent >= 90 ? '#A7F3D0' : summary.overallUptimePercent >= 70 ? '#FDE68A' : '#FECACA'}`,
                }}>
                  {summary.overallUptimePercent >= 90 ? 'Optimal Operations' : summary.overallUptimePercent >= 70 ? 'Degraded Services' : 'Critical Outage'}
                </span>
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '12px', background: '#F4FAFE', border: '1px solid #DCE8EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#083B56' }}>
              <Radio size={22} />
            </div>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#EAF6FC', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: '9999px',
                width: `${summary.overallUptimePercent}%`,
                background: summary.overallUptimePercent >= 90 ? '#059669' : summary.overallUptimePercent >= 70 ? '#D97706' : '#DC2626',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* 2x2 Clean Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #DCE8EF', padding: '0.75rem 1rem', boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#657785', letterSpacing: '0.02em' }}>
                Operational
              </span>
              <div style={{ width: 24, height: 24, borderRadius: '6px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={14} color="#059669" />
              </div>
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#059669', lineHeight: 1.1 }}>{summary.normalCount} / {summary.totalUtilities}</div>
            <div style={{ fontSize: '0.65rem', color: '#657785', marginTop: '0.2rem' }}>100% Functional</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #DCE8EF', padding: '0.75rem 1rem', boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#657785', letterSpacing: '0.02em' }}>
                Active Outages
              </span>
              <div style={{ width: 24, height: 24, borderRadius: '6px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle size={14} color="#DC2626" />
              </div>
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#DC2626', lineHeight: 1.1 }}>{summary.outageCount}</div>
            <div style={{ fontSize: '0.65rem', color: '#657785', marginTop: '0.2rem' }}>Critical attention needed</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #DCE8EF', padding: '0.75rem 1rem', boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#657785', letterSpacing: '0.02em' }}>
                Degraded
              </span>
              <div style={{ width: 24, height: 24, borderRadius: '6px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={14} color="#D97706" />
              </div>
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#D97706', lineHeight: 1.1 }}>{summary.degradedCount}</div>
            <div style={{ fontSize: '0.65rem', color: '#657785', marginTop: '0.2rem' }}>Partial service active</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #DCE8EF', padding: '0.75rem 1rem', boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#657785', letterSpacing: '0.02em' }}>
                Maintenance
              </span>
              <div style={{ width: 24, height: 24, borderRadius: '6px', background: '#F4FAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={14} color="#083B56" />
              </div>
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#083B56', lineHeight: 1.1 }}>{summary.maintenanceCount}</div>
            <div style={{ fontSize: '0.65rem', color: '#657785', marginTop: '0.2rem' }}>Planned servicing</div>
          </div>
        </div>
      </div>

      {/* Tabs - Segmented Control Container */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--aarizo-border, #DCE8EF)',
          borderRadius: '16px',
          padding: '0.35rem',
          display: 'flex',
          gap: '0.35rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          boxShadow: '0 2px 6px rgba(8, 59, 86, 0.03)',
          marginBottom: '1.25rem',
        }}
      >
        {[
          { key: 'LIVE_BOARD', label: 'Live Status Board (9 Categories)', icon: Radio },
          { key: 'OUTAGE_HISTORY', label: `Outage & Downtime Log (${outages.length})`, icon: History },
          { key: 'IOT_TERMINAL', label: 'IoT Sensor Event Pipeline', icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'var(--aarizo-coral, #F06543)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--aarizo-navy, #083B56)',
                fontWeight: isActive ? 800 : 700,
                fontSize: '0.78125rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 3px 10px rgba(240, 101, 67, 0.28)' : 'none',
                flexShrink: 0,
              }}
            >
              <Icon size={15} color={isActive ? '#FFFFFF' : 'var(--aarizo-navy, #083B56)'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: LIVE BOARD */}
      {activeTab === 'LIVE_BOARD' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {utilities.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || Building2;
            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #DCE8EF',
                  padding: '1.25rem',
                  boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.875rem',
                }}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: '#F4FAFE',
                        border: '1px solid #DCE8EF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#083B56',
                      }}
                    >
                      <Icon size={18} />
                    </span>
                    {getStatusBadge(item.currentStatus)}
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#083B56', margin: 0 }}>{item.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: '#657785', margin: 0 }}>{item.location}</p>

                  {item.metricValue && (
                    <div
                      style={{
                        padding: '0.4rem 0.65rem',
                        borderRadius: '8px',
                        background: '#F4FAFE',
                        border: '1px solid #DCE8EF',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: '#083B56',
                        fontWeight: 700,
                      }}
                    >
                      {item.metricValue}
                    </div>
                  )}

                  {item.notes && <p style={{ fontSize: '0.75rem', color: '#657785', fontStyle: 'italic', margin: 0 }}>"{item.notes}"</p>}
                </div>

                <div
                  style={{
                    paddingTop: '0.65rem',
                    borderTop: '1px solid #DCE8EF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.6875rem',
                    color: '#657785',
                  }}
                >
                  <span>Updated: {new Date(item.updatedAt).toLocaleTimeString()}</span>
                  {isAdminOrFacility && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUtility(item);
                        setUpdateStatus(item.currentStatus);
                        setUpdateNotes(item.notes || '');
                        setUpdateMetric(item.metricValue || '');
                        setIsUpdateModalOpen(true);
                      }}
                      style={{
                        padding: '0.35rem 0.65rem',
                        background: '#F4FAFE',
                        border: '1px solid #DCE8EF',
                        color: '#083B56',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit3 size={13} /> Update Status
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: OUTAGE HISTORY */}
      {activeTab === 'OUTAGE_HISTORY' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
          }}
          className="space-y-4"
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#083B56', margin: 0 }}>Historical Outage &amp; Downtime Audit Trail</h3>
            <p style={{ fontSize: '0.75rem', color: '#657785', margin: 0, marginTop: 2 }}>Record of unscheduled interruptions, cause analysis, and restoration durations.</p>
          </div>

          <div className="space-y-3">
            {outages.map((outage) => (
              <div
                key={outage.id}
                style={{
                  padding: '0.875rem 1rem',
                  background: '#F4FAFE',
                  borderRadius: '12px',
                  border: '1px solid #DCE8EF',
                }}
                className="space-y-2 text-xs"
              >
                <div className="flex justify-between items-center font-bold">
                  <span style={{ color: '#083B56', fontFamily: 'monospace' }}>{outage.category} - {outage.name}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${outage.status === 'RESTORED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                    {outage.status}
                  </span>
                </div>

                <p style={{ color: '#083B56', margin: 0 }}>{outage.causeNotes}</p>

                <div className="flex flex-wrap gap-4 text-[11px] pt-1" style={{ color: '#657785' }}>
                  <span>Start: {new Date(outage.startTime).toLocaleString()}</span>
                  {outage.endTime && <span>Restored: {new Date(outage.endTime).toLocaleString()}</span>}
                  {outage.durationMinutes && (
                    <span style={{ fontWeight: 700, color: '#083B56' }}>Duration: {outage.durationMinutes} Minutes</span>
                  )}
                  {outage.resolvedBy && <span>Resolved By: {outage.resolvedBy}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: IOT TERMINAL */}
      {activeTab === 'IOT_TERMINAL' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
            maxWidth: '36rem',
            margin: '0 auto',
          }}
          className="space-y-5"
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#083B56', margin: 0 }}>IoT Sensor Event Simulation Terminal</h3>
            <p style={{ fontSize: '0.75rem', color: '#657785', margin: 0, marginTop: 2 }}>
              Simulate sensor payloads (Water Level Drop, Power Grid Fluctuation) mapping into the exact same data model.
            </p>
          </div>

          <form onSubmit={handleSimulateIoT} className="space-y-4">
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#083B56', marginBottom: 4 }}>Utility Category</label>
              <select
                value={iotForm.category}
                onChange={(e) => setIotForm({ ...iotForm, category: e.target.value as UtilityCategory })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #DCE8EF',
                  background: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#083B56',
                }}
              >
                <option value="WATER">WATER</option>
                <option value="POWER">POWER</option>
                <option value="LIFT">LIFT</option>
                <option value="EV">EV</option>
                <option value="INTERNET">INTERNET</option>
                <option value="SWIMMING_POOL">SWIMMING_POOL</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#083B56', marginBottom: 4 }}>Sensor Hardware ID</label>
              <input
                type="text"
                required
                value={iotForm.sensorId}
                onChange={(e) => setIotForm({ ...iotForm, sensorId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #DCE8EF',
                  background: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#083B56',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#083B56', marginBottom: 4 }}>Sensor Metric Reading</label>
              <input
                type="text"
                required
                value={iotForm.metricValue}
                onChange={(e) => setIotForm({ ...iotForm, metricValue: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #DCE8EF',
                  background: '#ffffff',
                  fontSize: '0.75rem',
                  color: '#083B56',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#083B56', marginBottom: 4 }}>Mapped Operations Status</label>
              <select
                value={iotForm.suggestedStatus}
                onChange={(e) => setIotForm({ ...iotForm, suggestedStatus: e.target.value as OperationsStatus })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #DCE8EF',
                  background: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#083B56',
                }}
              >
                <option value="NORMAL">NORMAL</option>
                <option value="DEGRADED">DEGRADED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="OUTAGE">OUTAGE</option>
                <option value="RESTORED">RESTORED</option>
              </select>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#DCE8EF]">
              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 1.125rem',
                  borderRadius: '10px',
                  background: 'var(--aarizo-coral, #F06543)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                }}
              >
                <Cpu size={15} /> Ingest Sensor Payload
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Update Status */}
      <Modal
        isOpen={isUpdateModalOpen && !!selectedUtility}
        onClose={() => setIsUpdateModalOpen(false)}
        title={`Update Status: ${selectedUtility?.name || 'Utility Asset'}`}
        subtitle="Broadcast live operational status update to all society screens"
        icon={<Radio size={20} />}
        maxWidth="480px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('update-utility-status-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2.5 text-white text-xs font-extrabold rounded-xl shadow-md bg-[#F06543]"
            >
              Broadcast Live Update
            </button>
          </div>
        }
      >
        {selectedUtility && (
          <form id="update-utility-status-form" onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[#083B56] mb-1">Operational Status</label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value as OperationsStatus)}
                className="w-full px-3.5 py-2.5 border border-[#DCE8EF] rounded-xl text-xs bg-white font-bold text-[#083B56]"
              >
                <option value="NORMAL">NORMAL (100% Functional)</option>
                <option value="RESTORED">RESTORED (Service Resumed)</option>
                <option value="DEGRADED">DEGRADED (Reduced Capacity)</option>
                <option value="MAINTENANCE">MAINTENANCE (Scheduled Servicing)</option>
                <option value="OUTAGE">OUTAGE (Critical Service Loss)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#083B56] mb-1">Metric Value / Meter Reading</label>
              <input
                type="text"
                placeholder="e.g. Tank 85% Full (120,000L)"
                value={updateMetric}
                onChange={(e) => setUpdateMetric(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#DCE8EF] rounded-xl text-xs text-[#083B56] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#083B56] mb-1">Operational Notes / Cause</label>
              <textarea
                rows={3}
                placeholder="e.g. Servicing completed by Otis engineers."
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#DCE8EF] rounded-xl text-xs text-[#083B56] font-medium"
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};




