import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserCheck,
  Car,
  Sparkles,
  Ticket,
  ShieldAlert,
  Baby,
  Building2,
  Wrench,
  DollarSign,
  UploadCloud,
  FileCheck,
  Store,
  CheckSquare,
  Users,
  HardHat,
  Package,
  Shield,
  Scan,
  X,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { triggerHaptic } from '../../utils/nativeMobile';

export interface ActionItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  path: string;
  color?: string;
  bg?: string;
  roles: string[];
  routePrefix?: string;
}

const GLOBAL_ACTION_CATALOG: ActionItem[] = [
  // ── Resident Actions ──
  {
    id: 'res-invite-visitor',
    label: 'Invite Visitor',
    description: 'Generate instant visitor pass & QR code',
    icon: UserCheck,
    path: '/resident/visitors',
    color: '#F06543',
    bg: '#FFF4F1',
    roles: ['resident', 'secretary', 'admin'],
    routePrefix: '/resident',
  },
  {
    id: 'res-vehicle-pass',
    label: 'Vehicle Pass',
    description: 'Apply for visitor or temporary parking pass',
    icon: Car,
    path: '/resident/parking',
    color: '#083B56',
    bg: '#F4FAFE',
    roles: ['resident', 'secretary', 'admin'],
    routePrefix: '/resident',
  },
  {
    id: 'res-book-amenity',
    label: 'Book Amenity',
    description: 'Reserve clubhouse, pool, or tennis court slot',
    icon: Sparkles,
    path: '/resident/amenities',
    color: '#059669',
    bg: '#ECFDF5',
    roles: ['resident', 'secretary', 'admin'],
    routePrefix: '/resident',
  },
  {
    id: 'res-raise-request',
    label: 'Raise Request / Ticket',
    description: 'Submit maintenance issue, NOC or request',
    icon: Ticket,
    path: '/resident/requests',
    color: '#176B91',
    bg: '#EAF6FC',
    roles: ['resident', 'secretary', 'admin'],
    routePrefix: '/resident',
  },
  {
    id: 'res-child-safety',
    label: 'Child Exit Pass',
    description: 'Manage child gate exit permissions & alerts',
    icon: Baby,
    path: '/resident/child-safety',
    color: '#D97706',
    bg: '#FFFBEB',
    roles: ['resident', 'secretary', 'admin'],
    routePrefix: '/resident',
  },
  {
    id: 'res-emergency-sos',
    label: 'Emergency SOS',
    description: 'Trigger instant emergency alert to gate security',
    icon: ShieldAlert,
    path: '/resident/emergency',
    color: '#DC2626',
    bg: '#FEF2F2',
    roles: ['resident', 'secretary', 'admin'],
    routePrefix: '/resident',
  },

  // ── Guard / Security Actions ──
  {
    id: 'sec-scan-pass',
    label: 'Scan & Verify Pass',
    description: 'Verify visitor, delivery, or guest QR pass',
    icon: Scan,
    path: '/security/verify',
    color: '#F06543',
    bg: '#FFF4F1',
    roles: ['guard', 'secretary', 'admin'],
    routePrefix: '/security',
  },
  {
    id: 'sec-child-safety',
    label: 'Child Exit Verification',
    description: 'Verify child gate departure permission',
    icon: Baby,
    path: '/security/child-safety',
    color: '#D97706',
    bg: '#FFFBEB',
    roles: ['guard', 'secretary', 'admin'],
    routePrefix: '/security',
  },
  {
    id: 'sec-staff-gate',
    label: 'Staff Gate Terminal',
    description: 'Record domestic worker & vendor entry',
    icon: HardHat,
    path: '/security/staff-scanner',
    color: '#083B56',
    bg: '#F4FAFE',
    roles: ['guard', 'secretary', 'admin'],
    routePrefix: '/security',
  },
  {
    id: 'sec-parcel-entry',
    label: 'Parcel Entry',
    description: 'Log incoming courier delivery',
    icon: Package,
    path: '/security/delivery-intelligence',
    color: '#176B91',
    bg: '#EAF6FC',
    roles: ['guard', 'secretary', 'admin'],
    routePrefix: '/security',
  },
  {
    id: 'sec-emergency-command',
    label: 'Emergency Command',
    description: 'Security emergency alert terminal',
    icon: ShieldAlert,
    path: '/security/emergency-command',
    color: '#DC2626',
    bg: '#FEF2F2',
    roles: ['guard', 'secretary', 'admin'],
    routePrefix: '/security',
  },

  // ── Secretary / Society Admin Actions ──
  {
    id: 'adm-requests',
    label: 'Process Requests & NOCs',
    description: 'Review resident applications & gate passes',
    icon: CheckSquare,
    path: '/admin/requests',
    color: '#F06543',
    bg: '#FFF4F1',
    roles: ['secretary', 'admin'],
    routePrefix: '/admin',
  },
  {
    id: 'adm-housekeeping',
    label: 'Housekeeping Ops',
    description: 'Manage daily sanitization & cleaning tasks',
    icon: Sparkles,
    path: '/admin/housekeeping',
    color: '#059669',
    bg: '#ECFDF5',
    roles: ['secretary', 'admin'],
    routePrefix: '/admin',
  },
  {
    id: 'adm-maintenance',
    label: 'Maintenance Work Orders',
    description: 'Log maintenance tickets & asset repairs',
    icon: Wrench,
    path: '/admin/maintenance',
    color: '#176B91',
    bg: '#EAF6FC',
    roles: ['secretary', 'admin'],
    routePrefix: '/admin',
  },
  {
    id: 'adm-residents',
    label: 'Add Resident / Unit',
    description: 'Register flat occupancy & member directory',
    icon: Users,
    path: '/admin/residents',
    color: '#083B56',
    bg: '#F4FAFE',
    roles: ['secretary', 'admin'],
    routePrefix: '/admin',
  },
  {
    id: 'adm-expenses',
    label: 'Log Society Expense',
    description: 'Record vendor invoice or maintenance bill',
    icon: DollarSign,
    path: '/admin/expenses',
    color: '#D97706',
    bg: '#FFFBEB',
    roles: ['secretary', 'admin'],
    routePrefix: '/admin',
  },

  // ── Committee Actions ──
  {
    id: 'com-approvals',
    label: 'Review Request Approvals',
    description: 'Decision workspace for resident NOCs & permits',
    icon: FileCheck,
    path: '/committee/approvals',
    color: '#F06543',
    bg: '#FFF4F1',
    roles: ['committee', 'secretary', 'admin'],
    routePrefix: '/committee',
  },
  {
    id: 'com-financials',
    label: 'Approve Expense Payouts',
    description: 'Treasury balance & vendor payment sign-offs',
    icon: DollarSign,
    path: '/committee/financials',
    color: '#083B56',
    bg: '#F4FAFE',
    roles: ['committee', 'secretary', 'admin'],
    routePrefix: '/committee',
  },
  {
    id: 'com-governance',
    label: 'Upload Governance Doc',
    description: 'Publish AGM minutes, resolutions or bye-laws',
    icon: UploadCloud,
    path: '/committee/governance',
    color: '#059669',
    bg: '#ECFDF5',
    roles: ['committee', 'secretary', 'admin'],
    routePrefix: '/committee',
  },

  // ── Vendor Actions ──
  {
    id: 'ven-portal',
    label: 'Manage Service Jobs',
    description: 'View & fulfill active society service orders',
    icon: Store,
    path: '/vendor/portal',
    color: '#176B91',
    bg: '#EAF6FC',
    roles: ['vendor', 'secretary', 'admin'],
    routePrefix: '/vendor',
  },
  {
    id: 'ven-kyc',
    label: 'Upload Compliance Docs',
    description: 'Submit GST license, insurance & KYC docs',
    icon: Shield,
    path: '/vendor/onboarding',
    color: '#059669',
    bg: '#ECFDF5',
    roles: ['vendor', 'secretary', 'admin'],
    routePrefix: '/vendor',
  },

  // ── Facility Manager Actions ──
  {
    id: 'fac-tasks',
    label: 'Create Maintenance Task',
    description: 'Log facility repair or work order task',
    icon: Wrench,
    path: '/facility/tasks',
    color: '#F06543',
    bg: '#FFF4F1',
    roles: ['facility_manager', 'secretary', 'admin'],
    routePrefix: '/facility',
  },
  {
    id: 'fac-amc',
    label: 'Track AMC Contracts',
    description: 'Check lift & generator maintenance contracts',
    icon: CheckSquare,
    path: '/facility/amc',
    color: '#083B56',
    bg: '#F4FAFE',
    roles: ['facility_manager', 'secretary', 'admin'],
    routePrefix: '/facility',
  },

  // ── Service Provider Actions ──
  {
    id: 'srv-tasks',
    label: 'View Assigned Tasks',
    description: 'Check active housekeeping & service tasks',
    icon: CheckSquare,
    path: '/service-provider/tasks',
    color: '#176B91',
    bg: '#EAF6FC',
    roles: ['vendor', 'resident', 'secretary', 'admin'],
    routePrefix: '/service-provider',
  },

  // ── Super Admin Actions ──
  {
    id: 'sup-societies',
    label: 'Register Housing Society',
    description: 'Onboard new society instance on platform',
    icon: Building2,
    path: '/super-admin/societies',
    color: '#F06543',
    bg: '#FFF4F1',
    roles: ['admin'],
    routePrefix: '/super-admin',
  },
];

interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = (currentUser?.role || 'resident').toLowerCase();

  // Filter actions dynamically by current path prefix & authenticated role
  const availableActions = GLOBAL_ACTION_CATALOG.filter((action) => {
    // 1. Role match
    const roleMatch = action.roles.includes(userRole);
    // 2. Context route match
    const routeMatch = action.routePrefix
      ? location.pathname.startsWith(action.routePrefix)
      : true;

    return roleMatch && routeMatch;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || availableActions.length === 0) return null;

  const handleActionClick = (path: string) => {
    triggerHaptic('medium');
    onClose();
    navigate(path);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(8, 25, 36, 0.55)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Action Sheet Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          background: '#ffffff',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '1.25rem 1.25rem 2rem',
          boxShadow: '0 -10px 40px rgba(8, 59, 86, 0.22)',
          zIndex: 1,
          animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: '82vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle pill */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#CBD5E1', margin: '0 auto 1rem' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#083B56', margin: 0, letterSpacing: '-0.01em' }}>
              Quick Action Hub
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#657785', margin: '0.15rem 0 0', fontWeight: 500 }}>
              Frequent actions for {userRole.replace('_', ' ').toUpperCase()} portal
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Quick Actions"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#F1F5F9',
              border: 'none',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {availableActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: '14px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  minHeight: 52,
                }}
                className="hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: action.bg || '#F4FAFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: action.color || '#083B56',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#083B56' }}>{action.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#657785', fontWeight: 500, marginTop: '0.1rem' }}>
                      {action.description}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="#94A3B8" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
