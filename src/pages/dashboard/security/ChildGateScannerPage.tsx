import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { childSafetyService } from '../../../services/childSafetyService';
import { realtimeService } from '../../../services/realtimeService';
import type { ChildProfile, ChildPickupQR, PickupLog, ChildSafetyAlert } from '../../../types/childSafety';
import {
  QrCode,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  UserCheck,
  ArrowLeft,
  Scan,
} from 'lucide-react';

export const ChildGateScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const societyId = (currentUser as any)?.societyId || 'soc-gvs';

  const [qrInput, setQrInput] = useState('');

  const [activeAlerts, setActiveAlerts] = useState<ChildSafetyAlert[]>([]);
  const [activeQRs, setActiveQRs] = useState<ChildPickupQR[]>([]);
  const [pickupLogs, setPickupLogs] = useState<PickupLog[]>([]);

  // Scan Validation Result
  const [scanResult, setScanResult] = useState<{
    scanned: boolean;
    allowed: boolean;
    message: string;
    child?: ChildProfile;
    pickupPersonName?: string;
  } | null>(null);

  useEffect(() => {
    loadData();
    const unsub = realtimeService.subscribe('*', (event) => {
      if (
        event.type === 'CHILD_SAFETY_UPDATED' ||
        event.type === 'CHILD_ALERT_TRIGGERED' ||
        event.type === 'CHILD_EXIT_SCANNED' ||
        event.type === 'EMERGENCY_ALERTS'
      ) {
        loadData();
      }
    });
    return () => unsub();
  }, [societyId]);

  const loadData = () => {
    setActiveAlerts(childSafetyService.getSafetyAlerts(societyId).filter(a => a.status === 'ACTIVE'));
    setActiveQRs(childSafetyService.getPickupQRs(societyId));
    setPickupLogs(childSafetyService.getPickupLogs(societyId));
  };

  const handleScanQR = (codeStr: string) => {
    if (!codeStr.trim()) return;

    const res = childSafetyService.verifyAndScanChildPickup(societyId, codeStr.trim());
    setScanResult({
      scanned: true,
      allowed: res.allowed,
      message: res.message,
      child: res.child,
      pickupPersonName: res.pickupPersonName
    });

    realtimeService.publish({
      type: 'CHILD_EXIT_SCANNED',
      payload: { code: codeStr.trim(), allowed: res.allowed, childId: res.child?.id, timestamp: new Date().toISOString() }
    });

    setQrInput('');
    loadData();
  };

  const handleResolveAlert = (alertId: string) => {
    childSafetyService.resolveSafetyAlert(societyId, alertId, currentUser?.name || 'Security Guard');
    realtimeService.publish({
      type: 'CHILD_SAFETY_UPDATED',
      payload: { action: 'ALERT_RESOLVED', alertId, timestamp: new Date().toISOString() }
    });
    loadData();
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
              Child Security &amp; Gate Scanner
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                Terminal Online
              </span>
            </h1>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Verify pickup QR passes &amp; enforce missing child gate lockdowns
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 space-y-4">
        {/* Active Missing Child Critical Alert Banner */}
        {activeAlerts.length > 0 && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '16px', padding: '1rem 1.25rem', boxShadow: '0 4px 16px rgba(220, 38, 38, 0.12)' }} className="animate-pulse flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-7 h-7 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 900, color: '#DC2626', margin: 0 }}>🚨 CRITICAL MISSING CHILD LOCKDOWN ACTIVE</h2>
                <div style={{ fontSize: '0.75rem', color: '#991B1B', marginTop: 4 }} className="space-y-1">
                  {activeAlerts.map(alert => (
                    <div key={alert.id} className="flex items-center gap-2">
                      <span>{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleResolveAlert(activeAlerts[0].id)}
              style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: '#DC2626', color: '#ffffff', fontWeight: 800, fontSize: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)' }}
            >
              Mark Child Safe / Resolve Alert
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Scanner Terminal Column */}
          <div className="flex flex-col gap-4">
            {/* QR Terminal Box */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #DCE8EF',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
              }}
              className="flex flex-col gap-4"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#083B56', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <QrCode size={18} color="#083B56" /> Security Gate Scanner Terminal
                </h2>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                  Gate Terminal Active
                </span>
              </div>

              <p style={{ fontSize: '0.75rem', color: '#657785', margin: 0 }}>
                Scan barcode/QR code from caretaker's mobile or paste QR code string below to verify pickup permission.
              </p>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleScanQR(qrInput);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <input
                  type="text"
                  placeholder="Scan or Enter QR Code (e.g. CP-QR-172...)"
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
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
                  type="submit"
                  style={{
                    padding: '0.65rem 1.25rem',
                    background: 'var(--aarizo-coral, #F06543)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Scan size={15} /> Scan Pass
                </button>
              </form>

              {/* Quick Demo Passes Buttons */}
              {activeQRs.length > 0 && (
                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #DCE8EF' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#657785', display: 'block', marginBottom: 6 }}>
                    Active Society QR Passes (Click to test scan):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeQRs.slice(0, 4).map(qr => (
                      <button
                        key={qr.id}
                        type="button"
                        onClick={() => handleScanQR(qr.qrCode)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          background: '#F4FAFE',
                          border: '1px solid #DCE8EF',
                          color: '#083B56',
                          fontSize: '0.6875rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {qr.childName} ({qr.pickupPersonName})
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
                  background: scanResult.allowed ? '#ECFDF5' : '#FEF2F2',
                  border: `1px solid ${scanResult.allowed ? '#A7F3D0' : '#FECACA'}`,
                  borderRadius: '16px',
                  padding: '1.25rem',
                  boxShadow: '0 4px 12px rgba(8, 59, 86, 0.05)',
                }}
              >
                <div className="flex items-start gap-3.5">
                  {scanResult.allowed ? (
                    <CheckCircle2 size={36} color="#059669" className="shrink-0" />
                  ) : (
                    <XCircle size={36} color="#DC2626" className="shrink-0" />
                  )}
                  <div className="space-y-2 flex-1">
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: scanResult.allowed ? '#065F46' : '#991B1B', margin: 0 }}>
                      {scanResult.allowed ? 'PICKUP AUTHORIZED & PERMITTED' : 'PICKUP DENIED / BLOCKED'}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: scanResult.allowed ? '#047857' : '#DC2626', margin: 0 }}>
                      {scanResult.message}
                    </p>

                    {scanResult.child && (
                      <div style={{ padding: '0.875rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #DCE8EF', fontSize: '0.75rem', color: '#083B56' }} className="space-y-1">
                        <p style={{ margin: 0 }}><strong>Child Name:</strong> {scanResult.child.fullName} (Flat {scanResult.child.flatNumber})</p>
                        <p style={{ margin: 0 }}><strong>Pickup Person:</strong> {scanResult.pickupPersonName || 'N/A'}</p>
                        <p style={{ margin: 0 }}><strong>Primary Guardian Phone:</strong> {scanResult.child.guardians[0]?.phone || 'N/A'}</p>
                        {scanResult.child.medicalNotes && (
                          <p style={{ margin: 0, color: '#DC2626' }}><strong>Medical Warning:</strong> {scanResult.child.medicalNotes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Gate Logs */}
          <div className="flex flex-col gap-4">
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #DCE8EF',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
              }}
              className="flex flex-col gap-3"
            >
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#083B56', margin: 0 }} className="flex items-center gap-2">
                <UserCheck size={18} color="#083B56" /> Recent Gate Verification Logs
              </h3>

              <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto">
                {pickupLogs.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: '#657785', textAlign: 'center', padding: '2rem 0', margin: 0 }}>
                    No recent child pickup events recorded
                  </p>
                ) : (
                  pickupLogs.map(log => (
                    <div
                      key={log.id}
                      style={{
                        padding: '0.75rem 0.875rem',
                        background: '#F4FAFE',
                        border: '1px solid #DCE8EF',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                      }}
                      className="space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong style={{ color: '#083B56' }}>{log.childName} (Flat {log.flatNumber})</strong>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            borderRadius: '10px',
                            background: log.status === 'ALLOWED' ? '#ECFDF5' : '#FEF2F2',
                            color: log.status === 'ALLOWED' ? '#059669' : '#DC2626',
                            border: `1px solid ${log.status === 'ALLOWED' ? '#A7F3D0' : '#FECACA'}`,
                          }}
                        >
                          {log.status}
                        </span>
                      </div>
                      <p style={{ color: '#657785', margin: 0 }}>Caretaker: {log.pickupPersonName}</p>
                      <p style={{ color: '#657785', fontSize: '0.6875rem', fontFamily: 'monospace', margin: 0 }}>
                        {new Date(log.timestamp).toLocaleString()} · {log.gateId}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildGateScannerPage;
