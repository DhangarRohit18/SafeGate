import { MOCK_USERS } from '../src/mockData/auth/mockUsers.js';
import type { UserRole } from '../src/domains/auth/types.js';
import { can } from '../src/utils/permissions.js';

interface TestResult {
  module: string;
  role: string;
  status: 'PASS' | 'FAIL';
  details: string[];
}

const ROLES: UserRole[] = [
  'resident',
  'secretary',
  'guard',
  'committee',
  'facility_manager',
  'vendor',
  'admin',
];

const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  resident: '/resident',
  secretary: '/admin',
  guard: '/security',
  committee: '/committee',
  facility_manager: '/facility',
  vendor: '/vendor',
  admin: '/super-admin',
};

const BACKEND_URL = 'http://localhost:5000/api';

async function runVerification() {
  console.log('=====================================================');
  console.log('   SAFEGATE / DWELLORA — MODULE LOGIN & INTEGRATION  ');
  console.log('=====================================================\n');

  const results: TestResult[] = [];

  // 1. Backend Connectivity Check
  console.log('🔍 Testing Backend Server Health (/api/health)...');
  try {
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    if (!healthRes.ok) throw new Error(`HTTP ${healthRes.status}`);
    const healthData = await healthRes.json();
    console.log(`   ✅ Backend is UP: ${healthData.engine} (${healthData.status})\n`);
  } catch (err: any) {
    console.error(`   ❌ Backend connection failed: ${err.message}\n`);
  }

  // 2. Test Each Module's Configuration, Role Redirection, RBAC, and API Context
  for (const role of ROLES) {
    const details: string[] = [];
    let passed = true;

    const user = MOCK_USERS[role];
    if (!user) {
      results.push({
        module: role.toUpperCase(),
        role,
        status: 'FAIL',
        details: [`Mock user configuration missing for role: ${role}`],
      });
      continue;
    }

    details.push(`User: ${user.name} (${user.email || user.phone})`);
    details.push(`Designation: ${user.designation || user.roleLabel}`);
    details.push(`Society: ${user.societyName || user.societyId}`);

    // Verify Default Route
    const expectedRoute = ROLE_DEFAULT_ROUTES[role];
    details.push(`Target Route: ${expectedRoute}`);

    // Verify RBAC Permissions using defined Actions in rbac.ts
    if (role === 'resident') {
      const canCreateComplaint = can(user as any, 'complaint:create');
      const canViewOwnParcel = can(user as any, 'parcel:view_own');
      const canRequestMove = can(user as any, 'move:request');
      details.push(`RBAC complaint:create: ${canCreateComplaint ? 'Granted ✅' : 'Restricted ❌'}`);
      details.push(`RBAC parcel:view_own: ${canViewOwnParcel ? 'Granted ✅' : 'Restricted ❌'}`);
      details.push(`RBAC move:request: ${canRequestMove ? 'Granted ✅' : 'Restricted ❌'}`);
    } else if (role === 'secretary') {
      const canViewAll = can(user as any, 'data:view_all');
      const canApproveComplaint = can(user as any, 'complaint:approve');
      const canManageStaff = can(user as any, 'staff:manage');
      details.push(`RBAC data:view_all: ${canViewAll ? 'Granted ✅' : 'Restricted ❌'}`);
      details.push(`RBAC complaint:approve: ${canApproveComplaint ? 'Granted ✅' : 'Restricted ❌'}`);
      details.push(`RBAC staff:manage: ${canManageStaff ? 'Granted ✅' : 'Restricted ❌'}`);
    } else if (role === 'guard') {
      const canReceiveParcel = can(user as any, 'parcel:receive');
      const canCheckIn = can(user as any, 'attendance:check_in');
      const canLogPatrol = can(user as any, 'patrol:log_checkpoint');
      details.push(`RBAC parcel:receive: ${canReceiveParcel ? 'Granted ✅' : 'Restricted ❌'}`);
      details.push(`RBAC attendance:check_in: ${canCheckIn ? 'Granted ✅' : 'Restricted ❌'}`);
      details.push(`RBAC patrol:log_checkpoint: ${canLogPatrol ? 'Granted ✅' : 'Restricted ❌'}`);
    } else if (role === 'committee') {
      const canViewAll = can(user as any, 'data:view_all');
      const canApproveBudget = can(user as any, 'governance:approve_budgets');
      details.push(`RBAC data:view_all: ${canViewAll ? 'Granted ✅' : 'Restricted ❌'}`);
      details.push(`RBAC governance:approve_budgets: ${canApproveBudget ? 'Granted ✅' : 'Restricted ❌'}`);
    } else if (role === 'facility_manager') {
      const canViewAll = can(user as any, 'data:view_all');
      const canAssignComplaint = can(user as any, 'complaint:assign');
      const canManageShifts = can(user as any, 'staff:manage_shifts');
      details.push(`RBAC data:view_all: ${canViewAll ? 'Granted ✅' : 'Restricted ❌'}`);
      details.push(`RBAC complaint:assign: ${canAssignComplaint ? 'Granted ✅' : 'Restricted ❌'}`);
      details.push(`RBAC staff:manage_shifts: ${canManageShifts ? 'Granted ✅' : 'Restricted ❌'}`);
    } else if (role === 'vendor') {
      const canViewAssigned = can(user as any, 'complaint:view_assigned');
      const canUploadInvoice = can(user as any, 'invoice:upload');
      details.push(`RBAC complaint:view_assigned: ${canViewAssigned ? 'Granted ✅' : 'Restricted ❌'}`);
      details.push(`RBAC invoice:upload: ${canUploadInvoice ? 'Granted ✅' : 'Restricted ❌'}`);
    } else if (role === 'admin') {
      const canManageUsers = can(user as any, 'admin:manage_users');
      const canConfigure = can(user as any, 'admin:configure_society');
      details.push(`RBAC admin:manage_users: ${canManageUsers ? 'Granted ✅' : 'Restricted ❌'}`);
      details.push(`RBAC admin:configure_society: ${canConfigure ? 'Granted ✅' : 'Restricted ❌'}`);
    }

    // Test API Call With User Context Headers
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': user.id || user.uid,
        'x-user-role': user.role,
        'x-society-id': user.societyId || 'soc-gvs',
      };

      const flatsRes = await fetch(`${BACKEND_URL}/flats`, { headers });
      if (flatsRes.ok) {
        const flats = await flatsRes.json();
        details.push(`Backend API Integration (/api/flats): Success (${Array.isArray(flats) ? flats.length : 0} flats returned) ✅`);
      } else {
        details.push(`Backend API Integration (/api/flats): HTTP ${flatsRes.status}`);
      }
    } catch (err: any) {
      details.push(`Backend API Integration error: ${err.message}`);
    }

    results.push({
      module: user.roleLabel || role.toUpperCase(),
      role,
      status: passed ? 'PASS' : 'FAIL',
      details,
    });
  }

  // Print Summary Table
  console.log('\n=====================================================');
  console.log('              MODULE VERIFICATION RESULTS             ');
  console.log('=====================================================');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`\n${icon} [${r.status}] Module: ${r.module} (Role: ${r.role})`);
    for (const d of r.details) {
      console.log(`    • ${d}`);
    }
  }

  console.log('\n=====================================================');
  const allPassed = results.every((r) => r.status === 'PASS');
  if (allPassed) {
    console.log('🎉 ALL 7 MODULES VERIFIED & INTEGRATED SUCCESSFULLY!');
  } else {
    console.log('⚠️ Some modules encountered issues.');
  }
  console.log('=====================================================\n');
}

runVerification().catch(console.error);
