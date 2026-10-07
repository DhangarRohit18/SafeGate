import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit3,
  Eye,
  Calendar,
  Sparkles,
  MousePointerClick,
  Clock,
  X,
  ArrowLeft,
} from 'lucide-react';
import { StatusBadge, ConfirmDialog, Modal } from '../../../components/ui';
import { FileUploader } from '../../../components/common/FileUploader';
import { advertisementRepository } from '../../../repositories/advertisements/AdvertisementRepository';
import type {
  Advertisement,
  AdTargetAudience,
  AdStatus,
  AdFrequency,
} from '../../../types/advertisement';

export const AdminAdvertisementsPage: React.FC = () => {
  const societyId = 'soc-gvs';

  const [ads, setAds] = useState<Advertisement[]>([]);
  const [syncState, setSyncState] = useState<'LIVE' | 'SYNCING' | 'OFFLINE'>('SYNCING');

  // Real-time listener for society advertisements
  useEffect(() => {
    setSyncState('SYNCING');
    const unsub = advertisementRepository.subscribe(societyId, (list) => {
      setAds(list);
      setSyncState('LIVE');
    });
    return () => unsub();
  }, [societyId]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [audienceFilter, setAudienceFilter] = useState<string>('ALL');

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    description: '',
    imageUrl: '',
    targetAudience: 'ALL' as AdTargetAudience,
    actionLabel: 'Claim Offer',
    actionUrl: '',
    discountCode: '',
    startAt: new Date().toISOString().split('T')[0],
    endAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    priority: 5,
    frequency: 'ONCE_PER_DAY' as AdFrequency,
    status: 'ACTIVE' as AdStatus,
  });

  // Preview modal state
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);

  // Confirm delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    adId: string | null;
    adTitle: string;
  }>({
    isOpen: false,
    adId: null,
    adTitle: '',
  });

  // Derived metrics
  const activeCount = useMemo(() => ads.filter((a) => a.status === 'ACTIVE').length, [ads]);
  const scheduledCount = useMemo(() => ads.filter((a) => a.status === 'SCHEDULED').length, [ads]);
  const expiredCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return ads.filter((a) => a.status === 'EXPIRED' || (a.endAt && a.endAt < today)).length;
  }, [ads]);

  const totalImpressions = useMemo(
    () => ads.reduce((sum, a) => sum + (a.impressionsCount || 0), 0),
    [ads]
  );
  const totalClicks = useMemo(
    () => ads.reduce((sum, a) => sum + (a.clicksCount || 0), 0),
    [ads]
  );
  const ctrPercentage = useMemo(() => {
    if (totalImpressions === 0) return 0;
    return Number(((totalClicks / totalImpressions) * 100).toFixed(1));
  }, [totalImpressions, totalClicks]);

  // Filtered ads
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchStatus = statusFilter === 'ALL' || ad.status === statusFilter;
      const matchAudience = audienceFilter === 'ALL' || ad.targetAudience === audienceFilter;
      return matchStatus && matchAudience;
    });
  }, [ads, statusFilter, audienceFilter]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingAdId(null);
    setFormData({
      title: '',
      tagline: '',
      description: '',
      imageUrl:
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
      targetAudience: 'ALL',
      actionLabel: 'Claim Offer',
      actionUrl: '',
      discountCode: '',
      startAt: new Date().toISOString().split('T')[0],
      endAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      priority: 5,
      frequency: 'ONCE_PER_DAY',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (ad: Advertisement) => {
    setEditingAdId(ad.id);
    setFormData({
      title: ad.title,
      tagline: ad.tagline || '',
      description: ad.description,
      imageUrl: ad.imageUrl,
      targetAudience: ad.targetAudience,
      actionLabel: ad.actionLabel,
      actionUrl: ad.actionUrl,
      discountCode: ad.discountCode || '',
      startAt: ad.startAt.split('T')[0],
      endAt: ad.endAt.split('T')[0],
      priority: ad.priority,
      frequency: ad.frequency,
      status: ad.status,
    });
    setIsModalOpen(true);
  };

  // Save Ad (Create or Update)
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl) return;

    try {
      if (editingAdId) {
        await advertisementRepository.update(editingAdId, {
          ...formData,
        });
      } else {
        await advertisementRepository.createAdvertisement({
          societyId,
          ...formData,
          createdBy: 'ADMIN',
          impressionsCount: 0,
          clicksCount: 0,
        });
      }

      setIsModalOpen(false);
      setEditingAdId(null);
    } catch (err) {
      console.error('Failed to save advertisement:', err);
    }
  };

  // Toggle status between ACTIVE and PAUSED
  const handleToggleStatus = async (ad: Advertisement) => {
    const nextStatus: AdStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await advertisementRepository.updateStatus(ad.id, nextStatus);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Delete Ad
  const handleDeleteAd = async () => {
    if (!deleteDialog.adId) return;
    try {
      await advertisementRepository.delete(deleteDialog.adId);
      setDeleteDialog({ isOpen: false, adId: null, adTitle: '' });
    } catch (err) {
      console.error('Failed to delete ad:', err);
    }
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: '2.5rem' }}>
      {/* ── Subheader Bar matching Residents, Domestic Help, Parking & Vendors tabs ── */}
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
              Advertisement &amp; Campaign Manager
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px', background: '#EAF6FC', color: '#083B56', border: '1px solid #DCE8EF' }}>
                {syncState}
              </span>
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Schedule targeted resident popups, track impressions and conversion clicks
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
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
          <Plus size={15} /> Create Campaign
        </button>
      </div>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 space-y-5">
        {/* Clean Light Stat Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>ACTIVE CAMPAIGNS</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{activeCount}</span>
              <span style={{ fontSize: '0.6875rem', color: '#657785', display: 'block', marginTop: 2 }}>Currently showing</span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
              <Play size={18} />
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
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>SCHEDULED</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)' }}>{scheduledCount}</span>
              <span style={{ fontSize: '0.6875rem', color: '#657785', display: 'block', marginTop: 2 }}>Future start dates</span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#EAF6FC', border: '1px solid #DCE8EF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#083B56', flexShrink: 0 }}>
              <Calendar size={18} />
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
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>EXPIRED / PAUSED</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#9333EA' }}>{expiredCount}</span>
              <span style={{ fontSize: '0.6875rem', color: '#657785', display: 'block', marginTop: 2 }}>Past campaigns</span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#F3E8FF', border: '1px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA', flexShrink: 0 }}>
              <Clock size={18} />
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
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>TOTAL VIEWS</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706' }}>{totalImpressions.toLocaleString('en-IN')}</span>
              <span style={{ fontSize: '0.6875rem', color: '#657785', display: 'block', marginTop: 2 }}>Modal impressions</span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', flexShrink: 0 }}>
              <Eye size={18} />
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
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>TOTAL CLICKS</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aarizo-coral, #F06543)' }}>{totalClicks.toLocaleString('en-IN')} <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>({ctrPercentage}%)</span></span>
              <span style={{ fontSize: '0.6875rem', color: '#657785', display: 'block', marginTop: 2 }}>CTA conversions</span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aarizo-coral, #F06543)', flexShrink: 0 }}>
              <MousePointerClick size={18} />
            </div>
          </div>
        </div>

        {/* Filters and Campaign List Card */}
        <div className="bg-white rounded-2xl border border-[#DCE8EF] p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#083B56]">Active Ad Campaigns</h3>
              <p className="text-xs text-slate-500 font-medium">Live synchronized with Firestore</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-[#DCE8EF] bg-white text-[#083B56] font-extrabold focus:outline-none focus:ring-2 focus:ring-[#F06543]/30 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="PAUSED">Paused</option>
                <option value="EXPIRED">Expired</option>
                <option value="DRAFT">Draft</option>
              </select>

              <select
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-[#DCE8EF] bg-white text-[#083B56] font-extrabold focus:outline-none focus:ring-2 focus:ring-[#F06543]/30 cursor-pointer"
              >
                <option value="ALL">All Audiences</option>
                <option value="RESIDENT">Residents Only</option>
                <option value="VENDOR">Vendors Only</option>
                <option value="STAFF">Staff Only</option>
                <option value="SECURITY">Security Only</option>
                <option value="ADMIN">Admins Only</option>
              </select>
            </div>
          </div>

          {filteredAds.length === 0 ? (
            <div className="py-10 px-4 text-center border-2 border-dashed border-[#DCE8EF] bg-[#F7FBFE] rounded-xl flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#EAF6FC] border border-[#DCE8EF] flex items-center justify-center mb-2.5 text-[#F06543]">
                <Megaphone className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-[#083B56]">No Campaigns Found</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Create your first ad campaign to display on resident dashboards.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAds.map((ad) => (
                <div
                  key={ad.id}
                  className="rounded-2xl border border-[#DCE8EF] bg-white overflow-hidden shadow-2xs hover:shadow-sm transition-all flex flex-col"
                >
                  {/* Banner Header */}
                  <div className="relative h-36 bg-slate-900 overflow-hidden">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <StatusBadge
                        label={ad.status}
                        variant={
                          ad.status === 'ACTIVE'
                            ? 'success'
                            : ad.status === 'PAUSED'
                            ? 'warning'
                            : 'neutral'
                        }
                      />
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/60 text-white font-bold backdrop-blur-xs">
                        P{ad.priority}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-3 right-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                        {ad.targetAudience} · {ad.frequency.replace(/_/g, ' ')}
                      </span>
                      <h4 className="text-sm font-extrabold text-white leading-tight truncate">{ad.title}</h4>
                    </div>
                  </div>

                  {/* Content body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-slate-600 line-clamp-2 font-medium">
                      {ad.description}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-[#DCE8EF]">
                      <div className="flex items-center justify-between">
                        <span>Schedule:</span>
                        <span className="font-bold text-[#083B56]">
                          {ad.startAt} → {ad.endAt}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Performance:</span>
                        <span className="font-bold text-[#083B56]">
                          {ad.impressionsCount || 0} views · {ad.clicksCount || 0} clicks
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#DCE8EF]">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewAd(ad)}
                          className="p-1.5 rounded-lg bg-[#F4FAFE] hover:bg-[#EAF6FC] text-[#083B56] cursor-pointer transition-colors border border-[#DCE8EF]"
                          title="Preview Popup Modal"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(ad)}
                          className="p-1.5 rounded-lg bg-[#F4FAFE] hover:bg-[#EAF6FC] text-[#083B56] cursor-pointer transition-colors border border-[#DCE8EF]"
                          title={ad.status === 'ACTIVE' ? 'Pause Campaign' : 'Activate Campaign'}
                        >
                          {ad.status === 'ACTIVE' ? (
                            <Pause size={15} className="text-amber-600" />
                          ) : (
                            <Play size={15} className="text-emerald-600" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ad)}
                          className="p-1.5 rounded-lg bg-[#F4FAFE] hover:bg-[#EAF6FC] text-[#083B56] cursor-pointer transition-colors border border-[#DCE8EF]"
                          title="Edit Details"
                        >
                          <Edit3 size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            adId: ad.id,
                            adTitle: ad.title,
                          })
                        }
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer transition-colors border border-rose-200"
                        title="Delete Campaign"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE / EDIT CAMPAIGN MODAL ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAdId ? 'Edit Advertisement Campaign' : 'Create Advertisement Campaign'}
        subtitle="Configure target audience, schedule, and banner imagery"
        icon={<Megaphone className="w-5 h-5 text-[#F06543]" />}
        maxWidth="600px"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const formEl = document.getElementById('ad-campaign-form') as HTMLFormElement;
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
              {editingAdId ? 'Save Changes' : 'Launch Campaign'}
            </button>
          </>
        }
      >
        <form id="ad-campaign-form" onSubmit={handleSaveAd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#083B56] mb-1">
              Campaign Headline *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. 50% Off Deep Cleaning Services"
              className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                Tagline / Sponsor
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. Exclusive Resident Perk"
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                Promo Code (optional)
              </label>
              <input
                type="text"
                value={formData.discountCode}
                onChange={(e) => setFormData({ ...formData, discountCode: e.target.value })}
                placeholder="e.g. GREENVALLEY20"
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#083B56] mb-1">
              Description *
            </label>
            <textarea
              rows={2}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explain the offer, benefits, or announcement..."
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
            />
          </div>

          {/* Banner Image Uploader */}
          <div>
            <label className="block text-xs font-bold text-[#083B56] mb-1">
              Banner Image URL *
            </label>
            <input
              type="url"
              required
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543] mb-2"
            />
            <FileUploader
              label="Or Upload Banner from Computer"
              societyId={societyId}
              entityType="general"
              onUploadSuccess={(res) => setFormData((prev) => ({ ...prev, imageUrl: res.downloadUrl }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                Target Audience *
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetAudience: e.target.value as AdTargetAudience,
                  })
                }
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-extrabold focus:outline-none focus:border-[#F06543]"
              >
                <option value="ALL">All Community Users</option>
                <option value="RESIDENT">Residents Only</option>
                <option value="VENDOR">Vendors Only</option>
                <option value="STAFF">Facility Staff Only</option>
                <option value="SECURITY">Security Team Only</option>
                <option value="ADMIN">Admins Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                Popup Frequency *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value as AdFrequency })
                }
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-extrabold focus:outline-none focus:border-[#F06543]"
              >
                <option value="ONCE_PER_SESSION">Once per session</option>
                <option value="ONCE_PER_DAY">Once per 24 hours</option>
                <option value="ONCE_PER_CAMPAIGN">Once per campaign lifetime</option>
                <option value="ALWAYS">Every visit (Always)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                CTA Button Label
              </label>
              <input
                type="text"
                value={formData.actionLabel}
                onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                placeholder="e.g. Claim 20% Off"
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                CTA Destination URL / Phone
              </label>
              <input
                type="text"
                value={formData.actionUrl}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                placeholder="e.g. https://... or tel:9822100445"
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#083B56] mb-1">
                Priority (1-10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#DCE8EF] bg-[#F7FBFE] text-[#083B56] font-medium focus:outline-none focus:border-[#F06543]"
              />
            </div>
          </div>
        </form>
      </Modal>


      {/* ── PREVIEW MODAL ── */}
      {previewAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setPreviewAd(null)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative h-44 bg-slate-900">
              <img
                src={previewAd.imageUrl}
                alt={previewAd.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-bold">
                <Sparkles size={11} />
                <span>Resident Exclusive</span>
              </div>
              <div className="absolute bottom-2.5 left-4 right-4">
                <p className="text-[11px] font-bold text-amber-300 uppercase">
                  {previewAd.tagline || 'Community Partner'}
                </p>
                <h4 className="text-base font-extrabold text-white leading-tight mt-0.5">
                  {previewAd.title}
                </h4>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {previewAd.description}
              </p>
              {previewAd.discountCode && (
                <div className="p-2.5 rounded-xl border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/30 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                  <span>USE CODE: {previewAd.discountCode}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setPreviewAd(null)}
                className="w-full py-2.5 rounded-xl bg-[#176B91] hover:bg-[#083B56] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                {previewAd.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, adId: null, adTitle: '' })}
        onConfirm={handleDeleteAd}
        title="Delete Advertisement Campaign?"
        message={`Are you sure you want to permanently delete campaign "${deleteDialog.adTitle}"? This will stop impressions immediately.`}
        confirmText="Delete Campaign"
        variant="danger"
      />
    </div>
  );
};

export default AdminAdvertisementsPage;
