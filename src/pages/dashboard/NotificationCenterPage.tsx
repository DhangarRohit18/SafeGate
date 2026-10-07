import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Info, X, Radio, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { realtimeService } from '../../services/realtimeService';
import { NotificationEngineHub } from '../../domains/notifications';
import { apiClient } from '../../services/apiClient';

interface NotificationItem {
  id: string;
  type: 'complaint' | 'general';
  title: string;
  description: string;
  date: string;
  category: string;
  read: boolean;
}

export const NotificationCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [viewMode, setViewMode] = useState<'ALERTS' | 'ENGINE_HUB'>('ALERTS');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    // Load live notifications from PostgreSQL
    apiClient.getNotifications()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          const live: NotificationItem[] = list.map((n: any) => ({
            id: n.id,
            type: n.channel === 'EMERGENCY' ? 'complaint' : 'general',
            title: n.title,
            description: n.message,
            date: new Date(n.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' }),
            category: n.category || 'General',
            read: n.isRead ?? false,
          }));
          setNotifications(live);
        }
      })
      .catch((err) => console.warn('[Notifications] Live load failed:', err));

    const unsub = realtimeService.subscribe('*', (msg) => {
      let title = 'Realtime Notification';
      let description = '';
      let type: 'complaint' | 'general' = 'general';

      switch (msg.topic) {
        case 'VISITOR_ARRIVAL':
          title = 'Visitor Pass Created';
          description = `${msg.payload.visitorName} (${msg.payload.category || 'GUEST'}) scheduled for ${msg.payload.flatCode || 'society'}`;
          break;
        case 'VISITOR_ENTRY':
          title = 'Visitor Gate Check-In';
          description = `${msg.payload.visitorName} entered at ${msg.payload.gateName || 'Main Gate'} (${msg.payload.flatCode || ''})`;
          break;
        case 'VISITOR_EXIT':
          title = 'Visitor Gate Check-Out';
          description = `${msg.payload.visitorName} checked out of society (${msg.payload.flatCode || ''})`;
          break;
        case 'EMERGENCY_ALERTS':
          title = '🚨 Society Emergency Alert';
          description = msg.payload.alertType === 'GATE_LOCKDOWN'
            ? `Security Lockdown: ${msg.payload.reason}`
            : `SOS Alert: ${msg.payload.type || 'Incident'} at ${msg.payload.flatNumber || msg.payload.locationDetails || 'Society'}`;
          type = 'complaint';
          break;
        case 'WORKER_ENTRY_EXIT':
          title = `Staff Gate ${msg.payload.action === 'IN' ? 'Entry' : 'Exit'}`;
          description = `${msg.payload.workerName} (${msg.payload.workerType}) recorded ${msg.payload.action === 'IN' ? 'Entry' : 'Exit'} at ${msg.payload.timestamp || 'gate'}`;
          break;
        case 'PARKING_OCCUPANCY':
          title = `Parking Slot ${msg.payload.action === 'ENTRY' ? 'Occupied' : 'Vacated'}`;
          description = `Slot ${msg.payload.slotNumber} marked ${msg.payload.occupancyState} by vehicle ${msg.payload.vehicleNumber}`;
          break;
        case 'DELIVERY_STATUS':
          title = 'Delivery Parcel Picked Up';
          description = `Delivery for ${msg.payload.recipient} (${msg.payload.flatCode}) picked up`;
          break;
        default:
          title = `Alert: ${msg.topic}`;
          description = JSON.stringify(msg.payload);
      }

      const newNotif: NotificationItem = {
        id: msg.id || `rt-${Date.now()}`,
        type,
        title,
        description,
        date: 'Just now',
        category: type === 'complaint' ? 'Emergency' : 'Security',
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => unsub();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = notifications.filter((n) => (filter === 'UNREAD' ? !n.read : true));

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    apiClient.markNotificationRead(id).catch(() => {});
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* ── Subheader Bar ── */}
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
              Notifications
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                {unreadCount} unread
              </span>
            </h1>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Real-time push, in-app alerts, WhatsApp &amp; emergency logs
            </p>
          </div>
        </div>

        {/* Mode Switcher Group */}
        <div
          style={{
            background: 'var(--aarizo-card-blue, #F4FAFE)',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            borderRadius: '12px',
            padding: '0.25rem',
            display: 'flex',
            gap: '0.25rem',
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('ALERTS')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'ALERTS' ? 'var(--aarizo-coral, #F06543)' : 'transparent',
              color: viewMode === 'ALERTS' ? '#ffffff' : 'var(--aarizo-navy, #083B56)',
              fontWeight: viewMode === 'ALERTS' ? 800 : 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: viewMode === 'ALERTS' ? '0 2px 8px rgba(240, 101, 67, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Bell size={13} /> Alerts Feed
          </button>
          <button
            type="button"
            onClick={() => setViewMode('ENGINE_HUB')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'ENGINE_HUB' ? 'var(--aarizo-coral, #F06543)' : 'transparent',
              color: viewMode === 'ENGINE_HUB' ? '#ffffff' : 'var(--aarizo-navy, #083B56)',
              fontWeight: viewMode === 'ENGINE_HUB' ? 800 : 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: viewMode === 'ENGINE_HUB' ? '0 2px 8px rgba(240, 101, 67, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Radio size={13} /> Real-Time Engine Hub
          </button>
        </div>
      </div>

      {viewMode === 'ENGINE_HUB' ? (
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-4">
          <NotificationEngineHub />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto w-full px-3 sm:px-4 space-y-4">
          {/* ── Filter Pills Container (Segmented Control) ── */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '16px',
              padding: '0.35rem',
              display: 'inline-flex',
              gap: '0.35rem',
              boxShadow: '0 2px 6px rgba(8, 59, 86, 0.03)',
            }}
          >
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              style={{
                padding: '0.5rem 1.125rem',
                borderRadius: '12px',
                border: 'none',
                background: filter === 'ALL' ? 'var(--aarizo-coral, #F06543)' : 'transparent',
                color: filter === 'ALL' ? '#ffffff' : 'var(--aarizo-navy, #083B56)',
                fontWeight: filter === 'ALL' ? 800 : 700,
                fontSize: '0.78125rem',
                cursor: 'pointer',
                boxShadow: filter === 'ALL' ? '0 3px 10px rgba(240, 101, 67, 0.28)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              All Notifications
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              style={{
                padding: '0.5rem 1.125rem',
                borderRadius: '12px',
                border: 'none',
                background: filter === 'UNREAD' ? 'var(--aarizo-coral, #F06543)' : 'transparent',
                color: filter === 'UNREAD' ? '#ffffff' : 'var(--aarizo-navy, #083B56)',
                fontWeight: filter === 'UNREAD' ? 800 : 700,
                fontSize: '0.78125rem',
                cursor: 'pointer',
                boxShadow: filter === 'UNREAD' ? '0 3px 10px rgba(240, 101, 67, 0.28)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* ── Notification List Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filtered.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #DCE8EF',
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  color: '#657785',
                }}
              >
                <Bell size={36} style={{ margin: '0 auto 0.5rem auto', color: '#083B56', opacity: 0.4 }} />
                <div style={{ fontWeight: 800, color: '#083B56', fontSize: '0.9375rem' }}>No notifications found</div>
                <div style={{ fontSize: '0.75rem', marginTop: 4 }}>You are all caught up with your society alerts.</div>
              </div>
            ) : (
              filtered.map((item) => {
                const isComplaint = item.type === 'complaint';
                const iconBg = isComplaint ? '#FEF2F2' : '#F4FAFE';
                const iconColor = isComplaint ? '#DC2626' : '#083B56';
                const badgeBg = isComplaint ? '#FEF2F2' : '#EAF6FC';
                const badgeColor = isComplaint ? '#DC2626' : '#083B56';
                const badgeBorder = isComplaint ? '#FECACA' : '#DCE8EF';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #DCE8EF',
                      padding: '1rem 1.125rem',
                      boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.875rem',
                      position: 'relative',
                    }}
                  >
                    {/* Circular status icon */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: iconBg,
                        border: `1px solid ${badgeBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: iconColor,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {isComplaint ? <AlertCircle size={18} /> : <Info size={18} />}
                    </div>

                    {/* Text content */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#083B56', margin: 0 }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: '#657785', margin: '0.25rem 0 0.5rem', lineHeight: 1.45 }}>
                        {item.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            color: badgeColor,
                            background: badgeBg,
                            border: `1px solid ${badgeBorder}`,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '12px',
                          }}
                        >
                          {item.category}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#657785', fontFamily: 'monospace' }}>
                          {item.date}
                        </span>
                      </div>
                    </div>

                    {/* Dismiss button */}
                    <button
                      type="button"
                      onClick={() => handleDismiss(item.id)}
                      aria-label="Dismiss Notification"
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenterPage;
