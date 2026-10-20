import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * usePushNotifications — Initializes Capacitor push notifications.
 *
 * On Android/iOS (after `npx cap sync`):
 *   - Requests permission
 *   - Registers device token (send to your backend)
 *   - Handles deep-link routing from notification tap
 *
 * In browser:
 *   - Falls back gracefully, no errors
 */
export function usePushNotifications() {
  const navigate = useNavigate();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      try {
        if (typeof window === 'undefined' || !(window as any).Capacitor?.isNativePlatform?.()) {
          return;
        }

        const { PushNotifications } = await import('@capacitor/push-notifications');

        // Request permission safely
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') return;

        // Register with APNs / FCM inside safe try-catch
        try {
          await PushNotifications.register();
        } catch (regErr) {
          console.warn('[Dwellora Push] Push registration skipped or not configured:', regErr);
          return;
        }

        // Handle token registration
        const tokenListener = await PushNotifications.addListener(
          'registration',
          (token) => {
            console.debug('[Dwellora Push] Device token:', token.value);
          }
        );

        // Handle notification tap (foreground)
        const receivedListener = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            console.debug('[Dwellora Push] Received:', notification.title);
          }
        );

        // Handle notification action (tap from tray) → deep link
        const actionListener = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action) => {
            const data = action.notification.data as Record<string, string> | undefined;
            if (!data?.screen) return;

            const SCREEN_ROUTES: Record<string, string> = {
              visitor_arrival: '/resident/visitors',
              visitor_approval: '/resident/visitors',
              parcel_arrived: '/resident/visitors',
              payment_due: '/resident/billing',
              complaint_update: '/resident/requests',
              maintenance_update: '/resident/maintenance',
              emergency_alert: '/resident/emergency',
              worker_entry: '/resident/domestic-help',
              child_pickup: '/resident/child-safety',
              amenity_booking: '/resident/amenities',
              security_visitor: '/security',
              security_parcel: '/security/delivery-intelligence',
              security_emergency: '/security/emergency-command',
              admin_approval: '/admin/residents',
              admin_complaint: '/admin/requests',
              admin_sla: '/admin/intelligence',
            };

            const route = SCREEN_ROUTES[data.screen];
            if (route) navigate(route);
          }
        );

        cleanup = () => {
          tokenListener.remove().catch(() => {});
          receivedListener.remove().catch(() => {});
          actionListener.remove().catch(() => {});
        };
      } catch (err) {
        console.warn('[Dwellora Push] Push notification setup failed:', err);
      }
    };

    init();

    return () => {
      cleanup?.();
    };
  }, [navigate]);
}
