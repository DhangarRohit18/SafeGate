import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Power, ArrowLeft, Search } from 'lucide-react';
import { societyService } from '../../../services/societyService';
import type { Society, SubscriptionTier } from '../../../types/society';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { Form, FormField } from '../../../components/ui/Form';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';

export const SuperAdminSocietiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [societies, setSocieties] = useState<Society[]>(societyService.getSocieties());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmStatusModal, setConfirmStatusModal] = useState<{ open: boolean; society?: Society; newStatus?: Society['status'] }>({ open: false });

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('400001');
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('PRO');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const refreshData = () => {
    setSocieties(societyService.getSocieties());
  };

  const handleCreateSociety = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    societyService.createSociety(
      {
        name,
        code,
        address,
        city,
        state,
        pincode,
        status: 'ACTIVE',
        subscriptionTier,
        adminName: adminName || 'Assigned Admin',
        adminEmail: adminEmail || 'admin@society.org',
      },
      { id: 'super-admin-1', name: 'System Super Admin', role: 'SUPER_ADMIN' }
    );

    refreshData();
    setIsAddModalOpen(false);
    setName('');
    setCode('');
    setAddress('');
    setAdminName('');
    setAdminEmail('');
  };

  const handleToggleStatus = () => {
    if (!confirmStatusModal.society || !confirmStatusModal.newStatus) return;
    societyService.updateSocietyStatus(
      confirmStatusModal.society.id,
      confirmStatusModal.newStatus,
      { id: 'super-admin-1', name: 'System Super Admin', role: 'SUPER_ADMIN' }
    );
    refreshData();
  };

  const filteredSocieties = societies.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<Society>[] = [
    { key: 'code', header: 'Society Code', width: '110px' },
    {
      key: 'name',
      header: 'Society Name',
      sortable: true,
      render: (s) => (
        <div>
          <div style={{ fontWeight: 800, color: '#083B56' }}>{s.name}</div>
          <div style={{ fontSize: '0.78rem', color: '#52788D' }}>{s.address}, {s.city}</div>
        </div>
      ),
    },
    {
      key: 'adminName',
      header: 'Assigned Admin',
      render: (s) => (
        <div>
          <div style={{ fontWeight: 700, color: '#083B56' }}>{s.adminName || 'Unassigned'}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{s.adminEmail}</div>
        </div>
      ),
    },
    {
      key: 'subscriptionTier',
      header: 'Subscription',
      render: (s) => (
        <StatusBadge
          label={s.subscriptionTier}
          variant={s.subscriptionTier === 'ENTERPRISE' ? 'purple' : s.subscriptionTier === 'PRO' ? 'info' : 'neutral'}
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <StatusBadge
          label={s.status}
          variant={s.status === 'ACTIVE' ? 'success' : s.status === 'SUSPENDED' ? 'danger' : 'warning'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <button
          onClick={() => setConfirmStatusModal({ open: true, society: s, newStatus: s.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
          style={{
            padding: '0.4rem 0.75rem',
            border: 'none',
            borderRadius: '8px',
            background: s.status === 'ACTIVE' ? '#FEF2F2' : '#ECFDF5',
            color: s.status === 'ACTIVE' ? '#DC2626' : '#059669',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title={s.status === 'ACTIVE' ? 'Suspend Society' : 'Activate Society'}
        >
          <Power size={14} /> {s.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
        </button>
      ),
    },
  ];

  return (
    <div style={{ background: 'var(--aarizo-page, #F7FBFE)', minHeight: '100vh', paddingBottom: '5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Header Bar */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #DCE8EF', padding: '0.85rem 1.25rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#F4FAFE',
                border: '1px solid #DCE8EF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#083B56',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#083B56' }}>
                  Multi-Society Directory
                </h1>
                <span
                  style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#059669',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                  System Admin Active
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#52788D' }}>
                Provision and manage society accounts, subscription tiers, and assigned administrators
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: '0.65rem 1.25rem',
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
            <Plus size={18} /> Add New Society
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '1.25rem auto', padding: '0 1rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#083B56' }}>All Society Directory</h2>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search society, code, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.1rem',
                  borderRadius: '8px',
                  border: '1px solid #DCE8EF',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: '#F8FAFC',
                  color: '#083B56',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredSocieties}
            keyExtractor={(s) => s.id}
            mobileRender={(s) => (
              <MobileDataCard
                title={`${s.name} (${s.code})`}
                subtitle={`${s.address}, ${s.city}`}
                status={
                  <StatusBadge
                    label={s.status}
                    variant={s.status === 'ACTIVE' ? 'success' : s.status === 'SUSPENDED' ? 'danger' : 'warning'}
                  />
                }
                attributes={[
                  { label: 'Subscription', value: s.subscriptionTier },
                  { label: 'Admin', value: `${s.adminName || 'N/A'} (${s.adminEmail})` },
                ]}
                actions={
                  <button
                    onClick={() => setConfirmStatusModal({ open: true, society: s, newStatus: s.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: s.status === 'ACTIVE' ? '#FEF2F2' : '#ECFDF5',
                      color: s.status === 'ACTIVE' ? '#DC2626' : '#059669',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {s.status === 'ACTIVE' ? 'Suspend Society' : 'Activate Society'}
                  </button>
                }
              />
            )}
          />
        </div>
      </div>

      {/* Add Society Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Provision New Society Account">
        <Form onSubmit={handleCreateSociety}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <FormField label="Society Name" required>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Skyline Residency"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </FormField>
              <FormField label="Society Code" required>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SKL-01"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </FormField>
            </div>

            <FormField label="Street Address" required>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Plot 15, Sector 4, Vashi"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <FormField label="City">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </FormField>
              <FormField label="State">
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </FormField>
              <FormField label="Pincode">
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <FormField label="Subscription Tier">
                <select
                  value={subscriptionTier}
                  onChange={(e) => setSubscriptionTier(e.target.value as SubscriptionTier)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                >
                  <option value="BASIC">Basic (Up to 100 flats)</option>
                  <option value="PRO">Pro (Up to 300 flats)</option>
                  <option value="ENTERPRISE">Enterprise (Unlimited)</option>
                </select>
              </FormField>
              <FormField label="Assigned Admin Name">
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </FormField>
            </div>

            <FormField label="Assigned Admin Email">
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="e.g. admin@skylineresidency.org"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ padding: '0.65rem 1.25rem', border: '1px solid #CBD5E1', background: '#ffffff', color: '#52788D', fontWeight: 700, borderRadius: '10px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '0.65rem 1.4rem', background: '#F06543', color: '#ffffff', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 3px 12px rgba(240, 101, 67, 0.28)' }}
              >
                Create Society
              </button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Confirm Status Change Dialog */}
      <ConfirmDialog
        isOpen={confirmStatusModal.open}
        onClose={() => setConfirmStatusModal({ open: false })}
        onConfirm={handleToggleStatus}
        title={`${confirmStatusModal.newStatus === 'ACTIVE' ? 'Activate' : 'Suspend'} Society`}
        message={`Are you sure you want to change status of ${confirmStatusModal.society?.name} to ${confirmStatusModal.newStatus}?`}
        variant={confirmStatusModal.newStatus === 'SUSPENDED' ? 'danger' : 'info'}
      />
    </div>
  );
};
