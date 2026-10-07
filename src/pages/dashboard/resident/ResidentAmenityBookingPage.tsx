import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { amenityService } from '../../../services/amenityService';
import { realtimeService } from '../../../services/realtimeService';
import type { SocietyAmenity, AmenityBooking, AmenityType } from '../../../types/amenity';
import { Modal } from '../../../components/ui/Modal';
import { DataTable } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';
import { RazorpayCheckoutModal } from '../../../domains/payments/RazorpayCheckoutModal';
import { AdvertisementPopup } from '../../../components/ads/AdvertisementPopup';
import { OffersLauncherPill } from '../../../components/ads/OffersLauncherPill';
import {
  Calendar,
  Clock,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  CreditCard,
  ShieldCheck,
  MapPin,
  ChevronRight,
  X,
  Shield,
  Dumbbell,
  Trophy,
  PartyPopper,
  HeartHandshake,
  LayoutGrid,
  ListOrdered,
  ArrowLeft,
  Search,
  Wrench,
} from 'lucide-react';

type FilterCategory = 'ALL' | 'FITNESS' | 'SPORTS' | 'EVENTS' | 'RECREATION';

interface CategoryTab {
  id: FilterCategory;
  label: string;
  icon: React.FC<{ className?: string; size?: number; style?: React.CSSProperties }>;
  types?: AmenityType[];
}

const CATEGORY_TABS: CategoryTab[] = [
  { id: 'ALL', label: 'All Facilities', icon: Sparkles },
  { id: 'FITNESS', label: 'Fitness & Gym', icon: Dumbbell, types: ['GYM', 'SWIMMING_POOL'] },
  { id: 'SPORTS', label: 'Sports & Courts', icon: Trophy, types: ['BADMINTON_COURT', 'TENNIS_COURT'] },
  { id: 'EVENTS', label: 'Events & Halls', icon: PartyPopper, types: ['CLUBHOUSE', 'PARTY_HALL', 'MEETING_ROOM'] },
  { id: 'RECREATION', label: 'Recreation', icon: HeartHandshake, types: ['KIDS_PLAY_AREA', 'VISITOR_LOUNGE'] },
];

export const ResidentAmenityBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const societyId = (currentUser as any)?.societyId || 'soc-gvs';
  const residentId = currentUser?.id || 'user-resident-01';
  const residentName = currentUser?.name || 'Sarvesh Kulkarni';
  const flatNumber = (currentUser as any)?.flatNumber || (currentUser as any)?.flatDetails || 'B-1204';

  const [amenities, setAmenities] = useState<SocietyAmenity[]>([]);
  const [userBookings, setUserBookings] = useState<AmenityBooking[]>([]);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('ALL');
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'BOOKINGS'>('EXPLORE');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail Modal / Sheet State
  const [selectedDetailAmenity, setSelectedDetailAmenity] = useState<SocietyAmenity | null>(null);

  // Booking Form State (Modal)
  const [selectedAmenity, setSelectedAmenity] = useState<SocietyAmenity | null>(null);
  const [isAdOpen, setIsAdOpen] = useState(false);

  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [startTime, setStartTime] = useState<string>('07:00');
  const [endTime, setEndTime] = useState<string>('08:00');
  const [guestCount, setGuestCount] = useState<number>(1);
  const [purpose, setPurpose] = useState<string>('');

  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Slot Availability state
  const [slotData, setSlotData] = useState<Array<{
    startTime: string;
    endTime: string;
    bookedCount: number;
    capacity: number;
    remainingSpots: number;
    status: 'AVAILABLE' | 'LIMITED' | 'FULL';
  }>>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Razorpay Payment Modal State
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);

  useEffect(() => {
    loadData();

    // Listen for realtime booking updates
    const unsub = realtimeService.subscribe('*', (msg) => {
      if (
        msg.topic === 'AMENITY_BOOKED' ||
        msg.topic === 'AMENITY_AVAILABILITY' ||
        msg.topic === 'AMENITY_AVAILABILITY_CHANGED'
      ) {
        loadData();
        if (selectedAmenity) {
          loadSlots(selectedAmenity.id, bookingDate);
        }
      }
    });
    return () => unsub();
  }, [societyId, residentId, selectedAmenity, bookingDate]);

  // Load slot availability whenever selected amenity or date changes
  useEffect(() => {
    if (selectedAmenity) {
      loadSlots(selectedAmenity.id, bookingDate);
    }
  }, [selectedAmenity, bookingDate]);

  const loadSlots = async (amenityId: string, date: string) => {
    setIsLoadingSlots(true);
    try {
      const res = await amenityService.fetchSlotAvailability(societyId, amenityId, date);
      setSlotData(res.slots || []);
    } catch {
      setSlotData([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const loadData = () => {
    const list = amenityService.getAmenities(societyId);
    setAmenities(list);
    const bks = amenityService.getBookings(societyId).filter((b) => b.residentId === residentId);
    setUserBookings(bks);
  };

  const handleOpenBookingModal = (amenity: SocietyAmenity) => {
    setSelectedAmenity(amenity);
    setStartTime(amenity.openTime);
    const [h, m] = amenity.openTime.split(':').map(Number);
    const endH = Math.min(23, h + 1).toString().padStart(2, '0');
    setEndTime(`${endH}:${m.toString().padStart(2, '0')}`);
    setGuestCount(1);
    setPurpose('');
    setBookingError(null);
    setBookingSuccess(null);
    loadSlots(amenity.id, bookingDate);
  };

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmenity) return;

    setBookingError(null);
    setBookingSuccess(null);

    // Selected slot check
    const currentSlot = slotData.find((s) => s.startTime === startTime);
    if (currentSlot && currentSlot.status === 'FULL') {
      setBookingError(`The ${startTime} - ${endTime} slot is fully booked. Please select another slot or date.`);
      return;
    }
    if (currentSlot && guestCount > currentSlot.remainingSpots) {
      setBookingError(`Only ${currentSlot.remainingSpots} spot(s) remaining for ${startTime} - ${endTime}.`);
      return;
    }

    // If amenity requires a booking fee, invoke Razorpay checkout
    if (selectedAmenity.bookingFee && selectedAmenity.bookingFee > 0) {
      setIsRazorpayOpen(true);
      return;
    }

    // Complimentary booking flow
    try {
      const newBooking = await amenityService.createBookingAsync(
        societyId,
        selectedAmenity.id,
        residentId,
        residentName,
        flatNumber,
        bookingDate,
        startTime,
        endTime,
        guestCount,
        purpose,
        {
          bookingFee: 0,
          paymentStatus: 'FREE',
        }
      );

      realtimeService.publish(
        'AMENITY_BOOKED',
        {
          amenityName: selectedAmenity.name,
          residentName,
          bookingDate,
          timeSlot: `${startTime} - ${endTime}`,
          amount: 0,
        },
        societyId,
        'RESIDENT'
      );

      const remainingAfter = currentSlot ? Math.max(0, currentSlot.remainingSpots - guestCount) : 0;

      setBookingSuccess(
        newBooking.status === 'PENDING'
          ? 'Complimentary booking request submitted! Pending admin approval.'
          : `Booking Confirmed! ${selectedAmenity.name} reserved for ${bookingDate} (${startTime} - ${endTime}). ${remainingAfter} spot(s) remaining.`
      );
      loadData();
      loadSlots(selectedAmenity.id, bookingDate);
      setTimeout(() => {
        setSelectedAmenity(null);
      }, 2000);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to complete booking. Slot capacity reached.');
    }
  };

  const handleRazorpaySuccess = async (paymentDetails: {
    transactionId: string;
    method: 'upi' | 'card' | 'net_banking';
    amount: number;
  }) => {
    if (!selectedAmenity) return;

    try {
      await amenityService.createBookingAsync(
        societyId,
        selectedAmenity.id,
        residentId,
        residentName,
        flatNumber,
        bookingDate,
        startTime,
        endTime,
        guestCount,
        purpose,
        {
          bookingFee: selectedAmenity.bookingFee,
          paymentStatus: 'PAID',
          paymentId: paymentDetails.transactionId,
        }
      );

      // Realtime SSE broadcast
      realtimeService.publish(
        'AMENITY_BOOKED',
        {
          amenityName: selectedAmenity.name,
          residentName,
          bookingDate,
          timeSlot: `${startTime} - ${endTime}`,
          amount: selectedAmenity.bookingFee,
          transactionId: paymentDetails.transactionId,
          method: paymentDetails.method,
        },
        societyId,
        'RESIDENT'
      );

      setBookingSuccess(
        `Payment of ₹${paymentDetails.amount} verified! Booking confirmed for ${selectedAmenity.name} (${bookingDate}, ${startTime} - ${endTime}). Ref: ${paymentDetails.transactionId}`
      );
      setIsRazorpayOpen(false);
      loadData();
      loadSlots(selectedAmenity.id, bookingDate);
      setTimeout(() => {
        setSelectedAmenity(null);
      }, 2000);
    } catch (err: any) {
      setBookingError(err.message || 'Payment received but slot allocation failed due to capacity limit.');
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    amenityService.updateBookingStatus(societyId, bookingId, 'CANCELLED', 'Cancelled by resident');
    loadData();
  };

  const filteredAmenities = amenities.filter(amenity => {
    const matchesCategory = (() => {
      if (activeCategory === 'ALL') return true;
      const cat = CATEGORY_TABS.find(c => c.id === activeCategory);
      if (!cat || !cat.types) return true;
      return cat.types.includes(amenity.type);
    })();

    const matchesSearch = searchQuery === '' ||
      amenity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      amenity.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      amenity.type.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ background: '#F7FBFE', minHeight: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-44 space-y-4">
        
        {/* Header Card (Matching Secretary Portal Amenities Header Style) */}
        <div
          style={{
            background: 'var(--aarizo-card-bg, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
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
              <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em' }}>
                Amenity &amp; Facility Management
              </h1>
              <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
                Green Valley Society · Timings, capacities, blackout dates &amp; resident slot bookings
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab(activeTab === 'EXPLORE' ? 'BOOKINGS' : 'EXPLORE')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '10px',
                background: 'var(--aarizo-coral, #F06543)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              {activeTab === 'EXPLORE' ? (
                <>
                  <ListOrdered size={15} /> My Bookings ({userBookings.length})
                </>
              ) : (
                <>
                  <LayoutGrid size={15} /> All Facilities ({amenities.length})
                </>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'EXPLORE' ? (
          <>
            {/* Search Input Box */}
            <div
              style={{
                position: 'relative',
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #DCE8EF',
                padding: '0.6rem 0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 1px 3px rgba(8, 59, 86, 0.03)',
              }}
            >
              <Search size={18} style={{ color: '#083B56', flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by facility name, location, timing, or category..."
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.8125rem',
                  color: '#083B56',
                  fontWeight: 500,
                  background: 'transparent',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#657785' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Coral Category Filter Pills Track */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
                      gap: '0.4rem',
                      padding: '0.5rem 0.875rem',
                      borderRadius: '12px',
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                      background: isActive ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
                      color: isActive ? '#ffffff' : '#083B56',
                      border: isActive ? '1px solid #F06543' : '1px solid #DCE8EF',
                      boxShadow: isActive ? '0 2px 8px rgba(240, 101, 67, 0.25)' : 'none',
                    }}
                  >
                    <IconComponent size={15} style={{ color: isActive ? '#ffffff' : '#F06543' }} />
                    <span>{tab.label}</span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 900,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '10px',
                        background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#F0654315',
                        color: isActive ? '#ffffff' : '#F06543',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Result Count Subtitle */}
            <div style={{ fontSize: '0.78125rem', color: '#657785', fontWeight: 600, paddingLeft: '0.2rem' }}>
              {filteredAmenities.length} facilities &amp; amenities found
            </div>

            {/* Amenity Cards Grid (2 Cards Per Line on Mobile, 3 on Desktop) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {filteredAmenities.map(amenity => {
                const isPaid = amenity.bookingFee && amenity.bookingFee > 0;
                const isMaintenance = !amenity.isBookable || !amenity.isActive;

                return (
                  <div
                    key={amenity.id}
                    onClick={() => setSelectedDetailAmenity(amenity)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #DCE8EF',
                      overflow: 'hidden',
                      boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    className="hover:shadow-md hover:border-[#F06543]/40 group"
                  >
                    <div>
                      {/* Top Photo Banner with Badges */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                        {amenity.imageUrl ? (
                          <img
                            src={amenity.imageUrl}
                            alt={amenity.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                            <Building size={20} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

                        {/* Top-Left Pricing Badge (Green/Cyan Pill) */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            background: isPaid ? '#083B56' : '#0284C7',
                            color: '#ffffff',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          }}
                        >
                          {isPaid ? `₹${amenity.bookingFee}` : 'Free'}
                        </div>

                        {/* Top-Right Category Badge (Dark Navy Pill) */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            background: '#083B56',
                            color: '#ffffff',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.6rem',
                            letterSpacing: '0.03em',
                            textTransform: 'uppercase',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                            maxWidth: '60%',
                          }}
                          className="truncate"
                        >
                          {amenity.type.replace(/_/g, ' ')}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-2.5 sm:p-4">
                        <h3 className="text-xs sm:text-base font-extrabold text-[#083B56] margin-0 leading-snug line-clamp-1 group-hover:text-[#F06543] transition-colors">
                          {amenity.name}
                        </h3>

                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-[#657785] mt-1 font-medium">
                          <MapPin size={13} className="text-[#F06543] shrink-0" />
                          <span className="truncate">{amenity.location}</span>
                        </div>

                        <p className="text-[10px] sm:text-xs text-[#475569] mt-1.5 line-clamp-2 leading-tight">
                          {amenity.description}
                        </p>

                        {/* Metadata Details Row */}
                        <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold text-[#083B56] pt-2 mt-2 border-t border-[#F1F5F9]">
                          <div className="flex items-center gap-1 text-[#657785]">
                            <Clock size={12} className="text-[#F06543]" />
                            <span className="truncate">{amenity.openTime}–{amenity.closeTime}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#059669] shrink-0">
                            <Users size={12} />
                            <span>Max {amenity.capacityPerSlot}</span>
                          </div>
                        </div>

                        {/* Maintenance Pill if inactive */}
                        {isMaintenance && (
                          <div className="mt-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] sm:text-[10px] font-extrabold border border-amber-200">
                              <Wrench size={10} /> Maintenance
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="p-2 sm:p-4 pt-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDetailAmenity(amenity);
                        }}
                        style={{
                          width: '100%',
                          borderRadius: '10px',
                          background: '#ffffff',
                          border: '1px solid #F06543',
                          color: '#F06543',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(240, 101, 67, 0.08)',
                          transition: 'all 0.15s ease',
                        }}
                        className="py-1.5 sm:py-2 text-[10px] sm:text-xs group-hover:bg-[#F06543] group-hover:text-white"
                      >
                        <span>View Details &amp; Actions</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* User Booking History Tab */
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem', boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#083B56', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} style={{ color: '#F06543' }} /> All Resident Amenity Bookings
              </h2>
              <button
                onClick={() => setActiveTab('EXPLORE')}
                style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F06543', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                + Book New Amenity
              </button>
            </div>

            <DataTable
              columns={[
                { key: 'amenityName', header: 'Amenity', render: (bk: AmenityBooking) => <span className="font-extrabold text-[#083B56]">{bk.amenityName}</span> },
                { key: 'bookingDate', header: 'Date', render: (bk: AmenityBooking) => <span className="text-xs text-slate-600 font-medium">{bk.bookingDate}</span> },
                { key: 'time', header: 'Time Slot', render: (bk: AmenityBooking) => <span className="font-mono text-xs text-[#083B56] font-bold">{bk.startTime} - {bk.endTime}</span> },
                { key: 'guestCount', header: 'Guests', render: (bk: AmenityBooking) => <span className="text-xs font-bold text-slate-700">{bk.guestCount} Pax</span> },
                {
                  key: 'bookingFee',
                  header: 'Fee & Payment',
                  render: (bk: AmenityBooking) => (
                    <span className="text-xs font-semibold">
                      {bk.bookingFee && bk.bookingFee > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-extrabold">
                          ₹{bk.bookingFee} • {bk.paymentStatus || 'PAID'}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-bold">Free</span>
                      )}
                    </span>
                  )
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (bk: AmenityBooking) => (
                    <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${
                      bk.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      bk.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      bk.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {bk.status}
                    </span>
                  )
                },
                {
                  key: 'actions',
                  header: 'Action',
                  render: (bk: AmenityBooking) => (
                    (bk.status === 'APPROVED' || bk.status === 'PENDING') ? (
                      <button
                        onClick={() => handleCancelBooking(bk.id)}
                        className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                    ) : null
                  )
                }
              ]}
              data={userBookings}
              keyExtractor={(bk: AmenityBooking) => bk.id}
              pageSize={10}
              mobileRender={(bk: AmenityBooking) => (
                <MobileDataCard
                  title={bk.amenityName}
                  subtitle={`${bk.bookingDate} • ${bk.startTime} - ${bk.endTime}`}
                  status={
                    <span className={`px-2 py-0.5 text-[0.65rem] rounded-full font-bold ${
                      bk.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      bk.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      bk.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {bk.status}
                    </span>
                  }
                  attributes={[
                    { label: 'Date', value: bk.bookingDate },
                    { label: 'Time', value: `${bk.startTime} - ${bk.endTime}` },
                    { label: 'Guests', value: `${bk.guestCount} Pax` },
                    { label: 'Payment', value: bk.bookingFee && bk.bookingFee > 0 ? `₹${bk.bookingFee} (${bk.paymentStatus})` : 'Free' }
                  ]}
                  actions={
                    (bk.status === 'APPROVED' || bk.status === 'PENDING') ? (
                      <button
                        onClick={() => handleCancelBooking(bk.id)}
                        className="w-full py-2 border border-rose-200 text-rose-600 bg-rose-50/50 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle size={16} /> Cancel Booking
                      </button>
                    ) : undefined
                  }
                />
              )}
            />
          </div>
        )}

        {/* FULL AMENITY DETAIL VIEW (Responsive Sheet / Modal) */}
        {selectedDetailAmenity && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedDetailAmenity(null)}
          >
            <div
              className="bg-white w-full max-h-[92vh] sm:max-h-[88vh] sm:max-w-2xl lg:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Banner Image with Overlay & Floating Badges */}
              <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-slate-900 shrink-0 overflow-hidden">
                {selectedDetailAmenity.imageUrl ? (
                  <img
                    src={selectedDetailAmenity.imageUrl}
                    alt={selectedDetailAmenity.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <Building size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-black/30" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 bg-[#083B56]/95 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 shadow-md border border-white/20">
                  {selectedDetailAmenity.bookingFee && selectedDetailAmenity.bookingFee > 0 ? (
                    <span className="text-[#E5B842] font-extrabold">₹{selectedDetailAmenity.bookingFee} / slot</span>
                  ) : (
                    <span className="text-emerald-300 font-bold">Complimentary (₹0)</span>
                  )}
                </div>

                <div className="absolute top-3 right-14 bg-[#083B56]/95 backdrop-blur-md text-white text-xs tracking-wider uppercase px-3 py-1.5 rounded-full font-extrabold shadow-md border border-white/20">
                  {selectedDetailAmenity.type.replace(/_/g, ' ')}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedDetailAmenity(null)}
                  aria-label="Close detail view"
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 z-10"
                >
                  <X size={20} />
                </button>

                {/* Title Overlay at bottom of banner image */}
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="text-[11px] font-bold text-[#E5B842] tracking-wider uppercase flex items-center gap-1 mb-0.5">
                    <Sparkles size={14} />
                    <span>{selectedDetailAmenity.type.replace(/_/g, ' ')}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-md leading-tight">
                    {selectedDetailAmenity.name}
                  </h2>
                  <p className="text-xs text-slate-200 flex items-center gap-1 mt-1 font-medium">
                    <MapPin size={14} style={{ color: '#F06543' }} />
                    <span>{selectedDetailAmenity.location}</span>
                  </p>
                </div>
              </div>

              {/* Detail Content Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1.5">Facility Description</h4>
                  <p className="text-sm text-slate-700 leading-relaxed font-normal">
                    {selectedDetailAmenity.description}
                  </p>
                </div>

                {/* Operating Hours & Capacity Highlights Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 block">Available Hours</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                      <Clock size={16} style={{ color: '#F06543' }} />
                      <span>{selectedDetailAmenity.openTime} – {selectedDetailAmenity.closeTime}</span>
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 block">Slot Capacity</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                      <Users size={16} style={{ color: '#059669' }} />
                      <span>Max {selectedDetailAmenity.capacityPerSlot} Pax</span>
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 block">Slot Duration</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                      <Calendar size={16} style={{ color: '#083B56' }} />
                      <span>{selectedDetailAmenity.slotDurationMinutes || 60} mins</span>
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 block">Approval Policy</span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                      <Shield size={16} style={{ color: '#D97706' }} />
                      <span>{selectedDetailAmenity.requiresApproval ? 'Admin Approval' : 'Instant Confirm'}</span>
                    </span>
                  </div>
                </div>

                {/* Facility Rules */}
                {selectedDetailAmenity.rules && selectedDetailAmenity.rules.length > 0 && (
                  <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-2xl">
                    <h4 className="text-xs font-bold text-amber-900 tracking-wider uppercase mb-2.5 flex items-center gap-1.5">
                      <AlertCircle size={16} style={{ color: '#F06543' }} />
                      <span>Facility Rules &amp; Guidelines</span>
                    </h4>
                    <ul className="space-y-2">
                      {selectedDetailAmenity.rules.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                          <CheckCircle2 size={16} style={{ color: '#059669' }} />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Booking & Pricing Details Card */}
                <div className="bg-[#F8FAFC] border border-slate-200/80 p-4 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={16} style={{ color: '#083B56' }} />
                    <span>Booking Information</span>
                  </h4>
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-600 font-medium">Fee Status:</span>
                    {selectedDetailAmenity.bookingFee && selectedDetailAmenity.bookingFee > 0 ? (
                      <span className="font-extrabold text-[#F06543] bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                        ₹{selectedDetailAmenity.bookingFee} per slot
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        Complimentary Resident Facility
                      </span>
                    )}
                  </div>
                  {selectedDetailAmenity.bookingFee && selectedDetailAmenity.bookingFee > 0 && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                      <ShieldCheck size={14} style={{ color: '#059669' }} />
                      <span>Instant online checkout backed by Razorpay payments engine.</span>
                    </p>
                  )}
                </div>

              </div>

              {/* Sticky Bottom Action Bar */}
              <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 sm:p-5 flex items-center justify-between gap-4 z-10 shadow-lg shrink-0">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reservation</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {selectedDetailAmenity.bookingFee && selectedDetailAmenity.bookingFee > 0 ? (
                      <span className="text-[#F06543]">₹{selectedDetailAmenity.bookingFee} <span className="text-xs text-slate-500 font-normal">/ slot</span></span>
                    ) : (
                      <span className="text-emerald-600">Free Booking</span>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={!selectedDetailAmenity.isBookable || !selectedDetailAmenity.isActive}
                  onClick={() => {
                    const target = selectedDetailAmenity;
                    setSelectedDetailAmenity(null);
                    handleOpenBookingModal(target);
                  }}
                  className="px-6 py-3 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 min-h-[44px]"
                  style={{
                    background: (!selectedDetailAmenity.isBookable || !selectedDetailAmenity.isActive) ? '#cbd5e1' : 'var(--aarizo-coral, #F06543)',
                    cursor: (!selectedDetailAmenity.isBookable || !selectedDetailAmenity.isActive) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Calendar size={16} />
                  <span>Book Slot Now</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booking Form Modal (Date & Time Picker + Razorpay trigger) */}
        {selectedAmenity && (
          <Modal isOpen={!!selectedAmenity} onClose={() => setSelectedAmenity(null)} title={`Book Slot: ${selectedAmenity.name}`}>
            <form onSubmit={handleBookSlot} className="space-y-4">
              {bookingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>{bookingError}</span>
                </div>
              )}

              {bookingSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{bookingSuccess}</span>
                </div>
              )}

              <div className="bg-[#EAF6FC] border border-[#DCE8EF] p-3 rounded-xl text-xs text-[#083B56] space-y-1">
                <p><strong>Configured Hours:</strong> {selectedAmenity.openTime} to {selectedAmenity.closeTime}</p>
                <p><strong>Max Slot Capacity:</strong> {selectedAmenity.capacityPerSlot} Pax</p>
                {selectedAmenity.requiresApproval && (
                  <p className="text-amber-700 font-medium">⚠️ Note: Bookings for this facility require society admin approval.</p>
                )}
              </div>

              {/* Price Fee Notice */}
              {selectedAmenity.bookingFee && selectedAmenity.bookingFee > 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center font-bold text-emerald-950">
                    <span>Facility Reservation Fee:</span>
                    <span className="text-base text-emerald-700 font-extrabold">₹{selectedAmenity.bookingFee}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700">
                    <ShieldCheck size={14} /> Instant Razorpay checkout (UPI QR, GooglePay, PhonePe, Cards, NetBanking)
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" /> Complimentary Society Facility (₹0)
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Booking Date</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  min={new Date().toISOString().substring(0, 10)}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-[#F7FBFE] text-[#083B56] font-bold"
                />
              </div>

              {/* Live Real-time Time Slot Availability Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#083B56]">
                    Select Time Slot &amp; View Live Capacity
                  </label>
                  {isLoadingSlots && (
                    <span className="text-[11px] text-[#F06543] font-semibold animate-pulse">
                      Updating availability...
                    </span>
                  )}
                </div>

                {slotData.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">
                    {slotData.map((slot, idx) => {
                      const isSelected = startTime === slot.startTime && endTime === slot.endTime;
                      const isFull = slot.status === 'FULL';

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isFull}
                          onClick={() => {
                            setStartTime(slot.startTime);
                            setEndTime(slot.endTime);
                            setBookingError(null);
                          }}
                          style={{
                            background: isSelected
                              ? '#F06543'
                              : isFull
                              ? '#F1F5F9'
                              : '#FFFFFF',
                            color: isSelected
                              ? '#FFFFFF'
                              : isFull
                              ? '#94A3B8'
                              : '#083B56',
                            borderColor: isSelected
                              ? '#F06543'
                              : isFull
                              ? '#E2E8F0'
                              : '#DCE8EF',
                          }}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            isFull ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-[#F06543]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs font-mono">
                              {slot.startTime} – {slot.endTime}
                            </span>
                            {isSelected && <CheckCircle2 size={13} className="text-white shrink-0" />}
                          </div>

                          <div className="mt-1 flex items-center justify-between">
                            {isFull ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-700 uppercase">
                                Fully Booked
                              </span>
                            ) : slot.status === 'LIMITED' ? (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  isSelected ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {slot.remainingSpots} / {slot.capacity} spots left
                              </span>
                            ) : (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  isSelected ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {slot.remainingSpots} / {slot.capacity} spots left
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Guests / Pax</label>
                <input
                  type="number"
                  min={1}
                  max={selectedAmenity.capacityPerSlot}
                  required
                  value={guestCount}
                  onChange={e => setGuestCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Birthday celebration, morning practice"
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAmenity(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-slate-200 transition bg-slate-100 text-slate-600 border border-slate-300 cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white font-bold text-sm rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                  style={{ background: 'var(--aarizo-coral, #F06543)' }}
                >
                  {selectedAmenity.bookingFee && selectedAmenity.bookingFee > 0 ? (
                    <>
                      <CreditCard size={15} /> Pay ₹{selectedAmenity.bookingFee} via Razorpay
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Razorpay Online Checkout Modal */}
        {selectedAmenity && (
          <RazorpayCheckoutModal
            isOpen={isRazorpayOpen}
            onClose={() => setIsRazorpayOpen(false)}
            onSuccess={handleRazorpaySuccess}
            amount={selectedAmenity.bookingFee || 0}
            purpose={`Amenity Booking: ${selectedAmenity.name}`}
            societyName="Green Valley Society"
            invoiceNumber={`AMN-${Date.now().toString().slice(-6)}`}
            invoiceId={`amn-${selectedAmenity.id}`}
            userName={residentName}
            userPhone={currentUser?.phone || '9876543210'}
            userEmail={currentUser?.email || 'resident@aarizo.com'}
          />
        )}

        {/* Society Partner Discounts Launcher & Modal */}
        <OffersLauncherPill onClick={() => setIsAdOpen(true)} label="Sports &amp; Fitness Deals" />
        <AdvertisementPopup isOpen={isAdOpen} onClose={() => setIsAdOpen(false)} />
      </div>
    </div>
  );
};

export default ResidentAmenityBookingPage;
