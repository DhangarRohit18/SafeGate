import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Plus, ArrowLeft, Search } from 'lucide-react';
import { societyService } from '../../../services/societyService';
import type { Flat, BHKType, OccupancyStatus } from '../../../types/society';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { Form, FormField } from '../../../components/ui/Form';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';

export const FlatManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const currentSocietyId = 'soc-gvs';
  const [flats, setFlats] = useState<Flat[]>(societyService.getFlats(currentSocietyId));
  const towers = societyService.getTowers(currentSocietyId);
  const [occupancyFilter, setOccupancyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTowerId, setSelectedTowerId] = useState(towers[0]?.id || '');
  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [flatNumber, setFlatNumber] = useState('');
  const [bhkType, setBhkType] = useState<BHKType>('3BHK');
  const [occupancyStatus, setOccupancyStatus] = useState<OccupancyStatus>('OWNER_OCCUPIED');

  const refreshData = () => {
    setFlats(societyService.getFlats(currentSocietyId));
  };

  const handleCreateFlat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatNumber || !selectedTowerId) return;

    const tower = towers.find((t) => t.id === selectedTowerId);

    societyService.createFlat(
      {
        societyId: currentSocietyId,
        towerId: selectedTowerId,
        towerName: tower?.name || 'Tower B',
        floorNumber: Number(floorNumber),
        flatNumber: flatNumber.toUpperCase(),
        bhkType,
        occupancyStatus,
      },
      { id: 'sec-admin-1', name: 'Mayuri Udar', role: 'SOCIETY_ADMIN' }
    );

    refreshData();
    setIsAddModalOpen(false);
    setFlatNumber('');
  };

  const filteredFlats = flats.filter((f) => {
    const matchesFilter = occupancyFilter === 'ALL' || f.occupancyStatus === occupancyFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      f.flatNumber.toLowerCase().includes(q) ||
      f.towerName.toLowerCase().includes(q) ||
      (f.primaryResidentName && f.primaryResidentName.toLowerCase().includes(q)) ||
      (f.phone && f.phone.includes(q)) ||
      f.bhkType.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const columns: Column<Flat>[] = [
    { key: 'flatNumber', header: 'Flat Number', sortable: true, width: '120px' },
    { key: 'towerName', header: 'Tower', sortable: true },
    { key: 'floorNumber', header: 'Floor' },
    { key: 'bhkType', header: 'BHK Type' },
    {
      key: 'primaryResidentName',
      header: 'Primary Resident',
      render: (f) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--aarizo-navy, #083B56)' }}>{f.primaryResidentName || 'Vacant'}</div>
          {f.phone && <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)' }}>{f.phone}</div>}
        </div>
      ),
    },
    {
      key: 'occupancyStatus',
      header: 'Occupancy Status',
      render: (f) => (
        <StatusBadge
          label={f.occupancyStatus.replace('_', ' ')}
          variant={f.occupancyStatus === 'OWNER_OCCUPIED' ? 'success' : f.occupancyStatus === 'TENANT_OCCUPIED' ? 'info' : 'warning'}
        />
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100%', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: '2.5rem' }}>
      {/* ── Subheader Bar matching Residents, NGO, Staff & Towers tabs ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          background: 'var(--aarizo-card-blue, #F4FAFE)',
          borderBottom: '1px solid var(--aarizo-border, #DCE8EF)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flex: '1 1 auto' }}>
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
              Flat Inventory &amp; Directory
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Units, occupancy status, and flat specifications
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
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
          <Plus size={15} /> Add Flat
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
            placeholder="Search by flat number, resident name, tower, or phone..."
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

        {/* Occupancy Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { id: 'ALL', label: `All Flats (${flats.length})` },
            { id: 'OWNER_OCCUPIED', label: `Owner Occupied (${flats.filter(f => f.occupancyStatus === 'OWNER_OCCUPIED').length})` },
            { id: 'TENANT_OCCUPIED', label: `Tenant Occupied (${flats.filter(f => f.occupancyStatus === 'TENANT_OCCUPIED').length})` },
            { id: 'VACANT', label: `Vacant (${flats.filter(f => f.occupancyStatus === 'VACANT').length})` },
          ].map((option) => {
            const isActive = occupancyFilter === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setOccupancyFilter(option.id)}
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
                <Home size={14} color={isActive ? '#ffffff' : 'var(--aarizo-coral, #F06543)'} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Count Heading ── */}
      <div className="max-w-7xl mx-auto w-full" style={{ padding: '0.25rem 1rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--aarizo-text-secondary, #657785)' }}>
          {filteredFlats.length} flats found
        </span>
      </div>

      {/* ── Main Roster Table / Mobile Data Cards ── */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4">
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            borderRadius: '16px',
            padding: '1rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.04)',
          }}
        >
          <DataTable
            columns={columns}
            data={filteredFlats}
            keyExtractor={(item) => item.id}
            pageSize={10}
            mobileRender={(f) => (
              <MobileDataCard
                title={f.flatNumber}
                subtitle={f.primaryResidentName || 'Vacant'}
                status={<StatusBadge label={f.occupancyStatus.replace('_', ' ')} variant={f.occupancyStatus === 'OWNER_OCCUPIED' ? 'success' : f.occupancyStatus === 'TENANT_OCCUPIED' ? 'info' : 'warning'} />}
                attributes={[
                  { label: 'Tower', value: f.towerName },
                  { label: 'Floor', value: f.floorNumber },
                  { label: 'BHK', value: f.bhkType },
                  { label: 'Phone', value: f.phone || '-' }
                ]}
              />
            )}
          />
        </div>
      </div>

      {/* Modal: Register New Flat */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Flat">
        <Form onSubmit={handleCreateFlat}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FormField label="Tower / Block">
              <select
                value={selectedTowerId}
                onChange={(e) => setSelectedTowerId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F06543]"
              >
                {towers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Floor Number">
              <input
                type="number"
                value={floorNumber}
                onChange={(e) => setFloorNumber(Number(e.target.value))}
                min="0"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F06543]"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FormField label="Flat Number">
              <input
                type="text"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder="e.g. 204"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#F06543]"
              />
            </FormField>
            <FormField label="BHK Type">
              <select
                value={bhkType}
                onChange={(e) => setBhkType(e.target.value as BHKType)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F06543]"
              >
                <option value="1BHK">1 BHK</option>
                <option value="2BHK">2 BHK</option>
                <option value="3BHK">3 BHK</option>
                <option value="4BHK">4 BHK</option>
                <option value="PENTHOUSE">Penthouse</option>
              </select>
            </FormField>
          </div>
          <FormField label="Initial Occupancy Status">
            <select
              value={occupancyStatus}
              onChange={(e) => setOccupancyStatus(e.target.value as OccupancyStatus)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F06543]"
            >
              <option value="OWNER_OCCUPIED">Owner Occupied</option>
              <option value="TENANT_OCCUPIED">Tenant Occupied</option>
              <option value="VACANT">Vacant</option>
            </select>
          </FormField>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-xl font-semibold text-xs sm:text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ background: 'var(--aarizo-coral, #F06543)' }}
              className="px-4 py-2 border-none text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition cursor-pointer"
            >
              Register Flat
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
