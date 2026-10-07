import type {
  ChildProfile,
  AuthorizedPickupPerson,
  ChildPickupQR,
  PickupLog,
  ChildSafetyAlert,
  Guardian,
  EmergencyContact
} from '../types/childSafety';
import { childRepository } from '../repositories/childSafety/ChildRepository';
import { societyService } from './societyService';
import { db } from './db';

const CHILDREN_STORAGE_KEY = 'communityos_children_profiles';
const QR_PASSES_STORAGE_KEY = 'communityos_child_pickup_qrs';
const PICKUP_LOGS_STORAGE_KEY = 'communityos_child_pickup_logs';
const SAFETY_ALERTS_STORAGE_KEY = 'communityos_child_safety_alerts';

const SEED_CHILDREN: Omit<ChildProfile, 'societyId'>[] = [
  {
    id: 'child-1',
    flatNumber: 'A-101',
    fullName: 'Aarav Sharma',
    dateOfBirth: '2018-05-14',
    gender: 'MALE',
    photoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80',
    medicalNotes: 'Mild peanut allergy. Carries EpiPen.',
    status: 'SAFE',
    guardians: [
      {
        id: 'g-1',
        name: 'Rahul Sharma',
        relationship: 'Father',
        phone: '+91 98765 43210',
        email: 'rahul.sharma@example.com',
        isPrimary: true
      },
      {
        id: 'g-2',
        name: 'Priya Sharma',
        relationship: 'Mother',
        phone: '+91 98765 43211',
        email: 'priya.sharma@example.com',
        isPrimary: false
      }
    ],
    emergencyContacts: [
      {
        id: 'ec-1',
        name: 'Ramesh Sharma',
        relationship: 'Grandfather',
        phone: '+91 98111 22233'
      }
    ],
    authorizedPickups: [
      {
        id: 'app-1',
        childId: 'child-1',
        name: 'Sunita Devi',
        phone: '+91 98990 11223',
        relationship: 'Family Nanny / Caretaker',
        idProofType: 'Aadhaar Card',
        idProofNumber: 'XXXX-XXXX-4589',
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        status: 'ACTIVE',
        validUntil: '2027-12-31',
        createdAt: new Date().toISOString()
      },
      {
        id: 'app-2',
        childId: 'child-1',
        name: 'Vikas Kumar',
        phone: '+91 97112 33445',
        relationship: 'School Van Driver (Cab #4)',
        idProofType: 'Driving License',
        idProofNumber: 'DL-04201998765',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        status: 'ACTIVE',
        validUntil: '2026-12-31',
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'child-2',
    flatNumber: 'B-302',
    fullName: 'Ananya Verma',
    dateOfBirth: '2020-09-21',
    gender: 'FEMALE',
    photoUrl: 'https://images.unsplash.com/photo-1595454223600-91fbddbbf255?auto=format&fit=crop&w=400&q=80',
    medicalNotes: 'Asthma - inhaler kept in school bag',
    status: 'SAFE',
    guardians: [
      {
        id: 'g-3',
        name: 'Vikram Verma',
        relationship: 'Father',
        phone: '+91 98100 55443',
        email: 'vikram.v@example.com',
        isPrimary: true
      }
    ],
    emergencyContacts: [
      {
        id: 'ec-2',
        name: 'Meena Verma',
        relationship: 'Aunt',
        phone: '+91 99887 76655'
      }
    ],
    authorizedPickups: [
      {
        id: 'app-3',
        childId: 'child-2',
        name: 'Kavita Roy',
        phone: '+91 98444 33221',
        relationship: 'Tutor / Babysitter',
        idProofType: 'Voter ID',
        idProofNumber: 'ABC1234567',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'child-3',
    flatNumber: 'B-1204',
    fullName: 'Rhea Kulkarni',
    dateOfBirth: '2019-03-12',
    gender: 'FEMALE',
    photoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80',
    medicalNotes: 'No known allergies. Blood Group O+.',
    status: 'SAFE',
    guardians: [
      {
        id: 'g-5',
        name: 'Sarvesh Kulkarni',
        relationship: 'Father',
        phone: '+91 98765 43210',
        email: 'sarvesh@greenvalley.com',
        isPrimary: true
      },
      {
        id: 'g-6',
        name: 'Sneha Kulkarni',
        relationship: 'Mother',
        phone: '+91 98765 43219',
        email: 'sneha.k@example.com',
        isPrimary: false
      }
    ],
    emergencyContacts: [
      {
        id: 'ec-3',
        name: 'Anand Kulkarni',
        relationship: 'Grandfather',
        phone: '+91 98200 44556'
      }
    ],
    authorizedPickups: [
      {
        id: 'app-5',
        childId: 'child-3',
        name: 'Radha Bai',
        phone: '+91 98199 88776',
        relationship: 'Trusted Family Maid / Nanny',
        idProofType: 'Aadhaar Card',
        idProofNumber: 'XXXX-XXXX-9901',
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        status: 'ACTIVE',
        validUntil: '2027-12-31',
        createdAt: new Date().toISOString()
      },
      {
        id: 'app-6',
        childId: 'child-3',
        name: 'Santosh Yadav',
        phone: '+91 98333 22110',
        relationship: 'School Bus Driver (Route 12)',
        idProofType: 'Commercial Driving License',
        idProofNumber: 'DL-MH02-2018-9182',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        status: 'ACTIVE',
        validUntil: '2026-12-31',
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class ChildSafetyService {
  // --- CHILDREN PROFILES ---
  getChildren(societyId: string): ChildProfile[] {
    const raw = localStorage.getItem(CHILDREN_STORAGE_KEY);
    let items: ChildProfile[] = raw ? JSON.parse(raw) : [];

    // Canonical Source of Truth: Get all family members registered with relationship === 'CHILD'
    const familyMembers = societyService.getFamilyMembers(societyId);
    const familyChildren = familyMembers.filter(f => f.relationship.toUpperCase() === 'CHILD');
    const residents = db.getResidents();
    const flats = db.getFlats();

    const mergedChildren: ChildProfile[] = [];

    // Map each family child member into a ChildProfile
    for (const famChild of familyChildren) {
      const existing = items.find(c => c.id === famChild.id || c.fullName.toLowerCase() === famChild.name.toLowerCase());
      const resident = residents.find(r => r.id === famChild.residentId);
      const flat = flats.find(f => f.id === famChild.flatId);
      const flatCode = flat?.flatNumber || (resident ? resident.flatCode.replace(/^.*·\s*/, '') : 'B-1204');

      if (existing) {
        mergedChildren.push({
          ...existing,
          id: famChild.id,
          fullName: famChild.name,
          flatNumber: flatCode,
          societyId,
        });
      } else {
        const seedMatch = SEED_CHILDREN.find(s => s.fullName.toLowerCase().includes(famChild.name.toLowerCase().split(' ')[0])) || SEED_CHILDREN[0];
        const newChildProfile: ChildProfile = {
          id: famChild.id,
          societyId,
          flatNumber: flatCode,
          fullName: famChild.name,
          dateOfBirth: seedMatch?.dateOfBirth || '2018-05-14',
          gender: seedMatch?.gender || 'MALE',
          photoUrl: seedMatch?.photoUrl,
          medicalNotes: seedMatch?.medicalNotes || 'No known allergies. Blood Group O+.',
          status: 'SAFE',
          guardians: [
            {
              id: `g-${famChild.residentId}`,
              name: resident?.name || 'Primary Guardian',
              relationship: 'Parent / Guardian',
              phone: resident?.phone || '+91 98765 43210',
              email: resident?.email,
              isPrimary: true
            }
          ],
          emergencyContacts: seedMatch?.emergencyContacts || [],
          authorizedPickups: seedMatch?.authorizedPickups || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        mergedChildren.push(newChildProfile);
      }
    }

    // Preserve any existing demo profiles for fallback
    for (const seedItem of SEED_CHILDREN) {
      if (!mergedChildren.some(c => c.fullName.toLowerCase() === seedItem.fullName.toLowerCase())) {
        mergedChildren.push({ ...seedItem, societyId });
      }
    }

    localStorage.setItem(CHILDREN_STORAGE_KEY, JSON.stringify(mergedChildren));
    return mergedChildren;
  }

  saveChildProfile(profile: ChildProfile): ChildProfile {
    const raw = localStorage.getItem(CHILDREN_STORAGE_KEY);
    let items: ChildProfile[] = raw ? JSON.parse(raw) : [];

    const index = items.findIndex(c => c.id === profile.id);
    const updated = { ...profile, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      items[index] = updated;
    } else {
      items.unshift(updated);
    }

    localStorage.setItem(CHILDREN_STORAGE_KEY, JSON.stringify(items));
    childRepository.create(updated).catch(() => {});
    return updated;
  }

  createChildProfile(
    societyId: string,
    flatNumber: string,
    fullName: string,
    dateOfBirth: string,
    gender: ChildProfile['gender'],
    guardians: Guardian[],
    emergencyContacts: EmergencyContact[],
    medicalNotes?: string,
    photoUrl?: string
  ): ChildProfile {
    const newChild: ChildProfile = {
      id: `child-${Date.now()}`,
      societyId,
      flatNumber,
      fullName,
      dateOfBirth,
      gender,
      medicalNotes,
      photoUrl,
      status: 'SAFE',
      guardians,
      emergencyContacts,
      authorizedPickups: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.saveChildProfile(newChild);
  }

  addAuthorizedPickupPerson(
    societyId: string,
    childId: string,
    name: string,
    phone: string,
    relationship: string,
    idProofType: string,
    idProofNumber: string,
    validUntil?: string
  ): ChildProfile {
    const children = this.getChildren(societyId);
    const child = children.find(c => c.id === childId);
    if (!child) throw new Error('Child profile not found');

    const newPickup: AuthorizedPickupPerson = {
      id: `app-${Date.now()}`,
      childId,
      name,
      phone,
      relationship,
      idProofType,
      idProofNumber,
      status: 'ACTIVE',
      validUntil,
      createdAt: new Date().toISOString()
    };

    child.authorizedPickups.push(newPickup);
    return this.saveChildProfile(child);
  }

  revokeAuthorizedPickupPerson(societyId: string, childId: string, pickupPersonId: string): ChildProfile {
    const children = this.getChildren(societyId);
    const child = children.find(c => c.id === childId);
    if (!child) throw new Error('Child profile not found');

    const target = child.authorizedPickups.find(p => p.id === pickupPersonId);
    if (target) {
      target.status = 'REVOKED';
    }

    return this.saveChildProfile(child);
  }

  // --- QR PASS GENERATION & VERIFICATION ---
  getPickupQRs(societyId: string): ChildPickupQR[] {
    const raw = localStorage.getItem(QR_PASSES_STORAGE_KEY);
    const items: ChildPickupQR[] = raw ? JSON.parse(raw) : [];
    return items.filter(q => q.societyId === societyId);
  }

  generatePickupQR(
    societyId: string,
    childId: string,
    pickupPersonId: string,
    validFrom: string,
    validUntil: string,
    maxUses: number = 1
  ): ChildPickupQR {
    const children = this.getChildren(societyId);
    const child = children.find(c => c.id === childId);
    if (!child) throw new Error('Child not found');

    const pickupPerson = child.authorizedPickups.find(p => p.id === pickupPersonId);
    if (!pickupPerson) throw new Error('Authorized pickup person not found');

    if (pickupPerson.status !== 'ACTIVE') {
      throw new Error('Cannot generate QR pass for a revoked or inactive pickup person');
    }

    const qrCode = `CP-QR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newQR: ChildPickupQR = {
      id: `qr-${Date.now()}`,
      qrCode,
      societyId,
      childId,
      childName: child.fullName,
      flatNumber: child.flatNumber,
      pickupPersonId: pickupPerson.id,
      pickupPersonName: pickupPerson.name,
      validFrom,
      validUntil,
      maxUses,
      currentUses: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem(QR_PASSES_STORAGE_KEY);
    const qrs: ChildPickupQR[] = raw ? JSON.parse(raw) : [];
    qrs.unshift(newQR);
    localStorage.setItem(QR_PASSES_STORAGE_KEY, JSON.stringify(qrs));

    return newQR;
  }

  verifyAndScanChildPickup(
    societyId: string,
    qrCodeStr: string,
    securityGuardId: string = 'guard-1',
    gateId: string = 'Main Gate 1'
  ): { allowed: boolean; message: string; child?: ChildProfile; pickupPersonName?: string; log?: PickupLog } {
    const qrs = this.getPickupQRs(societyId);
    const qrPass = qrs.find(q => q.qrCode === qrCodeStr);

    const children = this.getChildren(societyId);

    if (!qrPass) {
      return { allowed: false, message: 'Invalid or unknown Child Pickup QR Code' };
    }

    const child = children.find(c => c.id === qrPass.childId);
    if (!child) return { allowed: false, message: 'Child profile linked to QR pass no longer exists' };

    // 1. Check Missing Alert Flag
    if (child.status === 'MISSING') {
      const alertLog = this.addPickupLog(
        societyId,
        child.id,
        child.fullName,
        child.flatNumber,
        qrPass.pickupPersonName,
        'CRITICAL ALERT: Child is flagged MISSING! Exit blocked immediately.',
        'MISSING_ALERT_FLAGGED',
        securityGuardId,
        gateId
      );
      return {
        allowed: false,
        message: '🚨 CRITICAL SAFETY ALERT: This child is flagged as MISSING! Gate exit is BLOCKED. Security notified immediately.',
        child,
        pickupPersonName: qrPass.pickupPersonName,
        log: alertLog
      };
    }

    // 2. Check QR Status
    if (qrPass.status !== 'ACTIVE') {
      return { allowed: false, message: `QR pass is ${qrPass.status.toLowerCase()}`, child };
    }

    // 3. Check Date Validity
    const nowISO = new Date().toISOString();
    if (nowISO < qrPass.validFrom || nowISO > qrPass.validUntil) {
      return { allowed: false, message: 'QR pass has expired or is not yet valid', child };
    }

    // 4. Check Usage Count
    if (qrPass.currentUses >= qrPass.maxUses) {
      return { allowed: false, message: 'QR pass usage limit has been exhausted', child };
    }

    // Update QR usage
    qrPass.currentUses += 1;
    if (qrPass.currentUses >= qrPass.maxUses) {
      qrPass.status = 'USED';
    }
    const rawQRs = localStorage.getItem(QR_PASSES_STORAGE_KEY);
    let allQRs: ChildPickupQR[] = rawQRs ? JSON.parse(rawQRs) : [];
    const idx = allQRs.findIndex(q => q.id === qrPass.id);
    if (idx >= 0) allQRs[idx] = qrPass;
    localStorage.setItem(QR_PASSES_STORAGE_KEY, JSON.stringify(allQRs));

    // Update child status to OUT_OF_SOCIETY
    child.status = 'OUT_OF_SOCIETY';
    this.saveChildProfile(child);

    // Record Log
    const successLog = this.addPickupLog(
      societyId,
      child.id,
      child.fullName,
      child.flatNumber,
      qrPass.pickupPersonName,
      `Child pickup verified & permitted for ${qrPass.pickupPersonName}`,
      'ALLOWED',
      securityGuardId,
      gateId
    );

    return {
      allowed: true,
      message: `Pickup verified! ${child.fullName} is authorized to exit with ${qrPass.pickupPersonName}. Guardian notified.`,
      child,
      pickupPersonName: qrPass.pickupPersonName,
      log: successLog
    };
  }

  // --- LOGS & SAFETY ALERTS ---
  getPickupLogs(societyId: string): PickupLog[] {
    const raw = localStorage.getItem(PICKUP_LOGS_STORAGE_KEY);
    const items: PickupLog[] = raw ? JSON.parse(raw) : [];
    return items.filter(l => l.societyId === societyId);
  }

  private addPickupLog(
    societyId: string,
    childId: string,
    childName: string,
    flatNumber: string,
    pickupPersonName: string,
    notes: string,
    status: PickupLog['status'],
    securityGuardId: string,
    gateId: string
  ): PickupLog {
    const newLog: PickupLog = {
      id: `log-${Date.now()}`,
      societyId,
      childId,
      childName,
      flatNumber,
      pickupPersonName,
      pickupPersonPhone: '+91 N/A',
      timestamp: new Date().toISOString(),
      gateId,
      securityGuardId,
      status,
      notes
    };

    const raw = localStorage.getItem(PICKUP_LOGS_STORAGE_KEY);
    const items: PickupLog[] = raw ? JSON.parse(raw) : [];
    items.unshift(newLog);
    localStorage.setItem(PICKUP_LOGS_STORAGE_KEY, JSON.stringify(items));
    return newLog;
  }

  getSafetyAlerts(societyId: string): ChildSafetyAlert[] {
    const raw = localStorage.getItem(SAFETY_ALERTS_STORAGE_KEY);
    const items: ChildSafetyAlert[] = raw ? JSON.parse(raw) : [];
    return items.filter(a => a.societyId === societyId);
  }

  triggerMissingChildAlert(societyId: string, childId: string, reportedBy: string): ChildSafetyAlert {
    const children = this.getChildren(societyId);
    const child = children.find(c => c.id === childId);
    if (!child) throw new Error('Child profile not found');

    child.status = 'MISSING';
    this.saveChildProfile(child);

    const newAlert: ChildSafetyAlert = {
      id: `alert-${Date.now()}`,
      societyId,
      childId: child.id,
      childName: child.fullName,
      flatNumber: child.flatNumber,
      alertType: 'MISSING_CHILD',
      message: `🚨 MISSING CHILD BROADCAST: ${child.fullName} (Flat ${child.flatNumber}) reported missing by ${reportedBy}! All security gates locked down.`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem(SAFETY_ALERTS_STORAGE_KEY);
    const items: ChildSafetyAlert[] = raw ? JSON.parse(raw) : [];
    items.unshift(newAlert);
    localStorage.setItem(SAFETY_ALERTS_STORAGE_KEY, JSON.stringify(items));

    return newAlert;
  }

  resolveSafetyAlert(societyId: string, alertId: string, resolvedBy: string): ChildSafetyAlert {
    const raw = localStorage.getItem(SAFETY_ALERTS_STORAGE_KEY);
    let items: ChildSafetyAlert[] = raw ? JSON.parse(raw) : [];

    const index = items.findIndex(a => a.id === alertId && a.societyId === societyId);
    if (index === -1) throw new Error('Alert not found');

    items[index].status = 'RESOLVED';
    items[index].resolvedAt = new Date().toISOString();
    items[index].resolvedBy = resolvedBy;

    // Reset child status to SAFE
    const children = this.getChildren(societyId);
    const child = children.find(c => c.id === items[index].childId);
    if (child) {
      child.status = 'SAFE';
      this.saveChildProfile(child);
    }

    localStorage.setItem(SAFETY_ALERTS_STORAGE_KEY, JSON.stringify(items));
    return items[index];
  }
}

export const childSafetyService = new ChildSafetyService();
