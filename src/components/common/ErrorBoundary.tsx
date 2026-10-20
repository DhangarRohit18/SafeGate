import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100dvh',
            padding: '24px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              marginBottom: '16px',
            }}
          >
            <AlertTriangle style={{ width: '48px', height: '48px', color: '#ef4444' }} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', maxWidth: '360px', marginBottom: '24px' }}>
            An unexpected error occurred in Dwellora. You can retry to refresh the active state.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#083B56',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
