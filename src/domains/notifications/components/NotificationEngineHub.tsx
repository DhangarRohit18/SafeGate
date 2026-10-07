import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Smartphone,
  Mail,
  MessageSquare,
  ShieldAlert,
  Sliders,
  Send,
  RefreshCw,
  Radio,
  CheckCheck,
  AlertTriangle,
  Layers,
  Activity,
  Wifi,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Zap,
  X,
  Paperclip,
  Download,
} from 'lucide-react';
import { multiChannelNotificationService } from '../services/multiChannelNotificationService';
import type {
  NotificationChannel,
  NotificationItemWithLogs,
  NotificationPreference,
  NotificationEventType,
  NotificationCategory,
  DeliveryLog,
} from '../types/index';
import { useAuth } from '../../../context/AuthContext';
import { realTimeSync } from '../../../services/realTimeSync';
import { realtimeService } from '../../../services/realtimeService';
import { FileUpload } from '../../../components/ui/FileUpload';

// Synthesize pleasant real-time notification chime without external asset dependency
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.32);
  } catch {
    // Autoplay policy fallback
  }
}

export const NotificationEngineHub: React.FC = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || 'res-1';

  const [activeTab, setActiveTab] = useState<'INBOX' | 'PREFERENCES' | 'DELIVERY_LOGS' | 'DISPATCH_SIMULATOR'>('INBOX');
  const [notifications, setNotifications] = useState<NotificationItemWithLogs[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference>(() =>
    multiChannelNotificationService.getPreferences(userId)
  );

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedEventForLogs, setSelectedEventForLogs] = useState<NotificationItemWithLogs | null>(null);

  // Real-Time Engine State
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(8);
  const [messagesIngestedCount, setMessagesIngestedCount] = useState<number>(0);
  const [newlyArrivedIds, setNewlyArrivedIds] = useState<Set<string>>(new Set());
  const [recentLiveIngest, setRecentLiveIngest] = useState<{
    title: string;
    eventType: string;
    channels: string[];
    timestamp: string;
  } | null>(null);

  // Dispatch Simulator Form
  const [simulatorForm, setSimulatorForm] = useState({
    eventType: 'VISITOR_ARRIVAL' as NotificationEventType,
    category: 'SECURITY' as NotificationCategory,
    title: 'Guest Arrived at Gate 1',
    message: 'Visitor Vijay Malhotra (Intercom Verification) arrived for Flat B-402.',
    isCritical: false,
    phone: currentUser?.phone || '+91 98765 43210',
    email: 'resident@aarizo.com',
    attachmentUrl: '',
    attachmentName: '',
  });

  const loadData = () => {
    setNotifications(multiChannelNotificationService.getNotificationsForUser(userId));
    setPreferences(multiChannelNotificationService.getPreferences(userId));
  };

  useEffect(() => {
    loadData();
    const unsubscribeSync = realTimeSync.subscribe('NOTIFICATIONS_UPDATED', (payload: any) => {
      loadData();
      if (payload?.eventId) {
        setNewlyArrivedIds((prev) => new Set([...prev, payload.eventId]));
        setMessagesIngestedCount((c) => c + 1);
        setTimeout(() => {
          setNewlyArrivedIds((prev) => {
            const next = new Set(prev);
            next.delete(payload.eventId);
            return next;
          });
        }, 12000);
      }
    });

    const unsubscribeSSE = realtimeService.subscribe('*', (msg) => {
      loadData();
      setLatencyMs(4 + Math.floor(Math.random() * 4));
      if (msg.topic) {
        setMessagesIngestedCount((c) => c + 1);
      }
    });

    const latencyTimer = setInterval(() => {
      setLatencyMs(7 + Math.floor(Math.random() * 5));
    }, 4500);

    return () => {
      unsubscribeSync();
      unsubscribeSSE();
      clearInterval(latencyTimer);
    };
  }, [userId]);

  // Live Auto-Stream Timer: generates realistic society notifications in background
  useEffect(() => {
    if (!isLiveStreamActive) return;
    const streamTimer = setInterval(() => {
      multiChannelNotificationService.simulateLiveEvent(userId).then((notif) => {
        if (soundEnabled) playNotificationChime();
        setRecentLiveIngest({
          title: notif.title,
          eventType: notif.eventType,
          channels: notif.deliveryLogs.map((l) => l.channel),
          timestamp: new Date().toLocaleTimeString(),
        });
        setNewlyArrivedIds((prev) => new Set([...prev, notif.id]));
        setMessagesIngestedCount((c) => c + 1);
        loadData();
        setTimeout(() => {
          setNewlyArrivedIds((prev) => {
            const next = new Set(prev);
            next.delete(notif.id);
            return next;
          });
        }, 12000);
      });
    }, 12000);

    return () => clearInterval(streamTimer);
  }, [isLiveStreamActive, soundEnabled, userId]);

  const handleQuickSimulate = async () => {
    const notif = await multiChannelNotificationService.simulateLiveEvent(userId);
    if (soundEnabled) playNotificationChime();
    setRecentLiveIngest({
      title: notif.title,
      eventType: notif.eventType,
      channels: notif.deliveryLogs.map((l) => l.channel),
      timestamp: new Date().toLocaleTimeString(),
    });
    setNewlyArrivedIds((prev) => new Set([...prev, notif.id]));
    setMessagesIngestedCount((c) => c + 1);
    loadData();
  };

  const handleTogglePreference = (category: string, channel: NotificationChannel) => {
    const categoryObj = {
      ...(preferences.categories[category] || { inApp: true, push: true, whatsapp: true, sms: false, email: false }),
    };
    const key = (channel === 'IN_APP' ? 'inApp' : channel.toLowerCase()) as keyof typeof categoryObj;
    categoryObj[key] = !categoryObj[key];

    const updated: NotificationPreference = {
      ...preferences,
      categories: {
        ...preferences.categories,
        [category]: categoryObj,
      },
    };

    setPreferences(updated);
    multiChannelNotificationService.updatePreferences(updated);
  };

  const handleSimulateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const notif = await multiChannelNotificationService.dispatchEvent(
      {
        societyId: 'soc-1',
        recipientUserId: userId,
        eventType: simulatorForm.eventType,
        category: simulatorForm.category,
        title: simulatorForm.title,
        message: simulatorForm.message,
        isCritical: simulatorForm.isCritical,
        attachmentUrl: simulatorForm.attachmentUrl || undefined,
        attachmentName: simulatorForm.attachmentName || undefined,
      },
      { phone: simulatorForm.phone, email: simulatorForm.email }
    );

    if (soundEnabled) playNotificationChime();
    setRecentLiveIngest({
      title: notif.title,
      eventType: notif.eventType,
      channels: notif.deliveryLogs.map((l) => l.channel),
      timestamp: new Date().toLocaleTimeString(),
    });
    setNewlyArrivedIds((prev) => new Set([...prev, notif.id]));
    setMessagesIngestedCount((c) => c + 1);
    setSimulatorForm((prev) => ({ ...prev, attachmentUrl: '', attachmentName: '' }));
    loadData();
    alert(`Event [${simulatorForm.eventType}] dispatched across configured provider channels.`);
  };

  const handleMarkAsRead = (eventId: string) => {
    multiChannelNotificationService.markAsRead(eventId, userId);
    loadData();
  };

  const handleMarkAllRead = () => {
    multiChannelNotificationService.markAllAsRead(userId);
    loadData();
  };

  const filteredNotifications = notifications.filter((n) => {
    if (selectedCategoryFilter !== 'ALL' && n.category !== selectedCategoryFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalAuditLogs = notifications.reduce((acc, n) => acc + n.deliveryLogs.length, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-24">
      {/* Header Banner */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--aarizo-border, #DCE8EF)',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: 'var(--aarizo-card-blue, #F4FAFE)',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--aarizo-navy, #083B56)',
            }}
          >
            <Radio size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.01em' }}>
              Notifications &amp; Announcements
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Notices, emergency alerts &amp; communication preferences
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.5rem 0.875rem',
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
              <CheckCheck size={15} /> Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Live Status & Auto-Stream Controller */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--aarizo-border, #DCE8EF)',
          borderRadius: '16px',
          padding: '0.875rem 1.25rem',
          boxShadow: '0 2px 6px rgba(8, 59, 86, 0.03)',
        }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        {/* Left: Socket Indicators */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Connection Status Badge */}
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', borderRadius: '12px', padding: '0.35rem 0.65rem', fontWeight: 800 }} className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>WEBSOCKET LIVE</span>
          </div>

          {/* Transport Info */}
          <div style={{ background: '#F4FAFE', border: '1px solid #DCE8EF', color: '#083B56', borderRadius: '10px', padding: '0.35rem 0.65rem', fontWeight: 700 }} className="inline-flex items-center gap-1.5">
            <Wifi size={13} color="#083B56" />
            <span>BroadcastChannel Bus</span>
          </div>

          {/* Dynamic Latency */}
          <div style={{ background: '#F4FAFE', border: '1px solid #DCE8EF', color: '#083B56', borderRadius: '10px', padding: '0.35rem 0.65rem', fontWeight: 700 }} className="inline-flex items-center gap-1.5">
            <Activity size={13} color="#059669" />
            <span>Latency: <strong style={{ color: '#059669' }}>{latencyMs}ms</strong></span>
          </div>

          {/* Ingest Counter */}
          {messagesIngestedCount > 0 && (
            <div style={{ background: '#FFF5F2', border: '1px solid #FDBA74', color: '#F06543', borderRadius: '10px', padding: '0.35rem 0.65rem', fontWeight: 700 }} className="inline-flex items-center gap-1.5">
              <Zap size={13} />
              <span>Session Ingests: <strong>+{messagesIngestedCount}</strong></span>
            </div>
          )}
        </div>

        {/* Right: Live Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start sm:justify-end mt-2 md:mt-0">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '10px',
              background: '#F4FAFE',
              border: '1px solid #DCE8EF',
              color: '#083B56',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            {soundEnabled ? <Volume2 size={15} color="#083B56" /> : <VolumeX size={15} color="#657785" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          {/* Quick Simulate Button */}
          <button
            type="button"
            onClick={handleQuickSimulate}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '10px',
              background: '#F4FAFE',
              border: '1px solid #DCE8EF',
              color: '#083B56',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Zap size={14} color="#F06543" />
            <span>Simulate Ingest</span>
          </button>

          {/* Live Auto-Stream Toggle */}
          <button
            type="button"
            onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '10px',
              background: isLiveStreamActive ? 'var(--aarizo-coral, #F06543)' : '#F4FAFE',
              border: isLiveStreamActive ? 'none' : '1px solid #DCE8EF',
              color: isLiveStreamActive ? '#ffffff' : '#083B56',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: isLiveStreamActive ? '0 2px 8px rgba(240, 101, 67, 0.25)' : 'none',
            }}
          >
            {isLiveStreamActive ? <Play size={14} className="fill-current animate-pulse" /> : <Pause size={14} />}
            <span>{isLiveStreamActive ? 'Live Stream: Active' : 'Live Stream: Paused'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Live Toast / Flash Pill */}
      {recentLiveIngest && (
        <div
          style={{
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            color: '#059669',
            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.08)',
          }}
          className="flex items-center justify-between gap-3 animate-fadeIn"
        >
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <span style={{ padding: '0.35rem', background: '#059669', color: '#ffffff', borderRadius: '8px' }}>
              <Zap size={14} />
            </span>
            <div>
              <span style={{ fontWeight: 800, textTransform: 'uppercase', color: '#065F46' }}>
                ⚡ Real-Time Ingest ({recentLiveIngest.timestamp}):
              </span>{' '}
              <span style={{ fontWeight: 800, color: '#064E3B' }}>[{recentLiveIngest.eventType}]</span>{' '}
              <span>{recentLiveIngest.title}</span> —{' '}
              <span style={{ fontSize: '0.6875rem', color: '#047857' }}>
                Dispatched via {recentLiveIngest.channels.join(', ')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRecentLiveIngest(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded hover:bg-emerald-200/50"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs Container */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--aarizo-border, #DCE8EF)',
          borderRadius: '16px',
          padding: '0.35rem',
          display: 'flex',
          gap: '0.35rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          boxShadow: '0 2px 6px rgba(8, 59, 86, 0.03)',
          marginBottom: '1.25rem',
        }}
      >
        {[
          { key: 'INBOX', label: `In-App Inbox (${unreadCount} New)`, icon: Bell },
          { key: 'PREFERENCES', label: 'Channel Preferences', icon: Sliders },
          { key: 'DELIVERY_LOGS', label: `Provider Audit Logs (${totalAuditLogs})`, icon: Layers },
          { key: 'DISPATCH_SIMULATOR', label: 'Custom Dispatch Terminal', icon: Send },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'var(--aarizo-coral, #F06543)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--aarizo-navy, #083B56)',
                fontWeight: isActive ? 800 : 700,
                fontSize: '0.78125rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 3px 10px rgba(240, 101, 67, 0.28)' : 'none',
                flexShrink: 0,
              }}
            >
              <Icon size={15} color={isActive ? '#FFFFFF' : 'var(--aarizo-navy, #083B56)'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: INBOX */}
      {activeTab === 'INBOX' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Category:</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-xs font-medium bg-white text-slate-700"
              >
                <option value="ALL">All Categories</option>
                <option value="SECURITY">Security & Gate</option>
                <option value="EMERGENCY">Emergency Alerts</option>
                <option value="BILLING">Billing & Payments</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="COMMUNITY">Community</option>
                <option value="COMPLIANCE">Compliance & AMC</option>
              </select>
            </div>

            <button
              onClick={loadData}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Bell size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="font-medium text-slate-600">No notifications in your inbox.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isLiveJustNow = newlyArrivedIds.has(notif.id);
                return (
                  <div
                    key={notif.id}
                    style={{
                      borderLeft: isLiveJustNow ? '4px solid #10B981' : undefined,
                      transition: 'all 0.3s ease',
                    }}
                    className={`p-5 flex items-start justify-between gap-4 ${
                      isLiveJustNow
                        ? 'bg-emerald-50/50'
                        : notif.isRead
                        ? 'bg-white'
                        : 'bg-[#EAF6FC]/40'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {!notif.isRead && <span className="w-2.5 h-2.5 bg-[#083B56] rounded-full animate-ping" />}
                        {isLiveJustNow && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1 animate-pulse shadow-sm">
                            <Zap size={10} /> LIVE INGEST
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {notif.eventType}
                        </span>
                        {notif.isCritical && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-700 flex items-center gap-1">
                            <AlertTriangle size={11} /> CRITICAL SAFETY OVERRIDE
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base">{notif.title}</h4>
                      <p className="text-sm text-slate-600">{notif.message}</p>

                      {/* Attached Document or Photo */}
                      {notif.attachmentUrl && (
                        <div className="pt-2">
                          <a
                            href={notif.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#EAF6FC] text-[#083B56] border border-[#BCE3F5] hover:bg-[#D5EEFA] transition-colors shadow-xs"
                          >
                            <Paperclip size={12} className="text-[#176B91]" />
                            <span>{notif.attachmentName || 'View Attached Document / File'}</span>
                            <Download size={11} className="ml-1 opacity-70" />
                          </a>
                        </div>
                      )}

                      {/* Delivery Log Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="text-[11px] text-slate-400 font-medium">Dispatched via:</span>
                        {notif.deliveryLogs.map((log) => (
                          <span
                            key={log.id}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md flex items-center gap-1"
                          >
                            <CheckCircle2 size={10} /> {log.channel}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedEventForLogs(notif);
                        setActiveTab('DELIVERY_LOGS');
                      }}
                      className="text-xs text-[#083B56] hover:underline font-bold"
                    >
                      Audit Logs ({notif.deliveryLogs.length})
                    </button>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      )}

      {/* Tab 2: PREFERENCES */}
      {activeTab === 'PREFERENCES' && (
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Resident Multi-Channel Notification Matrix</h3>
            <p className="text-xs text-slate-500">
              Customize which delivery adapters dispatch notifications for each category.
            </p>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <ShieldAlert size={14} className="text-amber-700" /> Safety & Emergency Override Rule:
            </div>
            <p>
              Critical alerts (e.g. Fire Alarm, Visitor Arrival, Child Gate Scan) will automatically override muted channel toggles to ensure high-priority delivery.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] border-b">
                <tr>
                  <th className="py-3 px-4">Event Category</th>
                  <th className="py-3 px-4 text-center">In-App</th>
                  <th className="py-3 px-4 text-center">Push (FCM)</th>
                  <th className="py-3 px-4 text-center">WhatsApp</th>
                  <th className="py-3 px-4 text-center">SMS</th>
                  <th className="py-3 px-4 text-center">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {(['SECURITY', 'EMERGENCY', 'BILLING', 'MAINTENANCE', 'COMMUNITY', 'COMPLIANCE'] as NotificationCategory[]).map(
                  (cat) => {
                    const row = preferences.categories[cat] || {
                      inApp: true,
                      push: true,
                      whatsapp: true,
                      sms: false,
                      email: false,
                    };
                    return (
                      <tr key={cat} className="hover:bg-slate-50">
                        <td className="py-4 px-4 font-bold text-slate-900">
                          {cat}
                          {cat === 'EMERGENCY' && (
                            <span className="block text-[10px] text-rose-600 font-normal">System Override Active</span>
                          )}
                        </td>
                        {(['IN_APP', 'PUSH', 'WHATSAPP', 'SMS', 'EMAIL'] as NotificationChannel[]).map((chan) => {
                          const key = chan.toLowerCase() as keyof typeof row;
                          const isChecked = row[key];
                          return (
                            <td key={chan} className="py-4 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePreference(cat, chan)}
                                className="w-4 h-4 text-[#083B56] rounded focus:ring-[#176B91] cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: DELIVERY LOGS */}
      {activeTab === 'DELIVERY_LOGS' && (
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Provider Delivery & Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Per-channel dispatch status tracking (Sent, Delivered, Failed, Read).
              </p>
            </div>
            {selectedEventForLogs && (
              <button
                onClick={() => setSelectedEventForLogs(null)}
                className="px-3 py-1 bg-slate-100 text-xs font-semibold rounded-lg text-slate-700"
              >
                Clear Selected Event Filter
              </button>
            )}
          </div>

          <div className="space-y-3">
            {notifications
              .filter((n) => !selectedEventForLogs || n.id === selectedEventForLogs.id)
              .map((event) => (
                <div key={event.id} className="p-4 border rounded-xl bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold font-mono bg-[#EAF6FC] text-[#083B56] px-2 py-0.5 rounded">
                        {event.eventType}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{event.title}</h4>
                      <p className="text-xs text-slate-500">{event.message}</p>
                    </div>
                    <span className="text-[11px] text-slate-400">{new Date(event.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Channel Dispatch Logs</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {event.deliveryLogs.map((log: DeliveryLog) => (
                        <div key={log.id} className="p-2.5 bg-white border rounded-lg text-xs space-y-1">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-[#083B56] font-semibold flex items-center gap-1">
                              {log.channel === 'WHATSAPP' && <MessageSquare size={12} />}
                              {log.channel === 'SMS' && <Smartphone size={12} />}
                              {log.channel === 'EMAIL' && <Mail size={12} />}
                              {log.channel === 'PUSH' && <Radio size={12} />}
                              {log.channel === 'IN_APP' && <Bell size={12} />}
                              {log.channel}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              {log.status}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px]">Provider: {log.providerName}</div>
                          <div className="text-slate-400 text-[10px] font-mono">Ref: {log.providerRefId}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 4: DISPATCH SIMULATOR */}
      {activeTab === 'DISPATCH_SIMULATOR' && (
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Notification Event Dispatch Terminal</h3>
            <p className="text-xs text-slate-500">Simulate business events and observe multi-channel routing.</p>
          </div>

          <form onSubmit={handleSimulateDispatch} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Type</label>
                <select
                  value={simulatorForm.eventType}
                  onChange={(e) =>
                    setSimulatorForm({
                      ...simulatorForm,
                      eventType: e.target.value as NotificationEventType,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                >
                  <option value="VISITOR_ARRIVAL">VISITOR_ARRIVAL</option>
                  <option value="PARCEL_ARRIVAL">PARCEL_ARRIVAL</option>
                  <option value="COMPLAINT_UPDATE">COMPLAINT_UPDATE</option>
                  <option value="SLA_BREACH">SLA_BREACH</option>
                  <option value="PAYMENT_DUE">PAYMENT_DUE</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                  <option value="AMC_EXPIRY">AMC_EXPIRY</option>
                  <option value="WORKER_ENTRY">WORKER_ENTRY</option>
                  <option value="UTILITY_OUTAGE">UTILITY_OUTAGE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={simulatorForm.category}
                  onChange={(e) =>
                    setSimulatorForm({
                      ...simulatorForm,
                      category: e.target.value as NotificationCategory,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                >
                  <option value="SECURITY">SECURITY</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                  <option value="BILLING">BILLING</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="COMMUNITY">COMMUNITY</option>
                  <option value="COMPLIANCE">COMPLIANCE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={simulatorForm.title}
                onChange={(e) => setSimulatorForm({ ...simulatorForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message Payload</label>
              <textarea
                required
                rows={3}
                value={simulatorForm.message}
                onChange={(e) => setSimulatorForm({ ...simulatorForm, message: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCritical"
                checked={simulatorForm.isCritical}
                onChange={(e) => setSimulatorForm({ ...simulatorForm, isCritical: e.target.checked })}
                className="w-4 h-4 text-[#083B56] rounded"
              />
              <label htmlFor="isCritical" className="text-xs font-semibold text-rose-700 cursor-pointer">
                Mark as Critical Safety/Security Override (Bypasses muted channel preferences)
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document / Circular / Gate Photo Attachment (Optional)
              </label>
              <FileUpload
                category="general"
                label="Attach Circular PDF or Gate Capture Photo"
                onUploadSuccess={(url: string, name: string) => {
                  setSimulatorForm((prev) => ({
                    ...prev,
                    attachmentUrl: url,
                    attachmentName: name,
                  }));
                }}
              />
              {simulatorForm.attachmentUrl && (
                <div className="mt-2 text-xs text-emerald-700 flex items-center justify-between bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                  <span className="flex items-center gap-1.5 font-medium truncate">
                    <Paperclip size={13} className="shrink-0" />
                    Attached: {simulatorForm.attachmentName || 'Attachment uploaded'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSimulatorForm((prev) => ({ ...prev, attachmentUrl: '', attachmentName: '' }))}
                    className="text-xs text-rose-600 hover:underline font-bold ml-2 shrink-0"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#083B56] hover:bg-[#176B91] text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2"
              >
                <Send size={14} /> Dispatch Event Now
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};



