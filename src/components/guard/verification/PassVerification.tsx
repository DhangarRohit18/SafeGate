import React, { useState } from 'react';
import type { GuardVisitor, GatePassVerification } from '../../../domains/guard/types';
import { QrCode, KeyRound, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, ShieldCheck, Clock, User, Home, FileText, Car } from 'lucide-react';
import { visitorService } from '../../../services/visitorService';
import { apiClient } from '../../../services/apiClient';
import '../guard.css';

interface PassVerificationProps {
  visitors: GuardVisitor[];
  onSelectVisitor: (visitor: GuardVisitor) => void;
}

export const PassVerification: React.FC<PassVerificationProps> = ({ visitors, onSelectVisitor }) => {
  const [passcodeInput, setPasscodeInput] = useState<string>('8492');
  const [verificationResult, setVerificationResult] = useState<GatePassVerification | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'passcode' | 'qr'>('passcode');

  const handleVerifyPasscode = async (codeToVerify?: string) => {
    const code = (codeToVerify || passcodeInput).trim();
    if (!code) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // 1. Try Backend API first
      let resData: any = null;
      try {
        resData = await apiClient.verifyVisitorPass(code, 'soc-gvs');
      } catch (e) {
        // Fallback to local visitorService if offline or local dev
      }

      // 2. Query visitorService for canonical validation & fallback
      const localResult = visitorService.validatePassCode('soc-gvs', code);
      const matchedVisitor = visitors.find(
        (v) => v.passcode.toUpperCase() === code.toUpperCase() || v.id.toUpperCase().endsWith(code.toUpperCase())
      );

      if (resData && resData.isValid && resData.pass) {
        const pass = resData.pass;
        const mappedGuardVisitor: GuardVisitor = matchedVisitor || {
          id: pass.id,
          passcode: pass.passCode || code,
          name: pass.visitorName,
          phone: pass.phone,
          visitorType: (pass.passType?.toLowerCase() || 'guest') as any,
          visitorTypeLabel: `${pass.passType || 'Guest'} Visitor`,
          residentName: pass.resident?.name || 'Vikram Joshi',
          flatCode: pass.flat?.flatNumber || 'Flat B-1204',
          tower: 'Tower B',
          societyName: 'Green Valley Society',
          vehicleNumber: pass.vehicleNumber || undefined,
          expectedDate: 'Today',
          expectedTimeSlot: new Date(pass.validFrom || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: pass.status === 'CHECKED_IN' ? 'checked_in' : 'expected',
          verificationStatus: 'valid',
          createdAt: new Date(pass.createdAt || Date.now()).toLocaleDateString(),
          gateName: 'Gate #1 Main Entrance',
          gateOfficer: 'Officer Ramesh Shinde',
          notes: pass.purpose || 'Visit',
        };

        setVerificationResult({
          passcode: code,
          verificationStatus: 'valid',
          visitor: mappedGuardVisitor,
          message: 'Gate pass verified successfully!',
        });
      } else if (localResult.isValid && localResult.pass) {
        const pass = localResult.pass;
        const mappedGuardVisitor: GuardVisitor = matchedVisitor || {
          id: pass.id,
          passcode: pass.passCode || code,
          name: pass.visitorName,
          phone: pass.visitorPhone,
          visitorType: (pass.category.toLowerCase() || 'guest') as any,
          visitorTypeLabel: `${pass.category} Visitor`,
          residentName: pass.residentName || 'Vikram Joshi',
          flatCode: pass.flatCode || 'Flat B-1204',
          tower: pass.towerName || 'Tower B',
          societyName: 'Green Valley Society',
          vehicleNumber: pass.vehicleNumber || undefined,
          expectedDate: 'Today',
          expectedTimeSlot: new Date(pass.validFrom || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: pass.status === 'CHECKED_IN' ? 'checked_in' : 'expected',
          verificationStatus: 'valid',
          createdAt: new Date(pass.createdAt || Date.now()).toLocaleDateString(),
          gateName: 'Gate #1 Main Entrance',
          gateOfficer: 'Officer Ramesh Shinde',
          notes: pass.purpose || 'Visit',
        };

        setVerificationResult({
          passcode: code,
          verificationStatus: 'valid',
          visitor: mappedGuardVisitor,
          message: 'Gate pass verified successfully!',
        });
      } else if (localResult.pass && !localResult.isValid) {
        const pass = localResult.pass;
        const mappedGuardVisitor: GuardVisitor = matchedVisitor || {
          id: pass.id,
          passcode: pass.passCode || code,
          name: pass.visitorName,
          phone: pass.visitorPhone,
          visitorType: (pass.category.toLowerCase() || 'guest') as any,
          visitorTypeLabel: `${pass.category} Visitor`,
          residentName: pass.residentName || 'Vikram Joshi',
          flatCode: pass.flatCode || 'Flat B-1204',
          tower: pass.towerName || 'Tower B',
          societyName: 'Green Valley Society',
          expectedDate: 'Today',
          expectedTimeSlot: 'Expired',
          status: pass.status === 'EXPIRED' ? 'expired' : 'cancelled',
          verificationStatus: pass.status === 'EXPIRED' ? 'expired' : 'cancelled',
          createdAt: new Date(pass.createdAt || Date.now()).toLocaleDateString(),
          gateName: 'Gate #1 Main Entrance',
          gateOfficer: 'Officer Ramesh Shinde',
          notes: pass.purpose || 'Visit',
        };

        setVerificationResult({
          passcode: code,
          verificationStatus: pass.status === 'EXPIRED' ? 'expired' : 'cancelled',
          visitor: mappedGuardVisitor,
          message: localResult.reason || 'Gate pass is invalid or expired.',
        });
      } else if (matchedVisitor) {
        setVerificationResult({
          passcode: code,
          verificationStatus: matchedVisitor.verificationStatus || 'valid',
          visitor: matchedVisitor,
          message: 'Gate pass verified successfully!',
        });
      } else {
        setVerificationResult({
          passcode: code,
          verificationStatus: 'invalid',
          message: `Passcode ${code} not recognised in system. Please verify the 4-digit code and try again.`,
        });
      }
    } catch (err) {
      setVerificationResult({
        passcode: code,
        verificationStatus: 'invalid',
        message: `Passcode ${code} not recognised in system. Please verify the code and try again.`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header & Mode Switcher */}
      <div className="section-heading-row" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <h3 className="section-title" style={{ fontSize: '1.125rem', margin: 0, color: 'var(--aarizo-navy, #083B56)' }}>
            Gate Pass Verification
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: '0.2rem 0 0' }}>
            Verify visitor entry passes quickly and securely.
          </p>
        </div>

        <div className="control-pill-toggle" style={{ background: '#e2e8f0', borderRadius: '12px', padding: '0.2rem' }}>
          <button
            type="button"
            className={`pill-btn ${activeTab === 'passcode' ? 'pill-active' : ''}`}
            onClick={() => setActiveTab('passcode')}
            style={{ borderRadius: '10px' }}
          >
            <KeyRound size={14} />
            <span>Passcode</span>
          </button>
          <button
            type="button"
            className={`pill-btn ${activeTab === 'qr' ? 'pill-active' : ''}`}
            onClick={() => setActiveTab('qr')}
            style={{ borderRadius: '10px' }}
          >
            <QrCode size={14} />
            <span>QR Scanner</span>
          </button>
        </div>
      </div>

      {/* Main Mode View */}
      {activeTab === 'qr' ? (
        <div className="scanner-viewport-card" style={{ padding: '1.5rem 1rem' }}>
          <div className="scanner-frame">
            <div className="scanner-line" />
            <QrCode size={52} style={{ color: '#83CBEA', opacity: 0.8 }} />
          </div>
          <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>
            QR Camera Scanner Active
          </h4>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1.25rem 0' }}>
            Position digital visitor pass QR code inside frame for instant gate verification
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-onboarding-primary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.8125rem', background: 'var(--aarizo-coral, #F06543)', border: 'none', borderRadius: '10px' }}
              onClick={() => {
                setActiveTab('passcode');
                setPasscodeInput('8492');
                handleVerifyPasscode('8492');
              }}
            >
              <span>Scan Quick Pass 8492 (Rahul)</span>
            </button>
            <button
              type="button"
              className="btn-onboarding-primary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.8125rem', background: '#083B56', border: 'none', borderRadius: '10px' }}
              onClick={() => {
                setActiveTab('passcode');
                setPasscodeInput('9102');
                handleVerifyPasscode('9102');
              }}
            >
              <span>Scan Quick Pass 9102 (Zomato)</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.04)',
          }}
        >
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--aarizo-navy, #083B56)', marginBottom: '0.75rem' }}>
            Enter 4-Digit Visitor Gate Passcode
          </label>

          {/* Fully Responsive Passcode Keypad Row - Never Overflows */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '0.625rem',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value.replace(/\D/g, ''))}
              placeholder="8492"
              autoFocus
              style={{
                flex: 1,
                minWidth: 0,
                background: '#F7FBFE',
                border: '2px solid var(--aarizo-navy, #083B56)',
                borderRadius: '12px',
                padding: '0.75rem 0.5rem',
                fontSize: '1.25rem',
                fontWeight: 900,
                letterSpacing: '0.3em',
                color: 'var(--aarizo-navy, #083B56)',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => handleVerifyPasscode()}
              disabled={isVerifying || !passcodeInput.trim()}
              style={{
                height: '50px',
                padding: '0 1.25rem',
                borderRadius: '12px',
                background: isVerifying || !passcodeInput.trim() ? '#cbd5e1' : 'var(--aarizo-coral, #F06543)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.875rem',
                border: 'none',
                cursor: isVerifying || !passcodeInput.trim() ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                flexShrink: 0,
                boxShadow: isVerifying || !passcodeInput.trim() ? 'none' : '0 2px 8px rgba(240, 101, 67, 0.25)',
              }}
            >
              {isVerifying ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Verify</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Truthful Quick Test Shortcuts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 700 }}>
              Quick Test:
            </span>
            <button
              type="button"
              onClick={() => {
                setPasscodeInput('8492');
                handleVerifyPasscode('8492');
              }}
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'var(--aarizo-coral, #F06543)',
                background: '#FFF5F2',
                border: '1px solid #FCD3C7',
                padding: '0.25rem 0.6rem',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              8492 (Rahul)
            </button>
            <button
              type="button"
              onClick={() => {
                setPasscodeInput('9102');
                handleVerifyPasscode('9102');
              }}
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#D97706',
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                padding: '0.25rem 0.6rem',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              9102 (Zomato)
            </button>
            <button
              type="button"
              onClick={() => {
                setPasscodeInput('3301');
                handleVerifyPasscode('3301');
              }}
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#DC2626',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                padding: '0.25rem 0.6rem',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              3301 (Expired)
            </button>
          </div>
        </div>
      )}

      {/* Structured Verification Result Card */}
      {verificationResult && (
        <div
          style={{
            background:
              verificationResult.verificationStatus === 'valid'
                ? '#ECFDF5'
                : verificationResult.verificationStatus === 'expired' || verificationResult.verificationStatus === 'cancelled'
                ? '#FFFBEB'
                : '#FEF2F2',
            border: `1.5px solid ${
              verificationResult.verificationStatus === 'valid'
                ? '#6EE7B7'
                : verificationResult.verificationStatus === 'expired' || verificationResult.verificationStatus === 'cancelled'
                ? '#FDE68A'
                : '#FECACA'
            }`,
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            boxShadow: '0 4px 16px rgba(8, 59, 86, 0.06)',
          }}
        >
          {/* Status Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background:
                  verificationResult.verificationStatus === 'valid'
                    ? '#059669'
                    : verificationResult.verificationStatus === 'expired' || verificationResult.verificationStatus === 'cancelled'
                    ? '#D97706'
                    : '#DC2626',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {verificationResult.verificationStatus === 'valid' ? (
                <CheckCircle2 size={20} />
              ) : verificationResult.verificationStatus === 'expired' ? (
                <Clock size={20} />
              ) : (
                <AlertTriangle size={20} />
              )}
            </div>

            <div>
              <h4
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 900,
                  margin: 0,
                  color:
                    verificationResult.verificationStatus === 'valid'
                      ? '#065F46'
                      : verificationResult.verificationStatus === 'expired' || verificationResult.verificationStatus === 'cancelled'
                      ? '#92400E'
                      : '#991B1B',
                  letterSpacing: '0.02em',
                }}
              >
                {verificationResult.verificationStatus === 'valid'
                  ? '✓ PASS VERIFIED — ENTRY ALLOWED'
                  : verificationResult.verificationStatus === 'expired'
                  ? '⏰ GATE PASS EXPIRED'
                  : verificationResult.verificationStatus === 'cancelled'
                  ? '🚫 GATE PASS CANCELLED'
                  : '⚠ VERIFICATION FAILED'}
              </h4>
              <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0.15rem 0 0 0' }}>
                {verificationResult.message}
              </p>
            </div>
          </div>

          {/* Guard Data-Minimized Visitor Detail Card */}
          {verificationResult.visitor && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid var(--aarizo-border, #DCE8EF)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} color="var(--aarizo-navy, #083B56)" />
                  <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aarizo-text, #203746)' }}>
                    {verificationResult.visitor.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    background: 'var(--aarizo-light-blue, #EAF6FC)',
                    color: 'var(--aarizo-navy, #083B56)',
                    border: '1px solid var(--aarizo-border, #DCE8EF)',
                  }}
                >
                  {verificationResult.visitor.visitorTypeLabel || 'Visitor'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.78125rem', color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Home size={14} color="#657785" />
                  <span>Host: <strong>{verificationResult.visitor.residentName}</strong> ({verificationResult.visitor.flatCode})</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={14} color="#657785" />
                  <span>Purpose: <strong>{verificationResult.visitor.notes}</strong></span>
                </div>

                {verificationResult.visitor.vehicleNumber && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Car size={14} color="#657785" />
                    <span>Vehicle: <strong>{verificationResult.visitor.vehicleNumber}</strong></span>
                  </div>
                )}
              </div>

              {/* Action Button for Valid Passes */}
              {verificationResult.verificationStatus === 'valid' && (
                <button
                  type="button"
                  onClick={() => onSelectVisitor(verificationResult.visitor!)}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    background: 'var(--aarizo-coral, #F06543)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>Allow Entry / Complete Gate Check-In</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PassVerification;
