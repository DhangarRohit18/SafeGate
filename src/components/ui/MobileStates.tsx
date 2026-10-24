
import { AlertCircle, FileSearch, WifiOff } from 'lucide-react';

export const MobileLoadingState = () => (
  <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #cbd5e1', borderTopColor: '#083B56', animation: 'spin 1s linear infinite' }} />
    <p style={{ marginTop: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>Loading data...</p>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

export const MobileEmptyState = ({ title = 'No results found', message = 'Try adjusting your filters.', icon: Icon = FileSearch }) => (
  <div style={{ padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#f8fafc', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
    <Icon size={48} color="#64748B" strokeWidth={1.5} />
    <h3 style={{ marginTop: '1rem', fontSize: '1.125rem', fontWeight: 700, color: '#1E293B', margin: 0, wordBreak: 'break-word' }}>{title}</h3>
    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#475569', fontWeight: 500, wordBreak: 'break-word', maxWidth: '380px' }}>{message}</p>
  </div>
);

export const MobileErrorState = ({ error = 'An unexpected error occurred.', onRetry }: { error?: string, onRetry?: () => void }) => (
  <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#fef2f2', borderRadius: '1rem', border: '1px solid #fecaca' }}>
    <AlertCircle size={40} color="#ef4444" strokeWidth={1.5} />
    <h3 style={{ marginTop: '1rem', fontSize: '1rem', fontWeight: 700, color: '#991b1b', margin: 0, wordBreak: 'break-word' }}>Failed to load</h3>
    <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#991b1b', fontWeight: 500, wordBreak: 'break-word', maxWidth: '380px' }}>{error}</p>
    {onRetry && (
      <button onClick={onRetry} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#dc2626', color: '#fff', borderRadius: '0.5rem', border: 'none', fontWeight: 600, fontSize: '0.8125rem' }}>
        Retry
      </button>
    )}
  </div>
);

export const MobileOfflineBanner = ({ status = 'OFFLINE' }: { status?: 'OFFLINE' | 'RECONNECTING' }) => {
  if (status === 'OFFLINE') {
    return (
      <div style={{ background: '#334155', color: '#f8fafc', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
        <WifiOff size={14} /> You are currently offline. Changes will sync when reconnected.
      </div>
    );
  }
  return (
    <div style={{ background: '#eab308', color: '#713f12', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
      <div style={{ width: 8, height: 8, background: '#a16207', borderRadius: '50%', animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
      Reconnecting to server...
      <style>{`@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }`}</style>
    </div>
  );
};
