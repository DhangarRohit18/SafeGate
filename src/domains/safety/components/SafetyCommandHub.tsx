import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Zap,
  Users,
  CheckCircle2,
  Radio,
  QrCode,
  UserPlus,
  Lock,
  Clock,
  Phone,
  IdCard,
  Trash2,
  Info,
  Shield,
} from 'lucide-react';
import { safetyCommandEngine } from '../services/safetyCommandEngine';
import type { EmergencyIncidentItem, EmergencyCategory, ChildProfileItem, AuthorizedPickupPerson } from '../types/index';
import { useAuth } from '../../../context/AuthContext';
import { realTimeSync } from '../../../services/realTimeSync';
import { Modal } from '../../../components/ui/Modal';

interface SafetyCommandHubProps {
  initialTab?: 'ONE_TAP_SOS' | 'CHILD_SAFETY';
}

export const SafetyCommandHub: React.FC<SafetyCommandHubProps> = ({ initialTab = 'ONE_TAP_SOS' }) => {
  const { currentUser } = useAuth();
  const activeRole = (currentUser?.role || '').toLowerCase();
  const flatNumber = (currentUser as any)?.flatNumber || (currentUser as any)?.flatDetails || 'B-1204';

  const isAdminOrSecurity = ['admin', 'secretary', 'guard'].includes(activeRole);

  const [activeTab, setActiveTab] = useState<'ONE_TAP_SOS' | 'COMMAND_CONSOLE' | 'CHILD_SAFETY' | 'GATE_VERIFIER'>(initialTab);
  const [incidents, setIncidents] = useState<EmergencyIncidentItem[]>(() => safetyCommandEngine.getIncidents());
  const [children, setChildren] = useState<ChildProfileItem[]>(() => safetyCommandEngine.getChildren());

  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncidentItem | null>(null);
  const [selectedEscortForDetail, setSelectedEscortForDetail] = useState<AuthorizedPickupPerson | null>(null);
  const [modalMode, setModalMode] = useState<'ASSIGN_RESPONDER' | 'ADD_CHILD' | 'ADD_PICKUP' | 'GENERATE_PASS' | 'MISSING_ALERT' | null>(null);
  const [selectedEscortId, setSelectedEscortId] = useState<string>('');

  // Forms
  const [responderForm, setResponderForm] = useState({
    responderName: 'Guard Ramesh Shinde',
    responderRole: 'Head Security',
  });

  const [pickupForm, setPickupForm] = useState({
    name: 'Radha Bai',
    phone: '+91 98199 88776',
    relationship: 'Trusted Family Maid / Nanny',
    idProofType: 'Aadhaar Card',
    idProofNumber: 'XXXX-XXXX-9901',
  });

  const [scanChildInput, setScanChildInput] = useState('');
  const [scanPickupInput, setScanPickupInput] = useState('');
  const [gateResult, setGateResult] = useState<{ isValid: boolean; child?: ChildProfileItem; reason?: string } | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  const loadData = () => {
    setIncidents(safetyCommandEngine.getIncidents());
    setChildren(safetyCommandEngine.getChildren());
  };

  useEffect(() => {
    loadData();
    const unsubscribeEmergency = realTimeSync.subscribe('EMERGENCY_ALERTS', () => loadData());
    const unsubscribeChild = realTimeSync.subscribe('CHILD_SAFETY_UPDATED', () => loadData());
    return () => {
      unsubscribeEmergency();
      unsubscribeChild();
    };
  }, []);

  const handleTriggerSOS = (category: EmergencyCategory) => {
    safetyCommandEngine.triggerOneTapSOS(
      category,
      currentUser?.id || 'res-1',
      currentUser?.name || 'Siddharth Malhotra',
      flatNumber,
      currentUser?.phone || '+91 98765 00000',
      `Tower B, Flat ${flatNumber}`
    );
    loadData();
    setAlertSuccess(`ONE-TAP ${category} SOS DISPATCHED! Security Command Console & Guard Terminal notified.`);
    setTimeout(() => setAlertSuccess(null), 5000);
  };

  const handleAcknowledge = (id: string) => {
    safetyCommandEngine.acknowledgeIncident(id, currentUser?.name || 'Security Post');
    loadData();
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    safetyCommandEngine.assignResponder(
      selectedIncident.id,
      responderForm.responderName,
      responderForm.responderRole,
      currentUser?.name || 'Security Command'
    );

    setModalMode(null);
    loadData();
  };

  const handleResolve = (id: string) => {
    safetyCommandEngine.resolveIncident(id, 'RESOLVED', 'Incident resolved cleanly on site.', currentUser?.name || 'Security Post');
    loadData();
  };

  const handleAddPickupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!children[0]) return;
    safetyCommandEngine.addAuthorizedPickup(children[0].id, pickupForm);
    setModalMode(null);
    loadData();
    setAlertSuccess('Authorized pickup person added.');
    setTimeout(() => setAlertSuccess(null), 4000);
  };

  const handleRemoveEscort = (escortId: string) => {
    if (!children[0]) return;
    const child = children[0];
    child.authorizedPickups = child.authorizedPickups.filter(p => p.id !== escortId);
    loadData();
    setAlertSuccess('Escort authorization removed.');
    setTimeout(() => setAlertSuccess(null), 4000);
  };

  const handleGateVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = safetyCommandEngine.verifyChildPickupAtGate(
      scanChildInput,
      scanPickupInput,
      currentUser?.name || 'Gate Guard'
    );
    setGateResult(result);
    loadData();
  };

  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED');
  const currentChild = children[0];

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-24 font-sans">
      {/* Segmented Experience Switcher Shell */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '0.25rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('ONE_TAP_SOS')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: activeTab === 'ONE_TAP_SOS' ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            borderRadius: '10px',
            padding: '0.45rem 0.875rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: activeTab === 'ONE_TAP_SOS' ? '#ffffff' : 'var(--aarizo-text, #203746)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <ShieldAlert size={14} color={activeTab === 'ONE_TAP_SOS' ? '#ffffff' : 'var(--aarizo-coral, #F06543)'} />
          <span>One-Tap SOS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CHILD_SAFETY')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: activeTab === 'CHILD_SAFETY' ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            borderRadius: '10px',
            padding: '0.45rem 0.875rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: activeTab === 'CHILD_SAFETY' ? '#ffffff' : 'var(--aarizo-text, #203746)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Users size={14} color={activeTab === 'CHILD_SAFETY' ? '#ffffff' : 'var(--aarizo-coral, #F06543)'} />
          <span>Child Safety</span>
        </button>

        {isAdminOrSecurity && (
          <button
            type="button"
            onClick={() => setActiveTab('COMMAND_CONSOLE')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: activeTab === 'COMMAND_CONSOLE' ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '10px',
              padding: '0.45rem 0.875rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: activeTab === 'COMMAND_CONSOLE' ? '#ffffff' : 'var(--aarizo-text, #203746)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Radio size={14} color={activeTab === 'COMMAND_CONSOLE' ? '#ffffff' : 'var(--aarizo-coral, #F06543)'} />
            <span>Console ({activeIncidents.length})</span>
          </button>
        )}

        {isAdminOrSecurity && (
          <button
            type="button"
            onClick={() => setActiveTab('GATE_VERIFIER')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: activeTab === 'GATE_VERIFIER' ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '10px',
              padding: '0.45rem 0.875rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: activeTab === 'GATE_VERIFIER' ? '#ffffff' : 'var(--aarizo-text, #203746)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <QrCode size={14} color={activeTab === 'GATE_VERIFIER' ? '#ffffff' : 'var(--aarizo-coral, #F06543)'} />
            <span>Gate Verifier</span>
          </button>
        )}
      </div>

      {/* Success Banner */}
      {alertSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-2xs animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{alertSuccess}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* EXPERIENCE 1: ONE-TAP EMERGENCY SOS                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'ONE_TAP_SOS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* SOS Clean Header Banner */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={22} color="var(--aarizo-coral, #F06543)" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em' }}>
                  Safety Command &amp; Emergency Dispatch
                </h1>
                <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: '0.125rem' }}>
                  One-Tap Emergency SOS, real-time command console, child pickup authorization &amp; guardian alerts.
                </p>
              </div>
            </div>

            {activeIncidents.length > 0 && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <Radio size={13} color="#DC2626" />
                <span>{activeIncidents.length} ACTIVE INCIDENT(S)</span>
              </div>
            )}
          </div>

          {/* AI Boundary Notice Card */}
          <div
            style={{
              padding: '0.625rem 0.875rem',
              background: '#FFFBEB',
              borderRadius: '12px',
              border: '1px solid #FDE68A',
              fontSize: '0.75rem',
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Lock size={15} color="#D97706" style={{ flexShrink: 0 }} />
            <span>
              <strong style={{ fontWeight: 800, color: '#78350F' }}>Strict AI Boundary Rule:</strong> AI is strictly prohibited from independently making child-safety or gate entry decisions. All authorizations remain guardian-verified.
            </span>
          </div>

          {/* SOS Incident Action Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { category: 'MEDICAL' as const, title: 'Medical Emergency', desc: 'Ambulance & Doctor Alert', bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', icon: ShieldAlert },
              { category: 'FIRE' as const, title: 'Fire Alert', desc: 'Fire System & Evacuation', bg: '#FFF7ED', border: '#FFEDD5', text: '#EA580C', icon: Flame },
              { category: 'SECURITY' as const, title: 'Security Threat', desc: 'Intruder / Security Alert', bg: '#F0F9FF', border: '#BAE6FD', text: 'var(--aarizo-navy, #083B56)', icon: ShieldCheck },
              { category: 'CHILD_SAFETY' as const, title: 'Child Safety SOS', desc: 'Missing / Unsafe Alert', bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', icon: Users },
              { category: 'LIFT' as const, title: 'Lift Trapped', desc: 'Elevator Emergency Trap', bg: '#F3E8FF', border: '#E9D5FF', text: '#7E22CE', icon: AlertTriangle },
              { category: 'ELECTRICAL' as const, title: 'Electrical Hazard', desc: 'Spark / Power Threat', bg: '#FEF3C7', border: '#FDE68A', text: '#D97706', icon: Zap },
            ].map((sos) => {
              const IconComp = sos.icon;
              return (
                <div
                  key={sos.category}
                  onClick={() => handleTriggerSOS(sos.category)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                    borderRadius: '16px',
                    padding: '0.875rem 1rem',
                    boxShadow: '0 2px 10px rgba(8, 59, 86, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: sos.bg,
                        border: `1px solid ${sos.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: sos.text,
                      }}
                    >
                      <IconComp size={18} color={sos.text} />
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', marginTop: '0.25rem' }}>
                      {sos.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)' }}>
                      {sos.desc}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTriggerSOS(sos.category);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      borderRadius: '10px',
                      background: 'var(--aarizo-coral, #F06543)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 2px 6px rgba(240, 101, 67, 0.2)',
                    }}
                  >
                    <Radio size={13} color="#ffffff" />
                    <span>Tap for SOS</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Recent Emergency Activity Timeline Section */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              boxShadow: '0 2px 10px rgba(8, 59, 86, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="var(--aarizo-coral, #F06543)" />
                <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)' }}>Recent Emergency Activity</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--aarizo-coral, #F06543)', cursor: 'pointer' }}>View All</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {incidents.slice(0, 3).map((inc) => (
                <div
                  key={inc.id}
                  style={{
                    padding: '0.625rem 0.875rem',
                    borderRadius: '12px',
                    border: '1px solid var(--aarizo-border, #DCE8EF)',
                    background: 'var(--aarizo-pale-blue, #F4FAFE)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#DC2626',
                        flexShrink: 0,
                      }}
                    >
                      <ShieldAlert size={16} color="#DC2626" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--aarizo-text, #203746)' }}>{inc.title}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)' }}>
                        {inc.location} · {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      color: inc.status === 'RESOLVED' ? '#059669' : inc.status === 'TRIGGERED' ? '#DC2626' : '#D97706',
                      background: inc.status === 'RESOLVED' ? '#ECFDF5' : inc.status === 'TRIGGERED' ? '#FEF2F2' : '#FFFBEB',
                      border: `1px solid ${inc.status === 'RESOLVED' ? '#A7F3D0' : inc.status === 'TRIGGERED' ? '#FECACA' : '#FDE68A'}`,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {inc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* EXPERIENCE 2: CHILD SAFETY PASS                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'CHILD_SAFETY' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Child Safety Header Banner */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: 'var(--aarizo-pale-blue, #F4FAFE)',
                  border: '1px solid var(--aarizo-border, #DCE8EF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--aarizo-navy, #083B56)',
                  flexShrink: 0,
                }}
              >
                <Shield size={22} color="var(--aarizo-navy, #083B56)" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em' }}>
                  CHILD SAFETY
                </h1>
                <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: '0.125rem' }}>
                  Children registered in your family · Gate authorization &amp; security escorts
                </p>
              </div>
            </div>

            <ShieldCheck size={28} color="var(--aarizo-coral, #F06543)" />
          </div>

          {/* Canonical Source Info Callout */}
          <div
            style={{
              background: 'var(--aarizo-light-blue, #EAF6FC)',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <Info size={18} color="var(--aarizo-navy, #083B56)" className="shrink-0" />
            <span style={{ fontSize: '0.75rem', color: 'var(--aarizo-navy, #083B56)', fontWeight: 600, lineHeight: 1.4 }}>
              Integrated Household Data: Children are automatically loaded from your Household Family Registration (My Flat). No duplicate child registration needed.
            </span>
          </div>

          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Children registered in your family ({children.length})
            </h3>
          </div>

          {/* SECTION A: Eligible Children Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {children.map((child) => (
              <div
                key={child.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        color: 'var(--aarizo-navy, #083B56)',
                        background: 'var(--aarizo-light-blue, #EAF6FC)',
                        border: '1px solid var(--aarizo-border, #DCE8EF)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      PROTECTED CHILD PASS
                    </span>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        color: '#059669',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                      }}
                    >
                      SAFE ON PREMISES
                    </span>
                  </div>

                  {/* Profile Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'var(--aarizo-pale-blue, #F4FAFE)',
                        border: '1px solid var(--aarizo-border, #DCE8EF)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--aarizo-navy, #083B56)',
                        fontWeight: 800,
                        fontSize: '1.125rem',
                        flexShrink: 0,
                      }}
                    >
                      {child.childName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--aarizo-text, #203746)', margin: 0 }}>
                        {child.childName}
                      </h2>
                      <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: '0.125rem' }}>
                        Flat {child.flatCode} · Child · DOB 14 May 2018
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-blue, #176B91)', margin: 0, marginTop: '0.25rem', fontWeight: 600 }}>
                        Guardian: {child.guardianName} ({child.guardianPhone})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--aarizo-border, #DCE8EF)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEscortId(child.authorizedPickups[0]?.id || '');
                      setModalMode('GENERATE_PASS');
                    }}
                    style={{
                      flex: 1,
                      padding: '0.55rem 0.75rem',
                      borderRadius: '10px',
                      background: 'var(--aarizo-coral, #F06543)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.725rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 2px 8px rgba(240, 101, 67, 0.2)',
                    }}
                  >
                    <QrCode size={14} color="#ffffff" />
                    <span>Exit Pass</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalMode('MISSING_ALERT')}
                    style={{
                      flex: 1,
                      padding: '0.55rem 0.75rem',
                      borderRadius: '10px',
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#DC2626',
                      fontWeight: 800,
                      fontSize: '0.725rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <AlertTriangle size={14} color="#DC2626" />
                    <span>Report Missing</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* SECTION B: Authorized Pickups & Escorts */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0 }}>
                  Authorized Pickups &amp; Escorts
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: '0.125rem' }}>
                  Verified caretakers authorized for gate pickup.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalMode('ADD_PICKUP')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  background: 'var(--aarizo-light-blue, #EAF6FC)',
                  border: '1px solid var(--aarizo-border, #DCE8EF)',
                  color: 'var(--aarizo-navy, #083B56)',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <UserPlus size={14} color="var(--aarizo-coral, #F06543)" />
                <span>+ Add Escort</span>
              </button>
            </div>

            {/* Escort Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {(children[0]?.authorizedPickups || [
                {
                  id: 'pic-1',
                  name: 'Radha Bai',
                  phone: '+91 98199 88776',
                  relationship: 'Trusted Family Maid / Nanny',
                  idProofType: 'Aadhaar Card',
                  idProofNumber: 'XXXX-XXXX-9901',
                  isApproved: true,
                },
                {
                  id: 'pic-2',
                  name: 'Santosh Yadav',
                  phone: '+91 98333 22110',
                  relationship: 'School Bus Driver (Route 12)',
                  idProofType: 'Commercial Driving License',
                  idProofNumber: 'DL-MH02-2018-9182',
                  isApproved: true,
                }
              ]).map((escort) => (
                <div
                  key={escort.id}
                  onClick={() => setSelectedEscortForDetail(escort)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--aarizo-border, #DCE8EF)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'var(--aarizo-pale-blue, #F4FAFE)',
                        border: '1px solid var(--aarizo-border, #DCE8EF)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--aarizo-navy, #083B56)',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        flexShrink: 0,
                      }}
                    >
                      {escort.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--aarizo-text, #203746)' }}>
                        {escort.name} <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600 }}>({escort.relationship})</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)' }}>
                        📞 {escort.phone} · {escort.idProofType}: {escort.idProofNumber}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEscortId(escort.id);
                      setModalMode('GENERATE_PASS');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.35rem 0.625rem',
                      borderRadius: '8px',
                      background: 'var(--aarizo-coral, #F06543)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.6875rem',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <QrCode size={12} color="#ffffff" />
                    <span>Pass</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* EXPERIENCE 3: COMMAND CONSOLE (ADMIN/SECURITY)                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'COMMAND_CONSOLE' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
              borderRadius: '16px',
              padding: '0.875rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 10px rgba(8, 59, 86, 0.04)',
            }}
          >
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Live Incident Feed &amp; Response Console
            </h3>
            <button onClick={loadData} style={{ background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 700, color: 'var(--aarizo-coral, #F06543)', cursor: 'pointer' }}>
              Refresh
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {incidents.map((inc) => (
              <div
                key={inc.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                      {inc.category}
                    </span>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aarizo-text, #203746)', margin: 0 }}>
                      {inc.title}
                    </h4>
                  </div>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      color: inc.status === 'RESOLVED' ? '#059669' : '#DC2626',
                      background: inc.status === 'RESOLVED' ? '#ECFDF5' : '#FEF2F2',
                      border: `1px solid ${inc.status === 'RESOLVED' ? '#A7F3D0' : '#FECACA'}`,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '9999px',
                    }}
                  >
                    {inc.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>
                    Resident: <strong style={{ color: 'var(--aarizo-text, #203746)' }}>{inc.residentName}</strong> ({inc.flatCode}) · Phone: {inc.phone}
                  </div>
                  <div>Location: {inc.location} · Triggered: {new Date(inc.createdAt).toLocaleString()}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--aarizo-border, #DCE8EF)', flexWrap: 'wrap' }}>
                  {isAdminOrSecurity && inc.status === 'TRIGGERED' && (
                    <button
                      onClick={() => handleAcknowledge(inc.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        color: '#D97706',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      Acknowledge Alert
                    </button>
                  )}

                  {isAdminOrSecurity && (inc.status === 'TRIGGERED' || inc.status === 'ACKNOWLEDGED') && (
                    <button
                      onClick={() => {
                        setSelectedIncident(inc);
                        setModalMode('ASSIGN_RESPONDER');
                      }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: 'var(--aarizo-navy, #083B56)',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Assign Responder
                    </button>
                  )}

                  {isAdminOrSecurity && inc.status !== 'RESOLVED' && inc.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleResolve(inc.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        color: '#059669',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* EXPERIENCE 4: GATE VERIFIER (ADMIN/SECURITY)                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'GATE_VERIFIER' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
            maxWidth: '540px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <QrCode size={36} color="var(--aarizo-navy, #083B56)" style={{ margin: '0 auto 0.5rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0 }}>
              Gate Security Child Exit Verifier
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: '0.25rem 0 0' }}>
              Verify child name or QR pass against guardian authorization list.
            </p>
          </div>

          <form onSubmit={handleGateVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--aarizo-text, #203746)', marginBottom: '0.25rem' }}>
                Child Name or Pass Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aarav Malhotra"
                value={scanChildInput}
                onChange={(e) => setScanChildInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid var(--aarizo-border, #DCE8EF)',
                  borderRadius: '10px',
                  fontSize: '0.8125rem',
                  color: 'var(--aarizo-text, #203746)',
                  background: '#ffffff',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--aarizo-text, #203746)', marginBottom: '0.25rem' }}>
                Pickup Person Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sunita Devi (Nanny)"
                value={scanPickupInput}
                onChange={(e) => setScanPickupInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  border: '1px solid var(--aarizo-border, #DCE8EF)',
                  borderRadius: '10px',
                  fontSize: '0.8125rem',
                  color: 'var(--aarizo-text, #203746)',
                  background: '#ffffff',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '10px',
                background: 'var(--aarizo-coral, #F06543)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 8px rgba(240, 101, 67, 0.2)',
                marginTop: '0.5rem',
              }}
            >
              <ShieldCheck size={18} color="#ffffff" />
              <span>Verify Guardian Authorization</span>
            </button>
          </form>

          {gateResult && (
            <div
              style={{
                padding: '0.875rem',
                borderRadius: '12px',
                marginTop: '1rem',
                background: gateResult.isValid ? '#ECFDF5' : '#FEF2F2',
                border: gateResult.isValid ? '1px solid #A7F3D0' : '1px solid #FECACA',
                color: gateResult.isValid ? '#065F46' : '#991B1B',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {gateResult.reason || (gateResult.isValid ? 'Guardian Authorization Verified!' : 'Authorization Failed')}
            </div>
          )}
        </div>
      )}

      {/* AUTHORIZED ESCORT DETAILS MODAL */}
      <Modal
        isOpen={!!selectedEscortForDetail}
        onClose={() => setSelectedEscortForDetail(null)}
        title="Authorized Escort Details"
        subtitle="Security verified escort profile for child pickup"
        icon={<Users size={20} />}
        maxWidth="540px"
      >
        {selectedEscortForDetail && (
          <div className="space-y-4">
            <div className="bg-[#F8FAFC] border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedEscortForDetail.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'}
                  alt={selectedEscortForDetail.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-slate-900 text-base">{selectedEscortForDetail.name}</h4>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-200/80 text-slate-700">
                      {selectedEscortForDetail.relationship}
                    </span>
                  </div>
                  <p className="text-xs text-[#176B91] font-bold flex items-center gap-1">
                    <Phone size={12} /> {selectedEscortForDetail.phone}
                  </p>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <IdCard size={12} /> {selectedEscortForDetail.idProofType}: {selectedEscortForDetail.idProofNumber}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 uppercase shrink-0">
                APPROVED
              </span>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/70 p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#F06543]" />
                <span>Escort Information</span>
              </h4>
              <div className="space-y-2 text-xs divide-y divide-slate-200/60">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500 font-medium">Relationship:</span>
                  <strong className="text-slate-900 font-bold">{selectedEscortForDetail.relationship}</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500 font-medium">ID Type:</span>
                  <strong className="text-slate-900 font-bold">{selectedEscortForDetail.idProofType}</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500 font-medium">ID Number:</span>
                  <strong className="text-slate-900 font-bold">{selectedEscortForDetail.idProofNumber}</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500 font-medium">Contact Number:</span>
                  <strong className="text-slate-900 font-bold">{selectedEscortForDetail.phone}</strong>
                </div>
              </div>
            </div>

            <div className="bg-[#F0F9FF] border border-[#BAE6FD] p-4 rounded-2xl space-y-2">
              <h4 className="text-xs font-extrabold text-[#0369A1] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0284C7]" />
                <span>Permissions</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Authorized to pick up child from gate</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Can generate gate exit passes</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleRemoveEscort(selectedEscortForDetail.id);
                  setSelectedEscortForDetail(null);
                }}
                className="flex-1 py-3 px-4 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 size={15} />
                <span>Remove Escort</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedEscortId(selectedEscortForDetail.id);
                  setSelectedEscortForDetail(null);
                  setModalMode('GENERATE_PASS');
                }}
                className="flex-1 py-3 px-4 bg-[#F06543] hover:bg-[#D95333] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <QrCode size={15} />
                <span>Generate Pass</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Assign Responder */}
      <Modal
        isOpen={modalMode === 'ASSIGN_RESPONDER' && !!selectedIncident}
        onClose={() => setModalMode(null)}
        title="Assign Emergency Responder"
        subtitle="Dispatch society guard or supervisor to incident location"
        icon={<Radio size={20} />}
        maxWidth="460px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-100 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('assign-responder-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2.5 text-xs font-extrabold rounded-xl shadow-md bg-[#083B56] text-white"
            >
              Dispatch Responder
            </button>
          </div>
        }
      >
        <form id="assign-responder-form" onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Responder Name</label>
            <input
              type="text"
              required
              value={responderForm.responderName}
              onChange={(e) => setResponderForm({ ...responderForm, responderName: e.target.value })}
              className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Responder Role</label>
            <input
              type="text"
              required
              value={responderForm.responderRole}
              onChange={(e) => setResponderForm({ ...responderForm, responderRole: e.target.value })}
              className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Generate Pass */}
      <Modal
        isOpen={modalMode === 'GENERATE_PASS'}
        onClose={() => setModalMode(null)}
        title="Generate Child Gate Exit Pass"
        subtitle={`Temporary gate verification pass for ${currentChild?.childName || 'child'}`}
        icon={<QrCode size={20} />}
        maxWidth="460px"
        footer={
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setModalMode(null);
                setAlertSuccess('Child Gate Exit Pass generated and active for 4 hours!');
                setTimeout(() => setAlertSuccess(null), 5000);
              }}
              className="flex-1 py-3 bg-[#F06543] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <QrCode size={15} /> Confirm Pass
            </button>
          </div>
        }
      >
        <div className="space-y-3.5 text-xs">
          <p className="text-slate-600 font-medium leading-relaxed">
            Generating QR gate exit pass for <strong>{currentChild?.childName}</strong> (Flat {flatNumber}).
          </p>
          <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-800 space-y-1 font-medium">
            <div className="flex justify-between font-bold text-xs">
              <span>Authorized Escort:</span>
              <span>{currentChild?.authorizedPickups.find(p => p.id === selectedEscortId)?.name || 'Radha Bai'}</span>
            </div>
            <p className="text-[11px] text-emerald-700">🔒 Gate guard will scan QR and verify escort photo ID before exit.</p>
          </div>
        </div>
      </Modal>

      {/* Modal: Add Escort / Pickup */}
      <Modal
        isOpen={modalMode === 'ADD_PICKUP'}
        onClose={() => setModalMode(null)}
        title="Add Authorized Escort"
        subtitle="Register trusted pickup person or escort for child safety"
        icon={<UserPlus size={20} />}
        maxWidth="480px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-100 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('add-pickup-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2.5 text-white text-xs font-extrabold rounded-xl shadow-md bg-[#F06543]"
            >
              Save Escort
            </button>
          </div>
        }
      >
        <form id="add-pickup-form" onSubmit={handleAddPickupSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={pickupForm.name}
              onChange={(e) => setPickupForm({ ...pickupForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                required
                value={pickupForm.phone}
                onChange={(e) => setPickupForm({ ...pickupForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
              <input
                type="text"
                required
                value={pickupForm.relationship}
                onChange={(e) => setPickupForm({ ...pickupForm, relationship: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Missing Alert */}
      <Modal
        isOpen={modalMode === 'MISSING_ALERT'}
        onClose={() => setModalMode(null)}
        title="High Priority Security Alarm"
        subtitle="Immediate security alarm & gate exit lockdown"
        icon={<AlertTriangle size={20} className="text-rose-600" />}
        maxWidth="460px"
        footer={
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setModalMode(null);
                setAlertSuccess('HIGH PRIORITY CHILD MISSING ALERT DISPATCHED TO MAIN GATE SECURITY TERMINAL!');
                setTimeout(() => setAlertSuccess(null), 6000);
              }}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
            >
              DISPATCH ALARM NOW
            </button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          This will trigger an immediate audio alarm and gate lockdown notification on all Security Gate Terminals for Flat {flatNumber} ({currentChild?.childName}).
        </p>
      </Modal>
    </div>
  );
};
