import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowRight,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  XCircle,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { vendorRepository } from '../../../repositories/vendors/VendorRepository';
import { vendorDocumentRepository } from '../../../repositories/vendors/VendorDocumentRepository';
import type { VendorProfile, VendorDocument, VendorDocumentType } from '../../../domains/vendors/types';
import { FileUploader } from '../../../components/common/FileUploader';
import { StatusBadge } from '../../../components/ui';

export const VendorOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const vendorUid = currentUser?.uid || currentUser?.id || 'user-vendor-01';
  const societyId = currentUser?.societyId || 'soc-gvs';

  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('WATER_SUPPLY');
  const [address, setAddress] = useState('');

  // Document upload state
  const [selectedDocType, setSelectedDocType] = useState<VendorDocumentType>('GST_CERTIFICATE');
  const [docTitle, setDocTitle] = useState('');
  const [docExpiryDate, setDocExpiryDate] = useState('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Subscribe to vendor profile updates in real-time
  useEffect(() => {
    if (!vendorUid) return;

    const unsubVendor = vendorRepository.subscribeVendorByUid(vendorUid, (profile) => {
      if (profile) {
        setVendorProfile(profile);
        setCompanyName(profile.companyName || '');
        setContactPerson(profile.contactPerson || '');
        setEmail(profile.email || currentUser?.email || '');
        setPhone(profile.phone || currentUser?.phone || '');
        setCategory(profile.category || 'WATER_SUPPLY');
        setAddress(profile.address || '');
      } else {
        // Init default from current user
        setCompanyName(currentUser?.name || '');
        setEmail(currentUser?.email || '');
        setPhone(currentUser?.phone || '');
      }
    });

    const unsubDocs = vendorDocumentRepository.subscribeByVendor(vendorUid, (docs) => {
      setDocuments(docs);
    });

    return () => {
      unsubVendor();
      unsubDocs();
    };
  }, [vendorUid, currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const dataToSave = {
        uid: vendorUid,
        societyId,
        companyName,
        contactPerson,
        email,
        phone,
        category,
        address,
        status: vendorProfile?.status || 'PENDING',
        approvalStatus: vendorProfile?.approvalStatus || 'PENDING',
      };

      if (vendorProfile?.id) {
        await vendorRepository.update(vendorProfile.id, dataToSave as any);
      } else {
        await vendorRepository.upsertWithId(vendorUid, dataToSave);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save vendor profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDocumentUploaded = async (uploadRes: { downloadUrl: string; name: string; size: number }) => {
    try {
      await vendorDocumentRepository.create({
        societyId,
        vendorId: vendorUid,
        documentType: selectedDocType,
        title: docTitle.trim() || selectedDocType.replace(/_/g, ' '),
        fileUrl: uploadRes.downloadUrl,
        fileName: uploadRes.name,
        fileSize: uploadRes.size,
        status: 'PENDING',
        expiryDate: docExpiryDate || undefined,
      } as any);

      setUploadSuccessMsg(`${docTitle || selectedDocType} uploaded successfully for verification!`);
      setDocTitle('');
      setDocExpiryDate('');
      setTimeout(() => setUploadSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to record vendor document in Firestore:', err);
    }
  };

  const isApproved = vendorProfile?.approvalStatus === 'APPROVED' || vendorProfile?.status === 'ACTIVE' || currentUser?.role === 'admin' || currentUser?.role === 'secretary';
  const isPending = vendorProfile?.approvalStatus === 'PENDING' && !isApproved;
  const isSuspended = vendorProfile?.status === 'SUSPENDED';
  const isRejected = vendorProfile?.approvalStatus === 'REJECTED';

  return (
    <div style={{ background: 'var(--aarizo-page, #F7FBFE)', minHeight: '100vh', paddingBottom: '5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Subheader Bar */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #DCE8EF', padding: '0.85rem 1.25rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
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
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#083B56' }}>
                  Vendor Onboarding & Compliance Portal
                </h1>
                <span
                  style={{
                    background: isApproved ? '#ECFDF5' : '#FFFBEB',
                    border: `1px solid ${isApproved ? '#A7F3D0' : '#FDE68A'}`,
                    color: isApproved ? '#059669' : '#D97706',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isApproved ? '#10B981' : '#F59E0B', display: 'inline-block' }}></span>
                  {isApproved ? 'VERIFIED VENDOR' : 'KYC PENDING'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#52788D' }}>
                Complete your business profile and upload statutory compliance documents for society admin verification
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '1.25rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Status Callout Banner */}
        {isApproved && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                  Vendor Account Approved & Verified
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  You have full access to society service requests, orders, catalogs, and payouts.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/vendor')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
            >
              <span>Access Vendor Dashboard</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {isPending && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                Application Under Review by Society Committee
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Our management team is reviewing your compliance documents and business registration. Once verified, your account will be activated immediately in real time.
              </p>
            </div>
          </div>
        )}

        {isSuspended && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
            <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-100">
                Account Suspended
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                Your vendor account is temporarily suspended. Please get in touch with the Green Valley Society office to resolve compliance requirements.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-100">
                Application Rejected
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                Your previous submission was not approved. Please verify your statutory documentation, update your profile below, and resubmit.
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Left Column: Vendor Profile Form */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#083B56' }}>Business Profile</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#52788D' }}>Provide official trade details and contacts</p>
              </div>
              <StatusBadge
                label={vendorProfile?.approvalStatus || 'PENDING'}
                variant={isApproved ? 'success' : isRejected ? 'danger' : 'warning'}
              />
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>
                  Company / Agency Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. AquaPure Mineral Water Ltd"
                    style={{
                      width: '100%',
                      paddingLeft: '44px',
                      paddingRight: '12px',
                      paddingTop: '0.55rem',
                      paddingBottom: '0.55rem',
                      borderRadius: '10px',
                      border: '1px solid #DCE8EF',
                      background: '#ffffff',
                      color: '#083B56',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #DCE8EF',
                      background: '#ffffff',
                      color: '#083B56',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>
                    Primary Service Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #DCE8EF',
                      background: '#ffffff',
                      color: '#083B56',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="WATER_SUPPLY">Water Supply</option>
                    <option value="CLEANING">Cleaning &amp; Housekeeping</option>
                    <option value="ELECTRICIAN">Electrical Services</option>
                    <option value="PLUMBING">Plumbing &amp; Sanitary</option>
                    <option value="WASTE_MANAGEMENT">Waste Management</option>
                    <option value="ELEVATOR_MAINTENANCE">Elevator Maintenance</option>
                    <option value="SECURITY_AGENCY">Security Agency</option>
                    <option value="PEST_CONTROL">Pest Control</option>
                    <option value="LANDSCAPING">Gardening &amp; Landscaping</option>
                    <option value="OTHER">Other Professional Services</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>
                    Direct Phone *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9822100445"
                      style={{
                        width: '100%',
                        paddingLeft: '44px',
                        paddingRight: '12px',
                        paddingTop: '0.55rem',
                        paddingBottom: '0.55rem',
                        borderRadius: '10px',
                        border: '1px solid #DCE8EF',
                        background: '#ffffff',
                        color: '#083B56',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>
                    Official Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sales@aquapure.com"
                      style={{
                        width: '100%',
                        paddingLeft: '44px',
                        paddingRight: '12px',
                        paddingTop: '0.55rem',
                        paddingBottom: '0.55rem',
                        borderRadius: '10px',
                        border: '1px solid #DCE8EF',
                        background: '#ffffff',
                        color: '#083B56',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>
                  Registered Business Address
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8', pointerEvents: 'none' }} />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Unit 402, Apex Commercial Complex, Pune"
                    style={{
                      width: '100%',
                      paddingLeft: '44px',
                      paddingRight: '12px',
                      paddingTop: '0.55rem',
                      paddingBottom: '0.55rem',
                      borderRadius: '10px',
                      border: '1px solid #DCE8EF',
                      background: '#ffffff',
                      color: '#083B56',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ paddingTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                {saveSuccess ? (
                  <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Profile details saved!
                  </span>
                ) : <span />}
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    background: '#F06543',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 3px 12px rgba(240, 101, 67, 0.28)',
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Upload Compliance Documents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#083B56' }}>Statutory Documents</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#52788D' }}>Upload documents required for society verification</p>
              </div>

              {uploadSuccessMsg && (
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>
                    Document Category
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value as VendorDocumentType)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #DCE8EF',
                      background: '#ffffff',
                      color: '#083B56',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="GST_CERTIFICATE">GST Certificate</option>
                    <option value="BUSINESS_LICENSE">Business / Trade License</option>
                    <option value="INSURANCE">Commercial Insurance Policy</option>
                    <option value="AGREEMENT">Society Service Agreement</option>
                    <option value="IDENTITY_PROOF">Authorized Signatory ID Proof</option>
                    <option value="CERTIFICATES">Quality / ISO / Safety Certifications</option>
                    <option value="OTHER">Other Supporting Document</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#083B56', marginBottom: '0.35rem' }}>
                      Document Title (optional)
                    </label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="e.g. GSTIN 2026"
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '10px',
                        border: '1px solid #DCE8EF',
                        background: '#ffffff',
                        color: '#083B56',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
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
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '10px',
                        border: '1px solid #DCE8EF',
                        background: '#ffffff',
                        color: '#083B56',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <FileUploader
                  label="Select PDF or Image to Upload"
                  description="Upload to Firebase Storage securely"
                  societyId={societyId}
                  entityType="vendor"
                  entityId={vendorUid}
                  onUploadSuccess={handleDocumentUploaded}
                />
              </div>
            </div>

            {/* Uploaded Documents List */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#52788D' }}>
                Uploaded Documents ({documents.length})
              </h4>

              {documents.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed #DCE8EF', borderRadius: '12px' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#657785' }}>No compliance documents uploaded yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '280px', overflowY: 'auto' }}>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #DCE8EF',
                        background: '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                        <FileText size={18} color="#083B56" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#083B56', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.title}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.72rem', color: '#52788D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: '#F4FAFE',
                              border: '1px solid #DCE8EF',
                              color: '#083B56',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                            }}
                            title="View Document"
                          >
                            <Eye size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorOnboardingPage;
