import React from 'react';
import { Bell, Check } from 'lucide-react';

export interface NotificationItemData {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type?: 'info' | 'warning' | 'alert';
}

interface NotificationPanelProps {
  notifications: NotificationItemData[];
  onMarkAllAsRead?: () => void;
  onSelectNotification?: (id: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
}) => {
  return (
    <div
      style={{
        width: '340px',
        maxHeight: '420px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '0.85rem 1rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={16} color="#176B91" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#083B56' }}>
            Notifications
          </span>
        </div>
        {onMarkAllAsRead && (
          <button
            onClick={onMarkAllAsRead}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#176B91',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            <Check size={12} /> Mark all read
          </button>
        )}
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}>
            No notifications
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => onSelectNotification && onSelectNotification(notif.id)}
              style={{
                padding: '0.85rem 1rem',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: notif.isRead ? '#ffffff' : '#EAF6FC',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', minWidth: 0, flex: 1, wordBreak: 'break-word', lineHeight: 1.35 }}>
                  {notif.title}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B', flexShrink: 0, whiteSpace: 'nowrap', fontWeight: 500 }}>{notif.time}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: 1.45, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {notif.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
