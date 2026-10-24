import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { guestStayService } from '../../../services/guestStayService';
import type { GuestRoom, GuestReservation, GuestStaySettings, RoomType } from '../../../types/guestStay';
import { Modal } from '../../../components/ui/Modal';
import { DataTable } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';
import {
  Hotel,
  Building,
  Plus,
  ToggleLeft,
  ToggleRight,
  IndianRupee,
  Calendar
} from 'lucide-react';

const ROOM_TYPES: RoomType[] = [
  'STUDIO',
  'EXECUTIVE_SUITE',
  'DELUXE_ROOM',
  'PENTHOUSE_SUITE'
];

export const AdminGuestStayPage: React.FC = () => {
  const { currentUser } = useAuth();
  const societyId = (currentUser as any)?.societyId || 'soc-1';

  const [settings, setSettings] = useState<GuestStaySettings | null>(null);
  const [rooms, setRooms] = useState<GuestRoom[]>([]);
  const [reservations, setReservations] = useState<GuestReservation[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    roomName: '',
    type: 'EXECUTIVE_SUITE' as RoomType,
    description: '',
    pricePerNight: 2000,
    capacity: 2,
    amenitiesText: 'King Size Bed\nAC\nSmart TV\nWiFi\nAttached Bathroom',
    rulesText: 'Government ID Proof mandatory\nCheck-in: 12:00 PM / Check-out: 10:00 AM'
  });

  useEffect(() => {
    loadData();
  }, [societyId]);

  const loadData = () => {
    setSettings(guestStayService.getSettings(societyId));
    setRooms(guestStayService.getRooms(societyId));
    setReservations(guestStayService.getReservations(societyId));
  };

  const handleToggleModule = () => {
    if (!settings) return;
    const updated = guestStayService.saveSettings({
      ...settings,
      isGuestStayEnabled: !settings.isGuestStayEnabled
    });
    setSettings(updated);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.roomNumber || !roomForm.roomName) return;

    guestStayService.createRoom(
      societyId,
      roomForm.roomNumber,
      roomForm.roomName,
      roomForm.type,
      roomForm.description,
      roomForm.pricePerNight,
      roomForm.capacity,
      roomForm.amenitiesText.split('\n').filter(Boolean),
      roomForm.rulesText.split('\n').filter(Boolean),
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
    );

    setShowCreateModal(false);
    setRoomForm({
      roomNumber: '',
      roomName: '',
      type: 'EXECUTIVE_SUITE',
      description: '',
      pricePerNight: 2000,
      capacity: 2,
      amenitiesText: 'King Size Bed\nAC\nSmart TV\nWiFi\nAttached Bathroom',
      rulesText: 'Government ID Proof mandatory\nCheck-in: 12:00 PM / Check-out: 10:00 AM'
    });
    loadData();
  };

  const handleApproveReservation = (id: string) => {
    guestStayService.updateReservationStatus(societyId, id, 'CONFIRMED', 'Approved by Admin');
    loadData();
  };

  const handleRejectReservation = (id: string) => {
    guestStayService.updateReservationStatus(societyId, id, 'REJECTED', 'Rejected by Admin');
    loadData();
  };

  const totalRevenue = reservations
    .filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN' || r.status === 'CHECKED_OUT')
    .reduce((acc, curr) => acc + curr.totalPrice, 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 pb-24 space-y-6">
      {/* Header */}
      <div
        className="p-5 md:p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white"
        style={{ background: 'linear-gradient(135deg, var(--aarizo-navy, #083B56) 0%, #0D4767 100%)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Hotel className="w-6 h-6" style={{ color: 'var(--aarizo-sky, #83CBEA)' }} />
            <h1 className="text-xl md:text-2xl font-extrabold text-white">Guest Stay &amp; Accommodation Management</h1>
          </div>
          <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--aarizo-sky, #83CBEA)' }}>
            Configure society guest suites, pricing, stay policies, approval workflows, and optional module toggle.
          </p>
        </div>

        {/* Optional Module Toggle Switch */}
        <div className="flex items-center gap-3 bg-white/10 p-2.5 px-3.5 rounded-2xl border border-white/20 shrink-0">
          <span className="text-xs font-bold text-white">Module Status:</span>
          <button
            onClick={handleToggleModule}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
              settings?.isGuestStayEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-800'
            }`}
          >
            {settings?.isGuestStayEnabled ? (
              <>
                <ToggleRight className="w-5 h-5" /> ENABLED
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" /> DISABLED
              </>
            )}
          </button>
        </div>
      </div>

      {!settings?.isGuestStayEnabled ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-3">
          <Hotel className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-xl font-bold text-slate-800">Guest Accommodation Module Disabled</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Guest stay accommodation is currently disabled for this society. Toggle the switch above to enable guest rooms.
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#083B56] to-[#176B91] text-white shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-200">Guest Stay Revenue</span>
                <div className="text-2xl font-black mt-0.5">₹{totalRevenue.toLocaleString()}</div>
                <div className="text-[11px] text-sky-100 mt-0.5">Earned from guest suite reservations</div>
              </div>
              <div className="p-3 bg-white/20 text-white rounded-xl">
                <IndianRupee className="w-6 h-6" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-[#EAF6FC] text-[#083B56] rounded-xl shrink-0">
                  <Hotel className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Total Suites</span>
                  <span className="text-lg font-bold text-slate-900 block">{rooms.length}</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Reservations</span>
                  <span className="text-lg font-bold text-slate-900 block">{reservations.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rooms List & Add Button */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-bold text-slate-900">Society Guest Rooms Register</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-2 bg-[#176B91] hover:bg-[#125877] text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Add Suite
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rooms.map(room => (
                <div key={room.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
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
                        <Building className="w-3.5 h-3.5" /> Room #{room.roomNumber} · Max {room.capacity} Guests
                      </p>
                      <p className="text-slate-600 text-sm mt-2 line-clamp-2">{room.description}</p>

                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-slate-700 block mb-1">Amenities Included:</span>
                        <div className="flex flex-wrap gap-1">
                          {room.amenities.map((a, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-md font-semibold">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reservations Board */}
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Resident Stay Reservations</h2>

            <div className="mt-4">
              <DataTable
                columns={[
                  { key: 'reservationNumber', header: 'Reservation #' },
                  { key: 'roomName', header: 'Room', render: (resv: GuestReservation) => `${resv.roomName} (#${resv.roomNumber})` },
                  { key: 'residentName', header: 'Resident Host', render: (resv: GuestReservation) => `${resv.residentName} (${resv.flatNumber})` },
                  { key: 'primaryGuestName', header: 'Primary Guest', render: (resv: GuestReservation) => `${resv.primaryGuestName} (${resv.primaryGuestPhone})` },
                  { key: 'dates', header: 'Stay Dates', render: (resv: GuestReservation) => `${resv.checkInDate} to ${resv.checkOutDate} (${resv.totalNights} nights)` },
                  { key: 'totalPrice', header: 'Total Price', render: (resv: GuestReservation) => `₹${resv.totalPrice}` },
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
                      resv.status === 'PENDING_APPROVAL' ? (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleApproveReservation(resv.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectReservation(resv.id)}
                            className="px-2.5 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg"
                          >
                            Reject
                          </button>
                        </div>
                      ) : null
                    )
                  }
                ]}
                data={reservations}
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
                      { label: 'Host', value: `${resv.residentName} (${resv.flatNumber})` },
                      { label: 'Guest', value: `${resv.primaryGuestName} (${resv.primaryGuestPhone})` },
                      { label: 'Stay', value: `${resv.totalNights} nights (₹${resv.totalPrice})` }
                    ]}
                    actions={
                      resv.status === 'PENDING_APPROVAL' ? (
                        <div className="flex gap-2 w-full mt-2">
                          <button
                            onClick={() => handleApproveReservation(resv.id)}
                            className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg min-h-[44px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectReservation(resv.id)}
                            className="flex-1 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg min-h-[44px]"
                          >
                            Reject
                          </button>
                        </div>
                      ) : undefined
                    }
                  />
                )}
              />
            </div>
          </div>
        </>
      )}

      {/* Modal: Create Room */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Configure New Guest Suite"
        maxWidth="540px"
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
              form="create-guest-suite-form"
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
              Save Guest Suite
            </button>
          </div>
        }
      >
        <form id="create-guest-suite-form" onSubmit={handleCreateRoom} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 104"
                value={roomForm.roomNumber}
                onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Suite Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Penthouse Suite 104"
                value={roomForm.roomName}
                onChange={e => setRoomForm({ ...roomForm, roomName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room Type</label>
              <select
                value={roomForm.type}
                onChange={e => setRoomForm({ ...roomForm, type: e.target.value as RoomType })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                {ROOM_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price per Night (₹)</label>
              <input
                type="number"
                min={500}
                required
                value={roomForm.pricePerNight}
                onChange={e => setRoomForm({ ...roomForm, pricePerNight: parseInt(e.target.value) || 1000 })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity</label>
              <input
                type="number"
                min={1}
                max={6}
                required
                value={roomForm.capacity}
                onChange={e => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 2 })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Suite facilities description..."
              value={roomForm.description}
              onChange={e => setRoomForm({ ...roomForm, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amenities Included (One per line)</label>
            <textarea
              rows={3}
              value={roomForm.amenitiesText}
              onChange={e => setRoomForm({ ...roomForm, amenitiesText: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm font-mono text-xs"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

