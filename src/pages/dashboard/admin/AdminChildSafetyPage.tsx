import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { childSafetyService } from '../../../services/childSafetyService';
import type { ChildProfile, PickupLog, ChildSafetyAlert } from '../../../types/childSafety';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  ArrowLeft,
  UserCheck,
  Eye,
} from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';
import { Modal } from '../../../components/ui/Modal';

export const AdminChildSafetyPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const societyId = (currentUser as any)?.societyId || 'soc-gvs';

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [pickupLogs, setPickupLogs] = useState<PickupLog[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<ChildSafetyAlert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'INSIDE' | 'LOGS' | 'ALERTS'>('ALL');
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);

  useEffect(() => {
    loadData();
  }, [societyId]);

  const loadData = () => {
    setChildren(childSafetyService.getChildren(societyId));
    setPickupLogs(childSafetyService.getPickupLogs(societyId));
    setSafetyAlerts(childSafetyService.getSafetyAlerts(societyId));
  };

  const handleResolveAlert = (alertId: string) => {
    childSafetyService.resolveSafetyAlert(societyId, alertId, currentUser?.name || 'Society Admin');
    loadData();
  };

  const activeAlerts = safetyAlerts.filter(a => a.status === 'ACTIVE');

  const filteredChildren = children.filter(c => {
    const matchesTab =
      activeTab === 'ALL' ||
      activeTab === 'LOGS' ||
      activeTab === 'ALERTS' ||
      (activeTab === 'INSIDE' && c.status === 'SAFE');

    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.guardians.some(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.phone.includes(searchQuery));

    return matchesTab && matchesSearch;
  });

  const logColumns: Column<PickupLog>[] = [
    { key: 'childName', header: 'Child Name' },
    { key: 'flatNumber', header: 'Flat' },
    { key: 'pickupPersonName', header: 'Caretaker' },
    { key: 'gateId', header: 'Gate' },
    { key: 'timestamp', header: 'Time', render: (l) => new Date(l.timestamp).toLocaleString() },
    {
      key: 'status',
      header: 'Outcome',
      render: (l) => (
        <span
          className={`px-2.5 py-1 text-xs rounded-full font-semibold ${
            l.status === 'ALLOWED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}
        >
          {l.status}
        </span>
      ),
    },
  ];

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
              Child Safety Desk
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0 }}>
              Green Valley Society · {children.length} registered children &amp; pickup passes
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.875rem',
            borderRadius: '10px',
            background: 'var(--aarizo-light-blue, #EAF6FC)',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            color: 'var(--aarizo-navy, #083B56)',
            fontWeight: 800,
            fontSize: '0.75rem',
          }}
        >
          <UserCheck size={15} color="var(--aarizo-coral, #F06543)" /> Household Family Synced
        </div>
      </div>

      {/* ── Active Missing Safety Alert Broadcast Banner ── */}
      {activeAlerts.length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-3">
          <div
            style={{
              background: '#DC2626',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.875rem' }}>
              <ShieldAlert size={20} color="#ffffff" />
              <span>ACTIVE MISSING CHILD ALERT BROADCAST</span>
            </div>
            {activeAlerts.map((alert) => (
              <p key={alert.id} style={{ fontSize: '0.75rem', margin: 0, opacity: 0.95 }}>
                {alert.message}
              </p>
            ))}
            <div style={{ alignSelf: 'flex-end', marginTop: '0.25rem' }}>
              <button
                onClick={() => handleResolveAlert(activeAlerts[0].id)}
                style={{
                  background: '#ffffff',
                  color: '#DC2626',
                  fontWeight: 800,
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Mark Child Safe / Resolve Incident
              </button>
            </div>
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
            placeholder="Search child name, flat, guardian, or phone..."
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

        {/* Cause Filter Pills matching Residents & NGO Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'ALL', label: `All Children (${children.length})` },
            { key: 'INSIDE', label: `Inside Society (${children.filter(c => c.status === 'SAFE').length})` },
            { key: 'LOGS', label: `Gate Pickups (${pickupLogs.length})` },
            { key: 'ALERTS', label: `Active Alerts (${activeAlerts.length})` },
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
                whiteSpace: 'nowrap',
              }}
            >
              <ShieldCheck size={14} color={activeTab === tab.key ? '#ffffff' : 'var(--aarizo-coral, #F06543)'} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Count Heading ── */}
      <div className="max-w-7xl mx-auto w-full" style={{ padding: '0.5rem 1rem 0.25rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--aarizo-text-secondary, #657785)' }}>
          {activeTab === 'LOGS' ? pickupLogs.length : filteredChildren.length} items found
        </span>
      </div>

      {/* ── Registered Children List (Clean Minimal Cards matching Residents & NGO Tabs) ── */}
      {activeTab !== 'LOGS' ? (
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3 sm:p-4">
          {filteredChildren.map((c) => (
            <div
              key={c.id}
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
                      color: 'var(--aarizo-navy, #083B56)',
                      fontWeight: 800,
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    {c.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--aarizo-text, #203746)' }}>
                      {c.fullName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', marginTop: '0.125rem' }}>
                      ⌂ Flat: {c.flatNumber} · DOB: {c.dateOfBirth || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)' }}>
                      👤 {c.guardians[0]?.name || 'Guardian'} ({c.guardians[0]?.phone || 'N/A'})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)' }}>
                      🛡️ {c.authorizedPickups.length} Authorized Caretaker(s)
                    </div>
                  </div>
                </div>

                {/* Status & View Button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      color: c.status === 'SAFE' ? '#059669' : c.status === 'OUT_OF_SOCIETY' ? '#D97706' : '#DC2626',
                      background: c.status === 'SAFE' ? '#ECFDF5' : c.status === 'OUT_OF_SOCIETY' ? '#FFFBEB' : '#FEF2F2',
                      border: `1px solid ${c.status === 'SAFE' ? '#A7F3D0' : c.status === 'OUT_OF_SOCIETY' ? '#FDE68A' : '#FECACA'}`,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '9999px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {c.status}
                  </span>

                  <button
                    onClick={() => setSelectedChild(c)}
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
            </div>
          ))}
        </div>
      ) : (
        /* ── Gate Pickup Audit Logs ── */
        <div className="max-w-7xl mx-auto w-full p-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3">Gate Pickup Audit Logs &amp; History</h2>
            <DataTable
              columns={logColumns}
              data={pickupLogs}
              keyExtractor={(l) => l.id}
              pageSize={10}
              mobileRender={(l) => (
                <MobileDataCard
                  title={l.childName}
                  subtitle={l.pickupPersonName}
                  status={
                    <span
                      className={`px-2 py-0.5 text-[0.65rem] rounded-full font-bold ${
                        l.status === 'ALLOWED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {l.status}
                    </span>
                  }
                  attributes={[
                    { label: 'Flat', value: l.flatNumber },
                    { label: 'Time', value: new Date(l.timestamp).toLocaleString() },
                  ]}
                />
              )}
            />
          </div>
        </div>
      )}

      {/* Child Details Modal */}
      {selectedChild && (
        <Modal isOpen={!!selectedChild} onClose={() => setSelectedChild(null)} title={`Child Safety Pass: ${selectedChild.fullName}`}>
          <div className="space-y-4 text-slate-800">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Flat Code</span>
                <span className="font-bold text-[#083B56]">{selectedChild.flatNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Date of Birth</span>
                <span className="font-bold text-slate-800">{selectedChild.dateOfBirth || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Current Location</span>
                <span className="font-bold text-emerald-600">{selectedChild.status}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Primary Guardians</h4>
              <div className="space-y-1.5 text-xs">
                {selectedChild.guardians.map((g, idx) => (
                  <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                    <span className="font-bold text-slate-900">{g.name} ({g.relationship})</span>
                    <span className="text-slate-600">📞 {g.phone}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Authorized Caretakers / Pickups</h4>
              <div className="space-y-1.5 text-xs">
                {selectedChild.authorizedPickups.length === 0 ? (
                  <p className="text-slate-400 italic">No additional authorized pickup persons registered.</p>
                ) : (
                  selectedChild.authorizedPickups.map((p, idx) => (
                    <div key={idx} className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between text-emerald-900">
                      <span className="font-bold">{p.name} ({p.relationship})</span>
                      <span>Status: {p.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setSelectedChild(null)} className="px-4 py-2 bg-[#083B56] text-white text-xs font-bold rounded-xl">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
