import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePrototype } from '../../context/PrototypeContext';
import {
  UserCheck,
  Car,
  CreditCard,
  MessageSquare,
  Package,
  ShieldAlert,
  ChevronRight,
  Droplets,
  Shield,
  Trash2,
  Sparkles,
  Zap,
  Clock,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  X,
} from 'lucide-react';
import { ResidentParcelWidget } from '../../domains/deliveries/components/ResidentParcelWidget';
import { Skeleton, EmptyState, ErrorState } from '../common';
import { apiClient } from '../../services/apiClient';
import { AdvertisementPopup, OffersLauncherPill } from '../common/AdvertisementPopup';

const QUICK_ACTIONS = [
  { id: 'visitors', label: 'Visitors', icon: UserCheck, path: '/resident/visitors', color: '#176B91', bg: '#EAF6FC' },
  { id: 'parking', label: 'Parking', icon: Car, path: '/resident/parking', color: '#176B91', bg: '#EAF6FC' },
  { id: 'pay', label: 'Pay', icon: CreditCard, path: '/resident/billing', color: '#176B91', bg: '#EAF6FC' },
  { id: 'complaint', label: 'Complaint', icon: MessageSquare, path: '/resident/requests', color: '#176B91', bg: '#EAF6FC' },
  { id: 'parcel', label: 'Parcel', icon: Package, path: '/resident/visitors', color: '#176B91', bg: '#EAF6FC' },
  { id: 'sos', label: 'SOS', icon: ShieldAlert, path: '/resident/emergency', color: '#D9535B', bg: '#FFF0F1' },
];

const SOCIETY_STATUS = [
  { label: 'Water', icon: Droplets, status: 'normal', statusText: 'Normal' },
  { label: 'Security', icon: Shield, status: 'good', statusText: 'Active' },
  { label: 'Garbage', icon: Trash2, status: 'normal', statusText: 'On time' },
  { label: 'Cleaning', icon: Sparkles, status: 'good', statusText: 'Done' },
  { label: 'Power', icon: Zap, status: 'warning', statusText: 'Outage at B2' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  good: { bg: '#EDF8F0', text: '#3F8F58', dot: '#3F8F58' },
  normal: { bg: '#EAF6FC', text: '#176B91', dot: '#83CBEA' },
  warning: { bg: '#FFF8E8', text: '#D99A2B', dot: '#D99A2B' },
  alert: { bg: '#FFF0F1', text: '#D9535B', dot: '#D9535B' },
};

const PENDING_ACTIONS = [
  { id: 1, label: 'Parcel pickup at gate', type: 'parcel', path: '/resident/visitors', urgent: true },
  { id: 2, label: 'Maintenance bill due in 3 days', type: 'payment', path: '/resident/billing', urgent: false },
  { id: 3, label: 'Gym booking approval pending', type: 'request', path: '/resident/amenities', urgent: false },
];

const RECENT_ACTIVITY = [
  { id: 1, text: 'Rajesh Singh checked in — Visitor pass used', time: '2 min ago', icon: UserCheck, color: '#176B91' },
  { id: 2, text: 'Water tank cleaned — Maintenance complete', time: '1 hr ago', icon: CheckCircle2, color: '#3F8F58' },
  { id: 3, text: 'Notice: Society AGM on 25 Sep at 6PM', time: '3 hrs ago', icon: AlertCircle, color: '#D99A2B' },
  { id: 4, text: 'Monthly levy auto-paid ₹2,400', time: 'Yesterday', icon: CreditCard, color: '#176B91' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const ResidentHome: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { uiState } = usePrototype();
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [urgentAlert, setUrgentAlert] = useState<{ title: string; message: string } | null>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);

  React.useEffect(() => {
    apiClient.getAnnouncements().then((res) => {
      if (res && res.length > 0) {
        setAnnouncements(res);
        const urgent = res.find((a: any) => a.isUrgent);
        if (urgent) {
          setUrgentAlert({ title: urgent.title, message: urgent.content });
        }
      }
    });
  }, []);

  if (uiState === 'loading') {
    return (
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Skeleton height="60px" width="100%" />
        <Skeleton height="120px" width="100%" borderRadius="1rem" />
        <Skeleton height="160px" width="100%" borderRadius="1rem" />
      </div>
    );
  }

  if (uiState === 'empty') {
    return (
      <div style={{ padding: '1.5rem' }}>
        <EmptyState
          title="All Clear Today"
          description="No expected visitors, no pending dues, no open tickets."
          actionLabel="Pre-approve a Guest"
          onAction={() => navigate('/resident/visitors')}
        />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div style={{ padding: '1.5rem' }}>
        <ErrorState
          title="Could Not Load Feed"
          message="A connection error occurred. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const firstName = currentUser?.name?.split(' ')[0] || 'Resident';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', backgroundColor: 'var(--aarizo-page, #F7FBFE)', minHeight: '100%' }}>
      {/* ── Greeting Banner in Pale Sky Blue (#EAF6FC) ── */}
      <div
        style={{
          background: 'var(--aarizo-light-blue, #EAF6FC)',
          borderBottom: '1px solid var(--aarizo-border, #DCE8EF)',
          padding: '1.25rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <p style={{ color: 'var(--aarizo-text-secondary, #657785)', fontSize: '0.75rem', margin: 0, fontWeight: 500 }}>
            {getGreeting()},
          </p>
          <h1 style={{ color: 'var(--aarizo-navy, #083B56)', fontWeight: 800, fontSize: '1.375rem', lineHeight: 1.2, margin: '0.125rem 0 0.25rem' }}>
            {firstName}
          </h1>
          <p style={{ color: 'var(--aarizo-text-muted, #8B9AA5)', fontSize: '0.6875rem', margin: 0 }}>
            {currentUser?.flatDetails || 'Tower B · Flat 301 · Green Valley'}
          </p>
        </div>

        {/* Sponsored Offers Quick-Pill */}
        <OffersLauncherPill onOpen={() => setShowOffersModal(true)} />
      </div>

      {/* ── Urgent Alert ── */}
      {urgentAlert && !alertDismissed && (
        <div
          style={{
            margin: '0.75rem 1rem 0',
            background: 'var(--aarizo-warning-bg, #FFF8E8)',
            border: '1px solid #fce3b8',
            borderLeft: '4px solid var(--aarizo-warning, #D99A2B)',
            borderRadius: '16px',
            padding: '0.875rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.625rem',
          }}
        >
          <AlertCircle size={18} style={{ color: 'var(--aarizo-warning, #D99A2B)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--aarizo-navy, #083B56)' }}>
              {urgentAlert.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', marginTop: '0.125rem' }}>
              {urgentAlert.message}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAlertDismissed(true)}
            style={{ color: 'var(--aarizo-text-muted, #8B9AA5)', background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer' }}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Content area */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* ── Quick Actions Grid (Screenshot matched) ── */}
        <section>
          <h2 style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--aarizo-navy, #083B56)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.625rem' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: '0.625rem' }}>
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const isSOS = action.id === 'sos';
              return (
                <button
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1rem 0.5rem',
                    borderRadius: '16px',
                    background: '#ffffff',
                    border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                    cursor: 'pointer',
                    minHeight: 88,
                    boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
                  }}
                  aria-label={action.label}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '12px',
                      background: action.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} style={{ color: action.color }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSOS ? 'var(--aarizo-danger, #D9535B)' : 'var(--aarizo-text, #203746)' }}>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Live Society Status ── */}
        <section>
          <h2 style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--aarizo-navy, #083B56)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.625rem' }}>
            Society Status
          </h2>
          <div className="scroll-x" style={{ paddingBottom: '0.25rem' }}>
            {SOCIETY_STATUS.map((item) => {
              const Icon = item.icon;
              const colors = STATUS_COLORS[item.status];
              return (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.75rem 0.875rem',
                    borderRadius: '14px',
                    background: '#ffffff',
                    border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                    minWidth: 88,
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
                  }}
                >
                  <Icon size={20} style={{ color: colors.text }} />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--aarizo-text-secondary, #657785)' }}>{item.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.625rem', color: colors.text, fontWeight: 700 }}>{item.statusText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Live Parcel Widget ── */}
        <ResidentParcelWidget />

        {/* ── Pending Actions ── */}
        {PENDING_ACTIONS.length > 0 && (
          <section>
            <h2 style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--aarizo-navy, #083B56)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.625rem' }}>
              Action Required
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {PENDING_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    borderRadius: '16px',
                    background: '#ffffff',
                    border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    minHeight: 52,
                    boxShadow: '0 2px 6px rgba(8, 59, 86, 0.04)',
                  }}
                  aria-label={action.label}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: action.urgent ? 'var(--aarizo-warning, #D99A2B)' : 'var(--aarizo-blue, #176B91)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.84375rem', fontWeight: 600, color: 'var(--aarizo-text, #203746)' }}>
                    {action.label}
                  </span>
                  <ChevronRight size={16} style={{ color: 'var(--aarizo-text-muted, #8B9AA5)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Responsive 2-Col Grid for Activity & Announcements on Desktop ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {/* ── Recent Activity ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--aarizo-navy, #083B56)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Recent Activity
              </h2>
              <button
                onClick={() => navigate('/resident/activity')}
                style={{ fontSize: '0.75rem', color: 'var(--aarizo-blue, #176B91)', fontWeight: 700, background: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                See all <ChevronRight size={12} />
              </button>
            </div>
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
              }}
            >
              {RECENT_ACTIVITY.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.875rem 1rem',
                      borderBottom: index < RECENT_ACTIVITY.length - 1 ? '1px solid var(--aarizo-border-soft, #E8F1F5)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: 'var(--aarizo-light-blue, #EAF6FC)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} style={{ color: item.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--aarizo-text, #203746)', lineHeight: 1.4, margin: 0, fontWeight: 600 }}>{item.text}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <Clock size={11} style={{ color: 'var(--aarizo-text-muted, #8B9AA5)' }} />
                        <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-muted, #8B9AA5)' }}>{item.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Society Announcements ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--aarizo-navy, #083B56)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Announcements
              </h2>
              <button onClick={() => navigate('/resident/community')} style={{ fontSize: '0.75rem', color: 'var(--aarizo-blue, #176B91)', fontWeight: 700, background: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                See all <ChevronRight size={12} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {announcements.slice(0, 3).map((ann, i) => (
                <div
                  key={ann.id || i}
                  style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid var(--aarizo-border-soft, #E8F1F5)', padding: '0.875rem 1rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <TrendingUp size={16} style={{ color: 'var(--aarizo-blue, #176B91)', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.84375rem', color: 'var(--aarizo-navy, #083B56)', marginBottom: '0.25rem' }}>
                        {ann.title}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, lineHeight: 1.4 }}>
                        {ann.content || ann.summary}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── Advertisement & Sponsored Offers Pop-up ── */}
      <AdvertisementPopup
        societyId={currentUser?.societyId || 'soc-gvs'}
        forceOpen={showOffersModal}
        onClose={() => setShowOffersModal(false)}
      />
    </div>
  );
};

export default ResidentHome;
