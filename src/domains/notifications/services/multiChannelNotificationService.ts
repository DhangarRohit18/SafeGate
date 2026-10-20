import type {
  NotificationRecord,
  DeliveryLog,
  NotificationItemWithLogs,
  NotificationPreference,
  NotificationCategory,
  NotificationEventType,
  InAppNotificationAdapter,
  PushNotificationAdapter,
  WhatsAppNotificationAdapter,
  SMSNotificationAdapter,
  EmailNotificationAdapter,
} from '../types/index';
import { realTimeSync } from '../../../services/realTimeSync';
import { realtimeService } from '../../../services/realtimeService';
import type { RealtimeMessage } from '../../../types/realtime';

const STORAGE_KEY_NOTIF_EVENTS = 'aarizo_notification_events_v2';
const STORAGE_KEY_NOTIF_LOGS = 'aarizo_notification_logs_v2';
const STORAGE_KEY_NOTIF_PREFS = 'aarizo_notification_prefs_v2';

// 1. Provider Adapter Implementations
class MockInAppAdapter implements InAppNotificationAdapter {
  name = 'Dwellora Real-Time In-App Engine';
  async sendInApp(event: NotificationRecord): Promise<DeliveryLog> {
    const timestamp = new Date().toISOString();
    return {
      id: `log-inapp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      eventId: event.id,
      recipientUserId: event.recipientUserId || event.recipientId,
      channel: 'IN_APP',
      providerName: this.name,
      providerRefId: `inapp_msg_${Date.now()}`,
      status: 'DELIVERED',
      sentAt: timestamp,
      deliveredAt: timestamp,
    };
  }
}

class MockPushAdapter implements PushNotificationAdapter {
  name = 'Firebase Cloud Messaging (FCM / APNS Adapter)';
  async sendPush(event: NotificationRecord, deviceToken: string = 'token_demo_123'): Promise<DeliveryLog> {
    const timestamp = new Date().toISOString();
    console.log(`[PUSH ADAPTER] Dispatching push to ${deviceToken}: ${event.title}`);
    return {
      id: `log-push-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      eventId: event.id,
      recipientUserId: event.recipientUserId || event.recipientId,
      channel: 'PUSH',
      providerName: this.name,
      providerRefId: `fcm_msg_id_${Date.now()}`,
      status: 'DELIVERED',
      sentAt: timestamp,
      deliveredAt: timestamp,
    };
  }
}

class MockWhatsAppAdapter implements WhatsAppNotificationAdapter {
  name = 'Meta Business Cloud API (WhatsApp Adapter)';
  async sendWhatsApp(event: NotificationRecord, phoneNumber: string = '+91 98765 43210'): Promise<DeliveryLog> {
    const timestamp = new Date().toISOString();
    console.log(`[WHATSAPP ADAPTER] Dispatching HSM template to ${phoneNumber}: ${event.message || event.body}`);
    return {
      id: `log-wa-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      eventId: event.id,
      recipientUserId: event.recipientUserId || event.recipientId,
      channel: 'WHATSAPP',
      providerName: this.name,
      providerRefId: `wamid.HBgL${Date.now()}`,
      status: 'DELIVERED',
      sentAt: timestamp,
      deliveredAt: timestamp,
    };
  }
}

class MockSMSAdapter implements SMSNotificationAdapter {
  name = 'Twilio / Fast2SMS DLT SMS Gateway';
  async sendSMS(event: NotificationRecord, phoneNumber: string = '+91 98765 43210'): Promise<DeliveryLog> {
    const timestamp = new Date().toISOString();
    console.log(`[SMS ADAPTER] Dispatching DLT SMS to ${phoneNumber}: ${event.message || event.body}`);
    return {
      id: `log-sms-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      eventId: event.id,
      recipientUserId: event.recipientUserId || event.recipientId,
      channel: 'SMS',
      providerName: this.name,
      providerRefId: `sms_sid_${Date.now()}`,
      status: 'DELIVERED',
      sentAt: timestamp,
      deliveredAt: timestamp,
    };
  }
}

class MockEmailAdapter implements EmailNotificationAdapter {
  name = 'SendGrid / AWS SES Email Gateway';
  async sendEmail(event: NotificationRecord, emailAddress: string = 'resident@aarizo.com'): Promise<DeliveryLog> {
    const timestamp = new Date().toISOString();
    console.log(`[EMAIL ADAPTER] Sending HTML template to ${emailAddress}: ${event.title}`);
    return {
      id: `log-email-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      eventId: event.id,
      recipientUserId: event.recipientUserId || event.recipientId,
      channel: 'EMAIL',
      providerName: this.name,
      providerRefId: `sg_msg_id_${Date.now()}`,
      status: 'DELIVERED',
      sentAt: timestamp,
      deliveredAt: timestamp,
    };
  }
}

const DEFAULT_PREFERENCES: Record<string, { inApp: boolean; push: boolean; whatsapp: boolean; sms: boolean; email: boolean }> = {
  SECURITY: { inApp: true, push: true, whatsapp: true, sms: true, email: true },
  EMERGENCY: { inApp: true, push: true, whatsapp: true, sms: true, email: true },
  BILLING: { inApp: true, push: true, whatsapp: true, sms: false, email: true },
  MAINTENANCE: { inApp: true, push: true, whatsapp: true, sms: false, email: false },
  COMMUNITY: { inApp: true, push: false, whatsapp: false, sms: false, email: false },
  COMPLIANCE: { inApp: true, push: true, whatsapp: true, sms: false, email: true },
};

class MultiChannelNotificationService {
  private inAppAdapter: InAppNotificationAdapter = new MockInAppAdapter();
  private pushAdapter: PushNotificationAdapter = new MockPushAdapter();
  private whatsAppAdapter: WhatsAppNotificationAdapter = new MockWhatsAppAdapter();
  private smsAdapter: SMSNotificationAdapter = new MockSMSAdapter();
  private emailAdapter: EmailNotificationAdapter = new MockEmailAdapter();
  private isListening = false;

  constructor() {
    this.initRealtimeListener();
  }

  public initRealtimeListener() {
    if (this.isListening || typeof window === 'undefined') return;
    this.isListening = true;

    realtimeService.subscribe('*', (msg: RealtimeMessage) => {
      if (msg.senderName === 'MultiChannelNotificationEngine') return;
      if ((msg.topic as string) === 'NOTIFICATIONS_UPDATED') return;
      this.ingestRealtimeMessage(msg);
    });
  }

  private ingestRealtimeMessage(msg: RealtimeMessage) {
    let title = 'Society Live Alert';
    let message = '';
    let category: NotificationCategory = 'SECURITY';
    let eventType: NotificationEventType = 'VISITOR_ARRIVAL';
    let isCritical = false;

    switch (msg.topic) {
      case 'VISITOR_ARRIVAL':
        eventType = 'VISITOR_ARRIVAL';
        category = 'SECURITY';
        title = `Visitor Arrival: ${msg.payload?.visitorName || 'Guest'}`;
        message = `${msg.payload?.visitorName || 'Guest'} (${msg.payload?.category || msg.payload?.passType || 'GUEST'}) arrived at ${msg.payload?.gate || 'Gate 1'} for Flat ${msg.payload?.flatCode || 'your unit'}.`;
        isCritical = true;
        break;
      case 'VISITOR_ENTRY':
        eventType = 'VISITOR_ARRIVAL';
        category = 'SECURITY';
        title = `Visitor Checked In: ${msg.payload?.visitorName || 'Guest'}`;
        message = `${msg.payload?.visitorName || 'Guest'} entered through ${msg.payload?.gateName || 'Main Gate'}.`;
        break;
      case 'VISITOR_EXIT':
        eventType = 'VISITOR_ARRIVAL';
        category = 'SECURITY';
        title = `Visitor Departed: ${msg.payload?.visitorName || 'Guest'}`;
        message = `${msg.payload?.visitorName || 'Guest'} checked out of society premises.`;
        break;
      case 'EMERGENCY_ALERTS':
        eventType = 'EMERGENCY';
        category = 'EMERGENCY';
        isCritical = true;
        title = `🚨 SOS EMERGENCY ALERT: ${msg.payload?.type || 'Security'}`;
        message = `Urgent alert at ${msg.payload?.location || msg.payload?.flatNumber || 'Community'}. Details: ${msg.payload?.reason || msg.payload?.details || 'Immediate attention required'}.`;
        break;
      case 'DELIVERY_STATUS':
        eventType = 'PARCEL_ARRIVAL';
        category = 'SECURITY';
        title = `📦 Parcel Status: ${msg.payload?.recipient || 'Delivered'}`;
        message = msg.payload?.message || `Package for Flat ${msg.payload?.flatCode || msg.payload?.unitNumber || ''} is ready in Locker #${msg.payload?.lockerNumber || '01'}.`;
        break;
      case 'PARKING_OCCUPANCY':
        eventType = 'VISITOR_ARRIVAL';
        category = 'SECURITY';
        title = `Vehicle Parking Update`;
        message = `Slot ${msg.payload?.slotId || msg.payload?.slotNumber || 'P-1'} marked ${msg.payload?.status || msg.payload?.occupancyState || 'Occupied'} (Vehicle: ${msg.payload?.vehicleNumber || 'Unregistered'}).`;
        break;
      case 'WORKER_ENTRY_EXIT':
        eventType = 'WORKER_ENTRY';
        category = 'COMMUNITY';
        title = `Domestic Staff ${msg.payload?.action === 'IN' ? 'Check-in' : 'Check-out'}`;
        message = `${msg.payload?.workerName || 'Staff'} recorded ${msg.payload?.action === 'IN' ? 'entry' : 'exit'} at security gate.`;
        break;
      case 'MAINTENANCE_STATUS':
        eventType = 'COMPLAINT_UPDATE';
        category = 'MAINTENANCE';
        title = `Maintenance Update`;
        message = msg.payload?.message || `Work order updated for ${msg.payload?.area || 'Society Facility'}. Status: ${msg.payload?.status || 'In Progress'}.`;
        break;
      case 'PAYMENT_STATUS':
        eventType = 'PAYMENT_DUE';
        category = 'BILLING';
        title = `Society Billing Receipt`;
        message = msg.payload?.message || `Payment of ₹${msg.payload?.amount || '0'} confirmed for society dues.`;
        break;
      case 'NOTIFICATIONS':
        title = msg.payload?.title || 'Society Notice';
        message = msg.payload?.message || 'New announcement received.';
        category = msg.payload?.category || 'COMMUNITY';
        eventType = msg.payload?.eventType || 'COMMUNITY';
        isCritical = !!msg.payload?.isCritical;
        break;
      case 'PAYMENT_COMPLETED':
        eventType = 'PAYMENT_DUE';
        category = 'BILLING';
        title = `Razorpay Payment Verified: ₹${msg.payload?.amount || 0}`;
        message = `Online payment received for ${msg.payload?.billId || 'invoice'}. Reference ID: ${msg.payload?.paymentId || msg.payload?.razorpayPaymentId || 'Verified'}`;
        break;
      case 'ANNOUNCEMENT_CREATED':
        eventType = 'COMMUNITY';
        category = 'COMMUNITY';
        title = `Society Broadcast: ${msg.payload?.title || 'New Announcement'}`;
        message = msg.payload?.content || 'A new official committee circular has been published.';
        isCritical = !!msg.payload?.isUrgent;
        break;
      case 'AMENITY_BOOKED':
        eventType = 'COMMUNITY';
        category = 'COMMUNITY';
        title = `Amenity Booked: ${msg.payload?.amenityName || 'Facility'}`;
        message = `Reservation by ${msg.payload?.residentName || 'Resident'} for ${msg.payload?.bookingDate || 'upcoming slot'} (${msg.payload?.timeSlot || ''}).`;
        break;
      case 'ADVERTISEMENT_PUBLISHED':
        eventType = 'COMMUNITY';
        category = 'COMMUNITY';
        title = `Partner Offer: ${msg.payload?.title || 'Resident Discount'}`;
        message = msg.payload?.tagline || msg.payload?.description || 'Special resident promotion available in society marketplace.';
        break;
      case 'VENDOR_REGISTERED':
        eventType = 'COMMUNITY';
        category = 'COMMUNITY';
        title = `New Society Vendor: ${msg.payload?.businessName || 'Verified Partner'}`;
        message = `${msg.payload?.businessName || 'Partner'} registered for ${msg.payload?.serviceCategory || 'society services'}.`;
        break;
      case 'FILE_UPLOADED':
        eventType = 'COMMUNITY';
        category = 'MAINTENANCE';
        title = `Document Uploaded: ${msg.payload?.filename || 'File'}`;
        message = `Uploaded to society repository under ${msg.payload?.category || 'general'}.`;
        break;
      default:
        return;
    }

    const recipientUserId = msg.payload?.recipientUserId || 'res-1';

    this.dispatchEvent(
      {
        societyId: msg.societyId || 'soc-1',
        recipientUserId,
        eventType,
        category,
        title,
        message,
        isCritical,
        attachmentUrl: msg.payload?.attachmentUrl || msg.payload?.url,
        attachmentName: msg.payload?.attachmentName || msg.payload?.filename,
      },
      { phone: '+91 98765 43210', email: 'resident@aarizo.com' }
    );
  }

  private getStoredEvents(): NotificationRecord[] {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIF_EVENTS);
    if (!raw) {
      const seed = this.generateSeedEvents();
      localStorage.setItem(STORAGE_KEY_NOTIF_EVENTS, JSON.stringify(seed));
      return seed;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveEvents(events: NotificationRecord[]) {
    localStorage.setItem(STORAGE_KEY_NOTIF_EVENTS, JSON.stringify(events));
  }

  private getStoredLogs(): DeliveryLog[] {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIF_LOGS);
    if (!raw) {
      const seedLogs = this.generateSeedLogs();
      localStorage.setItem(STORAGE_KEY_NOTIF_LOGS, JSON.stringify(seedLogs));
      return seedLogs;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveLogs(logs: DeliveryLog[]) {
    localStorage.setItem(STORAGE_KEY_NOTIF_LOGS, JSON.stringify(logs));
  }

  public getPreferences(userId: string): NotificationPreference {
    const raw = localStorage.getItem(`${STORAGE_KEY_NOTIF_PREFS}_${userId}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    const defaultPref: NotificationPreference = {
      userId,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      categories: DEFAULT_PREFERENCES,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${STORAGE_KEY_NOTIF_PREFS}_${userId}`, JSON.stringify(defaultPref));
    return defaultPref;
  }

  public updatePreferences(pref: NotificationPreference): NotificationPreference {
    const updated = { ...pref, updatedAt: new Date().toISOString() };
    localStorage.setItem(`${STORAGE_KEY_NOTIF_PREFS}_${pref.userId}`, JSON.stringify(updated));
    realTimeSync.publish('NOTIFICATIONS_UPDATED', { userId: pref.userId });
    return updated;
  }

  public async dispatchEvent(
    data: Omit<NotificationRecord, 'id' | 'createdAt'>,
    recipientContact?: { phone?: string; email?: string }
  ): Promise<NotificationItemWithLogs> {
    const timestamp = new Date().toISOString();
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const event: NotificationRecord = {
      ...data,
      id: eventId,
      createdAt: timestamp,
    };

    // Store Event
    const events = this.getStoredEvents();
    events.unshift(event);
    this.saveEvents(events);

    // Fetch User Preferences
    const recipientUserId = event.recipientUserId || event.recipientId || 'res-1';
    const prefs = this.getPreferences(recipientUserId);
    const categoryKey = event.category || 'SECURITY';
    const categoryPref = prefs.categories[categoryKey] || DEFAULT_PREFERENCES.SECURITY;

    const deliveryLogs: DeliveryLog[] = [];

    // Critical Override Rule: EMERGENCY and VISITOR_ARRIVAL bypass muted preferences
    const isOverride = event.isCritical || event.category === 'EMERGENCY' || event.eventType === 'VISITOR_ARRIVAL';

    // 1. IN_APP Channel
    if (isOverride || categoryPref.inApp) {
      const log = await this.inAppAdapter.sendInApp(event);
      deliveryLogs.push(log);
    }

    // 2. PUSH Channel
    if (isOverride || categoryPref.push) {
      const log = await this.pushAdapter.sendPush(event);
      deliveryLogs.push(log);
    }

    // 3. WHATSAPP Channel
    if (isOverride || categoryPref.whatsapp) {
      const log = await this.whatsAppAdapter.sendWhatsApp(event, recipientContact?.phone || '+91 98765 43210');
      deliveryLogs.push(log);
    }

    // 4. SMS Channel
    if (isOverride || categoryPref.sms) {
      const log = await this.smsAdapter.sendSMS(event, recipientContact?.phone || '+91 98765 43210');
      deliveryLogs.push(log);
    }

    // 5. EMAIL Channel
    if (isOverride || categoryPref.email) {
      const log = await this.emailAdapter.sendEmail(event, recipientContact?.email || 'resident@aarizo.com');
      deliveryLogs.push(log);
    }

    // Save Delivery Logs
    const existingLogs = this.getStoredLogs();
    this.saveLogs([...deliveryLogs, ...existingLogs]);

    realTimeSync.publish('NOTIFICATIONS_UPDATED', { eventId: event.id, recipientUserId });

    return {
      ...event,
      isRead: false,
      deliveryLogs,
    };
  }

  public getNotificationsForUser(userId: string): NotificationItemWithLogs[] {
    const events = this.getStoredEvents().filter(e => (e.recipientUserId || e.recipientId) === userId || (e.recipientUserId || e.recipientId) === 'ALL');
    const logs = this.getStoredLogs();

    return events.map(evt => {
      const eventLogs = logs.filter(l => l.eventId === evt.id);
      const isRead = eventLogs.some(l => l.readAt !== undefined);
      const readAt = eventLogs.find(l => l.readAt !== undefined)?.readAt;

      return {
        ...evt,
        isRead,
        readAt,
        deliveryLogs: eventLogs,
      };
    });
  }

  public getAllAuditLogs(): DeliveryLog[] {
    return this.getStoredLogs();
  }

  public getDeliveryLogsForEvent(eventId: string): DeliveryLog[] {
    return this.getStoredLogs().filter(l => l.eventId === eventId);
  }

  public markAsRead(eventId: string, userId: string): void {
    const logs = this.getStoredLogs();
    const timestamp = new Date().toISOString();
    let updated = false;

    logs.forEach(l => {
      if (l.eventId === eventId && !l.readAt) {
        l.readAt = timestamp;
        l.status = 'READ';
        updated = true;
      }
    });

    if (updated) {
      this.saveLogs(logs);
      realTimeSync.publish('NOTIFICATIONS_UPDATED', { eventId, userId });
    }
  }

  public markAllAsRead(userId: string): void {
    const userEvents = this.getStoredEvents().filter(e => (e.recipientUserId || e.recipientId) === userId);
    const userEventIds = new Set(userEvents.map(e => e.id));
    const logs = this.getStoredLogs();
    const timestamp = new Date().toISOString();

    logs.forEach(l => {
      if (userEventIds.has(l.eventId) && !l.readAt) {
        l.readAt = timestamp;
        l.status = 'READ';
      }
    });

    this.saveLogs(logs);
    realTimeSync.publish('NOTIFICATIONS_UPDATED', { userId });
  }

  private generateSeedEvents(): NotificationRecord[] {
    const now = Date.now();
    return [
      {
        id: 'evt-seed-1',
        societyId: 'soc-1',
        recipientUserId: 'res-1',
        eventType: 'VISITOR_ARRIVAL',
        category: 'SECURITY',
        title: 'Guest Arrived at Main Gate 1',
        message: 'Cab visitor Rajesh Kumar arrived for Flat A-101.',
        isCritical: true,
        linkUrl: '/resident/visitors',
        createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
      },
      {
        id: 'evt-seed-2',
        societyId: 'soc-1',
        recipientUserId: 'res-1',
        eventType: 'PARCEL_ARRIVAL',
        category: 'SECURITY',
        title: 'Parcel Received at Security Desk',
        message: 'Amazon package #AMZ-991 arrived. Storage Locker #B4.',
        isCritical: false,
        linkUrl: '/resident/deliveries',
        createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
      },
      {
        id: 'evt-seed-3',
        societyId: 'soc-1',
        recipientUserId: 'res-1',
        eventType: 'EMERGENCY',
        category: 'EMERGENCY',
        title: 'FIRE ALARM TEST ALERT',
        message: 'Annual sprinkler & fire alarm testing active on Tower B.',
        isCritical: true,
        linkUrl: '/resident/emergency',
        createdAt: new Date(now - 120 * 60 * 1000).toISOString(),
      },
      {
        id: 'evt-seed-4',
        societyId: 'soc-1',
        recipientUserId: 'res-1',
        eventType: 'AMC_EXPIRY',
        category: 'COMPLIANCE',
        title: 'AMC Contract Expiring (15 Days)',
        message: 'Main Elevator B1 AMC contract requires renewal before Sept 25.',
        isCritical: false,
        linkUrl: '/admin/compliance',
        createdAt: new Date(now - 300 * 60 * 1000).toISOString(),
      },
    ];
  }

  private generateSeedLogs(): DeliveryLog[] {
    const now = Date.now();
    return [
      {
        id: 'log-seed-1',
        eventId: 'evt-seed-1',
        recipientUserId: 'res-1',
        channel: 'IN_APP',
        providerName: 'Dwellora Real-Time In-App Engine',
        providerRefId: 'inapp_seed_101',
        status: 'DELIVERED',
        sentAt: new Date(now - 10 * 60 * 1000).toISOString(),
        deliveredAt: new Date(now - 10 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-seed-2',
        eventId: 'evt-seed-1',
        recipientUserId: 'res-1',
        channel: 'PUSH',
        providerName: 'Firebase Cloud Messaging (FCM / APNS Adapter)',
        providerRefId: 'fcm_seed_102',
        status: 'DELIVERED',
        sentAt: new Date(now - 10 * 60 * 1000).toISOString(),
        deliveredAt: new Date(now - 10 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-seed-3',
        eventId: 'evt-seed-1',
        recipientUserId: 'res-1',
        channel: 'WHATSAPP',
        providerName: 'Meta Business Cloud API (WhatsApp Adapter)',
        providerRefId: 'wamid.seed_103',
        status: 'DELIVERED',
        sentAt: new Date(now - 10 * 60 * 1000).toISOString(),
        deliveredAt: new Date(now - 10 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-seed-4',
        eventId: 'evt-seed-2',
        recipientUserId: 'res-1',
        channel: 'IN_APP',
        providerName: 'Dwellora Real-Time In-App Engine',
        providerRefId: 'inapp_seed_201',
        status: 'DELIVERED',
        sentAt: new Date(now - 45 * 60 * 1000).toISOString(),
        deliveredAt: new Date(now - 45 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-seed-5',
        eventId: 'evt-seed-2',
        recipientUserId: 'res-1',
        channel: 'PUSH',
        providerName: 'Firebase Cloud Messaging (FCM / APNS Adapter)',
        providerRefId: 'fcm_seed_202',
        status: 'DELIVERED',
        sentAt: new Date(now - 45 * 60 * 1000).toISOString(),
        deliveredAt: new Date(now - 45 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-seed-6',
        eventId: 'evt-seed-3',
        recipientUserId: 'res-1',
        channel: 'IN_APP',
        providerName: 'Dwellora Real-Time In-App Engine',
        providerRefId: 'inapp_seed_301',
        status: 'DELIVERED',
        sentAt: new Date(now - 120 * 60 * 1000).toISOString(),
        deliveredAt: new Date(now - 120 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-seed-7',
        eventId: 'evt-seed-3',
        recipientUserId: 'res-1',
        channel: 'SMS',
        providerName: 'Twilio / Fast2SMS DLT SMS Gateway',
        providerRefId: 'sms_seed_302',
        status: 'DELIVERED',
        sentAt: new Date(now - 120 * 60 * 1000).toISOString(),
        deliveredAt: new Date(now - 120 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-seed-8',
        eventId: 'evt-seed-4',
        recipientUserId: 'res-1',
        channel: 'EMAIL',
        providerName: 'SendGrid / AWS SES Email Gateway',
        providerRefId: 'sg_seed_401',
        status: 'DELIVERED',
        sentAt: new Date(now - 300 * 60 * 1000).toISOString(),
        deliveredAt: new Date(now - 300 * 60 * 1000).toISOString(),
      },
    ];
  }

  public async simulateLiveEvent(targetUserId: string = 'res-1'): Promise<NotificationItemWithLogs> {
    const simPool = [
      {
        eventType: 'VISITOR_ARRIVAL' as NotificationEventType,
        category: 'SECURITY' as NotificationCategory,
        title: 'Visitor Arrived at Gate 1',
        message: 'Cab passenger Ramesh Verma arrived for Flat B-402 (Vehicle: KA-01-MJ-8821).',
        isCritical: true,
      },
      {
        eventType: 'PARCEL_ARRIVAL' as NotificationEventType,
        category: 'SECURITY' as NotificationCategory,
        title: '📦 BlueDart Express Parcel Arrived',
        message: 'Package placed into Smart Locker #14 at Security Desk. One-Time Passcode: 7309.',
        isCritical: false,
      },
      {
        eventType: 'WORKER_ENTRY' as NotificationEventType,
        category: 'COMMUNITY' as NotificationCategory,
        title: 'Domestic Help Check-In',
        message: 'Housekeeping assistant Sunita Bai (ID #SH-302) punched in at Service Gate 2.',
        isCritical: false,
      },
      {
        eventType: 'EMERGENCY' as NotificationEventType,
        category: 'EMERGENCY' as NotificationCategory,
        title: '🚨 Elevator Alarm Intercom Alert',
        message: 'Tower B Passenger Elevator emergency intercom activated. Security responding.',
        isCritical: true,
      },
      {
        eventType: 'COMPLAINT_UPDATE' as NotificationEventType,
        category: 'MAINTENANCE' as NotificationCategory,
        title: 'Plumbing SLA Update: In Progress',
        message: 'Ticket #PL-204 (Bathroom leak) assigned to AquaFix Technologies. Technician arriving at 11:30 AM.',
        isCritical: false,
      },
      {
        eventType: 'PAYMENT_DUE' as NotificationEventType,
        category: 'BILLING' as NotificationCategory,
        title: 'Society Maintenance Invoice Ready',
        message: 'Invoice #INV-2026-10 for October (₹4,250) has been generated. Due date: 10th Oct.',
        isCritical: false,
      },
      {
        eventType: 'UTILITY_OUTAGE' as NotificationEventType,
        category: 'MAINTENANCE' as NotificationCategory,
        title: 'DG Backup Genset #2 Auto-Started',
        message: 'Grid switchover detected. Diesel Generator 2 active. Full society backup operational.',
        isCritical: false,
      },
      {
        eventType: 'AMC_EXPIRY' as NotificationEventType,
        category: 'COMPLIANCE' as NotificationCategory,
        title: 'AMC Expiry Warning (7 Days Left)',
        message: 'Wing A Fire Extinguisher Refill & Inspection validity expires on 8th Oct.',
        isCritical: false,
      },
    ];

    const pick = simPool[Math.floor(Math.random() * simPool.length)];
    return this.dispatchEvent(
      {
        societyId: 'soc-1',
        recipientUserId: targetUserId,
        eventType: pick.eventType,
        category: pick.category,
        title: pick.title,
        message: pick.message,
        isCritical: pick.isCritical,
      },
      { phone: '+91 98765 43210', email: 'resident@aarizo.com' }
    );
  }
}

export const multiChannelNotificationService = new MultiChannelNotificationService();
