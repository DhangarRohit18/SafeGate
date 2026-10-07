import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Camera,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Search,
  ParkingSquare,
  Clock,
  ShieldCheck,
  UserCheck,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { parkingService } from '../../../services/parkingService';
import { realtimeService } from '../../../services/realtimeService';
import type { ParkingSlot, ParkingQRValidationResult, ParkingLog } from '../../../types/parking';
import { Modal } from '../../../components/ui/Modal';
import { QRScanner } from '../../../components/ui/QRScanner';

export const ParkingGateScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentSocietyId = (currentUser as any)?.societyId || 'soc-gvs';
  const officerActor = {
    id: currentUser?.id || 'guard-1',
    name: currentUser?.name || 'Officer R. Singh',
    role: 'SECURITY',
  };

  const [inputCode, setInputCode] = useState('');
  const [validationResult, setValidationResult] = useState<ParkingQRValidationResult | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'verify' | 'slots' | 'logs'>('verify');
  const [slotFilter, setSlotFilter] = useState<'ALL' | 'OCCUPIED' | 'AVAILABLE' | 'VISITOR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [logs, setLogs] = useState<ParkingLog[]>([]);

  useEffect(() => {
    loadData();
    const unsub = realtimeService.subscribe('*', (event) => {
      if (
        event.type === 'PARKING_UPDATE' ||
        event.type === 'PARKING_OCCUPANCY'
      ) {
        loadData();
      }
    });
    return () => unsub();
  }, [currentSocietyId]);

  const loadData = () => {
    setSlots(parkingService.getSlots(currentSocietyId));
    setLogs(parkingService.getLogs(currentSocietyId));
  };

  const handleValidate = (code: string) => {
    if (!code.trim()) return;
    const res = parkingService.validateParkingQR(currentSocietyId, code);
    setValidationResult(res);
  };

  const handleEntry = (slot: ParkingSlot) => {
    parkingService.scanEntry(slot.id, slot.assignedVehicleNumber || 'VISITOR', officerActor);
    loadData();
    setValidationResult(null);
    setIsScannerOpen(false);
    setInputCode('');
  };

  const handleExit = (slot: ParkingSlot) => {
    parkingService.scanExit(slot.id, officerActor);
    loadData();
    setValidationResult(null);
    setIsScannerOpen(false);
    setInputCode('');
  };

  // Metrics
  const totalSlotsCount = slots.length;
  const occupiedCount = slots.filter((s) => s.occupancyState === 'OCCUPIED').length;
  const availableCount = slots.filter((s) => s.occupancyState === 'AVAILABLE').length;
  const visitorCount = slots.filter((s) => s.slotType === 'VISITOR').length;

  const filteredSlots = slots.filter((s) => {
    const matchesFilter =
      slotFilter === 'ALL'
        ? true
        : slotFilter === 'OCCUPIED'
        ? s.occupancyState === 'OCCUPIED'
        : slotFilter === 'AVAILABLE'
        ? s.occupancyState === 'AVAILABLE'
        : s.slotType === 'VISITOR';

    const matchesSearch =
      searchQuery === '' ||
      s.slotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.assignedVehicleNumber && s.assignedVehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.assignedResidentName && s.assignedResidentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.assignedFlatCode && s.assignedFlatCode.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ background: 'var(--aarizo-page, #F7FBFE)', minHeight: '100vh', paddingBottom: '5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #DCE8EF', padding: '0.85rem 1.25rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#F4FAFE',
                border: '1px solid #DCE8EF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#083B56',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#083B56' }}>
                  Gate Parking Console
                </h1>
                <span
                  style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#059669',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                  Gate Terminal Active
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#52788D' }}>
                Validate vehicle permits, check slot allocations & toggle entry/exit
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '1.25rem auto', padding: '0 1rem' }}>
        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F4FAFE', border: '1px solid #DCE8EF', color: '#083B56', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ParkingSquare size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Total Bays</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#083B56' }}>{totalSlotsCount}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Occupied</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626' }}>{occupiedCount}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Available Bays</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{availableCount}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Visitor Bays</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>{visitorCount}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#ffffff', padding: '0.35rem', borderRadius: '12px', border: '1px solid #DCE8EF', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setActiveTab('verify')}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              background: activeTab === 'verify' ? '#F4FAFE' : 'transparent',
              color: activeTab === 'verify' ? '#083B56' : '#52788D',
              borderBottom: activeTab === 'verify' ? '2px solid #F06543' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Camera size={16} /> Verification Terminal
          </button>

          <button
            onClick={() => setActiveTab('slots')}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              background: activeTab === 'slots' ? '#F4FAFE' : 'transparent',
              color: activeTab === 'slots' ? '#083B56' : '#52788D',
              borderBottom: activeTab === 'slots' ? '2px solid #F06543' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <ParkingSquare size={16} /> Parking Slots ({slots.length})
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              background: activeTab === 'logs' ? '#F4FAFE' : 'transparent',
              color: activeTab === 'logs' ? '#083B56' : '#52788D',
              borderBottom: activeTab === 'logs' ? '2px solid #F06543' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Clock size={16} /> Activity Log ({logs.length})
          </button>
        </div>

        {/* TAB 1: VERIFY TERMINAL */}
        {activeTab === 'verify' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
            {/* Input Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #DCE8EF',
                borderRadius: '16px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(8, 59, 86, 0.04)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#F4FAFE',
                  border: '1px solid #DCE8EF',
                  color: '#083B56',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Car size={28} />
              </div>

              <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.3rem', fontWeight: 800, color: '#083B56' }}>
                Verify Vehicle Tag or Slot Code
              </h2>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: '#52788D', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
                Enter parking slot code (e.g. B1-P12) or resident vehicle registration number to validate allocation and record gate pass.
              </p>

              <div style={{ maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. B1-P12 or MH-02-CB-4092"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleValidate(inputCode)}
                    style={{
                      flex: 1,
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      color: '#083B56',
                      fontWeight: 600,
                      outline: 'none',
                      background: '#F8FAFC',
                    }}
                  />
                  <button
                    onClick={() => handleValidate(inputCode)}
                    style={{
                      padding: '0.85rem 1.5rem',
                      background: '#F06543',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 3px 12px rgba(240, 101, 67, 0.28)',
                    }}
                  >
                    Verify
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.4rem',
                    background: '#F4FAFE',
                    color: '#083B56',
                    border: '1px solid #DCE8EF',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  <Camera size={18} color="#F06543" /> Open Camera QR Scanner
                </button>
              </div>
            </div>

            {/* Quick Recent Activity Feed */}
            <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#083B56', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} /> Recent Gate Passes
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#52788D', fontWeight: 600 }}>Live Feed</span>
              </div>

              {logs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#52788D', fontSize: '0.85rem' }}>
                  No vehicle scans recorded yet today.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {logs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: log.action === 'ENTRY' ? '#ECFDF5' : '#FEF2F2',
                            color: log.action === 'ENTRY' ? '#059669' : '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {log.action === 'ENTRY' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#083B56' }}>
                            {log.slotNumber} • <span style={{ fontFamily: 'monospace' }}>{log.vehicleNumber}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#52788D' }}>
                            Flat: {log.flatCode} • By {log.scannedBy}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            background: log.action === 'ENTRY' ? '#ECFDF5' : '#FEF2F2',
                            color: log.action === 'ENTRY' ? '#059669' : '#DC2626',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {log.action}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>{log.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PARKING SLOTS GRID */}
        {activeTab === 'slots' && (
          <div>
            {/* Filters & Search Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(['ALL', 'OCCUPIED', 'AVAILABLE', 'VISITOR'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSlotFilter(filter)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: slotFilter === filter ? '#083B56' : '#DCE8EF',
                      background: slotFilter === filter ? '#083B56' : '#ffffff',
                      color: slotFilter === filter ? '#ffffff' : '#52788D',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {filter === 'ALL' ? 'All Slots' : filter}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search slot or vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem 0.45rem 2.1rem',
                    borderRadius: '8px',
                    border: '1px solid #DCE8EF',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                />
              </div>
            </div>

            {/* Slots Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {filteredSlots.map((slot) => {
                const isOccupied = slot.occupancyState === 'OCCUPIED';
                const isAvailable = slot.occupancyState === 'AVAILABLE';

                return (
                  <div
                    key={slot.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #DCE8EF',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 6px rgba(8, 59, 86, 0.03)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#083B56' }}>{slot.slotNumber}</span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: isOccupied ? '#FEF2F2' : isAvailable ? '#ECFDF5' : '#FFFBEB',
                            color: isOccupied ? '#DC2626' : isAvailable ? '#059669' : '#D97706',
                          }}
                        >
                          {slot.occupancyState}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#52788D', marginBottom: '0.75rem' }}>
                        <div>Level: <strong>{slot.level}</strong> ({slot.slotType})</div>
                        <div>Flat: <strong>{slot.assignedFlatCode || 'N/A'}</strong></div>
                        <div>Vehicle: <strong style={{ fontFamily: 'monospace' }}>{slot.assignedVehicleNumber || 'Visitor/Unassigned'}</strong></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {!isOccupied ? (
                        <button
                          onClick={() => handleEntry(slot)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#059669',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                          }}
                        >
                          Scan Entry (IN)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleExit(slot)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#DC2626',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                          }}
                        >
                          Scan Exit (OUT)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: '#083B56', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} /> Gate Parking Audit Log
            </h3>

            {logs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#52788D' }}>
                No entry/exit logs recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: log.action === 'ENTRY' ? '#ECFDF5' : '#FEF2F2',
                          color: log.action === 'ENTRY' ? '#059669' : '#DC2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {log.action === 'ENTRY' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#083B56' }}>
                          Slot {log.slotNumber} • <span style={{ fontFamily: 'monospace' }}>{log.vehicleNumber}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#52788D' }}>
                          Flat Allocation: {log.flatCode} • Officer: {log.scannedBy}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          background: log.action === 'ENTRY' ? '#ECFDF5' : '#FEF2F2',
                          color: log.action === 'ENTRY' ? '#059669' : '#DC2626',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        {log.action}
                      </span>
                      <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px' }}>{log.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation Result Modal */}
      {validationResult && (
        <Modal isOpen={!!validationResult} onClose={() => setValidationResult(null)} title="Parking Tag Validation">
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: validationResult.isValid ? '#ECFDF5' : '#FEF2F2',
                color: validationResult.isValid ? '#059669' : '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              {validationResult.isValid ? <CheckCircle2 size={34} /> : <XCircle size={34} />}
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0', color: validationResult.isValid ? '#059669' : '#DC2626', fontSize: '1.2rem', fontWeight: 800 }}>
              {validationResult.isValid ? 'VALID PARKING PERMIT' : 'PERMIT REJECTED'}
            </h3>

            {validationResult.slot && (
              <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', margin: '1rem 0', textAlign: 'left', fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '0.35rem' }}>Parking Bay: <strong>{validationResult.slot.slotNumber}</strong> ({validationResult.slot.level})</div>
                <div style={{ marginBottom: '0.35rem' }}>Assigned Flat: <strong>{validationResult.slot.assignedFlatCode || 'N/A'}</strong> ({validationResult.slot.assignedResidentName || 'Visitor'})</div>
                <div style={{ marginBottom: '0.35rem' }}>Vehicle: <strong style={{ fontFamily: 'monospace' }}>{validationResult.slot.assignedVehicleNumber || 'N/A'}</strong></div>
                <div>Current Occupancy: <strong style={{ color: validationResult.slot.occupancyState === 'OCCUPIED' ? '#DC2626' : '#059669' }}>{validationResult.slot.occupancyState}</strong></div>
              </div>
            )}

            {!validationResult.isValid && (
              <p style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.9rem' }}>{validationResult.reason}</p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                onClick={() => setValidationResult(null)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#ffffff', fontWeight: 600, color: '#083B56', cursor: 'pointer' }}
              >
                Dismiss
              </button>
              {validationResult.isValid && validationResult.slot && (
                <>
                  {validationResult.slot.occupancyState !== 'OCCUPIED' && (
                    <button
                      onClick={() => handleEntry(validationResult.slot!)}
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#059669', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Scan Entry (IN)
                    </button>
                  )}
                  {validationResult.slot.occupancyState === 'OCCUPIED' && (
                    <button
                      onClick={() => handleExit(validationResult.slot!)}
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: '#DC2626', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Scan Exit (OUT)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* QR Scanner Modal */}
      <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Camera Parking QR Scanner">
        <QRScanner onScan={(code) => handleValidate(code)} />
      </Modal>
    </div>
  );
};
