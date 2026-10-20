import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Plus,
  Search,
  Users,
  Car,
  Heart,
  HelpCircle,
  Sparkles,
  MessageSquare,
  ArrowLeft,
  Building2,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Phone,
  Tag,
  X,
  AlertCircle,
} from 'lucide-react';
import { communityMarketplaceEngine } from '../services/communityMarketplaceEngine';
import { FileUpload } from '../../../components/ui/FileUpload';
import { AdvertisementPopup, OffersLauncherPill } from '../../../components/common/AdvertisementPopup';
import { Modal } from '../../../components/ui/Modal';
import { useAuth } from '../../../context/AuthContext';
import type {
  MarketplaceListing,
  ListingType,
  ListingStatus,
  ListingCategory,
  NeighbourhoodDirectoryEntry,
  LostAndFoundItem,
} from '../types/index';

interface CommunityMarketplaceHubProps {
  userRole?: 'RESIDENT' | 'SOCIETY_ADMIN' | 'SUPER_ADMIN';
  initialTab?: 'MARKETPLACE' | 'DIRECTORY' | 'LOST_FOUND';
  hideHeaderBanner?: boolean;
  hideTabs?: boolean;
}

export const CommunityMarketplaceHub: React.FC<CommunityMarketplaceHubProps> = ({
  userRole = 'RESIDENT',
  initialTab = 'MARKETPLACE',
  hideHeaderBanner = false,
  hideTabs = false,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const flatNumber =
    (currentUser as any)?.flatDetails ||
    (currentUser as any)?.flatNumber ||
    'Tower B · Flat 1204';

  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'DIRECTORY' | 'LOST_FOUND'>(initialTab);

  // Marketplace State
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [selectedType, setSelectedType] = useState<ListingType | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ListingStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Detail Modal States (for "View More")
  const [selectedListingDetail, setSelectedListingDetail] = useState<MarketplaceListing | null>(null);
  const [selectedDirectoryDetail, setSelectedDirectoryDetail] = useState<NeighbourhoodDirectoryEntry | null>(null);
  const [selectedLostFoundDetail, setSelectedLostFoundDetail] = useState<LostAndFoundItem | null>(null);

  // Directory & Lost Found State
  const [directory, setDirectory] = useState<NeighbourhoodDirectoryEntry[]>([]);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState<'ALL' | 'CARPOOL' | 'PETS' | 'VOLUNTEERS'>('ALL');
  const [lostFound, setLostFound] = useState<LostAndFoundItem[]>([]);
  const [lostFoundFilter, setLostFoundFilter] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');

  // Create Listing Modal
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [type, setType] = useState<ListingType>('SELL');
  const [category, setCategory] = useState<ListingCategory>('appliances');
  const [imageUrl, setImageUrl] = useState('');

  // Create Lost & Found Modal
  const [isLostFoundModalOpen, setIsLostFoundModalOpen] = useState(false);
  const [lfTitle, setLfTitle] = useState('');
  const [lfDesc, setLfDesc] = useState('');
  const [lfType, setLfType] = useState<'LOST' | 'FOUND'>('FOUND');
  const [lfLocation, setLfLocation] = useState('');
  const [isAdPopupOpen, setIsAdPopupOpen] = useState(false);

  const refreshData = () => {
    setListings(
      communityMarketplaceEngine.getListings({
        type: selectedType,
        category: selectedCategory,
        status: selectedStatus,
        searchQuery,
      })
    );
    setDirectory(communityMarketplaceEngine.getDirectoryEntries());
    setLostFound(communityMarketplaceEngine.getLostAndFoundItems());
  };

  useEffect(() => {
    refreshData();
  }, [selectedType, selectedCategory, selectedStatus, searchQuery]);

  // Keep selected listing synced if updated
  useEffect(() => {
    if (selectedListingDetail) {
      const updated = listings.find((item) => item.id === selectedListingDetail.id);
      if (updated) setSelectedListingDetail(updated);
    }
  }, [listings]);

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!price && type === 'SELL')) return;

    communityMarketplaceEngine.createListing({
      societyId: 'soc-gvs',
      sellerId: currentUser?.id || 'res-current',
      sellerName: currentUser?.name || 'Mayuri Udar',
      sellerFlat: flatNumber,
      sellerPhone: currentUser?.phone || '+91 98223 99887',
      title,
      description,
      price: type === 'FREE_REUSE' ? 0 : Number(price),
      type,
      category,
      status: 'AVAILABLE',
      images: [imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600'],
    });

    setIsListingModalOpen(false);
    resetListingForm();
    refreshData();
  };

  const resetListingForm = () => {
    setTitle('');
    setDescription('');
    setPrice(0);
    setType('SELL');
    setCategory('appliances');
    setImageUrl('');
  };

  const handleUpdateStatus = (id: string, status: ListingStatus) => {
    communityMarketplaceEngine.updateListingStatus(id, status);
    refreshData();
  };

  const handleModerate = (id: string, hide: boolean) => {
    const reason = hide ? prompt('Reason for moderating/hiding listing:', 'Violates community guidelines') : undefined;
    communityMarketplaceEngine.moderateListing(id, hide, reason || undefined);
    refreshData();
  };

  const handleCreateLostFound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lfTitle) return;

    communityMarketplaceEngine.createLostAndFoundItem({
      societyId: 'soc-gvs',
      title: lfTitle,
      description: lfDesc,
      type: lfType,
      location: lfLocation || 'Main Gate',
      date: new Date().toISOString().substring(0, 10),
      contactName: currentUser?.name || 'Resident',
      contactFlat: flatNumber,
      contactPhone: currentUser?.phone || '+91 98223 99887',
      status: 'OPEN',
    });

    setIsLostFoundModalOpen(false);
    setLfTitle('');
    setLfDesc('');
    setLfLocation('');
    refreshData();
  };

  const filteredDirectory = directory.filter((d) => {
    const matchesSearch =
      !directorySearch.trim() ||
      d.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
      d.profession?.toLowerCase().includes(directorySearch.toLowerCase()) ||
      d.skills.some((s: string) => s.toLowerCase().includes(directorySearch.toLowerCase())) ||
      d.flat.toLowerCase().includes(directorySearch.toLowerCase());

    if (!matchesSearch) return false;

    if (directoryFilter === 'CARPOOL') return d.carpoolOptIn;
    if (directoryFilter === 'PETS') return d.petOwner;
    if (directoryFilter === 'VOLUNTEERS') return d.volunteerOptIn;

    return true;
  });

  const filteredLostFound = lostFound.filter((item) => {
    if (lostFoundFilter === 'LOST') return item.type === 'LOST';
    if (lostFoundFilter === 'FOUND') return item.type === 'FOUND';
    return true;
  });

  const formatCurrency = (amt: number) => {
    if (amt === 0) return 'FREE / REUSE';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
      amt
    );
  };

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }} className="space-y-4">
      {/* 1. Header Card (Standard Dwellora App Header Card) */}
      {!hideHeaderBanner && (
        <div
          style={{
            background: 'var(--aarizo-card-bg, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
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
              <h1
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: 'var(--aarizo-navy, #083B56)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Community &amp; Resident Marketplace
              </h1>
              <p
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--aarizo-text-secondary, #657785)',
                  margin: 0,
                  marginTop: 2,
                }}
              >
                Green Valley Society · Verified resident marketplace, neighbor directory &amp; lost-found desk
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '10px',
                background: '#F8FAFC',
                border: '1px solid #DCE8EF',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#083B56',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Building2 size={14} style={{ color: '#0284C7' }} />
              <span>{flatNumber}</span>
            </div>

            {activeTab === 'MARKETPLACE' && (
              <button
                onClick={() => setIsListingModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.875rem',
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
                <Plus size={15} /> Post Item
              </button>
            )}

            {activeTab === 'LOST_FOUND' && (
              <button
                onClick={() => setIsLostFoundModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.875rem',
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
                <Plus size={15} /> Report Lost / Found
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Metrics Summary Grid (4 Cards - Uniform App Style) */}
      {!hideHeaderBanner && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '0.75rem',
          }}
          className="sm:grid-cols-4"
        >
          {/* Card 1: Marketplace Items */}
          <div
            onClick={() => setActiveTab('MARKETPLACE')}
            style={{
              background: 'var(--aarizo-card-bg, #ffffff)',
              borderRadius: '14px',
              border: activeTab === 'MARKETPLACE' ? '2px solid #F06543' : '1px solid var(--aarizo-border, #DCE8EF)',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(2, 132, 199, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284C7',
                flexShrink: 0,
              }}
            >
              <Store size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  color: 'var(--aarizo-text-secondary, #657785)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                MARKETPLACE
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#083B56', lineHeight: 1.1 }}>
                {listings.length} Listings
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                Buy, sell &amp; giveaways
              </div>
            </div>
          </div>

          {/* Card 2: Neighbour Directory */}
          <div
            onClick={() => setActiveTab('DIRECTORY')}
            style={{
              background: 'var(--aarizo-card-bg, #ffffff)',
              borderRadius: '14px',
              border: activeTab === 'DIRECTORY' ? '2px solid #F06543' : '1px solid var(--aarizo-border, #DCE8EF)',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(20, 184, 166, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0D9488',
                flexShrink: 0,
              }}
            >
              <Users size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  color: 'var(--aarizo-text-secondary, #657785)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                DIRECTORY
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#083B56', lineHeight: 1.1 }}>
                {directory.length} Residents
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                Skills &amp; professions
              </div>
            </div>
          </div>

          {/* Card 3: Lost & Found */}
          <div
            onClick={() => setActiveTab('LOST_FOUND')}
            style={{
              background: 'var(--aarizo-card-bg, #ffffff)',
              borderRadius: '14px',
              border: activeTab === 'LOST_FOUND' ? '2px solid #F06543' : '1px solid var(--aarizo-border, #DCE8EF)',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(217, 119, 6, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
                flexShrink: 0,
              }}
            >
              <HelpCircle size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  color: 'var(--aarizo-text-secondary, #657785)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                LOST &amp; FOUND
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#083B56', lineHeight: 1.1 }}>
                {lostFound.length} Notices
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                Gate verification
              </div>
            </div>
          </div>

          {/* Card 4: Community Network */}
          <div
            onClick={() => {
              setActiveTab('DIRECTORY');
              setDirectoryFilter('CARPOOL');
            }}
            style={{
              background: 'var(--aarizo-card-bg, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(147, 51, 234, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9333EA',
                flexShrink: 0,
              }}
            >
              <Car size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  color: 'var(--aarizo-text-secondary, #657785)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                CARPOOL &amp; PETS
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#083B56', lineHeight: 1.1 }}>
                {directory.filter((d) => d.carpoolOptIn || d.petOwner).length} Opted-In
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                Neighborhood network
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Coral Pill Tabs Navigation (Standard Dwellora Tabs Bar) */}
      {!hideTabs && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'MARKETPLACE', label: 'Resident Marketplace', count: listings.length, icon: Store },
            { key: 'DIRECTORY', label: 'Neighbour Directory', count: directory.length, icon: Users },
            { key: 'LOST_FOUND', label: 'Lost & Found Board', count: lostFound.length, icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '12px',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  background: isActive ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
                  color: isActive ? '#ffffff' : '#083B56',
                  border: isActive ? '1px solid #F06543' : '1px solid #DCE8EF',
                  boxShadow: isActive ? '0 2px 8px rgba(240, 101, 67, 0.25)' : '0 1px 2px rgba(8, 59, 86, 0.02)',
                }}
              >
                <Icon size={15} style={{ color: isActive ? '#ffffff' : '#F06543' }} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 900,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '10px',
                      background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                      color: isActive ? '#ffffff' : '#64748B',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Tab 1: Resident Marketplace */}
      {activeTab === 'MARKETPLACE' && (
        <div className="space-y-4">
          {/* Partner Ad Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #083B56 0%, #176B91 100%)',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.15)',
            }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <span
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '8px',
                  background: '#FBBF24',
                  color: '#0F172A',
                  fontSize: '0.6875rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                }}
              >
                PARTNER DEALS
              </span>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Urban Home Care &amp; QuickFix Services
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#BAE6FD', margin: 0, marginTop: 2 }}>
                  Exclusive 20% resident discount on home cleaning, deep painting &amp; appliance repairs
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAdPopupOpen(true)}
              style={{
                padding: '0.45rem 0.875rem',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#083B56',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
              }}
            >
              View Offers &amp; Codes
            </button>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #DCE8EF',
              padding: '0.875rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
            }}
            className="flex flex-col md:flex-row gap-3 justify-between items-center"
          >
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search appliances, furniture, free items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.25rem',
                  paddingRight: '0.75rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.75rem',
                  color: '#083B56',
                  outline: 'none',
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#083B56',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Intent Types</option>
                <option value="SELL">SELL</option>
                <option value="BUY">BUY</option>
                <option value="BORROW">BORROW</option>
                <option value="FREE_REUSE">🎁 FREE / REUSE</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#083B56',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Categories</option>
                <option value="appliances">Appliances</option>
                <option value="furniture">Furniture</option>
                <option value="services">Services</option>
                <option value="electronics">Electronics</option>
                <option value="other">Other</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '10px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#083B56',
                  outline: 'none',
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RESERVED">RESERVED</option>
                <option value="SOLD">SOLD</option>
              </select>
            </div>
          </div>

          {/* Result Count Subtitle */}
          <div style={{ fontSize: '0.78125rem', color: '#657785', fontWeight: 600, paddingLeft: '0.2rem' }}>
            {listings.length} marketplace listings available
          </div>

          {/* Compact Marketplace Grid (2 Cards Per Line on Mobile, 3 on Desktop - Exactly like Amenities) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
            {listings.map((item) => {
              const isFree = item.type === 'FREE_REUSE' || item.price === 0;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedListingDetail(item)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #DCE8EF',
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="hover:shadow-md hover:border-[#F06543]/40 group"
                >
                  <div>
                    {/* Top Photo Banner with Badges */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      <img
                        src={item.images[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600'}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                      {/* Top-Left Pricing Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          left: 6,
                          background: isFree ? '#16A34A' : '#083B56',
                          color: '#ffffff',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.65rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      >
                        {isFree ? '🎁 FREE' : formatCurrency(item.price)}
                      </div>

                      {/* Top-Right Status Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          background:
                            item.status === 'AVAILABLE'
                              ? '#ECFDF5'
                              : item.status === 'RESERVED'
                              ? '#FEF3C7'
                              : '#F1F5F9',
                          color:
                            item.status === 'AVAILABLE'
                              ? '#065F46'
                              : item.status === 'RESERVED'
                              ? '#92400E'
                              : '#475569',
                          border:
                            item.status === 'AVAILABLE'
                              ? '1px solid #A7F3D0'
                              : item.status === 'RESERVED'
                              ? '1px solid #FDE68A'
                              : '1px solid #CBD5E1',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '8px',
                          fontWeight: 900,
                          fontSize: '0.6rem',
                          letterSpacing: '0.03em',
                          textTransform: 'uppercase',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                      >
                        {item.status}
                      </div>

                      {/* Bottom-left Type Overlay */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        <span className="text-[9px] font-black uppercase text-white/90 bg-black/40 backdrop-blur-xs px-1.5 py-0.5 rounded-md">
                          {item.type}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-2.5 sm:p-4">
                      <h3 className="text-xs sm:text-base font-extrabold text-[#083B56] margin-0 leading-snug line-clamp-1 group-hover:text-[#F06543] transition-colors">
                        {item.title}
                      </h3>

                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-[#657785] mt-1 font-medium truncate">
                        <MapPin size={12} className="text-[#F06543] shrink-0" />
                        <span className="truncate">{item.sellerFlat} · {item.sellerName}</span>
                      </div>

                      <p className="text-[10px] sm:text-xs text-[#475569] mt-1.5 line-clamp-2 leading-tight">
                        {item.description}
                      </p>

                      {/* Metadata Row */}
                      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs font-bold text-[#083B56] pt-2 mt-2 border-t border-[#F1F5F9]">
                        <span className="capitalize text-[#0284C7] bg-sky-50 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px]">
                          {item.category}
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-[#083B56]">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom "View More" CTA Button */}
                  <div className="p-2 sm:p-4 pt-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedListingDetail(item);
                      }}
                      style={{
                        width: '100%',
                        borderRadius: '10px',
                        background: '#ffffff',
                        border: '1px solid #F06543',
                        color: '#F06543',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(240, 101, 67, 0.08)',
                        transition: 'all 0.15s ease',
                      }}
                      className="py-1.5 sm:py-2 text-[10px] sm:text-xs group-hover:bg-[#F06543] group-hover:text-white"
                    >
                      <span>View More</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Neighbour Directory */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-4">
          {/* Search Bar & Filter Chips */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #DCE8EF',
              padding: '1rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
            }}
            className="space-y-3"
          >
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search resident name, flat, profession, or skill (e.g. Doctor, Yoga, Software)..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  paddingRight: '1rem',
                  paddingTop: '0.65rem',
                  paddingBottom: '0.65rem',
                  borderRadius: '12px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.8125rem',
                  color: '#083B56',
                  outline: 'none',
                }}
              />
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'ALL', label: 'All Neighbors' },
                { id: 'CARPOOL', label: '🚗 Carpool Network' },
                { id: 'PETS', label: '🐾 Pet Owners' },
                { id: 'VOLUNTEERS', label: '✨ Society Volunteers' },
              ].map((chip) => {
                const isSelected = directoryFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => setDirectoryFilter(chip.id as any)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      border: isSelected ? 'none' : '1px solid #E2E8F0',
                      background: isSelected ? '#083B56' : '#F8FAFC',
                      color: isSelected ? '#ffffff' : '#64748B',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result Count */}
          <div style={{ fontSize: '0.78125rem', color: '#657785', fontWeight: 600, paddingLeft: '0.2rem' }}>
            {filteredDirectory.length} verified residents found
          </div>

          {/* Directory Cards Grid (2 Cards Per Line on Mobile, 3 on Desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
            {filteredDirectory.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setSelectedDirectoryDetail(entry)}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #DCE8EF',
                  padding: '0.875rem',
                  boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                className="hover:shadow-md hover:border-[#F06543]/40 group"
              >
                <div>
                  {/* Top Resident Info */}
                  <div className="flex items-start gap-2">
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: 'rgba(8, 59, 86, 0.08)',
                        color: '#083B56',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.8125rem',
                        flexShrink: 0,
                      }}
                    >
                      {entry.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h3 className="text-xs sm:text-sm font-extrabold text-[#083B56] truncate margin-0 leading-tight">
                          {entry.name}
                        </h3>
                      </div>
                      <p className="text-[10px] sm:text-xs text-[#657785] truncate margin-0 mt-0.5">
                        {entry.flat} · {entry.tower}
                      </p>
                    </div>
                  </div>

                  {/* Profession Pill */}
                  <div className="mt-2">
                    <span className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] sm:text-[10px] font-bold truncate max-w-full">
                      {entry.profession || 'Resident'}
                    </span>
                  </div>

                  {/* Top Skills Snippet */}
                  <div className="mt-2 flex flex-wrap gap-1 max-h-12 overflow-hidden">
                    {entry.skills.slice(0, 2).map((s: string) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155] text-[9px] font-semibold truncate"
                      >
                        {s}
                      </span>
                    ))}
                    {entry.skills.length > 2 && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 text-[9px] font-semibold">
                        +{entry.skills.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Badges Row */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1 flex-wrap">
                    {entry.carpoolOptIn && (
                      <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 text-[9px] font-extrabold border border-sky-200 flex items-center gap-0.5">
                        <Car size={10} /> Carpool
                      </span>
                    )}
                    {entry.petOwner && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[9px] font-extrabold border border-amber-200 flex items-center gap-0.5">
                        <Heart size={10} /> Pet
                      </span>
                    )}
                    {entry.volunteerOptIn && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-extrabold border border-emerald-200 flex items-center gap-0.5">
                        <Sparkles size={10} /> Volunteer
                      </span>
                    )}
                  </div>
                </div>

                {/* View More Button */}
                <div className="pt-2.5 mt-2 border-t border-[#F1F5F9]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDirectoryDetail(entry);
                    }}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1px solid #083B56',
                      color: '#083B56',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.2rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    className="py-1 text-[10px] sm:text-xs group-hover:bg-[#083B56] group-hover:text-white"
                  >
                    <span>View Profile</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Lost & Found Board */}
      {activeTab === 'LOST_FOUND' && (
        <div className="space-y-4">
          {/* Quick Filter */}
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: 'All Notices' },
              { id: 'FOUND', label: 'Found Items' },
              { id: 'LOST', label: 'Lost Items' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setLostFoundFilter(f.id as any)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: lostFoundFilter === f.id ? 'none' : '1px solid #DCE8EF',
                  background: lostFoundFilter === f.id ? '#083B56' : '#ffffff',
                  color: lostFoundFilter === f.id ? '#ffffff' : '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Result Count */}
          <div style={{ fontSize: '0.78125rem', color: '#657785', fontWeight: 600, paddingLeft: '0.2rem' }}>
            {filteredLostFound.length} notices posted
          </div>

          {/* Lost & Found Cards Grid (2 Cards Per Line on Mobile, 3 on Desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
            {filteredLostFound.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedLostFoundDetail(item)}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #DCE8EF',
                  padding: '0.875rem',
                  boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                className="hover:shadow-md hover:border-[#F06543]/40 group"
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        background: item.type === 'FOUND' ? '#ECFDF5' : '#FEF2F2',
                        color: item.type === 'FOUND' ? '#065F46' : '#991B1B',
                        border: item.type === 'FOUND' ? '1px solid #A7F3D0' : '1px solid #FECACA',
                      }}
                    >
                      {item.type}
                    </span>
                    <span className="text-[9px] text-[#94A3B8] font-bold">{item.date}</span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-extrabold text-[#083B56] mt-2 line-clamp-1 leading-tight group-hover:text-[#F06543] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-[10px] sm:text-xs text-[#475569] mt-1 line-clamp-2 leading-tight">
                    {item.description}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-[#657785] flex items-center gap-1 truncate">
                    <MapPin size={11} className="text-[#0284C7] shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>

                {/* View Details Button */}
                <div className="pt-2.5 mt-2 border-t border-[#F1F5F9]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLostFoundDetail(item);
                    }}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1px solid #D97706',
                      color: '#D97706',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.2rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    className="py-1 text-[10px] sm:text-xs group-hover:bg-[#D97706] group-hover:text-white"
                  >
                    <span>View Notice</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: FULL LISTING DETAILS MODAL ("VIEW MORE")             */}
      {/* ============================================================ */}
      {selectedListingDetail && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 20, 32, 0.72)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedListingDetail(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(8, 59, 86, 0.25)',
              border: '1px solid #DCE8EF',
            }}
          >
            {/* Top Photo Banner */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-slate-900 shrink-0">
              <img
                src={selectedListingDetail.images[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600'}
                alt={selectedListingDetail.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-black/30" />

              {/* Top Badges */}
              <div className="absolute top-3 left-3 bg-[#083B56]/95 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 shadow-md border border-white/20">
                <span className="text-[#FBBF24] font-extrabold">
                  {selectedListingDetail.type === 'FREE_REUSE' ? '🎁 FREE / REUSE' : formatCurrency(selectedListingDetail.price)}
                </span>
              </div>

              <div className="absolute top-3 right-14 bg-[#083B56]/95 backdrop-blur-md text-white text-xs tracking-wider uppercase px-3 py-1.5 rounded-full font-extrabold shadow-md border border-white/20">
                {selectedListingDetail.status}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedListingDetail(null)}
                aria-label="Close detail view"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 z-10"
              >
                <X size={18} />
              </button>

              {/* Bottom Title Overlay */}
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <div className="text-[11px] font-bold text-[#FBBF24] tracking-wider uppercase flex items-center gap-1 mb-0.5">
                  <Tag size={13} />
                  <span>{selectedListingDetail.category} · {selectedListingDetail.type}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                  {selectedListingDetail.title}
                </h2>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Pricing & Intent Highlight Box */}
              <div className="bg-[#F8FAFC] border border-[#DCE8EF] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price / Consideration</span>
                  <span className="text-lg font-black text-[#083B56]">
                    {selectedListingDetail.type === 'FREE_REUSE' ? (
                      <span className="text-emerald-600 font-black">🎁 100% Free Resident Giveaway</span>
                    ) : (
                      formatCurrency(selectedListingDetail.price)
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Listing Intent</span>
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 font-extrabold text-xs">
                    {selectedListingDetail.type}
                  </span>
                </div>
              </div>

              {/* Full Description */}
              <div>
                <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Item Description
                </h4>
                <p className="text-sm text-slate-700 font-medium leading-relaxed bg-white border border-slate-100 rounded-xl p-3">
                  {selectedListingDetail.description || 'No additional description provided.'}
                </p>
              </div>

              {/* Verified Seller Box */}
              <div className="bg-white border border-[#DCE8EF] rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Verified Resident Seller
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                    GVS Verified
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#083B56]/10 text-[#083B56] font-black text-sm flex items-center justify-center shrink-0">
                    {selectedListingDetail.sellerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#083B56] margin-0">
                      {selectedListingDetail.sellerName}
                    </h4>
                    <p className="text-xs text-slate-500 margin-0 mt-0.5 flex items-center gap-1 font-medium">
                      <Building2 size={13} className="text-[#0284C7]" />
                      <span>{selectedListingDetail.sellerFlat}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Initiating verified resident chat with ${selectedListingDetail.sellerName} (${selectedListingDetail.sellerFlat}).`);
                    }}
                    className="py-2 px-3 rounded-xl bg-[#176B91] hover:bg-[#083B56] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare size={14} />
                    <span>Chat in Portal</span>
                  </button>

                  <a
                    href={`tel:${selectedListingDetail.sellerPhone}`}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors no-underline text-center"
                  >
                    <Phone size={14} />
                    <span>Call Seller</span>
                  </a>
                </div>
              </div>

              {/* Status Update / Seller Controls */}
              <div className="bg-[#F8FAFC] border border-[#DCE8EF] rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Listing Lifecycle Management
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedListingDetail.id, 'AVAILABLE')}
                    className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                      selectedListingDetail.status === 'AVAILABLE'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Available
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedListingDetail.id, 'RESERVED')}
                    className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                      selectedListingDetail.status === 'RESERVED'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Reserved
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedListingDetail.id, 'SOLD')}
                    className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                      selectedListingDetail.status === 'SOLD'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Sold
                  </button>
                </div>

                {userRole !== 'RESIDENT' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        handleModerate(selectedListingDetail.id, !selectedListingDetail.isModerated);
                        setSelectedListingDetail(null);
                      }}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      {selectedListingDetail.isModerated ? 'Restore Listing' : 'Admin Delist'}
                    </button>
                  </div>
                )}
              </div>

              {/* Community Safe Exchange Tip */}
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-900 text-[11px] flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-600 shrink-0" />
                <span>
                  Tip: For resident marketplace pickups, meet at the society clubhouse or main lobby.
                </span>
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-semibold">
                ID: {selectedListingDetail.id.slice(0, 10)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedListingDetail(null)}
                className="px-4 py-2 rounded-xl bg-[#083B56] text-white text-xs font-extrabold hover:bg-[#176B91] transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: NEIGHBOUR DIRECTORY PROFILE MODAL                    */}
      {/* ============================================================ */}
      {selectedDirectoryDetail && (
        <Modal
          isOpen={!!selectedDirectoryDetail}
          onClose={() => setSelectedDirectoryDetail(null)}
          title={`Resident Profile: ${selectedDirectoryDetail.name}`}
          subtitle={`${selectedDirectoryDetail.flat} · ${selectedDirectoryDetail.tower}`}
          icon={<Users size={20} />}
          maxWidth="520px"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#DCE8EF]">
              <div className="w-12 h-12 rounded-xl bg-[#083B56] text-white text-base font-black flex items-center justify-center shrink-0">
                {selectedDirectoryDetail.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold text-[#083B56] margin-0">
                  {selectedDirectoryDetail.name}
                </h3>
                <p className="text-xs text-slate-500 font-semibold margin-0 mt-0.5">
                  {selectedDirectoryDetail.flat} · {selectedDirectoryDetail.tower}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck size={12} /> Verified Resident
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 font-extrabold text-[10px]">
                    {selectedDirectoryDetail.profession || 'Resident'}
                  </span>
                </div>
              </div>
            </div>

            {/* Skills & Assistance */}
            <div>
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                Community Skills &amp; Assistance
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedDirectoryDetail.skills.map((s: string) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Community Badges */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Neighborhood Opt-ins
              </h4>
              {selectedDirectoryDetail.carpoolOptIn && (
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 flex items-center gap-2">
                  <Car size={16} className="text-sky-600 shrink-0" />
                  <div>
                    <span className="font-extrabold block">Carpool Network Active</span>
                    <span className="text-[11px] text-sky-700">Open to sharing rides for daily work commute.</span>
                  </div>
                </div>
              )}
              {selectedDirectoryDetail.petOwner && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2">
                  <Heart size={16} className="text-amber-600 shrink-0" />
                  <div>
                    <span className="font-extrabold block">Pet Friendly Home ({selectedDirectoryDetail.petDetails})</span>
                    <span className="text-[11px] text-amber-700">Connect with fellow society pet parents.</span>
                  </div>
                </div>
              )}
              {selectedDirectoryDetail.volunteerOptIn && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold block">Society Volunteer</span>
                    <span className="text-[11px] text-emerald-700">Actively volunteers for society events &amp; welfare.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDirectoryDetail(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Message sent to ${selectedDirectoryDetail.name} via resident portal.`);
                  setSelectedDirectoryDetail(null);
                }}
                className="px-4 py-2 bg-[#F06543] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <MessageSquare size={13} />
                <span>Say Hello</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: LOST & FOUND DETAIL NOTICE MODAL                     */}
      {/* ============================================================ */}
      {selectedLostFoundDetail && (
        <Modal
          isOpen={!!selectedLostFoundDetail}
          onClose={() => setSelectedLostFoundDetail(null)}
          title={`${selectedLostFoundDetail.type} Notice: ${selectedLostFoundDetail.title}`}
          subtitle={`Reported on ${selectedLostFoundDetail.date}`}
          icon={<HelpCircle size={20} />}
          maxWidth="500px"
        >
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center p-3 rounded-xl bg-[#F8FAFC] border border-[#DCE8EF]">
              <span
                className={`px-2.5 py-1 rounded-full font-black text-xs uppercase ${
                  selectedLostFoundDetail.type === 'FOUND'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {selectedLostFoundDetail.type} ITEM
              </span>
              <span className="text-xs text-slate-500 font-bold">
                Date: {selectedLostFoundDetail.date}
              </span>
            </div>

            <div>
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                Notice Description
              </h4>
              <p className="text-sm text-slate-700 font-medium leading-relaxed bg-white border border-slate-100 rounded-xl p-3">
                {selectedLostFoundDetail.description}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <MapPin size={15} className="text-[#0284C7] shrink-0" />
                <span>Location: <strong className="text-slate-900">{selectedLostFoundDetail.location}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                <span>Reported By: <strong className="text-slate-900">{selectedLostFoundDetail.contactName} ({selectedLostFoundDetail.contactFlat})</strong></span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedLostFoundDetail(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Contacting reporter ${selectedLostFoundDetail.contactName} at ${selectedLostFoundDetail.contactPhone}`);
                  setSelectedLostFoundDetail(null);
                }}
                className="px-4 py-2 bg-[#083B56] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Phone size={13} />
                <span>Contact Desk / Finder</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: CREATE LISTING                                      */}
      {/* ============================================================ */}
      <Modal
        isOpen={isListingModalOpen}
        onClose={() => setIsListingModalOpen(false)}
        title="Create Marketplace Item"
        subtitle="Post a buy, sell, borrow, or free giveaway listing for society members"
        icon={<Store size={20} />}
        maxWidth="500px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsListingModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('create-listing-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2.5 text-white text-xs font-extrabold rounded-xl shadow-md bg-[#F06543]"
            >
              Publish Listing
            </button>
          </div>
        }
      >
        <form id="create-listing-form" onSubmit={handleCreateListing} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Intent Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
            >
              <option value="SELL">SELL (For Sale)</option>
              <option value="BUY">BUY (Looking for)</option>
              <option value="BORROW">BORROW (Temporary request)</option>
              <option value="FREE_REUSE">🎁 FREE / REUSE (Giveaway)</option>
            </select>
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Item Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Microwave Oven 20L"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
            />
          </div>

          {type !== 'FREE_REUSE' && (
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Price (₹)</label>
              <input
                type="number"
                min={0}
                value={price || ''}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
              />
            </div>
          )}

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Upload Item Photo</label>
            <FileUpload
              category="general"
              label="Take Photo or Upload Product Image"
              accept="image/*"
              currentUrl={imageUrl}
              onUploadSuccess={(url) => setImageUrl(url)}
              onRemove={() => setImageUrl('')}
            />
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 5: CREATE LOST & FOUND                                 */}
      {/* ============================================================ */}
      <Modal
        isOpen={isLostFoundModalOpen}
        onClose={() => setIsLostFoundModalOpen(false)}
        title="Report Lost / Found Item"
        subtitle="Broadcast lost or found item details to society guard desk & residents"
        icon={<Sparkles size={20} />}
        maxWidth="480px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsLostFoundModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('create-lost-found-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2.5 bg-[#F06543] text-white text-xs font-extrabold rounded-xl shadow-md"
            >
              Publish Report
            </button>
          </div>
        }
      >
        <form id="create-lost-found-form" onSubmit={handleCreateLostFound} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Notice Type</label>
            <select
              value={lfType}
              onChange={(e) => setLfType(e.target.value as any)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
            >
              <option value="FOUND">FOUND ITEM</option>
              <option value="LOST">LOST ITEM</option>
            </select>
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Black Leather Wallet"
              value={lfTitle}
              onChange={(e) => setLfTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Location / Details</label>
            <input
              type="text"
              placeholder="e.g. Near Parking Slot B-12"
              value={lfLocation}
              onChange={(e) => setLfLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Attach Photo (Optional)</label>
            <FileUpload
              category="general"
              label="Take Photo of Found/Lost Item"
              accept="image/*"
              onUploadSuccess={(url) => setLfDesc((prev) => `${prev ? prev + ' ' : ''}[Photo: ${url}]`)}
            />
          </div>
        </form>
      </Modal>

      {/* Floating Offers Pill Launcher & Popup */}
      <OffersLauncherPill onOpen={() => setIsAdPopupOpen(true)} />
      <AdvertisementPopup
        forceOpen={isAdPopupOpen}
        onClose={() => setIsAdPopupOpen(false)}
        societyId="soc-gvs"
      />
    </div>
  );
};

export default CommunityMarketplaceHub;
