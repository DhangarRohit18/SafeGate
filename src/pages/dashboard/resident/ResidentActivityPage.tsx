import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  CreditCard,
  Wrench,
  Package,
  AlertCircle,
  Bell,
  Clock,
  Paperclip,
  Download,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { multiChannelNotificationService } from '../../../domains/notifications/services/multiChannelNotificationService';
import { realtimeService } from '../../../services/realtimeService';
import { AdvertisementPopup, OffersLauncherPill } from '../../../components/common/AdvertisementPopup';

const FILTERS = ['all', 'security', 'billing', 'maintenance', 'community', 'emergency'];

export const ResidentActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const userId = currentUser?.id || 'res-1';

  const rawFlat = (currentUser as any)?.flatNumber || (currentUser as any)?.flatDetails || 'B-1204';
  const computedFlatCode = rawFlat.startsWith('B-') ? rawFlat : `B-${rawFlat}`;

  const [activeFilter, setActiveFilter] = useState('all');
  const [activities, setActivities] = useState<any[]>([]);
  const [isOffersOpen, setIsOffersOpen] = useState(false);

  // Fallback rich sample activities if no notifications present
  const defaultActivities = [
    {
      id: 'act-sample-1',
      title: 'Visitor Entry Approved: Delivery Partner',
      message: 'Zomato food delivery partner (Rahul Sharma) verified and cleared at Main Security Gate.',
      time: 'Today, 02:45 PM',
      icon: UserCheck,
      color: '#083B56',
      category: 'security',
      isCritical: false,
    },
    {
      id: 'act-sample-2',
      title: 'Maintenance Dues Receipt Issued',
      message: `Tax Receipt #INV-2026-09-${computedFlatCode} for ₹4,500 successfully generated and synced.`,
      time: 'Yesterday, 11:30 AM',
      icon: CreditCard,
      color: '#059669',
      category: 'billing',
      attachmentUrl: '#',
      attachmentName: 'Receipt-SEP-2026.pdf',
      isCritical: false,
    },
    {
      id: 'act-sample-3',
      title: 'Facility Maintenance Notice',
      message: 'Olympia Swimming Pool weekly chlorine filtration & deep cleaning scheduled for tomorrow morning.',
      time: '04 Oct 2026, 09:15 AM',
      icon: Wrench,
      color: '#F06543',
      category: 'maintenance',
      isCritical: false,
    },
    {
      id: 'act-sample-4',
      title: 'Annual General Body Meeting (AGM 2026)',
      message: 'Managing Committee requested attendance of all flat owners in Grand Central Clubhouse on Sunday at 10:00 AM.',
      time: '28 Sept 2026, 04:00 PM',
      icon: Bell,
      color: '#083B56',
      category: 'community',
      isCritical: false,
    },
  ];

  const loadActivities = () => {
    const notifs = multiChannelNotificationService.getNotificationsForUser(userId);
    if (notifs && notifs.length > 0) {
      const mapped = notifs.map((n) => {
        let icon = Bell;
        let color = '#083B56';
        const cat = (n.category || 'COMMUNITY').toUpperCase();

        if (cat === 'SECURITY' || n.eventType === 'VISITOR_ARRIVAL') {
          icon = UserCheck;
          color = '#083B56';
        } else if (cat === 'BILLING' || n.eventType === 'PAYMENT_DUE') {
          icon = CreditCard;
          color = '#059669';
        } else if (cat === 'MAINTENANCE' || n.eventType === 'COMPLAINT_UPDATE') {
          icon = Wrench;
          color = '#F06543';
        } else if (cat === 'EMERGENCY' || n.isCritical) {
          icon = AlertCircle;
          color = '#DC2626';
        } else if (n.eventType === 'PARCEL_ARRIVAL') {
          icon = Package;
          color = '#7C3AED';
        }

        return {
          id: n.id,
          text: n.message ? `${n.title}: ${n.message}` : n.title,
          title: n.title,
          message: n.message,
          time: new Date(n.createdAt).toLocaleString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            month: 'short',
            day: 'numeric',
          }),
          icon,
          color,
          category: (n.category || 'community').toLowerCase(),
          attachmentUrl: n.attachmentUrl,
          attachmentName: n.attachmentName,
          isCritical: n.isCritical,
        };
      });

      setActivities(mapped);
    } else {
      setActivities(defaultActivities);
    }
  };

  useEffect(() => {
    loadActivities();
    const unsub = realtimeService.subscribe('*', () => {
      loadActivities();
    });
    return () => unsub();
  }, [userId]);

  const filtered = activeFilter === 'all'
    ? activities
    : activities.filter((a) => a.category === activeFilter);

  return (
    <div style={{ background: '#F7FBFE', minHeight: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-44 space-y-4">
        
        {/* Header Card (Exact Light Coral & Navy Design System) */}
        <div
          style={{
            background: 'var(--aarizo-card-bg, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
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
              <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em' }}>
                Activity Feed &amp; Society Logs
              </h1>
              <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
                Green Valley Society · All recent events, visitors, payments &amp; maintenance in Flat {computedFlatCode}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #DCE8EF',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#083B56',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Building2 size={14} style={{ color: '#0284C7' }} />
              <span>Flat {computedFlatCode}</span>
            </div>
          </div>
        </div>

        {/* Coral Filter Pills Track */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((f) => {
            const isActive = activeFilter === f;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '12px',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                  background: isActive ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
                  color: isActive ? '#ffffff' : '#083B56',
                  border: isActive ? '1px solid #F06543' : '1px solid #DCE8EF',
                  boxShadow: isActive ? '0 2px 8px rgba(240, 101, 67, 0.25)' : 'none',
                }}
              >
                <span>{f === 'all' ? 'All Activity' : f}</span>
              </button>
            );
          })}
        </div>

        {/* Activity List Section */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3.5rem 1rem',
                background: '#ffffff',
              }}
            >
              <Bell size={36} style={{ marginBottom: '0.5rem', color: '#F06543', opacity: 0.7 }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 800, color: '#083B56', margin: 0 }}>
                No activity records found in this category
              </p>
              <p style={{ fontSize: '0.75rem', color: '#657785', margin: '0.25rem 0 0' }}>
                All visitor entries, payment receipts, and maintenance alerts will appear here in real time.
              </p>
            </div>
          ) : (
            <div>
              {filtered.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.875rem',
                      padding: '1rem 1.25rem',
                      borderBottom: index < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        background: `${item.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <Icon size={18} style={{ color: item.color }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <h4 style={{ fontSize: '0.875rem', color: '#083B56', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
                          {item.title || item.text}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            background: '#F8FAFC',
                            color: '#083B56',
                            border: '1px solid #DCE8EF',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.category}
                        </span>
                      </div>

                      {item.message && (
                        <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.35rem 0 0', lineHeight: 1.4 }}>
                          {item.message}
                        </p>
                      )}

                      {item.attachmentUrl && (
                        <div style={{ marginTop: '0.4rem' }}>
                          <a
                            href={item.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '8px',
                              background: '#EAF6FC',
                              color: '#083B56',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              textDecoration: 'none',
                              border: '1px solid #DCE8EF',
                            }}
                          >
                            <Paperclip size={13} style={{ color: '#F06543' }} />
                            <span>{item.attachmentName || 'View Document'}</span>
                            <Download size={12} style={{ color: '#083B56' }} />
                          </a>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem' }}>
                        <Clock size={12} style={{ color: '#657785' }} />
                        <span style={{ fontSize: '0.72rem', color: '#657785', fontWeight: 600 }}>
                          {item.time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Offers Pill Launcher & Popup */}
      <OffersLauncherPill onOpen={() => setIsOffersOpen(true)} />
      <AdvertisementPopup
        forceOpen={isOffersOpen}
        onClose={() => setIsOffersOpen(false)}
        societyId={currentUser?.societyId || 'soc-gvs'}
      />
    </div>
  );
};

export default ResidentActivityPage;
