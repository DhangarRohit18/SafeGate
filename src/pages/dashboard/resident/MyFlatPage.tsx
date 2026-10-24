import React, { useState, useEffect } from 'react';
import { Home, Users, Car, UserCheck, Plus, FileText, CheckCircle2 } from 'lucide-react';
import { societyService } from '../../../services/societyService';
import { realtimeService } from '../../../services/realtimeService';
import type { FamilyMember, Vehicle, DomesticWorker } from '../../../types/society';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { Form, FormField } from '../../../components/ui/Form';
import { RealtimeSyncBadge, FileUploader, DocumentList } from '../../../components/common';
import { AdvertisementPopup } from '../../../components/ads/AdvertisementPopup';
import { OffersLauncherPill } from '../../../components/ads/OffersLauncherPill';

export const MyFlatPage: React.FC = () => {
  const currentSocietyId = 'soc-gvs';
  const currentResidentId = 'res-1'; // Vikram Joshi (Flat B-1204)

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [domesticWorkers, setDomesticWorkers] = useState<DomesticWorker[]>([]);

  // Modals
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isAdOpen, setIsAdOpen] = useState(false);

  // Form states
  const [famName, setFamName] = useState('');
  const [relationship, setRelationship] = useState<FamilyMember['relationship']>('SPOUSE');
  const [famPhone, setFamPhone] = useState('');
  const [famIdPhoto, setFamIdPhoto] = useState('');

  const [regNumber, setRegNumber] = useState('');
  const [vehType, setVehType] = useState<Vehicle['vehicleType']>('CAR');
  const [slotNumber, setSlotNumber] = useState('B-P12');
  const [vehRcDoc, setVehRcDoc] = useState('');

  // Flat Documents Locker State
  const [flatDocs, setFlatDocs] = useState<{ id: string; title: string; url: string; date: string }[]>([
    { id: 'fd-1', title: 'Registered Tenancy Agreement (2026-2027)', url: 'https://aarizo.app/docs/tenancy_sample.pdf', date: '01 Jan 2026' },
    { id: 'fd-2', title: 'Society Police Verification Stamp', url: 'https://aarizo.app/docs/police_verif.pdf', date: '15 Jan 2026' },
  ]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  const refreshData = () => {
    setFamilyMembers(societyService.getFamilyMembers(currentSocietyId, currentResidentId));
    setVehicles(societyService.getVehicles(currentSocietyId, currentResidentId));
    setDomesticWorkers(
      societyService.getDomesticWorkers(currentSocietyId).filter((dw) => dw.assignedFlatIds.includes('flat-1204'))
    );
  };

  useEffect(() => {
    refreshData();

    const unsub = realtimeService.subscribe('*', (msg) => {
      if (['WORKER_ENTRY_EXIT', 'STAFF_DUTY_CHANGED', 'GATE_PASS_LOGGED', 'SOCIETY_SYNC'].includes(msg.topic)) {
        refreshData();
      }
    });

    return () => unsub();
  }, []);

  const handleAddFamilyMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!famName) return;

    societyService.addFamilyMember(
      {
        societyId: currentSocietyId,
        residentId: currentResidentId,
        flatId: 'flat-1204',
        name: famName,
        relationship,
        phone: famPhone,
      },
      { id: currentResidentId, name: 'Vikram Joshi', role: 'resident' }
    );

    refreshData();
    setIsFamilyModalOpen(false);
    setFamName('');
    setFamPhone('');
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber) return;

    societyService.addVehicle(
      {
        societyId: currentSocietyId,
        residentId: currentResidentId,
        flatId: 'flat-1204',
        flatCode: 'B-1204',
        registrationNumber: regNumber.toUpperCase(),
        vehicleType: vehType,
        parkingSlotNumber: slotNumber,
        rfidTagCode: `RFID-${Math.floor(10000 + Math.random() * 90000)}`,
      },
      { id: currentResidentId, name: 'Vikram Joshi', role: 'resident' }
    );

    refreshData();
    setIsVehicleModalOpen(false);
    setRegNumber('');
  };

  return (
    <div style={{ background: 'var(--aarizo-page, #F7FBFE)', minHeight: '100%' }}>
      <div style={{ padding: '1rem', paddingBottom: '6rem', maxWidth: '1280px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        {/* Header */}
        <header style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--aarizo-navy, #083B56) 0%, #0D4767 100%)', padding: '1.5rem', borderRadius: '16px', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(8, 59, 86, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Home size={28} color="var(--aarizo-sky, #83CBEA)" />
              <div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>Tower B · Flat 1204</h1>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--aarizo-sky, #83CBEA)', fontSize: '0.85rem' }}>Green Valley Society · 3 BHK Owner Occupied</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <RealtimeSyncBadge state="live" label="Live Synced" />
              <OffersLauncherPill onClick={() => setIsAdOpen(true)} label="Home & Moving Deals" />
            </div>
          </div>
        </header>

      {/* Grid Section 1: Family Members */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="var(--aarizo-blue, #176B91)" />
            <h3 style={{ margin: 0, color: 'var(--aarizo-text-dark, #203746)' }}>Registered Family Members ({familyMembers.length})</h3>
          </div>
          <button
            onClick={() => setIsFamilyModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              background: 'var(--aarizo-blue, #176B91)',
              color: '#FFFFFF',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Add Family Member
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {familyMembers.map((fam) => (
            <div key={fam.id} style={{ padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--aarizo-border, #E8F1F5)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--aarizo-blue-light, #EAF6FC)', color: 'var(--aarizo-blue, #176B91)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {fam.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--aarizo-text-dark, #203746)' }}>{fam.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{fam.relationship} {fam.phone ? `· ${fam.phone}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grid Section 2: Vehicles */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Car size={20} color="var(--aarizo-blue, #176B91)" />
            <h3 style={{ margin: 0, color: '#0f172a' }}>Vehicles & Parking Slots ({vehicles.length})</h3>
          </div>
          <button
            onClick={() => setIsVehicleModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              background: 'var(--aarizo-blue, #176B91)',
              color: '#FFFFFF',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Register Vehicle
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {vehicles.map((veh) => (
            <div key={veh.id} style={{ padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{veh.registrationNumber}</span>
                <StatusBadge label={veh.vehicleType} variant="info" size="sm" />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Slot: <strong>{veh.parkingSlotNumber}</strong> {veh.rfidTagCode ? `· Tag: ${veh.rfidTagCode}` : ''}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grid Section 3: Household Staff / Domestic Help */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <UserCheck size={20} color="var(--aarizo-blue, #176B91)" />
          <h3 style={{ margin: 0, color: '#0f172a' }}>Assigned Household Staff ({domesticWorkers.length})</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {domesticWorkers.map((dw) => (
            <div key={dw.id} style={{ padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{dw.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{dw.workRole} · Code: {dw.passCode}</div>
              </div>
              <StatusBadge
                label={dw.status === 'INSIDE' ? 'INSIDE COMPLEX' : 'OUTSIDE'}
                variant={dw.status === 'INSIDE' ? 'success' : 'neutral'}
                size="sm"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Grid Section 4: Flat Documents & Agreements */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--aarizo-blue, #176B91)" />
            <h3 style={{ margin: 0, color: '#0f172a' }}>Flat Documents, Lease Agreements &amp; NOCs ({flatDocs.length})</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsDocModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              background: 'var(--aarizo-blue, #176B91)',
              color: '#FFFFFF',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Upload Document
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {flatDocs.map((doc) => (
            <div key={doc.id} style={{ padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{doc.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Verified On: {doc.date}</div>
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#176B91',
                  background: '#EAF6FC',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                }}
              >
                View
              </a>
            </div>
          ))}
        </div>

        {/* Embedded Real-time Document Vault */}
        <div style={{ marginTop: '1.25rem' }}>
          <DocumentList
            societyId={currentSocietyId}
            entityType="resident"
            entityId="flat-1204"
            title="Society Digital Vault &amp; Lease Agreements"
            canDelete={true}
          />
        </div>
      </section>

      {/* Add Family Member Modal */}
      <Modal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
        title="Add Family Member"
        subtitle="Associate family member to Unit 1204"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setIsFamilyModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              form="add-family-member-form"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F06543] to-[#E05432] text-white font-bold text-xs shadow-sm hover:shadow transition cursor-pointer"
            >
              Save Member
            </button>
          </div>
        }
      >
        <Form id="add-family-member-form" onSubmit={handleAddFamilyMember}>
          <FormField label="Full Name" required>
            <input
              type="text"
              required
              value={famName}
              onChange={(e) => setFamName(e.target.value)}
              placeholder="e.g. Aarav Joshi"
              style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Relationship">
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as FamilyMember['relationship'])}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
              >
                <option value="SPOUSE">Spouse</option>
                <option value="CHILD">Child</option>
                <option value="PARENT">Parent</option>
                <option value="SIBLING">Sibling</option>
                <option value="OTHER">Other</option>
              </select>
            </FormField>
            <FormField label="Phone (Optional)">
              <input
                type="tel"
                value={famPhone}
                onChange={(e) => setFamPhone(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </FormField>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <FileUploader
              label="Member Photo ID / Govt Proof (Optional)"
              entityType="resident"
              entityId="flat-1204"
              societyId={currentSocietyId}
              onUploadSuccess={(res) => setFamIdPhoto(res.downloadUrl)}
              onRemove={() => setFamIdPhoto('')}
            />
            {famIdPhoto && (
              <p style={{ fontSize: '0.75rem', color: '#059669', margin: '0.3rem 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={14} /> ID Document Attached
              </p>
            )}
          </div>
        </Form>
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        title="Register Vehicle & Parking Tag"
        subtitle="Issue FASTag / RFID parking access for Unit 1204"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setIsVehicleModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              form="add-vehicle-form"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F06543] to-[#E05432] text-white font-bold text-xs shadow-sm hover:shadow transition cursor-pointer"
            >
              Register Vehicle
            </button>
          </div>
        }
      >
        <Form id="add-vehicle-form" onSubmit={handleAddVehicle}>
          <FormField label="Vehicle Number" required>
            <input
              type="text"
              required
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
              placeholder="e.g. MH-02-CB-4092"
              style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Vehicle Type">
              <select
                value={vehType}
                onChange={(e) => setVehType(e.target.value as Vehicle['vehicleType'])}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
              >
                <option value="CAR">Car / SUV</option>
                <option value="BIKE">Two-Wheeler / Bike</option>
                <option value="EV">Electric Vehicle (EV)</option>
              </select>
            </FormField>
            <FormField label="Allocated Slot">
              <input
                type="text"
                value={slotNumber}
                onChange={(e) => setSlotNumber(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </FormField>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <FileUploader
              label="Vehicle Registration (RC) / Insurance Copy"
              entityType="resident"
              entityId="flat-1204"
              societyId={currentSocietyId}
              onUploadSuccess={(res) => setVehRcDoc(res.downloadUrl)}
              onRemove={() => setVehRcDoc('')}
            />
            {vehRcDoc && (
              <p style={{ fontSize: '0.75rem', color: '#059669', margin: '0.3rem 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={14} /> RC Document Attached
              </p>
            )}
          </div>
        </Form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Upload Flat Agreement / Document"
        subtitle="Keep ownership deeds & tenant agreements digitally verified"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setIsDocModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              form="upload-flat-doc-form"
              type="submit"
              disabled={!newDocUrl}
              className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs transition-all shadow-sm ${
                newDocUrl
                  ? 'bg-gradient-to-r from-[#F06543] to-[#E05432] hover:shadow-md cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              Save Document
            </button>
          </div>
        }
      >
        <form
          id="upload-flat-doc-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newDocTitle || !newDocUrl) return;
            setFlatDocs([
              ...flatDocs,
              {
                id: `fd-${Date.now()}`,
                title: newDocTitle,
                url: newDocUrl,
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              },
            ]);
            setIsDocModalOpen(false);
            setNewDocTitle('');
            setNewDocUrl('');
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title / Type</label>
            <input
              type="text"
              required
              placeholder="e.g. Registered Tenancy Agreement / Possession Letter"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-xs"
            />
          </div>

          <FileUploader
            label="Upload Document File (PDF or Photo)"
            entityType="resident"
            entityId="flat-1204"
            societyId={currentSocietyId}
            onUploadSuccess={(res) => setNewDocUrl(res.downloadUrl)}
            onRemove={() => setNewDocUrl('')}
          />
        </form>
      </Modal>

      {/* Partner Offers & Ads Modal */}
      <AdvertisementPopup isOpen={isAdOpen} onClose={() => setIsAdOpen(false)} />
      </div>
    </div>
  );
};

