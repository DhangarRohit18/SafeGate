import React, { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  Search,
  Users,
  Car,
  Heart,
  HelpCircle,
  UserCheck,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { communityMarketplaceEngine } from '../services/communityMarketplaceEngine';
import { FileUpload } from '../../../components/ui/FileUpload';
import { AdvertisementPopup, OffersLauncherPill } from '../../../components/common/AdvertisementPopup';
import { Modal } from '../../../components/ui/Modal';
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
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'DIRECTORY' | 'LOST_FOUND'>(initialTab);

  // Marketplace State
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [selectedType, setSelectedType] = useState<ListingType | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ListingStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Directory & Lost Found State
  const [directory, setDirectory] = useState<NeighbourhoodDirectoryEntry[]>([]);
  const [directorySearch, setDirectorySearch] = useState('');
  const [lostFound, setLostFound] = useState<LostAndFoundItem[]>([]);

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

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!price && type === 'SELL')) return;

    communityMarketplaceEngine.createListing({
      societyId: 'soc-gvs',
      sellerId: 'res-current',
      sellerName: 'Mayuri Udar',
      sellerFlat: 'A-502',
      sellerPhone: '+91 98223 99887',
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
      contactName: 'Mayuri Udar',
      contactFlat: 'A-502',
      contactPhone: '+91 98223 99887',
      status: 'OPEN',
    });

    setIsLostFoundModalOpen(false);
    setLfTitle('');
    setLfDesc('');
    setLfLocation('');
    refreshData();
  };

  const filteredDirectory = directory.filter(
    (d) =>
      d.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
      d.profession?.toLowerCase().includes(directorySearch.toLowerCase()) ||
      d.skills.some((s: string) => s.toLowerCase().includes(directorySearch.toLowerCase()))
  );

  const formatCurrency = (amt: number) => {
    if (amt === 0) return 'FREE / REUSE';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
      amt
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header Bar */}
      {!hideHeaderBanner && (
        <div
          className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 md:p-6 rounded-2xl shadow-sm gap-4 text-white"
          style={{ background: 'linear-gradient(135deg, var(--aarizo-navy, #083B56) 0%, #0D4767 100%)' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <Store className="w-6 h-6" style={{ color: 'var(--aarizo-sky, #83CBEA)' }} />
              <h1 className="text-xl md:text-2xl font-extrabold text-white">Community &amp; Resident Marketplace</h1>
            </div>
            <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--aarizo-sky, #83CBEA)' }}>
              Buy, sell, borrow, or share items for FREE/REUSE. Connect with verified neighbors in the directory &amp; lost-found board.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {activeTab === 'MARKETPLACE' && (
              <button
                onClick={() => setIsListingModalOpen(true)}
                className="flex-1 md:flex-none px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
                style={{ background: 'var(--aarizo-blue, #176B91)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Plus size={16} /> Create Marketplace Listing
              </button>
            )}

            {activeTab === 'LOST_FOUND' && (
              <button
                onClick={() => setIsLostFoundModalOpen(true)}
                className="flex-1 md:flex-none px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
              >
                <Plus size={16} /> Report Lost / Found Item
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      {!hideTabs && (
        <div
          style={{
            background: '#EBF3F7',
            borderRadius: '16px',
            padding: '0.375rem',
            display: 'flex',
            gap: '0.375rem',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            boxShadow: 'inset 0 1px 3px rgba(8, 59, 86, 0.06)',
          }}
        >
          {[
            { key: 'MARKETPLACE', label: 'Resident Marketplace', icon: Store },
            { key: 'DIRECTORY', label: 'Neighbour Directory', icon: Users },
            { key: 'LOST_FOUND', label: 'Lost & Found Board', icon: HelpCircle },
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
                  gap: '0.45rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? '#083B56' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 3px 10px rgba(8, 59, 86, 0.25)' : '0 1px 3px rgba(0,0,0,0.03)',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color={isActive ? '#83CBEA' : '#176B91'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 1: MARKETPLACE */}
      {activeTab === 'MARKETPLACE' && (
        <div className="space-y-4">
          {/* Partner Ad Banner */}
          <div className="bg-gradient-to-r from-[#083B56] to-[#176B91] rounded-2xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm border border-[#1b4b66]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-amber-400 text-slate-900 rounded-lg text-xs font-black uppercase tracking-wide shrink-0">
                PARTNER DEALS
              </span>
              <div>
                <h4 className="font-bold text-sm text-white">Urban Home Care & QuickFix Services</h4>
                <p className="text-xs text-sky-200">Exclusive 20% resident discount on home cleaning, deep painting & appliance repairs</p>
              </div>
            </div>
            <button
              onClick={() => setIsAdPopupOpen(true)}
              className="px-4 py-2 bg-white text-[#083B56] hover:bg-sky-50 rounded-xl text-xs font-extrabold whitespace-nowrap shadow-sm transition"
            >
              View Offers & Codes
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search appliances, furniture, free items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#176B91]"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
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
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
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
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RESERVED">RESERVED</option>
                <option value="SOLD">SOLD</option>
              </select>
            </div>
          </div>

          {/* Marketplace Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {listings.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col justify-between transition ${
                  item.isModerated ? 'opacity-50 border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Image */}
                  <div className="h-44 w-full relative bg-slate-100 overflow-hidden">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-sm ${
                          item.type === 'FREE_REUSE'
                            ? 'bg-emerald-600 text-white'
                            : item.type === 'BORROW'
                            ? 'bg-amber-500 text-white'
                            : item.type === 'BUY'
                            ? 'bg-[#176B91] text-white'
                            : 'bg-[#083B56] text-white'
                        }`}
                      >
                        {item.type === 'FREE_REUSE' ? '🎁 FREE' : item.type}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-sm ${
                          item.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'RESERVED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{item.title}</h3>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>

                    <div className="pt-2 flex justify-between items-center">
                      <span className="text-base font-extrabold text-slate-900">
                        {formatCurrency(item.price)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.sellerName} ({item.sellerFlat})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls & Seller Lifecycle */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                  <div className="bg-slate-200/60 p-0.5 rounded-lg inline-flex items-center gap-0.5">
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'AVAILABLE')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${
                        item.status === 'AVAILABLE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Available
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'RESERVED')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${
                        item.status === 'RESERVED' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Reserved
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'SOLD')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${
                        item.status === 'SOLD' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Sold
                    </button>
                  </div>

                  <button
                    onClick={() => alert(`Contacting ${item.sellerName} (${item.sellerFlat}). Phone: +91 98223 11223`)}
                    className="px-3 py-1 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center gap-1 hover:opacity-95"
                    style={{ background: 'var(--aarizo-blue, #176B91)' }}
                  >
                    <MessageSquare size={13} /> Chat
                  </button>

                  {userRole !== 'RESIDENT' && (
                    <button
                      onClick={() => handleModerate(item.id, !item.isModerated)}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      {item.isModerated ? 'Restore' : 'Delist'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: NEIGHBOURHOOD DIRECTORY */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <input
              type="text"
              placeholder="Search resident name, profession, or skill (e.g. Doctor, Yoga, Electrician)..."
              value={directorySearch}
              onChange={(e) => setDirectorySearch(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDirectory.map((entry) => (
              <div key={entry.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{entry.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {entry.flat} • {entry.tower} • {entry.profession || 'Resident'}
                    </p>
                  </div>
                  <span className="p-2 bg-[#EAF6FC] text-[#176B91] rounded-xl">
                    <UserCheck size={18} />
                  </span>
                </div>

                {/* Skills */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Skills & Assistance
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {entry.skills.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Badges: Carpool / Pet / Volunteer */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                  {entry.carpoolOptIn && (
                    <span className="px-2.5 py-1 bg-[#EAF6FC] text-[#083B56] rounded-lg font-bold text-[11px] flex items-center gap-1">
                      <Car size={12} /> Carpool Network
                    </span>
                  )}
                  {entry.petOwner && (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg font-bold text-[11px] flex items-center gap-1">
                      <Heart size={12} /> Pet Owner ({entry.petDetails})
                    </span>
                  )}
                  {entry.volunteerOptIn && (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-[11px] flex items-center gap-1">
                      <Sparkles size={12} /> Society Volunteer
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LOST & FOUND */}
      {activeTab === 'LOST_FOUND' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lostFound.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        item.type === 'FOUND' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.type} ITEM
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mt-1">{item.title}</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">{item.date}</span>
                </div>

                <p className="text-xs text-slate-600">{item.description}</p>

                <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                  <span>Location: {item.location}</span>
                  <span className="font-bold text-slate-800">Contact: {item.contactName} ({item.contactFlat})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREATE LISTING */}
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

      {/* MODAL: CREATE LOST & FOUND */}
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
