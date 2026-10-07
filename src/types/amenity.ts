export type AmenityType =
  | 'SWIMMING_POOL'
  | 'GYM'
  | 'CLUBHOUSE'
  | 'BADMINTON_COURT'
  | 'TENNIS_COURT'
  | 'PARTY_HALL'
  | 'MEETING_ROOM'
  | 'KIDS_PLAY_AREA'
  | 'VISITOR_LOUNGE';

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'CONFIRMED';

export type RSVPStatus = 'GOING' | 'MAYBE' | 'NOT_GOING';

export interface BlackoutDate {
  id: string;
  startDate: string; // ISO String or YYYY-MM-DD
  endDate: string;
  reason: string;
}

export interface AmenityMaintenance {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
}

export interface SocietyAmenity {
  id: string;
  societyId: string;
  name: string;
  type: AmenityType;
  description: string;
  location: string;
  capacityPerSlot: number;
  openTime: string; // HH:mm format e.g. "06:00"
  closeTime: string; // HH:mm format e.g. "22:00"
  slotDurationMinutes: number; // e.g. 60
  requiresApproval: boolean;
  isBookable: boolean;
  isActive: boolean;
  imageUrl?: string;
  bookingFee?: number;
  rules?: string[];
  blackoutDates: BlackoutDate[];
  maintenanceSchedules: AmenityMaintenance[];
  createdAt: string;
  updatedAt: string;
}

export interface AmenityBooking {
  id: string;
  societyId: string;
  amenityId: string;
  amenityName: string;
  residentId: string;
  residentName: string;
  flatNumber: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  guestCount: number;
  purpose?: string;
  bookingFee?: number;
  paymentStatus?: 'FREE' | 'PAID' | 'PENDING';
  paymentId?: string;
  status: BookingStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityAnnouncement {
  id: string;
  societyId: string;
  title: string;
  content: string;
  category: 'IMPORTANT' | 'GENERAL' | 'MAINTENANCE' | 'EMERGENCY';
  isPinned: boolean;
  authorName: string;
  createdAt: string;
}

export interface CommunityEvent {
  id: string;
  societyId: string;
  title: string;
  description: string;
  location: string;
  eventDate: string; // YYYY-MM-DD HH:mm
  organizerName: string;
  rsvps: {
    residentId: string;
    residentName: string;
    flatNumber: string;
    status: RSVPStatus;
    guestsCount: number;
  }[];
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // residentIds who voted for this option
}

export interface CommunityPoll {
  id: string;
  societyId: string;
  question: string;
  description?: string;
  options: PollOption[];
  expiresAt: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface CommunityPost {
  id: string;
  societyId: string;
  authorId: string;
  authorName: string;
  flatNumber: string;
  content: string;
  category: 'NEIGHBORHOOD' | 'BUY_SELL' | 'RECOMMENDATION' | 'GENERAL';
  likes: string[]; // residentIds
  comments: {
    id: string;
    authorName: string;
    flatNumber: string;
    text: string;
    createdAt: string;
  }[];
  createdAt: string;
}
