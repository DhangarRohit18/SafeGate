import type { RealtimeTopic, RealtimeMessage, RealtimeConnectionStatus } from '../types/realtime';

type MessageCallback<T = any> = (msg: RealtimeMessage<T>) => void;

class RealtimeService {
  private channel: BroadcastChannel | null = null;
  private sseSource: EventSource | null = null;
  private subscribers: Map<string, Set<MessageCallback>> = new Map();
  private recentMessages: RealtimeMessage[] = [];
  private seenMessageIds: Set<string> = new Set();
  private totalMessagesReceived = 0;
  private isConnected = true;
  private backendBaseUrl =
    (import.meta as any).env?.VITE_BACKEND_URL ||
    (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174')
      ? 'http://localhost:5000'
      : '');

  constructor() {
    this.initBroadcastChannel();
    this.initSseStream();
    this.seedRecentMessages();
  }

  /**
   * Initialize HTML5 BroadcastChannel for multi-tab real-time socket simulation
   */
  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('communityos_realtime_hub');
        this.channel.onmessage = (event) => {
          if (event.data && event.data.topic) {
            this.handleIncomingMessage(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel fallback to in-memory event bus');
      }
    }
  }

  /**
   * Initialize Server-Sent Events (SSE) for true cross-device network real-time sync
   */
  private sseErrorCount = 0;

  private initSseStream() {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        const streamUrl = '/api/realtime/stream';
        this.sseSource = new EventSource(streamUrl);

        this.sseSource.onopen = () => {
          this.sseErrorCount = 0;
        };

        this.sseSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.topic && !this.seenMessageIds.has(data.id)) {
              this.handleIncomingMessage(data);
            }
          } catch {
            // Heartbeat or ping frame
          }
        };

        this.sseSource.onerror = () => {
          this.sseErrorCount += 1;
          if (this.sseErrorCount >= 3 && this.sseSource) {
            this.sseSource.close();
            this.sseSource = null;
          }
        };
      } catch {
        // Fallback gracefully
      }
    }
  }

  private seedRecentMessages() {
    const now = Date.now();
    this.recentMessages = [
      {
        id: 'rt-101',
        topic: 'VISITOR_ARRIVAL',
        type: 'VISITOR_ARRIVAL',
        societyId: 'soc-gvs',
        payload: { visitorName: 'Rohan Sharma', flatCode: 'A-302', passType: 'GUEST', gate: 'Gate 1' },
        timestamp: new Date(now - 120000).toISOString(),
        senderRole: 'SECURITY',
        senderName: 'Guard Ramesh Shinde',
      },
      {
        id: 'rt-102',
        topic: 'VISITOR_APPROVAL',
        type: 'VISITOR_APPROVAL',
        societyId: 'soc-gvs',
        payload: { visitorName: 'Rohan Sharma', flatCode: 'A-302', status: 'APPROVED' },
        timestamp: new Date(now - 90000).toISOString(),
        senderRole: 'RESIDENT',
        senderName: 'Amit Shah',
      },
      {
        id: 'rt-103',
        topic: 'EMERGENCY_ALERTS',
        type: 'EMERGENCY_ALERTS',
        societyId: 'soc-gvs',
        payload: { emergencyId: 'SOS-991', type: 'MEDICAL', location: 'Clubhouse Gym', priority: 'HIGH' },
        timestamp: new Date(now - 60000).toISOString(),
        senderRole: 'RESIDENT',
        senderName: 'Ananya Roy',
      },
      {
        id: 'rt-104',
        topic: 'PARKING_OCCUPANCY',
        type: 'PARKING_OCCUPANCY',
        societyId: 'soc-gvs',
        payload: { slotId: 'V-12', status: 'OCCUPIED', vehicleNumber: 'MH-12-AB-9901' },
        timestamp: new Date(now - 30000).toISOString(),
        senderRole: 'SECURITY',
        senderName: 'Guard Suresh Kumar',
      },
    ];
    this.totalMessagesReceived = this.recentMessages.length;
  }

  /**
   * Central Publish Engine: Broadcasts to local listeners + cross-tab BroadcastChannel + Network SSE
   */
  public publish<T = any>(
    topicOrMsg: RealtimeTopic | { type?: string; topic?: RealtimeTopic; payload?: any; societyId?: string; senderRole?: string; senderName?: string },
    payload?: T,
    societyId = 'soc-gvs',
    senderRole = 'SYSTEM',
    senderName = 'Realtime Engine'
  ): RealtimeMessage<T> {
    let actualTopic: RealtimeTopic;
    let actualPayload: any;
    let actualSocietyId = societyId;
    let actualSenderRole = senderRole;
    let actualSenderName = senderName;

    if (typeof topicOrMsg === 'object' && topicOrMsg !== null && ('type' in topicOrMsg || 'topic' in topicOrMsg)) {
      actualTopic = (topicOrMsg.topic || topicOrMsg.type || 'GENERAL') as RealtimeTopic;
      actualPayload = topicOrMsg.payload;
      actualSocietyId = topicOrMsg.societyId || societyId;
      actualSenderRole = topicOrMsg.senderRole || senderRole;
      actualSenderName = topicOrMsg.senderName || senderName;
    } else {
      actualTopic = topicOrMsg as RealtimeTopic;
      actualPayload = payload;
    }

    const msg: RealtimeMessage<T> = {
      id: `rt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      topic: actualTopic,
      type: actualTopic,
      societyId: actualSocietyId,
      payload: actualPayload,
      timestamp: new Date().toISOString(),
      senderRole: actualSenderRole,
      senderName: actualSenderName,
    };

    // Mark as locally processed
    this.seenMessageIds.add(msg.id);
    if (this.seenMessageIds.size > 200) {
      const oldest = Array.from(this.seenMessageIds)[0];
      this.seenMessageIds.delete(oldest);
    }

    // 1. Send across browser tabs via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {
        console.error('BroadcastChannel postMessage error', e);
      }
    }

    // 2. Broadcast across network (to phones & other devices) via backend SSE hub
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      try {
        fetch(`${this.backendBaseUrl}/api/realtime/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: actualTopic,
            payload: actualPayload,
            societyId: actualSocietyId,
            senderRole: actualSenderRole,
            senderName: actualSenderName,
          }),
        }).catch(() => {
          // Server offline or mobile standalone mode - continue seamlessly
        });
      } catch {
        // Safe offline ignore
      }
    }

    // 3. Dispatch to local subscribers
    this.handleIncomingMessage(msg);

    return msg;
  }

  public broadcast<T = any>(
    topic: string,
    payload: T,
    societyId = 'soc-gvs',
    senderRole = 'SYSTEM',
    senderName = 'Realtime Engine'
  ): RealtimeMessage<T> {
    return this.publish(topic as any, payload, societyId, senderRole, senderName);
  }

  /**
   * Internal message handler with deduplication
   */
  private handleIncomingMessage(msg: RealtimeMessage) {
    if (this.seenMessageIds.has(msg.id)) {
      return;
    }
    this.seenMessageIds.add(msg.id);
    if (this.seenMessageIds.size > 200) {
      const oldest = Array.from(this.seenMessageIds)[0];
      this.seenMessageIds.delete(oldest);
    }

    this.totalMessagesReceived += 1;
    this.recentMessages = [msg, ...this.recentMessages.slice(0, 49)];

    // Notify specific topic subscribers
    const topicSubscribers = this.subscribers.get(msg.topic);
    if (topicSubscribers) {
      topicSubscribers.forEach((cb) => {
        try {
          cb(msg);
        } catch (err) {
          console.error(`Error in realtime subscriber for topic ${msg.topic}:`, err);
        }
      });
    }

    // Notify wildcard '*' subscribers
    const wildcardSubscribers = this.subscribers.get('*');
    if (wildcardSubscribers) {
      wildcardSubscribers.forEach((cb) => {
        try {
          cb(msg);
        } catch (err) {
          console.error('Error in wildcard realtime subscriber:', err);
        }
      });
    }
  }

  /**
   * Central Subscription Engine with automatic Unsubscribe function
   */
  public subscribe<T = any>(topic: RealtimeTopic | '*', callback: MessageCallback<T>): () => void {
    const key = topic;
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    const set = this.subscribers.get(key)!;
    set.add(callback as MessageCallback);

    // Return Cleanup Unsubscribe Function
    return () => {
      const currentSet = this.subscribers.get(key);
      if (currentSet) {
        currentSet.delete(callback as MessageCallback);
        if (currentSet.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  /**
   * Get Recent Message Stream
   */
  public getRecentMessages(topicFilter?: RealtimeTopic | 'ALL'): RealtimeMessage[] {
    if (!topicFilter || topicFilter === 'ALL') {
      return this.recentMessages;
    }
    return this.recentMessages.filter((m) => m.topic === topicFilter);
  }

  /**
   * Get Diagnostic Connection Status
   */
  public getConnectionStatus(): RealtimeConnectionStatus {
    let activeListenersCount = 0;
    this.subscribers.forEach((set) => {
      activeListenersCount += set.size;
    });

    return {
      connected: this.isConnected,
      transportType: this.channel ? 'BROADCAST_CHANNEL' : 'EVENT_EMITTER',
      latencyMs: 8 + Math.floor(Math.random() * 6),
      activeListenersCount,
      messagesReceivedTotal: this.totalMessagesReceived,
    };
  }
}

export const realtimeService = new RealtimeService();
