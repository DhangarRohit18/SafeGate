import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Search, Package, BarChart3, ArrowLeft } from 'lucide-react';
import { visitorService } from '../../../services/visitorService';
import type { SmartVisitorPass, VisitorAnalyticsData } from '../../../types/visitor';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { VisitorAnalyticsWidget } from '../../../components/visitor/VisitorAnalyticsWidget';
import { ParcelRoomSecurityHub } from '../../../domains/deliveries/components/ParcelRoomSecurityHub';
import { DataTable } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';

export const DeliveryIntelligencePage: React.FC = () => {
  const navigate = useNavigate();
  const currentSocietyId = 'soc-gvs';
  const officerActor = { id: 'sec-guard-1', name: 'Officer Vikram Singh', role: 'SECURITY' };

  const [passes, setPasses] = useState<SmartVisitorPass[]>([]);
  const [analytics, setAnalytics] = useState<VisitorAnalyticsData>({
    peakVisitingHours: [],
    repeatVisitors: [],
    averageStayDurationMinutes: 0,
    deliveryVolumeByVendor: [],
    dailyVisitorTrend: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'PARCEL_ROOM' | 'DELIVERIES' | 'ANALYTICS'>('PARCEL_ROOM');

  const reloadData = () => {
    const list = visitorService.getPasses(currentSocietyId);
    setPasses(list);
    setAnalytics(visitorService.getVisitorAnalytics(currentSocietyId));
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleRecordPickup = (passId: string) => {
    visitorService.recordDeliveryPickup(passId, officerActor);
    reloadData();
  };

  const deliveryPasses = passes.filter((p) => p.category === 'DELIVERY');
  const filteredDeliveries = deliveryPasses.filter(
    (p) =>
      p.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.flatCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.deliveryVendor && p.deliveryVendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.packageReferenceNumber && p.packageReferenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ background: 'var(--aarizo-page, #F7FBFE)', minHeight: '100vh', paddingBottom: '5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Top Header */}
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
                  Parcel & Delivery Intelligence
                </h1>
                <span
                  style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#059669',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                  Parcel Room Active
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#52788D' }}>
                Track courier packages, manage parcel room holding & inspect visitor peak hours
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '1.25rem auto', padding: '0 1rem' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#ffffff', padding: '0.35rem', borderRadius: '12px', border: '1px solid #DCE8EF', marginBottom: '1.25rem' }}>
          {[
            { key: 'PARCEL_ROOM', label: 'Parcel Holding Hub', icon: Package },
            { key: 'DELIVERIES', label: `Delivery Gate Log (${deliveryPasses.length})`, icon: Truck },
            { key: 'ANALYTICS', label: 'Visitor & Delivery Analytics', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  flex: 1,
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  background: isActive ? '#F4FAFE' : 'transparent',
                  color: isActive ? '#083B56' : '#52788D',
                  borderBottom: isActive ? '2px solid #F06543' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon size={16} color={isActive ? '#F06543' : '#52788D'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 0: Parcel Room Hub */}
        {activeTab === 'PARCEL_ROOM' && <ParcelRoomSecurityHub />}

        {/* Tab 1: Delivery Log */}
        {activeTab === 'DELIVERIES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '1.25rem' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search vendor, package ref, flat code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem 0.65rem 2.3rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    background: '#F8FAFC',
                    color: '#083B56',
                    fontWeight: 600,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <DataTable
                columns={[
                  {
                    key: 'vendor',
                    header: 'Vendor',
                    render: (p: SmartVisitorPass) => (
                      <span style={{ fontWeight: 800, color: '#083B56' }}>
                        {p.deliveryVendor || p.companyName || 'Courier'}
                      </span>
                    )
                  },
                  { key: 'packageRef', header: 'Package Ref No', render: (p: SmartVisitorPass) => <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#083B56' }}>{p.packageReferenceNumber || 'N/A'}</span> },
                  { key: 'flatResident', header: 'Flat & Resident', render: (p: SmartVisitorPass) => `Flat ${p.flatCode} (${p.residentName})` },
                  { key: 'agent', header: 'Agent Name', render: (p: SmartVisitorPass) => `${p.visitorName} (${p.visitorPhone})` },
                  { key: 'entryTime', header: 'Entry Time', render: (p: SmartVisitorPass) => p.checkedInAt || 'Pending' },
                  { key: 'pickupTime', header: 'Pickup Time', render: (p: SmartVisitorPass) => p.pickupTimestamp || 'Awaiting Pickup' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (p: SmartVisitorPass) => (
                      <StatusBadge
                        variant={p.status === 'CHECKED_OUT' ? 'success' : p.isOverdue ? 'danger' : 'info'}
                        label={p.status === 'CHECKED_OUT' ? 'PICKED UP' : p.status}
                      />
                    )
                  },
                  {
                    key: 'actions',
                    header: 'Pickup Action',
                    render: (p: SmartVisitorPass) => (
                      p.status === 'CHECKED_IN' ? (
                        <button
                          onClick={() => handleRecordPickup(p.id)}
                          style={{
                            padding: '0.45rem 0.85rem',
                            background: '#059669',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Record Pickup
                        </button>
                      ) : null
                    )
                  }
                ]}
                data={filteredDeliveries}
                keyExtractor={(p: SmartVisitorPass) => p.id}
                pageSize={10}
                mobileRender={(p: SmartVisitorPass) => (
                  <MobileDataCard
                    title={`${p.deliveryVendor || p.companyName || 'Courier'} • Flat ${p.flatCode}`}
                    subtitle={`Agent: ${p.visitorName} (${p.visitorPhone})`}
                    status={
                      <StatusBadge
                        variant={p.status === 'CHECKED_OUT' ? 'success' : p.isOverdue ? 'danger' : 'info'}
                        label={p.status === 'CHECKED_OUT' ? 'PICKED UP' : p.status}
                      />
                    }
                    attributes={[
                      { label: 'Package Ref', value: p.packageReferenceNumber || 'N/A' },
                      { label: 'Resident', value: p.residentName },
                      { label: 'Entry Time', value: p.checkedInAt || 'Pending' },
                      { label: 'Pickup Time', value: p.pickupTimestamp || 'Awaiting Pickup' }
                    ]}
                    actions={
                      p.status === 'CHECKED_IN' ? (
                        <button
                          onClick={() => handleRecordPickup(p.id)}
                          style={{
                            width: '100%',
                            padding: '0.65rem',
                            background: '#059669',
                            color: '#ffffff',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Record Package Pickup
                        </button>
                      ) : undefined
                    }
                  />
                )}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Visitor Analytics */}
        {activeTab === 'ANALYTICS' && (
          <div style={{ background: '#ffffff', border: '1px solid #DCE8EF', borderRadius: '16px', padding: '1.25rem' }}>
            <VisitorAnalyticsWidget analytics={analytics} />
          </div>
        )}
      </div>
    </div>
  );
};
