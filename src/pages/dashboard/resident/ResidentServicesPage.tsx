import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, Car, Wrench, CreditCard, Store, Sparkles,
  ShieldCheck, ShieldAlert, Trash2, BedDouble, HardHat,
  Users, Building2, MessageSquare, ChevronRight, Tag, Gift,
} from 'lucide-react';
import { AdvertisementPopup } from '../../../components/common/AdvertisementPopup';
import { useAuth } from '../../../context/AuthContext';

const SERVICES = [
  { label: 'Visitor Pass', icon: UserCheck, path: '/resident/visitors', description: 'Invite guests & manage passes' },
  { label: 'Parking', icon: Car, path: '/resident/parking', description: 'Manage parking slots' },
  { label: 'Maintenance', icon: Wrench, path: '/resident/maintenance', description: 'Report & track issues' },
  { label: 'Billing', icon: CreditCard, path: '/resident/billing', description: 'Pay dues & view receipts' },
  { label: 'Marketplace', icon: Store, path: '/resident/marketplace', description: 'Shop from society vendors' },
  { label: 'Amenities', icon: Sparkles, path: '/resident/amenities', description: 'Book gym, pool & more' },
  { label: 'Community', icon: Users, path: '/resident/community', description: 'Notices & discussions' },
  { label: 'Child Safety', icon: ShieldCheck, path: '/resident/child-safety', description: 'Authorized pickup management' },
  { label: 'Emergency SOS', icon: ShieldAlert, path: '/resident/emergency', description: 'Report emergencies' },
  { label: 'Garbage', icon: Trash2, path: '/resident/garbage', description: 'Schedules & complaints' },
  { label: 'Guest Stay', icon: BedDouble, path: '/resident/guest-stay', description: 'Guest accommodation passes' },
  { label: 'Domestic Help', icon: HardHat, path: '/resident/domestic-help', description: 'Manage domestic workers' },
  { label: 'My Flat', icon: Building2, path: '/resident/my-flat', description: 'Flat info & documents' },
  { label: 'Requests', icon: MessageSquare, path: '/resident/requests', description: 'Submit & track requests' },
];

export const ResidentServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isOffersOpen, setIsOffersOpen] = useState(false);

  return (
    <div style={{ backgroundColor: 'var(--aarizo-page, #F7FBFE)', minHeight: '100%', padding: '1rem', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--aarizo-navy, #083B56)', margin: 0 }}>
            All Services
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--aarizo-text-secondary, #657785)', margin: '0.25rem 0 0' }}>
            Everything you need, all in one place.
          </p>
        </div>

        <button
          onClick={() => setIsOffersOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.875rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            border: '1px solid #FED7AA',
            color: '#C2410C',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(194, 65, 12, 0.08)',
          }}
        >
          <Gift size={15} />
          <span>Exclusive Resident Perks</span>
        </button>
      </div>

      {/* Featured Partner Deals Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0A2E44 0%, #083B56 100%)',
          borderRadius: '16px',
          padding: '1rem 1.25rem',
          color: '#ffffff',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 4px 16px rgba(8, 59, 86, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#83CBEA',
              flexShrink: 0,
            }}
          >
            <Tag size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 800 }}>Society Partner Offers Active</div>
            <div style={{ fontSize: '0.75rem', color: '#EAF6FC', opacity: 0.9 }}>
              Unlock verified resident discounts on grocery, laundry, cleaning & salon services.
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsOffersOpen(true)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '10px',
            background: '#83CBEA',
            color: '#083B56',
            fontSize: '0.75rem',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          View Deals & Coupons
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <button
              key={service.label}
              onClick={() => navigate(service.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.875rem 1rem',
                borderRadius: '16px',
                background: '#ffffff',
                border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                minHeight: 64,
                boxShadow: '0 2px 8px rgba(8, 59, 86, 0.04)',
              }}
              aria-label={service.label}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  background: 'var(--aarizo-light-blue, #EAF6FC)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--aarizo-blue, #176B91)',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--aarizo-text, #203746)' }}>
                  {service.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', marginTop: '0.125rem' }}>
                  {service.description}
                </div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--aarizo-text-muted, #8B9AA5)', flexShrink: 0 }} />
            </button>
          );
        })}
      </div>

      {/* Society Partner Discounts Modal */}
      <AdvertisementPopup
        forceOpen={isOffersOpen}
        onClose={() => setIsOffersOpen(false)}
        societyId={currentUser?.societyId || 'soc-gvs'}
      />
    </div>
  );
};

export default ResidentServicesPage;
