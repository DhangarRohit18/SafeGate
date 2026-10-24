import React, { useState } from 'react';
import { ArrowLeft, Search, Heart, Eye, MapPin, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../components/ui/Modal';

export interface NGOItem {
  id: string;
  name: string;
  causeCategory: 'EDUCATION' | 'FOOD_DRIVE' | 'ANIMAL_WELFARE' | 'BLOOD_DONATION' | 'CLOTHES_DRIVE';
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'PARTNER';
  activeDriveTitle?: string;
  description: string;
}

const INITIAL_NGOS: NGOItem[] = [
  {
    id: 'ngo-1',
    name: 'Goonj Social Foundation',
    causeCategory: 'CLOTHES_DRIVE',
    contactPerson: 'Meera Deshmukh',
    phone: '9820011223',
    email: 'contact@goonj.org',
    location: 'Bandra West, Mumbai',
    verificationStatus: 'VERIFIED',
    activeDriveTitle: 'Monsoon Warmth & Clothes Collection Drive',
    description: 'Collecting unused wearable clothes, blankets, and school kits for rural communities.'
  },
  {
    id: 'ngo-2',
    name: 'Akshaya Patra Foundation',
    causeCategory: 'FOOD_DRIVE',
    contactPerson: 'Rajesh Kulkarni',
    phone: '9819933445',
    email: 'connect@akshayapatra.org',
    location: 'Andheri East, Mumbai',
    verificationStatus: 'PARTNER',
    activeDriveTitle: 'Society Zero Hunger Weekend Meal Box Drive',
    description: 'Providing freshly cooked nutritious meals to underprivileged school children.'
  },
  {
    id: 'ngo-3',
    name: 'Pratham Education Foundation',
    causeCategory: 'EDUCATION',
    contactPerson: 'Ananya Roy',
    phone: '9876543210',
    email: 'info@pratham.org',
    location: 'Powai, Mumbai',
    verificationStatus: 'VERIFIED',
    activeDriveTitle: 'Adopt a Child Scholar Book Drive 2026',
    description: 'Distributing notebooks, stationery, and digital tablets to slum school students.'
  },
  {
    id: 'ngo-4',
    name: 'Resqink Animals Sanctuary',
    causeCategory: 'ANIMAL_WELFARE',
    contactPerson: 'Karan Sharma',
    phone: '9833355667',
    email: 'help@resqink.org',
    location: 'Thane West',
    verificationStatus: 'VERIFIED',
    activeDriveTitle: 'Stray Dogs & Cats Anti-Rabies Vaccination',
    description: 'Rescue, medical care, and vaccination drive for society & street animals.'
  },
  {
    id: 'ngo-5',
    name: 'Red Cross Society India',
    causeCategory: 'BLOOD_DONATION',
    contactPerson: 'Dr. Suresh Patil',
    phone: '9821098765',
    email: 'bloodcamp@redcross.org',
    location: 'Fort, Mumbai',
    verificationStatus: 'VERIFIED',
    activeDriveTitle: 'Annual Society Mega Blood Donation Camp',
    description: 'Voluntary blood donation camp in society clubhouse with verified doctor team.'
  }
];

export const AdminNGOManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [ngos, setNgos] = useState<NGOItem[]>(INITIAL_NGOS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedNGO, setSelectedNGO] = useState<NGOItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New NGO Form
  const [newNGO, setNewNGO] = useState<{
    name: string;
    causeCategory: NGOItem['causeCategory'];
    contactPerson: string;
    phone: string;
    email: string;
    location: string;
    activeDriveTitle: string;
    description: string;
  }>({
    name: '',
    causeCategory: 'CLOTHES_DRIVE',
    contactPerson: '',
    phone: '',
    email: '',
    location: '',
    activeDriveTitle: '',
    description: ''
  });

  const handleAddNGO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNGO.name || !newNGO.contactPerson) return;

    const item: NGOItem = {
      id: `ngo-${Date.now()}`,
      ...newNGO,
      verificationStatus: 'VERIFIED'
    };

    setNgos([item, ...ngos]);
    setShowAddModal(false);
    setNewNGO({
      name: '',
      causeCategory: 'CLOTHES_DRIVE',
      contactPerson: '',
      phone: '',
      email: '',
      location: '',
      activeDriveTitle: '',
      description: ''
    });
  };

  const filteredNGOs = ngos.filter((n) => {
    const matchesCategory = selectedCategory === 'ALL' || n.causeCategory === selectedCategory;
    const matchesSearch =
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.activeDriveTitle && n.activeDriveTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100%', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: '2rem' }}>
      {/* ── Subheader with Back Button & Breadcrumbs ── */}
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
              NGOs &amp; Charity Drives
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0 }}>
              Green Valley Society · {ngos.length} partner NGOs &amp; active community causes
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
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
            boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)'
          }}
        >
          <Plus size={15} /> Add NGO Partner
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
            placeholder="Search by NGO name, cause, drive title, or location..."
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

        {/* Cause Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'ALL', label: 'All Causes' },
            { key: 'CLOTHES_DRIVE', label: 'Clothes Drive' },
            { key: 'FOOD_DRIVE', label: 'Food Drive' },
            { key: 'EDUCATION', label: 'Education' },
            { key: 'ANIMAL_WELFARE', label: 'Animal Welfare' },
            { key: 'BLOOD_DONATION', label: 'Blood Donation' }
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: selectedCategory === cat.key ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
                border: '1px solid var(--aarizo-border, #DCE8EF)',
                borderRadius: '10px',
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: selectedCategory === cat.key ? '#ffffff' : 'var(--aarizo-text, #203746)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Heart size={14} color={selectedCategory === cat.key ? '#ffffff' : 'var(--aarizo-coral, #F06543)'} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Count Heading ── */}
      <div className="max-w-7xl mx-auto w-full" style={{ padding: '0.5rem 1rem 0.25rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--aarizo-text-secondary, #657785)' }}>
          {filteredNGOs.length} NGOs &amp; charity drives found
        </span>
      </div>

      {/* ── NGO Cards (Responsive Grid on Desktop, Clean Minimal Cards) ── */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3 sm:p-4">
        {filteredNGOs.map((ngo) => (
          <div
            key={ngo.id}
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
              borderRadius: '16px',
              padding: '0.875rem 1rem',
              boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.625rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Initial Avatar Circle */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--aarizo-pale-blue, #F4FAFE)',
                    border: '1px solid var(--aarizo-border, #DCE8EF)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--aarizo-coral, #F06543)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                >
                  {ngo.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--aarizo-text, #203746)' }}>
                    {ngo.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', marginTop: '0.125rem' }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: 3 }} /> {ngo.location}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)' }}>
                    👤 {ngo.contactPerson} · 📞 {ngo.phone}
                  </div>
                </div>
              </div>

              {/* Verification Badge & View Button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    color: '#059669',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {ngo.verificationStatus}
                </span>

                <button
                  onClick={() => setSelectedNGO(ngo)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    background: 'var(--aarizo-light-blue, #EAF6FC)',
                    border: '1px solid var(--aarizo-border, #DCE8EF)',
                    color: 'var(--aarizo-navy, #083B56)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  <Eye size={13} color="var(--aarizo-blue, #176B91)" />
                  <span>View</span>
                </button>
              </div>
            </div>

            {/* Active Drive Snippet Banner */}
            {ngo.activeDriveTitle && (
              <div
                style={{
                  background: '#FFF8F6',
                  border: '1px solid #FDE8E2',
                  borderRadius: '10px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.71875rem',
                  color: '#C2410C',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Sparkles size={13} color="var(--aarizo-coral, #F06543)" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ngo.activeDriveTitle}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* NGO Detail Modal */}
      {selectedNGO && (
        <Modal
          isOpen={!!selectedNGO}
          onClose={() => setSelectedNGO(null)}
          title={`NGO Profile: ${selectedNGO.name}`}
          maxWidth="500px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="button"
                onClick={() => setSelectedNGO(null)}
                style={{
                  padding: '0.625rem 1.25rem',
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
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-slate-800">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Cause Category</span>
                <span className="font-bold text-[#F06543]">{selectedNGO.causeCategory.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Contact Person</span>
                <span className="font-bold text-slate-800">{selectedNGO.contactPerson}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Phone Number</span>
                <span className="font-bold text-slate-800">{selectedNGO.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Email Address</span>
                <span className="font-bold text-slate-800">{selectedNGO.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Headquarters</span>
                <span className="font-bold text-slate-800">{selectedNGO.location}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">About NGO</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedNGO.description}</p>
            </div>

            {selectedNGO.activeDriveTitle && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                <span className="font-bold block mb-0.5">Active Society Charity Drive:</span>
                <p className="font-medium">{selectedNGO.activeDriveTitle}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add NGO Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add NGO Partner / Drive"
        maxWidth="540px"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
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
              form="add-ngo-form"
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
              }}
            >
              Save NGO Partner
            </button>
          </div>
        }
      >
        <form id="add-ngo-form" onSubmit={handleAddNGO} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">NGO Organization Name</label>
            <input
              type="text"
              required
              placeholder="e.g. HelpAge India"
              value={newNGO.name}
              onChange={(e) => setNewNGO({ ...newNGO, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cause Category</label>
              <select
                value={newNGO.causeCategory}
                onChange={(e) => setNewNGO({ ...newNGO, causeCategory: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              >
                <option value="CLOTHES_DRIVE">Clothes Drive</option>
                <option value="FOOD_DRIVE">Food Drive</option>
                <option value="EDUCATION">Education</option>
                <option value="ANIMAL_WELFARE">Animal Welfare</option>
                <option value="BLOOD_DONATION">Blood Donation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                required
                placeholder="e.g. Meera Deshmukh"
                value={newNGO.contactPerson}
                onChange={(e) => setNewNGO({ ...newNGO, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                placeholder="9820011223"
                value={newNGO.phone}
                onChange={(e) => setNewNGO({ ...newNGO, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. Bandra West, Mumbai"
                value={newNGO.location}
                onChange={(e) => setNewNGO({ ...newNGO, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Active Drive Title</label>
            <input
              type="text"
              placeholder="e.g. Blanket & Winter Clothes Drive"
              value={newNGO.activeDriveTitle}
              onChange={(e) => setNewNGO({ ...newNGO, activeDriveTitle: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Brief details of NGO mission & drive..."
              value={newNGO.description}
              onChange={(e) => setNewNGO({ ...newNGO, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-xs"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminNGOManagementPage;
