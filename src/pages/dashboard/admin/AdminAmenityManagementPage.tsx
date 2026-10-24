import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { amenityService } from '../../../services/amenityService';
import { realtimeService } from '../../../services/realtimeService';
import { FileUpload } from '../../../components/ui/FileUpload';
import type { SocietyAmenity, AmenityBooking, AmenityType } from '../../../types/amenity';
import { Modal } from '../../../components/ui/Modal';
import { DataTable } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';
import {
  Sparkles,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  Wrench,
  Ban,
  Plus,
  ShieldCheck,
  Building,
  Dumbbell,
  Trophy,
  PartyPopper,
  HeartHandshake,
  MapPin,
  ChevronRight,
  ArrowLeft,
  Search
} from 'lucide-react';

type FilterCategory = 'ALL' | 'FITNESS' | 'SPORTS' | 'EVENTS' | 'RECREATION';

interface CategoryTab {
  id: FilterCategory;
  label: string;
  icon: React.FC<{ size?: number; color?: string; className?: string }>;
  types?: AmenityType[];
}

const CATEGORY_TABS: CategoryTab[] = [
  { id: 'ALL', label: 'All Facilities', icon: Sparkles },
  { id: 'FITNESS', label: 'Fitness & Gym', icon: Dumbbell, types: ['GYM', 'SWIMMING_POOL'] },
  { id: 'SPORTS', label: 'Sports & Courts', icon: Trophy, types: ['BADMINTON_COURT', 'TENNIS_COURT'] },
  { id: 'EVENTS', label: 'Events & Halls', icon: PartyPopper, types: ['CLUBHOUSE', 'PARTY_HALL', 'MEETING_ROOM'] },
  { id: 'RECREATION', label: 'Recreation', icon: HeartHandshake, types: ['KIDS_PLAY_AREA', 'VISITOR_LOUNGE'] },
];

const AMENITY_TYPES: AmenityType[] = [
  'SWIMMING_POOL',
  'GYM',
  'CLUBHOUSE',
  'BADMINTON_COURT',
  'TENNIS_COURT',
  'PARTY_HALL',
  'MEETING_ROOM',
  'KIDS_PLAY_AREA',
  'VISITOR_LOUNGE'
];

export const AdminAmenityManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const societyId = (currentUser as any)?.societyId || 'soc-1';

  const [amenities, setAmenities] = useState<SocietyAmenity[]>([]);
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedAmenity, setSelectedAmenity] = useState<SocietyAmenity | null>(null);
  const [selectedDetailAmenity, setSelectedDetailAmenity] = useState<SocietyAmenity | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBlackoutModal, setShowBlackoutModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  // Forms state
  const [newAmenity, setNewAmenity] = useState<{
    name: string;
    type: AmenityType;
    description: string;
    location: string;
    capacityPerSlot: number;
    openTime: string;
    closeTime: string;
    slotDurationMinutes: number;
    requiresApproval: boolean;
    isBookable: boolean;
    imageUrl?: string;
    bookingFee?: number;
  }>({
    name: '',
    type: 'BADMINTON_COURT',
    description: '',
    location: '',
    capacityPerSlot: 4,
    openTime: '06:00',
    closeTime: '22:00',
    slotDurationMinutes: 60,
    requiresApproval: false,
    isBookable: true,
    imageUrl: '',
    bookingFee: 0
  });

  const [blackoutForm, setBlackoutForm] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  useEffect(() => {
    loadData();

    const unsub = realtimeService.subscribe('*', (msg) => {
      if (['AMENITY_BOOKED', 'AMENITY_AVAILABILITY', 'SOCIETY_SYNC'].includes(msg.topic)) {
        loadData();
      }
    });

    return () => unsub();
  }, [societyId]);

  const loadData = () => {
    const data = amenityService.getAmenities(societyId);
    setAmenities(data);
    const bks = amenityService.getBookings(societyId);
    setBookings(bks);
  };

  const handleCreateAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmenity.name || !newAmenity.location) return;

    amenityService.createAmenity(societyId, {
      ...newAmenity,
      isActive: true
    });

    setShowCreateModal(false);
    setNewAmenity({
      name: '',
      type: 'BADMINTON_COURT',
      description: '',
      location: '',
      capacityPerSlot: 4,
      openTime: '06:00',
      closeTime: '22:00',
      slotDurationMinutes: 60,
      requiresApproval: false,
      isBookable: true,
      imageUrl: '',
      bookingFee: 0
    });
    loadData();
  };

  const handleApproveBooking = (bookingId: string) => {
    amenityService.updateBookingStatus(societyId, bookingId, 'APPROVED', 'Approved by Admin');
    loadData();
  };

  const handleRejectBooking = (bookingId: string) => {
    amenityService.updateBookingStatus(societyId, bookingId, 'REJECTED', 'Slot capacity or timing clash');
    loadData();
  };

  const handleAddBlackout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmenity || !blackoutForm.startDate || !blackoutForm.reason) return;

    amenityService.addBlackoutDate(
      societyId,
      selectedAmenity.id,
      blackoutForm.startDate,
      blackoutForm.endDate || blackoutForm.startDate,
      blackoutForm.reason
    );

    setShowBlackoutModal(false);
    setBlackoutForm({ startDate: '', endDate: '', reason: '' });
    loadData();
  };

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmenity || !maintenanceForm.title || !maintenanceForm.startDate) return;

    amenityService.addMaintenanceSchedule(
      societyId,
      selectedAmenity.id,
      maintenanceForm.title,
      maintenanceForm.startDate,
      maintenanceForm.endDate || maintenanceForm.startDate,
      maintenanceForm.notes
    );

    setShowMaintenanceModal(false);
    setMaintenanceForm({ title: '', startDate: '', endDate: '', notes: '' });
    loadData();
  };

  const filteredAmenities = amenities.filter(amenity => {
    const matchesCategory = (() => {
      if (activeCategory === 'ALL') return true;
      const cat = CATEGORY_TABS.find(c => c.id === activeCategory);
      if (!cat || !cat.types) return true;
      return cat.types.includes(amenity.type);
    })();

    const matchesSearch =
      amenity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      amenity.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      amenity.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (amenity.description && amenity.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const pendingBookings = bookings.filter(b => b.status === 'PENDING');

  return (
    <div style={{ minHeight: '100%', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: '2.5rem' }}>
      {/* ── Subheader matching Residents, Child Safety & NGO tabs ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1rem 0.75rem',
          background: 'var(--aarizo-card-blue, #F4FAFE)',
          borderBottom: '1px solid var(--aarizo-border, #DCE8EF)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--aarizo-navy, #083B56)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em' }}>
              Amenity &amp; Facility Management
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Timings, capacities, blackout dates &amp; resident slot bookings
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.875rem',
            borderRadius: '10px',
            background: 'var(--aarizo-coral, #F06543)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.75rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
          }}
        >
          <Plus size={15} /> Add New Amenity
        </button>
      </div>

      {/* ── Search Bar & Filter Strip ── */}
      <div className="max-w-7xl mx-auto w-full" style={{ padding: '1rem 1rem 0.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            background: '#ffffff',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            borderRadius: '12px',
            padding: '0 0.875rem',
            height: '46px',
            boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
          }}
        >
          <Search size={18} color="var(--aarizo-text-secondary, #657785)" />
          <input
            type="text"
            placeholder="Search by facility name, location, timing, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.8125rem',
              color: 'var(--aarizo-text, #203746)',
              background: 'transparent',
              minHeight: 'auto',
            }}
          />
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CATEGORY_TABS.map(tab => {
            const isActive = activeCategory === tab.id;
            const IconComponent = tab.icon;
            const count = amenities.filter(a => {
              if (tab.id === 'ALL') return true;
              return tab.types?.includes(a.type);
            }).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  background: isActive ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
                  border: '1px solid var(--aarizo-border, #DCE8EF)',
                  borderRadius: '10px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: isActive ? '#ffffff' : 'var(--aarizo-text, #203746)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <IconComponent size={14} color={isActive ? '#ffffff' : 'var(--aarizo-coral, #F06543)'} />
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.625rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    fontWeight: 800,
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--aarizo-card-blue, #F4FAFE)',
                    color: isActive ? '#ffffff' : 'var(--aarizo-navy, #083B56)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Count Heading ── */}
      <div className="max-w-7xl mx-auto w-full" style={{ padding: '0.5rem 1rem 0.25rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--aarizo-text-secondary, #657785)' }}>
          {filteredAmenities.length} facilities &amp; amenities found
        </span>
      </div>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 space-y-4">
        {/* Pending Approvals Widget */}
        {pendingBookings.length > 0 && (
          <div
            style={{
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              borderRadius: '14px',
              padding: '1rem',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={20} color="#D97706" />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0 }}>
                Pending Resident Booking Requests ({pendingBookings.length})
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {pendingBookings.map(bk => (
                <div
                  key={bk.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                    padding: '0.625rem 0',
                    borderTop: '1px solid #FDE68A',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--aarizo-navy, #083B56)' }}>
                        {bk.amenityName} — <span style={{ color: 'var(--aarizo-coral, #F06543)' }}>{bk.residentName} ({bk.flatNumber})</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', marginTop: 2 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Calendar size={13} color="var(--aarizo-text-secondary, #657785)" /> {bk.bookingDate}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={13} color="var(--aarizo-text-secondary, #657785)" /> {bk.startTime} - {bk.endTime}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Users size={13} color="var(--aarizo-text-secondary, #657785)" /> {bk.guestCount} Guest(s)
                        </span>
                      </div>
                      {bk.purpose && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', fontStyle: 'italic', marginTop: 2 }}>
                          "{bk.purpose}"
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleApproveBooking(bk.id)}
                        style={{
                          background: '#059669',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.35rem 0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectBooking(bk.id)}
                        style={{
                          background: '#DC2626',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.35rem 0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                        }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Compact Amenities Cards Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredAmenities.map(amenity => {
            const hasBlackout = amenity.blackoutDates && amenity.blackoutDates.length > 0;
            const hasMaintenance = amenity.maintenanceSchedules && amenity.maintenanceSchedules.length > 0;

            return (
              <div
                key={amenity.id}
                onClick={() => setSelectedDetailAmenity(amenity)}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                  borderRadius: '16px',
                  boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div>
                  {/* Image Banner */}
                  <div style={{ position: 'relative', aspectRatio: '16/10', width: '100%', overflow: 'hidden', background: '#F4FAFE' }}>
                    {amenity.imageUrl ? (
                      <img
                        src={amenity.imageUrl}
                        alt={amenity.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aarizo-text-secondary, #657785)' }}>
                        <Building size={28} />
                      </div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }} />

                    {/* Top-Left Pricing Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: 'var(--aarizo-navy, #083B56)',
                        color: '#ffffff',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                    >
                      {amenity.bookingFee && amenity.bookingFee > 0 ? (
                        <span style={{ color: '#FBBF24' }}>₹{amenity.bookingFee}</span>
                      ) : (
                        <span style={{ color: '#34D399' }}>Free</span>
                      )}
                    </div>

                    {/* Top-Right Category Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(8, 59, 86, 0.85)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '20px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {amenity.type.replace(/_/g, ' ')}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '0.75rem' }}>
                    <h3
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 800,
                        color: 'var(--aarizo-navy, #083B56)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {amenity.name}
                    </h3>

                    <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} color="var(--aarizo-coral, #F06543)" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{amenity.location}</span>
                    </div>

                    {amenity.description && (
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--aarizo-text-secondary, #657785)',
                          marginTop: 6,
                          margin: '6px 0 0 0',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.3',
                        }}
                      >
                        {amenity.description}
                      </p>
                    )}

                    {/* Timing & Capacity Bar */}
                    <div
                      style={{
                        marginTop: '0.625rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--aarizo-border-soft, #E8F1F5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--aarizo-navy, #083B56)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} color="var(--aarizo-coral, #F06543)" />
                        <span>{amenity.openTime}–{amenity.closeTime}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={13} color="#059669" />
                        <span>Max {amenity.capacityPerSlot}</span>
                      </div>
                    </div>

                    {/* Blackout or Maintenance Badges */}
                    {(hasBlackout || hasMaintenance) && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {hasBlackout && (
                          <span style={{ fontSize: '0.625rem', fontWeight: 800, background: '#FEE2E2', color: '#991B1B', padding: '0.15rem 0.4rem', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Ban size={10} /> Blackout
                          </span>
                        )}
                        {hasMaintenance && (
                          <span style={{ fontSize: '0.625rem', fontWeight: 800, background: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.4rem', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Wrench size={10} /> Maintenance
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Coral Outline Button matching Resident & NGO tabs */}
                <div style={{ padding: '0.75rem', paddingTop: 0 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDetailAmenity(amenity);
                    }}
                    style={{
                      width: '100%',
                      height: '36px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem',
                      borderRadius: '10px',
                      background: '#FFF7F5',
                      border: '1px solid var(--aarizo-coral, #F06543)',
                      color: 'var(--aarizo-coral, #F06543)',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <span>View Details &amp; Actions</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Booking History Section Card ── */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            borderRadius: '16px',
            padding: '1rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.04)',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: '0 0 0.75rem 0' }}>
            All Resident Amenity Bookings
          </h3>
          <div>
            <DataTable
              columns={[
                { key: 'amenityName', header: 'Amenity' },
                { key: 'residentName', header: 'Resident' },
                { key: 'flatNumber', header: 'Flat' },
                { key: 'date', header: 'Date' },
                { key: 'timeSlot', header: 'Time' },
                { key: 'guestsCount', header: 'Guests', render: (b: any) => `${b.guestsCount} Guest(s)` },
                {
                  key: 'status',
                  header: 'Status',
                  render: (b: any) => (
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.75rem',
                        borderRadius: '9999px',
                        fontWeight: 800,
                        background:
                          b.status === 'APPROVED'
                            ? '#D1FAE5'
                            : b.status === 'PENDING'
                            ? '#FEF3C7'
                            : b.status === 'CANCELLED'
                            ? '#F3F4F6'
                            : '#FEE2E2',
                        color:
                          b.status === 'APPROVED'
                            ? '#065F46'
                            : b.status === 'PENDING'
                            ? '#92400E'
                            : b.status === 'CANCELLED'
                            ? '#374151'
                            : '#991B1B',
                      }}
                    >
                      {b.status}
                    </span>
                  ),
                },
              ]}
              data={bookings}
              keyExtractor={(b: any) => b.id}
              pageSize={10}
              mobileRender={(b: any) => (
                <MobileDataCard
                  title={b.amenityName}
                  subtitle={`${b.date} - ${b.timeSlot}`}
                  status={
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        fontSize: '0.625rem',
                        borderRadius: '9999px',
                        fontWeight: 800,
                        background:
                          b.status === 'APPROVED'
                            ? '#D1FAE5'
                            : b.status === 'PENDING'
                            ? '#FEF3C7'
                            : b.status === 'CANCELLED'
                            ? '#F3F4F6'
                            : '#FEE2E2',
                        color:
                          b.status === 'APPROVED'
                            ? '#065F46'
                            : b.status === 'PENDING'
                            ? '#92400E'
                            : b.status === 'CANCELLED'
                            ? '#374151'
                            : '#991B1B',
                      }}
                    >
                      {b.status}
                    </span>
                  }
                  attributes={[
                    { label: 'Resident', value: `${b.residentName} (${b.flatNumber})` },
                    { label: 'Guests', value: b.guestsCount },
                  ]}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Amenity Detail & Management Modal */}
      {selectedDetailAmenity && (
        <Modal
          isOpen={!!selectedDetailAmenity}
          onClose={() => setSelectedDetailAmenity(null)}
          title={`Facility Control: ${selectedDetailAmenity.name}`}
        >
          <div className="space-y-4">
            {/* Banner Image */}
            {selectedDetailAmenity.imageUrl ? (
              <div className="h-44 w-full rounded-xl overflow-hidden relative">
                <img
                  src={selectedDetailAmenity.imageUrl}
                  alt={selectedDetailAmenity.name}
                  className="w-full h-full object-cover"
                />
                <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--aarizo-navy, #083B56)', color: '#ffffff', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 20, fontWeight: 800 }}>
                  {selectedDetailAmenity.type.replace(/_/g, ' ')}
                </div>
              </div>
            ) : null}

            {/* Quick Specs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.75rem', background: 'var(--aarizo-card-blue, #F4FAFE)', borderRadius: '12px', border: '1px solid var(--aarizo-border, #DCE8EF)', fontSize: '0.75rem' }}>
              <div>
                <span style={{ color: 'var(--aarizo-text-secondary, #657785)', display: 'block', fontWeight: 600 }}>Timings</span>
                <span style={{ fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Clock size={14} color="var(--aarizo-coral, #F06543)" /> {selectedDetailAmenity.openTime} - {selectedDetailAmenity.closeTime}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--aarizo-text-secondary, #657785)', display: 'block', fontWeight: 600 }}>Slot Capacity</span>
                <span style={{ fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Users size={14} color="#059669" /> Max {selectedDetailAmenity.capacityPerSlot} Pax / slot
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--aarizo-text-secondary, #657785)', display: 'block', fontWeight: 600 }}>Location</span>
                <span style={{ fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Building size={14} color="var(--aarizo-navy, #083B56)" /> {selectedDetailAmenity.location}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--aarizo-text-secondary, #657785)', display: 'block', fontWeight: 600 }}>Booking Fee</span>
                <span style={{ fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  {selectedDetailAmenity.bookingFee && selectedDetailAmenity.bookingFee > 0
                    ? `₹${selectedDetailAmenity.bookingFee}`
                    : 'Complimentary / Free'}
                </span>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                Description
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0 }}>{selectedDetailAmenity.description}</p>
            </div>

            {/* Active Blackouts */}
            {selectedDetailAmenity.blackoutDates.length > 0 && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.75rem', borderRadius: '12px', fontSize: '0.75rem', color: '#991B1B' }}>
                <span style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Ban size={14} color="#DC2626" /> Blackout Dates Scheduled:
                </span>
                {selectedDetailAmenity.blackoutDates.map(b => (
                  <div key={b.id} style={{ fontSize: '0.75rem', paddingLeft: '1.25rem', marginTop: 2 }}>
                    • {b.startDate} to {b.endDate}: <i>{b.reason}</i>
                  </div>
                ))}
              </div>
            )}

            {/* Active Maintenance */}
            {selectedDetailAmenity.maintenanceSchedules.length > 0 && (
              <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: '0.75rem', borderRadius: '12px', fontSize: '0.75rem', color: '#92400E' }}>
                <span style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Wrench size={14} color="#D97706" /> Maintenance Scheduled:
                </span>
                {selectedDetailAmenity.maintenanceSchedules.map(m => (
                  <div key={m.id} style={{ fontSize: '0.75rem', paddingLeft: '1.25rem', marginTop: 2 }}>
                    • {m.title} ({m.startDate} - {m.endDate})
                  </div>
                ))}
              </div>
            )}

            {/* Secretary Admin Actions Bar */}
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--aarizo-border, #DCE8EF)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                style={{ padding: '0.5rem', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontWeight: 800, fontSize: '0.75rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                onClick={() => {
                  setSelectedAmenity(selectedDetailAmenity);
                  setShowBlackoutModal(true);
                }}
              >
                <Ban size={15} /> Block Dates
              </button>
              <button
                type="button"
                style={{ padding: '0.5rem', background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E', fontWeight: 800, fontSize: '0.75rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                onClick={() => {
                  setSelectedAmenity(selectedDetailAmenity);
                  setShowMaintenanceModal(true);
                }}
              >
                <Wrench size={15} /> Maintenance
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Create Amenity */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Society Amenity"
        maxWidth="580px"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              form="create-amenity-form"
              type="submit"
              style={{
                padding: '0.625rem 1.375rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #F06543 0%, #E05432 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(240, 101, 67, 0.3)',
              }}
            >
              Create Amenity
            </button>
          </div>
        }
      >
        <form id="create-amenity-form" onSubmit={handleCreateAmenity} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amenity Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Squash Court B"
              value={newAmenity.name}
              onChange={e => setNewAmenity({ ...newAmenity, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select
                value={newAmenity.type}
                onChange={e => setNewAmenity({ ...newAmenity, type: e.target.value as AmenityType })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                {AMENITY_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Clubhouse Floor 1"
                value={newAmenity.location}
                onChange={e => setNewAmenity({ ...newAmenity, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Brief facilities description..."
              value={newAmenity.description}
              onChange={e => setNewAmenity({ ...newAmenity, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slot Capacity</label>
              <input
                type="number"
                min={1}
                value={newAmenity.capacityPerSlot}
                onChange={e => setNewAmenity({ ...newAmenity, capacityPerSlot: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Open Time</label>
              <input
                type="time"
                value={newAmenity.openTime}
                onChange={e => setNewAmenity({ ...newAmenity, openTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Close Time</label>
              <input
                type="time"
                value={newAmenity.closeTime}
                onChange={e => setNewAmenity({ ...newAmenity, closeTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <FileUpload
              category="general"
              label="Upload Amenity Photo Banner"
              onUploadSuccess={(url) => setNewAmenity({ ...newAmenity, imageUrl: url })}
            />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={newAmenity.requiresApproval}
                onChange={e => setNewAmenity({ ...newAmenity, requiresApproval: e.target.checked })}
              />
              Requires Admin Approval
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={newAmenity.isBookable}
                onChange={e => setNewAmenity({ ...newAmenity, isBookable: e.target.checked })}
              />
              Available for Booking
            </label>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Blackout Date */}
      <Modal
        isOpen={showBlackoutModal}
        onClose={() => setShowBlackoutModal(false)}
        title={`Block Dates: ${selectedAmenity?.name}`}
        maxWidth="500px"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <button
              type="button"
              onClick={() => setShowBlackoutModal(false)}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              form="block-dates-form"
              type="submit"
              style={{
                padding: '0.625rem 1.375rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)',
              }}
            >
              Save Block Dates
            </button>
          </div>
        }
      >
        <form id="block-dates-form" onSubmit={handleAddBlackout} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={blackoutForm.startDate}
                onChange={e => setBlackoutForm({ ...blackoutForm, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={blackoutForm.endDate}
                onChange={e => setBlackoutForm({ ...blackoutForm, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Blackout</label>
            <input
              type="text"
              required
              placeholder="e.g. Society Private Festival Function"
              value={blackoutForm.reason}
              onChange={e => setBlackoutForm({ ...blackoutForm, reason: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Schedule Maintenance */}
      <Modal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        title={`Schedule Maintenance: ${selectedAmenity?.name}`}
        maxWidth="520px"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <button
              type="button"
              onClick={() => setShowMaintenanceModal(false)}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              form="schedule-maintenance-form"
              type="submit"
              style={{
                padding: '0.625rem 1.375rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #083B56 0%, #176B91 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(8, 59, 86, 0.3)',
              }}
            >
              Schedule Maintenance
            </button>
          </div>
        }
      >
        <form id="schedule-maintenance-form" onSubmit={handleAddMaintenance} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Deep Cleaning & Water Treatment"
              value={maintenanceForm.title}
              onChange={e => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                required
                value={maintenanceForm.startDate}
                onChange={e => setMaintenanceForm({ ...maintenanceForm, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date & Time</label>
              <input
                type="datetime-local"
                value={maintenanceForm.endDate}
                onChange={e => setMaintenanceForm({ ...maintenanceForm, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
            <textarea
              rows={2}
              value={maintenanceForm.notes}
              onChange={e => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
