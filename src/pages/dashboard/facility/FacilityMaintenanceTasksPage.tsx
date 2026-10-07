import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Search,
} from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';
import { Modal } from '../../../components/ui/Modal';

export const FacilityMaintenanceTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New ticket state
  const [newTitle, setNewTitle] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [newDesc, setNewDesc] = useState('');

  const [maintenanceTasks, setMaintenanceTasks] = useState([
    { id: 'TKT-801', title: 'Elevator B2 Noise Inspection', assignedTo: 'Otis Elevator AMC', location: 'Tower B · Basement 2', priority: 'HIGH', status: 'IN_PROGRESS', date: '06 Oct 2026' },
    { id: 'TKT-802', title: 'Clubhouse AC Gas Refill & Filter Cleanup', assignedTo: 'CoolCare Servicing', location: 'Clubhouse Ground Floor', priority: 'MEDIUM', status: 'PENDING', date: '05 Oct 2026' },
    { id: 'TKT-803', title: 'Basement P2 Corridor Lighting Replacement', assignedTo: 'Suresh Kumar (Electrician)', location: 'Basement P2', priority: 'LOW', status: 'COMPLETED', date: '04 Oct 2026' },
    { id: 'TKT-804', title: 'Overhead Tank 3 Pressure Valve Check', assignedTo: 'WaterWorks Solutions', location: 'Tower A Terrace', priority: 'HIGH', status: 'PENDING', date: '04 Oct 2026' },
    { id: 'TKT-805', title: 'Main Gate Hydraulic Boom Barrier Servicing', assignedTo: 'SecureGate Technologies', location: 'Main Entrance Gate', priority: 'HIGH', status: 'IN_PROGRESS', date: '03 Oct 2026' },
    { id: 'TKT-806', title: 'DG Generator 2 Oil & Filter Replacement', assignedTo: 'Kirloskar AMC Engineers', location: 'DG Power Room', priority: 'MEDIUM', status: 'COMPLETED', date: '02 Oct 2026' },
    { id: 'TKT-807', title: 'Fire Hydrant Pressure Gauge Meter Calibration', assignedTo: 'Safeguard Fire AMC', location: 'Tower C Ground Floor', priority: 'LOW', status: 'COMPLETED', date: '01 Oct 2026' },
  ]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newLocation) return;

    const newTask = {
      id: `TKT-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle,
      assignedTo: newVendor || 'Unassigned / In-House Technician',
      location: newLocation,
      priority: newPriority,
      status: 'PENDING',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setMaintenanceTasks([newTask, ...maintenanceTasks]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewVendor('');
    setNewLocation('');
    setNewDesc('');
  };

  const filteredTasks = maintenanceTasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'ALL' || t.priority === filterPriority;
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const openCount = maintenanceTasks.filter((t) => t.status === 'PENDING').length;
  const inProgressCount = maintenanceTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = maintenanceTasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div style={{ background: '#F7FBFE', minHeight: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-44 space-y-4">
        
        {/* Header Card (Exact Light Coral & Navy Design System) */}
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
                Facility Maintenance &amp; Work Orders
              </h1>
              <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
                Green Valley Society · Equipment breakdowns, vendor tickets, and PM work order dispatches
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
            <Plus size={15} /> Log Work Order Ticket
          </button>
        </div>

        {/* 4 KPI Summary Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
          <div
            onClick={() => { setFilterStatus('ALL'); setFilterPriority('ALL'); }}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #DCE8EF',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#F8FAFC', border: '1px solid #DCE8EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#083B56' }}>
              <Wrench size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#083B56', lineHeight: 1.1 }}>{maintenanceTasks.length}</div>
              <div style={{ fontSize: '0.72rem', color: '#657785', fontWeight: 600 }}>Total Tickets</div>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('PENDING')}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: filterStatus === 'PENDING' ? '2px solid #F06543' : '1px solid #DCE8EF',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>{openCount}</div>
              <div style={{ fontSize: '0.72rem', color: '#657785', fontWeight: 600 }}>Open / Pending</div>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('IN_PROGRESS')}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: filterStatus === 'IN_PROGRESS' ? '2px solid #F06543' : '1px solid #DCE8EF',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#EAF6FC', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0284C7', lineHeight: 1.1 }}>{inProgressCount}</div>
              <div style={{ fontSize: '0.72rem', color: '#657785', fontWeight: 600 }}>In Progress</div>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('COMPLETED')}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: filterStatus === 'COMPLETED' ? '2px solid #F06543' : '1px solid #DCE8EF',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{completedCount}</div>
              <div style={{ fontSize: '0.72rem', color: '#657785', fontWeight: 600 }}>Completed</div>
            </div>
          </div>
        </div>

        {/* Priority Filter Pills Track */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => {
            const isActive = filterPriority === p;
            return (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
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
                <span>{p === 'ALL' ? 'All Priorities' : `${p} Priority`}</span>
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
            placeholder="Search by ticket title, vendor, equipment or location..."
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

        {/* Maintenance Tasks DataTable */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem', boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)' }}>
          <DataTable
            columns={[
              {
                key: 'id',
                header: 'Ticket ID',
                render: (t: any) => <span className="font-mono text-xs font-extrabold text-[#083B56]">{t.id}</span>,
              },
              {
                key: 'title',
                header: 'Task Title & Location',
                render: (t: any) => (
                  <div>
                    <span className="font-extrabold text-sm text-[#083B56] block">{t.title}</span>
                    <span className="text-xs text-slate-500 font-medium">{t.location}</span>
                  </div>
                ),
              },
              {
                key: 'assignedTo',
                header: 'Assigned Vendor / Tech',
                render: (t: any) => (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-xs text-[#083B56] border border-slate-200">
                    {t.assignedTo}
                  </span>
                ),
              },
              {
                key: 'priority',
                header: 'Priority',
                render: (t: any) => (
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                    t.priority === 'HIGH' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                    t.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {t.priority}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (t: any) => (
                  <StatusBadge
                    label={t.status}
                    variant={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'info' : 'warning'}
                  />
                ),
              },
            ]}
            data={filteredTasks}
            keyExtractor={(t: any) => t.id}
            pageSize={10}
            mobileRender={(t: any) => (
              <MobileDataCard
                title={`${t.id}: ${t.title}`}
                subtitle={`Assigned: ${t.assignedTo} • ${t.location}`}
                status={
                  <StatusBadge
                    label={t.status}
                    variant={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'info' : 'warning'}
                  />
                }
                attributes={[
                  { label: 'Location', value: t.location },
                  { label: 'Vendor', value: t.assignedTo },
                  { label: 'Priority', value: t.priority },
                  { label: 'Logged Date', value: t.date },
                ]}
              />
            )}
          />
        </div>
      </div>

      {/* Modal: Create Maintenance Work Order */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Log Facility Maintenance Work Order">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title / Equipment Issue</label>
            <input
              type="text"
              required
              placeholder="e.g. Elevator B2 Noise Inspection"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Vendor / Tech</label>
              <input
                type="text"
                placeholder="e.g. Otis Elevator AMC"
                value={newVendor}
                onChange={(e) => setNewVendor(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Tower</label>
              <input
                type="text"
                required
                placeholder="e.g. Tower B · Basement 2"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="HIGH">HIGH (Urgent Equipment Repair)</option>
              <option value="MEDIUM">MEDIUM (Standard Scheduled Service)</option>
              <option value="LOW">LOW (Minor Inspection & Cleanup)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Work Order Description</label>
            <textarea
              rows={3}
              placeholder="Brief details of inspection, required spare parts, or AMC service instructions..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-semibold rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-[#F06543] text-white font-bold text-sm rounded-lg shadow-sm">
              Dispatch Ticket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FacilityMaintenanceTasksPage;
