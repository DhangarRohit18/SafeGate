import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Sliders,
  RotateCcw,
  CheckSquare,
  Sparkles,
  MapPin,
  User,
  Timer,
  ArrowLeft,
} from 'lucide-react';
import { complaintSLAService } from '../services/complaintSLAService';
import type { Complaint, ComplaintCategory, SLAPolicy, SLAAnalytics } from '../types';
import { useAuth } from '../../../context/AuthContext';
import { useRBAC } from '../../../hooks/useRBAC';
import { subscribeToComplaints, createComplaintToDb, updateComplaintInDb } from '../../../repositories/complaintRepository';
import { Modal } from '../../../components/ui/Modal';
import { FileUpload } from '../../../components/ui/FileUpload';

export const ComplaintSLAEngineHub: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { activeRole } = useRBAC();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [_slaPolicies, setSlaPolicies] = useState<SLAPolicy[]>([]);
  const [analytics, setAnalytics] = useState<SLAAnalytics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('PLUMBING');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Tower B · Flat B-1204');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [photoUrl, setPhotoUrl] = useState('');

  // Policy Config Modal
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [selectedPolicyCat, setSelectedPolicyCat] = useState<ComplaintCategory>('PLUMBING');
  const [newSlaMinutes, setNewSlaMinutes] = useState<number>(240);

  // Resident Verification Modal
  const [verifyComplaint, setVerifyComplaint] = useState<Complaint | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  const loadData = () => {
    setSlaPolicies(complaintSLAService.getSLAPolicies('soc-gvs'));
    setAnalytics(complaintSLAService.getSLAAnalytics('soc-gvs'));
    const initialList = complaintSLAService.getAllComplaints('soc-gvs');
    setComplaints((prev) => (prev && prev.length > 0 ? prev : initialList));
  };

  useEffect(() => {
    loadData();

    try {
      const unsubscribe = subscribeToComplaints('soc-gvs', (list) => {
        if (list && list.length > 0) {
          setComplaints(list);
        } else {
          setComplaints(complaintSLAService.getAllComplaints('soc-gvs'));
        }
      });
      return () => unsubscribe();
    } catch {
      setComplaints(complaintSLAService.getAllComplaints('soc-gvs'));
    }
  }, []);

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    await createComplaintToDb({
      societyId: 'soc-gvs',
      residentId: currentUser?.id || 'res-1',
      residentName: currentUser?.name || 'Vikram Joshi',
      flatCode: currentUser?.flatDetails || 'Tower B · B-1204',
      category,
      title,
      description,
      location,
      urgency,
      photoUrl,
      status: 'OPEN',
      escalationLevel: 'STAFF'
    }, currentUser?.id || 'res-1', activeRole);
    setShowSubmitModal(false);
    setTitle('');
    setDescription('');
    setPhotoUrl('');
  };

  const handleUpdatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    complaintSLAService.updateSLAPolicy('soc-gvs', selectedPolicyCat, newSlaMinutes, currentUser?.name || 'Admin');
    setShowPolicyModal(false);
  };

  const handleResolveTicket = async (id: string) => {
    await updateComplaintInDb('soc-gvs', id, { status: 'RESOLVED' }, currentUser?.id || 'tech-1', activeRole, 'COMPLAINT_RESOLVED');
  };

  const handleResidentVerify = async (isResolved: boolean) => {
    if (!verifyComplaint) return;
    const newStatus = isResolved ? 'CLOSED' : 'REOPENED';
    await updateComplaintInDb('soc-gvs', verifyComplaint.id, { status: newStatus }, currentUser?.id || 'res-1', activeRole, 'COMPLAINT_VERIFIED');
    setVerifyComplaint(null);
    setFeedbackNotes('');
  };

  const filtered = complaints.filter((c) => {
    if (activeRole === 'resident' && c.residentId !== (currentUser?.id || 'res-1')) {
      return false;
    }
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || c.category === filterCategory;
    return matchesSearch && matchesCategory;
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
              Maintenance &amp; Complaints
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0 }}>
              Green Valley Society · Track maintenance requests &amp; society tickets
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {(activeRole === 'secretary' || activeRole === 'facility_manager' || activeRole === 'admin') && (
            <button
              onClick={() => setShowPolicyModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid var(--aarizo-border, #DCE8EF)',
                color: 'var(--aarizo-navy, #083B56)',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <Sliders size={14} color="var(--aarizo-navy, #083B56)" />
              <span>Configure SLA</span>
            </button>
          )}

          <button
            onClick={() => setShowSubmitModal(true)}
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
            }}
          >
            <Plus size={15} /> File Complaint
          </button>
        </div>
      </div>

      {/* ── Analytics Metric Cards ── */}
      {analytics && (
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 p-3 sm:p-4">
          {/* SLA Compliance */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
              borderRadius: '16px',
              padding: '0.875rem 1rem',
              boxShadow: '0 2px 10px rgba(8, 59, 86, 0.04)',
            }}
          >
            <p style={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--aarizo-text-secondary, #657785)', margin: 0 }}>
              SLA Compliance
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', margin: '0.25rem 0 0.5rem', lineHeight: 1 }}>
              {analytics.slaComplianceRate}%
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)' }}>Target &ge; 90%</span>
              <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={14} color="#059669" />
              </div>
            </div>
          </div>

          {/* Breached */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #FECACA',
              borderRadius: '16px',
              padding: '0.875rem 1rem',
              boxShadow: '0 2px 10px rgba(8, 59, 86, 0.04)',
            }}
          >
            <p style={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--aarizo-text-secondary, #657785)', margin: 0 }}>
              SLA Breached
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#DC2626', margin: '0.25rem 0 0.5rem', lineHeight: 1 }}>
              {analytics.breachedCount}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.6875rem', color: '#DC2626', fontWeight: 700 }}>FM action needed</span>
              <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={14} color="#DC2626" />
              </div>
            </div>
          </div>

          {/* Avg Resolution */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
              borderRadius: '16px',
              padding: '0.875rem 1rem',
              boxShadow: '0 2px 10px rgba(8, 59, 86, 0.04)',
            }}
          >
            <p style={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--aarizo-text-secondary, #657785)', margin: 0 }}>
              Avg Resolution
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: '0.25rem 0 0.5rem', lineHeight: 1 }}>
              {analytics.avgResolutionTimeHours} <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>hrs</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)' }}>All categories</span>
              <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--aarizo-pale-blue, #F4FAFE)', border: '1px solid var(--aarizo-border, #DCE8EF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={14} color="var(--aarizo-blue, #176B91)" />
              </div>
            </div>
          </div>

          {/* Total Tickets */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border-soft, #E8F1F5)',
              borderRadius: '16px',
              padding: '0.875rem 1rem',
              boxShadow: '0 2px 10px rgba(8, 59, 86, 0.04)',
            }}
          >
            <p style={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--aarizo-text-secondary, #657785)', margin: 0 }}>
              Total Tickets
            </p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: '0.25rem 0 0.5rem', lineHeight: 1 }}>
              {analytics.totalComplaints}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)' }}>Active pool</span>
              <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--aarizo-pale-blue, #F4FAFE)', border: '1px solid var(--aarizo-border, #DCE8EF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={14} color="var(--aarizo-blue, #176B91)" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Search Bar & Category Pills ── */}
      <div className="max-w-7xl mx-auto w-full" style={{ padding: '0 1rem 0.5rem' }}>
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
            placeholder="Search by ticket ID, title, resident or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.8125rem',
              color: 'var(--aarizo-text, #203746)',
              background: 'transparent',
            }}
          />
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'ALL', label: 'All Categories' },
            { key: 'SECURITY', label: 'Security' },
            { key: 'LIFT', label: 'Lift / Elevator' },
            { key: 'PLUMBING', label: 'Plumbing' },
            { key: 'ELECTRICAL', label: 'Electrical' },
            { key: 'HOUSEKEEPING', label: 'Housekeeping' },
            { key: 'PARKING', label: 'Parking' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: filterCategory === cat.key ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
                border: '1px solid var(--aarizo-border, #DCE8EF)',
                borderRadius: '10px',
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: filterCategory === cat.key ? '#ffffff' : 'var(--aarizo-text, #203746)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Wrench size={13} color={filterCategory === cat.key ? '#ffffff' : 'var(--aarizo-coral, #F06543)'} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Count Heading ── */}
      <div className="max-w-7xl mx-auto w-full" style={{ padding: '0.5rem 1rem 0.25rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--aarizo-text-secondary, #657785)' }}>
          {filtered.length} tickets found
        </span>
      </div>

      {/* ── Tickets List Cards ── */}
      <div className="max-w-7xl mx-auto w-full p-3 sm:p-4 space-y-3">
        {filtered.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid var(--aarizo-border, #DCE8EF)', borderRadius: '16px', padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--aarizo-pale-blue, #F4FAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <Sparkles size={24} color="var(--aarizo-blue, #176B91)" />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0 }}>No Maintenance Tickets Found</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', marginTop: '0.25rem' }}>
              All maintenance dispatch operations are within SLA standards.
            </p>
          </div>
        ) : (
          filtered.map((c) => {
            const isBreached = c.isBreached;

            return (
              <div
                key={c.id}
                style={{
                  background: '#ffffff',
                  border: `1px solid ${isBreached ? '#FECACA' : 'var(--aarizo-border-soft, #E8F1F5)'}`,
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Header Row: ID, Title & Category */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        color: 'var(--aarizo-navy, #083B56)',
                        background: 'var(--aarizo-pale-blue, #F4FAFE)',
                        border: '1px solid var(--aarizo-border, #DCE8EF)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                      }}
                    >
                      {c.id}
                    </span>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--aarizo-text, #203746)', margin: 0 }}>
                      {c.title}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        color: 'var(--aarizo-navy, #083B56)',
                        background: 'var(--aarizo-light-blue, #EAF6FC)',
                        border: '1px solid var(--aarizo-border, #DCE8EF)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {c.category}
                    </span>
                    {c.reopenCount > 0 && (
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          color: '#DC2626',
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <RotateCcw size={10} color="#DC2626" />
                        <span>Reopened &times;{c.reopenCount}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.75rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, lineHeight: 1.5 }}>
                  {c.description}
                </p>

                {/* Metadata Tags Row */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--aarizo-text, #203746)',
                      background: 'var(--aarizo-pale-blue, #F4FAFE)',
                      border: '1px solid var(--aarizo-border, #DCE8EF)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <MapPin size={12} color="var(--aarizo-blue, #176B91)" />
                    <span>{c.location}</span>
                  </span>

                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--aarizo-text, #203746)',
                      background: 'var(--aarizo-pale-blue, #F4FAFE)',
                      border: '1px solid var(--aarizo-border, #DCE8EF)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <User size={12} color="var(--aarizo-blue, #176B91)" />
                    <span>{c.assignedToName || 'Unassigned'}</span>
                  </span>

                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      color: c.urgency === 'CRITICAL' || c.urgency === 'HIGH' ? '#DC2626' : c.urgency === 'MEDIUM' ? '#D97706' : '#059669',
                      background: c.urgency === 'CRITICAL' || c.urgency === 'HIGH' ? '#FEF2F2' : c.urgency === 'MEDIUM' ? '#FFFBEB' : '#ECFDF5',
                      border: `1px solid ${c.urgency === 'CRITICAL' || c.urgency === 'HIGH' ? '#FECACA' : c.urgency === 'MEDIUM' ? '#FDE68A' : '#A7F3D0'}`,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {c.urgency}
                  </span>
                </div>

                {/* Escalation Matrix & Action Button Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    paddingTop: '0.625rem',
                    borderTop: '1px solid var(--aarizo-border, #DCE8EF)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', background: 'var(--aarizo-pale-blue, #F4FAFE)', border: '1px solid var(--aarizo-border, #DCE8EF)', padding: '0.25rem 0.625rem', borderRadius: '8px' }}>
                      ESCALATION LEVEL: <span style={{ color: 'var(--aarizo-coral, #F06543)' }}>{c.escalationLevel}</span>
                    </div>

                    {isBreached ? (
                      <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', padding: '0.2rem 0.5rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertTriangle size={11} color="#DC2626" />
                        <span>SLA BREACHED</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.625rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.2rem 0.5rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Timer size={11} color="#059669" />
                        <span>SLA: {c.slaMinutes}m</span>
                      </span>
                    )}
                  </div>

                  {c.status === 'VERIFICATION_REQUIRED' && activeRole === 'resident' && (
                    <button
                      onClick={() => setVerifyComplaint(c)}
                      style={{
                        padding: '0.45rem 0.875rem',
                        borderRadius: '10px',
                        background: '#059669',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <CheckSquare size={14} color="#ffffff" />
                      <span>Confirm Resolution</span>
                    </button>
                  )}

                  {c.status !== 'CLOSED' && c.status !== 'VERIFICATION_REQUIRED' && (
                    <button
                      onClick={() => handleResolveTicket(c.id)}
                      style={{
                        padding: '0.45rem 0.875rem',
                        borderRadius: '10px',
                        background: 'var(--aarizo-coral, #F06543)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(240, 101, 67, 0.2)',
                      }}
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* â”€â”€ SLA Policy Modal â”€â”€ */}
      <Modal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        title="Configure SLA Policy"
        subtitle="Set resolution thresholds and escalation limits per category"
        maxWidth="480px"
      >
        <form onSubmit={handleUpdatePolicy} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Service Category</label>
            <select
              value={selectedPolicyCat}
              onChange={(e) => setSelectedPolicyCat(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#176B91]/20 focus:border-[#176B91]"
            >
              <option value="SECURITY">Security (Current: 15m)</option>
              <option value="LIFT">Elevator / Lift (Current: 30m)</option>
              <option value="PLUMBING">Plumbing (Current: 4h)</option>
              <option value="ELECTRICAL">Electrical (Current: 2h)</option>
              <option value="HOUSEKEEPING">Housekeeping (Current: 3h)</option>
              <option value="PARKING">Parking (Current: 1h)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Resolution SLA (Minutes)</label>
            <input
              type="number"
              value={newSlaMinutes}
              onChange={(e) => setNewSlaMinutes(Number(e.target.value))}
              min={5}
              max={10080}
              className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B91]/20 focus:border-[#176B91]"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Tickets unresolved beyond this window auto-escalate up the committee chain.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setShowPolicyModal(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 text-white font-bold rounded-xl text-xs shadow-sm transition" style={{ background: 'var(--aarizo-blue, #176B91)' }}>
              Save Policy
            </button>
          </div>
        </form>
      </Modal>

      {/* â”€â”€ Resident Verification Modal â”€â”€ */}
      <Modal
        isOpen={Boolean(verifyComplaint)}
        onClose={() => setVerifyComplaint(null)}
        title="Resident Verification"
        subtitle="Confirm ticket resolution before it is archived"
        maxWidth="440px"
      >
        {verifyComplaint && (
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Ticket</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{verifyComplaint.title}</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{verifyComplaint.description}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Feedback / Notes (Optional)</label>
              <textarea
                placeholder="Share comments on work quality or any pending items..."
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#176B91]/20 focus:border-[#176B91] resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleResidentVerify(false)}
                className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <XCircle size={14} /> Not Resolved
              </button>
              <button
                type="button"
                onClick={() => handleResidentVerify(true)}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <CheckCircle size={14} /> Confirm &amp; Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* â”€â”€ File New Complaint Modal â”€â”€ */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Log Maintenance Complaint"
        subtitle="Open an urgent work order with real-time SLA countdown"
        maxWidth="520px"
      >
        <form onSubmit={handleCreateComplaint} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Complaint Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Main Kitchen Pipeline Pressure Leakage"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B91]/20 focus:border-[#176B91] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#176B91]/20 focus:border-[#176B91]"
              >
                <option value="PLUMBING">Plumbing (4h SLA)</option>
                <option value="ELECTRICAL">Electrical (2h SLA)</option>
                <option value="LIFT">Lift / Elevator (30m)</option>
                <option value="SECURITY">Security (15m SLA)</option>
                <option value="HOUSEKEEPING">Housekeeping (3h)</option>
                <option value="PARKING">Parking (1h SLA)</option>
                <option value="OTHER">Other (24h SLA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Urgency *</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High (Fast-track FM)</option>
                <option value="CRITICAL">Critical – Emergency</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Location / Flat *</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Tower B · Flat B-1204 or Basement 1"
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B91]/20 focus:border-[#176B91] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Provide specific details about the malfunction or problem..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B91]/20 focus:border-[#176B91] transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Attach Photo / Proof (Optional)</label>
            <FileUpload
              label=""
              category="tickets"
              accept="image/*,application/pdf"
              maxSizeMB={5}
              currentUrl={photoUrl}
              onUploadSuccess={(url) => setPhotoUrl(url)}
              onRemove={() => setPhotoUrl('')}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-white font-bold rounded-xl text-xs shadow-sm transition"
              style={{ background: 'var(--aarizo-blue, #176B91)' }}
            >
              Submit &amp; Start SLA Timer
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

