import type {
  SocietyAmenity,
  AmenityBooking,
  CommunityAnnouncement,
  CommunityEvent,
  CommunityPoll,
  CommunityPost,
  RSVPStatus
} from '../types/amenity';
import { amenityRepository, amenityBookingRepository } from '../repositories/amenities/AmenityRepository';

const AMENITIES_STORAGE_KEY = 'communityos_amenities';
const BOOKINGS_STORAGE_KEY = 'communityos_amenity_bookings';
const ANNOUNCEMENTS_STORAGE_KEY = 'communityos_announcements';
const EVENTS_STORAGE_KEY = 'communityos_events';
const POLLS_STORAGE_KEY = 'communityos_polls';
const POSTS_STORAGE_KEY = 'communityos_posts';

const SEED_AMENITIES: Omit<SocietyAmenity, 'societyId'>[] = [
  {
    id: 'amenity-pool-1',
    name: 'Olympia Swimming Pool',
    type: 'SWIMMING_POOL',
    description: 'Temperature-controlled lap pool with separate kids splash area.',
    location: 'Clubhouse Ground Floor',
    capacityPerSlot: 15,
    openTime: '06:00',
    closeTime: '21:00',
    slotDurationMinutes: 60,
    requiresApproval: false,
    isBookable: true,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
    bookingFee: 0,
    rules: ['Proper swimwear required', 'Shower before entering', 'No glass containers near pool area'],
    blackoutDates: [],
    maintenanceSchedules: [
      {
        id: 'maint-pool-1',
        title: 'Weekly Chlorine Sanitization & Filter Backwash',
        startDate: '2026-09-15 06:00',
        endDate: '2026-09-15 11:00',
        status: 'SCHEDULED',
        notes: 'Pool temporarily closed for deep filtration maintenance.'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'amenity-gym-1',
    name: 'Fitness First Gym',
    type: 'GYM',
    description: 'Fully equipped cardio & weight training facility with professional trainers.',
    location: 'Clubhouse 1st Floor',
    capacityPerSlot: 20,
    openTime: '05:30',
    closeTime: '22:00',
    slotDurationMinutes: 60,
    requiresApproval: false,
    isBookable: true,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    bookingFee: 0,
    rules: ['Carry a personal gym towel', 'Wipe equipment after use', 'Non-marking sports shoes mandatory'],
    blackoutDates: [],
    maintenanceSchedules: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'amenity-clubhouse-1',
    name: 'Grand Central Clubhouse',
    type: 'CLUBHOUSE',
    description: 'Multi-purpose indoor activity area with indoor games, billards, and lounge.',
    location: 'Central Plaza',
    capacityPerSlot: 50,
    openTime: '08:00',
    closeTime: '22:00',
    slotDurationMinutes: 120,
    requiresApproval: true,
    isBookable: true,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    bookingFee: 500,
    rules: ['Keep noise levels moderate', 'No smoking allowed'],
    blackoutDates: [],
    maintenanceSchedules: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'amenity-badminton-1',
    name: 'Badminton Court 1 (Indoor)',
    type: 'BADMINTON_COURT',
    description: 'Synthetic rubberized indoor court with LED floodlights.',
    location: 'Sports Complex Court A',
    capacityPerSlot: 4,
    openTime: '06:00',
    closeTime: '22:00',
    slotDurationMinutes: 60,
    requiresApproval: false,
    isBookable: true,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    bookingFee: 150,
    rules: ['Non-marking shoes mandatory', 'Maximum 4 players per slot'],
    blackoutDates: [],
    maintenanceSchedules: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'amenity-tennis-1',
    name: 'Tennis Court',
    type: 'TENNIS_COURT',
    description: 'Outdoor acrylic hard court with night illumination.',
    location: 'Sports Arena Court B',
    capacityPerSlot: 4,
    openTime: '06:00',
    closeTime: '21:00',
    slotDurationMinutes: 60,
    requiresApproval: false,
    isBookable: true,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    bookingFee: 250,
    rules: ['Proper tennis footwear required', 'Bring own rackets and balls'],
    blackoutDates: [],
    maintenanceSchedules: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'amenity-party-hall-1',
    name: 'Royal Celebration Party Hall',
    type: 'PARTY_HALL',
    description: 'Air-conditioned banqueting space with attached pantry and music system.',
    location: 'Clubhouse 2nd Floor',
    capacityPerSlot: 100,
    openTime: '10:00',
    closeTime: '23:00',
    slotDurationMinutes: 240,
    requiresApproval: true,
    isBookable: true,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
    bookingFee: 1500,
    rules: ['Loud music must stop by 22:00', 'Decorations must not damage walls'],
    blackoutDates: [],
    maintenanceSchedules: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'amenity-meeting-room-1',
    name: 'Executive Boardroom',
    type: 'MEETING_ROOM',
    description: 'Conference room equipped with high-speed WiFi, 65-inch TV presentation display, and whiteboard.',
    location: 'Admin Block 1st Floor',
    capacityPerSlot: 12,
    openTime: '08:00',
    closeTime: '20:00',
    slotDurationMinutes: 60,
    requiresApproval: true,
    isBookable: true,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80',
    rules: ['Leave board room clean after meeting', 'Switch off AV display upon exit'],
    blackoutDates: [],
    maintenanceSchedules: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'amenity-kids-play-1',
    name: 'Wonderland Kids Play Zone',
    type: 'KIDS_PLAY_AREA',
    description: 'Safe rubber-matted outdoor playground with swings, slides, and climbing frames.',
    location: 'East Lawn Garden',
    capacityPerSlot: 25,
    openTime: '07:00',
    closeTime: '20:00',
    slotDurationMinutes: 60,
    requiresApproval: false,
    isBookable: true,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=800&q=80',
    rules: ['Children under 6 must be accompanied by adults'],
    blackoutDates: [],
    maintenanceSchedules: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'amenity-lounge-1',
    name: 'Skyline Visitor Lounge',
    type: 'VISITOR_LOUNGE',
    description: 'Comfortable waiting and casual discussion lounge with coffee kiosk.',
    location: 'Main Tower Gate Entrance',
    capacityPerSlot: 15,
    openTime: '08:00',
    closeTime: '22:00',
    slotDurationMinutes: 60,
    requiresApproval: false,
    isBookable: true,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
    rules: ['Maintain quiet decorum'],
    blackoutDates: [],
    maintenanceSchedules: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

class AmenityService {
  // --- AMENITIES MANAGEMENT ---
  getAmenities(societyId: string): SocietyAmenity[] {
    const raw = localStorage.getItem(AMENITIES_STORAGE_KEY);
    let items: SocietyAmenity[] = raw ? JSON.parse(raw) : [];

    const societyItems = items.filter(a => a.societyId === societyId);
    if (societyItems.length === 0) {
      const seeded = SEED_AMENITIES.map(a => ({ ...a, societyId }));
      items = [...items, ...seeded];
      localStorage.setItem(AMENITIES_STORAGE_KEY, JSON.stringify(items));
      return seeded;
    }
    return societyItems;
  }

  saveAmenity(amenity: SocietyAmenity): SocietyAmenity {
    const raw = localStorage.getItem(AMENITIES_STORAGE_KEY);
    let items: SocietyAmenity[] = raw ? JSON.parse(raw) : [];

    const existingIndex = items.findIndex(a => a.id === amenity.id);
    const updatedAmenity = { ...amenity, updatedAt: new Date().toISOString() };
    if (existingIndex >= 0) {
      items[existingIndex] = updatedAmenity;
    } else {
      items.unshift(updatedAmenity);
    }

    localStorage.setItem(AMENITIES_STORAGE_KEY, JSON.stringify(items));
    amenityRepository.create(updatedAmenity).catch(() => {});
    return updatedAmenity;
  }

  createAmenity(societyId: string, data: Omit<SocietyAmenity, 'id' | 'societyId' | 'createdAt' | 'updatedAt' | 'blackoutDates' | 'maintenanceSchedules'>): SocietyAmenity {
    const newAmenity: SocietyAmenity = {
      ...data,
      id: `amenity-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      societyId,
      blackoutDates: [],
      maintenanceSchedules: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveAmenity(newAmenity);
    return newAmenity;
  }

  addBlackoutDate(societyId: string, amenityId: string, startDate: string, endDate: string, reason: string): SocietyAmenity {
    const amenities = this.getAmenities(societyId);
    const target = amenities.find(a => a.id === amenityId);
    if (!target) throw new Error('Amenity not found');

    const blackout = {
      id: `blk-${Date.now()}`,
      startDate,
      endDate,
      reason
    };

    target.blackoutDates.push(blackout);
    return this.saveAmenity(target);
  }

  addMaintenanceSchedule(societyId: string, amenityId: string, title: string, startDate: string, endDate: string, notes?: string): SocietyAmenity {
    const amenities = this.getAmenities(societyId);
    const target = amenities.find(a => a.id === amenityId);
    if (!target) throw new Error('Amenity not found');

    const maintenance = {
      id: `maint-${Date.now()}`,
      title,
      startDate,
      endDate,
      status: 'SCHEDULED' as const,
      notes
    };

    target.maintenanceSchedules.push(maintenance);
    return this.saveAmenity(target);
  }

  // --- BOOKING OPERATIONS & VALIDATIONS ---
  getBookings(societyId: string): AmenityBooking[] {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    const items: AmenityBooking[] = raw ? JSON.parse(raw) : [];
    return items.filter(b => b.societyId === societyId);
  }

  async fetchSlotAvailability(
    societyId: string,
    amenityId: string,
    bookingDate: string
  ): Promise<{
    amenityId: string;
    amenityName: string;
    date: string;
    capacityPerSlot: number;
    openTime: string;
    closeTime: string;
    slotDurationMinutes: number;
    slots: Array<{
      startTime: string;
      endTime: string;
      bookedCount: number;
      capacity: number;
      remainingSpots: number;
      status: 'AVAILABLE' | 'LIMITED' | 'FULL';
    }>;
  }> {
    try {
      const res = await fetch(`/api/amenities/${amenityId}/availability?date=${bookingDate}&societyId=${societyId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    // Local calculation fallback
    const amenity = this.getAmenities(societyId).find((a) => a.id === amenityId);
    const capacityPerSlot = amenity?.capacityPerSlot || 10;
    const openTime = amenity?.openTime || '06:00';
    const closeTime = amenity?.closeTime || '22:00';
    const slotDurationMinutes = amenity?.slotDurationMinutes || 60;

    const existingBookings = this.getBookings(societyId).filter(
      (b) =>
        b.amenityId === amenityId &&
        b.bookingDate === bookingDate &&
        (b.status === 'CONFIRMED' || b.status === 'APPROVED' || b.status === 'PENDING')
    );

    const parseMins = (tStr: string) => {
      const parts = (tStr || '00:00').split(':').map(Number);
      return parts[0] * 60 + parts[1];
    };

    const formatMins = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const slots = [];
    let curMin = parseMins(openTime);
    const closeMin = parseMins(closeTime);

    while (curMin + slotDurationMinutes <= closeMin) {
      const startTime = formatMins(curMin);
      const endTime = formatMins(curMin + slotDurationMinutes);

      let bookedCount = 0;
      for (const bk of existingBookings) {
        if (startTime < bk.endTime && endTime > bk.startTime) {
          bookedCount += bk.guestCount || 1;
        }
      }

      const remainingSpots = Math.max(0, capacityPerSlot - bookedCount);
      const status = remainingSpots === 0 ? 'FULL' : remainingSpots <= 2 ? 'LIMITED' : 'AVAILABLE';

      slots.push({
        startTime,
        endTime,
        bookedCount,
        capacity: capacityPerSlot,
        remainingSpots,
        status: status as 'AVAILABLE' | 'LIMITED' | 'FULL',
      });

      curMin += slotDurationMinutes;
    }

    return {
      amenityId,
      amenityName: amenity?.name || 'Amenity',
      date: bookingDate,
      capacityPerSlot,
      openTime,
      closeTime,
      slotDurationMinutes,
      slots,
    };
  }

  validateBookingRequest(
    societyId: string,
    amenityId: string,
    bookingDate: string, // YYYY-MM-DD
    startTime: string, // HH:mm
    endTime: string, // HH:mm
    requestedGuestCount: number
  ): { valid: boolean; error?: string } {
    const amenities = this.getAmenities(societyId);
    const amenity = amenities.find((a) => a.id === amenityId);

    if (!amenity) return { valid: false, error: 'Amenity does not exist' };
    if (!amenity.isActive || !amenity.isBookable) {
      return { valid: false, error: 'This amenity is currently unavailable for booking' };
    }

    // 1. Check operating hours
    if (startTime < amenity.openTime || endTime > amenity.closeTime) {
      return {
        valid: false,
        error: `Booking time (${startTime} - ${endTime}) is outside operating hours (${amenity.openTime} - ${amenity.closeTime})`,
      };
    }

    if (startTime >= endTime) {
      return { valid: false, error: 'End time must be after start time' };
    }

    // 2. Check Blackout Dates
    for (const blk of amenity.blackoutDates || []) {
      if (bookingDate >= blk.startDate && bookingDate <= blk.endDate) {
        return { valid: false, error: `Amenity is blocked on this date due to: ${blk.reason}` };
      }
    }

    // 3. Check Scheduled Maintenance
    for (const maint of amenity.maintenanceSchedules || []) {
      const maintDate = maint.startDate.substring(0, 10);
      if (bookingDate === maintDate && maint.status !== 'COMPLETED') {
        return { valid: false, error: `Amenity has scheduled maintenance: ${maint.title}` };
      }
    }

    // 4. Overlapping & Capacity overflow check (includes CONFIRMED, APPROVED, and PENDING)
    const existingBookings = this.getBookings(societyId).filter(
      (b) =>
        b.amenityId === amenityId &&
        b.bookingDate === bookingDate &&
        (b.status === 'CONFIRMED' || b.status === 'APPROVED' || b.status === 'PENDING')
    );

    let currentOccupancy = 0;

    for (const booking of existingBookings) {
      // Overlap condition: start < existingEnd AND end > existingStart
      const isOverlapping = startTime < booking.endTime && endTime > booking.startTime;
      if (isOverlapping) {
        currentOccupancy += booking.guestCount || 1;
      }
    }

    if (currentOccupancy + requestedGuestCount > amenity.capacityPerSlot) {
      const remainingCapacity = Math.max(0, amenity.capacityPerSlot - currentOccupancy);
      return {
        valid: false,
        error:
          remainingCapacity > 0
            ? `Only ${remainingCapacity} spot(s) available for ${startTime} - ${endTime}. Requested ${requestedGuestCount} spot(s).`
            : `Slot ${startTime} - ${endTime} is fully booked! Maximum capacity is ${amenity.capacityPerSlot}.`,
      };
    }

    return { valid: true };
  }

  async createBookingAsync(
    societyId: string,
    amenityId: string,
    residentId: string,
    residentName: string,
    flatNumber: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
    guestCount: number,
    purpose?: string,
    paymentDetails?: { bookingFee?: number; paymentStatus?: 'FREE' | 'PAID' | 'PENDING'; paymentId?: string }
  ): Promise<AmenityBooking> {
    try {
      const res = await fetch(`/api/amenities/${amenityId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          societyId,
          residentId,
          residentName,
          flatNumber,
          bookingDate,
          startTime,
          endTime,
          guestCount,
          purpose,
          bookingFee: paymentDetails?.bookingFee,
          paymentStatus: paymentDetails?.paymentStatus,
          paymentId: paymentDetails?.paymentId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to complete server booking');
      }

      const createdBooking: AmenityBooking = await res.json();

      // Update local storage cache
      const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
      const allBookings: AmenityBooking[] = raw ? JSON.parse(raw) : [];
      allBookings.unshift(createdBooking);
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(allBookings));

      return createdBooking;
    } catch (err: any) {
      if (err.message && err.message.includes('booked') || err.message.includes('spot')) {
        throw err;
      }
      // Local fallback
      return this.createBooking(
        societyId,
        amenityId,
        residentId,
        residentName,
        flatNumber,
        bookingDate,
        startTime,
        endTime,
        guestCount,
        purpose,
        paymentDetails
      );
    }
  }

  createBooking(
    societyId: string,
    amenityId: string,
    residentId: string,
    residentName: string,
    flatNumber: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
    guestCount: number,
    purpose?: string,
    paymentDetails?: { bookingFee?: number; paymentStatus?: 'FREE' | 'PAID' | 'PENDING'; paymentId?: string }
  ): AmenityBooking {
    const validation = this.validateBookingRequest(
      societyId,
      amenityId,
      bookingDate,
      startTime,
      endTime,
      guestCount
    );

    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid booking request');
    }

    const amenities = this.getAmenities(societyId);
    const amenity = amenities.find((a) => a.id === amenityId)!;

    const fee = paymentDetails?.bookingFee ?? amenity.bookingFee ?? 0;

    const newBooking: AmenityBooking = {
      id: `bk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      societyId,
      amenityId,
      amenityName: amenity.name,
      residentId,
      residentName,
      flatNumber,
      bookingDate,
      startTime,
      endTime,
      guestCount,
      purpose,
      bookingFee: fee,
      paymentStatus: paymentDetails?.paymentStatus ?? (fee > 0 ? 'PENDING' : 'FREE'),
      paymentId: paymentDetails?.paymentId,
      status: amenity.requiresApproval ? 'PENDING' : 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    const allBookings: AmenityBooking[] = raw ? JSON.parse(raw) : [];
    allBookings.unshift(newBooking);
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(allBookings));

    amenityBookingRepository.create(newBooking).catch(() => {});

    return newBooking;
  }

  updateBookingStatus(
    societyId: string,
    bookingId: string,
    status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
    adminNotes?: string
  ): AmenityBooking {
    if (status === 'CANCELLED') {
      fetch(`/api/amenities/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ societyId }),
      }).catch(() => {});
    }

    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    let allBookings: AmenityBooking[] = raw ? JSON.parse(raw) : [];

    const index = allBookings.findIndex((b) => b.id === bookingId && b.societyId === societyId);
    if (index !== -1) {
      allBookings[index].status = status;
      if (adminNotes) allBookings[index].adminNotes = adminNotes;
      allBookings[index].updatedAt = new Date().toISOString();
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(allBookings));
    }

    amenityBookingRepository
      .update(bookingId, {
        status,
        adminNotes,
      })
      .catch(() => {});

    return (
      allBookings[index] || {
        id: bookingId,
        societyId,
        amenityId: '',
        amenityName: '',
        residentId: '',
        residentName: '',
        flatNumber: '',
        bookingDate: '',
        startTime: '',
        endTime: '',
        guestCount: 1,
        status,
        createdAt: '',
        updatedAt: '',
      }
    );
  }

  // --- COMMUNITY FEATURES (Announcements, Events, Polls, Posts) ---

  // Announcements
  getAnnouncements(societyId: string): CommunityAnnouncement[] {
    const raw = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
    let items: CommunityAnnouncement[] = raw ? JSON.parse(raw) : [];
    const filtered = items.filter(a => a.societyId === societyId);

    if (filtered.length === 0) {
      const seeded: CommunityAnnouncement[] = [
        {
          id: 'ann-1',
          societyId,
          title: 'Annual General Body Meeting (AGM) 2026',
          content: 'The Annual General Body Meeting is scheduled for Sunday, Sept 28th at 10:00 AM in the Grand Central Clubhouse. Attendance is requested for all flat owners.',
          category: 'IMPORTANT',
          isPinned: true,
          authorName: 'Society Managing Committee',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ann-2',
          societyId,
          title: 'Upcoming Swimming Pool Maintenance',
          content: 'Please note that the Olympia Swimming Pool will be closed for weekly chlorine filtration treatment on Sept 15th between 06:00 AM and 11:00 AM.',
          category: 'MAINTENANCE',
          isPinned: false,
          authorName: 'Estate Manager',
          createdAt: new Date().toISOString()
        }
      ];
      items = [...items, ...seeded];
      localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(items));
      return seeded;
    }

    return filtered;
  }

  createAnnouncement(societyId: string, title: string, content: string, category: CommunityAnnouncement['category'], isPinned: boolean, authorName: string): CommunityAnnouncement {
    const newAnn: CommunityAnnouncement = {
      id: `ann-${Date.now()}`,
      societyId,
      title,
      content,
      category,
      isPinned,
      authorName,
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
    const items: CommunityAnnouncement[] = raw ? JSON.parse(raw) : [];
    items.unshift(newAnn);
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(items));
    return newAnn;
  }

  // Events & RSVPs
  getEvents(societyId: string): CommunityEvent[] {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    let items: CommunityEvent[] = raw ? JSON.parse(raw) : [];
    const filtered = items.filter(e => e.societyId === societyId);

    if (filtered.length === 0) {
      const seeded: CommunityEvent[] = [
        {
          id: 'evt-1',
          societyId,
          title: 'Navratri Cultural Garba Evening',
          description: 'Join us for a grand evening of traditional Garba, live music band, food stalls, and prizes for best dressed!',
          location: 'Central Lawn Plaza',
          eventDate: '2026-10-12 18:30',
          organizerName: 'Cultural Committee',
          rsvps: [
            { residentId: 'res-1', residentName: 'John Doe', flatNumber: 'A-101', status: 'GOING', guestsCount: 3 },
            { residentId: 'res-2', residentName: 'Sarah Jenkins', flatNumber: 'B-402', status: 'GOING', guestsCount: 2 }
          ],
          createdAt: new Date().toISOString()
        }
      ];
      items = [...items, ...seeded];
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(items));
      return seeded;
    }
    return filtered;
  }

  rsvpEvent(societyId: string, eventId: string, residentId: string, residentName: string, flatNumber: string, status: RSVPStatus, guestsCount: number): CommunityEvent {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    let items: CommunityEvent[] = raw ? JSON.parse(raw) : [];

    const index = items.findIndex(e => e.id === eventId && e.societyId === societyId);
    if (index === -1) throw new Error('Event not found');

    const event = items[index];
    const existingRsvpIndex = event.rsvps.findIndex(r => r.residentId === residentId);

    if (existingRsvpIndex >= 0) {
      event.rsvps[existingRsvpIndex] = { residentId, residentName, flatNumber, status, guestsCount };
    } else {
      event.rsvps.push({ residentId, residentName, flatNumber, status, guestsCount });
    }

    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(items));
    return event;
  }

  createEvent(societyId: string, title: string, description: string, location: string, eventDate: string, organizerName: string): CommunityEvent {
    const newEvt: CommunityEvent = {
      id: `evt-${Date.now()}`,
      societyId,
      title,
      description,
      location,
      eventDate,
      organizerName,
      rsvps: [],
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    const items: CommunityEvent[] = raw ? JSON.parse(raw) : [];
    items.unshift(newEvt);
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(items));
    return newEvt;
  }

  // Polls
  getPolls(societyId: string): CommunityPoll[] {
    const raw = localStorage.getItem(POLLS_STORAGE_KEY);
    let items: CommunityPoll[] = raw ? JSON.parse(raw) : [];
    const filtered = items.filter(p => p.societyId === societyId);

    if (filtered.length === 0) {
      const seeded: CommunityPoll[] = [
        {
          id: 'poll-1',
          societyId,
          question: 'Should we install EV Charging Stations in Basement Parking B2?',
          description: 'Proposal to install 6 shared 11kW EV fast chargers in B2 level.',
          options: [
            { id: 'opt-1', text: 'Yes, definitely needed', votes: ['res-1'] },
            { id: 'opt-2', text: 'No, priority should be solar panels first', votes: [] },
            { id: 'opt-3', text: 'Need more technical details', votes: ['res-2'] }
          ],
          expiresAt: '2026-09-30',
          createdBy: 'Green Energy Committee',
          createdAt: new Date().toISOString(),
          isActive: true
        }
      ];
      items = [...items, ...seeded];
      localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(items));
      return seeded;
    }
    return filtered;
  }

  votePoll(societyId: string, pollId: string, optionId: string, residentId: string): CommunityPoll {
    const raw = localStorage.getItem(POLLS_STORAGE_KEY);
    let items: CommunityPoll[] = raw ? JSON.parse(raw) : [];

    const pollIndex = items.findIndex(p => p.id === pollId && p.societyId === societyId);
    if (pollIndex === -1) throw new Error('Poll not found');

    const poll = items[pollIndex];
    // Remove existing vote from any option if already voted
    poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(v => v !== residentId);
    });

    const targetOpt = poll.options.find(o => o.id === optionId);
    if (targetOpt) {
      targetOpt.votes.push(residentId);
    }

    localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(items));
    return poll;
  }

  createPoll(societyId: string, question: string, description: string, optionTexts: string[], expiresAt: string, createdBy: string): CommunityPoll {
    const newPoll: CommunityPoll = {
      id: `poll-${Date.now()}`,
      societyId,
      question,
      description,
      options: optionTexts.map((text, idx) => ({ id: `opt-${idx + 1}`, text, votes: [] })),
      expiresAt,
      createdBy,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    const raw = localStorage.getItem(POLLS_STORAGE_KEY);
    const items: CommunityPoll[] = raw ? JSON.parse(raw) : [];
    items.unshift(newPoll);
    localStorage.setItem(POLLS_STORAGE_KEY, JSON.stringify(items));
    return newPoll;
  }

  // Community Posts
  getPosts(societyId: string): CommunityPost[] {
    const raw = localStorage.getItem(POSTS_STORAGE_KEY);
    let items: CommunityPost[] = raw ? JSON.parse(raw) : [];
    const filtered = items.filter(p => p.societyId === societyId);

    if (filtered.length === 0) {
      const seeded: CommunityPost[] = [
        {
          id: 'post-1',
          societyId,
          authorId: 'res-1',
          authorName: 'Anita Sharma',
          flatNumber: 'A-304',
          content: 'Recommending our household cook Sunita who has morning slot (7 AM - 9 AM) open. Very punctual, prepares delicious North & South Indian dishes!',
          category: 'RECOMMENDATION',
          likes: ['res-2'],
          comments: [
            {
              id: 'c-1',
              authorName: 'Rahul Verma',
              flatNumber: 'B-102',
              text: 'Could you share her contact details? Thanks!',
              createdAt: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString()
        }
      ];
      items = [...items, ...seeded];
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(items));
      return seeded;
    }
    return filtered;
  }

  createPost(societyId: string, authorId: string, authorName: string, flatNumber: string, content: string, category: CommunityPost['category']): CommunityPost {
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      societyId,
      authorId,
      authorName,
      flatNumber,
      content,
      category,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem(POSTS_STORAGE_KEY);
    const items: CommunityPost[] = raw ? JSON.parse(raw) : [];
    items.unshift(newPost);
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(items));
    return newPost;
  }

  toggleLikePost(societyId: string, postId: string, residentId: string): CommunityPost {
    const raw = localStorage.getItem(POSTS_STORAGE_KEY);
    let items: CommunityPost[] = raw ? JSON.parse(raw) : [];

    const index = items.findIndex(p => p.id === postId && p.societyId === societyId);
    if (index === -1) throw new Error('Post not found');

    const post = items[index];
    if (post.likes.includes(residentId)) {
      post.likes = post.likes.filter(id => id !== residentId);
    } else {
      post.likes.push(residentId);
    }

    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(items));
    return post;
  }

  addCommentPost(societyId: string, postId: string, authorName: string, flatNumber: string, text: string): CommunityPost {
    const raw = localStorage.getItem(POSTS_STORAGE_KEY);
    let items: CommunityPost[] = raw ? JSON.parse(raw) : [];

    const index = items.findIndex(p => p.id === postId && p.societyId === societyId);
    if (index === -1) throw new Error('Post not found');

    const post = items[index];
    post.comments.push({
      id: `c-${Date.now()}`,
      authorName,
      flatNumber,
      text,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(items));
    return post;
  }
}

export const amenityService = new AmenityService();
