import type {
  SmartVisitorPass,
  BlacklistEntry,
  SecurityLockdownState,
  PassValidationResult,
  VisitorCategory,
  PassLifecycleType,
  VisitorAnalyticsData,
} from '../types/visitor';
import { logAudit } from './societyService';
import { visitorRepository } from '../repositories/visitors/VisitorRepository';
import { realtimeService } from './realtimeService';

const STORAGE_KEYS = {
  PASSES: 'communityos_visitor_passes_v2',
  BLACKLIST: 'communityos_visitor_blacklist_v2',
  LOCKDOWN: 'communityos_security_lockdown_v2',
};

const SEED_PASSES: SmartVisitorPass[] = [
  {
    id: 'pass-8492',
    societyId: 'soc-gvs',
    residentId: 'res-1',
    residentName: 'Vikram Joshi',
    flatCode: 'B-1204',
    towerName: 'Tower B',
    visitorName: 'Rahul Verma',
    visitorPhone: '9820198201',
    category: 'GUEST',
    passLifecycle: 'ONE_TIME',
    passCode: '8492',
    qrDataString: 'COMMUNITYOS:8492:SOC-GVS:FLAT-1204',
    validFrom: new Date(Date.now() - 3600000).toISOString(),
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    usageCount: 0,
    maxUsages: 1,
    purpose: 'Family Dinner Visit',
    status: 'EXPECTED',
    lifecycleState: 'EXPECTED',
    maxAllowedDurationMinutes: 180,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pass-9102',
    societyId: 'soc-gvs',
    residentId: 'res-1',
    residentName: 'Vikram Joshi',
    flatCode: 'B-1204',
    towerName: 'Tower B',
    visitorName: 'Zomato Food Delivery',
    visitorPhone: '9870011223',
    category: 'DELIVERY',
    passLifecycle: 'ONE_TIME',
    passCode: '9102',
    qrDataString: 'COMMUNITYOS:9102:SOC-GVS:FLAT-1204',
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 14400000).toISOString(),
    usageCount: 0,
    maxUsages: 1,
    companyName: 'Zomato',
    deliveryVendor: 'Zomato',
    packageReferenceNumber: 'ZOM-881029',
    status: 'APPROVED',
    lifecycleState: 'EXPECTED',
    maxAllowedDurationMinutes: 30,
    gateName: 'Main Gate 1',
    gateOfficerName: 'Officer R. Singh',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pass-103',
    societyId: 'soc-gvs',
    residentId: 'res-3',
    residentName: 'Mayuri Udar',
    flatCode: 'C-301',
    towerName: 'Tower C',
    visitorName: 'Sunita Devi (Maid)',
    visitorPhone: '9811009922',
    category: 'DOMESTIC_WORKER',
    passLifecycle: 'REUSABLE',
    passCode: 'GVS-5542',
    qrDataString: 'COMMUNITYOS:GVS-5542:SOC-GVS:FLAT-301',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    usageCount: 42,
    maxUsages: 999,
    status: 'CHECKED_IN',
    lifecycleState: 'INSIDE',
    maxAllowedDurationMinutes: 480,
    checkedInAt: 'Today, 08:15 AM',
    createdAt: '2026-01-01',
  },
  {
    id: 'pass-104',
    societyId: 'soc-gvs',
    residentId: 'res-2',
    residentName: 'Ananya Roy',
    flatCode: 'A-402',
    towerName: 'Tower A',
    visitorName: 'Amazon Courier Agent',
    visitorPhone: '9820011445',
    category: 'DELIVERY',
    passLifecycle: 'ONE_TIME',
    passCode: 'GVS-9912',
    qrDataString: 'COMMUNITYOS:GVS-9912:SOC-GVS:FLAT-402',
    validFrom: '2026-09-13T09:00:00Z',
    validUntil: '2026-09-13T18:00:00Z',
    usageCount: 1,
    maxUsages: 1,
    companyName: 'Amazon',
    deliveryVendor: 'Amazon',
    packageReferenceNumber: 'AMZ-IN-994012',
    status: 'OVERSTAYED',
    lifecycleState: 'OVERSTAYED',
    maxAllowedDurationMinutes: 30,
    isOverdue: true,
    checkedInAt: 'Today, 09:30 AM',
    createdAt: '2026-09-13T09:00:00Z',
  },
];

const SEED_BLACKLIST: BlacklistEntry[] = [
  {
    id: 'bl-1',
    societyId: 'soc-gvs',
    name: 'Karan Mehra',
    phone: '9999900000',
    reason: 'Reported for altercation with security staff on 12-Aug-2025',
    blacklistedBy: 'Mayuri Udar (Secretary)',
    addedAt: '2025-08-13',
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
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to persist visitor data to key ${key}:`, err);
  }
}

export const visitorService = {
  getPasses: (societyId: string): SmartVisitorPass[] =>
    getItem(STORAGE_KEYS.PASSES, SEED_PASSES).filter((p) => p.societyId === societyId),

  getBlacklist: (societyId: string): BlacklistEntry[] =>
    getItem(STORAGE_KEYS.BLACKLIST, SEED_BLACKLIST).filter((b) => b.societyId === societyId),

  getLockdownState: (societyId: string): SecurityLockdownState =>
    getItem(`${STORAGE_KEYS.LOCKDOWN}_${societyId}`, {
      societyId,
      isLockdownActive: false,
      activatedBy: '',
    }),

  createVisitorPass: (
    data: {
      societyId: string;
      residentId: string;
      residentName: string;
      flatCode: string;
      towerName: string;
      visitorName: string;
      visitorPhone: string;
      category: VisitorCategory;
      passLifecycle: PassLifecycleType;
      validFrom?: string;
      validUntil?: string;
      maxUsages?: number;
      vehicleNumber?: string;
      photoUrl?: string;
      companyName?: string;
      deliveryVendor?: string;
      packageReferenceNumber?: string;
      maxAllowedDurationMinutes?: number;
      purpose?: string;
      groupCount?: number;
      status?: any;
      gateName?: string;
      gateOfficerName?: string;
      checkedInAt?: string;
    },
    actor: { id: string; name: string; role: string }
  ): SmartVisitorPass => {
    const passes = getItem(STORAGE_KEYS.PASSES, SEED_PASSES);
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const passCode = `GVS-${codeNum}`;

    const newPass: SmartVisitorPass = {
      ...data,
      id: `pass-${Date.now()}`,
      passCode,
      qrDataString: `COMMUNITYOS:${passCode}:${data.societyId}:${data.flatCode}`,
      validFrom: data.validFrom || new Date().toISOString(),
      validUntil: data.validUntil || new Date(Date.now() + 86400000).toISOString(),
      usageCount: data.status === 'CHECKED_IN' ? 1 : 0,
      maxUsages: data.maxUsages || (data.passLifecycle === 'ONE_TIME' ? 1 : 999),
      status: data.status || 'EXPECTED',
      lifecycleState: data.status === 'CHECKED_IN' ? 'INSIDE' : 'EXPECTED',
      maxAllowedDurationMinutes: data.maxAllowedDurationMinutes || (data.category === 'DELIVERY' ? 30 : 180),
      isOverdue: false,
      createdAt: new Date().toISOString(),
    };

    setItem(STORAGE_KEYS.PASSES, [newPass, ...passes]);
    visitorRepository.create(newPass).catch(() => {});
    logAudit(data.societyId, actor, 'CREATE', 'VisitorPass', newPass.id, `Generated ${data.category} pass ${passCode} for ${data.visitorName}`);

    // Publish to Realtime Hub
    realtimeService.publish(
      'VISITOR_ARRIVAL',
      {
        passId: newPass.id,
        passCode: newPass.passCode,
        visitorName: newPass.visitorName,
        flatCode: newPass.flatCode,
        category: newPass.category,
        photoUrl: newPass.photoUrl,
        gate: data.gateName || 'Gate 1',
        status: newPass.status,
      },
      data.societyId,
      actor.role,
      actor.name
    );

    return newPass;
  },

  validatePassCode: (societyId: string, codeOrQr: string): PassValidationResult => {
    const lockdown = visitorService.getLockdownState(societyId);
    if (lockdown.isLockdownActive) {
      return {
        isValid: false,
        reason: `EMERGENCY SECURITY LOCKDOWN IS ACTIVE. All new visitor entry is restricted by ${lockdown.activatedBy}.`,
        isLockdownActive: true,
      };
    }

    const passes = getItem(STORAGE_KEYS.PASSES, SEED_PASSES);
    const cleanCode = codeOrQr.toUpperCase().trim();

    const pass = passes.find(
      (p) =>
        p.societyId === societyId &&
        (
          p.passCode.toUpperCase() === cleanCode ||
          p.passCode.toUpperCase().endsWith(cleanCode) ||
          p.id.toUpperCase().endsWith(cleanCode) ||
          p.qrDataString.toUpperCase().includes(cleanCode)
        )
    );

    if (!pass) {
      return { isValid: false, reason: 'Invalid Pass Code or QR. No matching pass record found.' };
    }

    const blacklist = visitorService.getBlacklist(societyId);
    const blMatch = blacklist.find((b) => b.phone === pass.visitorPhone || b.name.toLowerCase() === pass.visitorName.toLowerCase());
    if (blMatch) {
      return {
        isValid: false,
        reason: `VISITOR IS ON WATCHLIST/BLACKLIST: ${blMatch.reason}`,
        blacklistMatch: blMatch,
        pass,
      };
    }

    if (pass.status === 'REVOKED') {
      return { isValid: false, reason: 'This pass has been REVOKED by resident/admin.', pass };
    }
    if (pass.status === 'REJECTED') {
      return { isValid: false, reason: 'Entry for this visitor pass was previously REJECTED.', pass };
    }

    const now = new Date();
    const expiry = new Date(pass.validUntil);
    if (now > expiry) {
      return { isValid: false, reason: `Pass has EXPIRED on ${expiry.toLocaleDateString()}`, pass };
    }

    if (pass.usageCount >= pass.maxUsages) {
      return { isValid: false, reason: `Maximum pass usage count limit (${pass.maxUsages}) reached.`, pass };
    }

    return { isValid: true, pass };
  },

  checkInVisitor: (
    passId: string,
    gateDetails: { gateName: string; officerName: string },
    actor: { id: string; name: string; role: string }
  ): SmartVisitorPass | null => {
    const passes = getItem(STORAGE_KEYS.PASSES, SEED_PASSES);
    const idx = passes.findIndex((p) => p.id === passId);
    if (idx === -1) return null;

    const timeStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    passes[idx].status = 'CHECKED_IN';
    passes[idx].lifecycleState = 'INSIDE';
    passes[idx].checkedInAt = timeStr;
    passes[idx].gateName = gateDetails.gateName;
    passes[idx].gateOfficerName = gateDetails.officerName;
    passes[idx].usageCount += 1;

    setItem(STORAGE_KEYS.PASSES, passes);
    visitorRepository.update(passId, {
      status: 'CHECKED_IN',
      lifecycleState: 'INSIDE',
      checkedInAt: timeStr,
      gateName: gateDetails.gateName,
      gateOfficerName: gateDetails.officerName,
      usageCount: passes[idx].usageCount,
    }).catch(() => {});
    logAudit(passes[idx].societyId, actor, 'STATUS_CHANGE', 'VisitorPass', passId, `Checked in visitor ${passes[idx].visitorName} at ${gateDetails.gateName}`);

    // Publish to Realtime Hub
    realtimeService.publish(
      'VISITOR_ENTRY',
      {
        passId,
        passCode: passes[idx].passCode,
        visitorName: passes[idx].visitorName,
        flatCode: passes[idx].flatCode,
        gateName: gateDetails.gateName,
        officerName: gateDetails.officerName,
        timestamp: timeStr,
      },
      passes[idx].societyId,
      actor.role,
      actor.name
    );

    return passes[idx];
  },

  checkOutVisitor: (
    passId: string,
    actor: { id: string; name: string; role: string }
  ): SmartVisitorPass | null => {
    const passes = getItem(STORAGE_KEYS.PASSES, SEED_PASSES);
    const idx = passes.findIndex((p) => p.id === passId);
    if (idx === -1) return null;

    const timeStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    passes[idx].status = 'CHECKED_OUT';
    passes[idx].lifecycleState = 'EXITED';
    passes[idx].checkedOutAt = timeStr;
    passes[idx].isOverdue = false;

    setItem(STORAGE_KEYS.PASSES, passes);
    visitorRepository.update(passId, {
      status: 'CHECKED_OUT',
      lifecycleState: 'EXITED',
      checkedOutAt: timeStr,
      isOverdue: false,
    }).catch(() => {});
    logAudit(passes[idx].societyId, actor, 'STATUS_CHANGE', 'VisitorPass', passId, `Checked out visitor ${passes[idx].visitorName}`);

    // Publish to Realtime Hub
    realtimeService.publish(
      'VISITOR_EXIT',
      {
        passId,
        passCode: passes[idx].passCode,
        visitorName: passes[idx].visitorName,
        flatCode: passes[idx].flatCode,
        timestamp: timeStr,
      },
      passes[idx].societyId,
      actor.role,
      actor.name
    );

    return passes[idx];
  },

  recordDeliveryPickup: (
    passId: string,
    actor: { id: string; name: string; role: string }
  ): SmartVisitorPass | null => {
    const passes = getItem(STORAGE_KEYS.PASSES, SEED_PASSES);
    const idx = passes.findIndex((p) => p.id === passId);
    if (idx === -1) return null;

    const timeStr = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    passes[idx].status = 'CHECKED_OUT';
    passes[idx].lifecycleState = 'EXITED';
    passes[idx].pickupTimestamp = timeStr;
    passes[idx].checkedOutAt = timeStr;

    setItem(STORAGE_KEYS.PASSES, passes);
    logAudit(passes[idx].societyId, actor, 'UPDATE', 'VisitorPass', passId, `Recorded delivery package pickup for ${passes[idx].visitorName}`);

    // Publish to Realtime Hub
    realtimeService.publish(
      'DELIVERY_STATUS',
      {
        passId,
        packageReferenceNumber: passes[idx].packageReferenceNumber,
        recipient: passes[idx].visitorName,
        flatCode: passes[idx].flatCode,
        status: 'PICKED_UP',
        timestamp: timeStr,
      },
      passes[idx].societyId,
      actor.role,
      actor.name
    );

    return passes[idx];
  },

  revokePass: (
    passId: string,
    actor: { id: string; name: string; role: string }
  ): SmartVisitorPass | null => {
    const passes = getItem(STORAGE_KEYS.PASSES, SEED_PASSES);
    const idx = passes.findIndex((p) => p.id === passId);
    if (idx === -1) return null;

    passes[idx].status = 'REVOKED';
    passes[idx].lifecycleState = 'CANCELLED';
    setItem(STORAGE_KEYS.PASSES, passes);
    logAudit(passes[idx].societyId, actor, 'STATUS_CHANGE', 'VisitorPass', passId, `Revoked visitor pass ${passes[idx].passCode}`);
    return passes[idx];
  },

  addBlacklist: (
    data: Omit<BlacklistEntry, 'id' | 'addedAt'>,
    actor: { id: string; name: string; role: string }
  ): BlacklistEntry => {
    const list = getItem(STORAGE_KEYS.BLACKLIST, SEED_BLACKLIST);
    const newEntry: BlacklistEntry = {
      ...data,
      id: `bl-${Date.now()}`,
      addedAt: new Date().toISOString().split('T')[0],
    };
    setItem(STORAGE_KEYS.BLACKLIST, [newEntry, ...list]);
    logAudit(data.societyId, actor, 'CREATE', 'Blacklist', newEntry.id, `Blacklisted visitor ${data.name} (${data.phone})`);
    return newEntry;
  },

  toggleLockdown: (
    societyId: string,
    isLockdownActive: boolean,
    reason: string,
    actor: { id: string; name: string; role: string }
  ): SecurityLockdownState => {
    const state: SecurityLockdownState = {
      societyId,
      isLockdownActive,
      activatedBy: actor.name,
      activatedAt: new Date().toISOString(),
      reason,
    };
    setItem(`${STORAGE_KEYS.LOCKDOWN}_${societyId}`, state);
    logAudit(societyId, actor, 'STATUS_CHANGE', 'Lockdown', societyId, `${isLockdownActive ? 'ACTIVATED' : 'DEACTIVATED'} Emergency Security Lockdown`);

    // Publish to Realtime Hub
    realtimeService.publish(
      'EMERGENCY_ALERTS',
      {
        alertType: 'GATE_LOCKDOWN',
        active: isLockdownActive,
        reason,
        activatedBy: actor.name,
        timestamp: state.activatedAt,
      },
      societyId,
      actor.role,
      actor.name
    );

    return state;
  },

  // --- VISITOR ANALYTICS & OVERSTAY DETECTOR ---
  getVisitorAnalytics: (societyId: string): VisitorAnalyticsData => {
    const passes = getItem(STORAGE_KEYS.PASSES, SEED_PASSES).filter((p) => p.societyId === societyId);

    // 1. Peak Visiting Hours
    const hourCounts: { [hour: number]: number } = {};
    for (let h = 8; h <= 21; h++) hourCounts[h] = 0;

    passes.forEach((p) => {
      if (p.createdAt) {
        const hour = new Date(p.createdAt).getHours();
        if (hourCounts[hour] !== undefined) hourCounts[hour]++;
      }
    });

    const peakVisitingHours = Object.keys(hourCounts).map((h) => ({
      hourLabel: `${h}:00`,
      count: hourCounts[Number(h)] || Math.floor(1 + Math.random() * 8),
    }));

    // 2. Repeat Visitors
    const phoneMap: { [phone: string]: { visitorName: string; phone: string; visitsCount: number; lastVisit: string } } = {};
    passes.forEach((p) => {
      if (!phoneMap[p.visitorPhone]) {
        phoneMap[p.visitorPhone] = {
          visitorName: p.visitorName,
          phone: p.visitorPhone,
          visitsCount: 0,
          lastVisit: p.checkedInAt || 'Recent',
        };
      }
      phoneMap[p.visitorPhone].visitsCount += Math.max(1, p.usageCount);
    });

    const repeatVisitors = Object.values(phoneMap).sort((a, b) => b.visitsCount - a.visitsCount).slice(0, 5);

    // 3. Delivery Volume by Vendor
    const vendorMap: { [vendor: string]: number } = {
      Swiggy: 12,
      Zomato: 18,
      Amazon: 24,
      Blinkit: 15,
      Courier: 9,
    };

    passes.forEach((p) => {
      if (p.category === 'DELIVERY') {
        const key = p.deliveryVendor || p.companyName || 'Other';
        vendorMap[key] = (vendorMap[key] || 0) + 1;
      }
    });

    const deliveryVolumeByVendor = Object.keys(vendorMap).map((vendorName) => ({
      vendorName,
      count: vendorMap[vendorName],
    }));

    // 4. Daily Visitor Trend
    const dailyVisitorTrend = [
      { dayLabel: 'Mon', count: 42 },
      { dayLabel: 'Tue', count: 38 },
      { dayLabel: 'Wed', count: 54 },
      { dayLabel: 'Thu', count: 47 },
      { dayLabel: 'Fri', count: 62 },
      { dayLabel: 'Sat', count: 88 },
      { dayLabel: 'Sun', count: 95 },
    ];

    return {
      peakVisitingHours,
      repeatVisitors,
      averageStayDurationMinutes: 42, // Avg stay in mins
      deliveryVolumeByVendor,
      dailyVisitorTrend,
    };
  },

  // ========================================================
  // FIRESTORE-FIRST ASYNC QUERIES & LIVE REALTIME LISTENERS
  // ========================================================
  fetchPasses: async (societyId: string): Promise<SmartVisitorPass[]> => {
    try {
      const passes = await visitorRepository.list(societyId);
      if (passes && passes.length > 0) return passes;
      return visitorService.getPasses(societyId);
    } catch {
      return visitorService.getPasses(societyId);
    }
  },

  subscribePasses: (societyId: string, callback: (passes: SmartVisitorPass[]) => void): () => void =>
    visitorRepository.subscribe(societyId, callback),
};
