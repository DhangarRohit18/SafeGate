import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Home, CheckCircle2, ArrowLeft, Search } from 'lucide-react';
import { societyService } from '../../../services/societyService';
import { realtimeService } from '../../../services/realtimeService';
import { FileUpload } from '../../../components/ui/FileUpload';
import type { Staff, StaffType, DomesticWorker } from '../../../types/society';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { Form, FormField } from '../../../components/ui/Form';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';

export const StaffManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const currentSocietyId = 'soc-gvs';

  const [staff, setStaff] = useState<Staff[]>([]);
  const [domesticWorkers, setDomesticWorkers] = useState<DomesticWorker[]>([]);

  const [activeTab, setActiveTab] = useState<'STAFF' | 'DOMESTIC'>('STAFF');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);

  // New staff form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [staffType, setStaffType] = useState<StaffType>('GUARD');
  const [gateAssigned, setGateAssigned] = useState('Main Gate 1');
  const [shiftTiming] = useState('08:00 AM - 08:00 PM');
  const [staffDocUrl, setStaffDocUrl] = useState('');

  const refreshData = () => {
    setStaff(societyService.getStaff(currentSocietyId));
    setDomesticWorkers(societyService.getDomesticWorkers(currentSocietyId));
  };

  useEffect(() => {
    refreshData();

    const unsub = realtimeService.subscribe('*', (msg) => {
      if (['STAFF_DUTY_CHANGED', 'WORKER_ENTRY_EXIT', 'SOCIETY_SYNC'].includes(msg.topic)) {
        refreshData();
      }
    });

    return () => unsub();
  }, []);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    societyService.createStaff(
      {
        societyId: currentSocietyId,
        name,
        phone,
        staffType,
        gateAssigned,
        shiftTiming,
        status: 'ON_DUTY',
      },
      { id: 'sec-admin-1', name: 'Mayuri Udar', role: 'SOCIETY_ADMIN' }
    );

    refreshData();
    setIsAddStaffModalOpen(false);
    setName('');
    setPhone('');
  };

  const filteredStaff = staff.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.staffType.toLowerCase().includes(q) ||
      (s.gateAssigned && s.gateAssigned.toLowerCase().includes(q))
    );
  });

  const filteredDomestic = domesticWorkers.filter((dw) => {
    const q = searchQuery.toLowerCase();
    return (
      dw.name.toLowerCase().includes(q) ||
      dw.phone.includes(q) ||
      dw.workRole.toLowerCase().includes(q) ||
      dw.passCode.toLowerCase().includes(q)
    );
  });

  const staffColumns: Column<Staff>[] = [
    { key: 'name', header: 'Staff Member Name', sortable: true },
    { key: 'phone', header: 'Phone Number' },
    { key: 'staffType', header: 'Role' },
    { key: 'gateAssigned', header: 'Assigned Gate / Shift' },
    {
      key: 'status',
      header: 'Duty Status',
      render: (s) => (
        <StatusBadge
          label={s.status}
          variant={s.status === 'ON_DUTY' ? 'success' : 'neutral'}
        />
      ),
    },
  ];

  const domesticColumns: Column<DomesticWorker>[] = [
    { key: 'name', header: 'Worker Name', sortable: true },
    { key: 'phone', header: 'Phone' },
    { key: 'workRole', header: 'Service Role' },
    { key: 'passCode', header: 'Gate Passcode' },
    {
      key: 'status',
      header: 'Current Location',
      render: (dw) => (
        <StatusBadge
          label={dw.status === 'INSIDE' ? 'INSIDE COMPLEX' : 'OUTSIDE'}
          variant={dw.status === 'INSIDE' ? 'success' : 'neutral'}
        />
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100%', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: '2.5rem' }}>
      {/* ── Subheader Bar matching Residents, NGO & Child Safety tabs ── */}
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
              Security Guards &amp; Staff Roster
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Security personnel, facility technicians, and domestic helpers
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddStaffModalOpen(true)}
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
          <Plus size={15} /> Assign Staff
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
            placeholder={activeTab === 'STAFF' ? "Search staff name, phone, role, or gate..." : "Search worker name, phone, passcode, or role..."}
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

        {/* Tab Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'STAFF', label: `Facility Staff (${staff.length})`, icon: Users },
            { key: 'DOMESTIC', label: `Domestic Workers (${domesticWorkers.length})`, icon: Home },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
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
                <Icon size={14} color={isActive ? '#ffffff' : 'var(--aarizo-coral, #F06543)'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Count Heading ── */}
      <div className="max-w-7xl mx-auto w-full" style={{ padding: '0.5rem 1rem 0.25rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--aarizo-text-secondary, #657785)' }}>
          {activeTab === 'STAFF' ? filteredStaff.length : filteredDomestic.length} personnel records found
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
          {activeTab === 'STAFF' ? (
            <DataTable
              columns={staffColumns}
              data={filteredStaff}
              keyExtractor={(s) => s.id}
              pageSize={10}
              mobileRender={(s) => (
                <MobileDataCard
                  title={s.name}
                  subtitle={s.phone}
                  status={<StatusBadge label={s.status} variant={s.status === 'ON_DUTY' ? 'success' : 'neutral'} />}
                  attributes={[
                    { label: 'Role', value: s.staffType },
                    { label: 'Assigned', value: s.gateAssigned }
                  ]}
                />
              )}
            />
          ) : (
            <DataTable
              columns={domesticColumns}
              data={filteredDomestic}
              keyExtractor={(dw) => dw.id}
              pageSize={10}
              mobileRender={(dw) => (
                <MobileDataCard
                  title={dw.name}
                  subtitle={dw.phone}
                  status={<StatusBadge label={dw.status === 'INSIDE' ? 'INSIDE COMPLEX' : 'OUTSIDE'} variant={dw.status === 'INSIDE' ? 'success' : 'neutral'} />}
                  attributes={[
                    { label: 'Service Role', value: dw.workRole },
                    { label: 'Passcode', value: dw.passCode }
                  ]}
                />
              )}
            />
          )}
        </div>
      </div>

      {/* Modal: Assign Staff */}
      <Modal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
        title="Assign New Staff Member"
        maxWidth="540px"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <button
              type="button"
              onClick={() => setIsAddStaffModalOpen(false)}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Cancel
            </button>
            <button
              form="assign-staff-form"
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
                transition: 'all 0.15s ease',
              }}
            >
              Confirm Assignment
            </button>
          </div>
        }
      >
        <Form id="assign-staff-form" onSubmit={handleCreateStaff}>
          <div className="space-y-4">
            <FormField label="Staff Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B91]"
              />
            </FormField>
            <FormField label="Phone Number">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B91]"
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Role">
                <select
                  value={staffType}
                  onChange={(e) => setStaffType(e.target.value as StaffType)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#176B91]"
                >
                  <option value="GUARD">Security Guard</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="TECHNICIAN">Technician</option>
                </select>
              </FormField>
              <FormField label="Gate Assigned">
                <select
                  value={gateAssigned}
                  onChange={(e) => setGateAssigned(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#176B91]"
                >
                  <option value="Main Gate 1">Main Gate 1</option>
                  <option value="Main Gate 2">Main Gate 2</option>
                  <option value="Basement - A">Basement - A</option>
                </select>
              </FormField>
            </div>
            <div className="pt-2">
              <FileUpload
                category="kyc"
                label="Staff Govt ID / Police Verification Document (Optional)"
                onUploadSuccess={(url) => setStaffDocUrl(url)}
              />
              {staffDocUrl && (
                <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Verification Document Attached
                </p>
              )}
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
