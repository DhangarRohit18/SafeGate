import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  Store,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  ChevronRight,
  Bell,
  Edit3,
  X,
  ShoppingBag,
  MapPin,
  Check,
  AlertTriangle,
  User,
  Key,
} from 'lucide-react';
import { vendorRepository } from '../../../repositories/vendors';
import type { VendorProfile } from '../../../domains/vendors/types';

export const VendorProfilePage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const vendorUid = currentUser?.uid || currentUser?.id || 'user-vendor-01';
  const societyName = currentUser?.societyName || 'Green Valley Society';

  // Vendor Profile State
  const [profileData, setProfileData] = useState<VendorProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    companyName: currentUser?.name || 'Priya Cleaning Services',
    category: 'CLEANING',
    contactPerson: currentUser?.name || 'Priya Sharma',
    phone: currentUser?.phone || '9844556677',
    email: currentUser?.email || 'priya.vendor@greenvalley.com',
    address: 'Plot 45, Commercial Hub, Sector 4, City Center',
    serviceArea: 'Towers A, B, C & Clubhouse',
    operatingHours: '08:00 AM – 07:00 PM (Mon-Sat)',
    status: 'ACTIVE',
    verificationStatus: 'APPROVED',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(profileForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load Vendor Data from Backend / Repository
  useEffect(() => {
    async function loadVendorData() {
      try {
        const vData = await vendorRepository.getVendorByUid(vendorUid);
        if (vData) {
          setProfileData(vData);
          setProfileForm({
            companyName: vData.companyName || profileForm.companyName,
            category: vData.category || profileForm.category,
            contactPerson: vData.contactPerson || profileForm.contactPerson,
            phone: vData.phone || profileForm.phone,
            email: vData.email || profileForm.email,
            address: vData.address || profileForm.address,
            serviceArea: (vData as any).serviceArea || profileForm.serviceArea,
            operatingHours: (vData as any).operatingHours || profileForm.operatingHours,
            status: vData.status || 'ACTIVE',
            verificationStatus: (vData as any).verificationStatus || (vData.approvalStatus === 'APPROVED' ? 'APPROVED' : 'PENDING'),
          });
        }
      } catch (e) {
        console.warn('Using default vendor profile state:', e);
      }
    }
    loadVendorData();
  }, [vendorUid]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);
    try {
      if (profileData?.id) {
        await vendorRepository.update(profileData.id, {
          companyName: editForm.companyName,
          category: editForm.category as any,
          contactPerson: editForm.contactPerson,
          phone: editForm.phone,
          email: editForm.email,
          address: editForm.address,
          serviceArea: editForm.serviceArea,
          operatingHours: editForm.operatingHours,
        } as any);
      } else {
        await vendorRepository.update(vendorUid, {
          companyName: editForm.companyName,
          category: editForm.category as any,
          contactPerson: editForm.contactPerson,
          phone: editForm.phone,
          email: editForm.email,
          address: editForm.address,
          serviceArea: editForm.serviceArea,
          operatingHours: editForm.operatingHours,
        } as any);
      }

      setProfileForm(editForm);
      setSaveSuccess('Business profile updated successfully!');
      setTimeout(() => {
        setSaveSuccess(null);
        setIsEditModalOpen(false);
      }, 900);
    } catch (err: any) {
      console.error('Failed to update vendor profile:', err);
      setSaveError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Simulate API call for password change
      await new Promise((res) => setTimeout(res, 600));
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setPasswordSuccess(null);
        setIsPasswordModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setPasswordError('Failed to change password. Please verify current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const isApproved = profileForm.verificationStatus === 'APPROVED' || profileForm.status === 'ACTIVE';

  return (
    <div style={{ backgroundColor: 'var(--aarizo-page, #F7FBFE)', minHeight: '100vh' }}>
      {/* ── Page Header Banner ── */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #DCE8EF',
          padding: '1.25rem 1rem',
          boxShadow: '0 1px 3px rgba(8, 59, 86, 0.03)',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#083B56',
                letterSpacing: '-0.01em',
              }}
            >
              Vendor Profile
            </h1>
            <p
              style={{
                margin: '0.2rem 0 0 0',
                fontSize: '0.8rem',
                color: '#657785',
                fontWeight: 500,
              }}
            >
              Manage your business identity and account information.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: isApproved ? '#059669' : '#D97706',
                background: isApproved ? '#ECFDF5' : '#FFFBEB',
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                border: `1px solid ${isApproved ? '#A7F3D0' : '#FDE68A'}`,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isApproved ? '#10B981' : '#F59E0B',
                }}
              />
              {isApproved ? 'Verified Vendor' : 'KYC Pending'}
            </span>
          </div>
        </div>
      </div>

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
          }}
        >
          {/* Vendor Logo / Initials Avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #083B56 0%, #0D4E72 100%)',
              color: '#E5B842',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.25rem',
              fontWeight: 900,
              boxShadow: '0 6px 18px rgba(8, 59, 86, 0.18)',
              border: '3px solid #ffffff',
            }}
          >
            {profileForm.companyName ? profileForm.companyName.charAt(0).toUpperCase() : 'V'}
          </div>

          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#083B56', margin: 0, letterSpacing: '-0.01em' }}>
              {profileForm.companyName}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#657785', margin: '0.25rem 0 0', fontWeight: 600 }}>
              {profileForm.category.replace(/_/g, ' ')} · {societyName}
            </p>

            <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: isApproved ? '#059669' : '#D97706',
                  background: isApproved ? '#ECFDF5' : '#FFFBEB',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  border: `1px solid ${isApproved ? '#A7F3D0' : '#FDE68A'}`,
                }}
              >
                <CheckCircle2 size={13} /> {isApproved ? 'Verified Vendor' : 'KYC Pending'}
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
                <Store size={13} /> Registered Vendor
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. Contact Information Card ── */}
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
            <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#083B56', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Contact Information
            </h3>
            <button
              onClick={() => {
                setEditForm(profileForm);
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
              <Edit3 size={14} /> Edit Information
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#EAF6FC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#176B91', flexShrink: 0 }}>
                <User size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#8B9AA5', fontWeight: 600, textTransform: 'uppercase' }}>Contact Person</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#083B56' }}>{profileForm.contactPerson}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#EAF6FC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#176B91', flexShrink: 0 }}>
                <Phone size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#8B9AA5', fontWeight: 600, textTransform: 'uppercase' }}>Registered Phone</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#083B56' }}>{profileForm.phone}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#EAF6FC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#176B91', flexShrink: 0 }}>
                <Mail size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#8B9AA5', fontWeight: 600, textTransform: 'uppercase' }}>Official Email</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#083B56' }}>{profileForm.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#EAF6FC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#176B91', flexShrink: 0 }}>
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#8B9AA5', fontWeight: 600, textTransform: 'uppercase' }}>Service Coverage Area</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#083B56' }}>{profileForm.serviceArea}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Business Information Card ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            padding: '1.25rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#083B56', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Business Information
            </h3>
            <button
              onClick={() => {
                setEditForm(profileForm);
                setIsEditModalOpen(true);
              }}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#176B91',
                background: '#F4FAFE',
                border: '1px solid #DCE8EF',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Edit Business Details
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.875rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#657785', fontWeight: 600 }}>Business / Trade Name</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#083B56', marginTop: '0.2rem' }}>{profileForm.companyName}</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.875rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#657785', fontWeight: 600 }}>Primary Category</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#083B56', marginTop: '0.2rem' }}>{profileForm.category.replace(/_/g, ' ')}</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.875rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#657785', fontWeight: 600 }}>Operating Hours</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#083B56', marginTop: '0.2rem' }}>{profileForm.operatingHours}</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0.875rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#657785', fontWeight: 600 }}>Business Address</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#083B56', marginTop: '0.2rem' }}>{profileForm.address}</div>
            </div>
          </div>
        </div>

        {/* ── 4. Vendor Account Status Card ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            padding: '1.25rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
          }}
        >
          <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#083B56', margin: '0 0 0.85rem 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Vendor Account
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F4FAFE', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '0.85rem 1rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#083B56' }}>Vendor Status</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                {profileForm.status}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F4FAFE', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '0.85rem 1rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#083B56' }}>KYC Status</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isApproved ? '#059669' : '#D97706', background: isApproved ? '#ECFDF5' : '#FFFBEB', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                {isApproved ? 'VERIFIED' : 'PENDING'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F4FAFE', border: '1px solid #DCE8EF', borderRadius: '12px', padding: '0.85rem 1rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#083B56' }}>Society</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#083B56' }}>{societyName}</span>
            </div>
          </div>
        </div>

        {/* ── 5. Service Profile Card ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            padding: '1.25rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#EAF6FC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#176B91', flexShrink: 0 }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#083B56', margin: 0 }}>Service Profile</h4>
              <p style={{ fontSize: '0.78rem', color: '#657785', margin: '0.15rem 0 0' }}>
                Primary: {profileForm.category.replace(/_/g, ' ')} · Active Services: 3
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/vendor/portal')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#083B56',
              background: '#F4FAFE',
              border: '1px solid #DCE8EF',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <span>View Services</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── 6. Verification Status Card ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            padding: '1.25rem',
            boxShadow: '0 2px 10px rgba(8, 59, 86, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: isApproved ? '#ECFDF5' : '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isApproved ? '#059669' : '#D97706', flexShrink: 0 }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#083B56', margin: 0 }}>Verification Status</h4>
              <p style={{ fontSize: '0.78rem', color: '#657785', margin: '0.15rem 0 0' }}>
                KYC: {isApproved ? 'Verified Vendor' : 'Pending Verification'} · 3 documents verified
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/vendor/onboarding')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: isApproved ? '#059669' : '#D97706',
              background: isApproved ? '#ECFDF5' : '#FFFBEB',
              border: `1px solid ${isApproved ? '#A7F3D0' : '#FDE68A'}`,
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <span>View KYC &amp; Documents</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── 7. Account & Security Card ── */}
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
            onClick={() => setIsPasswordModalOpen(true)}
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
                <Key size={17} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#083B56' }}>Change Password</div>
                <div style={{ fontSize: '0.72rem', color: '#8B9AA5' }}>Update account authentication credentials</div>
              </div>
            </div>
            <ChevronRight size={16} color="#8B9AA5" />
          </button>

          <button
            onClick={() => navigate('/notifications')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.875rem 1rem',
              border: 'none',
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
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#083B56' }}>Notification Preferences</div>
                <div style={{ fontSize: '0.72rem', color: '#8B9AA5' }}>Configure job alerts &amp; SMS notifications</div>
              </div>
            </div>
            <ChevronRight size={16} color="#8B9AA5" />
          </button>
        </div>

        {/* ── 8. Sign Out Button ── */}
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
          <LogOut size={16} /> Sign Out of Vendor Portal
        </button>
      </div>

      {/* ── 9. Edit Business Profile Modal ── */}
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
              maxWidth: 520,
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#083B56', margin: 0 }}>
                Edit Business Information
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {saveSuccess && (
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Check size={16} /> {saveSuccess}
              </div>
            )}

            {saveError && (
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={16} /> {saveError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                  Company / Trade Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                  Primary Category *
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 700, boxSizing: 'border-box' }}
                >
                  <option value="CLEANING">Cleaning &amp; Sanitization</option>
                  <option value="WATER_SUPPLY">Water Supply</option>
                  <option value="ELECTRICIAN">Electrical Services</option>
                  <option value="PLUMBING">Plumbing &amp; Piping</option>
                  <option value="PEST_CONTROL">Pest Control</option>
                  <option value="APPLIANCE">Appliance Repair</option>
                  <option value="SECURITY_AGENCY">Security Agency</option>
                  <option value="OTHER">General Services</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.contactPerson}
                  onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                  Registered Phone *
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
                  Official Email Address *
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
                  Service Coverage Area
                </label>
                <input
                  type="text"
                  value={editForm.serviceArea}
                  onChange={(e) => setEditForm({ ...editForm, serviceArea: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={editForm.operatingHours}
                  onChange={(e) => setEditForm({ ...editForm, operatingHours: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                  Business Office Address
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
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
                  disabled={isSaving}
                  style={{
                    padding: '0.65rem 1.4rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#F06543',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 3px 12px rgba(240, 101, 67, 0.28)',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 10. Change Password Modal ── */}
      {isPasswordModalOpen && (
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
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#083B56', margin: 0 }}>
                Change Password
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {passwordSuccess && (
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Check size={16} /> {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={16} /> {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#083B56', display: 'block', marginBottom: '0.35rem' }}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem', background: '#F8FAFC', color: '#083B56', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#ffffff', color: '#52788D', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  style={{
                    padding: '0.65rem 1.4rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#083B56',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                    opacity: isChangingPassword ? 0.7 : 1,
                  }}
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProfilePage;
