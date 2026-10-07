import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Zap,
  Flame,
  Shirt,
  Car,
  UserCheck,
  Trees,
  Sparkles,
  ShoppingBag,
  Utensils,
  Package,
  Star,
  Clock,
  PlusCircle,
  Search,
  ShieldCheck,
  Building2,
  RefreshCw,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { societyServicesEngine } from '../services/societyServicesEngine';
import { Modal } from '../../../components/ui/Modal';
import type { ServiceCategory, VendorPartner, ServiceItem, ServiceBookingOrder, RecurringScheduleType, OrderStatus } from '../types';
import { useAuth } from '../../../context/AuthContext';
import { realTimeSync } from '../../../services/realTimeSync';
import { realtimeService } from '../../../services/realtimeService';
import { RazorpayCheckoutModal } from '../../../domains/payments/RazorpayCheckoutModal';
import { AdvertisementPopup, OffersLauncherPill } from '../../../components/common/AdvertisementPopup';
import { FileUpload } from '../../../components/ui/FileUpload';

interface SocietyServicesHubProps {
  userRoleOverride?: string;
}

const CATEGORY_ICONS: Record<ServiceCategory, any> = {
  PLUMBER: Wrench,
  ELECTRICIAN: Zap,
  AC_REPAIR: Flame,
  APPLIANCE_REPAIR: Wrench,
  PEST_CONTROL: Sparkles,
  LAUNDRY: Shirt,
  CAR_WASH: Car,
  DRIVER: UserCheck,
  GARDENER: Trees,
  CLEANING: Sparkles,
  GROCERY: ShoppingBag,
  FOOD: Utensils,
  HOTEL_RESTAURANT: Utensils,
  COURIER: Package,
  OTHER: Package,
};

export const SocietyServicesHub: React.FC<SocietyServicesHubProps> = ({ userRoleOverride }) => {
  const { currentUser } = useAuth();
  const activeRole = (userRoleOverride || currentUser?.role || '').toLowerCase();

  const isAdmin = ['admin', 'secretary'].includes(activeRole);
  const isVendor = ['vendor'].includes(activeRole);

  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'MY_ORDERS' | 'VENDOR_DIRECTORY' | 'VENDOR_PORTAL' | 'ADMIN_APPROVALS'>('MARKETPLACE');
  const [vendors, setVendors] = useState<VendorPartner[]>(() => societyServicesEngine.getVendors());
  const [items, setItems] = useState<ServiceItem[]>(() => societyServicesEngine.getServiceItems());
  const [orders, setOrders] = useState<ServiceBookingOrder[]>(() => societyServicesEngine.getOrders());

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalMode, setModalMode] = useState<'BOOK' | 'RATE' | 'ADD_ITEM' | null>(null);
  const [selectedItemForBook, setSelectedItemForBook] = useState<ServiceItem | null>(null);
  const [selectedOrderForRate, setSelectedOrderForRate] = useState<ServiceBookingOrder | null>(null);

  // Forms
  const [bookForm, setBookForm] = useState({
    recurringSchedule: 'ONE_TIME' as RecurringScheduleType,
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    customNotes: '',
  });

  const [ratingVal, setRatingVal] = useState(5);
  const [reviewNotes, setReviewNotes] = useState('');

  const [checkoutOrder, setCheckoutOrder] = useState<ServiceBookingOrder | null>(null);
  const [isOffersOpen, setIsOffersOpen] = useState(false);

  const [newItemForm, setNewItemForm] = useState({
    title: '',
    category: 'PLUMBER' as ServiceCategory,
    price: 499,
    unit: 'per service',
    description: '',
    imageUrl: '',
  });

  const loadData = () => {
    setVendors(societyServicesEngine.getVendors());
    setItems(societyServicesEngine.getServiceItems());
    setOrders(societyServicesEngine.getOrders());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = realTimeSync.subscribe('SERVICES_UPDATED', () => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handlePaymentSuccess = (paymentDetails: { transactionId: string; method: "card" | "upi" | "net_banking"; amount: number }) => {
    if (!checkoutOrder) return;
    societyServicesEngine.updateOrderStatus(checkoutOrder.id, 'COMPLETED');
    realtimeService.publish(
      'PAYMENT_COMPLETED',
      {
        orderId: checkoutOrder.id,
        orderNumber: checkoutOrder.orderNumber,
        amount: checkoutOrder.price,
        serviceTitle: checkoutOrder.serviceTitle,
        vendorName: checkoutOrder.vendorName,
        paymentId: paymentDetails.transactionId,
        paymentMethod: paymentDetails.method,
      },
      'soc-1',
      'RESIDENT',
      currentUser?.name || 'Resident'
    );
    loadData();
    setCheckoutOrder(null);
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForBook) return;

    const vendor = vendors.find((v) => v.id === selectedItemForBook.vendorId);

    societyServicesEngine.createOrder({
      societyId: 'soc-1',
      residentId: currentUser?.id || 'res-1',
      residentName: currentUser?.name || 'Siddharth Malhotra',
      flatCode: 'A-101',
      phone: currentUser?.phone || '+91 98765 00000',
      vendorId: selectedItemForBook.vendorId,
      vendorName: vendor?.businessName || 'Service Provider',
      category: selectedItemForBook.category,
      serviceTitle: selectedItemForBook.title,
      price: selectedItemForBook.price,
      recurringSchedule: bookForm.recurringSchedule,
      customScheduleNotes: bookForm.customNotes,
      scheduledDate: bookForm.scheduledDate,
    });

    setModalMode(null);
    loadData();
    alert('Booking submitted successfully! Vendor notified.');
  };

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForRate) return;

    societyServicesEngine.rateOrder(selectedOrderForRate.id, ratingVal, reviewNotes);
    setModalMode(null);
    loadData();
    alert('Thank you for rating your service experience!');
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    societyServicesEngine.addServiceItem({
      vendorId: 'vnd-101',
      title: newItemForm.title,
      category: newItemForm.category,
      price: newItemForm.price,
      unit: newItemForm.unit,
      description: newItemForm.description,
      isAvailable: true,
    });

    setModalMode(null);
    loadData();
    alert('New service added to catalog.');
  };

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    societyServicesEngine.updateOrderStatus(orderId, status);
    loadData();
  };

  const handleApproveVendor = (id: string) => {
    societyServicesEngine.approveVendor(id);
    loadData();
  };

  const handleSuspendVendor = (id: string) => {
    societyServicesEngine.suspendVendor(id);
    loadData();
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '6rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Subheader Bar */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F4FAFE', border: '1px solid #BAE6FD', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#083B56' }}>
                Society Services &amp; Recurring Subscriptions
              </h2>
              <span style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                LIVE CATALOG
              </span>
            </div>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#52788D' }}>
              15 Service Categories, verified vendors, one-time &amp; weekly/monthly recurring subscriptions
            </p>
          </div>
        </div>

        {isVendor && (
          <button
            onClick={() => setModalMode('ADD_ITEM')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              background: '#F06543',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 3px 12px rgba(240, 101, 67, 0.28)',
            }}
          >
            <PlusCircle size={16} /> Add Catalog Service
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          paddingBottom: '0.25rem',
        }}
      >
        {[
          { key: 'MARKETPLACE', label: '15 Categories', icon: Wrench },
          { key: 'MY_ORDERS', label: `My Orders (${orders.length})`, icon: Clock },
          { key: 'VENDOR_DIRECTORY', label: `Verified Vendors (${vendors.length})`, icon: ShieldCheck },
          ...(isAdmin ? [{ key: 'ADMIN_APPROVALS', label: 'Governance', icon: Building2 }] : []),
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
                padding: '0.5rem 0.95rem',
                borderRadius: '10px',
                border: isActive ? '1px solid #F06543' : '1px solid #DCE8EF',
                background: isActive ? '#F06543' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#083B56',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 8px rgba(240, 101, 67, 0.25)' : 'none',
                flexShrink: 0,
              }}
            >
              <Icon size={15} color={isActive ? '#FFFFFF' : '#083B56'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: MARKETPLACE */}
      {activeTab === 'MARKETPLACE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
            <button
              onClick={() => setSelectedCategory('ALL')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                border: selectedCategory === 'ALL' ? '1px solid #F06543' : '1px solid #DCE8EF',
                background: selectedCategory === 'ALL' ? '#F06543' : '#ffffff',
                color: selectedCategory === 'ALL' ? '#ffffff' : '#52788D',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Services
            </button>
            {(
              [
                'PLUMBER',
                'ELECTRICIAN',
                'AC_REPAIR',
                'APPLIANCE_REPAIR',
                'PEST_CONTROL',
                'LAUNDRY',
                'CAR_WASH',
                'DRIVER',
                'GARDENER',
                'CLEANING',
                'GROCERY',
                'FOOD',
                'HOTEL_RESTAURANT',
                'COURIER',
                'OTHER',
              ] as ServiceCategory[]
            ).map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Package;
              const isCatActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    border: isCatActive ? '1px solid #F06543' : '1px solid #DCE8EF',
                    background: isCatActive ? '#F06543' : '#ffffff',
                    color: isCatActive ? '#ffffff' : '#52788D',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={13} />
                  {cat.replace('_', ' ')}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #DCE8EF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search plumbing, AC repair, pest control..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.5rem',
                  borderRadius: '8px',
                  border: '1px solid #DCE8EF',
                  fontSize: '0.85rem',
                  background: '#F8FAFC',
                  color: '#083B56',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              onClick={loadData}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#52788D',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* Catalog Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {filteredItems.map((item) => {
              const vendor = vendors.find((v) => v.id === item.vendorId);
              const Icon = CATEGORY_ICONS[item.category] || Package;
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #DCE8EF',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ padding: '8px', borderRadius: '10px', background: '#F4FAFE', border: '1px solid #DCE8EF', color: '#083B56', display: 'flex', alignItems: 'center' }}>
                        <Icon size={18} />
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#F4FAFE', border: '1px solid #DCE8EF', color: '#083B56', fontFamily: 'monospace' }}>
                        {item.category}
                      </span>
                    </div>

                    <h4 style={{ margin: 0, fontWeight: 800, color: '#083B56', fontSize: '1rem' }}>{item.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#52788D', lineHeight: 1.4 }}>{item.description}</p>

                    <div style={{ fontSize: '0.78rem', color: '#657785', paddingTop: '0.25rem' }}>
                      Provided by: <strong style={{ color: '#083B56' }}>{vendor?.businessName || 'Verified Partner'}</strong>
                    </div>
                  </div>

                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#083B56' }}>₹{item.price}</span>
                      <span style={{ fontSize: '0.72rem', color: '#52788D' }}> / {item.unit}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedItemForBook(item);
                        setModalMode('BOOK');
                      }}
                      style={{
                        padding: '0.45rem 0.9rem',
                        background: '#F06543',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 3px 12px rgba(240, 101, 67, 0.25)',
                      }}
                    >
                      Book / Subscribe
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: MY ORDERS */}
      {activeTab === 'MY_ORDERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#ffffff', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid #DCE8EF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#083B56', textTransform: 'uppercase', letterSpacing: '0.04em' }}>My Service Bookings &amp; Subscriptions</h3>
            <button onClick={loadData} style={{ fontSize: '0.8rem', fontWeight: 700, color: '#52788D', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {orders.map((order, idx) => (
              <div
                key={order.id}
                style={{
                  padding: '1.25rem',
                  borderBottom: idx === orders.length - 1 ? 'none' : '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800, color: '#083B56', background: '#F4FAFE', border: '1px solid #DCE8EF', padding: '2px 8px', borderRadius: '6px' }}>
                      #{order.orderNumber}
                    </span>
                    <h4 style={{ margin: 0, fontWeight: 800, color: '#083B56', fontSize: '1rem' }}>{order.serviceTitle}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#52788D', fontWeight: 600 }}>({order.category})</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#52788D' }}>
                    Vendor: <strong style={{ color: '#083B56' }}>{order.vendorName}</strong> · Date: {order.scheduledDate} · Amount: <strong style={{ color: '#083B56' }}>₹{order.price}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <span style={{ color: '#657785' }}>Schedule:</span>
                    <span style={{ fontWeight: 800, color: '#083B56', background: '#F4FAFE', border: '1px solid #DCE8EF', padding: '2px 8px', borderRadius: '6px' }}>
                      {order.recurringSchedule}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: order.status === 'COMPLETED' ? '#ECFDF5' : order.status === 'IN_PROGRESS' ? '#FFFBEB' : '#F1F5F9',
                      color: order.status === 'COMPLETED' ? '#059669' : order.status === 'IN_PROGRESS' ? '#D97706' : '#475569',
                      border: `1px solid ${order.status === 'COMPLETED' ? '#A7F3D0' : order.status === 'IN_PROGRESS' ? '#FDE68A' : '#CBD5E1'}`,
                    }}
                  >
                    {order.status}
                  </span>

                  {order.status !== 'COMPLETED' && (
                    <button
                      onClick={() => setCheckoutOrder(order)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        background: '#059669',
                        color: '#fff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)',
                      }}
                    >
                      <CreditCard size={14} /> Pay ₹{order.price}
                    </button>
                  )}

                  {order.status === 'COMPLETED' && !order.rating && (
                    <button
                      onClick={() => {
                        setSelectedOrderForRate(order);
                        setModalMode('RATE');
                      }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        color: '#D97706',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Star size={13} /> Rate Service
                    </button>
                  )}

                  {isVendor && order.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                      style={{
                        padding: '0.4rem 0.85rem',
                        background: '#F06543',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Accept Booking
                    </button>
                  )}

                  {isVendor && order.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      style={{
                        padding: '0.4rem 0.85rem',
                        background: '#059669',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: VENDOR DIRECTORY */}
      {activeTab === 'VENDOR_DIRECTORY' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {vendors.map((v) => (
            <div
              key={v.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #DCE8EF',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 800, color: '#083B56', fontSize: '1rem' }}>{v.businessName}</h4>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#52788D' }}>Contact: {v.contactPerson} ({v.phone})</p>
                </div>

                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    background: v.approvalStatus === 'APPROVED' ? '#ECFDF5' : '#FEF2F2',
                    color: v.approvalStatus === 'APPROVED' ? '#059669' : '#DC2626',
                    border: `1px solid ${v.approvalStatus === 'APPROVED' ? '#A7F3D0' : '#FCA5A5'}`,
                  }}
                >
                  {v.approvalStatus}
                </span>
              </div>

              <p className="text-xs text-slate-600">{v.description}</p>

              <div className="flex items-center gap-2 pt-2 border-t text-xs">
                <span className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star size={14} className="fill-amber-500" /> {v.rating} ({v.ratingCount} reviews)
                </span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-slate-600">{v.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: ADMIN GOVERNANCE */}
      {activeTab === 'ADMIN_APPROVALS' && (
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Admin Vendor Approval & Suspension Governance</h3>
          <p className="text-xs text-slate-500">Approve new vendor applications or suspend non-compliant services.</p>

          <div className="divide-y divide-slate-100">
            {vendors.map((v) => (
              <div key={v.id} className="py-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{v.businessName}</h4>
                  <p className="text-xs text-slate-500">Category: {v.category} · Contact: {v.phone}</p>
                </div>

                <div className="flex items-center gap-2">
                  {v.approvalStatus === 'PENDING_APPROVAL' && (
                    <button
                      onClick={() => handleApproveVendor(v.id)}
                      className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg"
                    >
                      Approve Partner
                    </button>
                  )}

                  {v.approvalStatus === 'APPROVED' && (
                    <button
                      onClick={() => handleSuspendVendor(v.id)}
                      className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-lg"
                    >
                      Suspend Partner
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rate Modal */}
      <Modal
        isOpen={modalMode === 'RATE' && !!selectedOrderForRate}
        onClose={() => setModalMode(null)}
        title="Rate Service Experience"
        subtitle="Share feedback on service quality and vendor behavior"
        icon={<Star size={20} className="text-amber-500" />}
        maxWidth="460px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-100 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('rate-service-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2.5 text-xs font-extrabold rounded-xl shadow-md bg-[#F06543] text-white"
            >
              Submit Rating
            </button>
          </div>
        }
      >
        <form id="rate-service-form" onSubmit={handleRateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
            <div className="flex gap-2 text-amber-500 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingVal(star)}
                  className={`text-2xl transition-transform hover:scale-110 ${ratingVal >= star ? 'opacity-100' : 'opacity-30'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Review Notes</label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Tell us about the service quality, punctuality, and behavior..."
              className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium"
            />
          </div>
        </form>
      </Modal>

      {/* Book Modal */}
      <Modal
        isOpen={modalMode === 'BOOK' && !!selectedItemForBook}
        onClose={() => setModalMode(null)}
        title={selectedItemForBook?.title || 'Service Booking'}
        subtitle="Schedule service order and confirm booking details"
        icon={<ShoppingBag size={20} />}
        maxWidth="480px"
        footer={
          <div className="flex justify-between items-center w-full">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Estimate</span>
              <span className="text-lg font-black text-[#083B56]">₹{selectedItemForBook?.price}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('book-service-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2.5 text-xs font-extrabold rounded-xl shadow-md bg-[#F06543] text-white cursor-pointer"
            >
              Confirm &amp; Dispatch Order
            </button>
          </div>
        }
      >
        {selectedItemForBook && (
          <form id="book-service-form" onSubmit={handleBookSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Booking / Subscription Schedule
              </label>
              <select
                value={bookForm.recurringSchedule}
                onChange={(e) => setBookForm({ ...bookForm, recurringSchedule: e.target.value as any })}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white"
              >
                <option value="ONE_TIME">One-Time Booking</option>
                <option value="WEEKLY">Weekly Recurring (Maid, Laundry, Car Wash)</option>
                <option value="MONTHLY">Monthly Recurring (Pest Control, Maintenance)</option>
                <option value="CUSTOM_SCHEDULE">Custom Schedule</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Scheduled Start Date
              </label>
              <input
                type="date"
                required
                value={bookForm.scheduledDate}
                onChange={(e) => setBookForm({ ...bookForm, scheduledDate: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Custom Notes / Preferred Time
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Please arrive between 10 AM and 11 AM."
                value={bookForm.customNotes}
                onChange={(e) => setBookForm({ ...bookForm, customNotes: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 bg-white"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Add Item Modal */}
      <Modal
        isOpen={modalMode === 'ADD_ITEM'}
        onClose={() => setModalMode(null)}
        title="Add Service to Catalog"
        subtitle="Register new service offering and rate sheet details"
        icon={<PlusCircle size={20} />}
        maxWidth="480px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-100 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('add-catalog-item-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2.5 text-xs font-extrabold rounded-xl shadow-md bg-[#F06543] text-white"
            >
              Add Service
            </button>
          </div>
        }
      >
        <form id="add-catalog-item-form" onSubmit={handleAddItemSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Service Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Deep Sofa Cleaning"
              value={newItemForm.title}
              onChange={(e) => setNewItemForm({ ...newItemForm, title: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Price (₹)</label>
              <input
                type="number"
                required
                value={newItemForm.price}
                onChange={(e) => setNewItemForm({ ...newItemForm, price: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                required
                placeholder="per service"
                value={newItemForm.unit}
                onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Service Photo / Rate Sheet (Optional)
            </label>
            <FileUpload
              category="general"
              label=""
              onUploadSuccess={(url: string) => {
                setNewItemForm((prev) => ({ ...prev, imageUrl: url }));
              }}
            />
            {newItemForm.imageUrl && (
              <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={13} />
                <span>Photo attached successfully</span>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Razorpay Online Payment Checkout */}
      {checkoutOrder && (
        <RazorpayCheckoutModal
          isOpen={!!checkoutOrder}
          onClose={() => setCheckoutOrder(null)}
          amount={checkoutOrder.price}
          purpose={`Payment for ${checkoutOrder.serviceTitle} (${checkoutOrder.vendorName})`}
          invoiceNumber={checkoutOrder.orderNumber}
          invoiceId={checkoutOrder.id}
          userName={currentUser?.name || 'Resident'}
          userPhone={currentUser?.phone || '9876543210'}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Floating Offers Pill Launcher & Popup */}
      <OffersLauncherPill onOpen={() => setIsOffersOpen(true)} />
      <AdvertisementPopup
        forceOpen={isOffersOpen}
        onClose={() => setIsOffersOpen(false)}
        societyId="soc-gvs"
      />
    </div>
  );
};



