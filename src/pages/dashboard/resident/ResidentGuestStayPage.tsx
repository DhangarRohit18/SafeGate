import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../../context/AuthContext';
import { guestStayService } from '../../../services/guestStayService';
import { realtimeService } from '../../../services/realtimeService';
import type { GuestRoom, GuestReservation, GuestStaySettings } from '../../../types/guestStay';
import { Modal } from '../../../components/ui/Modal';
import { DataTable } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';
import { RazorpayCheckoutModal } from '../../../domains/payments/RazorpayCheckoutModal';
import { FileUpload } from '../../../components/ui/FileUpload';
import { AdvertisementPopup } from '../../../components/ads/AdvertisementPopup';
import { OffersLauncherPill } from '../../../components/ads/OffersLauncherPill';
import {
  Hotel,
  Calendar,
  QrCode,
  Building,
  XCircle,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

export const ResidentGuestStayPage: React.FC = () => {
  const { currentUser } = useAuth();
  const societyId = (currentUser as any)?.societyId || 'soc-1';
  const residentId = currentUser?.id || 'res-1';
  const residentName = currentUser?.name || 'resident';
  const flatNumber = (currentUser as any)?.flatDetails || 'A-101';

  const [settings, setSettings] = useState<GuestStaySettings | null>(null);
  const [rooms, setRooms] = useState<GuestRoom[]>([]);
  const [myReservations, setMyReservations] = useState<GuestReservation[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<GuestRoom | null>(null);

  // Booking Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [idProofType, setIdProofType] = useState('Aadhaar Card');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [guestIdDocUrl, setGuestIdDocUrl] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().substring(0, 10));
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));

  // Razorpay & Ad States
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [bookingTotalAmount, setBookingTotalAmount] = useState(0);
  const [isAdOpen, setIsAdOpen] = useState(false);

  // Active QR View Modal
  const [viewingQRResv, setViewingQRResv] = useState<GuestReservation | null>(null);

  useEffect(() => {
    loadData();

    const unsub = realtimeService.subscribe('*', (msg) => {
      if (['GUEST_STAY_BOOKED', 'GUEST_CHECKED_IN', 'GUEST_CHECKED_OUT', 'SOCIETY_SYNC'].includes(msg.topic)) {
        loadData();
      }
    });

    return () => unsub();
  }, [societyId, residentId]);

  const loadData = () => {
    setSettings(guestStayService.getSettings(societyId));
    setRooms(guestStayService.getRooms(societyId));
    const list = guestStayService.getReservations(societyId).filter(r => r.residentId === residentId);
    setMyReservations(list);
  };

  const confirmBooking = () => {
    if (!selectedRoom) return;
    const resv = guestStayService.requestReservation(
      societyId,
      selectedRoom.id,
      residentId,
      residentName,
      flatNumber,
      guestName,
      guestPhone,
      idProofType,
      idProofNumber,
      guestCount,
      checkInDate,
      checkOutDate
    );

    realtimeService.publish(
      'GUEST_STAY_BOOKED',
      {
        resvId: resv.id,
        guestName,
        roomName: selectedRoom.roomName,
        flatNumber,
        checkInDate,
        checkOutDate,
      },
      societyId,
      'RESIDENT'
    );

    setSelectedRoom(null);
    setGuestName('');
    setGuestPhone('');
    setIdProofNumber('');
    setGuestIdDocUrl('');
    setViewingQRResv(resv);
    loadData();
  };

  const handleBookRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !guestName || !guestPhone) return;

    const nights = Math.max(
      1,
      Math.round(
        (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    const total = (selectedRoom.pricePerNight || 0) * nights;
    setBookingTotalAmount(total);

    if (total > 0) {
      setIsRazorpayOpen(true);
      return;
    }

    confirmBooking();
  };

  const handleCancelReservation = (id: string) => {
    guestStayService.updateReservationStatus(societyId, id, 'CANCELLED', 'Cancelled by Resident');
    loadData();
  };

  if (settings && !settings.isGuestStayEnabled) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 m-6">
        <Hotel className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-slate-800">Guest Accommodation Unavailable</h2>
        <p className="text-xs text-slate-500 mt-1">Guest room booking is currently not enabled by the society management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div
        className="p-5 md:p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white"
        style={{ background: 'linear-gradient(135deg, var(--aarizo-navy, #083B56) 0%, #0D4767 100%)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Hotel className="w-6 h-6" style={{ color: 'var(--aarizo-sky, #83CBEA)' }} />
            <h1 className="text-xl md:text-2xl font-extrabold text-white">Guest Stay & Room Accommodation</h1>
          </div>
          <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--aarizo-sky, #83CBEA)' }}>
            Book society guest suites for visiting family, friends, or business guests with automatic Gate Access QRs.
          </p>
        </div>
        <OffersLauncherPill onClick={() => setIsAdOpen(true)} label="Travel & Hospitality Perks" />
      </div>

      {/* Guest Rooms Catalog */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Available Guest Suites</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map(room => (
            <div key={room.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:border-[#83CBEA] transition-colors">
              <div>
                {room.imageUrl && (
                  <div className="h-44 w-full overflow-hidden relative">
                    <img src={room.imageUrl} alt={room.roomName} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full font-bold">
                      ₹{room.pricePerNight} / Night
                    </div>
                  </div>
                )}
                <div className="p-5 space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">{room.roomName}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-[#176B91]" /> Suite #{room.roomNumber} · Max {room.capacity} Pax
                  </p>
                  <p className="text-slate-600 text-sm mt-2 line-clamp-2">{room.description}</p>

                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Included Amenities:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {room.amenities.map((a, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 bg-sky-50 text-[#176B91] border border-sky-100 text-[10px] rounded-md font-bold">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => setSelectedRoom(room)}
                  className="w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
                  style={{ background: 'var(--aarizo-blue, #176B91)' }}
                >
                  <Calendar className="w-4 h-4" /> Book Suite Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Reservations */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">My Guest Stay Reservations</h2>

        <div className="mt-4">
          <DataTable
            columns={[
              { key: 'reservationNumber', header: 'Reservation #' },
              { key: 'roomName', header: 'Suite Name', render: (resv: GuestReservation) => `${resv.roomName} (#${resv.roomNumber})` },
              { key: 'primaryGuestName', header: 'Primary Guest', render: (resv: GuestReservation) => `${resv.primaryGuestName} (${resv.primaryGuestPhone})` },
              { key: 'dates', header: 'Dates', render: (resv: GuestReservation) => `${resv.checkInDate} to ${resv.checkOutDate} (${resv.totalNights} nights)` },
              { key: 'totalPrice', header: 'Total Cost', render: (resv: GuestReservation) => `₹${resv.totalPrice}` },
              {
                key: 'status',
                header: 'Status',
                render: (resv: GuestReservation) => (
                  <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${
                    resv.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                    resv.status === 'CHECKED_IN' ? 'bg-[#EAF6FC] text-[#083B56]' :
                    resv.status === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-700' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {resv.status}
                  </span>
                )
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (resv: GuestReservation) => (
                  <div className="flex justify-end gap-2">
                    {(resv.status === 'CONFIRMED' || resv.status === 'CHECKED_IN') && (
                      <button
                        onClick={() => setViewingQRResv(resv)}
                        className="px-3 py-1.5 border border-[#A7D7EC] text-[#176B91] hover:bg-[#EAF6FC] text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Gate QR Pass
                      </button>
                    )}
                    {resv.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancelReservation(resv.id)}
                        className="px-2.5 py-1 text-xs border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                )
              }
            ]}
            data={myReservations}
            keyExtractor={(resv: GuestReservation) => resv.id}
            pageSize={10}
            mobileRender={(resv: GuestReservation) => (
              <MobileDataCard
                title={`${resv.roomName} (#${resv.roomNumber})`}
                subtitle={`Res #${resv.reservationNumber} • ${resv.checkInDate} to ${resv.checkOutDate}`}
                status={
                  <span className={`px-2 py-0.5 text-[0.65rem] rounded-full font-bold ${
                    resv.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                    resv.status === 'CHECKED_IN' ? 'bg-[#EAF6FC] text-[#083B56]' :
                    resv.status === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-700' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {resv.status}
                  </span>
                }
                attributes={[
                  { label: 'Primary Guest', value: `${resv.primaryGuestName} (${resv.primaryGuestPhone})` },
                  { label: 'Duration', value: `${resv.totalNights} nights` },
                  { label: 'Total Cost', value: `₹${resv.totalPrice}` }
                ]}
                actions={
                  <div className="flex flex-wrap gap-2 w-full mt-2">
                    {(resv.status === 'CONFIRMED' || resv.status === 'CHECKED_IN') && (
                      <button
                        onClick={() => setViewingQRResv(resv)}
                        className="flex-1 py-1.5 border border-[#A7D7EC] text-[#176B91] bg-[#EAF6FC]/60 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 min-h-[44px] transition-colors"
                      >
                        <QrCode className="w-4 h-4" /> Gate QR Pass
                      </button>
                    )}
                    {resv.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancelReservation(resv.id)}
                        className="flex-1 py-1.5 border border-rose-200 text-rose-600 bg-rose-50/50 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 min-h-[44px] transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </button>
                    )}
                  </div>
                }
              />
            )}
          />
        </div>
      </div>

      {/* Modal: View QR Access Pass */}
      {viewingQRResv && (
        <Modal
          isOpen={!!viewingQRResv}
          onClose={() => setViewingQRResv(null)}
          title="Guest Gate Access QR Pass"
          subtitle={`Suite: ${viewingQRResv.roomName} (#${viewingQRResv.roomNumber})`}
          icon={<Hotel className="w-5 h-5 text-[#F06543]" />}
          maxWidth="440px"
          footer={
            <button
              type="button"
              onClick={() => setViewingQRResv(null)}
              className="w-full py-2.5 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
              style={{ background: 'var(--aarizo-coral, #F06543)' }}
            >
              Done / Share Pass with Guest
            </button>
          }
        >
          <div className="flex flex-col items-center gap-3.5 py-1">
            {/* Guest info */}
            <div className="text-center">
              <h3 className="text-xl font-black text-[#083B56] m-0">{viewingQRResv.primaryGuestName}</h3>
              <p className="text-xs text-slate-500 mt-0.5 m-0">
                Suite: <strong className="text-slate-700">{viewingQRResv.roomName} (#{viewingQRResv.roomNumber})</strong>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 m-0">
                Check-in: {viewingQRResv.checkInDate} · Check-out: {viewingQRResv.checkOutDate}
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 w-full max-w-[280px] flex flex-col items-center gap-2">
              <div className="bg-[#EAF6FC] p-3 rounded-xl border border-[#A7D7EC] flex items-center justify-center">
                <QRCodeSVG value={viewingQRResv.qrCode} size={150} level="M" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg tracking-widest">
                {viewingQRResv.qrCode}
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Book Guest Room */}
      {selectedRoom && (
        <Modal
          isOpen={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
          title={`Book ${selectedRoom.roomName}`}
          subtitle={`₹${selectedRoom.pricePerNight} / Night · Max Capacity: ${selectedRoom.capacity} Guests`}
          maxWidth="520px"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                form="book-guest-room-form"
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F06543] to-[#E05432] text-white font-bold text-xs shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                {selectedRoom.pricePerNight && selectedRoom.pricePerNight > 0 ? (
                  <>
                    <CreditCard size={15} /> Pay &amp; Generate QR Pass
                  </>
                ) : (
                  'Confirm & Generate QR Pass'
                )}
              </button>
            </div>
          }
        >
          <form id="book-guest-room-form" onSubmit={handleBookRoom} className="space-y-4">
            <div className="bg-sky-50 p-3 rounded-xl text-xs text-[#083B56] font-medium border border-sky-100">
              <strong>Rate:</strong> ₹{selectedRoom.pricePerNight} / Night · Max Capacity: {selectedRoom.capacity} Guests
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Guest Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Vikram Sharma"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guest Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Guests</label>
                <input
                  type="number"
                  min={1}
                  max={selectedRoom.capacity}
                  required
                  value={guestCount}
                  onChange={e => setGuestCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ID Proof Type</label>
                <select
                  value={idProofType}
                  onChange={e => setIdProofType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ID Proof Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. XXXX-XXXX-9912"
                  value={idProofNumber}
                  onChange={e => setIdProofNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Check-in Date</label>
                <input
                  type="date"
                  required
                  value={checkInDate}
                  min={new Date().toISOString().substring(0, 10)}
                  onChange={e => setCheckInDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Check-out Date</label>
                <input
                  type="date"
                  required
                  value={checkOutDate}
                  min={checkInDate}
                  onChange={e => setCheckOutDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="pt-1">
              <FileUpload
                category="kyc"
                label="Upload Guest Govt ID (Aadhaar / Passport / DL)"
                onUploadSuccess={(url) => setGuestIdDocUrl(url)}
              />
              {guestIdDocUrl && (
                <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Guest ID Attached Successfully
                </p>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* Razorpay Online Payment Modal */}
      {selectedRoom && (
        <RazorpayCheckoutModal
          isOpen={isRazorpayOpen}
          onClose={() => setIsRazorpayOpen(false)}
          amount={bookingTotalAmount}
          purpose={`Guest Stay: ${selectedRoom.roomName} (${checkInDate} to ${checkOutDate})`}
          societyName="Green Valley Society"
          invoiceNumber={`GST-${Date.now().toString().slice(-6)}`}
          userName={residentName}
          userPhone={currentUser?.phone || '9876543210'}
          userEmail={currentUser?.email || 'resident@aarizo.com'}
          onSuccess={() => {
            setIsRazorpayOpen(false);
            confirmBooking();
          }}
        />
      )}

      {/* Society Partner Discounts Modal */}
      <AdvertisementPopup isOpen={isAdOpen} onClose={() => setIsAdOpen(false)} />
    </div>
  );
};

