import { Outlet, Link, useNavigate } from 'react-router-dom';
import { MobileAppShell } from '../mobile/MobileAppShell';
import { LayoutDashboard, CheckSquare, BarChart3, FileText, Bell, Activity, BookOpen, User } from 'lucide-react';

const DRAWER_NAV = [
  { label: 'Overview', path: '/committee', icon: LayoutDashboard },
  { label: 'Approvals', path: '/committee/approvals', icon: CheckSquare },
  { label: 'Financials', path: '/committee/financials', icon: BarChart3 },
  { label: 'Compliance', path: '/committee/compliance', icon: FileText },
  { label: 'Society Health', path: '/committee/health', icon: Activity },
  { label: 'Governance', path: '/committee/governance', icon: BookOpen },
  { label: 'Reports', path: '/committee/reports', icon: BarChart3 },
  { label: 'Profile', path: '/committee/profile', icon: User },
];

const BOTTOM_NAV = [
  { label: 'Home', path: '/committee', icon: LayoutDashboard },
  { label: 'Approvals', path: '/committee/approvals', icon: CheckSquare },
  { label: 'Reports', path: '/committee/reports', icon: BarChart3 },
  { label: 'Profile', path: '/committee/profile', icon: User },
];

export const CommitteeLayout = () => {
  const navigate = useNavigate();
  return (
    <MobileAppShell
      roleTitle="Committee"
      societyName="Green Valley Society"
      accentColor="#176B91"
      drawerItems={DRAWER_NAV}
      bottomItems={BOTTOM_NAV}
      onFabClick={() => navigate('/committee/approvals')}
      topRightActions={
        <Link
          to="/notifications"
          aria-label="Notifications"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
        >
          <Bell size={18} />
        </Link>
      }
    >
      <Outlet />
    </MobileAppShell>
  );
};
