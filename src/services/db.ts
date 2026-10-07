import type {
  Society,
  Tower,
  Flat,
  Resident,
  FamilyMember,
  Vehicle,
  Staff,
  Vendor,
  DomesticWorker,
  AuditLog,
} from '../types/society';

const STORAGE_KEYS = {
  SOCIETIES: 'communityos_societies_v1',
  TOWERS: 'communityos_towers_v1',
  FLATS: 'communityos_flats_v1',
  RESIDENTS: 'communityos_residents_v1',
  FAMILY_MEMBERS: 'communityos_family_members_v1',
  VEHICLES: 'communityos_vehicles_v1',
  STAFF: 'communityos_staff_v1',
  VENDORS: 'communityos_vendors_v1',
  DOMESTIC_WORKERS: 'communityos_domestic_workers_v1',
  AUDIT_LOGS: 'communityos_audit_logs_v1',
};

// Seed Data Initialization
const SEED_SOCIETIES: Society[] = [
  {
    id: 'soc-gvs',
    name: 'Green Valley Society',
    code: 'GVS-01',
    address: 'Plot 42, Off Link Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    status: 'ACTIVE',
    subscriptionTier: 'PRO',
    adminId: 'user-sec-1',
    adminName: 'Mayuri Udar',
    adminEmail: 'mayuri.sec@greenvalley.org',
    totalTowers: 3,
    totalFlats: 240,
    createdAt: '2025-01-15',
  },
  {
    id: 'soc-royal',
    name: 'Royal Palms Residency',
    code: 'RPR-02',
    address: 'Central Avenue, Powai',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400076',
    status: 'ACTIVE',
    subscriptionTier: 'ENTERPRISE',
    adminId: 'user-sec-2',
    adminName: 'Rajesh Malhotra',
    adminEmail: 'admin@royalpalms.com',
    totalTowers: 5,
    totalFlats: 500,
    createdAt: '2025-03-10',
  },
];

const SEED_TOWERS: Tower[] = [
  { id: 'tow-a', societyId: 'soc-gvs', name: 'Tower A', blockCode: 'A', totalFloors: 12, totalFlats: 48 },
  { id: 'tow-b', societyId: 'soc-gvs', name: 'Tower B', blockCode: 'B', totalFloors: 14, totalFlats: 56 },
  { id: 'tow-c', societyId: 'soc-gvs', name: 'Tower C', blockCode: 'C', totalFloors: 10, totalFlats: 40 },
];

const SEED_FLATS: Flat[] = [
  { id: 'flat-1204', societyId: 'soc-gvs', towerId: 'tow-b', towerName: 'Tower B', floorNumber: 12, flatNumber: 'B-1204', bhkType: '3BHK', occupancyStatus: 'OWNER_OCCUPIED', primaryResidentId: 'res-1', primaryResidentName: 'Vikram Joshi', phone: '9820098200' },
  { id: 'flat-402', societyId: 'soc-gvs', towerId: 'tow-a', towerName: 'Tower A', floorNumber: 4, flatNumber: 'A-402', bhkType: '2BHK', occupancyStatus: 'TENANT_OCCUPIED', primaryResidentId: 'res-2', primaryResidentName: 'Ananya Roy', phone: '9819998199' },
  { id: 'flat-301', societyId: 'soc-gvs', towerId: 'tow-c', towerName: 'Tower C', floorNumber: 3, flatNumber: 'C-301', bhkType: '4BHK', occupancyStatus: 'OWNER_OCCUPIED', primaryResidentId: 'res-3', primaryResidentName: 'Mayuri Udar', phone: '9876543210' },
];

const SEED_RESIDENTS: Resident[] = [
  { id: 'res-1', societyId: 'soc-gvs', flatId: 'flat-1204', flatCode: 'Tower B · B-1204', name: 'Vikram Joshi', email: 'vikram.j@gmail.com', phone: '9820098200', role: 'OWNER', approvalStatus: 'APPROVED', moveInDate: '2023-06-01' },
  { id: 'res-2', societyId: 'soc-gvs', flatId: 'flat-402', flatCode: 'Tower A · A-402', name: 'Ananya Roy', email: 'ananya.roy@outlook.com', phone: '9819998199', role: 'TENANT', approvalStatus: 'APPROVED', moveInDate: '2024-01-15' },
  { id: 'res-3', societyId: 'soc-gvs', flatId: 'flat-301', flatCode: 'Tower C · C-301', name: 'Mayuri Udar', email: 'mayuri.udar@greenvalley.org', phone: '9876543210', role: 'OWNER', approvalStatus: 'APPROVED', moveInDate: '2022-11-10' },
  { id: 'res-4', societyId: 'soc-gvs', flatId: 'flat-1204', flatCode: 'Tower B · B-1204', name: 'Priya Joshi', email: 'priya.j@gmail.com', phone: '9820098201', role: 'OWNER', approvalStatus: 'PENDING', moveInDate: '2026-02-01' },
];

const SEED_FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'fam-1', societyId: 'soc-gvs', residentId: 'res-1', flatId: 'flat-1204', name: 'Pooja Joshi', relationship: 'SPOUSE', phone: '9820098205' },
  { id: 'fam-2', societyId: 'soc-gvs', residentId: 'res-1', flatId: 'flat-1204', name: 'Aarav Joshi', relationship: 'CHILD' },
  { id: 'fam-3', societyId: 'soc-gvs', residentId: 'res-1', flatId: 'flat-1204', name: 'Rhea Joshi', relationship: 'CHILD' },
  { id: 'fam-4', societyId: 'soc-gvs', residentId: 'res-2', flatId: 'flat-402', name: 'Ananya Roy Jr.', relationship: 'CHILD' },
];

const SEED_VEHICLES: Vehicle[] = [
  { id: 'veh-1', societyId: 'soc-gvs', residentId: 'res-1', flatId: 'flat-1204', flatCode: 'B-1204', registrationNumber: 'MH-02-CB-4092', vehicleType: 'CAR', parkingSlotNumber: 'B-P12', rfidTagCode: 'RFID-98402' },
  { id: 'veh-2', societyId: 'soc-gvs', residentId: 'res-2', flatId: 'flat-402', flatCode: 'A-402', registrationNumber: 'MH-03-AZ-1120', vehicleType: 'BIKE', parkingSlotNumber: 'A-S04' },
];

const SEED_STAFF: Staff[] = [
  { id: 'st-1', societyId: 'soc-gvs', name: 'R. Singh', phone: '9892011223', staffType: 'GUARD', gateAssigned: 'Main Gate 1', shiftTiming: '08:00 AM - 08:00 PM', status: 'ON_DUTY' },
  { id: 'st-2', societyId: 'soc-gvs', name: 'Suresh Kumar', phone: '9892011224', staffType: 'ELECTRICIAN', shiftTiming: '09:00 AM - 06:00 PM', status: 'ON_DUTY' },
];

const SEED_VENDORS: Vendor[] = [
  { id: 'ven-1', societyId: 'soc-gvs', companyName: 'AquaPure Mineral Water Ltd', category: 'WATER_SUPPLY', contactPerson: 'Ramesh Gupta', phone: '9822100445', contractStatus: 'ACTIVE', contractExpiryDate: '2026-12-31' },
  { id: 'ven-2', societyId: 'soc-gvs', companyName: 'Otis Elevator Services', category: 'ELEVATOR_MAINTENANCE', contactPerson: 'Vinod Sharma', phone: '9822100889', contractStatus: 'ACTIVE', contractExpiryDate: '2027-03-31' },
];

const SEED_DOMESTIC_WORKERS: DomesticWorker[] = [
  { id: 'dw-1', societyId: 'soc-gvs', assignedFlatIds: ['flat-1204', 'flat-301'], name: 'Sunita Devi', phone: '9811009922', workRole: 'MAID', passCode: 'PASS-5542', verificationStatus: 'VERIFIED', status: 'INSIDE', entryTime: '08:15 AM' },
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-1', societyId: 'soc-gvs', actorId: 'user-sec-1', actorName: 'Mayuri Udar', actorRole: 'SOCIETY_ADMIN', action: 'CREATE', targetEntity: 'Society', targetId: 'soc-gvs', description: 'Initialized Green Valley Society multi-tenant record', timestamp: '2026-09-01 10:00 AM' },
  { id: 'log-2', societyId: 'soc-gvs', actorId: 'user-sec-1', actorName: 'Mayuri Udar', actorRole: 'SOCIETY_ADMIN', action: 'STATUS_CHANGE', targetEntity: 'Resident', targetId: 'res-1', description: 'Approved resident Vikram Joshi for Flat B-1204', timestamp: '2026-09-10 02:30 PM' },
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
    console.error(`Failed to persist key ${key} to localStorage:`, err);
  }
}

export const db = {
  getSocieties: (): Society[] => getItem(STORAGE_KEYS.SOCIETIES, SEED_SOCIETIES),
  saveSocieties: (data: Society[]) => setItem(STORAGE_KEYS.SOCIETIES, data),

  getTowers: (): Tower[] => getItem(STORAGE_KEYS.TOWERS, SEED_TOWERS),
  saveTowers: (data: Tower[]) => setItem(STORAGE_KEYS.TOWERS, data),

  getFlats: (): Flat[] => getItem(STORAGE_KEYS.FLATS, SEED_FLATS),
  saveFlats: (data: Flat[]) => setItem(STORAGE_KEYS.FLATS, data),

  getResidents: (): Resident[] => getItem(STORAGE_KEYS.RESIDENTS, SEED_RESIDENTS),
  saveResidents: (data: Resident[]) => setItem(STORAGE_KEYS.RESIDENTS, data),

  getFamilyMembers: (): FamilyMember[] => getItem(STORAGE_KEYS.FAMILY_MEMBERS, SEED_FAMILY_MEMBERS),
  saveFamilyMembers: (data: FamilyMember[]) => setItem(STORAGE_KEYS.FAMILY_MEMBERS, data),

  getVehicles: (): Vehicle[] => getItem(STORAGE_KEYS.VEHICLES, SEED_VEHICLES),
  saveVehicles: (data: Vehicle[]) => setItem(STORAGE_KEYS.VEHICLES, data),

  getStaff: (): Staff[] => getItem(STORAGE_KEYS.STAFF, SEED_STAFF),
  saveStaff: (data: Staff[]) => setItem(STORAGE_KEYS.STAFF, data),

  getVendors: (): Vendor[] => getItem(STORAGE_KEYS.VENDORS, SEED_VENDORS),
  saveVendors: (data: Vendor[]) => setItem(STORAGE_KEYS.VENDORS, data),

  getDomesticWorkers: (): DomesticWorker[] => getItem(STORAGE_KEYS.DOMESTIC_WORKERS, SEED_DOMESTIC_WORKERS),
  saveDomesticWorkers: (data: DomesticWorker[]) => setItem(STORAGE_KEYS.DOMESTIC_WORKERS, data),

  getAuditLogs: (): AuditLog[] => getItem(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS),
  saveAuditLogs: (data: AuditLog[]) => setItem(STORAGE_KEYS.AUDIT_LOGS, data),
};
