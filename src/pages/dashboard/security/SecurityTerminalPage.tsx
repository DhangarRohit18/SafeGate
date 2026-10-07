import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Search as SearchIcon,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  LogOut,
  QrCode,
  UserPlus,
  Camera,
  ArrowLeft,
  Key,
} from 'lucide-react';
import { visitorService } from '../../../services/visitorService';
import type { SmartVisitorPass, BlacklistEntry, PassValidationResult, VisitorCategory } from '../../../types/visitor';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { QRScanner } from '../../../components/ui/QRScanner';
import { Form, FormField } from '../../../components/ui/Form';
import { useAuth } from '../../../context/AuthContext';
import { realtimeService } from '../../../services/realtimeService';
import { FileUpload } from '../../../components/ui/FileUpload';

export const SecurityTerminalPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentSocietyId = currentUser?.societyId || 'soc-gvs';
  const officerActor = {
    id: currentUser?.uid || 'guard-1',
    name: currentUser?.name || 'Officer R. Singh',
    role: currentUser?.role?.toUpperCase() || 'SECURITY',
  };

  const [passes, setPasses] = useState<SmartVisitorPass[]>(() => visitorService.getPasses(currentSocietyId));
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>(() => visitorService.getBlacklist(currentSocietyId));
  const [lockdown, setLockdown] = useState(() => visitorService.getLockdownState(currentSocietyId));

  const [searchQuery, setSearchQuery] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [validationResult, setValidationResult] = useState<PassValidationResult | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  // Walk-in entry form state
  const [walkInForm, setWalkInForm] = useState({
    visitorName: '',
    visitorPhone: '',
    flatCode: 'B-1204',
    residentName: 'Vikram Joshi',
    towerName: 'Tower B',
    category: 'GUEST' as VisitorCategory,
    vehicleNumber: '',
    purpose: '',
    companyName: '',
    photoUrl: '',
  });

  // Blacklist form state
  const [blName, setBlName] = useState('');
  const [blPhone, setBlPhone] = useState('');
  const [blReason, setBlReason] = useState('');

  const refreshData = () => {
    setPasses(visitorService.getPasses(currentSocietyId));
    setBlacklist(visitorService.getBlacklist(currentSocietyId));
    setLockdown(visitorService.getLockdownState(currentSocietyId));
  };

  useEffect(() => {
    refreshData();
    const unsub = realtimeService.subscribe('*', () => {
      refreshData();
    });
    return () => unsub();
  }, [currentSocietyId]);

  const handleCreateWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInForm.visitorName || !walkInForm.visitorPhone || !walkInForm.flatCode) return;

    visitorService.createVisitorPass(
      {
        societyId: currentSocietyId,
        residentId: 'res-1',
        residentName: walkInForm.residentName || 'Resident',
        flatCode: walkInForm.flatCode,
        towerName: walkInForm.towerName || 'Tower A',
        visitorName: walkInForm.visitorName,
        visitorPhone: walkInForm.visitorPhone,
        category: walkInForm.category,
        passLifecycle: 'ONE_TIME',
        vehicleNumber: walkInForm.vehicleNumber || undefined,
        photoUrl: walkInForm.photoUrl || undefined,
        purpose: walkInForm.purpose || 'Gate Walk-in Entry',
        companyName: walkInForm.companyName || undefined,
        status: 'CHECKED_IN',
        gateName: 'Main Gate 1',
        gateOfficerName: officerActor.name,
        checkedInAt: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      },
      officerActor
    );

    refreshData();
    setIsWalkInModalOpen(false);
    setWalkInForm({
      visitorName: '',
      visitorPhone: '',
      flatCode: 'B-1204',
      residentName: 'Vikram Joshi',
      towerName: 'Tower B',
      category: 'GUEST',
      vehicleNumber: '',
      purpose: '',
      companyName: '',
      photoUrl: '',
    });
  };

  const handleValidateCode = (code: string) => {
    if (!code.trim()) return;
    const res = visitorService.validatePassCode(currentSocietyId, code);
    setValidationResult(res);
  };

  const handleCheckIn = (pass: SmartVisitorPass) => {
    visitorService.checkInVisitor(pass.id, { gateName: 'Main Gate 1', officerName: officerActor.name }, officerActor);
    refreshData();
    setValidationResult(null);
    setIsScannerOpen(false);
  };

  const handleCheckOut = (passId: string) => {
    visitorService.checkOutVisitor(passId, officerActor);
    refreshData();
  };

  const handleToggleLockdown = () => {
    const newState = !lockdown.isLockdownActive;
    visitorService.toggleLockdown(
      currentSocietyId,
      newState,
      newState ? 'Activated emergency gate lockdown by security officer' : 'Deactivated lockdown',
      officerActor
    );
    refreshData();
  };

  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blName || !blPhone) return;

    visitorService.addBlacklist(
      {
        societyId: currentSocietyId,
        name: blName,
        phone: blPhone,
        reason: blReason || 'Added by Security Officer',
        blacklistedBy: officerActor.name,
      },
      officerActor
    );

    refreshData();
    setIsBlacklistModalOpen(false);
    setBlName('');
    setBlPhone('');
    setBlReason('');
  };

  const filteredPasses = passes.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.visitorName.toLowerCase().includes(q) ||
      p.flatCode.toLowerCase().includes(q) ||
      p.passCode.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const insideCount = passes.filter((p) => p.status === 'CHECKED_IN').length;
  const expectedCount = passes.filter((p) => p.status === 'EXPECTED').length;

  return (
    <div style={{ backgroundColor: 'var(--aarizo-page, #F7FBFE)', minHeight: '100vh', paddingBottom: '3rem' }}>
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
            aria-label="Go Back"
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
            <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Gate Security Terminal
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                Main Gate 1 • Online
              </span>
            </h1>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Officer R. Singh (On Duty)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setIsWalkInModalOpen(true)}
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
            <UserPlus size={15} /> New Walk-in Entry
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-4">
        {/* Lockdown Alert Banner */}
        {lockdown.isLockdownActive && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '14px', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)' }}>
            <AlertTriangle size={20} style={{ color: '#DC2626', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#DC2626' }}>EMERGENCY GATE LOCKDOWN ACTIVE</div>
              <div style={{ fontSize: '0.75rem', color: '#991B1B', marginTop: 2 }}>All new visitor entries are restricted by security command.</div>
            </div>
            <button
              type="button"
              onClick={handleToggleLockdown}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', background: '#ffffff', border: '1px solid #FECACA', color: '#DC2626', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Deactivate
            </button>
          </div>
        )}

        {/* ── Stats Summary Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
          {[
            { label: 'Expected Visitors', value: expectedCount, color: '#083B56', bg: '#ffffff', icon: Shield },
            { label: 'Currently Inside', value: insideCount, color: '#059669', bg: '#ffffff', icon: CheckCircle2 },
            { label: 'Watchlist Flagged', value: blacklist.length, color: '#D97706', bg: '#ffffff', icon: AlertTriangle },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                style={{
                  padding: '0.875rem 1rem',
                  background: stat.bg,
                  borderRadius: '16px',
                  border: '1px solid #DCE8EF',
                  boxShadow: '0 2px 6px rgba(8, 59, 86, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#657785', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{stat.label}</div>
                  <div style={{ fontWeight: 900, fontSize: '1.5rem', color: stat.color, lineHeight: 1.1, marginTop: 2 }}>{stat.value}</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#F4FAFE', border: '1px solid #DCE8EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                  <Icon size={18} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Quick Action Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem' }}>
          <button
            type="button"
            onClick={() => setIsWalkInModalOpen(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.75rem 0.5rem',
              borderRadius: '14px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <UserPlus size={20} color="#059669" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065F46' }}>Walk-in Entry</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.75rem 0.5rem',
              borderRadius: '14px',
              background: '#F4FAFE',
              border: '1px solid #DCE8EF',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <QrCode size={20} color="#083B56" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#083B56' }}>Scan QR</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBlacklistModalOpen(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.75rem 0.5rem',
              borderRadius: '14px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <AlertTriangle size={20} color="#D97706" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400E' }}>Watchlist</span>
          </button>

          <button
            type="button"
            onClick={handleToggleLockdown}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.75rem 0.5rem',
              borderRadius: '14px',
              background: lockdown.isLockdownActive ? '#FEF2F2' : '#F4FAFE',
              border: lockdown.isLockdownActive ? '1px solid #FECACA' : '1px solid #DCE8EF',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {lockdown.isLockdownActive ? <Lock size={20} color="#DC2626" /> : <Unlock size={20} color="#083B56" />}
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: lockdown.isLockdownActive ? '#DC2626' : '#083B56' }}>
              {lockdown.isLockdownActive ? 'End Lock' : 'Lockdown'}
            </span>
          </button>
        </div>

        {/* ── Pass Code Verification Box ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            padding: '1.125rem 1.25rem',
            boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
          }}
          className="space-y-3"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={16} color="#083B56" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#083B56' }}>Pass Code Verification</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Enter code e.g. GVS-4092"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleValidateCode(codeInput)}
              style={{
                flex: 1,
                padding: '0.65rem 0.875rem',
                borderRadius: '12px',
                border: '1px solid #DCE8EF',
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                background: '#F4FAFE',
                color: '#083B56',
                fontWeight: 700,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => handleValidateCode(codeInput)}
              style={{
                padding: '0.65rem 1.25rem',
                background: 'var(--aarizo-coral, #F06543)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: '0.8125rem',
                boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              Verify Code
            </button>
          </div>
        </div>

        {/* ── Live Gate Log Section ── */}
        <div className="space-y-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontWeight: 800, fontSize: '0.875rem', color: '#083B56', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Live Gate Log
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#657785', fontWeight: 700 }}>{filteredPasses.length} passes</span>
          </div>

          {/* Search Input Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#ffffff',
              padding: '0.6rem 0.875rem',
              borderRadius: '12px',
              border: '1px solid #DCE8EF',
              boxShadow: '0 1px 4px rgba(8, 59, 86, 0.03)',
            }}
          >
            <SearchIcon size={16} style={{ color: '#083B56', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search visitor, flat, pass code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.8125rem', width: '100%', color: '#083B56', fontWeight: 600 }}
            />
          </div>

          {/* Visitor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPasses.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '0.8125rem', color: '#657785', fontWeight: 700, margin: 0 }}>No visitor passes found matching your filter</p>
              </div>
            ) : (
              filteredPasses.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '1.125rem',
                    background: p.status === 'CHECKED_IN' ? '#ECFDF5' : '#ffffff',
                    borderRadius: '16px',
                    border: p.status === 'CHECKED_IN' ? '1px solid #A7F3D0' : '1px solid #DCE8EF',
                    boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#083B56' }}>{p.visitorName}</span>
                        <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: '#EAF6FC', border: '1px solid #DCE8EF', fontWeight: 800, color: '#083B56' }}>
                          {p.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#657785', marginTop: '0.25rem' }}>
                        <strong style={{ color: '#083B56' }}>{p.flatCode}</strong> • {p.residentName}
                      </div>
                      <div style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: '#DC2626', fontWeight: 800, marginTop: '0.15rem' }}>{p.passCode}</div>
                      {p.vehicleNumber && (
                        <div style={{ fontSize: '0.75rem', color: '#657785', marginTop: '0.15rem' }}>
                          Vehicle: <strong style={{ color: '#083B56' }}>{p.vehicleNumber}</strong>
                        </div>
                      )}
                      {p.photoUrl && (
                        <div style={{ marginTop: '0.4rem' }}>
                          <a
                            href={p.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '8px',
                              background: '#F4FAFE',
                              border: '1px solid #DCE8EF',
                              color: '#083B56',
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              textDecoration: 'none',
                            }}
                          >
                            <Camera size={12} />
                            <span>View Gate Photo</span>
                          </a>
                        </div>
                      )}
                    </div>
                    <StatusBadge
                      label={p.status.replace('_', ' ')}
                      variant={p.status === 'CHECKED_IN' ? 'success' : p.status === 'EXPECTED' ? 'info' : 'neutral'}
                    />
                  </div>

                  {p.status === 'EXPECTED' && (
                    <button
                      type="button"
                      onClick={() => handleCheckIn(p)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        padding: '0.625rem',
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.78125rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)',
                      }}
                    >
                      <CheckCircle2 size={16} /> Allow Entry
                    </button>
                  )}

                  {p.status === 'CHECKED_IN' && (
                    <button
                      type="button"
                      onClick={() => handleCheckOut(p.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        padding: '0.625rem',
                        background: '#657785',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '0.78125rem',
                        cursor: 'pointer',
                      }}
                    >
                      <LogOut size={16} /> Check Out
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Verification Result Modal */}
      {validationResult && (
        <Modal isOpen={!!validationResult} onClose={() => setValidationResult(null)} title="Pass Validation Result">
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: validationResult.isValid ? '#ECFDF5' : '#FEF2F2',
                color: validationResult.isValid ? '#059669' : '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              {validationResult.isValid ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 800, color: validationResult.isValid ? '#065F46' : '#991B1B' }}>
              {validationResult.isValid ? 'PASS VALIDATED' : 'ENTRY REJECTED'}
            </h3>

            {validationResult.pass && (
              <div style={{ padding: '0.875rem', background: '#F4FAFE', borderRadius: '12px', border: '1px solid #DCE8EF', margin: '0.75rem 0', textAlign: 'left', fontSize: '0.8125rem', color: '#083B56' }}>
                <div style={{ marginBottom: '0.25rem' }}>Visitor: <strong>{validationResult.pass.visitorName}</strong></div>
                <div style={{ marginBottom: '0.25rem' }}>Destination: <strong>{validationResult.pass.flatCode}</strong> ({validationResult.pass.residentName})</div>
                <div>Category: {validationResult.pass.category}</div>
              </div>
            )}

            {!validationResult.isValid && (
              <p style={{ color: '#DC2626', fontWeight: 700, fontSize: '0.875rem', margin: '0.5rem 0 1rem 0' }}>
                {validationResult.reason}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setValidationResult(null)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #DCE8EF', background: '#ffffff', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', color: '#083B56' }}
              >
                Dismiss
              </button>
              {validationResult.isValid && validationResult.pass && (
                <button
                  type="button"
                  onClick={() => handleCheckIn(validationResult.pass!)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#059669', color: '#ffffff', fontWeight: 800, fontSize: '0.8125rem', cursor: 'pointer' }}
                >
                  Approve Entry
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* QR Scanner Modal */}
      <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="QR Scanner">
        <QRScanner
          simulationCode={passes[0]?.passCode || 'GVS-4092'}
          onScan={(code) => {
            handleValidateCode(code);
            setIsScannerOpen(false);
          }}
        />
      </Modal>

      {/* Blacklist Modal */}
      <Modal isOpen={isBlacklistModalOpen} onClose={() => setIsBlacklistModalOpen(false)} title="Watchlist Management">
        <Form onSubmit={handleAddBlacklist}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <FormField label="Visitor Name" required>
              <input
                type="text"
                required
                value={blName}
                onChange={(e) => setBlName(e.target.value)}
                placeholder="e.g. Karan Mehra"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #DCE8EF', fontSize: '0.8125rem', color: '#083B56' }}
              />
            </FormField>
            <FormField label="Phone Number" required>
              <input
                type="tel"
                required
                value={blPhone}
                onChange={(e) => setBlPhone(e.target.value)}
                placeholder="10-digit phone"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #DCE8EF', fontSize: '0.8125rem', color: '#083B56' }}
              />
            </FormField>
            <FormField label="Reason for Blacklisting" required>
              <input
                type="text"
                required
                value={blReason}
                onChange={(e) => setBlReason(e.target.value)}
                placeholder="e.g. Altercation with gate staff"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid #DCE8EF', fontSize: '0.8125rem', color: '#083B56' }}
              />
            </FormField>
          </div>

          <button
            type="submit"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#DC2626', color: '#ffffff', fontWeight: 800, marginTop: '1rem', cursor: 'pointer', fontSize: '0.8125rem' }}
          >
            Add to Watchlist
          </button>
        </Form>

        {/* Existing Watchlist Items */}
        {blacklist.length > 0 && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid #DCE8EF', paddingTop: '0.75rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#083B56', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Current Watchlist</h4>
            {blacklist.map((bl, i) => (
              <div key={i} style={{ padding: '0.625rem 0.875rem', background: '#FFFBEB', borderRadius: '10px', marginBottom: '0.375rem', border: '1px solid #FDE68A' }}>
                <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#92400E' }}>{bl.name}</div>
                <div style={{ fontSize: '0.6875rem', color: '#B45309' }}>{bl.phone} • {bl.reason}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Walk-in Visitor Entry Modal */}
      <Modal isOpen={isWalkInModalOpen} onClose={() => setIsWalkInModalOpen(false)} title="Register Walk-in Gate Entry">
        <Form onSubmit={handleCreateWalkIn}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <FormField label="Visitor Full Name" required>
                <input
                  type="text"
                  required
                  value={walkInForm.visitorName}
                  onChange={(e) => setWalkInForm({ ...walkInForm, visitorName: e.target.value })}
                  placeholder="e.g. Rajan Pillai"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '10px', border: '1px solid #DCE8EF', fontSize: '0.8125rem', color: '#083B56' }}
                />
              </FormField>

              <FormField label="Mobile Number" required>
                <input
                  type="tel"
                  required
                  value={walkInForm.visitorPhone}
                  onChange={(e) => setWalkInForm({ ...walkInForm, visitorPhone: e.target.value })}
                  placeholder="10-digit mobile"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '10px', border: '1px solid #DCE8EF', fontSize: '0.8125rem', color: '#083B56' }}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <FormField label="Visitor Category" required>
                <select
                  value={walkInForm.category}
                  onChange={(e) => setWalkInForm({ ...walkInForm, category: e.target.value as VisitorCategory })}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '10px', border: '1px solid #DCE8EF', fontSize: '0.8125rem', background: '#ffffff', color: '#083B56', fontWeight: 700 }}
                >
                  <option value="GUEST">Guest / Relative</option>
                  <option value="DELIVERY">Delivery Executive</option>
                  <option value="CAB">Cab / Driver</option>
                  <option value="SERVICE_PROVIDER">Service Provider / Plumber</option>
                  <option value="DOMESTIC_WORKER">Domestic Worker / Helper</option>
                </select>
              </FormField>

              <FormField label="Destination Flat" required>
                <input
                  type="text"
                  required
                  value={walkInForm.flatCode}
                  onChange={(e) => setWalkInForm({ ...walkInForm, flatCode: e.target.value })}
                  placeholder="e.g. B-1204"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '10px', border: '1px solid #DCE8EF', fontSize: '0.8125rem', color: '#083B56' }}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <FormField label="Host Resident Name">
                <input
                  type="text"
                  value={walkInForm.residentName}
                  onChange={(e) => setWalkInForm({ ...walkInForm, residentName: e.target.value })}
                  placeholder="e.g. Vikram Joshi"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '10px', border: '1px solid #DCE8EF', fontSize: '0.8125rem', color: '#083B56' }}
                />
              </FormField>

              <FormField label="Vehicle Number (Optional)">
                <input
                  type="text"
                  value={walkInForm.vehicleNumber}
                  onChange={(e) => setWalkInForm({ ...walkInForm, vehicleNumber: e.target.value })}
                  placeholder="e.g. MH 12 AB 4590"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '10px', border: '1px solid #DCE8EF', fontSize: '0.8125rem', color: '#083B56' }}
                />
              </FormField>
            </div>

            <FormField label="Purpose / Company (Optional)">
              <input
                type="text"
                value={walkInForm.purpose}
                onChange={(e) => setWalkInForm({ ...walkInForm, purpose: e.target.value })}
                placeholder="e.g. Grocery delivery, Swiggy, AC repair"
                style={{ width: '100%', padding: '0.625rem', borderRadius: '10px', border: '1px solid #DCE8EF', fontSize: '0.8125rem', color: '#083B56' }}
              />
            </FormField>

            {/* Gate Visitor Photo Capture */}
            <div style={{ marginTop: '0.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--aarizo-navy, #083B56)', marginBottom: '0.375rem' }}>
                Capture Visitor / Delivery Photo (Optional)
              </label>
              <FileUpload
                category="general"
                label="Take Visitor Photo or Upload Image"
                onUploadSuccess={(url: string) => {
                  setWalkInForm((prev) => ({ ...prev, photoUrl: url }));
                }}
              />
              {walkInForm.photoUrl && (
                <div style={{ marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#059669', background: '#ECFDF5', padding: '0.375rem 0.625rem', borderRadius: '0.5rem', border: '1px solid #A7F3D0' }}>
                  <CheckCircle2 size={14} />
                  <span>Gate photo successfully captured &amp; attached</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem', borderTop: '1px solid #DCE8EF', paddingTop: '0.875rem' }}>
            <button
              type="button"
              onClick={() => setIsWalkInModalOpen(false)}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #DCE8EF', background: '#ffffff', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', color: '#083B56' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ flex: 2, padding: '0.75rem', borderRadius: '10px', border: 'none', background: 'var(--aarizo-coral, #F06543)', color: '#ffffff', fontWeight: 800, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)' }}
            >
              <CheckCircle2 size={16} /> Allow &amp; Check In Visitor
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SecurityTerminalPage;
