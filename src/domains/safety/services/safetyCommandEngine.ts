import type { EmergencyIncidentItem, EmergencyCategory, ChildProfileItem, PickupRecord, AuthorizedPickupPerson } from '../types/index';
import { realTimeSync } from '../../../services/realTimeSync';
import { childSafetyService } from '../../../services/childSafetyService';

const cleanEncoding = (str: string): string => {
  return str
    .replace(/Ã¢â‚¬Â¢/g, '·')
    .replace(/Ã¢â‚¬â€œ/g, '–')
    .replace(/â€¢/g, '·')
    .replace(/Â·/g, '·')
    .replace(/Ã¢â€šÂ¹/g, '₹')
    .replace(/â‚¹/g, '₹')
    .replace(/â€”/g, '—')
    .replace(/Ã¢Å“â€¢/g, '✕')
    .replace(/âœ•/g, '✕');
};

const STORAGE_KEY_INCIDENTS = 'aarizo_emergency_incidents_v3';
const STORAGE_KEY_CHILDREN = 'aarizo_child_profiles_v3';
const STORAGE_KEY_PICKUPS = 'aarizo_pickup_records_v3';

// Cleanup legacy corrupted keys from previous versions
try {
  localStorage.removeItem('aarizo_emergency_incidents_v2');
  localStorage.removeItem('aarizo_child_profiles_v2');
  localStorage.removeItem('aarizo_pickup_records_v2');
} catch {}

const INITIAL_INCIDENTS: EmergencyIncidentItem[] = [
  {
    id: 'inc-101',
    societyId: 'soc-1',
    residentId: 'res-1',
    residentName: 'Siddharth Malhotra',
    flatCode: 'A-101',
    phone: '+91 98765 00000',
    category: 'MEDICAL',
    title: 'ONE-TAP SOS: Medical Emergency Reported',
    description: 'Resident triggered Medical SOS from Mobile App.',
    location: 'Tower A, Flat 101',
    status: 'TRIGGERED',
    timeline: [
      {
        id: 'log-1',
        status: 'TRIGGERED',
        timestamp: new Date().toISOString(),
        performedBy: 'Siddharth Malhotra',
        note: 'SOS triggered from resident app. Security & family notified.',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_CHILDREN: ChildProfileItem[] = [
  {
    id: 'child-201',
    societyId: 'soc-1',
    childName: 'Aarav Malhotra',
    flatCode: 'A-101',
    guardianName: 'Siddharth Malhotra',
    guardianPhone: '+91 98765 00000',
    authorizedPickups: [
      {
        id: 'pic-1',
        name: 'Sunita Devi (Nanny)',
        phone: '+91 98765 44444',
        relationship: 'Nanny',
        idProofType: 'Aadhaar',
        idProofNumber: 'XXXX-XXXX-1122',
        isApproved: true,
      },
    ],
    qrPassCode: 'QR-CHILD-AARAV-101',
    createdAt: new Date().toISOString(),
  },
];

class SafetyCommandEngine {
  private getStoredIncidents(): EmergencyIncidentItem[] {
    const raw = localStorage.getItem(STORAGE_KEY_INCIDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(INITIAL_INCIDENTS));
      return INITIAL_INCIDENTS;
    }
    try {
      const sanitized = cleanEncoding(raw);
      return JSON.parse(sanitized);
    } catch {
      return INITIAL_INCIDENTS;
    }
  }

  private saveIncidents(incidents: EmergencyIncidentItem[]) {
    localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(incidents));
    realTimeSync.publish('EMERGENCY_ALERTS', { timestamp: new Date().toISOString() });
  }

  private getStoredChildren(): ChildProfileItem[] {
    const raw = localStorage.getItem(STORAGE_KEY_CHILDREN);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CHILDREN, JSON.stringify(INITIAL_CHILDREN));
      return INITIAL_CHILDREN;
    }
    try {
      const sanitized = cleanEncoding(raw);
      return JSON.parse(sanitized);
    } catch {
      return INITIAL_CHILDREN;
    }
  }

  private saveChildren(children: ChildProfileItem[]) {
    localStorage.setItem(STORAGE_KEY_CHILDREN, JSON.stringify(children));
    realTimeSync.publish('CHILD_SAFETY_UPDATED', { timestamp: new Date().toISOString() });
  }

  private getStoredPickups(): PickupRecord[] {
    const raw = localStorage.getItem(STORAGE_KEY_PICKUPS);
    if (!raw) return [];
    try {
      const sanitized = cleanEncoding(raw);
      return JSON.parse(sanitized);
    } catch {
      return [];
    }
  }

  private savePickups(pickups: PickupRecord[]) {
    localStorage.setItem(STORAGE_KEY_PICKUPS, JSON.stringify(pickups));
    realTimeSync.publish('CHILD_SAFETY_UPDATED', { timestamp: new Date().toISOString() });
  }

  public getIncidents(): EmergencyIncidentItem[] {
    return this.getStoredIncidents();
  }

  public triggerOneTapSOS(
    category: EmergencyCategory,
    residentId: string,
    residentName: string,
    flatCode: string,
    phone: string,
    location: string,
    description?: string
  ): EmergencyIncidentItem {
    const incidents = this.getStoredIncidents();
    const newId = `inc-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newIncident: EmergencyIncidentItem = {
      id: newId,
      societyId: 'soc-1',
      residentId,
      residentName,
      flatCode,
      phone,
      category,
      title: `ONE-TAP SOS: ${category} EMERGENCY`,
      description: description || `One-tap ${category} emergency triggered from Flat ${flatCode}.`,
      location: location || `Flat ${flatCode}`,
      status: 'TRIGGERED',
      timeline: [
        {
          id: `log-${Date.now()}`,
          status: 'TRIGGERED',
          timestamp,
          performedBy: residentName,
          note: `One-Tap SOS dispatched. Security gate post & family members alerted instantly.`,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    incidents.unshift(newIncident);
    this.saveIncidents(incidents);
    return newIncident;
  }

  public acknowledgeIncident(incidentId: string, acknowledgedBy: string): EmergencyIncidentItem | null {
    const incidents = this.getStoredIncidents();
    const index = incidents.findIndex(i => i.id === incidentId);
    if (index === -1) return null;

    const timestamp = new Date().toISOString();
    const incident = incidents[index];

    const updated: EmergencyIncidentItem = {
      ...incident,
      status: 'ACKNOWLEDGED',
      acknowledgedBy,
      acknowledgedAt: timestamp,
      timeline: [
        {
          id: `log-${Date.now()}`,
          status: 'ACKNOWLEDGED',
          timestamp,
          performedBy: acknowledgedBy,
          note: `Security Command acknowledged alert. Dispatching response.`,
        },
        ...incident.timeline,
      ],
      updatedAt: timestamp,
    };

    incidents[index] = updated;
    this.saveIncidents(incidents);
    return updated;
  }

  public assignResponder(incidentId: string, responderName: string, responderRole: string, performedBy: string): EmergencyIncidentItem | null {
    const incidents = this.getStoredIncidents();
    const index = incidents.findIndex(i => i.id === incidentId);
    if (index === -1) return null;

    const timestamp = new Date().toISOString();
    const incident = incidents[index];

    const updated: EmergencyIncidentItem = {
      ...incident,
      status: 'RESPONDING',
      responderName,
      responderRole,
      timeline: [
        {
          id: `log-${Date.now()}`,
          status: 'RESPONDING',
          timestamp,
          performedBy,
          note: `Responder ${responderName} (${responderRole}) assigned & en route.`,
        },
        ...incident.timeline,
      ],
      updatedAt: timestamp,
    };

    incidents[index] = updated;
    this.saveIncidents(incidents);
    return updated;
  }

  public resolveIncident(incidentId: string, status: 'RESOLVED' | 'CLOSED', note: string, performedBy: string): EmergencyIncidentItem | null {
    const incidents = this.getStoredIncidents();
    const index = incidents.findIndex(i => i.id === incidentId);
    if (index === -1) return null;

    const timestamp = new Date().toISOString();
    const incident = incidents[index];

    const updated: EmergencyIncidentItem = {
      ...incident,
      status,
      resolvedAt: timestamp,
      timeline: [
        {
          id: `log-${Date.now()}`,
          status,
          timestamp,
          performedBy,
          note: note || `Incident marked as ${status}.`,
        },
        ...incident.timeline,
      ],
      updatedAt: timestamp,
    };

    incidents[index] = updated;
    this.saveIncidents(incidents);
    return updated;
  }

  // --- CHILD SAFETY API ---
  public getChildren(): ChildProfileItem[] {
    const canonicalChildren = childSafetyService.getChildren('soc-gvs');
    return canonicalChildren.map(c => ({
      id: c.id,
      societyId: c.societyId,
      childName: c.fullName,
      flatCode: c.flatNumber,
      guardianName: c.guardians[0]?.name || 'Guardian',
      guardianPhone: c.guardians[0]?.phone || '+91 98765 43210',
      authorizedPickups: c.authorizedPickups.map(ap => ({
        id: ap.id,
        name: ap.name,
        phone: ap.phone,
        relationship: ap.relationship,
        idProofType: ap.idProofType,
        idProofNumber: ap.idProofNumber,
        photoUrl: ap.photoUrl,
        isApproved: ap.status === 'ACTIVE',
      })),
      qrPassCode: `QR-CHILD-${c.fullName.toUpperCase().replace(/\s+/g, '')}-${c.flatNumber}`,
      createdAt: c.createdAt,
    }));
  }

  public getPickupRecords(): PickupRecord[] {
    return this.getStoredPickups();
  }

  public addChildProfile(childName: string, flatCode: string, guardianName: string, guardianPhone: string): ChildProfileItem {
    const children = this.getStoredChildren();
    const newChild: ChildProfileItem = {
      id: `child-${Date.now()}`,
      societyId: 'soc-1',
      childName,
      flatCode,
      guardianName,
      guardianPhone,
      authorizedPickups: [],
      qrPassCode: `QR-CHILD-${childName.toUpperCase().replace(/\s+/g, '')}-${flatCode}`,
      createdAt: new Date().toISOString(),
    };
    children.unshift(newChild);
    this.saveChildren(children);
    return newChild;
  }

  public addAuthorizedPickup(childId: string, pickup: Omit<AuthorizedPickupPerson, 'id' | 'isApproved'>): ChildProfileItem | null {
    const children = this.getStoredChildren();
    const index = children.findIndex(c => c.id === childId);
    if (index === -1) return null;

    const newPickup: AuthorizedPickupPerson = {
      ...pickup,
      id: `pic-${Date.now()}`,
      isApproved: true,
    };

    const updated: ChildProfileItem = {
      ...children[index],
      authorizedPickups: [...children[index].authorizedPickups, newPickup],
    };

    children[index] = updated;
    this.saveChildren(children);
    return updated;
  }

  public verifyChildPickupAtGate(childNameOrQR: string, pickupPersonName: string, guardName: string): { isValid: boolean; child?: ChildProfileItem; reason?: string } {
    const children = this.getStoredChildren();
    const child = children.find(
      c => c.childName.toLowerCase().includes(childNameOrQR.toLowerCase()) || c.qrPassCode === childNameOrQR
    );

    if (!child) {
      return { isValid: false, reason: `No registered child found matching "${childNameOrQR}".` };
    }

    const authorized = child.authorizedPickups.find(
      (p: AuthorizedPickupPerson) => p.name.toLowerCase().includes(pickupPersonName.toLowerCase()) && p.isApproved
    );

    const pickups = this.getStoredPickups();
    const timestamp = new Date().toISOString();

    if (!authorized) {
      pickups.unshift({
        id: `pick-${Date.now()}`,
        childId: child.id,
        childName: child.childName,
        flatCode: child.flatCode,
        pickupPersonName,
        pickupPersonPhone: 'UNAUTHORIZED',
        verifiedByGuard: guardName,
        timestamp,
        status: 'DENIED',
      });
      this.savePickups(pickups);

      return {
        isValid: false,
        child,
        reason: `DENIED: Person "${pickupPersonName}" is NOT in guardian's approved pickup list. Guardian notified!`,
      };
    }

    pickups.unshift({
      id: `pick-${Date.now()}`,
      childId: child.id,
      childName: child.childName,
      flatCode: child.flatCode,
      pickupPersonName: authorized.name,
      pickupPersonPhone: authorized.phone,
      verifiedByGuard: guardName,
      timestamp,
      status: 'GATE_CLEARED',
    });
    this.savePickups(pickups);

    return { isValid: true, child };
  }
}

export const safetyCommandEngine = new SafetyCommandEngine();
