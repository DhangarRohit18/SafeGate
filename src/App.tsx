import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PrototypeProvider } from './context/PrototypeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './routes';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SplashScreen } from './components/common/SplashScreen';
import { initNativeMobileFeatures } from './utils/nativeMobile';
import './styles/global.css';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initNativeMobileFeatures();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
      <ThemeProvider>
      <PrototypeProvider>
        <AuthProvider>
          <ToastProvider>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100dvh',
                width: '100%',
                maxWidth: '100vw',
                overflowX: 'hidden',
                backgroundColor: '#F7FBFE',
                color: '#0f172a',
                position: 'relative',
              }}
            >
              {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
              <AppRoutes />
            </div>

          </ToastProvider>
        </AuthProvider>
      </PrototypeProvider>
      </ThemeProvider>
    </BrowserRouter>
  </ErrorBoundary>
  );
};

export default App;
