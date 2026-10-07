import { Outlet, Link, useNavigate } from 'react-router-dom';
import { MobileAppShell } from '../mobile/MobileAppShell';
import { Store, ShoppingBag, Bell, User, ShieldCheck } from 'lucide-react';

const DRAWER_NAV = [
  { label: 'Vendor Hub', path: '/vendor', icon: Store },
  { label: 'Jobs & Services', path: '/vendor/portal', icon: ShoppingBag },
  { label: 'Onboarding & KYC', path: '/vendor/onboarding', icon: ShieldCheck },
  { label: 'Vendor Profile', path: '/vendor/profile', icon: User },
];

const BOTTOM_NAV = [
  { label: 'Home', path: '/vendor', icon: Store },
  { label: 'Jobs', path: '/vendor/portal', icon: ShoppingBag },
  { label: 'KYC', path: '/vendor/onboarding', icon: ShieldCheck },
  { label: 'Profile', path: '/vendor/profile', icon: User },
];

export const VendorLayout = () => {
  const navigate = useNavigate();
  return (
    <MobileAppShell
      roleTitle="Vendor"
      societyName="Green Valley Society"
      accentColor="#176B91"
      drawerItems={DRAWER_NAV}
      bottomItems={BOTTOM_NAV}
      onFabClick={() => navigate('/vendor/portal')}
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
