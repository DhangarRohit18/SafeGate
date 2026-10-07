import React, { useState, useEffect } from 'react';
import { Package, QrCode, Search, ShieldCheck, Clock, AlertTriangle, Plus, Filter } from 'lucide-react';
import { parcelRoomService } from '../../../domains/deliveries/services/parcelRoomService';
import type { Parcel } from '../../../domains/deliveries/types';
import { realtimeService } from '../../../services/realtimeService';
import { DataTable } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';
import { Modal } from '../../../components/ui/Modal';

export const ParcelRoomSecurityHub: React.FC = () => {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // New parcel form state
  const [residentName, setResidentName] = useState('Vikram Joshi');
  const [flatCode, setFlatCode] = useState('Tower B · B-1204');
  const [courierCompany, setCourierCompany] = useState('Amazon');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [storageLocation, setStorageLocation] = useState('Rack A-1');
  const [notes, setNotes] = useState('');

  // Verify form state
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [verifyOtpInput, setVerifyOtpInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ success?: boolean; message?: string }>({});

  const loadParcels = () => {
    const list = parcelRoomService.getAllParcels('soc-gvs');
    setParcels(list);
  };

  useEffect(() => {
    loadParcels();

    const unsubscribe = realtimeService.subscribe('DELIVERY_STATUS', () => {
      loadParcels();
    });

    return () => unsubscribe();
  }, []);

  const handleRegisterParcel = (e: React.FormEvent) => {
    e.preventDefault();
    parcelRoomService.registerIncomingParcel({
      societyId: 'soc-gvs',
      residentId: 'res-1',
      residentName,
      flatCode,
      courierCompany,
      trackingNumber: trackingNumber || `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      storageLocation,
      notes,
    });
    setShowAddModal(false);
    setTrackingNumber('');
    setNotes('');
    loadParcels();
  };

  const handleVerifyPickup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcel) return;
    const res = parcelRoomService.verifyAndCollectParcel(selectedParcel.id, verifyOtpInput);
    setVerifyResult(res);
    if (res.success) {
      setTimeout(() => {
        setShowVerifyModal(false);
        setVerifyOtpInput('');
        setVerifyResult({});
        loadParcels();
      }, 1200);
    }
  };

  const filtered = parcels.filter((p) => {
    const matchesSearch =
      p.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.flatCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.courierCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'ALL') return matchesSearch;
    if (filterStatus === 'FLAGGED_24H') return matchesSearch && p.isFlagged24h;
    if (filterStatus === 'FLAGGED_48H') return matchesSearch && p.isFlagged48h;
    return matchesSearch && p.status === filterStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Action Header Banner */}
      <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#083B56' }}>Security Parcel Holding Hub</h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#52788D' }}>
            Log incoming courier parcels, assign rack storage, and verify resident OTP pickups
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '0.7rem 1.25rem',
            background: '#F06543',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 3px 12px rgba(240, 101, 67, 0.28)',
          }}
        >
          <Plus size={18} /> Register Incoming Parcel
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Ready For Pickup</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
              {parcels.filter((p) => p.status === 'READY_FOR_PICKUP' || p.status === 'STORED').length}
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Uncollected (&gt;24 Hours)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>
              {parcels.filter((p) => p.isFlagged24h).length}
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Overdue (&gt;48 Hours)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626' }}>
              {parcels.filter((p) => p.isFlagged48h).length}
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F4FAFE', border: '1px solid #DCE8EF', color: '#083B56', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Collected Today</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#083B56' }}>
              {parcels.filter((p) => p.status === 'COLLECTED').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '14px', padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by Resident Name, Flat Code, Courier, or Tracking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.3rem',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '0.85rem',
              outline: 'none',
              background: '#F8FAFC',
              color: '#083B56',
              fontWeight: 600,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: '#52788D' }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '0.85rem',
              background: '#ffffff',
              color: '#083B56',
              fontWeight: 700,
              outline: 'none',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="READY_FOR_PICKUP">Ready For Pickup</option>
            <option value="STORED">Stored</option>
            <option value="FLAGGED_24H">Uncollected (&gt;24h)</option>
            <option value="FLAGGED_48H">Overdue (&gt;48h)</option>
            <option value="COLLECTED">Collected</option>
          </select>
        </div>
      </div>

      {/* Parcels Table / List Container */}
      <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
        <DataTable
          columns={[
            {
              key: 'courier',
              header: 'Parcel ID & Courier',
              render: (p: any) => (
                <div>
                  <div style={{ fontWeight: 800, color: '#083B56' }}>{p.courierCompany}</div>
                  <div style={{ fontSize: '0.75rem', color: '#52788D', fontFamily: 'monospace' }}>Track: {p.trackingNumber}</div>
                </div>
              )
            },
            {
              key: 'resident',
              header: 'Resident & Flat',
              render: (p: any) => (
                <div>
                  <div style={{ fontWeight: 700, color: '#083B56' }}>{p.residentName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#52788D' }}>{p.flatCode}</div>
                </div>
              )
            },
            {
              key: 'location',
              header: 'Storage Location',
              render: (p: any) => (
                <span style={{ padding: '3px 8px', background: '#F4FAFE', border: '1px solid #DCE8EF', fontWeight: 700, color: '#083B56', borderRadius: '6px', fontSize: '0.78rem' }}>
                  {p.storageLocation}
                </span>
              )
            },
            {
              key: 'arrival',
              header: 'Arrival Time & Age',
              render: (p: any) => (
                <div>
                  <div style={{ fontWeight: 600, color: '#083B56', fontSize: '0.85rem' }}>{new Date(p.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{p.ageHours} hrs ago</div>
                </div>
              )
            },
            {
              key: 'status',
              header: 'Status',
              render: (p: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: p.status === 'COLLECTED' ? '#F4FAFE' : p.status === 'READY_FOR_PICKUP' ? '#ECFDF5' : '#F1F5F9',
                      color: p.status === 'COLLECTED' ? '#083B56' : p.status === 'READY_FOR_PICKUP' ? '#059669' : '#475569',
                    }}
                  >
                    {p.status}
                  </span>
                  {p.isFlagged48h && (
                    <span style={{ padding: '2px 6px', background: '#FEF2F2', color: '#DC2626', fontWeight: 800, fontSize: '0.7rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <AlertTriangle size={10} /> 48h Overdue
                    </span>
                  )}
                  {p.isFlagged24h && !p.isFlagged48h && (
                    <span style={{ padding: '2px 6px', background: '#FFFBEB', color: '#D97706', fontWeight: 800, fontSize: '0.7rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <Clock size={10} /> 24h Aging
                    </span>
                  )}
                </div>
              )
            },
            {
              key: 'actions',
              header: 'OTP / Action',
              render: (p: any) => (
                p.status !== 'COLLECTED' ? (
                  <button
                    onClick={() => {
                      setSelectedParcel(p);
                      setShowVerifyModal(true);
                    }}
                    style={{
                      padding: '0.45rem 0.85rem',
                      background: '#083B56',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <QrCode size={13} /> Verify OTP
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> Collected by {p.collectedBy}
                  </span>
                )
              )
            }
          ]}
          data={filtered}
          keyExtractor={(p: any) => p.id}
          pageSize={10}
          mobileRender={(p: any) => (
            <MobileDataCard
              title={`${p.courierCompany} • ${p.flatCode}`}
              subtitle={`Track: ${p.trackingNumber} • Resident: ${p.residentName}`}
              status={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: p.status === 'COLLECTED' ? '#F4FAFE' : p.status === 'READY_FOR_PICKUP' ? '#ECFDF5' : '#F1F5F9',
                      color: p.status === 'COLLECTED' ? '#083B56' : p.status === 'READY_FOR_PICKUP' ? '#059669' : '#475569',
                    }}
                  >
                    {p.status}
                  </span>
                  {p.isFlagged48h && (
                    <span style={{ padding: '2px 6px', background: '#FEF2F2', color: '#DC2626', fontWeight: 800, fontSize: '0.7rem', borderRadius: '4px' }}>
                      48h Overdue
                    </span>
                  )}
                </div>
              }
              attributes={[
                { label: 'Storage Rack', value: p.storageLocation },
                { label: 'Arrived', value: `${new Date(p.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${p.ageHours}h ago)` },
                { label: 'Collection Note', value: p.status === 'COLLECTED' ? `Collected by ${p.collectedBy}` : 'Awaiting OTP verification' }
              ]}
              actions={
                p.status !== 'COLLECTED' ? (
                  <button
                    onClick={() => {
                      setSelectedParcel(p);
                      setShowVerifyModal(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: '#083B56',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <QrCode size={15} /> Verify OTP & Release Package
                  </button>
                ) : undefined
              }
            />
          )}
        />
      </div>

      {/* Add Parcel Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register Incoming Parcel"
        subtitle="Log parcel details into secure holding and issue resident OTP"
        maxWidth="500px"
      >
        <form onSubmit={handleRegisterParcel} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>Resident Name *</label>
            <input
              type="text"
              value={residentName}
              onChange={(e) => setResidentName(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>Flat Code *</label>
            <input
              type="text"
              value={flatCode}
              onChange={(e) => setFlatCode(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>Courier Partner</label>
              <select
                value={courierCompany}
                onChange={(e) => setCourierCompany(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
              >
                <option value="Amazon">Amazon</option>
                <option value="Flipkart">Flipkart</option>
                <option value="Blinkit">Blinkit</option>
                <option value="Zepto">Zepto</option>
                <option value="Swiggy Instamart">Swiggy Instamart</option>
                <option value="DHL">DHL</option>
                <option value="FedEx">FedEx</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>Storage Location</label>
              <select
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
              >
                <option value="Rack A-1">Rack A-1</option>
                <option value="Rack A-2">Rack A-2</option>
                <option value="Rack B-1">Rack B-1</option>
                <option value="Locker 101">Locker 101</option>
                <option value="Locker 102">Locker 102</option>
                <option value="Reception Desk">Reception Desk</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>Tracking Number / AWB</label>
            <input
              type="text"
              placeholder="Optional AWB tracking number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              style={{ padding: '0.65rem 1.25rem', border: '1px solid #CBD5E1', background: '#ffffff', color: '#52788D', fontWeight: 700, borderRadius: '10px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '0.65rem 1.4rem', background: '#F06543', color: '#ffffff', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 3px 12px rgba(240, 101, 67, 0.28)' }}
            >
              Save &amp; Generate OTP
            </button>
          </div>
        </form>
      </Modal>

      {/* Verify Modal */}
      <Modal
        isOpen={showVerifyModal && Boolean(selectedParcel)}
        onClose={() => {
          setShowVerifyModal(false);
          setVerifyOtpInput('');
          setVerifyResult({});
        }}
        title="Verify Pickup OTP"
        subtitle={selectedParcel ? `Parcel #${selectedParcel.id} for ${selectedParcel.residentName} (${selectedParcel.flatCode})` : 'Verify Pickup OTP'}
        maxWidth="440px"
      >
        <form onSubmit={handleVerifyPickup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={verifyOtpInput}
            onChange={(e) => setVerifyOtpInput(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem',
              textAlign: 'center',
              letterSpacing: '0.3em',
              fontSize: '1.5rem',
              fontWeight: 900,
              border: '2px solid #083B56',
              borderRadius: '12px',
              color: '#083B56',
              boxSizing: 'border-box',
            }}
            required
          />
          {verifyResult.message && (
            <div style={{ padding: '0.75rem', borderRadius: '10px', fontSize: '0.82rem', textAlign: 'center', fontWeight: 700, background: verifyResult.success ? '#ECFDF5' : '#FEF2F2', color: verifyResult.success ? '#059669' : '#DC2626' }}>
              {verifyResult.message}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={() => {
                setShowVerifyModal(false);
                setVerifyOtpInput('');
                setVerifyResult({});
              }}
              style={{ padding: '0.65rem 1.25rem', border: '1px solid #CBD5E1', background: '#ffffff', color: '#52788D', fontWeight: 700, borderRadius: '10px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '0.65rem 1.4rem', background: '#083B56', color: '#ffffff', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: 'pointer' }}
            >
              Confirm Pickup
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
