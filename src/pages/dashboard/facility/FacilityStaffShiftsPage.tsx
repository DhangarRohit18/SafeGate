import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowLeft,
  Plus,
  Search,
  Phone,
  Building2,
} from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';
import { Modal } from '../../../components/ui/Modal';

export const FacilityStaffShiftsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState<string>('ALL');
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [staffRoster, setStaffRoster] = useState([
    { id: 'STF-101', name: 'Ramesh Patil', role: 'Electrician (Senior)', shift: 'MORNING', shiftTime: '06:00 - 14:00', tower: 'Tower A & B', status: 'ON_DUTY', phone: '+91 98234 11029' },
    { id: 'STF-102', name: 'Suresh Kumar', role: 'Plumber Lead', shift: 'MORNING', shiftTime: '06:00 - 14:00', tower: 'Central Plaza & Clubhouse', status: 'ON_DUTY', phone: '+91 98451 22930' },
    { id: 'STF-103', name: 'Sunita Devi', role: 'Sanitization Supervisor', shift: 'MORNING', shiftTime: '06:00 - 14:00', tower: 'Tower C & D', status: 'ON_DUTY', phone: '+91 98765 44912' },
    { id: 'STF-104', name: 'Vikas Shinde', role: 'Elevator Technician', shift: 'EVENING', shiftTime: '14:00 - 22:00', tower: 'All Towers (A-D)', status: 'STANDBY', phone: '+91 98192 88301' },
    { id: 'STF-105', name: 'Anil Jadhav', role: 'DG Generator Operator', shift: 'EVENING', shiftTime: '14:00 - 22:00', tower: 'DG Power Room', status: 'STANDBY', phone: '+91 98331 44029' },
    { id: 'STF-106', name: 'Prakash Thorat', role: 'Night Duty Supervisor', shift: 'NIGHT', shiftTime: '22:00 - 06:00', tower: 'Whole Premises', status: 'OFF_DUTY', phone: '+91 98670 11923' },
    { id: 'STF-107', name: 'Mahesh Gaikwad', role: 'Fire Safety Operator', shift: 'NIGHT', shiftTime: '22:00 - 06:00', tower: 'Fire Command Center', status: 'OFF_DUTY', phone: '+91 98200 99482' },
  ]);

  const [newStaffName, setNewStaffName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newShift, setNewShift] = useState<'MORNING' | 'EVENING' | 'NIGHT'>('MORNING');
  const [newTower, setNewTower] = useState('');

  const handleAssignShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newRole) return;

    const newEntry = {
      id: `STF-${Math.floor(100 + Math.random() * 900)}`,
      name: newStaffName,
      role: newRole,
      shift: newShift,
      shiftTime: newShift === 'MORNING' ? '06:00 - 14:00' : newShift === 'EVENING' ? '14:00 - 22:00' : '22:00 - 06:00',
      tower: newTower || 'All Towers',
      status: 'ON_DUTY',
      phone: '+91 98765 00000',
    };

    setStaffRoster([newEntry, ...staffRoster]);
    setShowAssignModal(false);
    setNewStaffName('');
    setNewRole('');
    setNewTower('');
  };

  const filteredStaff = staffRoster.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tower.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesShift = filterShift === 'ALL' || s.shift === filterShift;
    return matchesSearch && matchesShift;
  });

  const morningCount = staffRoster.filter((s) => s.shift === 'MORNING').length;
  const eveningCount = staffRoster.filter((s) => s.shift === 'EVENING').length;
  const nightCount = staffRoster.filter((s) => s.shift === 'NIGHT').length;

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
                Staff Duty Roster &amp; Shift Management
              </h1>
              <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
                Green Valley Society · Daily staff shift allocations, on-duty attendance, and tower assignments
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAssignModal(true)}
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
            <Plus size={15} /> Assign Staff Shift
          </button>
        </div>

        {/* 3 Shift Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <div
            onClick={() => setFilterShift('MORNING')}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: filterShift === 'MORNING' ? '2px solid #F06543' : '1px solid #DCE8EF',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{morningCount} Staff</div>
              <div style={{ fontSize: '0.75rem', color: '#083B56', fontWeight: 800 }}>Morning Shift</div>
              <div style={{ fontSize: '0.6875rem', color: '#657785' }}>06:00 AM – 02:00 PM</div>
            </div>
          </div>

          <div
            onClick={() => setFilterShift('EVENING')}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: filterShift === 'EVENING' ? '2px solid #F06543' : '1px solid #DCE8EF',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#EAF6FC', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0284C7', lineHeight: 1.1 }}>{eveningCount} Staff</div>
              <div style={{ fontSize: '0.75rem', color: '#083B56', fontWeight: 800 }}>Evening Shift</div>
              <div style={{ fontSize: '0.6875rem', color: '#657785' }}>02:00 PM – 10:00 PM</div>
            </div>
          </div>

          <div
            onClick={() => setFilterShift('NIGHT')}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: filterShift === 'NIGHT' ? '2px solid #F06543' : '1px solid #DCE8EF',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#F8FAFC', border: '1px solid #DCE8EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#083B56' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#083B56', lineHeight: 1.1 }}>{nightCount} Staff</div>
              <div style={{ fontSize: '0.75rem', color: '#083B56', fontWeight: 800 }}>Night Shift</div>
              <div style={{ fontSize: '0.6875rem', color: '#657785' }}>10:00 PM – 06:00 AM</div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'MORNING', 'EVENING', 'NIGHT'].map((s) => {
            const isActive = filterShift === s;
            return (
              <button
                key={s}
                onClick={() => setFilterShift(s)}
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
                <span>{s === 'ALL' ? 'All Shifts' : `${s} Shift`}</span>
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
            placeholder="Search staff name, designation, tower or staff ID..."
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

        {/* Staff Duty Table */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem', boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)' }}>
          <DataTable
            columns={[
              {
                key: 'name',
                header: 'Staff Name & Role',
                render: (s: any) => (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#083B56] text-white font-extrabold text-xs flex items-center justify-center">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-[#083B56] block">{s.name}</span>
                      <span className="text-xs text-slate-500 font-medium">{s.role}</span>
                    </div>
                  </div>
                ),
              },
              {
                key: 'shift',
                header: 'Shift & Hours',
                render: (s: any) => (
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-[#083B56] border border-slate-200">
                      {s.shift} SHIFT
                    </span>
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">{s.shiftTime}</span>
                  </div>
                ),
              },
              {
                key: 'tower',
                header: 'Assigned Tower / Location',
                render: (s: any) => (
                  <span className="text-xs font-bold text-[#083B56] flex items-center gap-1">
                    <Building2 size={13} className="text-[#F06543]" />
                    {s.tower}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Attendance Status',
                render: (s: any) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                    s.status === 'ON_DUTY' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    s.status === 'STANDBY' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {s.status === 'ON_DUTY' ? '● ON DUTY' : s.status}
                  </span>
                ),
              },
              {
                key: 'contact',
                header: 'Call / Action',
                render: (s: any) => (
                  <a
                    href={`tel:${s.phone}`}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#083B56] border border-slate-200 transition flex items-center gap-1 text-xs font-bold w-fit"
                  >
                    <Phone size={12} className="text-[#F06543]" />
                    <span>Call Staff</span>
                  </a>
                ),
              },
            ]}
            data={filteredStaff}
            keyExtractor={(s: any) => s.id}
            pageSize={10}
            mobileRender={(s: any) => (
              <MobileDataCard
                title={s.name}
                subtitle={`${s.role} • ${s.shift} Shift (${s.shiftTime})`}
                status={
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                    s.status === 'ON_DUTY' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.status}
                  </span>
                }
                attributes={[
                  { label: 'Role', value: s.role },
                  { label: 'Tower', value: s.tower },
                  { label: 'Hours', value: s.shiftTime },
                  { label: 'Phone', value: s.phone },
                ]}
              />
            )}
          />
        </div>
      </div>

      {/* Modal: Assign Staff Shift */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Staff Duty Shift">
        <form onSubmit={handleAssignShift} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Member Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Patil"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Designation</label>
            <input
              type="text"
              required
              placeholder="e.g. Lead Electrician / Plumber"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shift</label>
              <select
                value={newShift}
                onChange={(e) => setNewShift(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="MORNING">Morning (06:00 - 14:00)</option>
                <option value="EVENING">Evening (14:00 - 22:00)</option>
                <option value="NIGHT">Night (22:00 - 06:00)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tower / Block Assignment</label>
              <input
                type="text"
                placeholder="e.g. Tower A & B"
                value={newTower}
                onChange={(e) => setNewTower(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-semibold rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-[#F06543] text-white font-bold text-sm rounded-lg shadow-sm">
              Confirm Roster Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FacilityStaffShiftsPage;
