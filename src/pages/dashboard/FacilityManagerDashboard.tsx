import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Calendar,
  Zap,
  UserCheck,
  ArrowLeft,
  ShieldCheck,
  Search,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { MobileDataCard } from '../../components/ui/MobileDataCard';

export const FacilityManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  const maintenanceTasks = [
    { id: 'TKT-801', title: 'Elevator B2 Noise Inspection', assignedTo: 'Otis Elevator AMC', location: 'Tower B · Basement 2', priority: 'HIGH', status: 'IN_PROGRESS' },
    { id: 'TKT-802', title: 'Clubhouse AC Gas Refill & Filter Cleanup', assignedTo: 'CoolCare Servicing', location: 'Clubhouse Ground Floor', priority: 'MEDIUM', status: 'PENDING' },
    { id: 'TKT-803', title: 'Basement P2 Corridor Lighting Replacement', assignedTo: 'Suresh Kumar (Electrician)', location: 'Basement P2', priority: 'LOW', status: 'COMPLETED' },
    { id: 'TKT-804', title: 'Overhead Tank 3 Pressure Valve Check', assignedTo: 'WaterWorks Solutions', location: 'Tower A Terrace', priority: 'HIGH', status: 'PENDING' },
  ];

  const filteredTasks = maintenanceTasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'ALL' || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div style={{ background: 'var(--aarizo-page, #F7FBFE)', minHeight: '100vh', paddingBottom: '5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* ── Subheader Bar ── */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #DCE8EF', padding: '0.85rem 1.25rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
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
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#083B56', letterSpacing: '-0.01em' }}>
                  Facility Operations Manager
                </h1>
                <span
                  style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#059669',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                  FM Operations Active
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#657785', fontWeight: 500 }}>
                Facilities, maintenance &amp; utility operations
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => navigate('/facility/maintenance')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                background: '#F06543',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
              }}
            >
              <Plus size={16} />
              <span>Create Ticket</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '1.25rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* ── Metric Overview Cards (Normalized 4-Card Equal Grid) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wrench size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#657785', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Open Tickets</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', letterSpacing: '-0.02em', marginTop: '2px' }}>7</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#657785', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Staff On Duty</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em', marginTop: '2px' }}>18 / 20</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F4FAFE', border: '1px solid #BAE6FD', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#657785', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active AMCs</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284C7', letterSpacing: '-0.02em', marginTop: '2px' }}>12</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F4FAFE', border: '1px solid #DCE8EF', color: '#083B56', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#657785', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Utility Health</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#083B56', letterSpacing: '-0.02em', marginTop: '2px' }}>NORMAL</div>
            </div>
          </div>
        </div>

        {/* ── Assigned Maintenance Tasks Card ── */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#083B56' }}>Assigned Maintenance Tasks</h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#657785', fontWeight: 500 }}>
                Track equipment service, breakdown tickets &amp; vendor assignments
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search task or vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem 0.55rem 2.2rem',
                    borderRadius: '10px',
                    border: '1px solid #DCE8EF',
                    fontSize: '0.82rem',
                    outline: 'none',
                    background: '#F8FAFC',
                    color: '#083B56',
                    fontWeight: 600,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid #DCE8EF',
                  fontSize: '0.82rem',
                  background: '#ffffff',
                  color: '#083B56',
                  fontWeight: 700,
                  outline: 'none',
                }}
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          <DataTable
            columns={[
              { key: 'id', header: 'Task ID', width: '100px', render: (t) => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#083B56' }}>#{t.id}</span> },
              {
                key: 'title',
                header: 'Task & Location',
                render: (t) => (
                  <div>
                    <div style={{ fontWeight: 800, color: '#083B56', fontSize: '0.88rem' }}>{t.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#657785', fontWeight: 500 }}>{t.location}</div>
                  </div>
                ),
              },
              { key: 'assignedTo', header: 'Assigned Vendor / Staff', render: (t) => <span style={{ fontWeight: 700, color: '#083B56', fontSize: '0.82rem' }}>{t.assignedTo}</span> },
              {
                key: 'priority',
                header: 'Priority',
                render: (t) => (
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: t.priority === 'HIGH' ? '#FEF2F2' : t.priority === 'MEDIUM' ? '#FFFBEB' : '#F1F5F9',
                      color: t.priority === 'HIGH' ? '#DC2626' : t.priority === 'MEDIUM' ? '#D97706' : '#475569',
                    }}
                  >
                    {t.priority}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (t) => (
                  <StatusBadge
                    label={t.status}
                    variant={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'warning' : 'info'}
                  />
                ),
              },
            ]}
            data={filteredTasks}
            keyExtractor={(t) => t.id}
            mobileRender={(t) => (
              <MobileDataCard
                title={`${t.title} (#${t.id})`}
                subtitle={`Vendor: ${t.assignedTo} • ${t.location}`}
                status={
                  <StatusBadge
                    label={t.status}
                    variant={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'warning' : 'info'}
                  />
                }
                attributes={[
                  { label: 'Priority', value: t.priority },
                ]}
              />
            )}
          />
        </div>

        {/* ── Operations Summaries (AMC & Utility Operations Health) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#083B56', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#059669" /> Vendor AMC Status Summary
              </h3>
              <button
                onClick={() => navigate('/facility/amc')}
                style={{ background: 'none', border: 'none', color: '#176B91', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                { vendor: 'Otis Elevators', service: 'Elevator Maintenance', status: 'ACTIVE', renewDate: 'Dec 2026' },
                { vendor: 'CoolCare Servicing', service: 'Clubhouse HVAC', status: 'ACTIVE', renewDate: 'Oct 2026' },
                { vendor: 'Kirloskar Generators', service: 'DG Set Maintenance', status: 'RENEWAL DUE', renewDate: 'Next Week' },
              ].map((amc, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#083B56' }}>{amc.vendor}</div>
                    <div style={{ fontSize: '0.75rem', color: '#657785' }}>{amc.service} • Due: {amc.renewDate}</div>
                  </div>
                  <StatusBadge variant={amc.status === 'ACTIVE' ? 'success' : 'warning'} label={amc.status} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#083B56', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={16} color="#0284C7" /> Utility Operations Health
              </h3>
              <button
                onClick={() => navigate('/facility/utilities')}
                style={{ background: 'none', border: 'none', color: '#176B91', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                { utility: 'Electricity Grid & DG Backup', level: '100% Operational', note: 'Auto-switch test passed today' },
                { utility: 'Overhead Water Tanks', level: '85% Capacity', note: 'Filtration pumps running normally' },
                { utility: 'Pipelined Natural Gas (PNG)', level: 'Normal Pressure', note: 'Zero leakages detected' },
              ].map((u, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#083B56' }}>{u.utility}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px' }}>{u.level}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#657785' }}>{u.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityManagerDashboard;
