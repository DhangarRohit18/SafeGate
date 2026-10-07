import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Inbox,
  Briefcase,
  CreditCard,
  FileText,
  ShieldCheck,
  Star,
  User,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Edit3,
  Trash2,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  XCircle,
} from 'lucide-react';
import { StatusBadge, ConfirmDialog } from '../../components/ui';
import { Modal } from '../../components/ui/Modal';
import { FileUploader } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { VendorProfilePage } from './vendor/VendorProfilePage';
import {
  vendorRepository,
  vendorServiceRepository,
  vendorRequestRepository,
  vendorDocumentRepository,
} from '../../repositories/vendors';
import type {
  VendorProfile,
  VendorService,
  VendorRequest,
  VendorDocument,
  PricingType,
  ServiceAvailability,
  VendorRequestStatus,
  VendorDocumentType,
} from '../../domains/vendors/types';

export const VendorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const vendorUid = currentUser?.uid || currentUser?.id || 'user-vendor-01';
  const societyId = currentUser?.societyId || 'soc-gvs';

  type ActiveTab =
    | 'dashboard'
    | 'services'
    | 'requests'
    | 'finances'
    | 'documents'
    | 'reviews'
    | 'profile';

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Sync route URL with active tab
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.endsWith('/profile')) {
      setActiveTab('profile');
    } else if (path.endsWith('/services')) {
      setActiveTab('services');
    } else if (path.endsWith('/requests') || path.endsWith('/jobs') || path.endsWith('/portal')) {
      setActiveTab('requests');
    } else if (path.endsWith('/finances')) {
      setActiveTab('finances');
    } else if (path.endsWith('/documents') || path.endsWith('/kyc')) {
      setActiveTab('documents');
    } else if (path.endsWith('/reviews')) {
      setActiveTab('reviews');
    }
  }, [location.pathname]);

  // Real-time state
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [services, setServices] = useState<VendorService[]>([]);
  const [requests, setRequests] = useState<VendorRequest[]>([]);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [syncStatus, setSyncStatus] = useState<'LIVE' | 'SYNCING' | 'OFFLINE'>('SYNCING');

  // Service Modal state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    category: 'CLEANING',
    price: 499,
    pricingType: 'FIXED' as PricingType,
    availability: 'AVAILABLE' as ServiceAvailability,
    images: [] as string[],
  });

  // Request Action Modal state
  const [selectedRequest, setSelectedRequest] = useState<VendorRequest | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Document Upload state
  const [docUploadType, setDocUploadType] = useState<VendorDocumentType>('GST_CERTIFICATE');
  const [docTitle, setDocTitle] = useState('');
  const [docExpiryDate, setDocExpiryDate] = useState('');
  const [docUploadSuccess, setDocUploadSuccess] = useState<string | null>(null);

  // Confirm delete dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'service' } | null>(null);

  // Setup Real-time Listeners
  useEffect(() => {
    setSyncStatus('SYNCING');

    const unsubProfile = vendorRepository.subscribeVendorByUid(vendorUid, (p) => {
      if (p) setProfile(p);
      setSyncStatus('LIVE');
    });

    const unsubServices = vendorServiceRepository.subscribeByVendor(vendorUid, (servList) => {
      setServices(servList);
      setSyncStatus('LIVE');
    });

    const unsubRequests = vendorRequestRepository.subscribeByVendor(vendorUid, (reqList) => {
      setRequests(reqList);
      setSyncStatus('LIVE');
    });

    const unsubDocs = vendorDocumentRepository.subscribeByVendor(vendorUid, (docList) => {
      setDocuments(docList);
      setSyncStatus('LIVE');
    });

    return () => {
      unsubProfile();
      unsubServices();
      unsubRequests();
      unsubDocs();
    };
  }, [vendorUid]);

  // Derived KPI Stats
  const activeServicesCount = useMemo(() => services.filter((s) => s.status === 'ACTIVE').length, [services]);
  const pendingRequestsCount = useMemo(() => requests.filter((r) => r.status === 'PENDING').length, [requests]);
  const completedJobsCount = useMemo(() => requests.filter((r) => r.status === 'COMPLETED').length, [requests]);
  const totalRevenue = useMemo(() => {
    return requests
      .filter((r) => r.paymentStatus === 'PAID')
      .reduce((sum, r) => sum + (r.price || 0), 0);
  }, [requests]);
  const pendingPayments = useMemo(() => {
    return requests
      .filter((r) => r.status === 'COMPLETED' && r.paymentStatus !== 'PAID')
      .reduce((sum, r) => sum + (r.price || 0), 0);
  }, [requests]);

  const reviewsList = useMemo(() => {
    return requests.filter((r) => r.rating !== undefined && r.rating > 0);
  }, [requests]);

  const averageRating = useMemo(() => {
    if (reviewsList.length === 0) return 4.9;
    const sum = reviewsList.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Number((sum / reviewsList.length).toFixed(1));
  }, [reviewsList]);

  // Document expiry warnings
  const expiringDocsCount = useMemo(() => {
    const now = new Date();
    const thirtyDaysAhead = new Date(Date.now() + 30 * 86400000);
    return documents.filter((d) => {
      if (!d.expiryDate) return false;
      const exp = new Date(d.expiryDate);
      return exp >= now && exp <= thirtyDaysAhead;
    }).length;
  }, [documents]);

  // Handle Service Creation / Edit
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.title.trim()) return;

    try {
      if (editingServiceId) {
        await vendorServiceRepository.update(editingServiceId, {
          title: serviceForm.title,
          description: serviceForm.description,
          category: serviceForm.category,
          price: Number(serviceForm.price),
          pricingType: serviceForm.pricingType,
          availability: serviceForm.availability,
          images: serviceForm.images,
        });
      } else {
        await vendorServiceRepository.create({
          vendorId: vendorUid,
          vendorName: profile?.companyName || currentUser?.name || 'Verified Vendor',
          societyId,
          title: serviceForm.title,
          description: serviceForm.description,
          category: serviceForm.category,
          price: Number(serviceForm.price),
          pricingType: serviceForm.pricingType,
          availability: serviceForm.availability,
          images: serviceForm.images,
          status: 'ACTIVE',
        } as any);
      }

      setIsServiceModalOpen(false);
      setEditingServiceId(null);
      setServiceForm({
        title: '',
        description: '',
        category: 'CLEANING',
        price: 499,
        pricingType: 'FIXED',
        availability: 'AVAILABLE',
        images: [],
      });
    } catch (err) {
      console.error('Failed to save service:', err);
    }
  };

  const handleOpenEditService = (service: VendorService) => {
    setEditingServiceId(service.id);
    setServiceForm({
      title: service.title,
      description: service.description,
      category: service.category,
      price: service.price,
      pricingType: service.pricingType,
      availability: service.availability,
      images: service.images || [],
    });
    setIsServiceModalOpen(true);
  };

  const handleToggleService = async (service: VendorService) => {
    try {
      await vendorServiceRepository.toggleStatus(service.id, service.status !== 'ACTIVE');
    } catch (err) {
      console.error('Failed to toggle service status:', err);
    }
  };

  // Request actions
  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;
    try {
      await vendorRequestRepository.updateStatus(selectedRequest.id, 'ACCEPTED', actionNotes);
      setIsAcceptModalOpen(false);
      setSelectedRequest(null);
      setActionNotes('');
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    try {
      await vendorRequestRepository.updateStatus(selectedRequest.id, 'REJECTED', actionNotes);
      setIsRejectModalOpen(false);
      setSelectedRequest(null);
      setActionNotes('');
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  const handleAdvanceRequestStatus = async (requestId: string, nextStatus: VendorRequestStatus) => {
    try {
      await vendorRequestRepository.updateStatus(requestId, nextStatus);
    } catch (err) {
      console.error('Failed to update request status:', err);
    }
  };

  const handleMarkPaid = async (requestId: string) => {
    try {
      await vendorRequestRepository.recordPayment(requestId, `PAY-${Date.now().toString().slice(-6)}`);
    } catch (err) {
      console.error('Failed to mark request as paid:', err);
    }
  };

  // Document upload handler
  const handleDocUploaded = async (uploadRes: { downloadUrl: string; name: string; size: number }) => {
    try {
      await vendorDocumentRepository.create({
        societyId,
        vendorId: vendorUid,
        documentType: docUploadType,
        title: docTitle.trim() || docUploadType.replace(/_/g, ' '),
        fileUrl: uploadRes.downloadUrl,
        fileName: uploadRes.name,
        fileSize: uploadRes.size,
        status: 'PENDING',
        expiryDate: docExpiryDate || undefined,
      } as any);

      setDocUploadSuccess('Document successfully uploaded for society verification!');
      setDocTitle('');
      setDocExpiryDate('');
      setTimeout(() => setDocUploadSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to save vendor document:', err);
    }
  };

  const isApproved = profile?.approvalStatus === 'APPROVED' || profile?.status === 'ACTIVE' || currentUser?.role === 'admin';

  if (activeTab === 'profile') {
    return <VendorProfilePage />;
  }

  return (
    <div style={{ background: '#F7FBFE', minHeight: '100vh', paddingBottom: '4rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* ── Page Context & Subheader ── */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #DCE8EF', padding: '0.875rem 1.25rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              type="button"
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
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#083B56', letterSpacing: '-0.01em' }}>
                  {profile?.companyName || 'Vendor Operating Hub'}
                </h1>
                <span
                  style={{
                    background: isApproved ? '#ECFDF5' : '#FFFBEB',
                    border: `1px solid ${isApproved ? '#A7F3D0' : '#FDE68A'}`,
                    color: isApproved ? '#059669' : '#D97706',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isApproved ? '#10B981' : '#F59E0B', display: 'inline-block' }}></span>
                  {isApproved ? 'Verified Vendor' : 'KYC Pending'} • {syncStatus}
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#657785', fontWeight: 500 }}>
                Manage services, resident requests, and bookings.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setEditingServiceId(null);
                setServiceForm({
                  title: '',
                  description: '',
                  category: 'CLEANING',
                  price: 499,
                  pricingType: 'FIXED',
                  availability: 'AVAILABLE',
                  images: [],
                });
                setIsServiceModalOpen(true);
              }}
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
              <span>Create Service</span>
            </button>
            <Link
              to="/vendor/onboarding"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid #DCE8EF',
                color: '#083B56',
                fontSize: '0.8rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
              }}
            >
              <ShieldCheck size={16} style={{ color: '#059669' }} />
              <span>KYC &amp; Docs</span>
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '1.25rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* ── Compact Banner for KYC Warning ── */}
        {!isApproved && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '14px', padding: '0.85rem 1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#92400E' }}>
                  KYC Verification Pending
                </span>
                <span style={{ fontSize: '0.78rem', color: '#B45309', marginLeft: '0.5rem', fontWeight: 500 }}>
                  Complete your statutory documents to unlock public catalog listings and resident inquiries.
                </span>
              </div>
            </div>
            <Link
              to="/vendor/onboarding"
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                background: '#D97706',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 800,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              Complete KYC
            </Link>
          </div>
        )}

        {/* ── Responsive KPI Summary Metrics ── */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[
            { label: 'ACTIVE SERVICES', value: activeServicesCount, sub: 'Catalog offerings', icon: ShoppingBag, color: '#0284C7', bg: '#F4FAFE', border: '#BAE6FD' },
            { label: 'PENDING REQUESTS', value: pendingRequestsCount, sub: 'Awaiting response', icon: Inbox, color: pendingRequestsCount > 0 ? '#D97706' : '#059669', bg: pendingRequestsCount > 0 ? '#FFFBEB' : '#ECFDF5', border: pendingRequestsCount > 0 ? '#FDE68A' : '#A7F3D0' },
            { label: 'COMPLETED JOBS', value: completedJobsCount, sub: 'Fulfillments', icon: CheckCircle2, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
            { label: 'SETTLED REVENUE', value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: 'Total earned', icon: TrendingUp, color: '#9333EA', bg: '#F3E8FF', border: '#E9D5FF' },
            { label: 'PENDING PAYOUTS', value: `₹${pendingPayments.toLocaleString('en-IN')}`, sub: 'Uncollected balance', icon: CreditCard, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
            { label: 'RATING', value: `${averageRating} ★`, sub: `${reviewsList.length} feedback`, icon: Star, color: '#F06543', bg: '#FFF0EC', border: '#FDF0ED' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #DCE8EF',
                  borderRadius: '14px',
                  padding: '0.875rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#657785', letterSpacing: '0.04em' }}>
                    {stat.label}
                  </span>
                  <div style={{ width: 28, height: 28, borderRadius: '8px', background: stat.bg, border: `1px solid ${stat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>
                    <Icon size={14} />
                  </div>
                </div>
                <div style={{ marginTop: '0.35rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#083B56', lineHeight: 1.1 }}>
                    {stat.value}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#657785', display: 'block', marginTop: 2, fontWeight: 500 }}>
                    {stat.sub}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Clean Tab Bar Navigation ── */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '0.25rem' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'services', label: `Services (${services.length})`, icon: ShoppingBag },
            { id: 'requests', label: `Requests & Jobs (${requests.length})`, icon: Inbox },
            { id: 'finances', label: 'Finances & Invoices', icon: CreditCard },
            { id: 'documents', label: `Compliance (${documents.length})`, icon: ShieldCheck },
            { id: 'reviews', label: `Reviews (${reviewsList.length})`, icon: Star },
            { id: 'profile', label: 'Vendor Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  background: isActive ? '#F06543' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#083B56',
                  border: isActive ? '1px solid #F06543' : '1px solid #DCE8EF',
                  borderRadius: '10px',
                  padding: '0.5rem 0.875rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(240, 101, 67, 0.25)' : '0 1px 3px rgba(8, 59, 86, 0.04)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease-in-out',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: DASHBOARD OVERVIEW ── */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {/* Inbound Resident Requests Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#083B56', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={16} style={{ color: '#D97706' }} /> Inbound Resident Requests
                    </h3>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#657785' }}>Respond quickly to maintain top response rates</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('requests')}
                    style={{ background: 'none', border: 'none', color: '#F06543', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    View All ({pendingRequestsCount})
                  </button>
                </div>

                {requests.filter((r) => r.status === 'PENDING').length === 0 ? (
                  <div style={{ padding: '1.75rem 1rem', textAlign: 'center', border: '1px dashed #DCE8EF', borderRadius: '12px', background: '#F8FAFC' }}>
                    <CheckCircle2 size={24} style={{ color: '#10B981', margin: '0 auto 0.35rem' }} />
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#083B56' }}>All caught up!</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#657785' }}>No pending resident requests waiting for action.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {requests
                      .filter((r) => r.status === 'PENDING')
                      .slice(0, 3)
                      .map((req) => (
                        <div
                          key={req.id}
                          style={{ padding: '0.75rem 0.875rem', borderRadius: '12px', border: '1px solid #FDE68A', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#083B56' }}>{req.serviceTitle}</span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '1px 6px', borderRadius: '6px', background: '#FEF3C7', color: '#92400E' }}>₹{req.price}</span>
                            </div>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#657785' }}>
                              {req.residentName} ({req.flatCode}) · {req.scheduledDate}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRequest(req);
                                setIsAcceptModalOpen(true);
                              }}
                              style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: '#059669', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRequest(req);
                                setIsRejectModalOpen(true);
                              }}
                              style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: '#FEE2E2', color: '#B91C1C', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Compliance Health Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#083B56', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldCheck size={16} style={{ color: '#059669' }} /> Compliance Health
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('documents')}
                    style={{ background: 'none', border: 'none', color: '#F06543', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Manage Vault
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', borderRadius: '10px', background: '#F8FAFC' }}>
                    <span style={{ fontSize: '0.75rem', color: '#657785', fontWeight: 600 }}>Account Status</span>
                    <StatusBadge label={profile?.status || 'PENDING'} variant={profile?.status === 'ACTIVE' ? 'success' : 'warning'} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', borderRadius: '10px', background: '#F8FAFC' }}>
                    <span style={{ fontSize: '0.75rem', color: '#657785', fontWeight: 600 }}>Admin Approval</span>
                    <StatusBadge label={profile?.approvalStatus || 'PENDING'} variant={profile?.approvalStatus === 'APPROVED' ? 'success' : 'warning'} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', borderRadius: '10px', background: '#F8FAFC' }}>
                    <span style={{ fontSize: '0.75rem', color: '#657785', fontWeight: 600 }}>Verified Documents</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#083B56' }}>
                      {documents.filter((d) => d.status === 'VERIFIED').length} / {documents.length}
                    </span>
                  </div>
                  {expiringDocsCount > 0 && (
                    <div style={{ padding: '0.625rem 0.75rem', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertTriangle size={14} style={{ color: '#D97706' }} />
                      <span>{expiringDocsCount} document(s) expiring within 30 days</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Jobs Pipeline */}
            <div style={{ background: '#FFFFFF', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#083B56' }}>Active Jobs Pipeline</h3>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#657785' }}>Live operational execution status</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('requests')}
                  style={{ background: 'none', border: 'none', color: '#F06543', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  View All ({requests.length})
                </button>
              </div>

              {requests.filter((r) => ['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(r.status)).length === 0 ? (
                <div style={{ padding: '1.75rem 1rem', textAlign: 'center', border: '1px dashed #DCE8EF', borderRadius: '12px', background: '#F8FAFC' }}>
                  <Briefcase size={24} style={{ color: '#94A3B8', margin: '0 auto 0.35rem' }} />
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#083B56' }}>No active jobs in progress</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {requests
                    .filter((r) => ['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'].includes(r.status))
                    .map((job) => (
                      <div
                        key={job.id}
                        style={{ padding: '0.875rem', borderRadius: '12px', border: '1px solid #DCE8EF', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 800, color: '#657785' }}>{job.orderNumber}</span>
                          <StatusBadge label={job.status} variant={job.status === 'IN_PROGRESS' ? 'info' : 'warning'} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#083B56' }}>{job.serviceTitle}</h4>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#657785' }}>
                            {job.residentName} · {job.flatCode} · {job.timeSlot || job.scheduledDate}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.35rem', borderTop: '1px solid #E2E8F0' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#083B56' }}>₹{job.price}</span>
                          <div>
                            {job.status === 'ACCEPTED' && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceRequestStatus(job.id, 'IN_PROGRESS')}
                                style={{ padding: '0.35rem 0.65rem', borderRadius: '8px', background: '#0284C7', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                              >
                                Start Job
                              </button>
                            )}
                            {job.status === 'IN_PROGRESS' && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceRequestStatus(job.id, 'COMPLETED')}
                                style={{ padding: '0.35rem 0.65rem', borderRadius: '8px', background: '#059669', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                              >
                                Mark Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: SERVICES MANAGEMENT ── */}
        {activeTab === 'services' && (
          <div style={{ background: '#FFFFFF', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#083B56' }}>Service Offerings &amp; Tariffs</h3>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#657785' }}>Create and publish services for Green Valley residents</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingServiceId(null);
                  setServiceForm({
                    title: '',
                    description: '',
                    category: 'CLEANING',
                    price: 499,
                    pricingType: 'FIXED',
                    availability: 'AVAILABLE',
                    images: [],
                  });
                  setIsServiceModalOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.5rem 0.95rem',
                  borderRadius: '10px',
                  background: '#F06543',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                }}
              >
                <Plus size={15} /> Add New Service
              </button>
            </div>

            {services.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', border: '1px dashed #DCE8EF', borderRadius: '14px', background: '#F8FAFC' }}>
                <ShoppingBag size={28} style={{ color: '#94A3B8', margin: '0 auto 0.35rem' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#083B56' }}>No Services Registered</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#657785' }}>Add your first service offering to receive resident bookings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((serv) => (
                  <div
                    key={serv.id}
                    style={{ background: '#FFFFFF', border: '1px solid #DCE8EF', borderRadius: '14px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 1px 3px rgba(8, 59, 86, 0.03)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#657785' }}>
                          {serv.category}
                        </span>
                        <h4 style={{ margin: '0.1rem 0 0', fontSize: '0.88rem', fontWeight: 800, color: '#083B56' }}>{serv.title}</h4>
                      </div>
                      <StatusBadge label={serv.status} variant={serv.status === 'ACTIVE' ? 'success' : 'neutral'} />
                    </div>

                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#657785', lineHeight: 1.35 }}>
                      {serv.description || 'Professional service by verified technician.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#657785' }}>Price: </span>
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#083B56' }}>₹{serv.price}</span>
                        <span style={{ fontSize: '0.68rem', color: '#657785', marginLeft: '3px' }}>({serv.pricingType})</span>
                      </div>
                      <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '6px', background: '#F1F5F9', color: '#475569', fontWeight: 700 }}>
                        {serv.availability}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleService(serv)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#657785' }}
                      >
                        {serv.status === 'ACTIVE' ? (
                          <>
                            <ToggleRight size={16} style={{ color: '#059669' }} /> Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={16} style={{ color: '#94A3B8' }} /> Inactive
                          </>
                        )}
                      </button>

                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditService(serv)}
                          style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #DCE8EF', background: '#F8FAFC', color: '#083B56', cursor: 'pointer' }}
                          title="Edit Service"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete({ id: serv.id, type: 'service' });
                            setDeleteConfirmOpen(true);
                          }}
                          style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}
                          title="Delete Service"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: REQUESTS & JOBS ── */}
        {activeTab === 'requests' && (
          <div style={{ background: '#FFFFFF', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#083B56' }}>Resident Booking Requests &amp; Orders</h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#657785' }}>Live operational request queue and execution status</p>
            </div>

            {requests.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', border: '1px dashed #DCE8EF', borderRadius: '14px', background: '#F8FAFC' }}>
                <Inbox size={28} style={{ color: '#94A3B8', margin: '0 auto 0.35rem' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#083B56' }}>No Booking Requests</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#657785' }}>Resident requests will appear here as soon as bookings arrive.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {requests.map((req) => (
                  <div
                    key={req.id}
                    style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #DCE8EF', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 800, color: '#0284C7' }}>{req.orderNumber}</span>
                        <StatusBadge
                          label={req.status}
                          variant={
                            req.status === 'COMPLETED'
                              ? 'success'
                              : req.status === 'REJECTED' || req.status === 'CANCELLED'
                              ? 'danger'
                              : 'warning'
                          }
                        />
                      </div>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#083B56' }}>₹{req.price}</span>
                    </div>

                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#083B56' }}>{req.serviceTitle}</h4>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#657785' }}>
                        Resident: <strong style={{ color: '#083B56' }}>{req.residentName}</strong> ({req.flatCode}) · Phone: {req.residentPhone || '9876543210'}
                      </p>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#657785' }}>
                        Schedule: {req.scheduledDate} ({req.timeSlot || 'General'})
                      </p>
                      {req.notes && (
                        <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#475569', fontStyle: 'italic', background: '#F8FAFC', padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          "{req.notes}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                      {req.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRequest(req);
                              setIsAcceptModalOpen(true);
                            }}
                            style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', background: '#059669', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                          >
                            Accept Request
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRequest(req);
                              setIsRejectModalOpen(true);
                            }}
                            style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', background: '#FEE2E2', color: '#B91C1C', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {req.status === 'ACCEPTED' && (
                        <button
                          type="button"
                          onClick={() => handleAdvanceRequestStatus(req.id, 'IN_PROGRESS')}
                          style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', background: '#0284C7', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                        >
                          Start Job
                        </button>
                      )}

                      {req.status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          onClick={() => handleAdvanceRequestStatus(req.id, 'COMPLETED')}
                          style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', background: '#059669', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                        >
                          Mark Completed
                        </button>
                      )}

                      {req.status === 'COMPLETED' && req.paymentStatus !== 'PAID' && (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(req.id)}
                          style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', background: '#7C3AED', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                        >
                          Record Payment Received
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: FINANCES & INVOICES ── */}
        {activeTab === 'finances' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#657785', fontWeight: 600 }}>Total Revenue Collected</span>
                <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#657785' }}>Settled into registered account</p>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#657785', fontWeight: 600 }}>Pending Receivables</span>
                <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#D97706' }}>
                  ₹{pendingPayments.toLocaleString('en-IN')}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#657785' }}>Uncollected fulfilled orders</p>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#657785', fontWeight: 600 }}>Settlement Cycle</span>
                <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#083B56' }}>T+2 Days</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#657785' }}>Direct Bank IMPS / NEFT</p>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#083B56' }}>Billing Invoices &amp; Settlements</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {requests
                  .filter((r) => r.status === 'COMPLETED')
                  .map((inv) => (
                    <div
                      key={inv.id}
                      style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #DCE8EF', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={20} style={{ color: '#083B56', flexShrink: 0 }} />
                        <div>
                          <p style={{ margin: 0, fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 800, color: '#083B56' }}>
                            INV-{inv.orderNumber}
                          </p>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#657785' }}>
                            {inv.serviceTitle} · {inv.residentName} ({inv.flatCode}) · {inv.scheduledDate}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#083B56' }}>₹{inv.price}</span>
                          <span style={{ display: 'block', fontSize: '0.68rem', color: '#657785' }}>Incl. 18% GST</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => alert(`Downloading Tax Invoice INV-${inv.orderNumber}`)}
                          style={{ padding: '0.4rem', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #DCE8EF', color: '#083B56', cursor: 'pointer' }}
                          title="Download PDF"
                        >
                          <FileText size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: COMPLIANCE & DOCUMENTS ── */}
        {activeTab === 'documents' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Upload Box */}
            <div style={{ background: '#FFFFFF', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#083B56' }}>Upload Compliance Document</h3>

              {docUploadSuccess && (
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} />
                  <span>{docUploadSuccess}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>
                    Document Category
                  </label>
                  <select
                    value={docUploadType}
                    onChange={(e) => setDocUploadType(e.target.value as VendorDocumentType)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #DCE8EF', background: '#FFFFFF', color: '#083B56', fontSize: '0.82rem', fontWeight: 700, outline: 'none' }}
                  >
                    <option value="GST_CERTIFICATE">GST Certificate</option>
                    <option value="BUSINESS_LICENSE">Business License</option>
                    <option value="INSURANCE">Commercial Insurance</option>
                    <option value="AGREEMENT">Society Agreement</option>
                    <option value="IDENTITY_PROOF">Identity Proof</option>
                    <option value="CERTIFICATES">Quality Certificates</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>
                    Title / Identifier
                  </label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. GST Registration 2026"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #DCE8EF', background: '#FFFFFF', color: '#083B56', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>
                    Expiry Date (optional)
                  </label>
                  <input
                    type="date"
                    value={docExpiryDate}
                    onChange={(e) => setDocExpiryDate(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #DCE8EF', background: '#FFFFFF', color: '#083B56', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <FileUploader
                  label="Select PDF or Image to Upload"
                  societyId={societyId}
                  entityType="vendor"
                  entityId={vendorUid}
                  onUploadSuccess={handleDocUploaded}
                />
              </div>
            </div>

            {/* Document Vault List */}
            <div style={{ background: '#FFFFFF', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#083B56' }}>
                Uploaded Compliance Vault ({documents.length})
              </h3>

              {documents.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', border: '1px dashed #DCE8EF', borderRadius: '12px', background: '#F8FAFC' }}>
                  <FileText size={24} style={{ color: '#94A3B8', margin: '0 auto 0.35rem' }} />
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#657785' }}>No compliance documents uploaded yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{ padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid #DCE8EF', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                        <FileText size={18} style={{ color: '#083B56', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#083B56', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.title}
                          </p>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#657785' }}>
                            {doc.documentType} {doc.expiryDate ? `· Exp: ${doc.expiryDate}` : ''}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
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
                            style={{ padding: '0.35rem', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #DCE8EF', color: '#083B56', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="View Document"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 6: REVIEWS ── */}
        {activeTab === 'reviews' && (
          <div style={{ background: '#FFFFFF', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#083B56' }}>Resident Ratings &amp; Feedback</h3>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#657785' }}>Customer satisfaction score and verified comments</p>
              </div>
              <div style={{ padding: '0.4rem 0.85rem', borderRadius: '10px', background: '#FFF0EC', border: '1px solid #FDF0ED', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={16} style={{ color: '#F06543', fill: '#F06543' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F06543' }}>{averageRating} / 5.0</span>
              </div>
            </div>

            {reviewsList.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', border: '1px dashed #DCE8EF', borderRadius: '14px', background: '#F8FAFC' }}>
                <Star size={28} style={{ color: '#94A3B8', margin: '0 auto 0.35rem' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#083B56' }}>No ratings yet</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#657785' }}>Complete jobs for residents to collect ratings.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reviewsList.map((rev) => (
                  <div
                    key={rev.id}
                    style={{ padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid #DCE8EF', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#083B56' }}>
                        {rev.residentName} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#657785' }}>({rev.flatCode})</span>
                      </span>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            style={{ color: i < (rev.rating || 0) ? '#F06543' : '#CBD5E1', fill: i < (rev.rating || 0) ? '#F06543' : 'none' }}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.reviewNotes && (
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', fontStyle: 'italic' }}>
                        "{rev.reviewNotes}"
                      </p>
                    )}
                    <span style={{ fontSize: '0.7rem', color: '#657785' }}>Job: {rev.serviceTitle}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile tab is rendered by VendorProfilePage component directly */}
      </div>

      {/* ── STANDARDIZED CREATE / EDIT SERVICE MODAL ── */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={editingServiceId ? 'Edit Service Offering' : 'Create New Service Offering'}
        subtitle="Specify category, pricing rate sheet, and availability"
        icon={<ShoppingBag className="w-5 h-5 text-[#F06543]" />}
        maxWidth="540px"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsServiceModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const formEl = document.getElementById('vendor-service-form') as HTMLFormElement;
                if (formEl) formEl.requestSubmit();
              }}
              style={{
                background: '#F06543',
                color: '#ffffff',
                fontWeight: 800,
                padding: '0.625rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                fontSize: '0.75rem',
              }}
            >
              {editingServiceId ? 'Save Changes' : 'Publish Service'}
            </button>
          </>
        }
      >
        <form id="vendor-service-form" onSubmit={handleSaveService} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#083B56] mb-1">
              Service Title *
            </label>
            <input
              type="text"
              required
              value={serviceForm.title}
              onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
              placeholder="e.g. 20L Mineral Water Delivery"
              className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                Category *
              </label>
              <select
                value={serviceForm.category}
                onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-extrabold focus:outline-none focus:border-[#F06543]"
              >
                <option value="WATER_SUPPLY">Water Supply</option>
                <option value="CLEANING">Cleaning</option>
                <option value="ELECTRICIAN">Electrical</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="PEST_CONTROL">Pest Control</option>
                <option value="APPLIANCE">Appliance Repair</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={serviceForm.price}
                onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                Pricing Structure
              </label>
              <select
                value={serviceForm.pricingType}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, pricingType: e.target.value as PricingType })
                }
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-extrabold focus:outline-none focus:border-[#F06543]"
              >
                <option value="FIXED">Fixed Price</option>
                <option value="STARTING_AT">Starting At</option>
                <option value="HOURLY">Hourly Rate</option>
                <option value="PER_UNIT">Per Unit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                Availability
              </label>
              <select
                value={serviceForm.availability}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    availability: e.target.value as ServiceAvailability,
                  })
                }
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-extrabold focus:outline-none focus:border-[#F06543]"
              >
                <option value="AVAILABLE">Available Always</option>
                <option value="WEEKDAYS_ONLY">Weekdays Only</option>
                <option value="WEEKENDS_ONLY">Weekends Only</option>
                <option value="UNAVAILABLE">Temporarily Unavailable</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#083B56] mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              placeholder="Details of what is included in this service..."
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
            />
          </div>
        </form>
      </Modal>

      {/* ── STANDARDIZED ACCEPT REQUEST MODAL ── */}
      {isAcceptModalOpen && selectedRequest && (
        <Modal
          isOpen={isAcceptModalOpen}
          onClose={() => setIsAcceptModalOpen(false)}
          title="Accept Resident Request"
          subtitle={`Order #${selectedRequest.orderNumber} • ${selectedRequest.serviceTitle}`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          maxWidth="480px"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsAcceptModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptRequest}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition"
              >
                Confirm Acceptance
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600 font-medium">
              Confirm acceptance for <strong className="text-slate-900">{selectedRequest.serviceTitle}</strong> requested by {selectedRequest.residentName} ({selectedRequest.flatCode}).
            </p>
            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                Dispatch Note or Arrival Time (optional)
              </label>
              <input
                type="text"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="e.g. Technician will arrive by 10:30 AM"
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ── STANDARDIZED REJECT REQUEST MODAL ── */}
      {isRejectModalOpen && selectedRequest && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="Decline Booking Request"
          subtitle={`Order #${selectedRequest.orderNumber}`}
          icon={<XCircle className="w-5 h-5 text-rose-600" />}
          maxWidth="480px"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectRequest}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition"
              >
                Decline Request
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600 font-medium">
              Specify reason why you cannot fulfill this request for {selectedRequest.residentName}.
            </p>
            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                Reason *
              </label>
              <textarea
                rows={2}
                required
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="e.g. Fully booked for this time slot"
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for deletions */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          if (itemToDelete?.type === 'service') {
            await vendorServiceRepository.delete(itemToDelete.id);
          }
          setDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        title="Delete Service Offering?"
        message="Are you sure you want to remove this service from your catalog? Existing orders will not be affected."
        confirmText="Delete Service"
        variant="danger"
      />
    </div>
  );
};

export default VendorDashboard;
