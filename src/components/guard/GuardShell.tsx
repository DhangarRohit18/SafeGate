import React, { useState, useEffect } from 'react';
import type {
  GuardVisitor,
  GateHistoryRecord,
  GuardAlert,
  Gate,
  GuardDashboardStats,
} from '../../domains/guard/types';
import { MOCK_GUARD_PROFILE } from '../../mockData/guard/guardProfile';
import { MOCK_GATES } from '../../mockData/guard/gates';
import { INITIAL_GATE_HISTORY } from '../../mockData/guard/gateHistory';
import { INITIAL_GUARD_ALERTS } from '../../mockData/guard/guardAlerts';
import { apiClient } from '../../services/apiClient';
import { realtimeService } from '../../services/realtimeService';

import { GuardHome } from './home/GuardHome';
import { PassVerification } from './verification/PassVerification';
import { VisitorVerificationDetail } from './verification/VisitorVerificationDetail';
import { GateDecisionModal } from './verification/GateDecisionModal';
import { CheckInPanel } from './entry/CheckInPanel';
import { InsideVisitors } from './entry/InsideVisitors';
import { GuardVisitors } from './visitors/GuardVisitors';
import { GateHistory } from './history/GateHistory';
import { GuardAlerts } from './alerts/GuardAlerts';
import { GuardProfile } from './profile/GuardProfile';

import './guard.css';

export type GuardShellTab = 'home' | 'verify' | 'visitors' | 'inside' | 'history' | 'alerts' | 'more';

export const GuardShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GuardShellTab>('home');

  // Guard domain live state from PostgreSQL
  const [gate, setGate] = useState<Gate>(MOCK_GATES[0]);
  const [visitors, setVisitors] = useState<GuardVisitor[]>([]);
  const [history, setHistory] = useState<GateHistoryRecord[]>(INITIAL_GATE_HISTORY);
  const [alerts, setAlerts] = useState<GuardAlert[]>(INITIAL_GUARD_ALERTS);

  const loadGuardData = async () => {
    try {
      const passes = await apiClient.getVisitorPasses();
      if (passes && Array.isArray(passes) && passes.length > 0) {
        const mapped: GuardVisitor[] = passes.map((p: any) => {
          const code = p.passCode || (p.id ? p.id.replace(/^pass-/, '') : '8492');
          return {
            id: p.id,
            passcode: code,
            name: p.visitorName,
            phone: p.phone,
            visitorType: (p.passType?.toLowerCase() || 'guest') as any,
            visitorTypeLabel: `${p.passType || 'Guest'} Visitor`,
            residentName: p.residentName || 'Vikram Joshi',
            flatCode: p.flatCode || 'Flat 1204',
            tower: p.towerName || 'Tower B',
            societyName: 'Green Valley Society',
            vehicleNumber: p.vehicleNumber || undefined,
            expectedDate: 'Today',
            expectedTimeSlot: new Date(p.validFrom || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: p.status === 'CHECKED_IN' ? 'checked_in' : (p.status === 'EXPIRED' ? 'expired' : p.status === 'CANCELLED' ? 'cancelled' : p.status === 'APPROVED' ? 'approved' : 'expected'),
            verificationStatus: p.status === 'EXPIRED' ? 'expired' : p.status === 'CANCELLED' ? 'cancelled' : 'valid',
            createdAt: new Date(p.createdAt || Date.now()).toLocaleDateString(),
            gateName: 'Gate #1 Main Entrance',
            gateOfficer: 'Officer Ramesh Shinde',
            notes: p.purpose || 'Visit',
          };
        });
        setVisitors(mapped);
      }
    } catch (err) {
      console.error('Error loading guard visitors:', err);
    }
  };

  useEffect(() => {
    loadGuardData();
    const unsub = realtimeService.subscribe('*', () => {
      loadGuardData();
    });
    return () => unsub();
  }, []);

  // Active modal / detail selection states
  const [selectedVisitor, setSelectedVisitor] = useState<GuardVisitor | null>(null);
  const [decisionModalMode, setDecisionModalMode] = useState<'approve' | 'reject' | null>(null);
  const [showCheckInPanel, setShowCheckInPanel] = useState<boolean>(false);

  // Calculate dashboard stats
  const stats: GuardDashboardStats = {
    expectedToday: visitors.filter((v) => v.status === 'expected').length,
    atGate: visitors.filter((v) => v.status === 'at_gate' || v.status === 'approval_required').length,
    inside: visitors.filter((v) => v.status === 'checked_in').length,
    pendingApproval: visitors.filter((v) => v.status === 'approval_required').length,
  };

  const handleToggleGateStatus = () => {
    setGate((prev) => ({
      ...prev,
      status: prev.status === 'open' ? 'closed' : 'open',
    }));
  };

  const handleSelectVisitor = (visitor: GuardVisitor) => {
    setSelectedVisitor(visitor);
    setActiveTab('verify');
  };

  const handleConfirmApprove = (visitor: GuardVisitor) => {
    setVisitors((prev) =>
      prev.map((v) => (v.id === visitor.id ? { ...v, status: 'approved', approvedAt: 'Just Now' } : v))
    );
    setSelectedVisitor((prev) => (prev ? { ...prev, status: 'approved' } : null));
    setDecisionModalMode(null);
    setShowCheckInPanel(true);
  };

  const handleConfirmReject = (visitor: GuardVisitor, reason: string) => {
    const timestamp = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setVisitors((prev) =>
      prev.map((v) =>
        v.id === visitor.id ? { ...v, status: 'rejected', rejectionReason: reason } : v
      )
    );

    const newHistoryRecord: GateHistoryRecord = {
      id: `hist-rej-${Date.now()}`,
      visitorId: visitor.id,
      visitorName: visitor.name,
      visitorType: visitor.visitorType,
      residentName: visitor.residentName,
      flatCode: `${visitor.tower} · ${visitor.flatCode}`,
      action: 'entry_rejected',
      actionLabel: 'Entry Rejected',
      timestamp,
      gateName: gate.name,
      gateOfficer: MOCK_GUARD_PROFILE.name,
      rejectionReason: reason,
    };

    setHistory((prev) => [newHistoryRecord, ...prev]);
    setSelectedVisitor(null);
    setDecisionModalMode(null);
    setActiveTab('history');
  };

  const handleConfirmCheckIn = (visitor: GuardVisitor) => {
    const timestamp = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setVisitors((prev) =>
      prev.map((v) =>
        v.id === visitor.id ? { ...v, status: 'checked_in', checkedInAt: timestamp } : v
      )
    );

    const newHistoryRecord: GateHistoryRecord = {
      id: `hist-in-${Date.now()}`,
      visitorId: visitor.id,
      visitorName: visitor.name,
      visitorType: visitor.visitorType,
      residentName: visitor.residentName,
      flatCode: `${visitor.tower} · ${visitor.flatCode}`,
      action: 'checked_in',
      actionLabel: 'Checked In',
      timestamp,
      gateName: gate.name,
      gateOfficer: MOCK_GUARD_PROFILE.name,
    };

    setHistory((prev) => [newHistoryRecord, ...prev]);
    setShowCheckInPanel(false);
    setSelectedVisitor(null);
    setActiveTab('inside');
  };

  const handleCheckOutVisitor = (visitor: GuardVisitor) => {
    const timestamp = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setVisitors((prev) =>
      prev.map((v) =>
        v.id === visitor.id ? { ...v, status: 'checked_out', checkedOutAt: timestamp } : v
      )
    );

    const newHistoryRecord: GateHistoryRecord = {
      id: `hist-out-${Date.now()}`,
      visitorId: visitor.id,
      visitorName: visitor.name,
      visitorType: visitor.visitorType,
      residentName: visitor.residentName,
      flatCode: `${visitor.tower} · ${visitor.flatCode}`,
      action: 'checked_out',
      actionLabel: 'Checked Out',
      timestamp,
      gateName: gate.name,
      gateOfficer: MOCK_GUARD_PROFILE.name,
    };

    setHistory((prev) => [newHistoryRecord, ...prev]);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isAcknowledged: true } : a))
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'verify') {
      if (selectedVisitor) {
        return (
          <VisitorVerificationDetail
            visitor={selectedVisitor}
            onBack={() => setSelectedVisitor(null)}
            onApprove={() => setDecisionModalMode('approve')}
            onReject={() => setDecisionModalMode('reject')}
          />
        );
      }
      return <PassVerification visitors={visitors} onSelectVisitor={handleSelectVisitor} />;
    }

    switch (activeTab) {
      case 'home':
        return (
          <GuardHome
            stats={stats}
            gate={gate}
            onToggleGateStatus={handleToggleGateStatus}
            pendingVisitors={visitors.filter((v) => v.status === 'approval_required')}
            recentActivity={visitors.slice(0, 3)}
            onOpenVerify={() => setActiveTab('verify')}
            onSelectVisitor={handleSelectVisitor}
            onNavigateTab={(t) => setActiveTab(t)}
          />
        );
      case 'visitors':
        return <GuardVisitors visitors={visitors} onSelectVisitor={handleSelectVisitor} />;
      case 'inside':
        return (
          <InsideVisitors
            insideList={visitors.filter((v) => v.status === 'checked_in')}
            onCheckOut={handleCheckOutVisitor}
          />
        );
      case 'history':
        return <GateHistory history={history} />;
      case 'alerts':
        return <GuardAlerts alerts={alerts} onAcknowledgeAlert={handleAcknowledgeAlert} />;
      case 'more':
        return <GuardProfile />;
      default:
        return (
          <GuardHome
            stats={stats}
            gate={gate}
            onToggleGateStatus={handleToggleGateStatus}
            pendingVisitors={visitors.filter((v) => v.status === 'approval_required')}
            recentActivity={visitors.slice(0, 3)}
            onOpenVerify={() => setActiveTab('verify')}
            onSelectVisitor={handleSelectVisitor}
            onNavigateTab={(t) => setActiveTab(t)}
          />
        );
    }
  };

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f7f4ee' }}>
      {/* Main Guard Viewport */}
      <main style={{ padding: '0' }}>{renderTabContent()}</main>

      {/* Decision Modal (Approve / Reject) */}
      {decisionModalMode && selectedVisitor && (
        <GateDecisionModal
          mode={decisionModalMode}
          visitor={selectedVisitor}
          onConfirmApprove={handleConfirmApprove}
          onConfirmReject={handleConfirmReject}
          onClose={() => setDecisionModalMode(null)}
        />
      )}

      {/* Check-In Panel */}
      {showCheckInPanel && selectedVisitor && (
        <CheckInPanel
          visitor={selectedVisitor}
          onConfirmCheckIn={handleConfirmCheckIn}
          onCancel={() => setShowCheckInPanel(false)}
        />
      )}
    </div>
  );
};
