import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Search,
  Copy,
  Check,
  Plus,
  Radio,
  FileCode,
  ShieldCheck,
  Users,
  Building,
  Car,
  Bell,
  HardHat,
  Sparkles,
  Download,
  ChevronRight,
  ArrowLeft,
  Code2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { realtimeService } from '../../services/realtimeService';
import { visitorService } from '../../services/visitorService';
import { multiChannelNotificationService } from '../../domains/notifications/services/multiChannelNotificationService';
import { societyService } from '../../services/societyService';
import { triggerHaptic } from '../../utils/nativeMobile';

type CollectionKey =
  | 'visitor_passes'
  | 'realtime_events'
  | 'notification_logs'
  | 'residents'
  | 'flats'
  | 'societies'
  | 'vehicles'
  | 'staff'
  | 'audit_logs'
  | 'raw_storage';

interface CollectionMeta {
  key: CollectionKey;
  label: string;
  icon: React.ElementType;
  badgeColor: string;
}

const COLLECTIONS: CollectionMeta[] = [
  { key: 'visitor_passes', label: 'Visitor Passes (Live)', icon: ShieldCheck, badgeColor: '#10B981' },
  { key: 'realtime_events', label: 'Realtime Event Stream', icon: Radio, badgeColor: '#3B82F6' },
  { key: 'notification_logs', label: 'Notification Audit Logs', icon: Bell, badgeColor: '#8B5CF6' },
  { key: 'residents', label: 'Residents & Owners', icon: Users, badgeColor: '#0EA5E9' },
  { key: 'flats', label: 'Flats & Units', icon: Building, badgeColor: '#F59E0B' },
  { key: 'societies', label: 'Societies Master', icon: Sparkles, badgeColor: '#6366F1' },
  { key: 'vehicles', label: 'Parking & Vehicles', icon: Car, badgeColor: '#EC4899' },
  { key: 'staff', label: 'Staff & Security Guards', icon: HardHat, badgeColor: '#14B8A6' },
  { key: 'audit_logs', label: 'Security Audit Logs', icon: FileCode, badgeColor: '#64748B' },
  { key: 'raw_storage', label: 'Raw Storage & Export', icon: Database, badgeColor: '#D97706' },
];

export const DeveloperDatabaseStudio: React.FC = () => {
  const navigate = useNavigate();
  const [activeCollection, setActiveCollection] = useState<CollectionKey>('visitor_passes');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [livePulse, setLivePulse] = useState(false);

  // Load collection data dynamically
  const getCollectionData = (): any[] => {
    switch (activeCollection) {
      case 'visitor_passes':
        return visitorService.getPasses('soc-gvs');
      case 'realtime_events':
        return realtimeMessages;
      case 'notification_logs':
        return multiChannelNotificationService.getAllAuditLogs();
      case 'residents':
        return societyService.getResidents('soc-gvs');
      case 'flats':
        return societyService.getFlats('soc-gvs');
      case 'societies':
        return societyService.getSocieties();
      case 'vehicles':
        return societyService.getVehicles('soc-gvs');
      case 'staff':
        return societyService.getStaff('soc-gvs');
      case 'audit_logs':
        return societyService.getAuditLogs('soc-gvs');
      case 'raw_storage':
        if (typeof window === 'undefined') return [];
        return Object.keys(localStorage).map((k) => {
          let val = localStorage.getItem(k);
          try {
            val = JSON.parse(val || '');
          } catch {
            // raw string
          }
          return { key: k, value: val };
        });
      default:
        return [];
    }
  };

  const [data, setData] = useState<any[]>(getCollectionData());

  const refreshData = () => {
    triggerHaptic('light');
    setRealtimeMessages(realtimeService.getRecentMessages());
    setData(getCollectionData());
    setLastUpdated(new Date().toLocaleTimeString());
    setLivePulse(true);
    setTimeout(() => setLivePulse(false), 600);
  };

  // Subscribe to real-time events to auto-refresh live views
  useEffect(() => {
    setRealtimeMessages(realtimeService.getRecentMessages());
    setData(getCollectionData());

    const unsub = realtimeService.subscribe('*', () => {
      setRealtimeMessages(realtimeService.getRecentMessages());
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 500);

      // Refresh if viewing live collections
      if (['visitor_passes', 'realtime_events', 'notification_logs'].includes(activeCollection)) {
        setData(getCollectionData());
      }
    });

    return () => unsub();
  }, [activeCollection]);

  // Filtered rows
  const filteredData = data.filter((item) => {
    if (!searchQuery.trim()) return true;
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(searchQuery.toLowerCase());
  });

  const handleCopyJson = () => {
    triggerHaptic('medium');
    const content = selectedRecord
      ? JSON.stringify(selectedRecord, null, 2)
      : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportAll = () => {
    triggerHaptic('medium');
    const fullDump: Record<string, any> = {
      exportedAt: new Date().toISOString(),
      societies: societyService.getSocieties(),
      towers: societyService.getTowers('soc-gvs'),
      flats: societyService.getFlats('soc-gvs'),
      residents: societyService.getResidents('soc-gvs'),
      visitorPasses: visitorService.getPasses('soc-gvs'),
      vehicles: societyService.getVehicles('soc-gvs'),
      staff: societyService.getStaff('soc-gvs'),
      auditLogs: societyService.getAuditLogs('soc-gvs'),
      realtimeEvents: realtimeService.getRecentMessages(),
      notificationLogs: multiChannelNotificationService.getAllAuditLogs(),
    };

    const blob = new Blob([JSON.stringify(fullDump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aarizo_database_dump_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleQuickAddVisitorPass = () => {
    triggerHaptic('medium');
    const newPass = visitorService.createVisitorPass(
      {
        societyId: 'soc-gvs',
        residentId: 'res-1',
        residentName: 'Developer Test Resident',
        flatCode: 'B-1204',
        towerName: 'Tower B',
        visitorName: `Realtime Guest #${Math.floor(Math.random() * 100)}`,
        visitorPhone: '9876543210',
        category: 'GUEST',
        passLifecycle: 'ONE_TIME',
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86400000).toISOString(),
        purpose: 'Developer Real-Time Verification',
      },
      { id: 'dev-1', name: 'Developer Studio', role: 'ADMIN' }
    );
    refreshData();
    setSelectedRecord(newPass);
  };

  const handleQuickCheckInPass = (passId: string) => {
    triggerHaptic('medium');
    visitorService.checkInVisitor(
      passId,
      { gateName: 'Main Gate 1', officerName: 'Security Automation' },
      { id: 'dev-1', name: 'Developer Studio', role: 'ADMIN' }
    );
    refreshData();
  };

  const handleQuickCheckOutPass = (passId: string) => {
    triggerHaptic('medium');
    visitorService.checkOutVisitor(passId, { id: 'dev-1', name: 'Developer Studio', role: 'ADMIN' });
    refreshData();
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0B1924',
        color: '#E2E8F0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Top Header ── */}
      <header
        style={{
          background: '#08131D',
          borderBottom: '1px solid #1E293B',
          padding: '0.875rem 1.25rem',
          paddingTop: 'calc(0.875rem + env(safe-area-inset-top, 0px))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Back to App"
            style={{
              padding: '0.45rem',
              borderRadius: '8px',
              background: '#1E293B',
              color: '#94A3B8',
              border: '1px solid #334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>
                  Dwellora Developer Database Studio
                </h1>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.5rem',
                    borderRadius: '999px',
                    background: livePulse ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.15)',
                    color: '#34D399',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#10B981',
                      boxShadow: '0 0 8px #10B981',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                  REAL-TIME SYNC ACTIVE
                </span>
              </div>
              <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                Live In-Memory & LocalStorage Multi-Tenant Database • Updated {lastUpdated}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {activeCollection === 'visitor_passes' && (
            <button
              onClick={handleQuickAddVisitorPass}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                background: '#0284C7',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> + New Mock Pass
            </button>
          )}

          <button
            onClick={refreshData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              background: '#1E293B',
              color: '#94A3B8',
              border: '1px solid #334155',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={livePulse ? 'animate-spin' : ''} /> Refresh
          </button>

          <button
            onClick={handleCopyJson}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              background: '#1E293B',
              color: copied ? '#34D399' : '#94A3B8',
              border: '1px solid #334155',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied JSON' : 'Copy JSON'}
          </button>

          <button
            onClick={handleExportAll}
            title="Download full JSON database dump"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              background: '#0F766E',
              color: '#F0FDFA',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Download size={14} /> Export Dump
          </button>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar: Collections */}
        <aside
          style={{
            width: '260px',
            background: '#091520',
            borderRight: '1px solid #1E293B',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #1E293B' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>
              Database Tables
            </span>
          </div>

          <nav style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {COLLECTIONS.map((c) => {
              const Icon = c.icon;
              const isSelected = activeCollection === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveCollection(c.key);
                    setSelectedRecord(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
                    color: isSelected ? '#38BDF8' : '#94A3B8',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Icon size={16} style={{ color: isSelected ? '#38BDF8' : '#64748B' }} />
                    <span>{c.label}</span>
                  </div>
                  {isSelected && <ChevronRight size={14} style={{ color: '#38BDF8' }} />}
                </button>
              );
            })}
          </nav>

          {/* Real-time stats footer */}
          <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid #1E293B', background: '#071018' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Broadcast Hub:</span>
                <span style={{ color: '#34D399', fontWeight: 700 }}>Active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Recent Events:</span>
                <span style={{ color: '#38BDF8', fontWeight: 700 }}>{realtimeMessages.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Storage Target:</span>
                <span style={{ color: '#94A3B8' }}>Local + InMemory</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Table View */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search bar & summary */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: '#0B1924',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 10, color: '#64748B' }} />
              <input
                type="text"
                placeholder={`Search in ${COLLECTIONS.find((c) => c.key === activeCollection)?.label}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.25rem',
                  borderRadius: '8px',
                  background: '#122332',
                  border: '1px solid #1E293B',
                  color: '#F8FAFC',
                  fontSize: '0.8125rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Showing <strong style={{ color: '#F8FAFC' }}>{filteredData.length}</strong> of{' '}
              <strong style={{ color: '#F8FAFC' }}>{data.length}</strong> entries
            </div>
          </div>

          {/* Table Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
            {filteredData.length === 0 ? (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  gap: '0.5rem',
                }}
              >
                <Database size={40} style={{ opacity: 0.4 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No records found in this table.</p>
                <span style={{ fontSize: '0.75rem' }}>Create or trigger events in the app to see live rows.</span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #1E293B', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ background: '#0F1E2C', color: '#94A3B8', borderBottom: '1px solid #1E293B' }}>
                      <th style={{ padding: '0.625rem 0.875rem', fontWeight: 700 }}>Record ID / Key</th>
                      <th style={{ padding: '0.625rem 0.875rem', fontWeight: 700 }}>Primary Attributes</th>
                      <th style={{ padding: '0.625rem 0.875rem', fontWeight: 700 }}>Status / Category</th>
                      <th style={{ padding: '0.625rem 0.875rem', fontWeight: 700 }}>Timestamp</th>
                      <th style={{ padding: '0.625rem 0.875rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, idx) => {
                      const isSelected = selectedRecord === row;
                      const rowId = row.id || row.key || row.code || `item-${idx}`;

                      return (
                        <tr
                          key={rowId}
                          onClick={() => {
                            triggerHaptic('light');
                            setSelectedRecord(isSelected ? null : row);
                          }}
                          style={{
                            borderBottom: '1px solid #1E293B',
                            background: isSelected
                              ? 'rgba(2, 132, 199, 0.18)'
                              : idx % 2 === 0
                              ? '#0A1824'
                              : '#0B1B29',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          {/* ID */}
                          <td style={{ padding: '0.625rem 0.875rem', fontFamily: 'monospace', color: '#38BDF8', fontWeight: 700 }}>
                            {rowId}
                          </td>

                          {/* Attributes */}
                          <td style={{ padding: '0.625rem 0.875rem', color: '#F1F5F9' }}>
                            {row.visitorName && (
                              <div>
                                <strong>{row.visitorName}</strong>{' '}
                                <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>({row.flatCode})</span>
                              </div>
                            )}
                            {row.topic && (
                              <div>
                                <span style={{ color: '#38BDF8', fontWeight: 700 }}>{row.topic}</span>{' '}
                                <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>by {row.senderName || row.senderRole}</span>
                              </div>
                            )}
                            {row.name && !row.visitorName && (
                              <div>
                                <strong>{row.name}</strong>{' '}
                                {row.flatCode && <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>({row.flatCode})</span>}
                              </div>
                            )}
                            {row.title && <div>{row.title}</div>}
                            {row.key && <span style={{ color: '#CBD5E1' }}>{row.key}</span>}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '0.625rem 0.875rem' }}>
                            {row.status && (
                              <span
                                style={{
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  background:
                                    row.status === 'APPROVED' || row.status === 'CHECKED_IN' || row.status === 'ACTIVE'
                                      ? 'rgba(16, 185, 129, 0.2)'
                                      : row.status === 'EXPECTED' || row.status === 'PENDING'
                                      ? 'rgba(245, 158, 11, 0.2)'
                                      : 'rgba(239, 68, 68, 0.2)',
                                  color:
                                    row.status === 'APPROVED' || row.status === 'CHECKED_IN' || row.status === 'ACTIVE'
                                      ? '#34D399'
                                      : row.status === 'EXPECTED' || row.status === 'PENDING'
                                      ? '#FBBF24'
                                      : '#F87171',
                                }}
                              >
                                {row.status}
                              </span>
                            )}
                            {row.category && (
                              <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: '0.35rem' }}>
                                [{row.category}]
                              </span>
                            )}
                          </td>

                          {/* Timestamp */}
                          <td style={{ padding: '0.625rem 0.875rem', color: '#64748B', fontSize: '0.75rem' }}>
                            {row.timestamp || row.createdAt || row.validFrom || '—'}
                          </td>

                          {/* Quick Live Actions */}
                          <td style={{ padding: '0.625rem 0.875rem', textAlign: 'right' }}>
                            {activeCollection === 'visitor_passes' && row.status === 'EXPECTED' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickCheckInPass(row.id);
                                }}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '6px',
                                  background: '#059669',
                                  color: '#fff',
                                  border: 'none',
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Gate Check-In
                              </button>
                            )}

                            {activeCollection === 'visitor_passes' && row.status === 'CHECKED_IN' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickCheckOutPass(row.id);
                                }}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '6px',
                                  background: '#DC2626',
                                  color: '#fff',
                                  border: 'none',
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Gate Check-Out
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Right Drawer: JSON Inspector */}
        {selectedRecord && (
          <aside
            style={{
              width: '380px',
              background: '#071018',
              borderLeft: '1px solid #1E293B',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38BDF8', fontWeight: 700, fontSize: '0.8125rem' }}>
                <Code2 size={16} /> Record Inspector
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                Close ✕
              </button>
            </div>

            <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
              <pre
                style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  fontFamily: 'Consolas, monospace',
                  color: '#A5F3FC',
                  background: '#0B1622',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #1E293B',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {JSON.stringify(selectedRecord, null, 2)}
              </pre>
            </div>

            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1E293B', background: '#091520' }}>
              <button
                onClick={handleCopyJson}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  background: '#0284C7',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} Copy Record JSON
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
