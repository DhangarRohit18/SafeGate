import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wifi,
  Radio,
  Activity,
  UserCheck,
  QrCode,
  ShieldAlert,
  Car,
  Wrench,
  DollarSign,
  Package,
  HardHat,
  Sparkles,
  Bell,
  Play,
  CheckCircle2,
  ListFilter,
  Send,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { realtimeService } from '../../../services/realtimeService';
import { SocietyOperationsBoard } from '../../../domains/utilities';
import { useRealtimeStream } from '../../../hooks/useRealtime';
import type { RealtimeTopic } from '../../../types/realtime';

export const RealtimeOperationsHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'STREAM' | 'DISPATCH' | 'UTILITY' | 'AUDIT'>('STREAM');
  const [topicFilter, setTopicFilter] = useState<RealtimeTopic | 'ALL'>('ALL');
  const { messages, status } = useRealtimeStream(topicFilter);

  // Simulator State
  const [simTopic, setSimTopic] = useState<RealtimeTopic>('VISITOR_ARRIVAL');
  const [simSenderName, setSimSenderName] = useState<string>('Guard Ramesh Shinde');
  const [simSenderRole, setSimSenderRole] = useState<string>('SECURITY');
  const [simPayloadJson, setSimPayloadJson] = useState<string>(
    '{\n  "visitorName": "Karan Malhotra",\n  "flatCode": "B-402",\n  "passType": "DELIVERY",\n  "vendor": "Amazon"\n}'
  );
  const [lastDispatchedId, setLastDispatchedId] = useState<string | null>(null);

  const handleBroadcastEvent = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(simPayloadJson);
      const msg = realtimeService.publish(
        simTopic,
        parsed,
        'soc-gvs',
        simSenderRole,
        simSenderName
      );
      setLastDispatchedId(msg.id);
      setActiveTab('STREAM');
    } catch (err: any) {
      alert(`Invalid JSON Payload: ${err.message}`);
    }
  };

  const getTopicIcon = (topic: RealtimeTopic) => {
    switch (topic) {
      case 'VISITOR_ARRIVAL':
      case 'VISITOR_ENTRY':
      case 'VISITOR_EXIT':
        return <UserCheck className="w-4 h-4 text-[#083B56]" />;
      case 'VISITOR_APPROVAL':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'QR_SCAN':
        return <QrCode className="w-4 h-4 text-[#083B56]" />;
      case 'PARKING_OCCUPANCY':
        return <Car className="w-4 h-4 text-[#083B56]" />;
      case 'EMERGENCY_ALERTS':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'MAINTENANCE_STATUS':
        return <Wrench className="w-4 h-4 text-amber-500" />;
      case 'PAYMENT_STATUS':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'DELIVERY_STATUS':
        return <Package className="w-4 h-4 text-orange-500" />;
      case 'WORKER_ENTRY_EXIT':
        return <HardHat className="w-4 h-4 text-[#083B56]" />;
      case 'AMENITY_AVAILABILITY':
        return <Sparkles className="w-4 h-4 text-[#083B56]" />;
      case 'NOTIFICATIONS':
        return <Bell className="w-4 h-4 text-[#083B56]" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTopicBadgeStyle = (topic: RealtimeTopic) => {
    switch (topic) {
      case 'EMERGENCY_ALERTS':
        return 'bg-rose-50 text-rose-700 border border-rose-200 font-extrabold animate-pulse';
      case 'VISITOR_ARRIVAL':
      case 'VISITOR_APPROVAL':
        return 'bg-[#EAF6FC] text-[#083B56] border border-[#DCE8EF]';
      case 'PAYMENT_STATUS':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'PARKING_OCCUPANCY':
        return 'bg-[#F4FAFE] text-[#083B56] border border-[#DCE8EF]';
      default:
        return 'bg-[#F7FBFE] text-[#083B56] border border-[#DCE8EF]';
    }
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              Live Operations
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Wifi size={11} /> LIVE CONNECTED
              </span>
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Live society activity log &amp; operational status
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setActiveTab('DISPATCH')}
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
            <Send size={14} /> Dispatch Event
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 space-y-4">
        {/* ── Diagnostics Summary Bar ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            padding: '0.75rem 1rem',
            boxShadow: '0 1px 4px rgba(8, 59, 86, 0.03)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#657785', textTransform: 'uppercase' }}>Transport Engine</span>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#083B56', fontFamily: 'monospace' }}>{status.transportType}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#657785', textTransform: 'uppercase' }}>Active Callbacks</span>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>{status.activeListenersCount} Listeners</div>
          </div>
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#657785', textTransform: 'uppercase' }}>Total Streamed</span>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#083B56', fontFamily: 'monospace' }}>{status.messagesReceivedTotal} Events</div>
          </div>
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#657785', textTransform: 'uppercase' }}>Channel Status</span>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Radio size={13} className="animate-pulse" /> Subscribed
            </div>
          </div>
        </div>

        {/* ── Sub-Tab Navigation Bar - Integrated Segmented Control Container ── */}
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
          }}
        >
          {[
            { key: 'STREAM', label: `Live Event Stream (${messages.length})`, icon: Activity },
            { key: 'DISPATCH', label: 'Dispatch Event Simulator', icon: Send },
            { key: 'UTILITY', label: 'Society Utility Health Board', icon: Radio },
            { key: 'AUDIT', label: 'Security Audit & Sessions', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  if (tab.key === 'AUDIT') {
                    navigate('/admin/security-audit');
                  } else {
                    setActiveTab(tab.key as any);
                  }
                }}
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

        {/* ── TAB 1: LIVE EVENT STREAM ── */}
        {activeTab === 'STREAM' && (
          <div className="space-y-4">
            {/* Filter Card */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #DCE8EF',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                boxShadow: '0 1px 4px rgba(8, 59, 86, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ListFilter size={16} color="#083B56" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#083B56' }}>Topic Filter:</span>
              </div>

              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value as any)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #DCE8EF',
                  background: '#F4FAFE',
                  color: '#083B56',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  outline: 'none',
                }}
              >
                <option value="ALL">All 13 Topics</option>
                <option value="VISITOR_ARRIVAL">VISITOR_ARRIVAL</option>
                <option value="VISITOR_APPROVAL">VISITOR_APPROVAL</option>
                <option value="QR_SCAN">QR_SCAN</option>
                <option value="VISITOR_ENTRY">VISITOR_ENTRY</option>
                <option value="VISITOR_EXIT">VISITOR_EXIT</option>
                <option value="PARKING_OCCUPANCY">PARKING_OCCUPANCY</option>
                <option value="EMERGENCY_ALERTS">EMERGENCY_ALERTS</option>
                <option value="MAINTENANCE_STATUS">MAINTENANCE_STATUS</option>
                <option value="PAYMENT_STATUS">PAYMENT_STATUS</option>
                <option value="DELIVERY_STATUS">DELIVERY_STATUS</option>
                <option value="WORKER_ENTRY_EXIT">WORKER_ENTRY_EXIT</option>
                <option value="AMENITY_AVAILABILITY">AMENITY_AVAILABILITY</option>
                <option value="NOTIFICATIONS">NOTIFICATIONS</option>
              </select>
            </div>

            {/* Live Event Cards List */}
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #DCE8EF',
                    padding: '2.5rem',
                    textAlign: 'center',
                    color: '#657785',
                  }}
                >
                  <Activity size={32} style={{ margin: '0 auto 0.5rem auto', color: '#083B56', opacity: 0.5 }} />
                  <div style={{ fontWeight: 800, color: '#083B56' }}>No events logged yet</div>
                  <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Dispatch a test event using the simulator to view real-time streaming payloads.</div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: msg.id === lastDispatchedId ? '2px solid #059669' : '1px solid #DCE8EF',
                      padding: '1rem 1.25rem',
                      boxShadow: msg.id === lastDispatchedId ? '0 4px 16px rgba(5, 150, 105, 0.15)' : '0 2px 6px rgba(8, 59, 86, 0.03)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getTopicIcon(msg.topic)}
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-mono ${getTopicBadgeStyle(msg.topic)}`}>
                          {msg.topic}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#657785', fontFamily: 'monospace' }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#657785', marginBottom: '0.5rem' }}>
                      <span>
                        Sender: <strong style={{ color: '#083B56' }}>{msg.senderName}</strong> ({msg.senderRole})
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.6875rem' }}>Society: {msg.societyId}</span>
                    </div>

                    {/* Code block with clean high-contrast navy background */}
                    <div
                      style={{
                        background: '#083B56',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: '#83CBEA',
                        overflowX: 'auto',
                        border: '1px solid #0D4767',
                      }}
                    >
                      <pre style={{ margin: 0 }}>{JSON.stringify(msg.payload, null, 2)}</pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: DISPATCH EVENT SIMULATOR ── */}
        {activeTab === 'DISPATCH' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #DCE8EF',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
              maxWidth: '40rem',
              margin: '0 auto',
            }}
            className="space-y-5"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#083B56', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Send size={18} color="#F06543" /> Dispatch Real-Time Operational Event
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#657785', margin: 0, marginTop: 2 }}>
                  Broadcast payloads across multi-tab BroadcastChannel topic listeners instantaneously.
                </p>
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px', background: '#F4FAFE', color: '#083B56', border: '1px solid #DCE8EF' }}>
                Simulator Console
              </span>
            </div>

            <form onSubmit={handleBroadcastEvent} className="space-y-4">
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#083B56', marginBottom: 4 }}>Target Operational Topic (13)</label>
                <select
                  value={simTopic}
                  onChange={(e) => setSimTopic(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #DCE8EF',
                    background: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#083B56',
                  }}
                >
                  <option value="VISITOR_ARRIVAL">VISITOR_ARRIVAL</option>
                  <option value="VISITOR_APPROVAL">VISITOR_APPROVAL</option>
                  <option value="QR_SCAN">QR_SCAN</option>
                  <option value="VISITOR_ENTRY">VISITOR_ENTRY</option>
                  <option value="VISITOR_EXIT">VISITOR_EXIT</option>
                  <option value="PARKING_OCCUPANCY">PARKING_OCCUPANCY</option>
                  <option value="EMERGENCY_ALERTS">EMERGENCY_ALERTS</option>
                  <option value="MAINTENANCE_STATUS">MAINTENANCE_STATUS</option>
                  <option value="PAYMENT_STATUS">PAYMENT_STATUS</option>
                  <option value="DELIVERY_STATUS">DELIVERY_STATUS</option>
                  <option value="WORKER_ENTRY_EXIT">WORKER_ENTRY_EXIT</option>
                  <option value="AMENITY_AVAILABILITY">AMENITY_AVAILABILITY</option>
                  <option value="NOTIFICATIONS">NOTIFICATIONS</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#083B56', marginBottom: 4 }}>Sender Name</label>
                  <input
                    type="text"
                    value={simSenderName}
                    onChange={(e) => setSimSenderName(e.target.value)}
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
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#083B56', marginBottom: 4 }}>Sender Role</label>
                  <input
                    type="text"
                    value={simSenderRole}
                    onChange={(e) => setSimSenderRole(e.target.value)}
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
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#083B56', marginBottom: 4 }}>Event JSON Payload</label>
                <textarea
                  value={simPayloadJson}
                  onChange={(e) => setSimPayloadJson(e.target.value)}
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid #0D4767',
                    background: '#083B56',
                    color: '#83CBEA',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    outline: 'none',
                  }}
                ></textarea>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'var(--aarizo-coral, #F06543)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(240, 101, 67, 0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <Play size={16} /> Publish Real-Time Event Across Tabs
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 3: SOCIETY UTILITY BOARD ── */}
        {activeTab === 'UTILITY' && (
          <div className="mt-2">
            <SocietyOperationsBoard hideHeader />
          </div>
        )}
      </div>
    </div>
  );
};

export default RealtimeOperationsHubPage;
