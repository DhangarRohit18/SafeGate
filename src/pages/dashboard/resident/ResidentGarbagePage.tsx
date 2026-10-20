import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { housekeepingService } from '../../../services/housekeepingService';
import type { GarbagePickupLog, HousekeepingTask } from '../../../types/housekeeping';
import {
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Building2,
  Waves,
  Clock,
  Send,
  Info,
  X,
  Recycle,
  Layers,
  Check
} from 'lucide-react';

export const ResidentGarbagePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const societyId = (currentUser as any)?.societyId || 'soc-1';
  const flatNumber = (currentUser as any)?.flatDetails
    ? String((currentUser as any).flatDetails).replace(/Â·|â€¢|Ã¢â‚¬Â¢/g, '·')
    : 'Tower B · Flat 1204';
  const tower = 'Tower B';
  const floor = '12th Floor';

  const [activeTab, setActiveTab] = useState<'ALL' | 'WASTE' | 'POOL' | 'COMMON_AREAS' | 'REPORT'>('ALL');
  const [garbageLogs, setGarbageLogs] = useState<GarbagePickupLog[]>([]);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [reportNotes, setReportNotes] = useState('');
  const [reportCategory, setReportCategory] = useState<'DOORSTEP_MISSED' | 'LITTER' | 'POOL_ISSUE' | 'LIFT_SANITATION'>('DOORSTEP_MISSED');
  const [showReportModal, setShowReportModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [societyId]);

  const loadData = () => {
    const logs = housekeepingService
      .getGarbagePickupLogs(societyId)
      .filter((g) => g.flatNumber === flatNumber || g.flatNumber === 'A-101' || g.flatNumber.includes('1204'));
    setGarbageLogs(logs);

    const allTasks = housekeepingService.getTasks(societyId);
    setTasks(allTasks);
  };

  const poolTask = useMemo(() => tasks.find((t) => t.category === 'SWIMMING_POOL'), [tasks]);
  const myFlatLog = garbageLogs[0] || null;

  const handleConfirmPickup = (logId: string) => {
    housekeepingService.confirmResidentGarbagePickup(societyId, logId);
    setActionMessage('Garbage collection confirmed! Thank you for keeping Dwellora clean.');
    loadData();
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleReportMissed = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedNotes = `[${reportCategory.replace(/_/g, ' ')}] ${reportNotes || 'Missed collection reported'}`;
    housekeepingService.reportMissedGarbagePickup(societyId, tower, floor, flatNumber, formattedNotes);
    setActionMessage('Cleanliness report submitted to Housekeeping Supervisor.');
    setShowReportModal(false);
    setReportNotes('');
    loadData();
    setTimeout(() => setActionMessage(null), 4000);
  };

  const isCollected = myFlatLog?.status === 'COLLECTED';
  const isConfirmed = myFlatLog?.confirmedByResident;

  return (
    <div style={{ background: '#F7FBFE', minHeight: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-44 space-y-4">

        {/* 1. Header Card (Standard App Header Style) */}
        <div
          style={{
            background: 'var(--aarizo-card-bg, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <button
              onClick={() => navigate(-1)}
              aria-label="Back"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#ffffff',
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
              <h1
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: 'var(--aarizo-navy, #083B56)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Garbage &amp; Cleanliness Hub
              </h1>
              <p
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--aarizo-text-secondary, #657785)',
                  margin: 0,
                  marginTop: 2,
                }}
              >
                Green Valley Society · Doorstep waste collection, pool hygiene &amp; sanitization audits
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #DCE8EF',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#083B56',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Building2 size={14} style={{ color: '#0284C7' }} />
              <span>{flatNumber}</span>
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.5rem 0.875rem',
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
              <AlertTriangle size={15} /> Report Missed Pickup
            </button>
          </div>
        </div>

        {/* Action Message Alert */}
        {actionMessage && (
          <div
            style={{
              padding: '0.875rem 1rem',
              borderRadius: '12px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              fontSize: '0.8125rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              boxShadow: '0 1px 3px rgba(16, 185, 129, 0.1)',
            }}
          >
            <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* 2. Metrics Summary Grid (4 Cards - Uniform App Style) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
          className="sm:grid-cols-4"
        >
          {/* Card 1: Today's Pickup */}
          <div
            style={{
              background: 'var(--aarizo-card-bg, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: isCollected ? 'rgba(22, 163, 74, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCollected ? '#16A34A' : '#D97706',
                flexShrink: 0,
              }}
            >
              <Trash2 size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  color: 'var(--aarizo-text-secondary, #657785)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                DOORSTEP PICKUP
              </div>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: isCollected ? '#16A34A' : '#D97706',
                  lineHeight: 1.1,
                }}
              >
                {myFlatLog ? myFlatLog.status : 'PENDING'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                07:00 - 09:30 AM Shift
              </div>
            </div>
          </div>

          {/* Card 2: Resident Confirmation */}
          <div
            style={{
              background: 'var(--aarizo-card-bg, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: isConfirmed ? 'rgba(22, 163, 74, 0.1)' : 'rgba(240, 101, 67, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isConfirmed ? '#16A34A' : '#F06543',
                flexShrink: 0,
              }}
            >
              {isConfirmed ? <CheckCircle2 size={18} /> : <Clock size={18} />}
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  color: 'var(--aarizo-text-secondary, #657785)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                CONFIRMATION
              </div>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: isConfirmed ? '#16A34A' : '#083B56',
                  lineHeight: 1.1,
                }}
              >
                {isConfirmed ? 'Verified' : 'Pending Tap'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                Flat {flatNumber.split('·')[1]?.trim() || flatNumber}
              </div>
            </div>
          </div>

          {/* Card 3: Swimming Pool Water */}
          <div
            style={{
              background: 'var(--aarizo-card-bg, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(2, 132, 199, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284C7',
                flexShrink: 0,
              }}
            >
              <Waves size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  color: 'var(--aarizo-text-secondary, #657785)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                POOL HYGIENE
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0284C7', lineHeight: 1.1 }}>
                pH 7.4 · Optimal
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                Chlorine 2.5 PPM
              </div>
            </div>
          </div>

          {/* Card 4: Common Sanitization */}
          <div
            style={{
              background: 'var(--aarizo-card-bg, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(147, 51, 234, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9333EA',
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  color: 'var(--aarizo-text-secondary, #657785)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                COMMON AREAS
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#083B56', lineHeight: 1.1 }}>
                Sanitized
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                Lobbies, Gym, Elevators
              </div>
            </div>
          </div>
        </div>

        {/* 3. Filter Pills Tab Bar (Exact standard uniform pill bar) */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'ALL', label: 'Overview', icon: <Layers size={14} /> },
            { id: 'WASTE', label: 'Waste Collection', icon: <Trash2 size={14} /> },
            { id: 'POOL', label: 'Pool Water Quality', icon: <Waves size={14} /> },
            { id: 'COMMON_AREAS', label: 'Common Area Sanitization', icon: <Sparkles size={14} /> },
            { id: 'REPORT', label: 'Report Issue', icon: <AlertTriangle size={14} /> },
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'REPORT') {
                    setShowReportModal(true);
                  } else {
                    setActiveTab(tab.id as any);
                  }
                }}
                style={{
                  padding: '0.5rem 0.925rem',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: isTabActive ? 'none' : '1px solid #DCE8EF',
                  background: isTabActive ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
                  color: isTabActive ? '#ffffff' : 'var(--aarizo-navy, #083B56)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                  boxShadow: isTabActive ? '0 2px 6px rgba(240, 101, 67, 0.25)' : '0 1px 2px rgba(8, 59, 86, 0.02)',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. Tab Content: Main Layout */}
        <div className="space-y-4">

          {/* Section A: Doorstep Waste Collection Card */}
          {(activeTab === 'ALL' || activeTab === 'WASTE') && (
            <div
              style={{
                background: 'var(--aarizo-card-bg, #ffffff)',
                borderRadius: '16px',
                border: '1px solid var(--aarizo-border, #DCE8EF)',
                padding: '1.25rem',
                boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
              }}
              className="space-y-4"
            >
              {/* Header inside card */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '12px',
                      background: 'rgba(2, 132, 199, 0.1)',
                      color: '#0284C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={22} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: 'var(--aarizo-navy, #083B56)',
                        margin: 0,
                      }}
                    >
                      Today's Doorstep Waste Collection
                    </h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
                      Keep wet and dry bins outside your door between 07:00 AM and 09:30 AM
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: '#F0F9FF',
                      color: '#0369A1',
                      border: '1px solid #BAE6FD',
                    }}
                  >
                    07:00 AM - 09:30 AM Shift
                  </span>
                </div>
              </div>

              {/* Status Stepper / Progress Bar */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '1rem',
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Step 1: Schedule Window */}
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                      STEP 1 · SCHEDULE
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#083B56', marginTop: 2 }}>
                      Window Active
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 4 }}>
                      <Check size={14} /> 07:00 AM Daily
                    </div>
                  </div>

                  {/* Step 2: Collector Pickup */}
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                      STEP 2 · HOUSEKEEPING
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#083B56', marginTop: 2 }}>
                      {isCollected ? 'Collected' : 'In Progress'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: isCollected ? '#10B981' : '#D97706',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        marginTop: 4,
                      }}
                    >
                      {isCollected ? (
                        <>
                          <Check size={14} /> Completed
                        </>
                      ) : (
                        <>
                          <Clock size={14} /> Morning Run
                        </>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Resident Confirmation */}
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                      STEP 3 · YOUR CONFIRMATION
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#083B56', marginTop: 2 }}>
                      {isConfirmed ? 'Confirmed' : 'Awaiting Tap'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: isConfirmed ? '#10B981' : '#F06543',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        marginTop: 4,
                      }}
                    >
                      {isConfirmed ? (
                        <>
                          <CheckCircle2 size={14} /> Verified
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} /> Action Required
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Row with Staff Note */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Info size={14} style={{ color: '#0284C7' }} />
                    <span>
                      Unit: <strong>{flatNumber}</strong> · Collector assigned: <strong>Sunil Waste Collector</strong>
                    </span>
                  </div>
                  {myFlatLog?.staffNotes && (
                    <span className="italic text-slate-500">
                      "{myFlatLog.staffNotes}"
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                {myFlatLog && !myFlatLog.confirmedByResident && (
                  <button
                    onClick={() => handleConfirmPickup(myFlatLog.id)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      background: '#16A34A',
                      color: '#ffffff',
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                    }}
                    className="w-full sm:flex-1 hover:bg-emerald-700 transition"
                  >
                    <CheckCircle2 size={16} /> Confirm Pickup
                  </button>
                )}

                <button
                  onClick={() => setShowReportModal(true)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    background: '#ffffff',
                    color: '#DC2626',
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    border: '1px solid #FECACA',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                  className="w-full sm:flex-1 hover:bg-rose-50 transition"
                >
                  <AlertTriangle size={16} /> Report Missed Pickup
                </button>
              </div>

              {/* Waste Segregation Guidelines Card */}
              <div className="pt-2">
                <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#083B56', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Recycle size={14} style={{ color: '#16A34A' }} /> Mandatory Waste Segregation Norms
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Wet Waste */}
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}></span>
                      Green Bin · Organic / Wet
                    </div>
                    <p style={{ fontSize: '0.6875rem', color: '#15803D', margin: 0, marginTop: 4, lineHeight: 1.3 }}>
                      Kitchen scraps, fruit/vegetable peels, leftover meals, eggshells, and garden clippings.
                    </p>
                  </div>

                  {/* Dry Waste */}
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }}></span>
                      Blue Bin · Dry Recyclable
                    </div>
                    <p style={{ fontSize: '0.6875rem', color: '#1D4ED8', margin: 0, marginTop: 4, lineHeight: 1.3 }}>
                      Clean cardboard cartons, plastic packaging, glass bottles, metal tins, and newsprints.
                    </p>
                  </div>

                  {/* Hazardous */}
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      background: '#FFF1F2',
                      border: '1px solid #FECDD3',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9F1239', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E11D48', display: 'inline-block' }}></span>
                      Red Bag · Domestic Hazardous
                    </div>
                    <p style={{ fontSize: '0.6875rem', color: '#BE123C', margin: 0, marginTop: 4, lineHeight: 1.3 }}>
                      Batteries, expired medicines, sanitary napkins, tube lights, and aerosol cans.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section B: Swimming Pool Water Hygiene Card */}
          {(activeTab === 'ALL' || activeTab === 'POOL') && poolTask && (
            <div
              style={{
                background: 'var(--aarizo-card-bg, #ffffff)',
                borderRadius: '16px',
                border: '1px solid var(--aarizo-border, #DCE8EF)',
                padding: '1.25rem',
                boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
              }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '12px',
                      background: 'rgba(2, 132, 199, 0.1)',
                      color: '#0284C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Waves size={22} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: 'var(--aarizo-navy, #083B56)',
                        margin: 0,
                      }}
                    >
                      Swimming Pool Water Hygiene
                    </h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
                      Clubhouse Ground Floor Pool · Daily chemical dosing &amp; filtration logs
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <CheckCircle2 size={13} /> COMPLETED &amp; VERIFIED
                </span>
              </div>

              {/* 3 Chemical Balance Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  style={{
                    padding: '0.875rem',
                    borderRadius: '12px',
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#0369A1', textTransform: 'uppercase' }}>
                    WATER pH LEVEL
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#083B56', marginTop: 2 }}>
                    7.4 pH
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#0284C7', fontWeight: 600, marginTop: 2 }}>
                    Safe Range: 7.2 - 7.6 pH (Balanced)
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.875rem',
                    borderRadius: '12px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#15803D', textTransform: 'uppercase' }}>
                    CHLORINE PPM
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#083B56', marginTop: 2 }}>
                    2.5 PPM
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#16A34A', fontWeight: 600, marginTop: 2 }}>
                    Target: 2.0 - 3.0 PPM (Disinfected)
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.875rem',
                    borderRadius: '12px',
                    background: '#FAF5FF',
                    border: '1px solid #E9D5FF',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#7E22CE', textTransform: 'uppercase' }}>
                    FILTER BACKWASH
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#083B56', marginTop: 2 }}>
                    Clean Cycle
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#9333EA', fontWeight: 600, marginTop: 2 }}>
                    Skimmer baskets cleared clean
                  </div>
                </div>
              </div>

              {/* Technician Notes Box */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '0.875rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                  <span>
                    Audited by: <strong>{poolTask.assignedStaffName}</strong> · Daily Shift: <strong>{poolTask.startTime} - {poolTask.endTime}</strong>
                  </span>
                  {poolTask.staffNotes && (
                    <div style={{ fontStyle: 'italic', color: '#64748B', marginTop: 4 }}>
                      "{poolTask.staffNotes}"
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#083B56',
                  }}
                >
                  Inspected Today
                </div>
              </div>

              {/* Checklist Grid */}
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#083B56', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Pool Chemical Maintenance Checklist
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {poolTask.checklist.map((chk) => (
                    <div
                      key={chk.id}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '10px',
                        background: chhkCompletedBg(chk.isCompleted),
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        color: chk.isCompleted ? '#1E293B' : '#64748B',
                      }}
                    >
                      <CheckCircle2 size={16} style={{ color: chk.isCompleted ? '#16A34A' : '#CBD5E1', flexShrink: 0 }} />
                      <span className={chk.isCompleted ? 'font-semibold' : ''}>{chk.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section C: Common Areas Sanitization Tasks */}
          {(activeTab === 'ALL' || activeTab === 'COMMON_AREAS') && (
            <div
              style={{
                background: 'var(--aarizo-card-bg, #ffffff)',
                borderRadius: '16px',
                border: '1px solid var(--aarizo-border, #DCE8EF)',
                padding: '1.25rem',
                boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
              }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '12px',
                      background: 'rgba(147, 51, 234, 0.1)',
                      color: '#9333EA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: 'var(--aarizo-navy, #083B56)',
                        margin: 0,
                      }}
                    >
                      Common Area Sanitization Logs
                    </h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
                      Tower corridors, fitness gym, passenger elevators &amp; clubhouse sanitization
                    </p>
                  </div>
                </div>
              </div>

              {/* Task Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tasks
                  .filter((t) => t.category !== 'SWIMMING_POOL')
                  .map((task) => (
                    <div
                      key={task.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '14px',
                        background: '#ffffff',
                        border: '1px solid #DCE8EF',
                        boxShadow: '0 1px 3px rgba(8, 59, 86, 0.03)',
                      }}
                      className="space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#083B56', lineHeight: 1.2 }}>
                            {task.title}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: 2 }}>
                            {task.areaLocation}
                          </div>
                        </div>

                        <span
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            background: getStatusBg(task.status),
                            color: getStatusColor(task.status),
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {task.status}
                        </span>
                      </div>

                      <div
                        style={{
                          background: '#F8FAFC',
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.6875rem',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Assigned: <strong>{task.assignedStaffName}</strong></span>
                        <span>{task.startTime} - {task.endTime}</span>
                      </div>

                      {task.missedReason && (
                        <div style={{ fontSize: '0.6875rem', color: '#DC2626', background: '#FEF2F2', padding: '0.35rem 0.5rem', borderRadius: '6px' }}>
                          Reason: {task.missedReason}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Report Missed Pickup / Cleanliness Issue Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #DCE8EF',
                maxWidth: 480,
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                padding: '1.25rem',
              }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '10px',
                      background: 'rgba(240, 101, 67, 0.1)',
                      color: '#F06543',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#083B56', margin: 0 }}>
                      Report Cleanliness Issue
                    </h3>
                    <p style={{ fontSize: '0.6875rem', color: '#64748B', margin: 0 }}>
                      Flat {flatNumber} · Housekeeping Escalation
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowReportModal(false)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: '#F1F5F9',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleReportMissed} className="space-y-3">
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Select Issue Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'DOORSTEP_MISSED', label: 'Missed Doorstep Pickup' },
                      { id: 'LITTER', label: 'Common Area Litter' },
                      { id: 'POOL_ISSUE', label: 'Pool Water Clarity' },
                      { id: 'LIFT_SANITATION', label: 'Lift / Staircase Cleaning' },
                    ].map((cat) => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setReportCategory(cat.id as any)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '8px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          textAlign: 'left',
                          border: reportCategory === cat.id ? '2px solid #F06543' : '1px solid #E2E8F0',
                          background: reportCategory === cat.id ? '#FFF7ED' : '#ffffff',
                          color: reportCategory === cat.id ? '#C2410C' : '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Details for Housekeeping Supervisor
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Garbage was placed outside by 07:00 AM, but was not collected during the morning shift."
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.8125rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    style={{
                      padding: '0.5rem 0.875rem',
                      borderRadius: '8px',
                      background: '#F1F5F9',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: '#DC2626',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                    }}
                  >
                    <Send size={14} /> Submit Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function chhkCompletedBg(isCompleted: boolean): string {
  return isCompleted ? '#F0FDF4' : '#F8FAFC';
}

function getStatusBg(status: string): string {
  switch (status) {
    case 'COMPLETED':
    case 'VERIFIED':
      return '#ECFDF5';
    case 'IN_PROGRESS':
      return '#EFF6FF';
    case 'MISSED':
      return '#FEF2F2';
    default:
      return '#F8FAFC';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
    case 'VERIFIED':
      return '#059669';
    case 'IN_PROGRESS':
      return '#2563EB';
    case 'MISSED':
      return '#DC2626';
    default:
      return '#64748B';
  }
}
