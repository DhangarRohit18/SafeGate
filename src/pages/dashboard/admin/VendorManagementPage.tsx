import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Download,
  ShieldCheck,
  Store,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  FileText,
  CreditCard,
  Briefcase,
  History,
  UserCheck,
  Ban,
  Mail,
  ArrowLeft,
  Search,
  BarChart,
} from 'lucide-react';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { Form, FormField } from '../../../components/ui/Form';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { DocumentList } from '../../../components/common/DocumentList';
import { FileUploader } from '../../../components/common/FileUploader';
import {
  vendorRepository,
  vendorDocumentRepository,
  vendorServiceRepository,
  vendorRequestRepository,
} from '../../../repositories/vendors';
import type {
  VendorProfile,
  VendorDocument,
  VendorService,
  VendorRequest,
} from '../../../domains/vendors/types';
import { VendorPerformanceHub } from '../../../domains/vendors';

const CATEGORY_PILLS = [
  { id: 'ALL', label: 'All Vendors' },
  { id: 'WATER_SUPPLY', label: 'Water Supply' },
  { id: 'CLEANING', label: 'Cleaning' },
  { id: 'ELECTRICIAN', label: 'Electrical' },
  { id: 'PLUMBING', label: 'Plumbing' },
  { id: 'ELEVATOR_MAINTENANCE', label: 'Elevators' },
  { id: 'SECURITY_AGENCY', label: 'Security' },
  { id: 'LANDSCAPING', label: 'Landscaping' },
];

export const VendorManagementPage: React.FC = () => {
  const currentSocietyId = 'soc-gvs';

  // Live Firestore Real-Time Query
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [syncState, setSyncState] = useState<'LIVE' | 'SYNCING' | 'OFFLINE'>('SYNCING');

  useEffect(() => {
    setSyncState('SYNCING');
    const unsub = vendorRepository.subscribe(currentSocietyId, (list) => {
      setVendors(list);
      setSyncState('LIVE');
    });
    return () => unsub();
  }, [currentSocietyId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [activeSectionTab, setActiveSectionTab] = useState<'DIRECTORY' | 'SCORECARD' | 'VAULT'>('DIRECTORY');

  // Create / Invite Vendor Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState('WATER_SUPPLY');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');

  // Vendor Details & Audit Inspection Modal
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [vendorDetailTab, setVendorDetailTab] = useState<'docs' | 'services' | 'jobs' | 'payments' | 'audit'>('docs');
  const [vendorDocs, setVendorDocs] = useState<VendorDocument[]>([]);
  const [vendorServices, setVendorServices] = useState<VendorService[]>([]);
  const [vendorJobs, setVendorJobs] = useState<VendorRequest[]>([]);

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'info';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'info',
    action: async () => {},
  });

  // Load details when selected vendor changes
  useEffect(() => {
    if (!selectedVendor) return;
    const unsubDocs = vendorDocumentRepository.subscribeByVendor(selectedVendor.uid, (d) => setVendorDocs(d));
    const unsubServices = vendorServiceRepository.subscribeByVendor(selectedVendor.uid, (s) => setVendorServices(s));
    const unsubJobs = vendorRequestRepository.subscribeByVendor(selectedVendor.uid, (j) => setVendorJobs(j));

    return () => {
      unsubDocs();
      unsubServices();
      unsubJobs();
    };
  }, [selectedVendor]);

  // Handle Create or Invite Vendor
  const handleCreateOrInviteVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactPerson) return;

    const vendorUid = `vendor-${Date.now().toString().slice(-6)}`;
    await vendorRepository.create({
      uid: vendorUid,
      societyId: currentSocietyId,
      companyName,
      category,
      contactPerson,
      phone,
      email,
      address,
      status: isInviting ? 'PENDING' : 'ACTIVE',
      approvalStatus: isInviting ? 'PENDING' : 'APPROVED',
      rating: 5.0,
      totalReviews: 0,
      totalJobs: 0,
      verifiedDocumentsCount: documentUrl ? 1 : 0,
    } as any);

    if (documentUrl) {
      await vendorDocumentRepository.create({
        societyId: currentSocietyId,
        vendorId: vendorUid,
        documentType: 'AGREEMENT',
        title: documentName || 'Initial Vendor Agreement',
        fileUrl: documentUrl,
        fileName: documentName,
        status: isInviting ? 'PENDING' : 'VERIFIED',
      } as any);
    }

    setIsAddModalOpen(false);
    setCompanyName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setDocumentUrl('');
    setDocumentName('');
  };

  // Vendor Action Handlers with Confirmation
  const promptApprove = (v: VendorProfile) => {
    setConfirmDialog({
      isOpen: true,
      title: `Approve Vendor "${v.companyName}"?`,
      message: 'Approving will grant this vendor immediate catalog access and allow them to receive service bookings from residents.',
      confirmText: 'Approve & Activate',
      variant: 'info',
      action: async () => {
        await vendorRepository.approveVendor(v.id);
      },
    });
  };

  const promptReject = (v: VendorProfile) => {
    setConfirmDialog({
      isOpen: true,
      title: `Reject Vendor Application "${v.companyName}"?`,
      message: 'This will reject the vendor onboarding submission. The vendor will be notified to revise their documentation.',
      confirmText: 'Reject Application',
      variant: 'danger',
      action: async () => {
        await vendorRepository.rejectVendor(v.id, 'Does not meet society statutory compliance criteria');
      },
    });
  };

  const promptSuspend = (v: VendorProfile) => {
    setConfirmDialog({
      isOpen: true,
      title: `Suspend Vendor "${v.companyName}"?`,
      message: 'Suspending will immediately hide the vendor services from residents and freeze new requests.',
      confirmText: 'Suspend Vendor',
      variant: 'danger',
      action: async () => {
        await vendorRepository.suspendVendor(v.id);
      },
    });
  };

  const promptReactivate = (v: VendorProfile) => {
    setConfirmDialog({
      isOpen: true,
      title: `Reactivate Vendor "${v.companyName}"?`,
      message: 'Reactivating will restore public service visibility and allow resident bookings.',
      confirmText: 'Reactivate',
      variant: 'info',
      action: async () => {
        await vendorRepository.reactivateVendor(v.id);
      },
    });
  };

  const handleVerifyDocument = async (docId: string) => {
    await vendorDocumentRepository.verifyDocument(docId, 'Admin');
  };

  const handleRejectDocument = async (docId: string) => {
    await vendorDocumentRepository.rejectDocument(docId, 'Document unreadable or invalid credentials', 'Admin');
  };

  // Filter vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter || v.approvalStatus === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || v.category.toUpperCase().includes(categoryFilter.toUpperCase());
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [vendors, searchQuery, statusFilter, categoryFilter]);

  const activeVendorsCount = vendors.filter((v) => v.status === 'ACTIVE').length;
  const pendingVendorsCount = vendors.filter((v) => v.approvalStatus === 'PENDING').length;
  const uniqueCategoriesCount = new Set(vendors.map((v) => v.category)).size;

  const columns: Column<VendorProfile>[] = [
    { key: 'companyName', header: 'Vendor / Company', sortable: true },
    { key: 'category', header: 'Service Category' },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      render: (v) => (
        <div>
          <div className="font-semibold text-slate-800">{v.contactPerson}</div>
          <div className="text-xs text-slate-500">{v.phone}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (v) => (
        <StatusBadge
          label={v.status}
          variant={
            v.status === 'ACTIVE'
              ? 'success'
              : v.status === 'SUSPENDED' || v.status === 'REJECTED'
              ? 'danger'
              : 'warning'
          }
        />
      ),
    },
    {
      key: 'approvalStatus',
      header: 'Admin Approval',
      render: (v) => (
        <StatusBadge
          label={v.approvalStatus || 'PENDING'}
          variant={
            v.approvalStatus === 'APPROVED'
              ? 'success'
              : v.approvalStatus === 'REJECTED'
              ? 'danger'
              : 'warning'
          }
        />
      ),
    },
    {
      key: 'actions' as any,
      header: 'Actions',
      render: (v) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedVendor(v);
              setVendorDetailTab('docs');
            }}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#EAF6FC] text-[#083B56] text-xs font-semibold cursor-pointer transition-colors"
            title="Inspect & Verify"
          >
            <Eye size={14} />
          </button>

          {v.approvalStatus === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => promptApprove(v)}
                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold cursor-pointer transition-colors"
                title="Approve Vendor"
              >
                <CheckCircle2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => promptReject(v)}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer transition-colors"
                title="Reject Vendor"
              >
                <XCircle size={14} />
              </button>
            </>
          )}

          {v.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => promptSuspend(v)}
              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold cursor-pointer transition-colors"
              title="Suspend Vendor"
            >
              <Ban size={14} />
            </button>
          )}

          {v.status === 'SUSPENDED' && (
            <button
              type="button"
              onClick={() => promptReactivate(v)}
              className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold cursor-pointer transition-colors"
              title="Reactivate Vendor"
            >
              <UserCheck size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100%', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: '2.5rem' }}>
      {/* ── Subheader Bar matching Residents, Domestic Help, Parking & Towers tabs ── */}
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
            onClick={() => window.history.back()}
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Vendor Management &amp; Procurement
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px', background: '#EAF6FC', color: '#083B56', border: '1px solid #DCE8EF' }}>
                {syncState}
              </span>
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Manage approved society suppliers, verify compliance documents &amp; track jobs
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => {
              setIsInviting(true);
              setIsAddModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.875rem',
              borderRadius: '10px',
              background: '#ffffff',
              color: 'var(--aarizo-navy, #083B56)',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
              whiteSpace: 'nowrap',
            }}
          >
            <Mail size={15} style={{ color: 'var(--aarizo-coral, #F06543)' }} /> Invite Vendor
          </button>
          <button
            type="button"
            onClick={() => {
              setIsInviting(false);
              setIsAddModalOpen(true);
            }}
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
            <Plus size={15} /> Onboard Vendor
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 space-y-5">
        {/* Clean Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '14px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>TOTAL VENDORS</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)' }}>{vendors.length}</span>
              <span style={{ fontSize: '0.6875rem', color: '#657785', display: 'block', marginTop: 2 }}>Registered suppliers</span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'var(--aarizo-card-blue, #F4FAFE)', border: '1px solid var(--aarizo-border, #DCE8EF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aarizo-navy, #083B56)', flexShrink: 0 }}>
              <Store size={20} />
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '14px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>ACTIVE VENDORS</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{activeVendorsCount}</span>
              <span style={{ fontSize: '0.6875rem', color: '#657785', display: 'block', marginTop: 2 }}>Verified &amp; operating</span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
              <ShieldCheck size={20} />
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '14px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>PENDING APPROVALS</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: pendingVendorsCount > 0 ? '#D97706' : '#059669' }}>{pendingVendorsCount}</span>
              <span style={{ fontSize: '0.6875rem', color: '#657785', display: 'block', marginTop: 2 }}>Awaiting action</span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', flexShrink: 0 }}>
              <AlertTriangle size={20} />
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '14px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>SERVICE CATEGORIES</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)' }}>{uniqueCategoriesCount}</span>
              <span style={{ fontSize: '0.6875rem', color: '#657785', display: 'block', marginTop: 2 }}>Essential utilities</span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#F3E8FF', border: '1px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA', flexShrink: 0 }}>
              <Layers size={20} />
            </div>
          </div>
        </div>

        {/* ── Main Section Sub-Tabs Navigation Bar ── */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '0.25rem' }}>
          {[
            { id: 'DIRECTORY', label: `Vendor Directory (${vendors.length})`, icon: Store },
            { id: 'SCORECARD', label: 'Scorecard Intelligence', icon: BarChart },
            { id: 'VAULT', label: 'Contracts & Compliance Vault', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSectionTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSectionTab(tab.id as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  background: isActive ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
                  color: isActive ? '#ffffff' : 'var(--aarizo-navy, #083B56)',
                  border: isActive ? '1px solid var(--aarizo-coral, #F06543)' : '1px solid var(--aarizo-border, #DCE8EF)',
                  borderRadius: '10px',
                  padding: '0.55rem 0.95rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(240, 101, 67, 0.25)' : '0 1px 3px rgba(8, 59, 86, 0.04)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease-in-out',
                }}
              >
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── SUB-TAB 1: VENDOR DIRECTORY & ONBOARDING ── */}
        {activeSectionTab === 'DIRECTORY' && (
          <div className="space-y-4">
            {/* Category Quick Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
              {CATEGORY_PILLS.map((pill) => {
                const isActive = categoryFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setCategoryFilter(pill.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      background: isActive ? '#F06543' : '#ffffff',
                      color: isActive ? '#ffffff' : '#083B56',
                      border: isActive ? '1px solid #F06543' : '1px solid #DCE8EF',
                      borderRadius: '10px',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 2px 8px rgba(240, 101, 67, 0.25)' : '0 1px 3px rgba(8, 59, 86, 0.04)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s ease-in-out',
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Main Vendor Directory Card */}
            <div className="bg-white rounded-2xl border border-[#DCE8EF] p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-[#083B56]">Vendor Directory</h3>
                  <p className="text-xs text-slate-500 font-medium">Live synchronized with Firestore</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search vendor or category..."
                      style={{ paddingLeft: '2.35rem' }}
                      className="w-full pr-3 py-2 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] focus:bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] transition-all"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-[#DCE8EF] bg-white text-[#083B56] font-extrabold focus:outline-none focus:ring-2 focus:ring-[#F06543]/30 shrink-0 cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending Review</option>
                    <option value="ACTIVE">Active</option>
                    <option value="APPROVED">Approved</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <DataTable
                columns={columns}
                data={filteredVendors}
                keyExtractor={(v) => v.id}
                pageSize={8}
                mobileRender={(v) => (
                  <MobileDataCard
                    title={v.companyName}
                    subtitle={v.category}
                    status={
                      <StatusBadge
                        label={v.status}
                        variant={v.status === 'ACTIVE' ? 'success' : 'danger'}
                      />
                    }
                    attributes={[
                      { label: 'Contact', value: `${v.contactPerson} (${v.phone})` },
                      { label: 'Approval', value: v.approvalStatus || 'PENDING' },
                    ]}
                    actions={
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVendor(v);
                          setVendorDetailTab('docs');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#F06543] text-white text-xs font-bold shadow-2xs"
                      >
                        Manage
                      </button>
                    }
                  />
                )}
              />
            </div>
          </div>
        )}

        {/* ── SUB-TAB 2: SCORECARD INTELLIGENCE ── */}
        {activeSectionTab === 'SCORECARD' && <VendorPerformanceHub />}

        {/* ── SUB-TAB 3: COMPLIANCE & CONTRACTS VAULT ── */}
        {activeSectionTab === 'VAULT' && (
          <DocumentList
            societyId={currentSocietyId}
            entityType="vendor"
            title="Society Vendor Contracts & Compliance Vault"
          />
        )}

      {/* Onboard / Invite Vendor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={isInviting ? 'Invite New Society Vendor' : 'Onboard Society Vendor'}
      >
        <Form onSubmit={handleCreateOrInviteVendor}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField label="Company Name *">
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Pure Aqua Solutions Pvt Ltd"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#176B91]"
                />
              </FormField>
              <FormField label="Service Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#176B91]"
                >
                  <option value="WATER_SUPPLY">Water Supply</option>
                  <option value="CLEANING">Cleaning &amp; Housekeeping</option>
                  <option value="ELECTRICIAN">Electrical Services</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="WASTE_MANAGEMENT">Waste Management</option>
                  <option value="ELEVATOR_MAINTENANCE">Elevator Maintenance</option>
                  <option value="SECURITY_AGENCY">Security Agency</option>
                  <option value="LANDSCAPING">Landscaping</option>
                  <option value="INTERNET">Internet &amp; Telecom</option>
                  <option value="OTHER">Other Services</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField label="Contact Person *">
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#176B91]"
                />
              </FormField>
              <FormField label="Phone Number *">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9822100445"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#176B91]"
                />
              </FormField>
            </div>

            <FormField label="Email Address">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. vendor@supplier.com"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#176B91]"
              />
            </FormField>

            <FormField label="Registered Office Address">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Office 101, Business Bay, Pune"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#176B91]"
              />
            </FormField>

            <div className="pt-2">
              <FileUploader
                label="Contract / Trade License PDF"
                description="Upload PDF or image to Firebase Storage"
                societyId={currentSocietyId}
                entityType="vendor"
                onUploadSuccess={(res) => {
                  setDocumentUrl(res.downloadUrl);
                  setDocumentName(res.name);
                }}
              />
              {documentName && (
                <p className="text-xs text-emerald-600 mt-1 font-semibold">Attached: {documentName}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs sm:text-sm hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#176B91] hover:bg-[#083B56] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                {isInviting ? 'Send Invitation' : 'Onboard Vendor'}
              </button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Vendor Inspection & Audit Detail Modal */}
      {selectedVendor && (
        <Modal
          isOpen={!!selectedVendor}
          onClose={() => setSelectedVendor(null)}
          title={selectedVendor.companyName}
          subtitle={`${selectedVendor.contactPerson} • ${selectedVendor.phone} • ${selectedVendor.category}`}
          icon={<Store className="w-5 h-5 text-[#F06543]" />}
          maxWidth="700px"
          footer={
            <button
              type="button"
              onClick={() => setSelectedVendor(null)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Close Inspection
            </button>
          }
        >
          <div className="space-y-4">
            {/* Modal Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2.5 overflow-x-auto">
              {[
                { id: 'docs', label: `Documents (${vendorDocs.length})`, icon: ShieldCheck },
                { id: 'services', label: `Services (${vendorServices.length})`, icon: ShoppingBag },
                { id: 'jobs', label: `Jobs / Orders (${vendorJobs.length})`, icon: Briefcase },
                { id: 'payments', label: 'Payments', icon: CreditCard },
                { id: 'audit', label: 'Audit History', icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = vendorDetailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setVendorDetailTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#FFF0EC] text-[#F06543] border border-[#FDF0ED]'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB: Documents Verification */}
            {vendorDetailTab === 'docs' && (
              <div className="space-y-3">
                {vendorDocs.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-400">No documents uploaded for this vendor.</p>
                  </div>
                ) : (
                  vendorDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#F06543]" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{doc.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {doc.documentType} {doc.expiryDate ? `· Exp: ${doc.expiryDate}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge
                          label={doc.status}
                          variant={
                            doc.status === 'VERIFIED'
                              ? 'success'
                              : doc.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                        />
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700"
                            title="Open Document"
                          >
                            <Download size={14} />
                          </a>
                        )}
                        {doc.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleVerifyDocument(doc.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                            >
                              Verify
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectDocument(doc.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: Services Offered */}
            {vendorDetailTab === 'services' && (
              <div className="space-y-2">
                {vendorServices.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No services published yet.</p>
                ) : (
                  vendorServices.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900">{s.title}</span>
                        <p className="text-[11px] text-slate-500">{s.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">₹{s.price}</span>
                        <StatusBadge label={s.status} variant={s.status === 'ACTIVE' ? 'success' : 'neutral'} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: Jobs / Orders */}
            {vendorDetailTab === 'jobs' && (
              <div className="space-y-2">
                {vendorJobs.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No jobs on record.</p>
                ) : (
                  vendorJobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50"
                    >
                      <div>
                        <span className="text-xs font-mono font-bold text-[#083B56]">{j.orderNumber}</span>
                        <p className="text-xs text-slate-800">
                          {j.serviceTitle} · {j.residentName} ({j.flatCode})
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge label={j.status} variant={j.status === 'COMPLETED' ? 'success' : 'warning'} />
                        <span className="text-xs font-black text-slate-900">₹{j.price}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: Payments */}
            {vendorDetailTab === 'payments' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500">Total Fulfilled Volume</span>
                  <h4 className="text-xl font-black text-[#083B56]">
                    ₹
                    {vendorJobs
                      .filter((j) => j.paymentStatus === 'PAID')
                      .reduce((sum, j) => sum + (j.price || 0), 0)
                      .toLocaleString('en-IN')}
                  </h4>
                </div>
              </div>
            )}

            {/* TAB: Audit History */}
            {vendorDetailTab === 'audit' && (
              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span>Vendor Record Registered</span>
                  <span className="font-semibold text-slate-800">System Admin</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span>Status: {selectedVendor.status}</span>
                  <span className="font-semibold text-slate-800">Current</span>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}


      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          await confirmDialog.action();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
      />
    </div>
  </div>
);
};

export default VendorManagementPage;
