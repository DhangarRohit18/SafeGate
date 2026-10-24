import React from 'react';

export interface TimelineItem {
  id: string;
  title: string;
  timestamp: string;
  description?: string;
  icon?: React.ReactNode;
  status?: 'completed' | 'active' | 'pending';
}

interface TimelineProps {
  items: TimelineItem[];
}

export const Timeline: React.FC<TimelineProps> = ({ items }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', paddingLeft: '1.5rem' }}>
      <div
        style={{
          position: 'absolute',
          top: '8px',
          bottom: '8px',
          left: '7px',
          width: '2px',
          backgroundColor: '#e2e8f0',
        }}
      />
      {items.map((item) => (
        <div key={item.id} style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: '-1.5rem',
              top: '2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: item.status === 'completed' ? '#10b981' : item.status === 'active' ? 'var(--aarizo-blue, #176B91)' : '#cbd5e1',
              border: '3px solid #ffffff',
              boxShadow: '0 0 0 1px #e2e8f0',
            }}
          />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem', gap: '0.5rem', minWidth: 0 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#083B56', minWidth: 0, flex: 1, wordBreak: 'break-word', lineHeight: 1.35 }}>{item.title}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', flexShrink: 0, whiteSpace: 'nowrap', fontWeight: 500 }}>{item.timestamp}</span>
            </div>
            {item.description && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.45, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
