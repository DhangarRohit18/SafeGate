import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { isNativeApp, registerGlobalBackHandler } from '../../../utils/nativeMobile';
import { App } from '@capacitor/app';
import {
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Home,
  Building2,
  UserCheck,
  Wrench,
  Store,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Smartphone,
} from 'lucide-react';
import { MOCK_USERS } from '../../../mockData/auth/mockUsers';
import type { UserRole } from '../../../domains/auth/types';
import '../auth.css';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    phoneNumber,
    setPhoneNumber,
    verifyOtp,
    loginAsRole,
    error,
    setError,
  } = useAuth();

  const [password, setPassword] = useState<string>('safegate@2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [otpInput, setOtpInput] = useState<string>('');
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>('resident');

  // Prevent back navigation on Android when on Login screen -> Exit App safely
  useEffect(() => {
    if (isNativeApp()) {
      const handleBack = registerGlobalBackHandler(() => {
        App.exitApp();
        return true;
      });
      return () => handleBack();
    }
  }, []);

  const executeLogin = (role: UserRole) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    setTimeout(() => {
      loginAsRole(role);
      setLoading(false);

      if (role === 'secretary') navigate('/admin', { replace: true });
      else if (role === 'guard') navigate('/security', { replace: true });
      else if (role === 'committee') navigate('/committee', { replace: true });
      else if (role === 'facility_manager') navigate('/facility', { replace: true });
      else if (role === 'vendor') navigate('/vendor', { replace: true });
      else if (role === 'admin') navigate('/super-admin', { replace: true });
      else navigate('/resident', { replace: true });
    }, 450);
  };

  const handleRoleSelect = (role: UserRole) => {
    setActiveRole(role);
    setPhoneNumber(MOCK_USERS[role]?.phone || '9876543210');
    setError(null);
  };

  const handleRoleCardClick = (role: UserRole) => {
    handleRoleSelect(role);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter a valid mobile number or email.');
      return;
    }
    executeLogin(activeRole);
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (otpInput === '4092' || otpInput === '1234' || otpInput.length >= 4) {
        setShowOtpModal(false);
        executeLogin(activeRole);
        return;
      }
      await verifyOtp(otpInput);
      executeLogin(activeRole);
    } catch {
      setShowOtpModal(false);
      executeLogin(activeRole);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-container"
      style={{
        minHeight: '100dvh',
        background: '#FAF6F0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding:
          'calc(1.5rem + env(safe-area-inset-top, 0px)) 1.25rem calc(1.5rem + env(safe-area-inset-bottom, 0px))',
        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <div id="recaptcha-container" />

      {/* Main Form Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* ── Brand Header ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          {/* Logo Badge */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '16px',
              background: '#083B56',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(8, 59, 86, 0.25)',
              marginBottom: '0.75rem',
            }}
          >
            <ShieldCheck size={30} strokeWidth={2.2} />
          </div>

          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              color: '#083B56',
              letterSpacing: '-0.02em',
              margin: '0 0 0.25rem 0',
              lineHeight: 1.2,
            }}
          >
            Sign In to Safegate
          </h1>

          <p
            style={{
              fontSize: '0.84375rem',
              color: '#657785',
              margin: 0,
              fontWeight: 500,
            }}
          >
            Secure Communities, Connected Living
          </p>
        </div>

        {/* ── Inline Error Alert Banner ── */}
        {error && (
          <div
            style={{
              width: '100%',
              background: '#FFF0F1',
              border: '1px solid #FBC5C8',
              color: '#D9535B',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxSizing: 'border-box',
              animation: 'onboardingSlideIn 0.2s ease forwards',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Role Selection Card ── */}
        <div
          style={{
            width: '100%',
            background: '#ffffff',
            border: '1px solid #E5E9EC',
            borderRadius: '20px',
            padding: '1.25rem',
            boxShadow: '0 8px 28px rgba(8, 59, 86, 0.06)',
            marginBottom: '1.25rem',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#657785',
              }}
            >
              Portal Role
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#F06543',
                background: '#FFF0EC',
                padding: '0.2rem 0.6rem',
                borderRadius: '8px',
                border: '1px solid #FDE3DC',
              }}
            >
              {MOCK_USERS[activeRole]?.roleLabel || activeRole}
            </span>
          </div>

          {/* Primary 3 Roles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            {[
              { role: 'resident' as UserRole, label: 'Resident', icon: Home, desc: 'Home Portal' },
              { role: 'secretary' as UserRole, label: 'Secretary', icon: Building2, desc: 'Admin Ops' },
              { role: 'guard' as UserRole, label: 'Guard', icon: ShieldCheck, desc: 'Gate Control' },
            ].map((item) => {
              const isSelected = activeRole === item.role;
              return (
                <button
                  type="button"
                  key={item.role}
                  onClick={() => handleRoleCardClick(item.role)}
                  style={{
                    background: isSelected ? '#FFF0EC' : '#F8FAFC',
                    border: isSelected ? '1.5px solid #F06543' : '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '0.625rem 0.35rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(240, 101, 67, 0.15)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '10px',
                      background: isSelected ? '#F06543' : '#EAF6FC',
                      color: isSelected ? '#ffffff' : '#083B56',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.35rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <item.icon size={16} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.78125rem',
                      fontWeight: 800,
                      color: isSelected ? '#F06543' : '#083B56',
                      lineHeight: 1.1,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      color: '#657785',
                      marginTop: '0.15rem',
                    }}
                  >
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary Roles Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
            {[
              { role: 'admin' as UserRole, label: 'Admin', icon: KeyRound },
              { role: 'committee' as UserRole, label: 'Committee', icon: UserCheck },
              { role: 'facility_manager' as UserRole, label: 'Facility', icon: Wrench },
              { role: 'vendor' as UserRole, label: 'Vendor', icon: Store },
            ].map((item) => {
              const isSelected = activeRole === item.role;
              return (
                <button
                  type="button"
                  key={item.role}
                  onClick={() => handleRoleCardClick(item.role)}
                  style={{
                    background: isSelected ? '#083B56' : '#F8FAFC',
                    color: isSelected ? '#ffffff' : '#657785',
                    border: isSelected ? '1px solid #083B56' : '1px solid #E2E8F0',
                    padding: '0.45rem 0.25rem',
                    borderRadius: '10px',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <item.icon size={12} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Login Input Form ── */}
        <form
          onSubmit={handleFormSubmit}
          style={{
            width: '100%',
            background: '#ffffff',
            border: '1px solid #E5E9EC',
            borderRadius: '20px',
            padding: '1.25rem',
            boxShadow: '0 8px 28px rgba(8, 59, 86, 0.06)',
            boxSizing: 'border-box',
          }}
        >
          {/* Mobile / Email Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                fontSize: '0.78125rem',
                fontWeight: 800,
                color: '#083B56',
                marginBottom: '0.4rem',
                display: 'block',
              }}
            >
              Mobile Number or Email
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'border-color 0.2s ease',
              }}
            >
              <div
                style={{
                  padding: '0.75rem 0.875rem',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  color: '#083B56',
                  background: '#EAF6FC',
                  borderRight: '1px solid #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Smartphone size={14} />
                <span>+91</span>
              </div>
              <input
                type="text"
                placeholder="Enter mobile number"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (error) setError(null);
                }}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: '0.75rem 0.875rem',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#083B56',
                  width: '100%',
                }}
              />
            </div>
          </div>

          {/* Password Field with Toggle */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.4rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.78125rem',
                  fontWeight: 800,
                  color: '#083B56',
                }}
              >
                Password
              </label>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#F06543',
                  cursor: 'pointer',
                }}
                onClick={() => setShowOtpModal(true)}
              >
                Use Demo OTP (4092)
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                padding: '0 0.875rem',
                transition: 'border-color 0.2s ease',
              }}
            >
              <Lock size={16} color="#657785" style={{ flexShrink: 0 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: '0.75rem 0.625rem',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#083B56',
                  width: '100%',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#657785',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.25rem',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Primary Coral CTA Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '50px',
              borderRadius: '14px',
              background: '#F06543',
              color: '#ffffff',
              fontSize: '0.9375rem',
              fontWeight: 800,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 18px rgba(240, 101, 67, 0.35)',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.85 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In as {MOCK_USERS[activeRole]?.roleLabel || activeRole}</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        {/* Security & Access Trust Note */}
        <div
          style={{
            marginTop: '1.25rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#657785',
            }}
          >
            <ShieldCheck size={14} color="#F06543" />
            <span>Encrypted Gate &amp; Society Access Control</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#657785', margin: 0 }}>
            Need flat credentials?{' '}
            <span
              style={{ color: '#F06543', fontWeight: 800, cursor: 'pointer' }}
              onClick={() => executeLogin('secretary')}
            >
              Contact Secretary
            </span>
          </p>
        </div>
      </div>

      {/* Demo OTP Modal */}
      {showOtpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 59, 86, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.75rem 1.5rem',
              maxWidth: '360px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 45px rgba(8, 59, 86, 0.25)',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '14px',
                background: '#FFF0EC',
                color: '#F06543',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <Lock size={22} />
            </div>

            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: '#083B56',
                margin: '0 0 0.35rem 0',
              }}
            >
              Mobile OTP Verification
            </h3>
            <p
              style={{
                fontSize: '0.8125rem',
                color: '#657785',
                margin: '0 0 1.25rem 0',
                lineHeight: 1.4,
              }}
            >
              Enter verification code sent to +91 {phoneNumber || '9876543210'}
            </p>

            <form onSubmit={handleOtpVerify}>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="4092"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  letterSpacing: '0.3em',
                  padding: '0.625rem',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  outline: 'none',
                  marginBottom: '1rem',
                  color: '#083B56',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  borderRadius: '12px',
                  background: '#F06543',
                  color: '#ffffff',
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Verify &amp; Proceed</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
