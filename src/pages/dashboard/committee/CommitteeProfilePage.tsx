import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  Building2,
  Phone,
  Mail,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  CheckCircle2,
  Lock,
  Camera,
  Edit3,
  FileText,
  User,
  X,
  Upload,
  Check,
  Key,
} from 'lucide-react';
import { FileUploader } from '../../../components/common/FileUploader';

export const CommitteeProfilePage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Local state for editable user details with fallback
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || 'Rajesh Mehta',
    phone: currentUser?.phone || '9900112233',
    email: currentUser?.email || 'rajesh.committee@greenvalley.com',
    flatDetails: currentUser?.flatDetails || 'Tower A · Flat 201',
    societyName: currentUser?.societyName || 'Green Valley Society',
    designation: currentUser?.designation || 'Management Committee Member',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(profileData);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return localStorage.getItem('aarizo_committee_avatar') || currentUser?.avatarUrl || '';
  });
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  // Committee Verification Documents State
  const [docs, setDocs] = useState([
    {
      id: 'doc-committee-appointment',
      title: 'Committee Appointment Resolution',
      desc: 'Official society election & appointment document certified by Registrar',
      status: 'VERIFIED',
      filename: 'committee_resolution_2024.pdf',
      updatedAt: '15 Jan 2024',
      url: '#',
    },
    {
      id: 'doc-committee-id',
      title: 'Government Identity Proof (Aadhaar / PAN)',
      desc: 'Executive signatory identity verification record',
      status: 'VERIFIED',
      filename: 'aadhaar_signatory_verified.pdf',
      updatedAt: '10 Feb 2024',
      url: '#',
    },
  ]);

  const [activeUploadDoc, setActiveUploadDoc] = useState<typeof docs[0] | null>(null);

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
    localStorage.setItem('aarizo_committee_avatar', url);
    setIsEditingAvatar(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('SAVING');
    setTimeout(() => {
      setProfileData(editForm);
      try {
        const existing = localStorage.getItem('aarizo_user');
        const userObj = existing ? JSON.parse(existing) : {};
        const updated = {
          ...userObj,
          name: editForm.name,
          phone: editForm.phone,
          email: editForm.email,
          flatDetails: editForm.flatDetails,
        };
        localStorage.setItem('aarizo_user', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save profile to localStorage:', e);
      }
      setSaveStatus('SUCCESS');
      setTimeout(() => {
        setSaveStatus('IDLE');
        setIsEditModalOpen(false);
      }, 600);
    }, 400);
  };

  const getRoleBadgeLabel = () => {
    const role = (currentUser?.role || '').toLowerCase();
    if (role === 'secretary') return 'Society Secretary';
    if (role === 'admin') return 'System Administrator';
    return profileData.designation || 'Management Committee Member';
  };

  return (
    <div style={{ backgroundColor: 'var(--aarizo-page, #F7FBFE)', minHeight: '100%' }}>
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24 flex flex-col gap-4 font-sans">

        {/* ── 1. Profile Hero Card ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #DCE8EF',
            padding: '1.75rem 1.25rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '0.85rem',
            position: 'relative',
          }}
        >
          {/* Avatar Container with Camera Trigger */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                background: '#EAF6FC',
                border: '3px solid #DCE8EF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#083B56',
                fontWeight: 900,
                fontSize: '2.25rem',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(8, 59, 86, 0.08)',
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profileData.name.charAt(0).toUpperCase()
              )}
            </div>
            <button
              onClick={() => setIsEditingAvatar(!isEditingAvatar)}
              title="Update Photo"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#F06543',
                color: '#ffffff',
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              <Camera size={15} />
            </button>
          </div>

          {/* Avatar Edit File Uploader */}
          {isEditingAvatar && (
            <div
              style={{
                width: '100%',
                maxWidth: 380,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '0.875rem',
                marginTop: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#083B56' }}>
                  Upload Committee Photo
                </span>
                <button
                  onClick={() => setIsEditingAvatar(false)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
              <FileUploader
                label="Choose Photo or Take Picture"
                accept="image/*"
                maxSizeMB={5}
                entityType="general"
                entityId={currentUser?.id || 'committee-1'}
                onUploadSuccess={(res) => handleAvatarUpload(res.downloadUrl)}
                onRemove={() => {
                  setAvatarUrl('');
                  localStorage.removeItem('aarizo_committee_avatar');
                }}
              />
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#083B56', margin: 0, letterSpacing: '-0.01em' }}>
              {profileData.name}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#657785', margin: '0.25rem 0 0', fontWeight: 600 }}>
              {getRoleBadgeLabel()} · {profileData.societyName}
            </p>
            <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#059669',
                  background: '#ECFDF5',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  border: '1px solid #A7F3D0',
                }}
              >
                <CheckCircle2 size={13} /> Verified Committee Signatory
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#083B56',
                  background: '#F4FAFE',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  border: '1px solid #DCE8EF',
                }}
              >
                <Shield size={13} /> Executive Signatory Active
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. Personal Information Card ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            padding: '1.25rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#083B56', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Personal Information
            </h3>
            <button
              onClick={() => {
                setEditForm(profileData);
                setIsEditModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#F06543',
                background: '#FFF4F1',
                border: '1px solid #F06543',
                padding: '0.3rem 0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#EAF6FC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#176B91', flexShrink: 0 }}>
                <User size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#8B9AA5', fontWeight: 600, textTransform: 'uppercase' }}>Full Name</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#083B56' }}>{profileData.name}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#EAF6FC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#176B91', flexShrink: 0 }}>
                <Phone size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#8B9AA5', fontWeight: 600, textTransform: 'uppercase' }}>Registered Phone</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#083B56' }}>{profileData.phone}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#EAF6FC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#176B91', flexShrink: 0 }}>
                <Mail size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#8B9AA5', fontWeight: 600, textTransform: 'uppercase' }}>Official Email</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#083B56' }}>{profileData.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#EAF6FC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#176B91', flexShrink: 0 }}>
                <Building2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#8B9AA5', fontWeight: 600, textTransform: 'uppercase' }}>Flat / Unit Details</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#083B56' }}>{profileData.flatDetails}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Committee Role & Portfolio Card ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            padding: '1.25rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
          }}
        >
          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#083B56', margin: '0 0 0.85rem 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Committee Role &amp; Appointment
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.875rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#657785', fontWeight: 600 }}>Official Designation</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#083B56', marginTop: '0.2rem' }}>{profileData.designation}</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.875rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#657785', fontWeight: 600 }}>Elected Tenure</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#083B56', marginTop: '0.2rem' }}>2024 – 2026 Term</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.875rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#657785', fontWeight: 600 }}>Signatory Status</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>Active Signatory</div>
            </div>
          </div>
        </div>

        {/* ── 4. Committee RBAC Access & Permissions ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            padding: '1.25rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Key size={18} color="#083B56" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#083B56', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Committee RBAC Capabilities
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
            {[
              'Review resident NOCs & move permits',
              'Approve vendor maintenance payouts',
              'Access society financial treasury logs',
              'Audit statutory & fire safety filings',
              'Upload & publish governance resolutions',
              'View executive SLA intelligence reports',
            ].map((perm, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F4FAFE', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #DCE8EF' }}>
                <Check size={14} color="#059669" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56' }}>{perm}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. Documents Locker & Verification ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            padding: '1.25rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="#083B56" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#083B56', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Signatory Identity Locker
              </h3>
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
              PostgreSQL Verified
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {docs.map((doc) => (
              <div key={doc.id} style={{ padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <FileText size={18} color="#176B91" style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#083B56' }}>{doc.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#657785', marginTop: '0.15rem' }}>{doc.desc}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.25rem' }}>{doc.filename} · Verified {doc.updatedAt}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                    ✓ Verified
                  </span>
                  <button
                    onClick={() => setActiveUploadDoc(doc)}
                    style={{ fontSize: '0.72rem', fontWeight: 700, color: '#083B56', background: '#ffffff', border: '1px solid #DCE8EF', padding: '0.25rem 0.6rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <Upload size={12} /> Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Document Upload Modal ── */}
        {activeUploadDoc && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(8, 25, 36, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                maxWidth: 440,
                width: '100%',
                padding: '1.25rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#083B56', margin: 0 }}>
                  Upload Signatory Document
                </h3>
                <button
                  onClick={() => setActiveUploadDoc(null)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 1rem 0' }}>
                Uploading: <strong>{activeUploadDoc.title}</strong>
              </p>

              <FileUploader
                label="Snap Photo or Upload PDF/Scan"
                accept="image/*,application/pdf"
                maxSizeMB={15}
                entityType="general"
                entityId={currentUser?.id || 'committee-1'}
                onUploadSuccess={(res) => {
                  const updated = docs.map((d) =>
                    d.id === activeUploadDoc.id ? { ...d, filename: res.name, url: res.downloadUrl, updatedAt: 'Just now' } : d
                  );
                  setDocs(updated);
                  setActiveUploadDoc(null);
                }}
              />

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setActiveUploadDoc(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. Account & Security Options ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
          }}
        >
          <div style={{ padding: '0.875rem 1rem 0.5rem', borderBottom: '1px solid #EBF5FA' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8B9AA5', margin: 0 }}>
              Account &amp; Security
            </h3>
          </div>

          <button
            onClick={() => navigate('/notifications')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.875rem 1rem',
              border: 'none',
              borderBottom: '1px solid #F1F5F9',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#F4FAFE', border: '1px solid #DCE8EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#176B91' }}>
                <Bell size={17} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#083B56' }}>Notification Center &amp; Alerts</div>
                <div style={{ fontSize: '0.72rem', color: '#8B9AA5' }}>Configure executive notification channels</div>
              </div>
            </div>
            <ChevronRight size={16} color="#8B9AA5" />
          </button>
        </div>

        {/* ── 7. Sign Out Button ── */}
        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '0.875rem',
            borderRadius: '14px',
            border: '1px solid #FECACA',
            background: '#FEF2F2',
            color: '#DC2626',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <LogOut size={16} /> Sign Out of Committee Portal
        </button>
      </div>

      {/* ── 8. Edit Profile Modal ── */}
      {isEditModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(8, 25, 36, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: 480,
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#083B56', margin: 0 }}>
                Edit Committee Profile
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                  Registered Phone
                </label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                  Official Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                  Flat / Unit Details
                </label>
                <input
                  type="text"
                  required
                  value={editForm.flatDetails}
                  onChange={(e) => setEditForm({ ...editForm, flatDetails: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#ffffff', color: '#52788D', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveStatus === 'SAVING'}
                  style={{
                    padding: '0.65rem 1.4rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#F06543',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 3px 12px rgba(240, 101, 67, 0.28)',
                  }}
                >
                  {saveStatus === 'SAVING' ? 'Saving...' : saveStatus === 'SUCCESS' ? '✓ Saved!' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitteeProfilePage;
