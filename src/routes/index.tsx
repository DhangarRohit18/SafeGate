import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { trackActiveRoute, getRestoredOrRoleDefaultRoute } from '../utils/sessionRouteTracker';
import { LoginPage } from '../pages/auth/LoginPage';
import { OnboardingPage } from '../pages/auth/OnboardingPage';
import { UnauthorizedPage } from '../pages/unauthorized/UnauthorizedPage';
import { ResidentDashboard } from '../pages/dashboard/ResidentDashboard';
import { GuardDashboard } from '../pages/dashboard/GuardDashboard';
import { SuperAdminDashboard } from '../pages/dashboard/SuperAdminDashboard';
import { SuperAdminSocietiesPage } from '../pages/dashboard/admin/SuperAdminSocietiesPage';
import { TowerManagementPage } from '../pages/dashboard/admin/TowerManagementPage';
import { FlatManagementPage } from '../pages/dashboard/admin/FlatManagementPage';
import { ResidentManagementPage } from '../pages/dashboard/admin/ResidentManagementPage';
import { StaffManagementPage } from '../pages/dashboard/admin/StaffManagementPage';
import { VendorManagementPage } from '../pages/dashboard/admin/VendorManagementPage';
import { AuditLogsPage } from '../pages/dashboard/admin/AuditLogsPage';
import { ParkingManagementPage } from '../pages/dashboard/admin/ParkingManagementPage';
import { AdminHomePage } from '../pages/dashboard/admin/AdminHomePage';
import { MyFlatPage } from '../pages/dashboard/resident/MyFlatPage';
import { VisitorPassHubPage } from '../pages/dashboard/resident/VisitorPassHubPage';
import { ResidentParkingPage } from '../pages/dashboard/resident/ResidentParkingPage';
import { ResidentProfilePage } from '../pages/dashboard/resident/ResidentProfilePage';
import { ResidentServicesPage } from '../pages/dashboard/resident/ResidentServicesPage';
import { ResidentActivityPage } from '../pages/dashboard/resident/ResidentActivityPage';
import { SecurityTerminalPage } from '../pages/dashboard/security/SecurityTerminalPage';
import { ParkingGateScannerPage } from '../pages/dashboard/security/ParkingGateScannerPage';
import { DomesticWorkerManagementPage } from '../pages/dashboard/admin/DomesticWorkerManagementPage';
import { DomesticHelpHubPage } from '../pages/dashboard/resident/DomesticHelpHubPage';
import { StaffGateTerminalPage } from '../pages/dashboard/security/StaffGateTerminalPage';
import { MaintenanceManagementPage } from '../pages/dashboard/admin/MaintenanceManagementPage';
import { ResidentMaintenancePage } from '../pages/dashboard/resident/ResidentMaintenancePage';
import { BillingManagementPage } from '../pages/dashboard/admin/BillingManagementPage';
import { ResidentBillingPage } from '../pages/dashboard/resident/ResidentBillingPage';
import { AdminServiceHubPage } from '../pages/dashboard/admin/AdminServiceHubPage';
import { VendorPortalPage } from '../pages/dashboard/vendor/VendorPortalPage';
import { ResidentMarketplacePage } from '../pages/dashboard/resident/ResidentMarketplacePage';
import { DeliveryIntelligencePage } from '../pages/dashboard/admin/DeliveryIntelligencePage';
import { AdminAmenityManagementPage } from '../pages/dashboard/admin/AdminAmenityManagementPage';
import { ResidentAmenityBookingPage } from '../pages/dashboard/resident/ResidentAmenityBookingPage';
import { ResidentCommunityHubPage } from '../pages/dashboard/resident/ResidentCommunityHubPage';
import { ResidentChildSafetyPage } from '../pages/dashboard/resident/ResidentChildSafetyPage';
import { ChildGateScannerPage } from '../pages/dashboard/security/ChildGateScannerPage';
import { AdminChildSafetyPage } from '../pages/dashboard/admin/AdminChildSafetyPage';
import { ResidentEmergencyPage } from '../pages/dashboard/resident/ResidentEmergencyPage';
import { SecurityEmergencyTerminalPage } from '../pages/dashboard/security/SecurityEmergencyTerminalPage';
import { AdminSafetyCommandPage } from '../pages/dashboard/admin/AdminSafetyCommandPage';
import { AdminHousekeepingPage } from '../pages/dashboard/admin/AdminHousekeepingPage';
import { ResidentGarbagePage } from '../pages/dashboard/resident/ResidentGarbagePage';
import { StaffHousekeepingTaskPage } from '../pages/dashboard/staff/StaffHousekeepingTaskPage';
import { AdminGuestStayPage } from '../pages/dashboard/admin/AdminGuestStayPage';
import { ResidentGuestStayPage } from '../pages/dashboard/resident/ResidentGuestStayPage';
import { GuestStayScannerPage } from '../pages/dashboard/security/GuestStayScannerPage';
import { ServiceProviderTaskPage } from '../pages/dashboard/serviceProvider/ServiceProviderTaskPage';
import { VendorProfilePage } from '../pages/dashboard/vendor/VendorProfilePage';
import { VendorDashboard } from '../pages/dashboard/VendorDashboard';
import { ServiceProviderDashboard } from '../pages/dashboard/ServiceProviderDashboard';
import { NotificationCenterPage } from '../pages/dashboard/NotificationCenterPage';
import { SocietyIntelligenceDashboardPage } from '../pages/dashboard/admin/SocietyIntelligenceDashboardPage';
import { SecurityAuditCenterPage } from '../pages/dashboard/admin/SecurityAuditCenterPage';
import { RealtimeOperationsHubPage } from '../pages/dashboard/admin/RealtimeOperationsHubPage';
import { AdminCompliancePage } from '../pages/dashboard/admin/AdminCompliancePage';
import { AdminMoveRenovationPage } from '../pages/dashboard/admin/AdminMoveRenovationPage';
import { AdminExpensePage } from '../pages/dashboard/admin/AdminExpensePage';
import { CommitteeDashboard } from '../pages/dashboard/CommitteeDashboard';
import { FacilityManagerDashboard } from '../pages/dashboard/FacilityManagerDashboard';
import { FacilityProfilePage } from '../pages/dashboard/facility/FacilityProfilePage';
import { FacilityMaintenanceTasksPage } from '../pages/dashboard/facility/FacilityMaintenanceTasksPage';
import { FacilityStaffShiftsPage } from '../pages/dashboard/facility/FacilityStaffShiftsPage';
import { FacilityAMCContractsPage } from '../pages/dashboard/facility/FacilityAMCContractsPage';
import { FacilityCleaningOpsPage } from '../pages/dashboard/facility/FacilityCleaningOpsPage';
import { FacilityUtilitiesPage } from '../pages/dashboard/facility/FacilityUtilitiesPage';
import { DomesticWorkerDashboard } from '../pages/dashboard/DomesticWorkerDashboard';
import { UnifiedRequestCenter } from '../domains/requests/components/UnifiedRequestCenter';
import { AdminAdvertisementsPage } from '../pages/dashboard/admin/AdminAdvertisementsPage';
import { AdminNGOManagementPage } from '../pages/dashboard/admin/AdminNGOManagementPage';
import { VendorOnboardingPage } from '../pages/dashboard/vendor/VendorOnboardingPage';
import {
  SuperAdminLayout,
  SocietyAdminLayout,
  SecurityLayout,
  ResidentLayout,
  VendorLayout,
  ServiceProviderLayout,
  CommitteeLayout,
  FacilityManagerLayout,
  DomesticWorkerLayout,
} from '../components/layouts';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { DeveloperDatabaseStudio } from '../components/dev/DeveloperDatabaseStudio';

export const AppRoutes: React.FC = () => {
  const { status, currentUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (status === 'AUTHENTICATED' && currentUser) {
      trackActiveRoute(currentUser.role, location.pathname + location.search);
    }
  }, [location, status, currentUser]);

  const getDefaultRoute = () => {
    const role = (currentUser?.role || '').toLowerCase();
    let def = '/resident';
    switch (role) {
      case 'admin':
        def = '/super-admin';
        break;
      case 'secretary':
        def = '/admin';
        break;
      case 'guard':
        def = '/security';
        break;
      case 'committee':
        def = '/committee';
        break;
      case 'facility_manager':
        def = '/facility';
        break;
      case 'vendor':
        def = '/vendor';
        break;
      case 'resident':
      default:
        def = '/resident';
        break;
    }
    return getRestoredOrRoleDefaultRoute(role, def);
  };

  return (
    <Routes>
      {/* Developer Database Studio */}
      <Route path="/dev/database" element={<DeveloperDatabaseStudio />} />
      <Route path="/dev/db" element={<DeveloperDatabaseStudio />} />

      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Root Redirection */}
      <Route
        path="/"
        element={
          status === 'AUTHENTICATED' ? <Navigate to={getDefaultRoute()} replace /> : <Navigate to="/login" replace />
        }
      />

      {/* Shared / Notifications Route */}
      <Route element={<ProtectedRoute allowedRoles={['resident', 'secretary', 'admin', 'guard', 'vendor', 'committee', 'facility_manager']} />}>
        <Route path="/notifications" element={<NotificationCenterPage />} />
      </Route>

      {/* -- Resident Routes -- */}
      <Route element={<ProtectedRoute allowedRoles={['resident', 'secretary', 'admin']} />}>
        <Route element={<ResidentLayout />}>
          <Route path="/resident" element={<ResidentDashboard />} />
          <Route path="/resident/my-flat" element={<MyFlatPage />} />
          <Route path="/resident/visitors" element={<VisitorPassHubPage />} />
          <Route path="/resident/parking" element={<ResidentParkingPage />} />
          <Route path="/resident/domestic-help" element={<DomesticHelpHubPage />} />
          <Route path="/resident/maintenance" element={<ResidentMaintenancePage />} />
          <Route path="/resident/billing" element={<ResidentBillingPage />} />
          <Route path="/resident/marketplace" element={<ResidentMarketplacePage />} />
          <Route path="/resident/amenities" element={<ResidentAmenityBookingPage />} />
          <Route path="/resident/community" element={<ResidentCommunityHubPage />} />
          <Route path="/resident/child-safety" element={<ResidentChildSafetyPage />} />
          <Route path="/resident/emergency" element={<ResidentEmergencyPage />} />
          <Route path="/resident/garbage" element={<ResidentGarbagePage />} />
          <Route path="/resident/guest-stay" element={<ResidentGuestStayPage />} />
          <Route path="/resident/requests" element={<UnifiedRequestCenter />} />
          {/* New mobile-first resident pages */}
          <Route path="/resident/profile" element={<ResidentProfilePage />} />
          <Route path="/resident/services" element={<ResidentServicesPage />} />
          <Route path="/resident/activity" element={<ResidentActivityPage />} />
          <Route path="/resident/*" element={<ResidentDashboard />} />
        </Route>
      </Route>

      {/* -- Society Admin Routes -- */}
      <Route element={<ProtectedRoute allowedRoles={['secretary', 'admin']} />}>
        <Route element={<SocietyAdminLayout />}>
          {/* Mobile admin home replaces SecretaryDashboard as default */}
          <Route path="/admin" element={<AdminHomePage />} />
          <Route path="/admin/requests" element={<UnifiedRequestCenter />} />
          <Route path="/admin/towers" element={<TowerManagementPage />} />
          <Route path="/admin/flats" element={<FlatManagementPage />} />
          <Route path="/admin/residents" element={<ResidentManagementPage />} />
          <Route path="/admin/staff" element={<StaffManagementPage />} />
          <Route path="/admin/domestic-workers" element={<DomesticWorkerManagementPage />} />
          <Route path="/admin/vendors" element={<VendorManagementPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          <Route path="/admin/parking" element={<ParkingManagementPage />} />
          <Route path="/admin/maintenance" element={<MaintenanceManagementPage />} />
          <Route path="/admin/billing" element={<BillingManagementPage />} />
          <Route path="/admin/service-hub" element={<AdminServiceHubPage />} />
          <Route path="/admin/delivery-intelligence" element={<DeliveryIntelligencePage />} />
          <Route path="/admin/amenities" element={<AdminAmenityManagementPage />} />
          <Route path="/admin/child-safety" element={<AdminChildSafetyPage />} />
          <Route path="/admin/safety-command" element={<AdminSafetyCommandPage />} />
          <Route path="/admin/housekeeping" element={<AdminHousekeepingPage />} />
          <Route path="/admin/guest-stay" element={<AdminGuestStayPage />} />
          <Route path="/admin/intelligence" element={<SocietyIntelligenceDashboardPage />} />
          <Route path="/admin/security-audit" element={<SecurityAuditCenterPage />} />
          <Route path="/admin/realtime" element={<RealtimeOperationsHubPage />} />
          <Route path="/admin/compliance" element={<AdminCompliancePage />} />
          <Route path="/admin/move-renovation" element={<AdminMoveRenovationPage />} />
          <Route path="/admin/expenses" element={<AdminExpensePage />} />
          <Route path="/admin/ngos" element={<AdminNGOManagementPage />} />
          <Route path="/admin/advertisements" element={<AdminAdvertisementsPage />} />
          <Route path="/admin/operations" element={<RealtimeOperationsHubPage />} />
          <Route path="/admin/community" element={<ResidentCommunityHubPage />} />
          <Route path="/admin/profile" element={<AdminHomePage />} />
          <Route path="/admin/*" element={<AdminHomePage />} />
        </Route>
      </Route>

      {/* -- Staff Routes -- */}
      <Route element={<ProtectedRoute allowedRoles={['secretary', 'admin', 'resident', 'vendor']} />}>
        <Route element={<ServiceProviderLayout />}>
          <Route path="/staff/housekeeping-tasks" element={<StaffHousekeepingTaskPage />} />
        </Route>
      </Route>

      {/* -- Security Guard Routes -- */}
      <Route element={<ProtectedRoute allowedRoles={['guard', 'secretary', 'admin']} />}>
        <Route element={<SecurityLayout />}>
          <Route path="/security" element={<SecurityTerminalPage />} />
          <Route path="/security/terminal" element={<SecurityTerminalPage />} />
          <Route path="/security/gate" element={<SecurityTerminalPage />} />
          <Route path="/security/verify" element={<GuardDashboard />} />
          <Route path="/guard" element={<GuardDashboard />} />
          <Route path="/guard/*" element={<GuardDashboard />} />
          <Route path="/security/activity" element={<SecurityTerminalPage />} />
          <Route path="/security/profile" element={<SecurityTerminalPage />} />
          <Route path="/security/parking" element={<ParkingGateScannerPage />} />
          <Route path="/security/staff-scanner" element={<StaffGateTerminalPage />} />
          <Route path="/security/delivery-intelligence" element={<DeliveryIntelligencePage />} />
          <Route path="/security/child-safety" element={<ChildGateScannerPage />} />
          <Route path="/security/emergency-command" element={<SecurityEmergencyTerminalPage />} />
          <Route path="/security/privacy-hub" element={<SecurityTerminalPage />} />
          <Route path="/security/guest-stay" element={<GuestStayScannerPage />} />
          <Route path="/security/*" element={<SecurityTerminalPage />} />
        </Route>
      </Route>

      {/* -- Super Admin Routes -- */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/societies" element={<SuperAdminSocietiesPage />} />
          <Route path="/super-admin/*" element={<SuperAdminDashboard />} />
        </Route>
      </Route>

      {/* -- Vendor Routes -- */}
      <Route element={<ProtectedRoute allowedRoles={['vendor', 'secretary', 'admin']} />}>
        <Route element={<VendorLayout />}>
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/vendor/profile" element={<VendorProfilePage />} />
          <Route path="/vendor/portal" element={<VendorPortalPage />} />
          <Route path="/vendor/onboarding" element={<VendorOnboardingPage />} />
          <Route path="/vendor/*" element={<VendorDashboard />} />
        </Route>
      </Route>

      {/* -- Service Provider Routes -- */}
      <Route element={<ProtectedRoute allowedRoles={['vendor', 'resident', 'admin']} />}>
        <Route element={<ServiceProviderLayout />}>
          <Route path="/service-provider" element={<ServiceProviderDashboard />} />
          <Route path="/service-provider/tasks" element={<ServiceProviderTaskPage />} />
          <Route path="/service-provider/*" element={<ServiceProviderDashboard />} />
        </Route>
      </Route>

      {/* -- Committee Member Routes -- */}
      <Route element={<ProtectedRoute allowedRoles={['committee', 'secretary', 'admin']} />}>
        <Route element={<CommitteeLayout />}>
          <Route path="/committee" element={<CommitteeDashboard />} />
          <Route path="/committee/approvals" element={<CommitteeDashboard />} />
          <Route path="/committee/financials" element={<CommitteeDashboard />} />
          <Route path="/committee/compliance" element={<CommitteeDashboard />} />
          <Route path="/committee/health" element={<CommitteeDashboard />} />
          <Route path="/committee/governance" element={<CommitteeDashboard />} />
          <Route path="/committee/reports" element={<CommitteeDashboard />} />
          <Route path="/committee/profile" element={<CommitteeDashboard />} />
          <Route path="/committee/*" element={<CommitteeDashboard />} />
        </Route>
      </Route>

      {/* -- Facility Manager Routes -- */}
      <Route element={<ProtectedRoute allowedRoles={['facility_manager', 'secretary', 'admin']} />}>
        <Route element={<FacilityManagerLayout />}>
          <Route path="/facility" element={<FacilityManagerDashboard />} />
          <Route path="/facility/tasks" element={<FacilityMaintenanceTasksPage />} />
          <Route path="/facility/maintenance" element={<FacilityMaintenanceTasksPage />} />
          <Route path="/facility/shifts" element={<FacilityStaffShiftsPage />} />
          <Route path="/facility/amc" element={<FacilityAMCContractsPage />} />
          <Route path="/facility/cleaning" element={<FacilityCleaningOpsPage />} />
          <Route path="/facility/utilities" element={<FacilityUtilitiesPage />} />
          <Route path="/facility/profile" element={<FacilityProfilePage />} />
          <Route path="/facility/*" element={<FacilityManagerDashboard />} />
        </Route>
      </Route>

      {/* -- Domestic Worker Routes -- */}
      <Route element={<ProtectedRoute allowedRoles={['vendor', 'resident', 'secretary', 'admin']} />}>
        <Route element={<DomesticWorkerLayout />}>
          <Route path="/domestic" element={<DomesticWorkerDashboard />} />
          <Route path="/domestic/*" element={<DomesticWorkerDashboard />} />
        </Route>
      </Route>

      {/* Catch-all Fallback */}
      <Route
        path="*"
        element={
          status === 'AUTHENTICATED' ? <Navigate to={getDefaultRoute()} replace /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};





