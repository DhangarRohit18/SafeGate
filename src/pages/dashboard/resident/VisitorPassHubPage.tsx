import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  QrCode,
  Share2,
  Clock,
  Trash2,
  CheckCircle2,
  Phone,
  FileText,
  Truck,
  Car,
  Wrench,
  ShieldCheck,
  Search,
  Copy,
  Check,
  Sparkles,
  Building2,
  Ban,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { visitorService } from '../../../services/visitorService';
import type { SmartVisitorPass, VisitorCategory, PassLifecycleType } from '../../../types/visitor';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Modal } from '../../../components/ui/Modal';
import { Form, FormField } from '../../../components/ui/Form';
import { QRGenerator } from '../../../components/ui/QRGenerator';
import { useAuth } from '../../../context/AuthContext';
import { realtimeService } from '../../../services/realtimeService';
import { FileUploader } from '../../../components/common';
import { AdvertisementPopup, OffersLauncherPill } from '../../../components/common/AdvertisementPopup';

export const VisitorPassHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentSocietyId = (currentUser as any)?.societyId || 'soc-gvs';
  const currentResidentId = currentUser?.id || 'res-1';
  const currentFlat = currentUser?.flatNumber || 'B-1204';
  const residentName = currentUser?.name || 'Sarvesh Kulkarni';

  const filterMyPasses = (allPasses: SmartVisitorPass[]) => {
    return allPasses.filter(
      (p) =>
        p.societyId === currentSocietyId &&
        (p.residentId === currentResidentId || p.residentId === 'res-1' || p.flatCode === currentFlat)
    );
  };

  const [passes, setPasses] = useState<SmartVisitorPass[]>(
    filterMyPasses(visitorService.getPasses(currentSocietyId))
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPassForQR, setSelectedPassForQR] = useState<SmartVisitorPass | null>(null);
  const [isOffersOpen, setIsOffersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'EXPECTED' | 'CHECKED_IN' | 'PAST'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [category, setCategory] = useState<VisitorCategory>('GUEST');
  const [passLifecycle, setPassLifecycle] = useState<PassLifecycleType>('ONE_TIME');
  const [companyName, setCompanyName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [purpose, setPurpose] = useState('');
  const [groupCount, setGroupCount] = useState<number>(1);
  const [visitorPhotoUrl, setVisitorPhotoUrl] = useState('');

  const refreshData = () => {
    setPasses(filterMyPasses(visitorService.getPasses(currentSocietyId)));
  };

  useEffect(() => {
    refreshData();

    const unsubFirestore = visitorService.subscribePasses(currentSocietyId, (livePasses) => {
      if (livePasses && livePasses.length > 0) {
        setPasses(filterMyPasses(livePasses));
      }
    });

    const unsub = realtimeService.subscribe('*', () => {
      refreshData();
    });

    return () => {
      unsubFirestore();
      unsub();
    };
  }, [currentSocietyId, currentResidentId, currentFlat]);

  const openCreateWithCategory = (cat: VisitorCategory) => {
    setCategory(cat);
    if (cat === 'DELIVERY') setCompanyName('Swiggy / Zomato');
    else if (cat === 'CAB') setCompanyName('Uber / Ola');
    else setCompanyName('');
    setIsCreateModalOpen(true);
  };

  const handleCreatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorPhone) return;

    const newPass = visitorService.createVisitorPass(
      {
        societyId: currentSocietyId,
        residentId: currentResidentId,
        residentName,
        flatCode: currentFlat,
        towerName: 'Tower B',
        visitorName,
        visitorPhone,
        category,
        passLifecycle,
        companyName,
        vehicleNumber,
        purpose,
        groupCount: Number(groupCount),
        photoUrl: visitorPhotoUrl || undefined,
      },
      { id: currentResidentId, name: residentName, role: 'resident' }
    );

    refreshData();
    setIsCreateModalOpen(false);
    setSelectedPassForQR(newPass);

    setVisitorName('');
    setVisitorPhone('');
    setCompanyName('');
    setVehicleNumber('');
    setPurpose('');
    setGroupCount(1);
    setVisitorPhotoUrl('');
  };

  const handleRevoke = (passId: string) => {
    if (window.confirm('Are you sure you want to revoke this gate pass? Security will deny entry.')) {
      visitorService.revokePass(passId, { id: currentResidentId, name: residentName, role: 'resident' });
      refreshData();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const shareViaWhatsApp = (pass: SmartVisitorPass) => {
    const text = encodeURIComponent(
      `*Dwellora Gate Pass - Flat ${currentFlat}*\n` +
      `Visitor Name: ${pass.visitorName}\n` +
      `Pass Code: *${pass.passCode}*\n` +
      `Category: ${pass.category.replace(/_/g, ' ')}\n` +
      `Please show this code or QR pass to the main gate security.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = passes.length;
    const expected = passes.filter((p) => p.status === 'EXPECTED').length;
    const checkedIn = passes.filter((p) => p.status === 'CHECKED_IN').length;
    const past = passes.filter((p) => ['CHECKED_OUT', 'REVOKED', 'EXPIRED'].includes(p.status)).length;
    return { total, expected, checkedIn, past };
  }, [passes]);

  // Filtered passes list
  const filteredPasses = useMemo(() => {
    return passes.filter((p) => {
      // Tab filter
      if (activeTab === 'EXPECTED' && p.status !== 'EXPECTED') return false;
      if (activeTab === 'CHECKED_IN' && p.status !== 'CHECKED_IN') return false;
      if (activeTab === 'PAST' && !['CHECKED_OUT', 'REVOKED', 'EXPIRED'].includes(p.status)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.visitorName.toLowerCase().includes(q);
        const matchesPhone = p.visitorPhone.includes(q);
        const matchesCompany = (p.companyName || '').toLowerCase().includes(q);
        const matchesCode = p.passCode.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesCompany || matchesCode;
      }

      return true;
    });
  }, [passes, activeTab, searchQuery]);

  const getCategoryIcon = (cat: VisitorCategory) => {
    switch (cat) {
      case 'DELIVERY':
        return <Truck size={14} className="text-[#F06543]" />;
      case 'CAB':
        return <Car size={14} className="text-[#D97706]" />;
      case 'DOMESTIC_WORKER':
        return <ShieldCheck size={14} className="text-emerald-600" />;
      case 'SERVICE_PROVIDER':
        return <Wrench size={14} className="text-sky-600" />;
      case 'EVENT_GROUP':
        return <Sparkles size={14} className="text-purple-600" />;
      default:
        return <Users size={14} className="text-[#F06543]" />;
    }
  };

  const categoriesConfig: { id: VisitorCategory; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'GUEST', label: 'Guest Visit', icon: <Users size={18} />, desc: 'Friends & Family' },
    { id: 'DELIVERY', label: 'Delivery', icon: <Truck size={18} />, desc: 'Swiggy, Zomato, Amazon' },
    { id: 'CAB', label: 'Cab / Ride', icon: <Car size={18} />, desc: 'Uber, Ola, Rapido' },
    { id: 'SERVICE_PROVIDER', label: 'Service Staff', icon: <Wrench size={18} />, desc: 'Plumber, AC Repair' },
    { id: 'DOMESTIC_WORKER', label: 'Daily Staff', icon: <ShieldCheck size={18} />, desc: 'Maid, Cook, Driver' },
    { id: 'EVENT_GROUP', label: 'Group / Party', icon: <Sparkles size={18} />, desc: 'Multiple Entry Pass' },
  ];

  return (
    <div style={{ background: '#F7FBFE', minHeight: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-44">
        
        {/* Header Card (Exact QRParkingHub.tsx Reference Layout) */}
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
            marginBottom: '1rem',
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
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em' }}>
                Visitor &amp; Gate Pass Hub
              </h2>
              <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
                Green Valley Society · Basement slot mapping, dynamic QR gate passes &amp; vehicle allocation
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
              <span>Flat {currentFlat}</span>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
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
              <Plus size={15} /> Pre-Approve Visitor
            </button>
          </div>
        </div>

        {/* Metrics Summary Grid (4 Cards - QRParkingHub.tsx style) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }} className="sm:grid-cols-4">
          {/* TOTAL PASSES */}
          <div
            style={{
              background: 'var(--aarizo-card-bg, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
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
              <Users size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--aarizo-text-secondary, #657785)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                TOTAL PASSES
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', lineHeight: 1.1 }}>
                {metrics.total}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                All time passes
              </div>
            </div>
          </div>

          {/* EXPECTED TODAY */}
          <div
            style={{
              background: 'var(--aarizo-card-bg, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
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
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--aarizo-text-secondary, #657785)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                EXPECTED TODAY
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>
                {metrics.expected}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                Pre-approved visitors
              </div>
            </div>
          </div>

          {/* CHECKED IN */}
          <div
            style={{
              background: 'var(--aarizo-card-bg, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(22, 163, 74, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16A34A',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--aarizo-text-secondary, #657785)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                CHECKED IN
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16A34A', lineHeight: 1.1 }}>
                {metrics.checkedIn}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                Currently inside
              </div>
            </div>
          </div>

          {/* PAST / REVOKED */}
          <div
            style={{
              background: 'var(--aarizo-card-bg, #ffffff)',
              borderRadius: '14px',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(220, 38, 38, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
                flexShrink: 0,
              }}
            >
              <Ban size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--aarizo-text-secondary, #657785)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                PAST / REVOKED
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626', lineHeight: 1.1 }}>
                {metrics.past}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>
                Cancelled or expired
              </div>
            </div>
          </div>
        </div>

        {/* Quick 1-Tap Pass Creation Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={14} style={{ color: '#F06543' }} /> Quick 1-Tap Pass Creation
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem' }} className="sm:grid-cols-4">
            <button
              onClick={() => openCreateWithCategory('DELIVERY')}
              style={{
                padding: '0.75rem',
                borderRadius: '14px',
                background: '#ffffff',
                border: '1px solid #DCE8EF',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 1px 3px rgba(8,59,86,0.04)',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#FFF0EC', color: '#F06543', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Truck size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#083B56', lineHeight: 1.2 }} className="truncate">Delivery</div>
                <div style={{ fontSize: '0.6875rem', color: '#657785' }} className="truncate">Swiggy, Zomato</div>
              </div>
            </button>

            <button
              onClick={() => openCreateWithCategory('GUEST')}
              style={{
                padding: '0.75rem',
                borderRadius: '14px',
                background: '#ffffff',
                border: '1px solid #DCE8EF',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 1px 3px rgba(8,59,86,0.04)',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#083B56', lineHeight: 1.2 }} className="truncate">Guest Visit</div>
                <div style={{ fontSize: '0.6875rem', color: '#657785' }} className="truncate">Friends &amp; Family</div>
              </div>
            </button>

            <button
              onClick={() => openCreateWithCategory('CAB')}
              style={{
                padding: '0.75rem',
                borderRadius: '14px',
                background: '#ffffff',
                border: '1px solid #DCE8EF',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 1px 3px rgba(8,59,86,0.04)',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Car size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#083B56', lineHeight: 1.2 }} className="truncate">Cab / Taxi</div>
                <div style={{ fontSize: '0.6875rem', color: '#657785' }} className="truncate">Uber, Ola</div>
              </div>
            </button>

            <button
              onClick={() => openCreateWithCategory('SERVICE_PROVIDER')}
              style={{
                padding: '0.75rem',
                borderRadius: '14px',
                background: '#ffffff',
                border: '1px solid #DCE8EF',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 1px 3px rgba(8,59,86,0.04)',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#F3E8FF', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Wrench size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#083B56', lineHeight: 1.2 }} className="truncate">Service Staff</div>
                <div style={{ fontSize: '0.6875rem', color: '#657785' }} className="truncate">Repair &amp; Service</div>
              </div>
            </button>
          </div>
        </div>

        {/* Filter Pills Tabs (Exact QRParkingHub.tsx style) */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '2px' }}>
          <button
            onClick={() => setActiveTab('ALL')}
            style={{
              padding: '0.45rem 0.875rem',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              border: activeTab === 'ALL' ? 'none' : '1px solid #DCE8EF',
              background: activeTab === 'ALL' ? '#F06543' : '#ffffff',
              color: activeTab === 'ALL' ? '#ffffff' : '#083B56',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === 'ALL' ? '0 2px 8px rgba(240, 101, 67, 0.25)' : 'none',
            }}
          >
            All Passes ({metrics.total})
          </button>
          <button
            onClick={() => setActiveTab('EXPECTED')}
            style={{
              padding: '0.45rem 0.875rem',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              border: activeTab === 'EXPECTED' ? 'none' : '1px solid #DCE8EF',
              background: activeTab === 'EXPECTED' ? '#F06543' : '#ffffff',
              color: activeTab === 'EXPECTED' ? '#ffffff' : '#083B56',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === 'EXPECTED' ? '0 2px 8px rgba(240, 101, 67, 0.25)' : 'none',
            }}
          >
            Expected ({metrics.expected})
          </button>
          <button
            onClick={() => setActiveTab('CHECKED_IN')}
            style={{
              padding: '0.45rem 0.875rem',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              border: activeTab === 'CHECKED_IN' ? 'none' : '1px solid #DCE8EF',
              background: activeTab === 'CHECKED_IN' ? '#F06543' : '#ffffff',
              color: activeTab === 'CHECKED_IN' ? '#ffffff' : '#083B56',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === 'CHECKED_IN' ? '0 2px 8px rgba(240, 101, 67, 0.25)' : 'none',
            }}
          >
            Inside Gate ({metrics.checkedIn})
          </button>
          <button
            onClick={() => setActiveTab('PAST')}
            style={{
              padding: '0.45rem 0.875rem',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              border: activeTab === 'PAST' ? 'none' : '1px solid #DCE8EF',
              background: activeTab === 'PAST' ? '#F06543' : '#ffffff',
              color: activeTab === 'PAST' ? '#ffffff' : '#083B56',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === 'PAST' ? '0 2px 8px rgba(240, 101, 67, 0.25)' : 'none',
            }}
          >
            History ({metrics.past})
          </button>
        </div>

        {/* Search Bar + Filter Icon Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search visitor name, phone number, or pass code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: '12px',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                background: '#ffffff',
                border: '1px solid #DCE8EF',
                borderRadius: '10px',
                fontSize: '0.75rem',
                color: '#083B56',
                fontWeight: 500,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: '#ffffff',
              border: '1px solid #DCE8EF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#083B56',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Filter"
          >
            <Filter size={15} />
          </button>
        </div>

        {/* Visitor Cards Grid (Exact QRParkingHub.tsx slot card styling) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPasses.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-[#DCE8EF] p-10 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFF0EC] flex items-center justify-center text-[#F06543]">
                <Users size={26} />
              </div>
              <h3 className="text-base font-extrabold text-[#083B56]" style={{ margin: 0 }}>No Visitor Passes Found</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto" style={{ margin: '0.25rem auto 0' }}>
                {searchQuery
                  ? `No pass matching "${searchQuery}". Try changing your search query.`
                  : 'Generate a quick gate pass to pre-authorize your expected guests or deliveries at the gate.'}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#F06543] text-white text-xs font-bold shadow-sm hover:bg-[#d95333] transition-all inline-flex items-center gap-1.5 cursor-pointer mt-2"
              >
                <Plus size={16} /> Pre-Approve Visitor Now
              </button>
            </div>
          ) : (
            filteredPasses.map((pass) => (
              <div
                key={pass.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #DCE8EF',
                  borderLeft: pass.status === 'EXPECTED' ? '4px solid #0284C7' : pass.status === 'CHECKED_IN' ? '4px solid #16A34A' : '4px solid #CBD5E1',
                  padding: '1rem',
                  boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  {/* Category & Status Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: pass.category === 'DELIVERY' ? '#0284C7' : '#F06543',
                        background: pass.category === 'DELIVERY' ? '#E0F2FE' : '#FFF0EC',
                        border: pass.category === 'DELIVERY' ? '1px solid #BAE6FD' : '1px solid #FED7AA',
                      }}
                    >
                      {getCategoryIcon(pass.category)}
                      {pass.category.replace(/_/g, ' ')}
                    </span>
                    <StatusBadge
                      label={pass.status.replace(/_/g, ' ')}
                      variant={
                        pass.status === 'EXPECTED'
                          ? 'info'
                          : pass.status === 'CHECKED_IN'
                          ? 'success'
                          : pass.status === 'REVOKED'
                          ? 'danger'
                          : 'neutral'
                      }
                    />
                  </div>

                  {/* Visitor Avatar & Name Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: pass.category === 'DELIVERY' ? '#7C3AED' : '#083B56',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        flexShrink: 0,
                      }}
                    >
                      {pass.visitorName.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#083B56', margin: 0, lineHeight: 1.2 }} className="truncate">
                        {pass.visitorName}
                      </h3>
                      <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#657785', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 2 }}>
                        <Phone size={12} style={{ color: '#F06543' }} /> {pass.visitorPhone}
                      </div>
                    </div>
                  </div>

                  {/* Single-Column Clean Details Box (Prevents Mobile Overflows) */}
                  <div style={{ background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '0.625rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ color: '#657785', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FileText size={12} style={{ color: '#94A3B8' }} />
                        {pass.companyName ? 'Company' : 'Purpose'}
                      </span>
                      <span style={{ color: '#083B56', fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        {pass.companyName || pass.purpose || 'Visitor Entry'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ color: '#657785', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Car size={12} style={{ color: '#0284C7' }} />
                        Vehicle (Optional)
                      </span>
                      <span style={{
                        background: '#083B56',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '0.6875rem',
                        borderRadius: '4px',
                        padding: '0.15rem 0.5rem',
                        letterSpacing: '0.04em'
                      }}>
                        {pass.vehicleNumber || 'MH-12-AB-9876'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingTop: '0.35rem', borderTop: '1px solid #E2E8F0' }}>
                      <span style={{ color: '#657785', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={12} style={{ color: '#D97706' }} />
                        Pass Code
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{
                          background: '#FFF0EC',
                          color: '#F06543',
                          border: '1px solid #FED7AA',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                          padding: '0.15rem 0.5rem',
                          letterSpacing: '0.04em'
                        }}>
                          {pass.passCode}
                        </span>
                        <button
                          onClick={() => copyToClipboard(pass.passCode)}
                          style={{ border: 'none', background: 'transparent', padding: 2, cursor: 'pointer', color: '#657785' }}
                          title="Copy Pass Code"
                        >
                          {copiedCode === pass.passCode ? <Check size={12} style={{ color: '#16A34A' }} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.625rem', borderTop: '1px solid #DCE8EF' }}>
                  <button
                    onClick={() => setSelectedPassForQR(pass)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.875rem',
                      borderRadius: '10px',
                      background: '#F06543',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <QrCode size={15} /> View QR Pass
                  </button>

                  <button
                    onClick={() => shareViaWhatsApp(pass)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      background: '#F8FAFC',
                      border: '1px solid #DCE8EF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#083B56',
                      cursor: 'pointer'
                    }}
                    title="Share Pass via WhatsApp"
                  >
                    <Share2 size={15} />
                  </button>

                  {pass.status === 'EXPECTED' && (
                    <button
                      onClick={() => handleRevoke(pass.id)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#DC2626',
                        cursor: 'pointer'
                      }}
                      title="Revoke Gate Pass"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      {/* Pre-Approve Visitor Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Generate Visitor Gate Pass">
        <Form onSubmit={handleCreatePass}>
          {/* Category Selector Grid */}
          <div className="space-y-1.5 mb-4">
            <label className="text-xs font-bold text-[#083B56]">Select Visitor Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categoriesConfig.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => openCreateWithCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    category === cat.id
                      ? 'border-[#F06543] bg-orange-50/50 text-[#F06543] font-bold ring-1 ring-[#F06543]'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={category === cat.id ? 'text-[#F06543]' : 'text-slate-500'}>
                      {cat.icon}
                    </span>
                    {category === cat.id && <CheckCircle2 size={14} className="text-[#F06543]" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{cat.label}</p>
                    <p className="text-[10px] text-slate-400 truncate">{cat.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Visitor / Contact Name" required>
              <input
                type="text"
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
              />
            </FormField>

            <FormField label="Mobile Number" required>
              <input
                type="tel"
                required
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <FormField label="Pass Validity Type">
              <select
                value={passLifecycle}
                onChange={(e) => setPassLifecycle(e.target.value as PassLifecycleType)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
              >
                <option value="ONE_TIME">One-Time Entry (Single Use)</option>
                <option value="REUSABLE">Reusable Pass (Frequent Entry)</option>
                <option value="SCHEDULED">Scheduled Date Window</option>
              </select>
            </FormField>

            <FormField label="Company / Service (Optional)">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Swiggy, Uber, UrbanCompany"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <FormField label="Vehicle Number (Optional)">
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. MH-12-AB-1234"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
              />
            </FormField>

            <FormField label="Purpose / Remarks">
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Weekend Dinner / Plumbing Repair"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
              />
            </FormField>
          </div>

          {category === 'EVENT_GROUP' && (
            <div className="mt-3">
              <FormField label="Expected Group Size (Count)">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={groupCount}
                  onChange={(e) => setGroupCount(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543] focus:outline-none"
                />
              </FormField>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-xs font-bold text-[#083B56] mb-1.5">
              Visitor Photo / ID Document (Optional)
            </label>
            <FileUploader
              label="Attach Visitor Photo or ID Proof"
              entityType="resident"
              entityId={currentResidentId}
              societyId={currentSocietyId}
              accept="image/*,application/pdf"
              maxSizeMB={5}
              onUploadSuccess={(res) => {
                setVisitorPhotoUrl(res.downloadUrl);
              }}
              onRemove={() => setVisitorPhotoUrl('')}
            />
            {visitorPhotoUrl && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 size={14} />
                <span>Photo / ID Document attached successfully</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-[#DCE8EF]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-[#DCE8EF] bg-[#F8FAFC] text-[#475569] font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              style={{
                background: '#F06543',
                boxShadow: '0 3px 10px rgba(240, 101, 67, 0.25)',
                border: 'none',
              }}
            >
              Generate QR Gate Pass
            </button>
          </div>
        </Form>
      </Modal>

      {/* QR Pass Preview Modal */}
      {selectedPassForQR && (
        <Modal isOpen={!!selectedPassForQR} onClose={() => setSelectedPassForQR(null)} title="Gate Entry Digital Ticket">
          <div className="text-center space-y-4 py-2">
            {/* Ticket Box */}
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-5 relative overflow-hidden">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-[#FFF0EC] text-[#F06543] uppercase tracking-wider mb-2">
                {selectedPassForQR.category.replace(/_/g, ' ')}
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-1">{selectedPassForQR.visitorName}</h3>
              <p className="text-xs text-slate-500 mb-4">
                Authorized entry for <strong>Flat {currentFlat}</strong>
              </p>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 inline-block mb-4">
                <QRGenerator value={selectedPassForQR.qrDataString} label={selectedPassForQR.passCode} size={180} />
              </div>

              {/* Monospace Code Highlight */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 max-w-xs mx-auto flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-amber-800">4-Digit Security Code</p>
                  <p className="text-lg font-mono font-extrabold text-[#F06543] tracking-widest">
                    {selectedPassForQR.passCode}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedPassForQR.passCode)}
                  className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-amber-100 transition-colors flex items-center gap-1"
                >
                  {copiedCode === selectedPassForQR.passCode ? (
                    <>
                      <Check size={13} className="text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => shareViaWhatsApp(selectedPassForQR)}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Share2 size={16} /> Share Pass via WhatsApp
              </button>
              <button
                onClick={() => setSelectedPassForQR(null)}
                className="py-3 px-4 rounded-xl border border-slate-300 bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Floating Offers Pill Launcher & Popup */}
      <OffersLauncherPill onOpen={() => setIsOffersOpen(true)} />
      <AdvertisementPopup
        forceOpen={isOffersOpen}
        onClose={() => setIsOffersOpen(false)}
        societyId={currentSocietyId}
      />
    </div>
  </div>
);
};


