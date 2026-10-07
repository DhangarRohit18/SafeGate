import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { guestStayService } from '../../../services/guestStayService';
import { realtimeService } from '../../../services/realtimeService';
import type { GuestReservation } from '../../../types/guestStay';
import {
  Hotel,
  QrCode,
  CheckCircle2,
  XCircle,
  UserCheck,
  ArrowLeft,
  Camera,
  Calendar,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { QRScanner } from '../../../components/ui/QRScanner';

export const GuestStayScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const societyId = (currentUser as any)?.societyId || 'soc-gvs';

  const [qrInput, setQrInput] = useState('');
  const [activeReservations, setActiveReservations] = useState<GuestReservation[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Scan Validation Result
  const [scanResult, setScanResult] = useState<{
    scanned: boolean;
    allowed: boolean;
    message: string;
    reservation?: GuestReservation;
  } | null>(null);

  useEffect(() => {
    loadData();
    const unsub = realtimeService.subscribe('*', (event) => {
      if (event.type === 'GUEST_STAY_BOOKED' || event.type === 'GUEST_STAY_UPDATED' || event.type.includes('GUEST')) {
        loadData();
      }
    });
    return () => unsub();
  }, [societyId]);

  const loadData = () => {
    setActiveReservations(guestStayService.getReservations(societyId));
  };

  const handleScanQR = (codeStr: string) => {
    if (!codeStr.trim()) return;

    const res = guestStayService.verifyGuestQRAndCheckIn(societyId, codeStr.trim());
    setScanResult({
      scanned: true,
      allowed: res.allowed,
      message: res.message,
      reservation: res.reservation
    });

    realtimeService.publish({
      type: 'GUEST_STAY_UPDATED',
      payload: { action: 'CHECKED_IN', code: codeStr.trim(), timestamp: new Date().toISOString() }
    });

    setQrInput('');
    loadData();
  };

  const checkedInCount = activeReservations.filter(r => r.status === 'CHECKED_IN').length;
  const bookedCount = activeReservations.filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'CHECKED_IN').length;

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
                  Guest Stay Terminal Scanner
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
                Verify Guest Room QR passes, auto check-in pre-booked visitors, and issue access cards
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '1.25rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F4FAFE', border: '1px solid #DCE8EF', color: '#083B56', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hotel size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Total Reservations</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#083B56' }}>{activeReservations.length}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Currently Checked-In</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{checkedInCount}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Upcoming Booked</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>{bookedCount}</div>
            </div>
          </div>
        </div>

        {/* Mobile Responsive Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {/* Left Column: QR Verification Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#083B56', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <QrCode size={18} color="#F06543" /> Guest QR Pass Verification
                </h2>
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
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: '#52788D' }}>
                Scan QR code from visitor's pass or enter booking pass token below.
              </p>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleScanQR(qrInput);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}
              >
                <input
                  type="text"
                  placeholder="e.g. GUEST-QR-8801-ROYAL"
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    fontFamily: 'monospace',
                    color: '#083B56',
                    fontWeight: 600,
                    outline: 'none',
                    background: '#F8FAFC',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#F06543',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 3px 12px rgba(240, 101, 67, 0.28)',
                  }}
                >
                  Verify &amp; Check In Guest
                </button>
              </form>

              {/* Quick Demo Test Passes */}
              {activeReservations.length > 0 && (
                <div style={{ paddingTop: '0.85rem', borderTop: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.78rem', color: '#52788D', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                    Active Guest Passes (Tap to test scan):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {activeReservations.slice(0, 4).map(resv => (
                      <button
                        key={resv.id}
                        onClick={() => handleScanQR(resv.qrCode)}
                        style={{
                          padding: '0.55rem 0.85rem',
                          background: '#F4FAFE',
                          border: '1px solid #DCE8EF',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          color: '#083B56',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left',
                        }}
                      >
                        <span>{resv.primaryGuestName} (Room #{resv.roomNumber})</span>
                        <span style={{ fontSize: '0.72rem', color: '#52788D', fontFamily: 'monospace' }}>{resv.qrCode}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Validation Result Box */}
            {scanResult && (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: scanResult.allowed ? '#A7F3D0' : '#FCA5A5',
                  background: scanResult.allowed ? '#ECFDF5' : '#FEF2F2',
                  color: scanResult.allowed ? '#065F46' : '#991B1B',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  {scanResult.allowed ? (
                    <CheckCircle2 size={32} color="#059669" style={{ flexShrink: 0 }} />
                  ) : (
                    <XCircle size={32} color="#DC2626" style={{ flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 800 }}>
                      {scanResult.allowed ? 'VERIFICATION SUCCESSFUL' : 'ENTRY DENIED / BLOCKED'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>{scanResult.message}</p>

                    {scanResult.reservation && (
                      <div style={{ marginTop: '0.85rem', padding: '0.85rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #DCE8EF', fontSize: '0.82rem', color: '#083B56', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div><strong>Primary Guest:</strong> {scanResult.reservation.primaryGuestName} ({scanResult.reservation.primaryGuestPhone})</div>
                        <div><strong>ID Proof:</strong> {scanResult.reservation.idProofType} ({scanResult.reservation.idProofNumber})</div>
                        <div><strong>Assigned Suite:</strong> {scanResult.reservation.roomName} (Room #{scanResult.reservation.roomNumber})</div>
                        <div><strong>Resident Host:</strong> {scanResult.reservation.residentName} (Flat {scanResult.reservation.flatNumber})</div>
                        <div><strong>Stay Dates:</strong> {scanResult.reservation.checkInDate} to {scanResult.reservation.checkOutDate}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Currently Checked-In Guest Stays */}
          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: '#083B56', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={16} /> Currently Checked-In Guest Stays
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeReservations.filter(r => r.status === 'CHECKED_IN').length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#52788D', fontSize: '0.85rem' }}>
                  <Hotel size={36} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: 800, color: '#083B56' }}>No Guest Stays Checked In</div>
                  <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>Check in a guest above to log room entry.</div>
                </div>
              ) : (
                activeReservations.filter(r => r.status === 'CHECKED_IN').map(resv => (
                  <div
                    key={resv.id}
                    style={{
                      padding: '0.85rem',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 800, color: '#083B56', fontSize: '0.9rem' }}>
                        Room #{resv.roomNumber} — {resv.primaryGuestName}
                      </span>
                      <span style={{ padding: '2px 8px', background: '#ECFDF5', color: '#059669', fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px' }}>
                        CHECKED IN
                      </span>
                    </div>
                    <div style={{ color: '#52788D', marginTop: '2px' }}>Resident Host: {resv.residentName} ({resv.flatNumber})</div>
                    <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '2px' }}>Checkout Due: {resv.checkOutDate}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Camera QR Scanner Modal */}
      <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Camera Guest QR Scanner">
        <QRScanner onScan={(code) => {
          handleScanQR(code);
          setIsScannerOpen(false);
        }} />
      </Modal>
    </div>
  );
};
