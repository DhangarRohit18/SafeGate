import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  CheckCircle,
  XCircle,
  ShieldCheck,
  UserCheck,
  Search,
  Phone,
  UserX,
  ArrowLeft,
  Users,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { staffService } from '../../../services/staffService';
import { realtimeService } from '../../../services/realtimeService';
import type { DomesticWorkerProfile, StaffAttendanceLog, AttendanceStatus } from '../../../types/staff';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { QRScanner } from '../../../components/ui/QRScanner';

export const StaffGateTerminalPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentSocietyId = (currentUser as any)?.societyId || 'soc-gvs';
  const officerActor = {
    id: currentUser?.id || 'sec-guard-1',
    name: currentUser?.name || 'Officer Vikram Singh',
    role: 'SECURITY',
  };

  const [workers, setWorkers] = useState<DomesticWorkerProfile[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<StaffAttendanceLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<DomesticWorkerProfile | null>(null);
  const [scanResult, setScanResult] = useState<{ status: 'SUCCESS' | 'DENIED'; message: string } | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const reloadData = () => {
    const list = staffService.getWorkers(currentSocietyId);
    setWorkers(list);
    setAttendanceLogs(staffService.getAttendanceLogs(currentSocietyId));
    
    // Auto-select first worker if none selected
    if (list.length > 0) {
      setSelectedWorker((prev) => {
        if (!prev) return list[0];
        const updated = list.find((w) => w.id === prev.id);
        return updated || list[0];
      });
    }
  };

  useEffect(() => {
    reloadData();

    const unsub = realtimeService.subscribe('*', (msg) => {
      if (['WORKER_ENTRY_EXIT', 'STAFF_DUTY_CHANGED', 'SOCIETY_SYNC'].includes(msg.topic)) {
        reloadData();
      }
    });

    return () => unsub();
  }, [currentSocietyId]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) return;

    const match = workers.find(
      (w: DomesticWorkerProfile) =>
        w.passCode.toLowerCase() === query.trim().toLowerCase() ||
        w.phone.includes(query.trim()) ||
        w.qrDataString.toLowerCase().includes(query.trim().toLowerCase()) ||
        w.name.toLowerCase().includes(query.trim().toLowerCase())
    );

    if (match) {
      setSelectedWorker(match);
      setScanResult(null);
    }
  };

  const handleEntry = (worker: DomesticWorkerProfile) => {
    try {
      const updated = staffService.scanWorkerEntry(worker.id, officerActor);
      if (updated) {
        setSelectedWorker(updated);
        setScanResult({
          status: 'SUCCESS',
          message: `ENTRY GRANTED: ${worker.name} (${worker.workerType}) checked IN successfully.`,
        });
        reloadData();
      }
    } catch (err: any) {
      setScanResult({
        status: 'DENIED',
        message: err.message || 'Entry Denied',
      });
    }
  };

  const handleExit = (worker: DomesticWorkerProfile) => {
    try {
      const updated = staffService.scanWorkerExit(worker.id, officerActor);
      if (updated) {
        setSelectedWorker(updated);
        setScanResult({
          status: 'SUCCESS',
          message: `EXIT RECORDED: ${worker.name} checked OUT successfully.`,
        });
        reloadData();
      }
    } catch (err: any) {
      setScanResult({
        status: 'DENIED',
        message: err.message || 'Exit recording failed',
      });
    }
  };

  const getAttendanceBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'IN':
        return <StatusBadge variant="success" label="IN SOCIETY" />;
      case 'OUT':
        return <StatusBadge variant="neutral" label="OUTSIDE" />;
      case 'LATE':
        return <StatusBadge variant="warning" label="LATE" />;
      case 'ABSENT':
        return <StatusBadge variant="danger" label="ABSENT" />;
      case 'SUSPENDED':
        return <StatusBadge variant="danger" label="SUSPENDED" />;
      default:
        return <StatusBadge variant="neutral" label={status} />;
    }
  };

  const filteredWorkers = workers.filter(
    (w: DomesticWorkerProfile) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.phone.includes(searchQuery) ||
      w.workerType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.assignedFlatCodes.some((f: string) => f.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeInSocietyCount = workers.filter((w) => w.attendanceStatus === 'IN').length;
  const verifiedCount = workers.filter((w) => w.verificationStatus === 'VERIFIED').length;

  return (
    <div style={{ background: 'var(--aarizo-page, #F7FBFE)', minHeight: '100vh', paddingBottom: '5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Subheader */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #DCE8EF', padding: '0.85rem 1.25rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
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
                  Staff & Domestic Worker Hub
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
                Verify staff QR passes, inspect background verification, and log gate entry/exit
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '1.25rem auto', padding: '0 1rem' }}>
        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F4FAFE', border: '1px solid #DCE8EF', color: '#083B56', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Registered Staff</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#083B56' }}>{workers.length}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Currently Inside</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{activeInSocietyCount}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F4FAFE', border: '1px solid #BAE6FD', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Verified Staff</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284C7' }}>{verifiedCount}</div>
            </div>
          </div>
        </div>

        {/* Action Result Alert Banner */}
        {scanResult && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.85rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: scanResult.status === 'SUCCESS' ? '#A7F3D0' : '#FECACA',
              background: scanResult.status === 'SUCCESS' ? '#ECFDF5' : '#FEF2F2',
              color: scanResult.status === 'SUCCESS' ? '#065F46' : '#991B1B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {scanResult.status === 'SUCCESS' ? <CheckCircle size={20} color="#059669" /> : <XCircle size={20} color="#DC2626" />}
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{scanResult.message}</span>
            </div>
            <button
              onClick={() => setScanResult(null)}
              style={{ background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 700, color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Mobile Responsive Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Search & Worker Selection Box */}
          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#083B56' }}>Search Worker / Pass Tag</h2>
              <button
                onClick={() => setIsScannerOpen(true)}
                style={{
                  padding: '0.45rem 0.85rem',
                  background: '#F4FAFE',
                  border: '1px solid #DCE8EF',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#083B56',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Camera size={14} color="#F06543" /> Camera Scan
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Scan QR or search pass code, phone, name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem 0.7rem 2.3rem',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  background: '#F8FAFC',
                  color: '#083B56',
                  fontWeight: 600,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '440px', overflowY: 'auto' }}>
              {filteredWorkers.map((w: DomesticWorkerProfile) => (
                <div
                  key={w.id}
                  onClick={() => {
                    setSelectedWorker(w);
                    setScanResult(null);
                  }}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: selectedWorker?.id === w.id ? '#083B56' : '#E2E8F0',
                    background: selectedWorker?.id === w.id ? '#F4FAFE' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease-in-out',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#F4FAFE',
                        border: '1px solid #DCE8EF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: '#083B56',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {w.photoUrl ? (
                        <img src={w.photoUrl} alt={w.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        w.name.charAt(0)
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#083B56', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {w.name}
                        <span style={{ padding: '2px 6px', background: '#F1F5F9', color: '#475569', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}>
                          {w.workerType}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#52788D', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {w.phone} • Flats: {w.assignedFlatCodes.join(', ') || 'None'}
                      </div>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>{getAttendanceBadge(w.attendanceStatus)}</div>
                </div>
              ))}

              {filteredWorkers.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#52788D', fontSize: '0.85rem' }}>
                  No domestic workers matched search.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Selected Worker Details & Gate Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {selectedWorker ? (
              <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#083B56' }}>Pass Gate Verification</h2>
                    <span style={{ fontSize: '0.78rem', color: '#52788D', fontWeight: 600 }}>Pass Code: {selectedWorker.passCode}</span>
                  </div>
                  <StatusBadge
                    variant={selectedWorker.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}
                    label={selectedWorker.verificationStatus}
                  />
                </div>

                {/* Profile Detail Box */}
                <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#F4FAFE', border: '2px solid #083B56', overflow: 'hidden', flexShrink: 0 }}>
                      {selectedWorker.photoUrl ? (
                        <img src={selectedWorker.photoUrl} alt={selectedWorker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#083B56', fontSize: '1.2rem' }}>
                          {selectedWorker.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#083B56' }}>
                        {selectedWorker.name}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#52788D', marginTop: '3px' }}>
                        <span style={{ fontWeight: 700, color: '#083B56' }}>{selectedWorker.workerType}</span> • Ph: {selectedWorker.phone}
                      </div>
                    </div>
                  </div>

                  <div>
                    <StatusBadge
                      variant={selectedWorker.accessStatus === 'ACTIVE' ? 'success' : 'danger'}
                      label={`ACCESS: ${selectedWorker.accessStatus}`}
                    />
                  </div>
                </div>

                {selectedWorker.accessStatus !== 'ACTIVE' && (
                  <div style={{ padding: '0.85rem 1rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', color: '#DC2626', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <UserX size={22} color="#DC2626" />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>ACCESS RESTRICTED</div>
                      <div style={{ fontSize: '0.78rem' }}>Worker is currently {selectedWorker.accessStatus}. Gate entry must be denied immediately.</div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                  <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <div style={{ color: '#52788D', fontWeight: 600 }}>Assigned Flats</div>
                    <div style={{ fontWeight: 800, color: '#083B56', marginTop: '2px' }}>
                      {selectedWorker.assignedFlatCodes.length > 0 ? selectedWorker.assignedFlatCodes.join(', ') : 'No flat assigned'}
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <div style={{ color: '#52788D', fontWeight: 600 }}>Emergency Contact</div>
                    <div style={{ fontWeight: 800, color: '#083B56', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={13} color="#52788D" /> {selectedWorker.emergencyContactPhone}
                    </div>
                  </div>
                </div>

                {/* Gate Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    disabled={selectedWorker.accessStatus !== 'ACTIVE'}
                    onClick={() => handleEntry(selectedWorker)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#059669',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: selectedWorker.accessStatus !== 'ACTIVE' ? 0.5 : 1,
                    }}
                  >
                    <UserCheck size={18} /> ALLOW ENTRY (IN)
                  </button>

                  <button
                    onClick={() => handleExit(selectedWorker)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#DC2626',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <XCircle size={18} /> RECORD EXIT (OUT)
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '3rem 1.5rem', textAlign: 'center', color: '#52788D' }}>
                <QrCode size={48} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#083B56' }}>No Worker Selected</div>
                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Select a domestic worker from the left list or search by code.</div>
              </div>
            )}

            {/* Attendance Activity Log */}
            <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: '#083B56', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} /> Recent Gate Activity Log
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {attendanceLogs.slice(0, 4).map((log: StaffAttendanceLog) => (
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
                          background: log.action === 'IN' ? '#ECFDF5' : '#FEF2F2',
                          color: log.action === 'IN' ? '#059669' : '#DC2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {log.action === 'IN' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#083B56' }}>
                          {log.workerName} ({log.workerType})
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#52788D' }}>
                          Officer: {log.scannedBy}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          background: log.action === 'IN' ? '#ECFDF5' : '#FEF2F2',
                          color: log.action === 'IN' ? '#059669' : '#DC2626',
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

                {attendanceLogs.length === 0 && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#52788D', fontSize: '0.85rem' }}>
                    No gate activity logged today.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Camera Worker Pass Scanner">
        <QRScanner onScan={(code) => {
          handleSearch(code);
          setIsScannerOpen(false);
        }} />
      </Modal>
    </div>
  );
};
