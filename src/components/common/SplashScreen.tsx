import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  durationMs?: number;
  error?: string | null;
  onRetry?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 1600,
  error,
  onRetry,
}) => {
  const [stage, setStage] = useState<'init' | 'visible' | 'exit'>('init');

  useEffect(() => {
    // Detect prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setStage('visible');
      const exitTimer = setTimeout(() => {
        setStage('exit');
        const finishTimer = setTimeout(() => {
          if (onComplete) onComplete();
        }, 150);
        return () => clearTimeout(finishTimer);
      }, Math.max(700, durationMs - 250));
      return () => clearTimeout(exitTimer);
    }

    // Stage 1 (80ms): Fade logo in
    const t1 = setTimeout(() => setStage('visible'), 80);

    // Stage 2 (durationMs - 250ms): Smooth exit fade start
    const t2 = setTimeout(() => setStage('exit'), Math.max(1000, durationMs - 250));

    // Stage 3 (durationMs): Completion callback
    const t3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, Math.max(1250, durationMs));

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [durationMs, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: stage === 'exit' ? 0 : 1,
        transform: stage === 'exit' ? 'scale(0.985)' : 'scale(1)',
        transition:
          'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: stage === 'exit' ? 'none' : 'auto',
        userSelect: 'none',
        padding: '2rem',
        boxSizing: 'border-box',
      }}
    >
      {/* Centered Dwellora Exact Logo Artwork */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '300px',
          width: '100%',
          opacity: stage === 'init' ? 0 : 1,
          transform: stage === 'init' ? 'scale(0.95)' : 'scale(1)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <img
          src="/dwellora-logo.png"
          alt="Dwellora"
          style={{
            width: '100%',
            maxWidth: '260px',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
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
            background: '#111827',
            padding: '1rem 1.25rem',
            borderRadius: '16px',
            border: '1px solid #374151',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            maxWidth: '280px',
            zIndex: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#F87171',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <AlertCircle size={18} />
            <span>Unable to start Dwellora</span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              color: '#9CA3AF',
              textAlign: 'center',
            }}
          >
            Please check your connection and try again.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: '#FFFFFF',
                color: '#000000',
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
        /* Bottom Minimalist Pulse Loader */
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            opacity: stage === 'exit' ? 0 : 0.8,
            transition: 'opacity 0.2s ease',
          }}
        >
          {[0, 0.18, 0.36].map((delay, idx) => (
            <div
              key={idx}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                animation: `dwelloraDotPulse 1.1s ease-in-out ${delay}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes dwelloraDotPulse {
          from { opacity: 0.25; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1.25); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
