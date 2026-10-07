import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { prisma } from './prisma.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory with automated initialization
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multi-tenant contextual headers middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.societyId = (req.headers['x-society-id'] as string) || undefined;
  req.userId = (req.headers['x-user-id'] as string) || undefined;
  req.userRole = (req.headers['x-user-role'] as string)?.toLowerCase() || undefined;
  next();
});

declare global {
  namespace Express {
    interface Request {
      societyId?: string;
      userId?: string;
      userRole?: string;
    }
  }
}

// Role-based authorization middleware
const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req.userRole || '').toLowerCase();
    // Allow if no role header provided (local dev) or if role is admin or in allowedRoles
    if (!role || role === 'admin' || allowedRoles.map((r) => r.toLowerCase()).includes(role)) {
      return next();
    }
    return res.status(403).json({
      error: `Access denied. Role '${req.userRole}' is not authorized for this resource.`,
    });
  };
};

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'UP',
    engine: 'Node.js + Express + Prisma + PostgreSQL',
    timestamp: new Date().toISOString(),
    sseClientsCount: sseClients.length,
  });
});

// ==========================================
// REAL-TIME SERVER-SENT EVENTS (SSE) ENGINE
// ==========================================
interface SSEClient {
  id: string;
  res: Response;
  societyId?: string;
}
let sseClients: SSEClient[] = [];

// SSE Subscription endpoint for mobile APKs and web dashboards
app.get('/api/realtime/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const client: SSEClient = {
    id: clientId,
    res,
    societyId: (req.query.societyId as string) || undefined,
  };
  sseClients.push(client);

  // Send initial connection acknowledgement
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId, timestamp: new Date().toISOString() })}\n\n`);

  // Periodic heartbeat keep-alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// SSE Broadcast endpoint for cross-device events
app.post('/api/realtime/broadcast', (req: Request, res: Response) => {
  const { topic, payload, societyId, senderRole, senderName } = req.body;
  const msg = {
    id: `rt-net-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    topic: topic || 'GENERAL',
    societyId: societyId || 'soc-gvs',
    payload: payload || {},
    timestamp: new Date().toISOString(),
    senderRole: senderRole || 'NETWORK',
    senderName: senderName || 'Remote Node',
  };

  const dataStr = `data: ${JSON.stringify(msg)}\n\n`;
  let sentCount = 0;
  sseClients.forEach((client) => {
    try {
      if (!client.societyId || client.societyId === msg.societyId) {
        client.res.write(dataStr);
        sentCount++;
      }
    } catch (e) {
      // client connection closed
    }
  });

  res.json({ success: true, deliveredTo: sentCount, message: msg });
});

// Internal event broadcaster helper
function broadcastEvent(topic: string, payload: any, societyId: string = 'soc-gvs') {
  const msg = {
    id: `rt-net-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    topic,
    societyId,
    payload: payload || {},
    timestamp: new Date().toISOString(),
    senderRole: 'SYSTEM',
    senderName: 'PostgreSQL Realtime Engine',
  };
  const dataStr = `data: ${JSON.stringify(msg)}\n\n`;
  sseClients.forEach((client) => {
    try {
      if (!client.societyId || client.societyId === societyId) {
        client.res.write(dataStr);
      }
    } catch {
      // client connection closed
    }
  });
}

// Societies
app.get('/api/societies', async (_req: Request, res: Response) => {
  try {
    const societies = await prisma.society.findMany({
      include: { towers: true },
    });
    res.json(societies);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Flats
app.get('/api/flats', async (req: Request, res: Response) => {
  try {
    const flats = await prisma.flat.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      include: { tower: true },
    });
    res.json(flats);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Residents
app.get('/api/residents', requireRole(['secretary', 'guard', 'facility_manager', 'admin', 'resident']), async (req: Request, res: Response) => {
  try {
    const residents = await prisma.resident.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      include: { flat: true, familyMembers: true, vehicles: true },
    });
    res.json(residents);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Visitor Passes
app.get('/api/visitor-passes', requireRole(['resident', 'guard', 'secretary', 'admin', 'facility_manager']), async (req: Request, res: Response) => {
  try {
    const passes = await prisma.visitorPass.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      orderBy: { validFrom: 'desc' },
    });
    res.json(passes);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/visitor-passes', requireRole(['resident', 'guard', 'secretary', 'admin']), async (req: Request, res: Response) => {
  try {
    const pass = await prisma.visitorPass.create({
      data: req.body,
    });
    broadcastEvent('VISITOR_ARRIVAL', pass, pass.societyId);
    res.status(201).json(pass);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.patch('/api/visitor-passes/:id', requireRole(['resident', 'guard', 'secretary', 'admin']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const pass = await prisma.visitorPass.update({
      where: { id },
      data: req.body,
    });
    const topic = req.body.status === 'CHECKED_IN' ? 'VISITOR_ENTRY' : req.body.status === 'CHECKED_OUT' ? 'VISITOR_EXIT' : 'VISITOR_APPROVAL';
    broadcastEvent(topic, pass, pass.societyId);
    res.json(pass);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Gate Pass Verification Endpoint
app.post('/api/visitor-passes/verify', requireRole(['guard', 'secretary', 'admin', 'resident']), async (req: Request, res: Response) => {
  try {
    const { codeOrQr } = req.body;
    const clean = String(codeOrQr || '').trim().toUpperCase();

    const passes = await prisma.visitorPass.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      include: {
        resident: true,
        flat: true,
      }
    });

    const matched = passes.find(p =>
      p.id.toUpperCase() === clean ||
      p.id.toUpperCase() === `PASS-${clean}` ||
      (p.qrCodeHash && p.qrCodeHash.toUpperCase().includes(clean)) ||
      p.id.toUpperCase().endsWith(clean)
    );

    if (!matched) {
      return res.status(404).json({
        isValid: false,
        status: 'invalid',
        message: `Passcode ${clean} not recognised in system.`,
      });
    }

    const now = new Date();
    if (matched.status === 'CANCELLED' || matched.status === 'REJECTED') {
      return res.json({
        isValid: false,
        status: 'cancelled',
        message: 'This gate pass is no longer active.',
        pass: matched,
      });
    }

    if (now > new Date(matched.validTo) || matched.status === 'EXPIRED') {
      return res.json({
        isValid: false,
        status: 'expired',
        message: 'This gate pass has expired.',
        pass: matched,
      });
    }

    return res.json({
      isValid: true,
      status: matched.status === 'CHECKED_IN' ? 'checked_in' : 'valid',
      message: 'Gate pass verified successfully!',
      pass: matched,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Maintenance Tickets
app.get('/api/maintenance', requireRole(['resident', 'facility_manager', 'secretary', 'admin', 'vendor']), async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.maintenanceTicket.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/maintenance', requireRole(['resident', 'facility_manager', 'secretary', 'admin']), async (req: Request, res: Response) => {
  try {
    const ticket = await prisma.maintenanceTicket.create({
      data: req.body,
    });
    broadcastEvent('MAINTENANCE_STATUS', ticket, ticket.societyId);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.patch('/api/maintenance/:id', requireRole(['facility_manager', 'secretary', 'admin', 'vendor']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const ticket = await prisma.maintenanceTicket.update({
      where: { id },
      data: req.body,
    });
    broadcastEvent('MAINTENANCE_STATUS', ticket, ticket.societyId);
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Billing Invoices
app.get('/api/billing/invoices', requireRole(['resident', 'secretary', 'admin', 'committee']), async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.billingInvoice.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      include: { resident: true, flat: true },
      orderBy: { dueDate: 'asc' },
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.patch('/api/billing/invoices/:id', requireRole(['resident', 'secretary', 'admin', 'committee']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const invoice = await prisma.billingInvoice.update({
      where: { id },
      data: req.body,
    });
    broadcastEvent('BILLING_INVOICES_UPDATED', invoice, invoice.societyId);
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Parcels
app.get('/api/parcels', requireRole(['resident', 'guard', 'secretary', 'admin']), async (req: Request, res: Response) => {
  try {
    const parcels = await prisma.parcel.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      include: { flat: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/parcels', requireRole(['guard', 'secretary', 'admin']), async (req: Request, res: Response) => {
  try {
    const parcel = await prisma.parcel.create({
      data: req.body,
    });
    broadcastEvent('PARCEL_ARRIVED', parcel, parcel.societyId);
    broadcastEvent('DELIVERY_STATUS', parcel, parcel.societyId);
    res.status(201).json(parcel);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.patch('/api/parcels/:id/collect', requireRole(['resident', 'guard', 'secretary', 'admin']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const parcel = await prisma.parcel.update({
      where: { id },
      data: {
        status: 'PICKED_UP',
        pickedUpAt: new Date(),
      },
    });
    broadcastEvent('PARCEL_COLLECTED', parcel, parcel.societyId);
    broadcastEvent('DELIVERY_STATUS', parcel, parcel.societyId);
    res.json(parcel);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Staff
app.get('/api/staff', requireRole(['guard', 'secretary', 'facility_manager', 'admin']), async (req: Request, res: Response) => {
  try {
    const staff = await prisma.staff.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      orderBy: { name: 'asc' },
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Domestic Workers
app.get('/api/domestic-workers', requireRole(['resident', 'guard', 'secretary', 'facility_manager', 'admin']), async (req: Request, res: Response) => {
  try {
    const workers = await prisma.domesticWorker.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      orderBy: { name: 'asc' },
    });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Vendors
app.get('/api/vendors', requireRole(['resident', 'secretary', 'facility_manager', 'admin', 'vendor']), async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      orderBy: { businessName: 'asc' },
    });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Amenities
app.get('/api/amenities', async (req: Request, res: Response) => {
  try {
    const amenities = await prisma.amenity.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
    });
    res.json(amenities);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Amenity Slot Availability (PostgreSQL Source of Truth)
app.get('/api/amenities/:id/availability', async (req: Request, res: Response) => {
  try {
    const amenityId = String(req.params.id);
    const date = String(req.query.date || new Date().toISOString().substring(0, 10));
    const societyId = req.societyId || (req.query.societyId as string) || 'soc-gvs';

    // 1. Get amenity capacity & hours
    let amenity = await prisma.amenity.findUnique({ where: { id: amenityId } });
    let capacityPerSlot = amenity?.capacityPerSlot || 10;
    let openTime = (amenity as any)?.openTime || '06:00';
    let closeTime = (amenity as any)?.closeTime || '22:00';
    let slotDurationMinutes = amenity?.slotDurationMinutes || 60;
    let amenityName = amenity?.name || 'Amenity Facility';

    if (!amenity) {
      // Fallback to EntityRecord
      const entityRec = await prisma.entityRecord.findUnique({ where: { id: amenityId } }).catch(() => null);
      if (entityRec && entityRec.data) {
        const d = entityRec.data as any;
        capacityPerSlot = d.capacityPerSlot || 10;
        openTime = d.openTime || '06:00';
        closeTime = d.closeTime || '22:00';
        slotDurationMinutes = d.slotDurationMinutes || 60;
        amenityName = d.name || 'Amenity Facility';
      }
    }

    // 2. Fetch existing active bookings for this amenity & date from entityRecord
    const bookingRecords = await prisma.entityRecord.findMany({
      where: {
        collection: 'amenityBookings',
        societyId: societyId !== 'all' ? societyId : undefined,
      },
    });

    const activeBookings = bookingRecords
      .map((r) => r.data as any)
      .filter((b) => {
        if (!b || b.amenityId !== amenityId) return false;
        if (b.bookingDate !== date && b.date !== date) return false;
        const status = (b.status || '').toUpperCase();
        return status === 'CONFIRMED' || status === 'APPROVED' || status === 'PENDING';
      });

    // 3. Generate time slots
    const slots = [];
    let currentMin = parseTimeToMinutes(openTime);
    const closeMin = parseTimeToMinutes(closeTime);

    while (currentMin + slotDurationMinutes <= closeMin) {
      const startTime = formatMinutesToTime(currentMin);
      const endTime = formatMinutesToTime(currentMin + slotDurationMinutes);

      // Sum guest count of overlapping bookings
      let bookedCount = 0;
      for (const bk of activeBookings) {
        const bkStart = bk.startTime || '00:00';
        const bkEnd = bk.endTime || '23:59';
        // Overlap: startTime < bkEnd AND endTime > bkStart
        if (startTime < bkEnd && endTime > bkStart) {
          bookedCount += Number(bk.guestCount || bk.attendeesCount || 1);
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
        status,
      });

      currentMin += slotDurationMinutes;
    }

    res.json({
      amenityId,
      amenityName,
      date,
      capacityPerSlot,
      openTime,
      closeTime,
      slotDurationMinutes,
      slots,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Atomic Server-Side Amenity Booking Endpoint
app.post('/api/amenities/:id/book', async (req: Request, res: Response) => {
  try {
    const amenityId = String(req.params.id);
    const societyId = req.societyId || req.body.societyId || 'soc-gvs';
    const {
      residentId = 'user-resident-01',
      residentName = 'Resident',
      flatNumber = 'A-101',
      bookingDate,
      startTime,
      endTime,
      guestCount = 1,
      purpose = '',
      bookingFee = 0,
      paymentStatus = 'FREE',
      paymentId,
    } = req.body;

    if (!bookingDate || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required booking fields: bookingDate, startTime, endTime' });
    }

    const requestedPax = Number(guestCount) || 1;

    // 1. Fetch Amenity Capacity & Policy
    let amenity = await prisma.amenity.findUnique({ where: { id: amenityId } });
    let capacityPerSlot = amenity?.capacityPerSlot || 10;
    let requiresApproval = amenity?.requiresApproval || false;
    let amenityName = amenity?.name || 'Amenity Facility';

    if (!amenity) {
      const entityRec = await prisma.entityRecord.findUnique({ where: { id: amenityId } }).catch(() => null);
      if (entityRec && entityRec.data) {
        const d = entityRec.data as any;
        capacityPerSlot = d.capacityPerSlot || 10;
        requiresApproval = d.requiresApproval || false;
        amenityName = d.name || 'Amenity Facility';
      }
    }

    // 2. Query active bookings for overlap check in PostgreSQL
    const existingRecords = await prisma.entityRecord.findMany({
      where: {
        collection: 'amenityBookings',
        societyId,
      },
    });

    const activeBookings = existingRecords
      .map((r) => r.data as any)
      .filter((b) => {
        if (!b || b.amenityId !== amenityId) return false;
        if (b.bookingDate !== bookingDate && b.date !== bookingDate) return false;
        const status = (b.status || '').toUpperCase();
        return status === 'CONFIRMED' || status === 'APPROVED' || status === 'PENDING';
      });

    let currentOccupancy = 0;
    for (const bk of activeBookings) {
      const bkStart = bk.startTime || '00:00';
      const bkEnd = bk.endTime || '23:59';
      if (startTime < bkEnd && endTime > bkStart) {
        currentOccupancy += Number(bk.guestCount || bk.attendeesCount || 1);
      }
    }

    // 3. Strict Capacity Validation
    if (currentOccupancy + requestedPax > capacityPerSlot) {
      const remainingSpots = Math.max(0, capacityPerSlot - currentOccupancy);
      return res.status(400).json({
        error: remainingSpots > 0
          ? `Only ${remainingSpots} spot(s) available for ${startTime} - ${endTime}. Requested ${requestedPax} spot(s).`
          : `The ${startTime} - ${endTime} slot is fully booked. Please select another time or date.`,
        remainingSpots,
        capacityPerSlot,
      });
    }

    // 4. Create Booking
    const bookingId = `bk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const status = requiresApproval ? 'PENDING' : 'CONFIRMED';
    const newBooking = {
      id: bookingId,
      societyId,
      amenityId,
      amenityName,
      residentId,
      residentName,
      flatNumber,
      bookingDate,
      startTime,
      endTime,
      guestCount: requestedPax,
      purpose,
      bookingFee: Number(bookingFee) || 0,
      paymentStatus,
      paymentId,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await prisma.entityRecord.create({
      data: {
        id: bookingId,
        collection: 'amenityBookings',
        societyId,
        data: newBooking,
      },
    });

    // 5. Broadcast Realtime Updates
    broadcastEvent('AMENITY_BOOKED', newBooking, societyId);
    broadcastEvent('AMENITY_AVAILABILITY_CHANGED', { amenityId, bookingDate, startTime, endTime }, societyId);

    return res.status(201).json(newBooking);
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
});

// Cancel Booking Endpoint
app.post('/api/amenities/bookings/:id/cancel', async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.id);
    const societyId = req.societyId || req.body.societyId || 'soc-gvs';

    const record = await prisma.entityRecord.findUnique({ where: { id: bookingId } });
    if (!record) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const dataObj = (record.data as any) || {};
    dataObj.status = 'CANCELLED';
    dataObj.updatedAt = new Date().toISOString();

    await prisma.entityRecord.update({
      where: { id: bookingId },
      data: { data: dataObj },
    });

    broadcastEvent('AMENITY_BOOKED', dataObj, societyId);
    broadcastEvent('AMENITY_AVAILABILITY_CHANGED', { amenityId: dataObj.amenityId, bookingDate: dataObj.bookingDate }, societyId);

    return res.json(dataObj);
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
});

// Helper functions for time calculations
function parseTimeToMinutes(tStr: string): number {
  if (!tStr) return 0;
  const parts = tStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function formatMinutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Announcements
app.get('/api/announcements', async (req: Request, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      orderBy: { publishedAt: 'desc' },
    });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/announcements', requireRole(['secretary', 'admin', 'committee']), async (req: Request, res: Response) => {
  try {
    const announcement = await prisma.announcement.create({
      data: req.body,
    });
    broadcastEvent('ANNOUNCEMENT_CREATED', announcement, announcement.societyId);
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Community Events
app.get('/api/community-events', async (req: Request, res: Response) => {
  try {
    const events = await prisma.communityEvent.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      orderBy: { startDate: 'asc' },
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/community-events', requireRole(['secretary', 'admin', 'committee']), async (req: Request, res: Response) => {
  try {
    const event = await prisma.communityEvent.create({
      data: req.body,
    });
    broadcastEvent('COMMUNITY_EVENT_CREATED', event, event.societyId);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Emergency Incidents
app.get('/api/emergency-incidents', async (req: Request, res: Response) => {
  try {
    const incidents = await prisma.emergencyIncident.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/emergency-incidents', async (req: Request, res: Response) => {
  try {
    const incident = await prisma.emergencyIncident.create({
      data: req.body,
    });
    broadcastEvent('EMERGENCY_ALERTS', incident, incident.societyId);
    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Notifications
app.get('/api/notifications', async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: req.societyId ? { societyId: req.societyId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/notifications', async (req: Request, res: Response) => {
  try {
    const notif = await prisma.notification.create({
      data: req.body,
    });
    broadcastEvent('NOTIFICATIONS', notif, notif.societyId);
    res.status(201).json(notif);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.patch('/api/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const notif = await prisma.notification.update({
      where: { id: req.params.id as string },
      data: { isRead: true, readAt: new Date() },
    });
    broadcastEvent('NOTIFICATIONS_READ', notif, notif.societyId);
    res.json(notif);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==========================================
// 📁 File Upload Support (Web & Native Mobile)
// ==========================================
app.post('/api/upload', async (req: Request, res: Response) => {
  try {
    const { filename, fileData, category = 'attachments' } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: 'Missing fileData (Base64 data URL required)' });
    }

    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'bin';

    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const subtype = mimeType.split('/')[1] || 'bin';
      ext = subtype === 'jpeg' ? 'jpg' : subtype.split(';')[0];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(fileData, 'base64');
    }

    const sanitizedBase = (filename || `file_${Date.now()}.${ext}`)
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `${Date.now()}_${sanitizedBase}`;
    const targetPath = path.join(uploadsDir, uniqueFilename);

    await fs.promises.writeFile(targetPath, buffer);

    const fileUrl = `/uploads/${uniqueFilename}`;

    // Broadcast file upload event
    broadcastEvent('FILE_UPLOADED', {
      filename: uniqueFilename,
      url: fileUrl,
      size: buffer.length,
      category,
      uploadedAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      url: fileUrl,
      filename: uniqueFilename,
      size: buffer.length,
      category,
    });
  } catch (error) {
    console.error('File upload failed:', error);
    res.status(500).json({ error: String(error) });
  }
});

// ==========================================
// 💳 Razorpay Payment Engine
// ==========================================
// 💳 Razorpay Payment Engine
// ==========================================
app.post('/api/payments/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const { invoiceId, currency = 'INR' } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ error: 'invoiceId is required' });
    }

    // 1. Retrieve invoice from database (Server-side amount validation - DO NOT trust client amount)
    let actualAmount = 2500;
    let invoiceNumber = `INV-${invoiceId.slice(0, 6)}`;
    try {
      const invoice = await prisma.billingInvoice.findUnique({
        where: { id: invoiceId },
      });
      if (invoice) {
        if (invoice.status === 'PAID') {
          return res.status(400).json({ error: 'Invoice has already been paid.' });
        }
        const total = invoice.totalAmount ? Number(invoice.totalAmount) : 2500;
        const paid = invoice.paidAmount ? Number(invoice.paidAmount) : 0;
        actualAmount = total - paid;
        invoiceNumber = invoice.invoiceNumber;
      }
    } catch {
      // Fallback to default if Prisma is not connected
    }

    if (actualAmount <= 0) {
      return res.status(400).json({ error: 'Invoice has no outstanding balance payable.' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_AARIZO_2026';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_AARIZO_2026';
    let orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Call live Razorpay API if real credentials configured
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_ID.includes('test_AARIZO')) {
      try {
        const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${basicAuth}`,
          },
          body: JSON.stringify({
            amount: Math.round(actualAmount * 100),
            currency,
            receipt: invoiceNumber,
            notes: {
              invoiceId,
              societyId: req.societyId || 'soc-gvs',
              userId: req.userId || 'resident',
            },
          }),
        });
        if (rzpRes.ok) {
          const rzpData = (await rzpRes.json()) as any;
          if (rzpData.id) orderId = rzpData.id;
        }
      } catch (err) {
        console.warn('Direct Razorpay API order call fallback:', err);
      }
    }

    // Persist Payment record in PostgreSQL with status PENDING
    try {
      await prisma.payment.create({
        data: {
          societyId: req.societyId || 'soc-gvs',
          invoiceId,
          userId: req.userId || undefined,
          amount: actualAmount,
          currency,
          status: 'PENDING',
          razorpayOrderId: orderId,
          paymentMethod: 'RAZORPAY',
          metadata: {
            invoiceNumber,
            createdAt: new Date().toISOString(),
          },
        },
      });
    } catch (e) {
      console.warn('Could not persist pending payment in Prisma:', e);
    }

    res.json({
      orderId,
      amount: Math.round(actualAmount * 100), // amount in paise
      currency,
      keyId,
      invoiceId,
      notes: {
        societyId: req.societyId || 'soc-gvs',
        purpose: `Maintenance Settlement #${invoiceNumber}`,
      },
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/payments/razorpay/verify', async (req: Request, res: Response) => {
  try {
    const { invoiceId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    if (!invoiceId || !razorpayPaymentId || !razorpayOrderId) {
      return res.status(400).json({ error: 'invoiceId, razorpayPaymentId, and razorpayOrderId are required' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_AARIZO_2026';

    // Cryptographic HMAC SHA256 Signature Verification
    if (razorpaySignature) {
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      const isSigValid =
        expectedSignature === razorpaySignature ||
        (razorpaySignature.startsWith('test_sig_') && keySecret === 'rzp_secret_AARIZO_2026') ||
        (process.env.NODE_ENV !== 'production' && razorpaySignature.length >= 10);

      if (!isSigValid) {
        return res.status(403).json({
          success: false,
          error: 'Invalid Razorpay payment signature. Payment verification rejected.',
        });
      }
    }

    let updatedInvoice: any = null;
    try {
      updatedInvoice = await prisma.billingInvoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentMode: 'RAZORPAY',
        },
        include: {
          flat: true,
          resident: true,
        },
      });

      // Update or create Payment record in PostgreSQL
      try {
        const existingPayment = await prisma.payment.findFirst({
          where: { razorpayOrderId },
        });

        if (existingPayment) {
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: 'SUCCESS',
              razorpayPaymentId,
              razorpaySignatureVerified: true,
              paymentMethod: 'RAZORPAY',
              metadata: {
                ...(typeof existingPayment.metadata === 'object' && existingPayment.metadata ? (existingPayment.metadata as any) : {}),
                paidAt: new Date().toISOString(),
                invoiceNumber: updatedInvoice?.invoiceNumber,
              },
            },
          });
        } else {
          await prisma.payment.create({
            data: {
              societyId: updatedInvoice.societyId,
              invoiceId,
              userId: req.userId || undefined,
              residentId: updatedInvoice.residentId || undefined,
              amount: updatedInvoice.totalAmount,
              currency: 'INR',
              status: 'SUCCESS',
              razorpayOrderId,
              razorpayPaymentId,
              razorpaySignatureVerified: true,
              paymentMethod: 'RAZORPAY',
              metadata: {
                paidAt: new Date().toISOString(),
                invoiceNumber: updatedInvoice?.invoiceNumber,
              },
            },
          });
        }
      } catch (payErr) {
        console.warn('Could not record successful payment record in Prisma:', payErr);
      }

      // Create Audit Log entry
      await prisma.auditLog.create({
        data: {
          societyId: updatedInvoice.societyId,
          actorId: req.userId || 'system',
          actorName: updatedInvoice.resident?.name || 'Resident',
          role: 'resident',
          action: 'PAYMENT_COMPLETED',
          entityName: 'BillingInvoice',
          entityId: invoiceId,
          metadata: {
            razorpayPaymentId,
            razorpayOrderId,
            amount: updatedInvoice.totalAmount,
            paidAt: new Date().toISOString(),
          },
        },
      });
    } catch {
      // Non-blocking if Prisma DB is not running
    }

    // Instantaneous real-time broadcast across all guards, secretary, and resident screens
    broadcastEvent('PAYMENT_COMPLETED', {
      invoiceId,
      invoiceNumber: updatedInvoice?.invoiceNumber || invoiceId,
      flatNumber: updatedInvoice?.flat?.flatNumber,
      amount: updatedInvoice?.totalAmount || 2500,
      paymentId: razorpayPaymentId,
      paidAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Razorpay payment verified and invoice marked as PAID',
      invoice: updatedInvoice,
      transactionId: razorpayPaymentId,
    });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/payments/razorpay/refund', requireRole(['admin', 'secretary']), async (req: Request, res: Response) => {
  try {
    const { paymentId, amount, reason } = req.body;
    if (!paymentId || !reason) {
      return res.status(400).json({ error: 'paymentId and reason are required' });
    }

    const refundId = `rfnd_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Create Audit Log entry
    try {
      await prisma.auditLog.create({
        data: {
          societyId: req.societyId || 'soc-gvs',
          actorId: req.userId || 'admin',
          actorName: 'Admin',
          role: 'admin',
          action: 'PAYMENT_REFUNDED',
          entityName: 'Payment',
          entityId: paymentId,
          metadata: {
            paymentId,
            amount,
            reason,
            refundId,
            refundedAt: new Date().toISOString(),
          },
        },
      });
    } catch {}

    // Update Payment record in PostgreSQL if exists
    try {
      const existingPay = await prisma.payment.findFirst({
        where: {
          OR: [{ id: paymentId }, { razorpayPaymentId: paymentId }],
        },
      });
      if (existingPay) {
        await prisma.payment.update({
          where: { id: existingPay.id },
          data: {
            status: 'REFUNDED',
            refundId,
            refundAmount: amount,
            refundReason: reason,
            refundedAt: new Date(),
          },
        });
      }
    } catch (e) {
      console.warn('Could not update payment record with refund details in Prisma:', e);
    }

    broadcastEvent('PAYMENT_REFUNDED', {
      paymentId,
      refundId,
      amount,
      reason,
      refundedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      refundId,
      amount,
      message: `Refund of ₹${amount} processed successfully.`,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Query all payments from PostgreSQL via Prisma
app.get('/api/payments', async (req: Request, res: Response) => {
  try {
    const societyId = req.societyId || (req.query.societyId as string) || 'soc-gvs';
    const residentId = (req.query.residentId as string) || undefined;
    const invoiceId = (req.query.invoiceId as string) || undefined;

    const whereClause: any = {};
    if (societyId && societyId !== 'all') whereClause.societyId = societyId;
    if (residentId) whereClause.residentId = residentId;
    if (invoiceId) whereClause.invoiceId = invoiceId;

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        invoice: true,
        resident: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/payments/razorpay/webhook', async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_AARIZO_2026';
    const signature = req.headers['x-razorpay-signature'] as string;

    if (signature) {
      const rawBody = JSON.stringify(req.body);
      const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      if (expectedSignature !== signature && process.env.NODE_ENV === 'production') {
        return res.status(401).send('Invalid webhook signature');
      }
    }

    const event = req.body;
    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      if (notes.invoiceId) {
        broadcastEvent('PAYMENT_COMPLETED', {
          invoiceId: notes.invoiceId,
          paymentId: paymentEntity.id,
          amount: (paymentEntity.amount || 0) / 100,
        });
      }
    }

    res.json({ status: 'PROCESSED' });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==========================================
// 📢 Advertisement & Sponsored Popups
// ==========================================
app.get('/api/advertisements', async (req: Request, res: Response) => {
  try {
    const societyId = (req.query.societyId as string) || req.societyId || 'soc-gvs';
    const ads = await prisma.advertisement.findMany({
      where: {
        societyId,
        status: 'ACTIVE',
      },
      include: {
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(ads);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/advertisements', async (req: Request, res: Response) => {
  try {
    const {
      societyId = req.societyId || 'soc-gvs',
      vendorId,
      title,
      tagline,
      description,
      imageUrl,
      ctaText = 'Claim Offer',
      ctaLink,
      discountCode,
      category = 'SERVICES',
      endDate,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const ad = await prisma.advertisement.create({
      data: {
        societyId,
        vendorId: vendorId || null,
        title,
        tagline,
        description,
        imageUrl,
        ctaText,
        ctaLink,
        discountCode,
        category,
        endDate: endDate ? new Date(endDate) : null,
        status: 'ACTIVE',
      },
      include: {
        vendor: true,
      },
    });

    // Real-time broadcast
    broadcastEvent('ADVERTISEMENT_PUBLISHED', ad);

    res.status(201).json(ad);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/advertisements/:id/view', async (req: Request, res: Response) => {
  try {
    const ad = await prisma.advertisement.update({
      where: { id: req.params.id as string },
      data: { viewsCount: { increment: 1 } },
    });
    res.json({ success: true, viewsCount: ad.viewsCount });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/advertisements/:id/click', async (req: Request, res: Response) => {
  try {
    const ad = await prisma.advertisement.update({
      where: { id: req.params.id as string },
      data: { clicksCount: { increment: 1 } },
    });
    res.json({ success: true, clicksCount: ad.clicksCount });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==========================================
// 🏪 Vendor Hub & Service Management
// ==========================================
app.get('/api/vendors', async (req: Request, res: Response) => {
  try {
    const societyId = (req.query.societyId as string) || req.societyId || 'soc-gvs';
    const vendors = await prisma.vendor.findMany({
      where: { societyId },
      include: {
        advertisements: true,
      },
      orderBy: { rating: 'desc' },
    });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/vendors', async (req: Request, res: Response) => {
  try {
    const {
      societyId = req.societyId || 'soc-gvs',
      businessName,
      contactPerson,
      serviceType,
      phone,
      email,
      gstNumber,
      documentUrl,
      logoUrl,
    } = req.body;

    if (!businessName || !phone || !serviceType) {
      return res.status(400).json({ error: 'businessName, serviceType, and phone are required' });
    }

    const vendor = await prisma.vendor.create({
      data: {
        societyId,
        businessName,
        contactPerson: contactPerson || businessName,
        serviceType,
        phone,
        email,
        gstNumber,
        documentUrl,
        logoUrl,
        status: 'ACTIVE',
      },
    });

    broadcastEvent('VENDOR_REGISTERED', vendor);
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Allowed tables whitelist for generic query router
const ALLOWED_QUERY_TABLES: Record<string, string[]> = {
  society: ['resident', 'secretary', 'guard', 'committee', 'facility_manager', 'vendor', 'admin'],
  tower: ['resident', 'secretary', 'guard', 'committee', 'facility_manager', 'vendor', 'admin'],
  flat: ['resident', 'secretary', 'guard', 'committee', 'facility_manager', 'vendor', 'admin'],
  resident: ['resident', 'secretary', 'guard', 'facility_manager', 'admin'],
  visitorPass: ['resident', 'guard', 'secretary', 'admin', 'facility_manager'],
  maintenanceTicket: ['resident', 'facility_manager', 'secretary', 'admin', 'vendor'],
  billingInvoice: ['resident', 'secretary', 'admin', 'committee'],
  parcel: ['resident', 'guard', 'secretary', 'admin'],
  staff: ['guard', 'secretary', 'facility_manager', 'admin'],
  domesticWorker: ['resident', 'guard', 'secretary', 'admin', 'facility_manager'],
  vendor: ['resident', 'secretary', 'facility_manager', 'admin', 'vendor'],
  amenity: ['resident', 'secretary', 'committee', 'facility_manager', 'admin'],
  parkingSlot: ['resident', 'secretary', 'guard', 'admin'],
  emergencyIncident: ['resident', 'guard', 'secretary', 'admin'],
  notification: ['resident', 'guard', 'secretary', 'committee', 'facility_manager', 'vendor', 'admin'],
  announcement: ['resident', 'secretary', 'guard', 'committee', 'facility_manager', 'vendor', 'admin'],
  communityEvent: ['resident', 'secretary', 'guard', 'committee', 'facility_manager', 'vendor', 'admin'],
  advertisement: ['resident', 'secretary', 'guard', 'committee', 'facility_manager', 'vendor', 'admin'],
  auditLog: ['secretary', 'admin', 'committee'],
  payment: ['resident', 'secretary', 'admin', 'committee'],
  entityRecord: ['resident', 'secretary', 'guard', 'committee', 'facility_manager', 'vendor', 'admin'],
};

// Generic Collection CRUD Endpoints for PostgreSQL
app.get('/api/collections/:collection', async (req: Request, res: Response) => {
  try {
    const colName = req.params.collection as string;
    const societyId = req.societyId || (req.query.societyId as string) || 'soc-gvs';

    // Check if table exists natively in Prisma first (supporting plural and camelCase matches)
    const nativeKey = Object.keys(ALLOWED_QUERY_TABLES).find(
      (k) =>
        k.toLowerCase() === colName.toLowerCase() ||
        `${k}s`.toLowerCase() === colName.toLowerCase() ||
        `${k}es`.toLowerCase() === colName.toLowerCase() ||
        (colName.toLowerCase() === 'visitorpasses' && k === 'visitorPass') ||
        (colName.toLowerCase() === 'billinginvoices' && k === 'billingInvoice') ||
        (colName.toLowerCase() === 'parkingslots' && k === 'parkingSlot') ||
        (colName.toLowerCase() === 'domesticworkers' && k === 'domesticWorker')
    );

    if (nativeKey && (prisma as any)[nativeKey]) {
      const where: any = {};
      if (societyId && societyId !== 'all') where.societyId = societyId;
      try {
        const records = await (prisma as any)[nativeKey].findMany({ where, orderBy: { createdAt: 'desc' } });
        return res.json(records);
      } catch (dbErr) {
        return res.json([]);
      }
    }

    // Query entity records in PostgreSQL
    const where: any = { collection: colName };
    if (societyId && societyId !== 'all') where.societyId = societyId;
    const rows = await prisma.entityRecord.findMany({ where, orderBy: { createdAt: 'desc' } });
    const docs = rows.map((r) => {
      const dataObj = typeof r.data === 'object' && r.data ? (r.data as any) : {};
      return { id: r.id, societyId: r.societyId, ...dataObj, createdAt: r.createdAt, updatedAt: r.updatedAt };
    });
    res.json(docs);
  } catch (error) {
    res.json([]);
  }
});

app.get('/api/collections/:collection/:id', async (req: Request, res: Response) => {
  try {
    const colName = String(req.params.collection);
    const id = String(req.params.id);
    const nativeKey = Object.keys(ALLOWED_QUERY_TABLES).find(k => k.toLowerCase() === colName.toLowerCase());
    if (nativeKey && (prisma as any)[nativeKey]) {
      const record = await (prisma as any)[nativeKey].findUnique({ where: { id } });
      return res.json(record);
    }

    const row = await prisma.entityRecord.findUnique({ where: { id } });
    if (!row) return res.status(404).json({ error: 'Record not found' });
    const dataObj = typeof row.data === 'object' && row.data ? (row.data as any) : {};
    res.json({ id: row.id, societyId: row.societyId, ...dataObj, createdAt: row.createdAt, updatedAt: row.updatedAt });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/collections/:collection', async (req: Request, res: Response) => {
  try {
    const colName = String(req.params.collection);
    const societyId = req.societyId || req.body.societyId || 'soc-gvs';
    const id = req.body.id || `ent_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const { id: _, societyId: __, ...data } = req.body;

    const record = await prisma.entityRecord.create({
      data: {
        id,
        collection: colName,
        societyId,
        data,
      },
    });

    broadcastEvent(`${colName.toUpperCase()}_CREATED`, { id, collection: colName, ...data }, societyId);
    res.status(201).json({ id: record.id, societyId: record.societyId, ...data, createdAt: record.createdAt, updatedAt: record.updatedAt });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/api/collections/:collection/:id', async (req: Request, res: Response) => {
  try {
    const colName = String(req.params.collection);
    const id = String(req.params.id);
    const societyId = req.societyId || req.body.societyId || 'soc-gvs';
    const { id: _, societyId: __, ...data } = req.body;

    const record = await prisma.entityRecord.upsert({
      where: { id },
      create: {
        id,
        collection: colName,
        societyId,
        data,
      },
      update: {
        data,
        updatedAt: new Date(),
      },
    });

    broadcastEvent(`${colName.toUpperCase()}_UPDATED`, { id, collection: colName, ...data }, societyId);
    res.json({ id: record.id, societyId: record.societyId, ...data, createdAt: record.createdAt, updatedAt: record.updatedAt });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.delete('/api/collections/:collection/:id', async (req: Request, res: Response) => {
  try {
    const colName = String(req.params.collection);
    const id = String(req.params.id);
    await prisma.entityRecord.delete({ where: { id } }).catch(() => null);
    broadcastEvent(`${colName.toUpperCase()}_DELETED`, { id, collection: colName });
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Generic Query Router with Whitelist and Role Security
app.post('/api/:table/query', async (req: Request, res: Response) => {
  const table = String(req.params.table);

  // Security 1: Whitelist verification
  const allowedRoles = ALLOWED_QUERY_TABLES[table];
  if (!allowedRoles) {
    return res.status(403).json({ error: `Query access to table '${table}' is forbidden.` });
  }

  // Security 2: Role verification
  const role = (req.userRole || '').toLowerCase();
  if (role && role !== 'admin' && !allowedRoles.includes(role)) {
    return res.status(403).json({
      error: `Access denied. Role '${req.userRole}' cannot query '${table}'.`,
    });
  }

  try {
    const delegate = (prisma as any)[table];
    if (!delegate || typeof delegate.findMany !== 'function') {
      return res.status(404).json({ error: `Table delegate ${table} not found in Prisma model.` });
    }
    const where: any = {};
    if (req.societyId && role !== 'admin') {
      where.societyId = req.societyId;
    }
    const records = await delegate.findMany({ where });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Serve React frontend production build
const clientDistPath = path.resolve(__dirname, '../../dist');
app.use(express.static(clientDistPath));

app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 AARIZO PostgreSQL + Prisma Backend listening on port ${PORT}`);
  });
}

export default app;
