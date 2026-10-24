import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { housekeepingService } from '../../../services/housekeepingService';
import { realtimeService } from '../../../services/realtimeService';
import type { HousekeepingTask, CommonAreaCategory, GarbagePickupLog } from '../../../types/housekeeping';
import { Modal } from '../../../components/ui/Modal';
import { DataTable } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  CheckSquare,
  Plus,
  ArrowLeft,
  Search,
  Eye,
  MapPin
} from 'lucide-react';

const COMMON_AREA_CATEGORIES: CommonAreaCategory[] = [
  'GARBAGE',
  'SWIMMING_POOL',
  'STAIRCASE',
  'LOBBY',
  'GARDEN',
  'GYM',
  'CLUBHOUSE',
  'PARKING',
  'CORRIDORS'
];

export const AdminHousekeepingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const societyId = (currentUser as any)?.societyId || 'soc-1';
  const adminName = currentUser?.name || 'Society Admin';

  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [garbageLogs, setGarbageLogs] = useState<GarbagePickupLog[]>([]);
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'MISSED_LATE' | 'GARBAGE' | 'COMPLETED'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    category: 'SWIMMING_POOL' as CommonAreaCategory,
    areaLocation: '',
    tower: '',
    floor: '',
    scheduledDate: new Date().toISOString().substring(0, 10),
    startTime: '08:00',
    endTime: '10:00',
    assignedStaffName: 'Sunil Housekeeper',
    checklistText: 'Test water pH level\nClean skimmer baskets\nSweep & mop floor'
  });

  useEffect(() => {
    loadData();

    const unsub = realtimeService.subscribe('*', (msg) => {
      if (['HOUSEKEEPING_TASK_CREATED', 'TASK_COMPLETED', 'SOCIETY_SYNC'].includes(msg.topic)) {
        loadData();
      }
    });

    return () => unsub();
  }, [societyId]);

  const loadData = () => {
    setTasks(housekeepingService.getTasks(societyId));
    setGarbageLogs(housekeepingService.getGarbagePickupLogs(societyId));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.areaLocation) return;

    const checklistLabels = taskForm.checklistText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    housekeepingService.createTask(
      societyId,
      taskForm.title,
      taskForm.category,
      taskForm.areaLocation,
      taskForm.scheduledDate,
      taskForm.startTime,
      taskForm.endTime,
      `staff-${Date.now()}`,
      taskForm.assignedStaffName,
      checklistLabels,
      taskForm.tower,
      taskForm.floor
    );

    setShowCreateModal(false);
    setTaskForm({
      title: '',
      category: 'SWIMMING_POOL',
      areaLocation: '',
      tower: '',
      floor: '',
      scheduledDate: new Date().toISOString().substring(0, 10),
      startTime: '08:00',
      endTime: '10:00',
      assignedStaffName: 'Sunil Housekeeper',
      checklistText: 'Test water pH level\nClean skimmer baskets\nSweep & mop floor'
    });
    loadData();
  };

  const handleVerifyTask = (taskId: string) => {
    housekeepingService.verifyTask(societyId, taskId, adminName);
    setSelectedTask(null);
    loadData();
  };

  const missedOrLateTasks = tasks.filter(t => t.status === 'MISSED' || t.status === 'LATE');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'VERIFIED');

  const filteredTasks = tasks.filter(t => {
    const matchesTab =
      activeTab === 'ALL' ||
      (activeTab === 'MISSED_LATE' && (t.status === 'MISSED' || t.status === 'LATE')) ||
      (activeTab === 'COMPLETED' && (t.status === 'COMPLETED' || t.status === 'VERIFIED'));

    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.areaLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedStaffName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
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
              Housekeeping &amp; Operations
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0 }}>
              Green Valley Society · {tasks.length} operational tasks &amp; checklists
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
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
          <Plus size={15} /> Create Task
        </button>
      </div>

      {/* ── Operational Warning Banner if Missed Tasks Exist ── */}
      {missedOrLateTasks.length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-3">
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '12px',
              padding: '0.625rem 0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#991B1B',
              fontWeight: 700
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} color="#DC2626" />
              <span>{missedOrLateTasks.length} Missed or Late Task(s) Require Attention</span>
            </div>
            <button
              onClick={() => setActiveTab('MISSED_LATE')}
              style={{ background: '#DC2626', color: '#ffffff', border: 'none', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.6875rem', cursor: 'pointer', fontWeight: 700 }}
            >
              Review Now
            </button>
          </div>
        </div>
      )}

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
            placeholder="Search task title, staff, area, or location..."
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

        {/* Filter Pills matching Residents & NGO Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'ALL', label: `All Tasks (${tasks.length})` },
            { key: 'MISSED_LATE', label: `Missed & Late (${missedOrLateTasks.length})` },
            { key: 'COMPLETED', label: `Completed (${completedTasks.length})` },
            { key: 'GARBAGE', label: `Garbage Logs (${garbageLogs.length})` }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: activeTab === tab.key ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
                border: '1px solid var(--aarizo-border, #DCE8EF)',
                borderRadius: '10px',
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: activeTab === tab.key ? '#ffffff' : 'var(--aarizo-text, #203746)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <CheckSquare size={14} color={activeTab === tab.key ? '#ffffff' : 'var(--aarizo-coral, #F06543)'} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Count Heading ── */}
      <div className="max-w-7xl mx-auto w-full" style={{ padding: '0.5rem 1rem 0.25rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--aarizo-text-secondary, #657785)' }}>
          {activeTab === 'GARBAGE' ? garbageLogs.length : filteredTasks.length} items found
        </span>
      </div>

      {/* ── Operational Task Cards Grid ── */}
      {activeTab !== 'GARBAGE' ? (
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3 sm:p-4">
          {filteredTasks.map((t) => {
            const isDone = t.status === 'COMPLETED' || t.status === 'VERIFIED';
            const isMissed = t.status === 'MISSED' || t.status === 'LATE';

            return (
              <div
                key={t.id}
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
                      {t.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--aarizo-text, #203746)' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', marginTop: '0.125rem' }}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: 3 }} /> {t.areaLocation}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)' }}>
                        👤 {t.assignedStaffName} · ⏰ {t.startTime}-{t.endTime}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & View Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        color: isDone ? '#059669' : isMissed ? '#DC2626' : '#D97706',
                        background: isDone ? '#ECFDF5' : isMissed ? '#FEF2F2' : '#FFFBEB',
                        border: `1px solid ${isDone ? '#A7F3D0' : isMissed ? '#FECACA' : '#FDE68A'}`,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t.status}
                    </span>

                    <button
                      onClick={() => setSelectedTask(t)}
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

                {/* Checklist count bar */}
                <div
                  style={{
                    background: '#F4FAFE',
                    border: '1px solid #DCE8EF',
                    borderRadius: '10px',
                    padding: '0.4rem 0.625rem',
                    fontSize: '0.71875rem',
                    color: 'var(--aarizo-navy, #083B56)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span className="flex items-center gap-1">
                    <CheckSquare size={13} color="var(--aarizo-coral, #F06543)" />
                    <span>Checklist Items</span>
                  </span>
                  <span className="font-extrabold">
                    {t.checklist.filter(c => c.isCompleted).length} / {t.checklist.length} Done
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TAB: GARBAGE PICKUP LOGS */
        <div className="max-w-7xl mx-auto w-full p-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3">Area-Wise Garbage Collection Logs</h2>
            <DataTable
              columns={[
                { key: 'tower', header: 'Tower' },
                { key: 'floor', header: 'Floor' },
                { key: 'flatNumber', header: 'Flat' },
                { key: 'scheduledTime', header: 'Scheduled Time' },
                {
                  key: 'confirmed',
                  header: 'Resident Confirmed',
                  render: (log: GarbagePickupLog) => (
                    log.confirmedByResident ? (
                      <span className="text-xs font-bold text-emerald-600">✅ Confirmed</span>
                    ) : (
                      <span className="text-xs text-slate-400">Unconfirmed</span>
                    )
                  )
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (log: GarbagePickupLog) => (
                    <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${
                      log.status === 'COLLECTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {log.status}
                    </span>
                  )
                }
              ]}
              data={garbageLogs}
              keyExtractor={(log: GarbagePickupLog) => log.id}
              pageSize={10}
              mobileRender={(log: GarbagePickupLog) => (
                <MobileDataCard
                  title={`Tower ${log.tower} • Flat ${log.flatNumber}`}
                  subtitle={`Floor ${log.floor} • Scheduled: ${log.scheduledTime}`}
                  status={
                    <span className={`px-2 py-0.5 text-[0.65rem] rounded-full font-bold ${
                      log.status === 'COLLECTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {log.status}
                    </span>
                  }
                  attributes={[
                    { label: 'Tower', value: log.tower },
                    { label: 'Floor', value: log.floor },
                    { label: 'Flat', value: log.flatNumber },
                    {
                      label: 'Resident Confirmation',
                      value: log.confirmedByResident ? '✅ Confirmed' : 'Unconfirmed'
                    }
                  ]}
                />
              )}
            />
          </div>
        </div>
      )}

      {/* Modal: Inspect & Verify Task */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={`Task Details: ${selectedTask.title}`}
          maxWidth="540px"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
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
                Close
              </button>
              {selectedTask.status !== 'VERIFIED' && (
                <button
                  type="button"
                  onClick={() => handleVerifyTask(selectedTask.id)}
                  style={{
                    padding: '0.625rem 1.375rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                  }}
                >
                  <CheckCircle2 size={16} /> Verify Photo Proof &amp; Close Task
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4 py-1">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <p className="flex justify-between"><span className="text-slate-400">Category:</span> <strong>{selectedTask.category}</strong></p>
              <p className="flex justify-between"><span className="text-slate-400">Location:</span> <strong>{selectedTask.areaLocation}</strong></p>
              <p className="flex justify-between"><span className="text-slate-400">Assigned Staff:</span> <strong>{selectedTask.assignedStaffName}</strong></p>
              <p className="flex justify-between"><span className="text-slate-400">Scheduled:</span> <strong>{selectedTask.scheduledDate} ({selectedTask.startTime} - {selectedTask.endTime})</strong></p>
              {selectedTask.staffNotes && <p className="italic text-slate-600 pt-1">"{selectedTask.staffNotes}"</p>}
            </div>

            {/* Checklist */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-900 mb-2">Checklist Items:</h4>
              <div className="space-y-1.5">
                {selectedTask.checklist.map(chk => (
                  <div key={chk.id} className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${chk.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                      {chk.isCompleted ? '✓' : '○'}
                    </span>
                    <span className={chk.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>{chk.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedTask.photoProofUrl && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1">Attached Completion Photo Proof:</h4>
                <img src={selectedTask.photoProofUrl} alt="Photo proof" className="w-full h-44 object-cover rounded-xl border" />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal: Create Task */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Housekeeping Operational Task"
        maxWidth="540px"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
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
              form="create-housekeeping-task-form"
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
              Create Task
            </button>
          </div>
        }
      >
        <form id="create-housekeeping-task-form" onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Staircase Disinfection & Window Wiping"
              value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={taskForm.category}
                onChange={e => setTaskForm({ ...taskForm, category: e.target.value as CommonAreaCategory })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                {COMMON_AREA_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Area Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Tower A Staircase 1st to 5th Floor"
                value={taskForm.areaLocation}
                onChange={e => setTaskForm({ ...taskForm, areaLocation: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                required
                value={taskForm.scheduledDate}
                onChange={e => setTaskForm({ ...taskForm, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={taskForm.startTime}
                onChange={e => setTaskForm({ ...taskForm, startTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={taskForm.endTime}
                onChange={e => setTaskForm({ ...taskForm, endTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Staff Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Sunil Waste Collector"
              value={taskForm.assignedStaffName}
              onChange={e => setTaskForm({ ...taskForm, assignedStaffName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Checklist Items (One per line)</label>
            <textarea
              rows={3}
              required
              value={taskForm.checklistText}
              onChange={e => setTaskForm({ ...taskForm, checklistText: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm font-mono text-xs"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

