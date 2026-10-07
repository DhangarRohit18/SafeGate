import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  CheckCircle,
  ShieldCheck,
  UserX,
  Bell,
  ArrowLeft,
  UserPlus,
  Search,
  RefreshCw,
  Users,
  CheckCircle2,
  PlusCircle,
  FileCheck,
} from 'lucide-react';
import { domesticHelpService } from '../services/domesticHelpService';
import type { DomesticWorker, HouseholdAssignment, AttendanceRecord } from '../types';
import { useAuth } from '../../../context/AuthContext';
import { useRBAC } from '../../../hooks/useRBAC';
import { realtimeService } from '../../../services/realtimeService';
import { DataTable } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';
import { Modal } from '../../../components/ui/Modal';

export const DomesticHelpManager: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { activeRole } = useRBAC();

  const [residentWorkers, setResidentWorkers] = useState<{ worker: DomesticWorker; assignment: HouseholdAssignment }[]>([]);
  const [allWorkers, setAllWorkers] = useState<DomesticWorker[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [realtimeEntryAlert, setRealtimeEntryAlert] = useState<string | null>(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Security gate scan simulation state
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('DW-101');
  const [scanResultMsg, setScanResultMsg] = useState<{ success?: boolean; message?: string }>({});

  // Modals
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [workerToLink, setWorkerToLink] = useState('DW-101');

  // New worker form
  const [newWorkerForm, setNewWorkerForm] = useState({
    name: '',
    workerType: 'Maid',
    phone: '',
    passCode: '',
  });

  const loadData = () => {
    if (activeRole === 'resident') {
      const rw = domesticHelpService.getWorkersForResident(currentUser?.id || 'res-1', 'soc-gvs');
      setResidentWorkers(rw);
      setAttendanceLogs(domesticHelpService.getAttendanceLogs('soc-gvs', currentUser?.id || 'res-1'));
    } else {
      setAllWorkers(domesticHelpService.getAllWorkersForAdmin('soc-gvs'));
      setAttendanceLogs(domesticHelpService.getAttendanceLogs('soc-gvs'));
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time worker gate entry/exit events
    const unsubscribe = realtimeService.subscribe('WORKER_ENTRY_EXIT', (msg) => {
      if (msg.payload && msg.payload.type === 'WORKER_CHECKED_IN') {
        const alertStr = `Your ${msg.payload.workerType.toLowerCase()} ${msg.payload.workerName} entered at ${msg.payload.entryTime}`;
        setRealtimeEntryAlert(alertStr);
      }
      loadData();
    });

    return () => unsubscribe();
  }, [activeRole]);

  const handleGateScanCheckIn = () => {
    const res = domesticHelpService.processGateScanCheckIn(selectedWorkerId, 'Main Gate 1', 'Guard R. Singh');
    setScanResultMsg(res);
    loadData();
  };

  const handleGateScanCheckOut = () => {
    const res = domesticHelpService.processGateScanCheckOut(selectedWorkerId, 'Main Gate 1', 'Guard R. Singh');
    setScanResultMsg(res);
    loadData();
  };

  const handleRevokeConsent = (assignmentId: string) => {
    domesticHelpService.revokeHouseholdAccess(assignmentId);
    loadData();
  };

  const handleLinkWorker = (e: React.FormEvent) => {
    e.preventDefault();
    const targetWorker = domesticHelpService.getAllWorkersForAdmin('soc-gvs').find(w => w.id === workerToLink);
    if (targetWorker) {
      domesticHelpService.linkWorkerToResident(
        workerToLink,
        currentUser?.id || 'user-resident-01',
        currentUser?.name || 'Sarvesh Kulkarni',
        currentUser?.flatDetails || 'Tower B · B-1204'
      );
      setShowLinkModal(false);
      loadData();
    }
  };

  const handleAddWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerForm.name) return;
    
    const passCodeStr = newWorkerForm.passCode || `PASS-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create new worker mock entry
    const newWorker: DomesticWorker = {
      id: `DW-${Date.now().toString().slice(-3)}`,
      name: newWorkerForm.name,
      workerType: newWorkerForm.workerType.toUpperCase() as any,
      phone: newWorkerForm.phone || '+91 98765 43210',
      avatarUrl: `https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80`,
      passCode: passCodeStr,
      qrCode: passCodeStr,
      verificationStatus: 'VERIFIED',
      overallStatus: 'CHECKED_OUT',
      societyId: 'soc-gvs',
    };

    setAllWorkers((prev) => [newWorker, ...prev]);
    setShowAddModal(false);
    setNewWorkerForm({ name: '', workerType: 'Maid', phone: '', passCode: '' });
    alert('New domestic staff registered successfully.');
  };

  // Filtered Workers
  const filteredWorkers = allWorkers.filter((w) => {
    if (activeCategory === 'CHECKED_IN' && w.overallStatus !== 'CHECKED_IN') return false;
    if (activeCategory !== 'ALL' && activeCategory !== 'CHECKED_IN' && w.workerType.toUpperCase() !== activeCategory.toUpperCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        w.name.toLowerCase().includes(q) ||
        w.passCode.toLowerCase().includes(q) ||
        w.workerType.toLowerCase().includes(q) ||
        (w.phone && w.phone.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ minHeight: '100%', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: '2.5rem' }}>
      {/* ── Subheader Bar matching all Admin tabs ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1rem 0.75rem',
          background: 'var(--aarizo-card-blue, #F4FAFE)',
          borderBottom: '1px solid var(--aarizo-border, #DCE8EF)',
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em' }}>
              Domestic Help &amp; Household Staff
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Staff linkages, consent management, QR gate check-in &amp; attendance logs
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {activeRole === 'resident' ? (
            <button
              onClick={() => setShowLinkModal(true)}
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
              }}
            >
              <UserPlus size={15} /> Link Staff
            </button>
          ) : (
            <button
              onClick={() => setShowAddModal(true)}
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
              }}
            >
              <PlusCircle size={15} /> Register Staff
            </button>
          )}

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '10px',
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              color: 'var(--aarizo-navy, #083B56)',
              fontWeight: 800,
              fontSize: '0.75rem',
            }}
          >
            <ShieldCheck size={14} className="text-emerald-600" /> Verified Network
          </span>
        </div>
      </div>

      {/* ── Summary Metrics Cards ── */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '14px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'var(--aarizo-card-blue, #F4FAFE)', border: '1px solid var(--aarizo-border, #DCE8EF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aarizo-navy, #083B56)', flexShrink: 0 }}>
              <Users size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>TOTAL STAFF</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)' }}>{allWorkers.length || 3}</span>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '14px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>CHECKED IN</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                {allWorkers.filter((w) => w.overallStatus === 'CHECKED_IN').length || 1}
              </span>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '14px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#F0F9FF', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7', flexShrink: 0 }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>VERIFIED</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284C7' }}>
                {allWorkers.filter((w) => w.verificationStatus === 'VERIFIED').length || 2}
              </span>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '14px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', flexShrink: 0 }}>
              <FileCheck size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>POLICE DOCS</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706' }}>{allWorkers.length || 3}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Filter Pills ── */}
      <div className="max-w-7xl mx-auto w-full" style={{ padding: '0.75rem 1rem 0.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'ALL', label: `All Staff (${allWorkers.length})` },
            { key: 'MAID', label: 'Maids' },
            { key: 'DRIVER', label: 'Drivers' },
            { key: 'COOK', label: 'Cooks' },
            { key: 'CHECKED_IN', label: 'Currently Checked In' },
          ].map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: isActive ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
                  border: '1px solid var(--aarizo-border, #DCE8EF)',
                  borderRadius: '10px',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: isActive ? '#ffffff' : 'var(--aarizo-text, #203746)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 pt-2 space-y-4">
        {/* Real-time Alert Banner */}
        {realtimeEntryAlert && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '14px', padding: '0.875rem 1rem' }} className="flex justify-between items-center text-emerald-900 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Bell size={16} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold text-emerald-700 tracking-wider">Live Gate Entry Alert</span>
                <p className="font-bold text-xs sm:text-sm text-emerald-950" style={{ margin: 0 }}>{realtimeEntryAlert}</p>
              </div>
            </div>
            <button onClick={() => setRealtimeEntryAlert(null)} className="text-xs font-extrabold bg-emerald-600 text-white px-3 py-1.5 rounded-lg cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Security Gate QR Terminal View */}
        {(activeRole === 'guard' || activeRole === 'secretary' || activeRole === 'admin') && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '16px',
              padding: '1rem',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
            className="space-y-3"
          >
            <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--aarizo-navy, #083B56)', margin: 0 }}>
              <QrCode className="text-[#F06543]" size={18} /> Security Gate Terminal — Scan Domestic Staff Pass
            </h3>

            <div className="flex flex-col sm:flex-row gap-2.5 items-center">
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                style={{ borderRadius: '10px', border: '1px solid var(--aarizo-border, #DCE8EF)', fontSize: '0.75rem' }}
                className="p-2.5 bg-white font-semibold text-slate-800 flex-1 w-full focus:outline-none"
              >
                {allWorkers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.workerType}) · {w.passCode}
                  </option>
                ))}
              </select>

              <button
                onClick={handleGateScanCheckIn}
                style={{ borderRadius: '10px', padding: '0.55rem 1rem', fontSize: '0.75rem', fontWeight: 800 }}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-xs"
              >
                <CheckCircle size={15} /> Gate Check-In Scan
              </button>

              <button
                onClick={handleGateScanCheckOut}
                style={{ borderRadius: '10px', padding: '0.55rem 1rem', fontSize: '0.75rem', fontWeight: 800 }}
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-xs"
              >
                <UserX size={15} /> Gate Check-Out
              </button>
            </div>

            {scanResultMsg.message && (
              <div className={`p-3 rounded-xl text-xs font-bold ${scanResultMsg.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {scanResultMsg.message}
              </div>
            )}
          </div>
        )}

        {/* Resident View: Linked Household Workers */}
        {activeRole === 'resident' && (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-[#083B56]" style={{ margin: 0 }}>My Household Linked Staff ({residentWorkers.length})</h3>

            {residentWorkers.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px dashed var(--aarizo-border, #DCE8EF)',
                  borderRadius: '16px',
                  padding: '2rem 1rem',
                }}
                className="text-center space-y-3"
              >
                <ShieldCheck size={36} className="mx-auto text-[#F06543]" />
                <h4 className="font-extrabold text-[#083B56] text-sm" style={{ margin: 0 }}>No Household Staff Linked Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto" style={{ margin: 0 }}>Link your maids, drivers, or cooks to receive real-time gate entry notifications and grant pre-authorized society gatepass access.</p>
                <button
                  onClick={() => setShowLinkModal(true)}
                  style={{
                    background: 'var(--aarizo-coral, #F06543)',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    border: 'none',
                  }}
                  className="inline-flex items-center gap-1.5 shadow-xs hover:brightness-110 cursor-pointer"
                >
                  <UserPlus size={15} /> Link Household Staff
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {residentWorkers.map(({ worker, assignment }) => (
                  <div
                    key={worker.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--aarizo-border, #DCE8EF)',
                      borderRadius: '16px',
                      padding: '0.875rem 1rem',
                      boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
                    }}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={worker.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'}
                        alt={worker.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate" style={{ margin: 0 }}>{worker.name}</h4>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded">
                            {worker.workerType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5" style={{ margin: 0 }}>Pass: {worker.passCode} · Phone: {worker.phone}</p>
                        <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1 mt-1">
                          <CheckCircle size={12} /> Resident Consent Granted
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        worker.overallStatus === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {worker.overallStatus}
                      </span>
                      <button
                        onClick={() => handleRevokeConsent(assignment.id)}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer"
                      >
                        Revoke Consent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin / Facility View: Society Aggregate Worker List */}
        {(activeRole === 'secretary' || activeRole === 'facility_manager' || activeRole === 'admin') && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '16px',
              padding: '1rem',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
            className="space-y-3"
          >
            {/* Top Bar with Search & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#083B56]" style={{ margin: 0 }}>
                  Society Domestic Staff Directory ({filteredWorkers.length})
                </h3>
                <p className="text-[11px] text-slate-500 font-medium" style={{ margin: 0 }}>
                  Identity Docs Masked for Privacy · Verified Society Network
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-56">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, pass..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ borderRadius: '10px', border: '1px solid var(--aarizo-border, #DCE8EF)', fontSize: '0.75rem' }}
                    className="w-full pl-8 pr-3 py-1.5 font-medium focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
                  />
                </div>

                <button
                  onClick={loadData}
                  style={{ borderRadius: '10px', border: '1px solid var(--aarizo-border, #DCE8EF)', background: 'var(--aarizo-card-blue, #F4FAFE)', color: 'var(--aarizo-navy, #083B56)' }}
                  className="text-xs font-bold flex items-center justify-center p-2 cursor-pointer shrink-0"
                  title="Refresh Roster"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Workers Grid Cards */}
            <div className="grid grid-cols-1 gap-3">
              {filteredWorkers.map((w) => (
                <div
                  key={w.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                    borderRadius: '14px',
                    padding: '0.875rem 1rem',
                    boxShadow: '0 2px 6px rgba(8, 59, 86, 0.03)',
                  }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={w.avatarUrl} alt={w.name} className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm">{w.name}</span>
                        <span className="text-[10px] font-extrabold bg-[#FFF0EC] text-[#F06543] border border-[#FDE0D8] px-2 py-0.5 rounded-md uppercase">
                          {w.workerType}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs font-medium mt-1" style={{ margin: 0 }}>
                        Pass ID: <strong className="font-mono text-[#083B56]">{w.passCode}</strong> · Status:{' '}
                        <strong className={w.overallStatus === 'CHECKED_IN' ? 'text-emerald-700 font-extrabold' : 'text-slate-600'}>{w.overallStatus}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold rounded-md text-[10px]">
                        {w.verificationStatus}
                      </span>
                      <span className="text-[10px] text-slate-600 font-semibold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        Police Doc Verified
                      </span>
                    </div>

                    <button
                      onClick={() => alert(`Details for domestic worker: ${w.name}\nPass Code: ${w.passCode}\nStatus: ${w.overallStatus}`)}
                      style={{
                        background: 'var(--aarizo-coral, #F06543)',
                        color: '#ffffff',
                        borderRadius: '8px',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: 'none',
                      }}
                      className="cursor-pointer shrink-0 hover:brightness-110 transition-all shadow-xs"
                    >
                      Pass Info
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Log Table */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            borderRadius: '16px',
            padding: '1rem',
            boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
          }}
          className="space-y-3"
        >
          <h3 className="text-sm sm:text-base font-extrabold text-[#083B56]" style={{ margin: 0 }}>Attendance Log History</h3>
          <div>
            <DataTable
              columns={[
                { key: 'worker', header: 'Staff Name & Type', render: (log: any) => <span className="font-bold text-slate-800">{log.workerName} ({log.workerType})</span> },
                { key: 'household', header: 'Flat & Household', render: (log: any) => <span className="text-slate-600">{log.flatCode || 'Multiple Households'}</span> },
                { key: 'entryTime', header: 'Entry Time', render: (log: any) => <span className="text-emerald-600 font-semibold">{log.entryTime}</span> },
                { key: 'exitTime', header: 'Exit Time', render: (log: any) => <span className="text-slate-500">{log.exitTime || 'Inside'}</span> },
                { key: 'gate', header: 'Gate & Verified By', render: (log: any) => <span className="text-slate-500">{log.gateName} ({log.checkedInByGuard})</span> },
                {
                  key: 'status',
                  header: 'Status',
                  render: (log: any) => (
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      log.status === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {log.status}
                    </span>
                  )
                }
              ]}
              data={attendanceLogs}
              keyExtractor={(log: any) => log.id}
              pageSize={10}
              mobileRender={(log: any) => (
                <MobileDataCard
                  title={`${log.workerName} (${log.workerType})`}
                  subtitle={`Household: ${log.flatCode || 'Multiple'} • Gate: ${log.gateName}`}
                  status={
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      log.status === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {log.status}
                    </span>
                  }
                  attributes={[
                    { label: 'Entry Time', value: log.entryTime },
                    { label: 'Exit Time', value: log.exitTime || 'Inside Community' },
                    { label: 'Guard Verified', value: log.checkedInByGuard }
                  ]}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Modal: Link Household Staff */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="Link Household Staff to My Flat"
        subtitle="Authorize gate access and receive realtime check-in alerts"
        icon={<Users size={20} />}
        maxWidth="500px"
        footer={
          <div className="flex gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setShowLinkModal(false)}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('link-worker-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="flex-1 py-2.5 text-xs font-extrabold rounded-xl text-white shadow-md active:scale-95 transition-all cursor-pointer hover:brightness-110 border-none bg-[#F06543]"
            >
              Confirm Linkage
            </button>
          </div>
        }
      >
        <form id="link-worker-form" onSubmit={handleLinkWorker} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-[#083B56] uppercase tracking-wider mb-1">Select Society-Verified Worker</label>
            <select
              value={workerToLink}
              onChange={(e) => setWorkerToLink(e.target.value)}
              className="w-full p-3 font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
            >
              {allWorkers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} · {w.workerType} ({w.passCode})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-[#F4FAFE] border border-[#DCE8EF] rounded-xl text-xs text-[#083B56] space-y-1">
            <p className="font-extrabold" style={{ margin: 0 }}>Security Consent Policy:</p>
            <p className="text-slate-600 font-medium" style={{ margin: 0 }}>Linking grants gate check-in authorization for your flat. You will receive live notification alerts whenever this staff member checks in or out at any society gate.</p>
          </div>
        </form>
      </Modal>

      {/* Modal: Register Domestic Staff (Admin/Secretary) */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Domestic Staff"
        subtitle="Create society gate pass credential for domestic staff member"
        icon={<UserPlus size={20} />}
        maxWidth="500px"
        footer={
          <div className="flex gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('add-worker-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="flex-1 py-2.5 text-xs font-extrabold rounded-xl text-white shadow-md active:scale-95 transition-all cursor-pointer hover:brightness-110 border-none bg-[#F06543]"
            >
              Register Staff
            </button>
          </div>
        }
      >
        <form id="add-worker-form" onSubmit={handleAddWorkerSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-[#083B56] uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Sunita Devi"
              value={newWorkerForm.name}
              onChange={(e) => setNewWorkerForm({ ...newWorkerForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 font-bold text-slate-900 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#083B56] uppercase tracking-wider mb-1">Staff Role / Category</label>
            <select
              value={newWorkerForm.workerType}
              onChange={(e) => setNewWorkerForm({ ...newWorkerForm, workerType: e.target.value })}
              className="w-full p-3 font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
            >
              <option value="Maid">Maid</option>
              <option value="Driver">Driver</option>
              <option value="Cook">Cook</option>
              <option value="Nanny">Nanny / Babysitter</option>
              <option value="Gardener">Gardener</option>
              <option value="Security">Security Guard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#083B56] uppercase tracking-wider mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={newWorkerForm.phone}
              onChange={(e) => setNewWorkerForm({ ...newWorkerForm, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 font-bold text-slate-900 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};


