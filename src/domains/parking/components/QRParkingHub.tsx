import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  Search,
  Camera,
  Layers,
  ShieldAlert,
  X,
  Copy,
  Check,
  Calendar,
  Zap,
  Info,
  ArrowLeft,
} from 'lucide-react';
import { qrParkingService } from '../services/qrParkingService';
import type { ParkingSlotItem, ParkingViolationRecord, ParkingType, ParkingPassQR } from '../types';
import { useAuth } from '../../../context/AuthContext';
import { realTimeSync } from '../../../services/realTimeSync';
import { realtimeService } from '../../../services/realtimeService';
import { FileUpload } from '../../../components/ui/FileUpload';
import { Modal, ChoicePills } from '../../../components/ui/Modal';

export const QRParkingHub: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const activeRole = (currentUser?.role || '').toLowerCase();

  const isAdmin = ['admin', 'secretary'].includes(activeRole);
  const isSecurity = ['guard', 'admin'].includes(activeRole);

  const [activeTab, setActiveTab] = useState<'MAP' | 'SLOTS' | 'VIOLATIONS' | 'SECURITY_SCANNER' | 'MY_PARKING'>('MAP');
  const [slots, setSlots] = useState<ParkingSlotItem[]>(() => qrParkingService.getSlots());
  const [violations, setViolations] = useState<ParkingViolationRecord[]>(() => qrParkingService.getViolations());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [selectedStateFilter, setSelectedStateFilter] = useState('ALL');

  const [modalMode, setModalMode] = useState<'ADD_SLOT' | 'ASSIGN' | 'REQUEST_PASS' | 'REPORT_VIOLATION' | 'VIEW_PASS' | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlotItem | null>(null);
  const [activeQRPass, setActiveQRPass] = useState<ParkingPassQR | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Forms
  const [slotForm, setSlotForm] = useState({
    slotCode: '',
    level: 'Basement 1',
    parkingType: 'RESIDENT' as ParkingType,
  });

  const [assignForm, setAssignForm] = useState({
    flatCode: 'A-101',
    residentName: 'Siddharth Malhotra',
    vehicleNumber: '',
    parkingType: 'RESIDENT' as ParkingType,
  });

  const [passRequestForm, setPassRequestForm] = useState({
    parkingType: 'TEMPORARY' as ParkingType,
    vehicleNumber: 'MH-12-RS-9988',
    slotCode: 'B1-T01',
    durationDays: 7,
  });

  const [violationForm, setViolationForm] = useState({
    vehicleNumber: '',
    slotCode: '',
    violationType: 'UNAUTHORIZED_PARKING' as any,
    privateNotes: '',
    photoEvidenceUrl: '',
  });

  const [qrScanInput, setQrScanInput] = useState('');
  const [scanResult, setScanResult] = useState<{ isValid: boolean; slot?: ParkingSlotItem; reason?: string } | null>(null);

  const loadData = () => {
    setSlots(qrParkingService.getSlots());
    setViolations(qrParkingService.getViolations());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = realTimeSync.subscribe('PARKING_UPDATED', () => {
      loadData();
    });
    const unsubRealtime = realtimeService.subscribe('*', (msg) => {
      if (['PARKING_UPDATED', 'PARKING_VIOLATION_REPORTED', 'VEHICLE_GATE_LOGGED'].includes(msg.topic)) {
        loadData();
      }
    });
    return () => {
      unsubscribe();
      unsubRealtime();
    };
  }, []);

  const handleAddSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotForm.slotCode) return;
    qrParkingService.createSlot(slotForm.slotCode, slotForm.level, slotForm.parkingType, currentUser?.name || 'Admin');
    setModalMode(null);
    loadData();
    alert('Parking slot created successfully.');
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !assignForm.vehicleNumber) return;
    qrParkingService.assignOrReassignSlot(
      selectedSlot.id,
      assignForm.flatCode,
      assignForm.residentName,
      assignForm.vehicleNumber,
      assignForm.parkingType
    );
    setModalMode(null);
    loadData();
    alert('Slot assigned successfully.');
  };

  const handleRequestPassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pass = qrParkingService.generateQRPass(
      passRequestForm.parkingType,
      passRequestForm.vehicleNumber,
      currentUser?.name || 'Resident',
      'A-101',
      passRequestForm.slotCode,
      passRequestForm.durationDays
    );
    setActiveQRPass(pass);
    setModalMode('VIEW_PASS');
    loadData();
  };

  const handleReportViolationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    qrParkingService.reportViolation(
      violationForm.vehicleNumber,
      violationForm.slotCode,
      violationForm.violationType,
      violationForm.privateNotes,
      currentUser?.name || 'Security Guard',
      violationForm.photoEvidenceUrl
    );
    setModalMode(null);
    loadData();
    alert('Violation logged privately. Notification & warning sent to vehicle owner.');
  };

  const handleGateScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrScanInput) return;
    const result = qrParkingService.validateQRPassAtGate(qrScanInput);
    setScanResult(result);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredSlots = slots.filter((slot) => {
    if (selectedTypeFilter !== 'ALL' && slot.parkingType !== selectedTypeFilter) return false;
    if (selectedStateFilter !== 'ALL' && slot.occupancyState !== selectedStateFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        slot.slotCode.toLowerCase().includes(q) ||
        (slot.assignedVehicleNumber && slot.assignedVehicleNumber.toLowerCase().includes(q)) ||
        (slot.assignedFlatCode && slot.assignedFlatCode.toLowerCase().includes(q)) ||
        (slot.assignedResidentName && slot.assignedResidentName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const levels = Array.from(new Set(slots.map((s) => s.level)));

  return (
    <div style={{ minHeight: '100%', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: '2.5rem' }}>
      {/* ── Subheader Bar matching Residents, NGO, Staff & Towers tabs ── */}
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
              Parking Management
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Slot allocation, visitor passes &amp; parking management
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setModalMode('REQUEST_PASS')}
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
            <QrCode size={15} /> Request Pass
          </button>
          {isAdmin && (
            <button
              onClick={() => setModalMode('ADD_SLOT')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.875rem',
                borderRadius: '10px',
                background: 'var(--aarizo-navy, #083B56)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.75rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <PlusCircle size={15} /> Add Slot
            </button>
          )}
        </div>
      </div>

      {/* ── Metrics Summary Cards ── */}
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
              <Car size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>TOTAL SLOTS</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)' }}>{slots.length}</span>
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
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>AVAILABLE</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                {slots.filter((s) => s.occupancyState === 'AVAILABLE').length}
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
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#FFF1F2', border: '1px solid #FECDD3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', flexShrink: 0 }}>
              <Car size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>OCCUPIED</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626' }}>
                {slots.filter((s) => s.occupancyState === 'OCCUPIED').length}
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
              <AlertTriangle size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>VIOLATIONS</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706' }}>{violations.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Filter Pills ── */}
      <div className="max-w-7xl mx-auto w-full" style={{ padding: '0.75rem 1rem 0.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'MAP', label: 'Visual Parking Map', icon: Layers },
            { key: 'SLOTS', label: `Parking Slots (${slots.length})`, icon: Car },
            { key: 'VIOLATIONS', label: `Violation Logs (${violations.length})`, icon: ShieldAlert },
            ...(isSecurity || isAdmin ? [{ key: 'SECURITY_SCANNER', label: 'Gate QR Scanner', icon: QrCode }] : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  background: isActive ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
                  border: '1px solid var(--aarizo-border, #DCE8EF)',
                  borderRadius: '10px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: isActive ? '#ffffff' : 'var(--aarizo-text, #203746)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={14} color={isActive ? '#ffffff' : 'var(--aarizo-coral, #F06543)'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: VISUAL MAP */}
      {activeTab === 'MAP' && (
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 space-y-4">
          {/* Status Legend Bar */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '14px',
              padding: '0.75rem 1rem',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
            className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold"
          >
            <span style={{ color: 'var(--aarizo-text-secondary, #657785)', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.6875rem' }}>
              Occupancy Legend:
            </span>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span style={{ color: 'var(--aarizo-navy, #083B56)' }}>AVAILABLE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span style={{ color: 'var(--aarizo-navy, #083B56)' }}>OCCUPIED</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span style={{ color: 'var(--aarizo-navy, #083B56)' }}>RESERVED</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span style={{ color: 'var(--aarizo-navy, #083B56)' }}>VISITOR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span style={{ color: 'var(--aarizo-navy, #083B56)' }}>BLOCKED</span>
              </div>
            </div>
          </div>

          {/* Map Grids */}
          {levels.map((lvl) => {
            const levelSlots = slots.filter((s) => s.level === lvl);
            return (
              <div
                key={lvl}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--aarizo-border, #DCE8EF)',
                  borderRadius: '16px',
                  padding: '0.875rem 1rem',
                  boxShadow: '0 2px 10px rgba(8, 59, 86, 0.04)',
                }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2" style={{ color: 'var(--aarizo-navy, #083B56)', margin: 0 }}>
                    <span className="w-2 h-4 rounded-full bg-[#F06543]" />
                    {lvl} Parking Grid Layout
                  </h3>
                  <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full">{levelSlots.length} Total Slots</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {levelSlots.map((slot) => {
                    const statusColorMap = {
                      AVAILABLE: { border: '#10B981', bg: '#ECFDF5', text: '#047857' },
                      OCCUPIED: { border: '#F43F5E', bg: '#FFF1F2', text: '#BE123C' },
                      RESERVED: { border: '#0EA5E9', bg: '#F0F9FF', text: '#0369A1' },
                      VISITOR: { border: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
                      BLOCKED: { border: '#94A3B8', bg: '#F8FAFC', text: '#475569' },
                    };
                    const styleCfg = statusColorMap[slot.occupancyState] || statusColorMap.AVAILABLE;

                    return (
                      <div
                        key={slot.id}
                        onClick={() => {
                          setSelectedSlot(slot);
                          if (isAdmin) {
                            setAssignForm({
                              flatCode: slot.assignedFlatCode || 'A-101',
                              residentName: slot.assignedResidentName || 'Resident',
                              vehicleNumber: slot.assignedVehicleNumber || '',
                              parkingType: slot.parkingType,
                            });
                            setModalMode('ASSIGN');
                          }
                        }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                          borderLeft: `4px solid ${styleCfg.border}`,
                          borderRadius: '12px',
                          padding: '0.75rem',
                          boxShadow: '0 2px 6px rgba(8, 59, 86, 0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minWidth: 0,
                          cursor: 'pointer',
                        }}
                        className="group hover:shadow-md transition-all space-y-2.5"
                      >
                        {/* Slot Code & Type Tag */}
                        <div className="flex items-center justify-between gap-1.5 min-w-0">
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', color: 'var(--aarizo-navy, #083B56)', background: 'var(--aarizo-card-blue, #F4FAFE)', padding: '0.15rem 0.45rem', borderRadius: '6px', border: '1px solid var(--aarizo-border, #DCE8EF)', flexShrink: 0 }}>
                            {slot.slotCode}
                          </span>
                          <span style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--aarizo-text-secondary, #657785)', textTransform: 'uppercase' }} className="truncate">
                            {slot.parkingType}
                          </span>
                        </div>

                        {/* Vehicle Plate or Vacant state */}
                        <div className="min-w-0">
                          {slot.assignedVehicleNumber ? (
                            <div style={{ display: 'inline-block', background: '#0F172A', color: '#FBBF24', padding: '0.2rem 0.5rem', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.6875rem', letterSpacing: '0.03em' }} className="truncate max-w-full">
                              {slot.assignedVehicleNumber}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: styleCfg.text }}>
                              {slot.occupancyState === 'AVAILABLE' ? 'Vacant Slot' : slot.occupancyState}
                            </span>
                          )}

                          {slot.assignedFlatCode && (
                            <div style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', marginTop: 3 }} className="truncate">
                              Flat {slot.assignedFlatCode} {slot.assignedResidentName ? `(${slot.assignedResidentName})` : ''}
                            </div>
                          )}
                        </div>

                        {/* Footer Action & Status Badge */}
                        <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--aarizo-border-soft, #E8F1F5)' }} className="flex items-center justify-between gap-1 min-w-0">
                          <span style={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.15rem 0.45rem', borderRadius: '9999px', background: styleCfg.bg, color: styleCfg.text }} className="shrink-0">
                            {slot.occupancyState}
                          </span>
                          {isAdmin && (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--aarizo-coral, #F06543)' }} className="shrink-0 hover:underline">
                              Edit Slot
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: SLOTS TABLE / LIST VIEW */}
      {activeTab === 'SLOTS' && (
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 space-y-3">
          {/* Search & Filter Bar */}
          <div style={{ background: '#ffffff', border: '1px solid var(--aarizo-border, #DCE8EF)', borderRadius: '16px', padding: '0.75rem 1rem' }} className="shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search slot, vehicle, flat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ borderRadius: '10px', border: '1px solid var(--aarizo-border, #DCE8EF)', fontSize: '0.75rem' }}
                  className="w-full pl-9 pr-3 py-2 font-medium focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  style={{ borderRadius: '10px', border: '1px solid var(--aarizo-border, #DCE8EF)', fontSize: '0.75rem' }}
                  className="flex-1 sm:flex-none px-3 py-2 font-semibold bg-white text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="RESIDENT">RESIDENT</option>
                  <option value="VISITOR">VISITOR</option>
                  <option value="TEMPORARY">TEMPORARY</option>
                  <option value="VACATION">VACATION</option>
                  <option value="SERVICE">SERVICE</option>
                  <option value="DELIVERY">DELIVERY</option>
                </select>

                <select
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                  style={{ borderRadius: '10px', border: '1px solid var(--aarizo-border, #DCE8EF)', fontSize: '0.75rem' }}
                  className="flex-1 sm:flex-none px-3 py-2 font-semibold bg-white text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All States</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="OCCUPIED">OCCUPIED</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </div>
            </div>

            <button onClick={loadData} style={{ borderRadius: '10px', border: '1px solid var(--aarizo-border, #DCE8EF)', background: 'var(--aarizo-card-blue, #F4FAFE)', color: 'var(--aarizo-navy, #083B56)' }} className="text-xs font-bold flex items-center justify-center gap-1.5 px-3 py-2 cursor-pointer shrink-0">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* Slot Cards List */}
          <div className="grid grid-cols-1 gap-3">
            {filteredSlots.map((slot) => (
              <div
                key={slot.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--aarizo-border, #DCE8EF)',
                  borderRadius: '16px',
                  padding: '0.875rem 1rem',
                  boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
                }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', color: 'var(--aarizo-navy, #083B56)', background: 'var(--aarizo-card-blue, #F4FAFE)', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid var(--aarizo-border, #DCE8EF)' }}>
                      {slot.slotCode}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{slot.level}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                      {slot.parkingType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>Vehicle: <strong className="text-slate-900 font-mono font-extrabold">{slot.assignedVehicleNumber || 'None'}</strong></span>
                    <span>· Flat: <strong className="text-slate-800">{slot.assignedFlatCode || 'N/A'}</strong></span>
                    <span>· Owner: <strong className="text-slate-700">{slot.assignedResidentName || 'N/A'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  <span
                    className={`px-3 py-1 text-xs font-extrabold rounded-full ${
                      slot.occupancyState === 'OCCUPIED'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : slot.occupancyState === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {slot.occupancyState}
                  </span>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setSelectedSlot(slot);
                        setAssignForm({
                          flatCode: slot.assignedFlatCode || 'A-101',
                          residentName: slot.assignedResidentName || 'Resident',
                          vehicleNumber: slot.assignedVehicleNumber || '',
                          parkingType: slot.parkingType,
                        });
                        setModalMode('ASSIGN');
                      }}
                      style={{
                        background: 'var(--aarizo-coral, #F06543)',
                        color: '#ffffff',
                        borderRadius: '10px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: 'none',
                      }}
                      className="cursor-pointer shrink-0 hover:brightness-110 transition-all shadow-xs"
                    >
                      Edit Slot
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: VIOLATIONS */}
      {activeTab === 'VIOLATIONS' && (
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 space-y-3">
          <div style={{ background: '#ffffff', border: '1px solid var(--aarizo-border, #DCE8EF)', borderRadius: '16px', padding: '0.875rem 1rem' }} className="shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-extrabold text-[#083B56] text-base" style={{ margin: 0 }}>Private Parking Violation Logs</h3>
              <p className="text-xs text-[#657785]" style={{ margin: 0 }}>Direct resident warning system with photo evidence capture.</p>
            </div>
            {isSecurity && (
              <button
                onClick={() => setModalMode('REPORT_VIOLATION')}
                style={{
                  background: 'var(--aarizo-coral, #F06543)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: 'none',
                }}
                className="flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:brightness-110 shrink-0"
              >
                <Camera size={15} /> Report Violation
              </button>
            )}
          </div>

          <div className="space-y-3">
            {violations.map((v) => (
              <div
                key={v.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--aarizo-border, #DCE8EF)',
                  borderRadius: '16px',
                  padding: '1rem',
                  boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
                }}
                className="space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                      {v.violationType}
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">Vehicle: <strong className="font-mono text-[#083B56]">{v.vehicleNumber}</strong></span>
                    <span className="text-xs text-slate-500 font-bold">(Slot {v.slotCode})</span>
                  </div>

                  <span className="self-start sm:self-auto px-3 py-0.5 text-xs font-extrabold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                    {v.status}
                  </span>
                </div>

                <p className="text-xs text-slate-700 font-medium leading-relaxed bg-[#F4FAFE] p-3 rounded-xl border border-[#DCE8EF]" style={{ margin: 0 }}>
                  {v.privateNotes}
                </p>

                {v.photoEvidenceUrl && !v.photoEvidenceUrl.startsWith('blob:') && (
                  <div className="pt-1 flex items-center gap-3">
                    <a
                      href={v.photoEvidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--aarizo-coral, #F06543)' }}
                      className="text-xs hover:underline font-extrabold flex items-center gap-1"
                    >
                      View Photo Evidence &rarr;
                    </a>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-100">
                  Reported by: <span className="text-slate-800 font-bold">{v.reportedBy}</span> · Owner Flat: <span className="text-slate-800 font-bold">{v.flatCode || 'Unregistered'} ({v.residentName || 'Visitor'})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: SECURITY SCANNER */}
      {activeTab === 'SECURITY_SCANNER' && (
        <div className="max-w-xl mx-auto w-full px-3 sm:px-4">
          <div style={{ background: '#ffffff', border: '1px solid var(--aarizo-border, #DCE8EF)', borderRadius: '20px', padding: '1.5rem' }} className="shadow-sm space-y-4">
            <div className="text-center space-y-1.5">
              <span className="p-3 bg-[#F4FAFE] rounded-2xl inline-block text-[#083B56] border border-[#DCE8EF]">
                <QrCode size={30} />
              </span>
              <h3 className="font-extrabold text-[#083B56] text-lg" style={{ margin: 0 }}>Gate Security Parking Scanner</h3>
              <p className="text-xs text-[#657785]" style={{ margin: 0 }}>Scan QR pass code or enter Vehicle Number to validate gate access.</p>
            </div>

            <form onSubmit={handleGateScan} className="space-y-4 pt-1">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Scan QR or Enter Vehicle Plate / Slot Code (e.g. B1-P01)"
                  value={qrScanInput}
                  onChange={(e) => setQrScanInput(e.target.value)}
                  style={{ borderRadius: '12px', border: '1px solid var(--aarizo-border, #DCE8EF)', fontSize: '0.8125rem' }}
                  className="w-full px-4 py-3 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#083B56]/30 focus:border-[#083B56] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                style={{
                  background: 'var(--aarizo-navy, #083B56)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  border: 'none',
                }}
                className="w-full shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 active:scale-95"
              >
                <ShieldCheck size={18} /> Validate Gate Parking Pass
              </button>
            </form>

            {scanResult && (
              <div
                className={`p-4 rounded-2xl border space-y-2 mt-4 ${
                  scanResult.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm">
                  {scanResult.isValid ? (
                    <CheckCircle2 className="text-emerald-600" size={18} />
                  ) : (
                    <AlertTriangle className="text-rose-600" size={18} />
                  )}
                  <span className={scanResult.isValid ? 'text-emerald-950' : 'text-rose-950'}>
                    {scanResult.isValid ? 'ACCESS GRANTED - VALID PARKING PASS' : 'ACCESS DENIED'}
                  </span>
                </div>
                {scanResult.reason && <p className="text-xs text-slate-700 font-medium">{scanResult.reason}</p>}
                {scanResult.slot && (
                  <div className="text-xs text-slate-800 pt-1 font-semibold">
                    Allocated Slot: <strong>{scanResult.slot.slotCode}</strong> ({scanResult.slot.level}) · Flat:{' '}
                    {scanResult.slot.assignedFlatCode}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Request Pass */}
      <Modal
        isOpen={modalMode === 'REQUEST_PASS'}
        onClose={() => setModalMode(null)}
        title="Request Temporary Pass"
        subtitle="Instant QR approval for guest or vacation vehicles"
        icon={<QrCode size={22} />}
        maxWidth="520px"
        footer={
          <div className="flex gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-3 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('qr-pass-request-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="flex-1 py-3 px-4 text-xs font-extrabold rounded-xl text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 hover:brightness-110"
              style={{ background: '#F06543', border: 'none' }}
            >
              <Zap size={15} /> Generate Pass
            </button>
          </div>
        }
      >
        <form id="qr-pass-request-form" onSubmit={handleRequestPassSubmit} className="space-y-4">
          {/* Category Selector Pills */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#083B56] uppercase tracking-wider">Select Pass Category</label>
            <ChoicePills
              columns={3}
              value={passRequestForm.parkingType}
              onChange={(val) => setPassRequestForm({ ...passRequestForm, parkingType: val as any })}
              options={[
                { value: 'TEMPORARY', label: 'Temporary', description: 'Guest Car' },
                { value: 'VACATION', label: 'Vacation', description: 'Long Stay' },
                { value: 'VISITOR', label: 'Visitor', description: '1-Day Gate' },
              ]}
            />
          </div>

          {/* Vehicle Registration Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#083B56] uppercase tracking-wider">Vehicle Registration Number</label>
            <div className="relative">
              <Car size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. MH-12-RS-9988"
                value={passRequestForm.vehicleNumber}
                onChange={(e) => setPassRequestForm({ ...passRequestForm, vehicleNumber: e.target.value.toUpperCase() })}
                className="w-full pl-10.5 pr-3.5 py-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none uppercase tracking-wider"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Info size={12} className="text-[#F06543]" /> Standard Indian vehicle format: State Code - District - Series - Number
            </p>
          </div>

          {/* Pass Duration Pill Buttons */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#083B56] uppercase tracking-wider flex items-center gap-1">
              <Calendar size={13} className="text-[#F06543]" /> Validity Period
            </label>
            <ChoicePills
              value={passRequestForm.durationDays}
              onChange={(val) => setPassRequestForm({ ...passRequestForm, durationDays: Number(val) })}
              options={[1, 3, 7, 15, 30].map((d) => ({ value: d, label: `${d} ${d === 1 ? 'Day' : 'Days'}` }))}
            />
          </div>
        </form>
      </Modal>

      {/* Modal: View Generated Pass */}
      <Modal
        isOpen={modalMode === 'VIEW_PASS' && !!activeQRPass}
        onClose={() => setModalMode(null)}
        title="Digital QR Parking Ticket"
        subtitle="Active digital pass code for gate scanner verification"
        icon={<QrCode size={22} />}
        maxWidth="440px"
        footer={
          <button
            type="button"
            onClick={() => setModalMode(null)}
            className="w-full py-3 text-xs font-extrabold rounded-xl text-white shadow-md active:scale-95 transition-all cursor-pointer hover:brightness-110"
            style={{ background: '#083B56', border: 'none' }}
          >
            Done &amp; Close Ticket
          </button>
        }
      >
        {activeQRPass && (
          <div className="space-y-4 text-center">
            {/* Ticket Box */}
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-4 space-y-3">
              <div className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#FFF0EC] text-[#F06543] uppercase tracking-wider border border-[#FDF0ED]">
                {activeQRPass.parkingType} PASS
              </div>

              <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    activeQRPass.passCode
                  )}`}
                  alt="QR Pass"
                  className="mx-auto rounded-lg"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-center space-y-1">
                <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider" style={{ margin: 0 }}>Pass Code</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-base font-mono font-black text-[#F06543] tracking-widest" style={{ margin: 0 }}>
                    {activeQRPass.passCode}
                  </p>
                  <button
                    onClick={() => copyToClipboard(activeQRPass.passCode)}
                    className="p-1 rounded-md text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                    title="Copy Passcode"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 font-medium text-left bg-white p-3.5 rounded-2xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle:</span>
                  <strong className="text-slate-900 font-mono font-extrabold">{activeQRPass.vehicleNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valid Until:</span>
                  <span className="text-slate-700 font-bold">{activeQRPass.validUntil}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Assign Slot */}
      {modalMode === 'ASSIGN' && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto border border-slate-100/80 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base" style={{ color: '#0F172A', margin: 0 }}>
                Assign Slot {selectedSlot.slotCode}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  required
                  placeholder="MH-12-AB-1234"
                  value={assignForm.vehicleNumber}
                  onChange={(e) => setAssignForm({ ...assignForm, vehicleNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Flat Code</label>
                  <input
                    type="text"
                    required
                    value={assignForm.flatCode}
                    onChange={(e) => setAssignForm({ ...assignForm, flatCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Resident Name</label>
                  <input
                    type="text"
                    required
                    value={assignForm.residentName}
                    onChange={(e) => setAssignForm({ ...assignForm, residentName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-2xl border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-extrabold rounded-2xl text-white shadow-md active:scale-95 transition-all cursor-pointer hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #083B56 0%, #1A232E 100%)', border: 'none' }}
                >
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Report Violation */}
      {modalMode === 'REPORT_VIOLATION' && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto border border-slate-100/80 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <ShieldAlert size={20} />
                </span>
                <h3 className="font-black text-slate-900 text-base" style={{ color: '#0F172A', margin: 0 }}>
                  Report Parking Violation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReportViolationSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    required
                    placeholder="MH-12-AB-9999"
                    value={violationForm.vehicleNumber}
                    onChange={(e) => setViolationForm({ ...violationForm, vehicleNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Slot Code</label>
                  <input
                    type="text"
                    required
                    placeholder="B1-P01"
                    value={violationForm.slotCode}
                    onChange={(e) => setViolationForm({ ...violationForm, slotCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Violation Type</label>
                <select
                  value={violationForm.violationType}
                  onChange={(e) => setViolationForm({ ...violationForm, violationType: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-xs bg-white font-extrabold text-slate-800 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 focus:outline-none"
                >
                  <option value="UNAUTHORIZED_PARKING">UNAUTHORIZED PARKING</option>
                  <option value="WRONG_SLOT">PARKED IN WRONG SLOT</option>
                  <option value="OVERSTAY">EXCEEDED VISITOR TIME LIMIT</option>
                  <option value="BLOCKING_DRIVEWAY">BLOCKING DRIVEWAY / RAMP</option>
                </select>
              </div>

              <div>
                <FileUpload
                  category="tickets"
                  label="Upload Photo Evidence"
                  onUploadSuccess={(url) => setViolationForm({ ...violationForm, photoEvidenceUrl: url })}
                />
                {violationForm.photoEvidenceUrl && (
                  <p className="text-xs text-emerald-600 font-extrabold mt-1 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Evidence Photo Attached
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Private Notes</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe location details..."
                  value={violationForm.privateNotes}
                  onChange={(e) => setViolationForm({ ...violationForm, privateNotes: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-2xl border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-extrabold rounded-2xl text-white shadow-md active:scale-95 transition-all cursor-pointer bg-rose-600 hover:bg-rose-700"
                >
                  Dispatch Warning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Slot */}
      {modalMode === 'ADD_SLOT' && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto border border-slate-100/80 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <PlusCircle size={20} />
                </span>
                <h3 className="font-black text-slate-900 text-base" style={{ color: '#0F172A', margin: 0 }}>
                  Create Parking Slot
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSlotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Slot Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B2-P15"
                  value={slotForm.slotCode}
                  onChange={(e) => setSlotForm({ ...slotForm, slotCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Level / Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basement 2"
                  value={slotForm.level}
                  onChange={(e) => setSlotForm({ ...slotForm, level: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Parking Slot Type</label>
                <select
                  value={slotForm.parkingType}
                  onChange={(e) => setSlotForm({ ...slotForm, parkingType: e.target.value as ParkingType })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-xs bg-white font-extrabold text-slate-800 focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
                >
                  <option value="RESIDENT">RESIDENT</option>
                  <option value="VISITOR">VISITOR</option>
                  <option value="EV_CHARGING">EV CHARGING</option>
                  <option value="TEMPORARY">TEMPORARY</option>
                  <option value="VACATION">VACATION</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-2xl border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-extrabold rounded-2xl text-white shadow-md active:scale-95 transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                >
                  Create Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



