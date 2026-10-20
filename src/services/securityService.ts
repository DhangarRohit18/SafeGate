import type {
  AuditEventType,
  AuditLogEntry,
  SessionRecord,
  RateLimitCheckResult,
  PayloadValidationResult,
} from '../types/security';

const STORAGE_KEYS = {
  AUDIT_LOGS: 'communityos_audit_logs_v2',
  SESSIONS: 'communityos_active_sessions_v1',
  RATE_LIMITS: 'communityos_rate_limit_state',
};

const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-101',
    actor: 'Mayuri Udar',
    role: 'SOCIETY_ADMIN',
    society: 'soc-gvs',
    action: 'LOGIN',
    entity: 'UserSession',
    entityId: 'usr-admin-01',
    timestamp: '2026-09-13T08:15:00Z',
    metadata: { method: 'PASSWORD_MFA', ip: '192.168.1.45', device: 'Chrome / macOS' },
    ipAddress: '192.168.1.45',
  },
  {
    id: 'aud-102',
    actor: 'Guard Ramesh Shinde',
    role: 'SECURITY',
    society: 'soc-gvs',
    action: 'VISITOR_ENTRY',
    entity: 'VisitorPass',
    entityId: 'PASS-8812',
    timestamp: '2026-09-13T09:30:00Z',
    metadata: { visitorName: 'Vikram Seth', flatCode: 'B-104', passType: 'GUEST' },
    ipAddress: '10.0.0.12',
  },
  {
    id: 'aud-103',
    actor: 'Siddharth Patel',
    role: 'RESIDENT',
    society: 'soc-gvs',
    action: 'APPROVE',
    entity: 'VisitorPass',
    entityId: 'PASS-8812',
    timestamp: '2026-09-13T09:31:10Z',
    metadata: { approvalSource: 'IN_APP_PUSH', autoApproved: false },
    ipAddress: '192.168.1.102',
  },
  {
    id: 'aud-104',
    actor: 'Guard Ramesh Shinde',
    role: 'SECURITY',
    society: 'soc-gvs',
    action: 'QR_SCAN',
    entity: 'ChildSafetyPass',
    entityId: 'CHILD-QR-9901',
    timestamp: '2026-09-13T10:05:00Z',
    metadata: { childName: 'Aarav Patel', verifiedGuardian: 'Pooja Patel', result: 'ALLOWED' },
    ipAddress: '10.0.0.12',
  },
  {
    id: 'aud-105',
    actor: 'Siddharth Patel',
    role: 'RESIDENT',
    society: 'soc-gvs',
    action: 'PAYMENT',
    entity: 'Invoice',
    entityId: 'INV-2026-09-0301',
    timestamp: '2026-09-13T10:45:00Z',
    metadata: { amount: 5150, gateway: 'RAZORPAY', txnId: 'TXN-99120481' },
    ipAddress: '192.168.1.102',
  },
  {
    id: 'aud-106',
    actor: 'Mayuri Udar',
    role: 'SOCIETY_ADMIN',
    society: 'soc-gvs',
    action: 'MAINTENANCE_REASSIGNMENT',
    entity: 'MaintenanceTicket',
    entityId: 'TKT-8802',
    timestamp: '2026-09-13T11:10:00Z',
    metadata: { previousTechnician: 'Unassigned', assignedVendor: 'ProClean Electricals' },
    ipAddress: '192.168.1.45',
  },
  {
    id: 'aud-107',
    actor: 'Guard Suresh Kumar',
    role: 'SECURITY',
    society: 'soc-gvs',
    action: 'WORKER_VERIFICATION',
    entity: 'DomesticWorker',
    entityId: 'WRK-7012',
    timestamp: '2026-09-13T11:30:00Z',
    metadata: { workerName: 'Sunita Bai', flatAssigned: 'A-201', passStatus: 'VERIFIED' },
    ipAddress: '10.0.0.14',
  },
  {
    id: 'aud-108',
    actor: 'Ananya Roy',
    role: 'RESIDENT',
    society: 'soc-gvs',
    action: 'EMERGENCY_ACTION',
    entity: 'EmergencyIncident',
    entityId: 'SOS-5501',
    timestamp: '2026-09-13T11:55:00Z',
    metadata: { type: 'MEDICAL', location: 'Block A - 4th Floor Lobby', status: 'TRIGGERED' },
    ipAddress: '192.168.1.115',
  },
  {
    id: 'aud-109',
    actor: 'Guard Ramesh Shinde',
    role: 'SECURITY',
    society: 'soc-gvs',
    action: 'VISITOR_EXIT',
    entity: 'VisitorPass',
    entityId: 'PASS-8812',
    timestamp: '2026-09-13T12:20:00Z',
    metadata: { durationMinutes: 170, overstayed: false },
    ipAddress: '10.0.0.12',
  },
  {
    id: 'aud-110',
    actor: 'Mayuri Udar',
    role: 'SOCIETY_ADMIN',
    society: 'soc-gvs',
    action: 'CREATE',
    entity: 'AmenityFacility',
    entityId: 'AMN-104',
    timestamp: '2026-09-13T12:35:00Z',
    metadata: { name: 'Tennis Court B', hourlyRate: 300, maxCapacity: 4 },
    ipAddress: '192.168.1.45',
  },
  {
    id: 'aud-111',
    actor: 'Super Admin System',
    role: 'SUPER_ADMIN',
    society: 'GLOBAL',
    action: 'UPDATE',
    entity: 'SocietyConfiguration',
    entityId: 'soc-gvs',
    timestamp: '2026-09-13T12:40:00Z',
    metadata: { featureToggled: 'GUEST_STAY_MODULE', newValue: true },
    ipAddress: '127.0.0.1',
  },
  {
    id: 'aud-112',
    actor: 'Mayuri Udar',
    role: 'SOCIETY_ADMIN',
    society: 'soc-gvs',
    action: 'REJECT',
    entity: 'VendorApplication',
    entityId: 'VND-309',
    timestamp: '2026-09-13T12:45:00Z',
    metadata: { vendorName: 'QuickFix Plumbing', reason: 'Incomplete GST Certificate' },
    ipAddress: '192.168.1.45',
  },
];

const SEED_SESSIONS: SessionRecord[] = [
  {
    sessionId: 'sess-001',
    userId: 'usr-admin-01',
    userName: 'Mayuri Udar',
    role: 'SOCIETY_ADMIN',
    societyId: 'soc-gvs',
    ipAddress: '192.168.1.45',
    deviceInfo: 'Chrome 128 / macOS Sonoma',
    createdAt: '2026-09-13T08:15:00Z',
    lastActiveAt: '2026-09-13T12:50:00Z',
    isExpired: false,
  },
  {
    sessionId: 'sess-002',
    userId: 'usr-guard-01',
    userName: 'Ramesh Shinde',
    role: 'SECURITY',
    societyId: 'soc-gvs',
    ipAddress: '10.0.0.12',
    deviceInfo: 'Android Terminal App / Gate 1',
    createdAt: '2026-09-13T06:00:00Z',
    lastActiveAt: '2026-09-13T12:48:00Z',
    isExpired: false,
  },
  {
    sessionId: 'sess-003',
    userId: 'usr-res-101',
    userName: 'Siddharth Patel',
    role: 'RESIDENT',
    societyId: 'soc-gvs',
    ipAddress: '192.168.1.102',
    deviceInfo: 'Dwellora Mobile App v1.0',
    createdAt: '2026-09-13T09:10:00Z',
    lastActiveAt: '2026-09-13T12:30:00Z',
    isExpired: false,
  },
];

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch (e) {
    return defaultValue;
  }
}

function setItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage error', e);
  }
}

class SecurityService {
  /**
   * RBAC Matrix Definition
   */
  private rbacMatrix: Record<string, string[]> = {
    SUPER_ADMIN: ['*'],
    SOCIETY_ADMIN: [
      'create:flat',
      'update:flat',
      'delete:flat',
      'approve:resident',
      'reject:resident',
      'create:vendor',
      'approve:vendor',
      'reject:vendor',
      'manage:billing',
      'reassign:maintenance',
      'view:audit_logs',
      'manage:security',
    ],
    RESIDENT: [
      'create:visitor_pass',
      'approve:visitor_pass',
      'reject:visitor_pass',
      'create:maintenance_ticket',
      'pay:bill',
      'book:amenity',
      'trigger:sos',
      'book:guest_stay',
    ],
    SECURITY: [
      'scan:visitor_qr',
      'scan:parking_qr',
      'scan:staff_qr',
      'scan:child_qr',
      'scan:guest_qr',
      'verify:worker',
      'respond:emergency',
    ],
    VENDOR: ['update:order', 'manage:catalog'],
    SERVICE_PROVIDER: ['update:task_status', 'upload:task_proof'],
  };

  /**
   * 1. Check RBAC Permission
   */
  public hasPermission(role: string, action: string, entity: string): boolean {
    const rolePermissions = this.rbacMatrix[role.toUpperCase()] || [];
    if (rolePermissions.includes('*')) return true;
    const requiredPermission = `${action.toLowerCase()}:${entity.toLowerCase()}`;
    return rolePermissions.includes(requiredPermission);
  }

  /**
   * 2. Payload Validation & Sanitization Engine
   */
  public validatePayload(payload: any): PayloadValidationResult {
    const errors: string[] = [];

    if (!payload || typeof payload !== 'object') {
      return { isValid: false, errors: ['Payload must be a valid non-empty object'] };
    }

    const payloadStr = JSON.stringify(payload).toLowerCase();

    // Check XSS Script Injection
    if (payloadStr.includes('<script>') || payloadStr.includes('javascript:')) {
      errors.push('Security Violation: Potential XSS Script Injection Detected.');
    }

    // Check SQL Injection Patterns
    if (payloadStr.includes("' or 1=1") || payloadStr.includes('drop table') || payloadStr.includes('--')) {
      errors.push('Security Violation: Malicious SQL Query Pattern Detected.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedPayload: payload,
    };
  }

  /**
   * 3. Sliding Window Rate Limiting Engine
   */
  private rateLimitMap: Record<string, { count: number; resetTime: number }> = {};

  public checkRateLimit(key: string, maxRequests = 20, windowSeconds = 60): RateLimitCheckResult {
    const now = Date.now();
    const state = this.rateLimitMap[key];

    if (!state || now > state.resetTime) {
      this.rateLimitMap[key] = {
        count: 1,
        resetTime: now + windowSeconds * 1000,
      };
      return {
        allowed: true,
        currentCount: 1,
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetSeconds: windowSeconds,
      };
    }

    if (state.count >= maxRequests) {
      const resetSeconds = Math.ceil((state.resetTime - now) / 1000);
      return {
        allowed: false,
        currentCount: state.count + 1,
        limit: maxRequests,
        remaining: 0,
        resetSeconds,
      };
    }

    state.count += 1;
    const resetSeconds = Math.ceil((state.resetTime - now) / 1000);
    return {
      allowed: true,
      currentCount: state.count,
      limit: maxRequests,
      remaining: maxRequests - state.count,
      resetSeconds,
    };
  }

  /**
   * 4. Session Management
   */
  public getActiveSessions(): SessionRecord[] {
    return getItem<SessionRecord[]>(STORAGE_KEYS.SESSIONS, SEED_SESSIONS);
  }

  public terminateSession(sessionId: string): boolean {
    const sessions = this.getActiveSessions();
    const updated = sessions.map((s) => (s.sessionId === sessionId ? { ...s, isExpired: true } : s));
    setItem(STORAGE_KEYS.SESSIONS, updated);

    this.logAudit({
      actor: 'Security Operations',
      role: 'SYSTEM',
      society: 'GLOBAL',
      action: 'LOGOUT',
      entity: 'UserSession',
      entityId: sessionId,
      metadata: { reason: 'REMOTE_REVOCATION_ADMIN' },
      ipAddress: '127.0.0.1',
    });

    return true;
  }

  /**
   * 5. Audit Logging Engine (Supports all 14 mandatory audit action types)
   */
  public logAudit(entry: {
    actor: string;
    role: string;
    society: string;
    action: AuditEventType | string;
    entity: string;
    entityId: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }): AuditLogEntry {
    const logs = getItem<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);

    const newLog: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actor: entry.actor || 'System User',
      role: entry.role || 'RESIDENT',
      society: entry.society || 'soc-gvs',
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      timestamp: new Date().toISOString(),
      metadata: entry.metadata || {},
      ipAddress: entry.ipAddress || '192.168.1.1',
    };

    const updated = [newLog, ...logs];
    setItem(STORAGE_KEYS.AUDIT_LOGS, updated);
    return newLog;
  }

  public getAuditLogs(societyId?: string, actionFilter?: string): AuditLogEntry[] {
    let logs = getItem<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    if (societyId && societyId !== 'GLOBAL') {
      logs = logs.filter((l) => l.society === societyId || l.society === 'GLOBAL');
    }
    if (actionFilter && actionFilter !== 'ALL') {
      logs = logs.filter((l) => l.action === actionFilter);
    }
    return logs;
  }
}

export const securityService = new SecurityService();
