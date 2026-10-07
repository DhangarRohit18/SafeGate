import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  durationMs?: number;
  error?: string | null;
  onRetry?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 1750,
  error,
  onRetry,
}) => {
  const [stage, setStage] = useState<'init' | 'logo' | 'settled' | 'exit'>('init');

  useEffect(() => {
    // Detect prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setStage('settled');
      const exitTimer = setTimeout(() => {
        setStage('exit');
        const finishTimer = setTimeout(() => {
          if (onComplete) onComplete();
        }, 150);
        return () => clearTimeout(finishTimer);
      }, Math.max(800, durationMs - 250));
      return () => clearTimeout(exitTimer);
    }

    // Stage 1 (150ms): Logo gentle entrance
    const t1 = setTimeout(() => setStage('logo'), 150);

    // Stage 2 (450ms): Wordmark & tagline settle into place
    const t2 = setTimeout(() => setStage('settled'), 450);

    // Stage 3 (durationMs - 260ms): Smooth exit fade start
    const t3 = setTimeout(() => setStage('exit'), Math.max(1200, durationMs - 260));

    // Final completion callback
    const t4 = setTimeout(() => {
      if (onComplete) onComplete();
    }, Math.max(1500, durationMs));

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [durationMs, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#F7FBFE',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: stage === 'exit' ? 0 : 1,
        transform: stage === 'exit' ? 'scale(0.985)' : 'scale(1)',
        transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: stage === 'exit' ? 'none' : 'auto',
        userSelect: 'none',
        padding: '2rem',
        boxSizing: 'border-box',
      }}
    >
      {/* Subtle Background Glow Accent */}
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240, 101, 67, 0.08) 0%, rgba(247, 251, 254, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Center Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 10,
          maxWidth: '320px',
        }}
      >
        {/* Shield Logo Badge */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #F06543 0%, #D84D2B 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 14px 32px rgba(240, 101, 67, 0.25), 0 2px 6px rgba(8, 59, 86, 0.06)',
            marginBottom: '1.25rem',
            transform: stage === 'init' ? 'scale(0.92)' : 'scale(1)',
            opacity: stage === 'init' ? 0 : 1,
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <ShieldCheck size={44} strokeWidth={2.2} />
        </div>

        {/* Brand Wordmark */}
        <h1
          style={{
            fontSize: '2.25rem',
            fontWeight: 900,
            color: '#083B56',
            letterSpacing: '-0.03em',
            margin: '0 0 0.35rem 0',
            opacity: stage === 'init' || stage === 'logo' ? 0 : 1,
            transform: stage === 'init' || stage === 'logo' ? 'translateY(6px)' : 'translateY(0)',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          Safegate
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#657785',
            letterSpacing: '0.04em',
            margin: 0,
            opacity: stage === 'init' || stage === 'logo' ? 0 : 1,
            transform: stage === 'init' || stage === 'logo' ? 'translateY(8px)' : 'translateY(0)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.08s',
          }}
        >
          Secure. Connected. Simple.
        </p>
      </div>

      {/* Error State or Subtle Loading Pulse */}
      {error ? (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            background: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: '16px',
            border: '1px solid #EEF2F5',
            boxShadow: '0 8px 24px rgba(8, 59, 86, 0.08)',
            maxWidth: '280px',
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#D9535B', fontSize: '0.875rem', fontWeight: 600 }}>
            <AlertCircle size={18} />
            <span>Unable to start Safegate</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#657785', textAlign: 'center' }}>
            Please check your connection and try again.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: '#F06543',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}
        </div>
      ) : (
        /* Bottom Subtle 3-Dot Loader */
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            opacity: stage === 'exit' ? 0 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {[
            { color: '#F06543', delay: '0s' },
            { color: '#E5B842', delay: '0.18s' },
            { color: '#083B56', delay: '0.36s' },
          ].map((dot, idx) => (
            <div
              key={idx}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: dot.color,
                animation: `safegateDotPulse 1.1s ease-in-out ${dot.delay} infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes safegateDotPulse {
          from { opacity: 0.3; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;

