import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Terminal,
  Activity,
  UserCheck,
  Search,
  Filter,
  LogOut,
  AlertOctagon,
  CheckCircle2,
  Lock,
  Download,
  Code,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { securityService } from '../../../services/securityService';
import type { SessionRecord, AuditEventType } from '../../../types/security';
import { DataTable } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';

export const SecurityAuditCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'audit_logs' | 'sessions' | 'rbac' | 'simulator'>('audit_logs');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [sessions, setSessions] = useState<SessionRecord[]>(() => securityService.getActiveSessions());
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Simulator States
  const [simPayload, setSimPayload] = useState<string>('{\n  "username": "admin",\n  "comment": "<script>alert(1)</script>"\n}');
  const [simValidationResult, setSimValidationResult] = useState<any>(null);
  const [simRateLimitResult, setSimRateLimitResult] = useState<any>(null);
  const [simRateLimitHits, setSimRateLimitHits] = useState<number>(0);

  const logs = useMemo(() => {
    return securityService.getAuditLogs('soc-gvs', actionFilter);
  }, [actionFilter]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter(
      (l) =>
        l.actor.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.ipAddress.includes(q)
    );
  }, [logs, searchQuery]);

  const handleTerminateSession = (sessionId: string) => {
    securityService.terminateSession(sessionId);
    setSessions(securityService.getActiveSessions());
  };

  const handleRunPayloadValidation = () => {
    try {
      const parsed = JSON.parse(simPayload);
      const res = securityService.validatePayload(parsed);
      setSimValidationResult(res);
    } catch (e: any) {
      setSimValidationResult({ isValid: false, errors: [`JSON Parse Error: ${e.message}`] });
    }
  };

  const handleTestRateLimit = () => {
    const res = securityService.checkRateLimit('ip:192.168.1.100:api/v1/auth', 5, 10);
    setSimRateLimitResult(res);
    setSimRateLimitHits((prev) => prev + 1);
  };

  const handleDispatchTestAudit = (action: AuditEventType) => {
    securityService.logAudit({
      actor: 'Admin Console Simulator',
      role: 'SOCIETY_ADMIN',
      society: 'soc-gvs',
      action,
      entity: 'TestEntity',
      entityId: `TEST-${Date.now().toString().slice(-4)}`,
      metadata: { dispatchedVia: 'Simulator Tab', testMode: true },
      ipAddress: '127.0.0.1',
    });
    setActionFilter(actionFilter);
  };

  const handleExportAuditLogs = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Security_Audit_Trail_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
      case 'LOGOUT':
        return 'bg-[#EAF6FC] text-[#083B56] border border-[#DCE8EF]';
      case 'APPROVE':
      case 'VISITOR_ENTRY':
      case 'WORKER_VERIFICATION':
        return 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]';
      case 'REJECT':
      case 'DELETE':
        return 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]';
      case 'EMERGENCY_ACTION':
        return 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] font-extrabold';
      case 'QR_SCAN':
        return 'bg-[#F4FAFE] text-[#083B56] border border-[#DCE8EF]';
      case 'PAYMENT':
        return 'bg-[#FFF5F2] text-[#F06543] border border-[#FDBA74]';
      default:
        return 'bg-[#F7FBFE] text-[#083B56] border border-[#DCE8EF]';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: '2.5rem' }}>
      {/* ── Subheader / Top Bar ── */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--aarizo-border, #DCE8EF)',
          padding: '0.875rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 1px 3px rgba(8, 59, 86, 0.03)',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--aarizo-card-blue, #F4FAFE)',
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Security &amp; Audit Operations
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                Active Sentinel
              </span>
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Immutable audit logs, session controls, payload validation &amp; RBAC matrix
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleExportAuditLogs}
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
              whiteSpace: 'nowrap',
            }}
          >
            <Download size={15} /> Export Logs
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 space-y-5">
        {/* ── Sub-Tab Navigation Bar - Integrated Segmented Control Container ── */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #DCE8EF',
            borderRadius: '16px',
            padding: '0.4rem',
            boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'audit_logs', label: `Audit Logs (${logs.length})`, icon: Activity },
              { id: 'sessions', label: `Active Sessions (${sessions.filter((s) => !s.isExpired).length})`, icon: UserCheck },
              { id: 'rbac', label: 'RBAC Matrix', icon: Lock },
              { id: 'simulator', label: 'Security Simulator', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    background: active ? '#F06543' : '#F7FBFE',
                    color: active ? '#ffffff' : '#083B56',
                    border: active ? '1px solid #F06543' : '1px solid #DCE8EF',
                    borderRadius: '12px',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: active ? '0 3px 10px rgba(240, 101, 67, 0.28)' : 'none',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    transition: 'all 0.18s ease-in-out',
                  }}
                >
                  <Icon size={15} color={active ? '#ffffff' : '#F06543'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TAB 1: AUDIT LOGS EXPLORER ── */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col md:flex-row gap-3 justify-between items-center">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search actor, entity, entity ID, or IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.35rem' }}
                  className="w-full pr-3 py-2 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs text-[#083B56] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543]"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-[#F06543]" />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="bg-white border border-[#DCE8EF] rounded-xl px-3 py-2 text-xs font-extrabold text-[#083B56] cursor-pointer"
                >
                  <option value="ALL">All Event Types ({logs.length})</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="LOGOUT">LOGOUT</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="APPROVE">APPROVE</option>
                  <option value="REJECT">REJECT</option>
                  <option value="QR_SCAN">QR_SCAN</option>
                  <option value="VISITOR_ENTRY">VISITOR_ENTRY</option>
                  <option value="VISITOR_EXIT">VISITOR_EXIT</option>
                  <option value="PAYMENT">PAYMENT</option>
                  <option value="MAINTENANCE_REASSIGNMENT">MAINTENANCE_REASSIGNMENT</option>
                  <option value="WORKER_VERIFICATION">WORKER_VERIFICATION</option>
                  <option value="EMERGENCY_ACTION">EMERGENCY_ACTION</option>
                </select>
              </div>
            </div>

            {/* Audit Trail List / Table */}
            <div className="bg-white rounded-2xl border border-[#DCE8EF] shadow-2xs p-4">
              <DataTable
                columns={[
                  {
                    key: 'timestamp',
                    header: 'Timestamp',
                    render: (log: any) => (
                      <span className="font-mono text-[11px] text-slate-500 font-medium whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    ),
                  },
                  {
                    key: 'actor',
                    header: 'Actor & Role',
                    render: (log: any) => (
                      <div>
                        <div className="font-extrabold text-[#083B56] text-xs">{log.actor}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{log.role}</div>
                      </div>
                    ),
                  },
                  {
                    key: 'action',
                    header: 'Action Event',
                    render: (log: any) => (
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    ),
                  },
                  {
                    key: 'entity',
                    header: 'Target Entity',
                    render: (log: any) => (
                      <div>
                        <span className="font-extrabold text-[#083B56] text-xs">{log.entity}</span>
                        <span className="ml-1 text-slate-500 font-mono text-[10px]">({log.entityId})</span>
                      </div>
                    ),
                  },
                  { key: 'ipAddress', header: 'IP Address', render: (log: any) => <span className="font-mono text-slate-500 text-xs font-semibold">{log.ipAddress}</span> },
                  {
                    key: 'actions',
                    header: 'Details',
                    render: (log: any) => (
                      <button
                        type="button"
                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                        style={{
                          background: '#F4FAFE',
                          color: '#083B56',
                          border: '1px solid #DCE8EF',
                          fontWeight: 800,
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                        }}
                      >
                        {expandedLogId === log.id ? 'Hide' : 'Metadata'}
                      </button>
                    ),
                  },
                ]}
                data={filteredLogs}
                keyExtractor={(log: any) => log.id}
                pageSize={10}
                mobileRender={(log: any) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <MobileDataCard
                      title={`${log.actor} (${log.role})`}
                      subtitle={`${new Date(log.timestamp).toLocaleString()} • IP: ${log.ipAddress}`}
                      status={
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      }
                      attributes={[
                        { label: 'Target Entity', value: `${log.entity} (${log.entityId})` },
                        { label: 'Timestamp', value: new Date(log.timestamp).toLocaleTimeString() },
                      ]}
                      actions={
                        <div className="w-full mt-2">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.75rem',
                              border: '1px solid #DCE8EF',
                              color: '#083B56',
                              background: '#F4FAFE',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              borderRadius: '10px',
                              cursor: 'pointer',
                            }}
                          >
                            {isExpanded ? 'Hide Metadata Record' : 'View Metadata Record'}
                          </button>
                          {isExpanded && (
                            <pre className="mt-2 text-[#83CBEA] font-mono text-[11px] whitespace-pre-wrap overflow-x-auto bg-[#083B56] p-3 rounded-xl border border-[#0D4767]">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      }
                    />
                  );
                }}
              />
            </div>
          </div>
        )}

        {/* ── TAB 2: ACTIVE SESSIONS MONITOR ── */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {sessions.map((sess) => (
                <div
                  key={sess.sessionId}
                  className={`bg-white p-5 rounded-2xl border ${
                    sess.isExpired
                      ? 'border-[#DCE8EF] opacity-60'
                      : 'border-[#A7F3D0] shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          sess.isExpired ? 'bg-slate-400' : 'bg-[#059669] animate-pulse'
                        }`}
                      />
                      <span className="text-xs font-extrabold text-[#083B56]">{sess.userName}</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EAF6FC] text-[#083B56] border border-[#DCE8EF] font-extrabold">
                      {sess.role}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 font-mono font-medium">
                    <div>IP: <span className="font-bold text-[#083B56]">{sess.ipAddress}</span></div>
                    <div>Device: {sess.deviceInfo}</div>
                    <div className="text-[11px] text-slate-400 mt-2 font-sans">
                      Active since: {new Date(sess.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DCE8EF] flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      {sess.isExpired ? 'EXPIRED / REVOKED' : 'SESSION ACTIVE'}
                    </span>
                    {!sess.isExpired && (
                      <button
                        type="button"
                        onClick={() => handleTerminateSession(sess.sessionId)}
                        style={{
                          background: '#FEF2F2',
                          color: '#DC2626',
                          fontWeight: 800,
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #FECACA',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <LogOut size={13} /> Revoke Session
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: RBAC MATRIX ── */}
        {activeTab === 'rbac' && (
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#DCE8EF] shadow-2xs space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-[#083B56] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#F06543]" /> Platform Role-Based Access Control (RBAC)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Strict server-enforced permission authorization matrix</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  role: 'SUPER_ADMIN',
                  permissions: ['All Platform Permissions (*)'],
                  desc: 'Full global system administration & multi-society configuration',
                  color: 'bg-[#F4FAFE] text-[#083B56] border-[#DCE8EF]',
                },
                {
                  role: 'SOCIETY_ADMIN',
                  permissions: [
                    'create:flat',
                    'update:flat',
                    'delete:flat',
                    'approve:resident',
                    'reject:resident',
                    'create:vendor',
                    'approve:vendor',
                    'reject:vendor',
                    'manage:billing',
                    'reassign:maintenance',
                    'view:audit_logs',
                  ],
                  desc: 'Society management, financial control, and resident approvals',
                  color: 'bg-[#F4FAFE] text-[#083B56] border-[#DCE8EF]',
                },
                {
                  role: 'resident',
                  permissions: [
                    'create:visitor_pass',
                    'approve:visitor_pass',
                    'reject:visitor_pass',
                    'create:maintenance_ticket',
                    'pay:bill',
                    'book:amenity',
                    'trigger:sos',
                    'book:guest_stay',
                  ],
                  desc: 'Self-service resident operations & visitor authorizations',
                  color: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
                },
                {
                  role: 'SECURITY',
                  permissions: [
                    'scan:visitor_qr',
                    'scan:parking_qr',
                    'scan:staff_qr',
                    'scan:child_qr',
                    'scan:guest_qr',
                    'verify:worker',
                    'respond:emergency',
                  ],
                  desc: 'Security gate scanning terminals & incident response',
                  color: 'bg-[#FFF5F2] text-[#F06543] border-[#FDBA74]',
                },
              ].map((item) => (
                <div key={item.role} className={`p-4 rounded-xl border ${item.color}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-[#083B56]">{item.role}</span>
                    <span className="text-xs text-slate-500 font-medium">{item.desc}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.permissions.map((perm) => (
                      <span key={perm} className="px-2 py-0.5 bg-white rounded text-[11px] font-mono border border-[#DCE8EF] text-[#083B56] font-bold">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: SECURITY SIMULATOR ── */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 gap-5">
            {/* Payload Sanitizer Simulator */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#DCE8EF] shadow-2xs space-y-4">
              <h3 className="font-extrabold text-[#083B56] flex items-center gap-2">
                <Code className="w-4 h-4 text-[#F06543]" /> Payload Sanitizer &amp; XSS Inspector
              </h3>
              <p className="text-xs text-slate-500 font-medium">Test backend security payload validation engine</p>

              <textarea
                value={simPayload}
                onChange={(e) => setSimPayload(e.target.value)}
                rows={4}
                className="w-full font-mono text-xs p-3 rounded-xl border border-[#0D4767] bg-[#083B56] text-[#83CBEA] focus:outline-none"
              />

              <button
                type="button"
                onClick={handleRunPayloadValidation}
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  background: '#F06543',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                }}
              >
                Validate Payload Against Injection Rules
              </button>

              {simValidationResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-mono ${
                    simValidationResult.isValid
                      ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                      : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                  }`}
                >
                  <div className="font-extrabold flex items-center gap-1.5">
                    {simValidationResult.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                    ) : (
                      <AlertOctagon className="w-4 h-4 text-[#DC2626]" />
                    )}
                    Status: {simValidationResult.isValid ? 'PASSED CLEAN' : 'SECURITY VIOLATION REJECTED'}
                  </div>
                  {simValidationResult.errors.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-[11px] space-y-1 font-sans">
                      {simValidationResult.errors.map((err: string, idx: number) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Rate Limiting Simulator */}
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#DCE8EF] shadow-2xs space-y-4">
              <h3 className="font-extrabold text-[#083B56] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#F06543]" /> Sliding-Window Rate Limiter
              </h3>
              <p className="text-xs text-slate-500 font-medium">Simulate rapid API requests (Limit: 5 req / 10s)</p>

              <div className="flex items-center justify-between p-3 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs">
                <span className="font-bold text-[#083B56]">Total Clicks / Attempts:</span>
                <span className="font-mono font-extrabold text-[#F06543] text-sm">{simRateLimitHits}</span>
              </div>

              <button
                type="button"
                onClick={handleTestRateLimit}
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  background: '#083B56',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Simulate Instant API Call
              </button>

              {simRateLimitResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-mono ${
                    simRateLimitResult.allowed
                      ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                      : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                  }`}
                >
                  <div className="font-extrabold flex items-center justify-between">
                    <span>Result: {simRateLimitResult.allowed ? '200 OK (Allowed)' : '429 TOO MANY REQUESTS'}</span>
                    <span>Remaining: {simRateLimitResult.remaining}</span>
                  </div>
                  <div className="text-[10px] mt-1 text-slate-500 font-sans">
                    Window Reset in {simRateLimitResult.resetSeconds}s
                  </div>
                </div>
              )}

              {/* Audit Dispatcher Quick Buttons */}
              <div className="pt-4 border-t border-[#DCE8EF]">
                <div className="text-xs font-extrabold text-[#083B56] mb-2">Test Live Audit Log Event Dispatcher</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleDispatchTestAudit('LOGIN')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      background: '#083B56',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Dispatch LOGIN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDispatchTestAudit('EMERGENCY_ACTION')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      background: '#DC2626',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Dispatch EMERGENCY
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDispatchTestAudit('WORKER_VERIFICATION')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      background: '#F06543',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Dispatch WORKER_VERIFICATION
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityAuditCenterPage;
