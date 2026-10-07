import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Plus,
  Search,
  ShieldCheck,
  FileText,
  Clock,
  Phone,
} from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';
import { Modal } from '../../../components/ui/Modal';

export const FacilityAMCContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [amcContracts, setAmcContracts] = useState([
    {
      id: 'AMC-01',
      title: 'Otis Gen2 Elevator Annual Maintenance',
      vendor: 'Otis Elevator India Pvt Ltd',
      category: 'ELEVATORS',
      costAnnual: 180000,
      slaHours: 2,
      expiryDate: '15 Dec 2026',
      status: 'ACTIVE',
      lastServiceDate: '15 Sept 2026',
      contactPhone: '+91 98201 44091',
    },
    {
      id: 'AMC-02',
      title: 'CoolCare VRV & Split AC Servicing',
      vendor: 'CoolCare HVAC Solutions',
      category: 'HVAC',
      costAnnual: 95000,
      slaHours: 4,
      expiryDate: '30 Nov 2026',
      status: 'ACTIVE',
      lastServiceDate: '01 Oct 2026',
      contactPhone: '+91 98450 11923',
    },
    {
      id: 'AMC-03',
      title: 'WaterWorks STP & Hydro-pneumatic System',
      vendor: 'WaterWorks Environmental Services',
      category: 'WATER',
      costAnnual: 140000,
      slaHours: 3,
      expiryDate: '20 Oct 2026',
      status: 'EXPIRING_SOON',
      lastServiceDate: '20 Sept 2026',
      contactPhone: '+91 98112 33490',
    },
    {
      id: 'AMC-04',
      title: 'Kirloskar DG Generator 250kVA AMC',
      vendor: 'Kirloskar Power Systems',
      category: 'GENERATORS',
      costAnnual: 110000,
      slaHours: 2,
      expiryDate: '10 Jan 2027',
      status: 'ACTIVE',
      lastServiceDate: '02 Oct 2026',
      contactPhone: '+91 98330 88201',
    },
    {
      id: 'AMC-05',
      title: 'Safeguard Fire Hydrant & Sprinkler Audit',
      vendor: 'Safeguard Fire Engineers',
      category: 'FIRE_SAFETY',
      costAnnual: 85000,
      slaHours: 2,
      expiryDate: '05 Mar 2027',
      status: 'ACTIVE',
      lastServiceDate: '01 Oct 2026',
      contactPhone: '+91 98920 77123',
    },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [newCategory, setNewCategory] = useState('ELEVATORS');
  const [newCost, setNewCost] = useState('');
  const [newExpiry, setNewExpiry] = useState('');

  const handleCreateAMC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newVendor) return;

    const newContract = {
      id: `AMC-0${amcContracts.length + 1}`,
      title: newTitle,
      vendor: newVendor,
      category: newCategory,
      costAnnual: Number(newCost) || 100000,
      slaHours: 4,
      expiryDate: newExpiry || '31 Dec 2026',
      status: 'ACTIVE',
      lastServiceDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      contactPhone: '+91 98000 00000',
    };

    setAmcContracts([newContract, ...amcContracts]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewVendor('');
    setNewCost('');
    setNewExpiry('');
  };

  const filteredContracts = amcContracts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ background: '#F7FBFE', minHeight: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-44 space-y-4">
        
        {/* Header Card */}
        <div
          style={{
            background: 'var(--aarizo-card-bg, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
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
              <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em' }}>
                AMC Contracts &amp; Vendor Asset Compliance
              </h1>
              <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
                Green Valley Society · Annual maintenance contracts, SLA response times, and renewal countdowns
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.5rem 0.875rem',
              borderRadius: '10px',
              background: 'var(--aarizo-coral, #F06543)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={15} /> Add AMC Contract
          </button>
        </div>

        {/* 4 Summary Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #DCE8EF', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{amcContracts.length}</div>
              <div style={{ fontSize: '0.72rem', color: '#657785', fontWeight: 600 }}>Active AMCs</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #DCE8EF', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>1</div>
              <div style={{ fontSize: '0.72rem', color: '#657785', fontWeight: 600 }}>Expiring Soon</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #DCE8EF', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#EAF6FC', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0284C7', lineHeight: 1.1 }}>2 Hours</div>
              <div style={{ fontSize: '0.72rem', color: '#657785', fontWeight: 600 }}>Avg SLA Response</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #DCE8EF', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#F8FAFC', border: '1px solid #DCE8EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#083B56' }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#083B56', lineHeight: 1.1 }}>₹6.10 L</div>
              <div style={{ fontSize: '0.72rem', color: '#657785', fontWeight: 600 }}>Annual AMC Budget</div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'ALL', label: 'All AMCs' },
            { key: 'ELEVATORS', label: 'Elevators & Lifts' },
            { key: 'HVAC', label: 'HVAC & AC' },
            { key: 'WATER', label: 'Water Systems' },
            { key: 'GENERATORS', label: 'Generators' },
            { key: 'FIRE_SAFETY', label: 'Fire Safety' },
          ].map((cat) => {
            const isActive = filterCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setFilterCategory(cat.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '12px',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  background: isActive ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
                  color: isActive ? '#ffffff' : '#083B56',
                  border: isActive ? '1px solid #F06543' : '1px solid #DCE8EF',
                  boxShadow: isActive ? '0 2px 8px rgba(240, 101, 67, 0.25)' : 'none',
                }}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div
          style={{
            position: 'relative',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #DCE8EF',
            padding: '0.6rem 0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 1px 3px rgba(8, 59, 86, 0.03)',
          }}
        >
          <Search size={18} style={{ color: '#083B56', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AMC contract name, vendor company or contract ID..."
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '0.8125rem',
              color: '#083B56',
              fontWeight: 500,
              background: 'transparent',
            }}
          />
        </div>

        {/* AMC Contracts Table */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem', boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)' }}>
          <DataTable
            columns={[
              {
                key: 'id',
                header: 'Contract ID',
                render: (c: any) => <span className="font-mono text-xs font-extrabold text-[#083B56]">{c.id}</span>,
              },
              {
                key: 'title',
                header: 'Equipment AMC & Vendor',
                render: (c: any) => (
                  <div>
                    <span className="font-extrabold text-sm text-[#083B56] block">{c.title}</span>
                    <span className="text-xs text-slate-500 font-medium">Vendor: {c.vendor}</span>
                  </div>
                ),
              },
              {
                key: 'costAnnual',
                header: 'Annual Cost',
                render: (c: any) => (
                  <span className="font-extrabold text-xs text-[#083B56]">
                    ₹{c.costAnnual.toLocaleString('en-IN')} / yr
                  </span>
                ),
              },
              {
                key: 'slaHours',
                header: 'SLA Response',
                render: (c: any) => (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200">
                    {c.slaHours} Hours SLA
                  </span>
                ),
              },
              {
                key: 'expiryDate',
                header: 'Contract Expiry',
                render: (c: any) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                    c.status === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-[#083B56] border border-slate-200'
                  }`}>
                    {c.expiryDate}
                  </span>
                ),
              },
              {
                key: 'action',
                header: 'Vendor Contact',
                render: (c: any) => (
                  <a
                    href={`tel:${c.contactPhone}`}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#083B56] border border-slate-200 transition flex items-center gap-1 text-xs font-bold w-fit"
                  >
                    <Phone size={12} className="text-[#F06543]" />
                    <span>Call Vendor</span>
                  </a>
                ),
              },
            ]}
            data={filteredContracts}
            keyExtractor={(c: any) => c.id}
            pageSize={10}
            mobileRender={(c: any) => (
              <MobileDataCard
                title={c.title}
                subtitle={`Vendor: ${c.vendor} • Expires: ${c.expiryDate}`}
                status={
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                    c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {c.status}
                  </span>
                }
                attributes={[
                  { label: 'Annual Cost', value: `₹${c.costAnnual.toLocaleString()}` },
                  { label: 'SLA', value: `${c.slaHours} Hours` },
                  { label: 'Last Service', value: c.lastServiceDate },
                  { label: 'Contact', value: c.contactPhone },
                ]}
              />
            )}
          />
        </div>
      </div>

      {/* Modal: Add AMC Contract */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add AMC Equipment Contract">
        <form onSubmit={handleCreateAMC} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Title / Asset</label>
            <input
              type="text"
              required
              placeholder="e.g. Otis Gen2 Elevator AMC"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Company Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Otis Elevator India Pvt Ltd"
              value={newVendor}
              onChange={(e) => setNewVendor(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="ELEVATORS">Elevators & Lifts</option>
                <option value="HVAC">HVAC & AC</option>
                <option value="WATER">Water STP / Hydro-Pneumatic</option>
                <option value="GENERATORS">Generators</option>
                <option value="FIRE_SAFETY">Fire & Safety Systems</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Cost (₹)</label>
              <input
                type="number"
                placeholder="150000"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Expiry Date</label>
            <input
              type="date"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-semibold rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-[#F06543] text-white font-bold text-sm rounded-lg shadow-sm">
              Register AMC Contract
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FacilityAMCContractsPage;
