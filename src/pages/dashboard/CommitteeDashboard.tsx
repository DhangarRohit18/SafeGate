import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileCheck,
  DollarSign,
  ShieldCheck,
  Activity,
  BookOpen,
  UploadCloud,
  Download,
  Plus,
  ArrowLeft,
  LayoutDashboard,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { UnifiedRequestCenter } from '../../domains/requests/components/UnifiedRequestCenter';
import { SocietyExpenseHub } from '../../domains/expenses';
import { AssetComplianceHub } from '../../domains/compliance';
import { SocietyHealthScoreCard } from '../../domains/analytics';
import { realtimeService } from '../../services/realtimeService';
import { FileUpload } from '../../components/ui/FileUpload';
import { Modal } from '../../components/ui/Modal';
import { CommitteeProfilePage } from './committee/CommitteeProfilePage';

export const CommitteeDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<'AGM_MINUTES' | 'RESOLUTION' | 'BYE_LAWS' | 'AUDIT_REPORT'>('RESOLUTION');
  const [uploadedDocUrl, setUploadedDocUrl] = useState('');
  const [governanceDocs, setGovernanceDocs] = useState([
    { id: 'GD-1', title: 'AGM 2026 Annual General Meeting Minutes', category: 'AGM_MINUTES', date: '15 Aug 2026', url: '#' },
    { id: 'GD-2', title: 'Resolution 2026/04: EV Charging Tariff Approval', category: 'RESOLUTION', date: '28 Jul 2026', url: '#' },
    { id: 'GD-3', title: 'Model Bye-Laws Revision 5 Compliance Pack', category: 'BYE_LAWS', date: '10 Jan 2026', url: '#' },
  ]);

  // Report Date Filter State
  const [reportRange, setReportRange] = useState<'THIS_MONTH' | 'LAST_QUARTER' | 'YTD'>('THIS_MONTH');

  const getInitialTab = (): 'home' | 'approvals' | 'financials' | 'compliance' | 'health' | 'governance' | 'reports' | 'profile' => {
    if (location.pathname.includes('/financials')) return 'financials';
    if (location.pathname.includes('/compliance')) return 'compliance';
    if (location.pathname.includes('/health')) return 'health';
    if (location.pathname.includes('/governance')) return 'governance';
    if (location.pathname.includes('/reports')) return 'reports';
    if (location.pathname.includes('/profile')) return 'profile';
    if (location.pathname.includes('/approvals')) return 'approvals';
    return 'home';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  useEffect(() => {
    const unsub = realtimeService.subscribe('*', (event) => {
      if (
        event.type === 'GOVERNANCE_DOC_UPLOADED' ||
        event.type === 'EXPENSE_APPROVED' ||
        event.type === 'EXPENSE_REJECTED' ||
        event.type === 'MOVE_REQUEST_UPDATED' ||
        event.type === 'RENOVATION_REQUEST_UPDATED'
      ) {
        if (event.type === 'GOVERNANCE_DOC_UPLOADED' && event.payload?.doc) {
          setGovernanceDocs(prev => [event.payload.doc, ...prev]);
        }
      }
    });
    return () => unsub();
  }, []);

  const getPageHeaderInfo = () => {
    switch (activeTab) {
      case 'home':
      case 'financials':
      case 'compliance':
      case 'health':
      case 'governance':
        return {
          title: 'Management Committee',
          subtitle: 'Executive approvals, finances & governance',
        };
      case 'approvals':
        return {
          title: 'Approvals',
          subtitle: 'Review and process requests requiring committee decisions.',
        };
      case 'reports':
        return {
          title: 'Committee Reports',
          subtitle: 'Financial, compliance & governance insights.',
        };
      case 'profile':
        return {
          title: 'Committee Profile',
          subtitle: 'Manage your committee identity and account.',
        };
      default:
        return {
          title: 'Management Committee',
          subtitle: 'Executive approvals, finances & governance',
        };
    }
  };

  const headerInfo = getPageHeaderInfo();
  const isHomeWorkspace = ['home', 'financials', 'compliance', 'health', 'governance'].includes(activeTab);

  const homeSubTabs = [
    { key: 'home', label: 'Overview', icon: LayoutDashboard, path: '/committee' },
    { key: 'financials', label: 'Financials', icon: DollarSign, path: '/committee/financials' },
    { key: 'compliance', label: 'Compliance', icon: ShieldCheck, path: '/committee/compliance' },
    { key: 'health', label: 'Health', icon: Activity, path: '/committee/health' },
    { key: 'governance', label: 'Governance', icon: BookOpen, path: '/committee/governance' },
  ] as const;

  return (
    <div style={{ background: 'var(--aarizo-page, #F7FBFE)', minHeight: '100vh', paddingBottom: '5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Subheader Bar */}
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
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#083B56', letterSpacing: '-0.01em' }}>
                  {headerInfo.title}
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
                  Committee Active
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#657785', fontWeight: 500 }}>
                {headerInfo.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '1.25rem auto', padding: '0 1rem' }}>
        {/* Secondary Sub-nav Tabs Bar (Shown ONLY on Home workspace) */}
        {isHomeWorkspace && (
          <div style={{ display: 'flex', gap: '0.5rem', background: '#ffffff', padding: '0.35rem', borderRadius: '14px', border: '1px solid #DCE8EF', marginBottom: '1.25rem', overflowX: 'auto' }}>
            {homeSubTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key as any);
                    navigate(tab.path);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.875rem',
                    borderRadius: '10px',
                    border: active ? '1px solid #F06543' : '1px solid transparent',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    background: active ? '#F06543' : 'transparent',
                    color: active ? '#ffffff' : '#083B56',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    whiteSpace: 'nowrap',
                    boxShadow: active ? '0 2px 8px rgba(240, 101, 67, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={15} color={active ? '#ffffff' : '#083B56'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── 1. COMMITTEE HOME ── */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 4 Summary KPI Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {[
                { label: 'Pending Approvals', value: '4', sub: '2 High Priority', color: '#F06543', path: '/committee/approvals' },
                { label: 'Financial Attention', value: '₹1.25L', sub: '3 Vendor Payables', color: '#083B56', path: '/committee/financials' },
                { label: 'Compliance Health', value: '1 Due', sub: 'Water Quality Cert', color: '#D97706', path: '/committee/compliance' },
                { label: 'Open Governance', value: '1 Item', sub: 'AGM Minutes Sign-off', color: '#059669', path: '/committee/governance' },
              ].map((st, i) => (
                <div
                  key={i}
                  onClick={() => navigate(st.path)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #DCE8EF',
                    borderRadius: '14px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, boxShadow 0.15s ease',
                  }}
                  className="hover:border-slate-300"
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#52788D', textTransform: 'uppercase' }}>{st.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: st.color, marginTop: '2px' }}>{st.value}</div>
                  <div style={{ fontSize: '0.72rem', color: '#657785', fontWeight: 500, marginTop: '2px' }}>{st.sub}</div>
                </div>
              ))}
            </div>

            {/* Quick Operational Modules Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#FFF4F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F06543' }}>
                      <FileCheck size={18} />
                    </div>
                    <h3 style={{ fontWeight: 800, color: '#083B56', margin: 0, fontSize: '0.98rem' }}>Pending Approvals</h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#52788D', margin: '0 0 1rem 0' }}>
                    4 requests awaiting committee review including balcony mesh installation &amp; parking NOCs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/committee/approvals')}
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #F06543',
                    background: '#FFF4F1',
                    color: '#F06543',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Go to Approvals</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#F4FAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#083B56' }}>
                      <DollarSign size={18} />
                    </div>
                    <h3 style={{ fontWeight: 800, color: '#083B56', margin: 0, fontSize: '0.98rem' }}>Financial Oversight</h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#52788D', margin: '0 0 1rem 0' }}>
                    Treasury Balance: ₹24,80,500. 2 vendor payout invoices ready for executive sign-off.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/committee/financials')}
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #083B56',
                    background: '#F4FAFE',
                    color: '#083B56',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Manage Financials</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                      <ShieldCheck size={18} />
                    </div>
                    <h3 style={{ fontWeight: 800, color: '#083B56', margin: 0, fontSize: '0.98rem' }}>Statutory Compliance</h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#52788D', margin: '0 0 1rem 0' }}>
                    Fire &amp; Lift safety certificates valid. Water Tank Quality Cert renewal due in 30 days.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/committee/compliance')}
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #D97706',
                    background: '#FFFBEB',
                    color: '#D97706',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>View Compliance</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                      <BookOpen size={18} />
                    </div>
                    <h3 style={{ fontWeight: 800, color: '#083B56', margin: 0, fontSize: '0.98rem' }}>Governance Vault</h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#52788D', margin: '0 0 1rem 0' }}>
                    Model Bye-Laws Revision 5 enforced. AGM 2026 Minutes published for public record.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/committee/governance')}
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #059669',
                    background: '#ECFDF5',
                    color: '#059669',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>View Governance</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Recent Activity Stream */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 800, color: '#083B56', margin: '0 0 1rem 0', fontSize: '1.05rem' }}>Recent Committee Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { title: 'Balcony Grill Expansion Permission Submitted', time: '10 mins ago', user: 'Rajesh Kumar (B-1204)', tag: 'APPROVAL', tagBg: '#FFF4F1', tagColor: '#F06543' },
                  { title: 'Fire Safety Audit Certificate 2026 Renewed', time: '2 hours ago', user: 'Statutory Inspector', tag: 'COMPLIANCE', tagBg: '#ECFDF5', tagColor: '#059669' },
                  { title: 'Elevator Maintenance Q3 Invoice Approved', time: 'Yesterday', user: 'Treasurer Signatory', tag: 'FINANCIAL', tagBg: '#F4FAFE', tagColor: '#083B56' },
                  { title: 'Resolution 2026/04: EV Charging Tariff Published', time: '3 days ago', user: 'Secretary Office', tag: 'GOVERNANCE', tagBg: '#FEF3C7', tagColor: '#D97706' },
                ].map((act, idx) => (
                  <div key={idx} style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#083B56' }}>{act.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#52788D', marginTop: '0.15rem' }}>{act.user} · {act.time}</div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '8px', background: act.tagBg, color: act.tagColor }}>
                      {act.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 2. APPROVALS TAB ── */}
        {activeTab === 'approvals' && <UnifiedRequestCenter hideHeaderBanner={true} />}

        {/* ── 3. FINANCIALS TAB ── */}
        {activeTab === 'financials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 4 Financial KPI Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {[
                { label: 'Treasury Balance', value: '₹24,80,500', color: '#083B56', sub: 'Central HDFC Account' },
                { label: 'Monthly Collections', value: '₹4,25,000', color: '#059669', sub: '94% Maintenance Realized' },
                { label: 'Pending Payables', value: '₹85,000', color: '#F06543', sub: '2 Invoices Pending Sign-off' },
                { label: 'Receivables Overdue', value: '₹1,12,000', color: '#D97706', sub: '6 Flats Outstanding' },
              ].map((st, i) => (
                <div key={i} style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>{st.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: st.color, marginTop: '2px' }}>{st.value}</div>
                  <div style={{ fontSize: '0.72rem', color: '#657785', marginTop: '2px' }}>{st.sub}</div>
                </div>
              ))}
            </div>

            {/* Pending Financial Decision Items */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 800, color: '#083B56', margin: '0 0 1rem 0', fontSize: '1.05rem' }}>Pending Financial Decisions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { title: 'Elevator Maintenance Q3 AMC Payout', vendor: 'Otis Elevator India Pvt Ltd', amount: '₹45,000', dueDate: '10 Oct 2026', status: 'AWAITING COMMITTEE SIGNATURE' },
                  { title: 'Security Guard Staffing Agency Payout', vendor: 'Stallion Security Services', amount: '₹40,000', dueDate: '12 Oct 2026', status: 'AWAITING TREASURER REVIEW' },
                ].map((item, idx) => (
                  <div key={idx} style={{ padding: '0.85rem 1rem', background: '#FFFBF5', border: '1px solid #FED7AA', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#083B56' }}>{item.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#52788D', marginTop: '0.15rem' }}>{item.vendor} · Due: {item.dueDate}</div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#D97706', marginTop: '0.25rem', display: 'inline-block' }}>{item.status}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#083B56' }}>{item.amount}</div>
                      <button
                        type="button"
                        style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', background: '#F06543', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        Approve Payout
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Embedded Society Expense Hub */}
            <SocietyExpenseHub userRole="COMMITTEE_MEMBER" />
          </div>
        )}

        {/* ── 4. COMPLIANCE TAB ── */}
        {activeTab === 'compliance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 4 Compliance KPI Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {[
                { label: 'Total Audits', value: '5 Audits', color: '#083B56' },
                { label: 'Compliant Certs', value: '3 Active', color: '#059669' },
                { label: 'Submitted Filing', value: '1 Filed', color: '#0284C7' },
                { label: 'Renewal Due', value: '1 Due Soon', color: '#D97706' },
              ].map((st, i) => (
                <div key={i} style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>{st.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: st.color, marginTop: '2px' }}>{st.value}</div>
                </div>
              ))}
            </div>

            {/* Society Statutory Compliance Checklist */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 800, color: '#083B56', margin: '0 0 1rem 0', fontSize: '1.05rem' }}>Society Statutory Compliance Checklist</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { title: 'Fire Safety Audit 2026', status: 'COMPLIANT', statusColor: '#059669', statusBg: '#ECFDF5', date: 'Expires Dec 2026', docs: '2 Files' },
                  { title: 'Lift Safety Inspection Certificate', status: 'COMPLIANT', statusColor: '#059669', statusBg: '#ECFDF5', date: 'Expires Oct 2026', docs: '1 File' },
                  { title: 'AGM Statutory Return Filing', status: 'SUBMITTED', statusColor: '#0284C7', statusBg: '#F4FAFE', date: 'Filed Aug 2026', docs: '1 File' },
                  { title: 'Water Tank Quality Cert', status: 'DUE SOON', statusColor: '#D97706', statusBg: '#FFFBEB', date: 'Renewal Due 30 Sep', docs: '0 Files' },
                  { title: 'Structural Stability Audit', status: 'COMPLIANT', statusColor: '#059669', statusBg: '#ECFDF5', date: 'Valid till 2028', docs: '3 Files' },
                ].map((c, i) => (
                  <div key={i} style={{
                    background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0',
                    padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem',
                  }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#083B56', margin: 0, fontSize: '0.88rem' }}>{c.title}</p>
                      <p style={{ color: '#52788D', fontSize: '0.78rem', margin: '0.15rem 0 0' }}>{c.date} · {c.docs}</p>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: c.statusColor, background: c.statusBg, padding: '0.25rem 0.65rem', borderRadius: '8px' }}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Embedded Asset Compliance Engine */}
            <AssetComplianceHub userRoleOverride="SOCIETY_ADMIN" />
          </div>
        )}

        {/* ── 5. HEALTH TAB ── */}
        {activeTab === 'health' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 4 Health KPI Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {[
                { label: 'Society Health', value: '98/100', color: '#083B56', sub: 'Grade A+ Optimal' },
                { label: 'Resolution (24h)', value: '92%', color: '#059669', sub: 'SLA Compliant' },
                { label: 'Satisfaction', value: '4.8/5.0', color: '#0284C7', sub: 'Verified Resident Rating' },
                { label: 'Active Tickets', value: '2', color: '#D97706', sub: 'Low Priority Maintenance' },
              ].map((m, i) => (
                <div key={i} style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>{m.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: m.color, marginTop: '2px' }}>{m.value}</div>
                  <div style={{ fontSize: '0.72rem', color: '#657785', marginTop: '2px' }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Society Health Score Audit Engine */}
            <SocietyHealthScoreCard />

            {/* Infrastructure & Operations Status */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 800, color: '#083B56', margin: '0 0 0.85rem 0', fontSize: '1.05rem' }}>Infrastructure &amp; Safety Operational Status</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {[
                  { name: 'Water Pumping & STP', status: 'OPERATIONAL', detail: 'Filter pumps clear' },
                  { name: 'Elevator Operations', status: 'OPERATIONAL', detail: 'All 6 lifts active' },
                  { name: 'CCTV Security Net', status: 'OPERATIONAL', detail: '32/32 Feed online' },
                  { name: 'DG Power Cutover', status: 'STANDBY', detail: 'Fuel level 90%' },
                ].map((sys, idx) => (
                  <div key={idx} style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#083B56' }}>{sys.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#52788D' }}>{sys.detail}</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>{sys.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 6. GOVERNANCE TAB ── */}
        {activeTab === 'governance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 4 Governance KPI Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {[
                { label: 'Model Bye-Laws', value: '100%', color: '#059669', sub: 'Enforced' },
                { label: 'Resolutions', value: '24 Passed', color: '#083B56', sub: 'Published' },
                { label: 'AGM Minutes', value: 'Archived', color: '#0284C7', sub: '2024-2026' },
                { label: 'Action Items', value: '1 Open', color: '#D97706', sub: 'In Progress' },
              ].map((g, i) => (
                <div key={i} style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>{g.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: g.color, marginTop: '2px' }}>{g.value}</div>
                  <div style={{ fontSize: '0.72rem', color: '#657785', marginTop: '2px' }}>{g.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontWeight: 800, color: '#083B56', margin: '0 0 0.25rem 0', fontSize: '1.05rem' }}>Governance &amp; Bye-Laws Repository</h3>
                  <p style={{ color: '#52788D', fontSize: '0.82rem', margin: 0 }}>
                    Society operations strictly adhere to Model Cooperative Housing Society Bye-Laws.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
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
                  <Plus size={16} />
                  <span>Upload Doc</span>
                </button>
              </div>

              {/* Document List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {governanceDocs.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#F4FAFE', border: '1px solid #DCE8EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#083B56' }}>
                        <UploadCloud size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#083B56' }}>{doc.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#52788D' }}>{doc.category} · {doc.date}</div>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#083B56',
                        textDecoration: 'none',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid #DCE8EF',
                      }}
                    >
                      <Download size={14} />
                      <span>View</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Document Modal */}
            <Modal
              isOpen={showUploadModal}
              onClose={() => setShowUploadModal(false)}
              title="Upload Governance Document"
              maxWidth="520px"
              footer={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    style={{
                      padding: '0.625rem 1.25rem',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    form="governance-doc-form"
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
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Save &amp; Publish
                  </button>
                </div>
              }
            >
              <form
                id="governance-doc-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!docTitle) return;
                  const newDoc = {
                    id: `GD-${Date.now()}`,
                    title: docTitle,
                    category: docCategory,
                    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    url: uploadedDocUrl || '#',
                  };
                  setGovernanceDocs((prev) => [newDoc, ...prev]);
                  realtimeService.publish({
                    type: 'GOVERNANCE_DOC_UPLOADED',
                    payload: { doc: newDoc },
                  });
                  setDocTitle('');
                  setUploadedDocUrl('');
                  setShowUploadModal(false);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.25rem' }}
              >
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                    Document Title
                  </label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. Resolution 2026/05: Solar Rooftop Grid Tie"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                  >
                    <option value="AGM_MINUTES">AGM Minutes</option>
                    <option value="RESOLUTION">Managing Committee Resolution</option>
                    <option value="BYE_LAWS">Society Bye-Laws</option>
                    <option value="AUDIT_REPORT">Financial Audit Report</option>
                  </select>
                </div>
                <div>
                  <FileUpload
                    label="Attach PDF or Certified Scan"
                    category="general"
                    onUploadSuccess={(url) => setUploadedDocUrl(url)}
                  />
                </div>
              </form>
            </Modal>
          </div>
        )}

        {/* ── 7. REPORTS TAB ── */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Report Date Filter Bar */}
            <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '14px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} color="#083B56" />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#083B56' }}>Report Period:</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { key: 'THIS_MONTH', label: 'This Month' },
                  { key: 'LAST_QUARTER', label: 'Last Quarter' },
                  { key: 'YTD', label: 'Year to Date' },
                ].map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setReportRange(r.key as any)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: reportRange === r.key ? '1px solid #F06543' : '1px solid #DCE8EF',
                      background: reportRange === r.key ? '#FFF4F1' : '#ffffff',
                      color: reportRange === r.key ? '#F06543' : '#52788D',
                      cursor: 'pointer',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Report Analytics Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {[
                { label: 'Requests Processed', value: '48', color: '#083B56', sub: '100% Resolved' },
                { label: 'Avg SLA Time', value: '1.4 Days', color: '#059669', sub: 'Target: < 2 Days' },
                { label: 'Collection Rate', value: '96.2%', color: '#0284C7', sub: '₹4.25L Maintenance' },
                { label: 'Audit Index', value: '98%', color: '#059669', sub: 'Statutory Verified' },
              ].map((st, i) => (
                <div key={i} style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#52788D', textTransform: 'uppercase' }}>{st.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: st.color, marginTop: '2px' }}>{st.value}</div>
                  <div style={{ fontSize: '0.72rem', color: '#657785', marginTop: '2px' }}>{st.sub}</div>
                </div>
              ))}
            </div>

            {/* Report Executive Summaries */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 800, color: '#083B56', margin: '0 0 1rem 0', fontSize: '1.05rem' }}>Approval SLA &amp; Category Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { category: 'NOC & Gate Pass Certificates', total: '18', avgTime: '1.1 Days', sla: '98%' },
                  { category: 'Tenant Onboarding Approvals', total: '14', avgTime: '1.5 Days', sla: '95%' },
                  { category: 'Renovation & Modification Permits', total: '10', avgTime: '1.8 Days', sla: '90%' },
                  { category: 'Event & Amenities Booking Permissions', total: '6', avgTime: '0.8 Days', sla: '100%' },
                ].map((rep, idx) => (
                  <div key={idx} style={{ padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#083B56' }}>{rep.category}</div>
                      <div style={{ fontSize: '0.78rem', color: '#52788D', marginTop: '0.15rem' }}>Total Processed: {rep.total} · Avg Resolution: {rep.avgTime}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '0.25rem 0.65rem', borderRadius: '8px' }}>
                      {rep.sla} SLA Compliance
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 8. PROFILE TAB ── */}
        {activeTab === 'profile' && <CommitteeProfilePage />}
      </div>
    </div>
  );
};

export default CommitteeDashboard;
