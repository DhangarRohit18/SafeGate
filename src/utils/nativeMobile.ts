import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { App } from '@capacitor/app';
import { useState, useEffect } from 'react';

/**
 * Check if the application is running inside a native mobile container (Capacitor/Android/iOS)
 */
export const isNativeApp = (): boolean => {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
};

/**
 * Configure native mobile status bar and system chrome
 */
export const initNativeMobileFeatures = async () => {
  if (!isNativeApp()) return;

  try {
    // Set status bar background to Safegate warm off-white brand background
    await StatusBar.setBackgroundColor({ color: '#F7FBFE' });
    // Style.Light sets the status bar text/icons to dark
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.debug('StatusBar initialization fallback:', err);
  }
};


/**
 * Native Haptic Feedback with Web Vibration API fallback
 */
export const triggerHaptic = async (
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
) => {
  try {
    if (isNativeApp()) {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
      }
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(40);
          break;
        case 'success':
          navigator.vibrate([15, 60, 20]);
          break;
        case 'warning':
        case 'error':
          navigator.vibrate([40, 40, 40]);
          break;
      }
    }
  } catch {
    // Non-critical fallback
  }
};

/**
 * Hook to detect whether the software/virtual keyboard is currently visible on mobile
 */
export const useVirtualKeyboard = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        setIsKeyboardVisible(true);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardVisible(false);
    };

    // Also support visualViewport API for high accuracy
    const handleViewportResize = () => {
      if (window.visualViewport) {
        const isShrunk = window.visualViewport.height < window.innerHeight * 0.82;
        setIsKeyboardVisible(isShrunk);
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
    }

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      }
    };
  }, []);

  return isKeyboardVisible;
};

/**
 * Setup top-level back button listener for Android hardware back gesture
 */
export const registerGlobalBackHandler = (
  onBackRequest?: () => boolean | void
) => {
  if (!isNativeApp()) return () => {};

  const listenerPromise = App.addListener('backButton', () => {
    // 1. Check if custom handler handled it
    if (onBackRequest && onBackRequest() === true) {
      return;
    }

    // 2. Check if any open modal / backdrop exists in the DOM
    const openModal = document.querySelector('[role="dialog"], .modal-open, .backdrop-active');
    if (openModal) {
      const closeBtn = openModal.querySelector('button[aria-label*="Close"], button[aria-label*="close"]') as HTMLButtonElement | null;
      if (closeBtn) {
        closeBtn.click();
        return;
      }
    }

    // 3. Fallback to router navigation or exit
    if (window.history.length > 1) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  return () => {
    listenerPromise.then((handle) => handle.remove()).catch(() => {});
  };
};
