import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Shield,
  Users,
  Server,
  Plus,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Form, FormField } from '../../components/ui/Form';
import { MobileDataCard } from '../../components/ui/MobileDataCard';

interface SocietyRecord {
  id: string;
  name: string;
  location: string;
  totalFlats: number;
  activeResidents: number;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
}

const INITIAL_SOCIETIES: SocietyRecord[] = [
  { id: 'soc-1', name: 'Green Valley Society', location: 'Bandra West, Mumbai', totalFlats: 240, activeResidents: 218, status: 'ACTIVE' },
  { id: 'soc-2', name: 'Royal Palms Residency', location: 'Powai, Mumbai', totalFlats: 500, activeResidents: 480, status: 'ACTIVE' },
  { id: 'soc-3', name: 'Sunset Heights RWA', location: 'Whitefield, Bengaluru', totalFlats: 120, activeResidents: 105, status: 'ACTIVE' },
];

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [societies, setSocieties] = useState<SocietyRecord[]>(INITIAL_SOCIETIES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newSocietyName, setNewSocietyName] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const handleAddSociety = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocietyName) return;
    const newSoc: SocietyRecord = {
      id: `soc-${Date.now()}`,
      name: newSocietyName,
      location: newLocation || 'Mumbai, MH',
      totalFlats: 100,
      activeResidents: 1,
      status: 'ACTIVE',
    };
    setSocieties([newSoc, ...societies]);
    setIsAddModalOpen(false);
    setNewSocietyName('');
    setNewLocation('');
  };

  const filteredSocieties = societies.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalResidentsCount = societies.reduce((acc, curr) => acc + curr.activeResidents, 0);

  const columns: Column<SocietyRecord>[] = [
    {
      key: 'name',
      header: 'Society Name',
      sortable: true,
      render: (soc) => <span style={{ fontWeight: 800, color: '#083B56' }}>{soc.name}</span>,
    },
    { key: 'location', header: 'Location' },
    { key: 'totalFlats', header: 'Total Flats', sortable: true },
    { key: 'activeResidents', header: 'Active Residents', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (soc) => (
        <StatusBadge
          label={soc.status}
          variant={soc.status === 'ACTIVE' ? 'success' : 'warning'}
        />
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
                  Super Admin Portal
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
                  Platform Systems Active
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#52788D' }}>
                Multi-tenant society management, provisioning &amp; system health
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
            <Plus size={18} /> New Society
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '1.25rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F4FAFE', border: '1px solid #DCE8EF', color: '#083B56', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Provisioned Societies</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#083B56' }}>{societies.length}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Platform Residents</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{totalResidentsCount}</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F4FAFE', border: '1px solid #BAE6FD', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>System Uptime</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284C7' }}>99.9%</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>Monthly Active Users</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>641</div>
            </div>
          </div>
        </div>

        {/* Platform Health Quick Strip */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #DCE8EF',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F4FAFE', border: '1px solid #DCE8EF', color: '#083B56', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 800, color: '#083B56', fontSize: '0.95rem' }}>Platform Health: Excellent</h3>
              <p style={{ margin: '0.2rem 0 0', color: '#52788D', fontSize: '0.8rem' }}>All systems operational · Last incident: 14 days ago</p>
            </div>
          </div>
          <span
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: '#ECFDF5',
              color: '#059669',
              border: '1px solid #A7F3D0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CheckCircle2 size={14} /> OPERATIONAL
          </span>
        </div>

        {/* Societies Directory Card */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontWeight: 800, color: '#083B56', fontSize: '1.05rem' }}>Registered Societies Directory</h3>
              <p style={{ margin: '0.2rem 0 0', color: '#52788D', fontSize: '0.8rem' }}>Manage society instances, flat counts, and resident subscriptions</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search society or city..."
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
              <span style={{ padding: '0.35rem 0.75rem', background: '#F4FAFE', border: '1px solid #DCE8EF', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#083B56', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={13} color="#083B56" /> 0 Pending
              </span>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredSocieties}
            keyExtractor={(s) => s.id}
            mobileRender={(s) => (
              <MobileDataCard
                title={s.name}
                subtitle={s.location}
                status={
                  <StatusBadge
                    label={s.status}
                    variant={s.status === 'ACTIVE' ? 'success' : 'warning'}
                  />
                }
                attributes={[
                  { label: 'Total Flats', value: String(s.totalFlats) },
                  { label: 'Active Residents', value: String(s.activeResidents) },
                ]}
              />
            )}
          />
        </div>
      </div>

      {/* Provision New Society Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Provision New Society">
        <Form onSubmit={handleAddSociety}>
          <FormField label="Society Name" required>
            <input
              type="text"
              required
              value={newSocietyName}
              onChange={(e) => setNewSocietyName(e.target.value)}
              placeholder="e.g. Skyline Towers RWA"
              style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
            />
          </FormField>
          <FormField label="City / Location" required>
            <input
              type="text"
              required
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="e.g. Pune, MH"
              style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
            />
          </FormField>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#ffffff', fontWeight: 700, cursor: 'pointer', color: '#52788D' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: 'none', background: '#F06543', color: '#ffffff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 12px rgba(240, 101, 67, 0.28)' }}
            >
              Provision Society
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;
