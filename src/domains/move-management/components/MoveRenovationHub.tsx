import React, { useState, useEffect } from 'react';
import {
  Truck,
  Wrench,
  Calendar,
  ShieldCheck,
  PlusCircle,
  QrCode,
  AlertTriangle,
  RefreshCw,
  CheckSquare,
  Square,
} from 'lucide-react';
import { moveRenovationService } from '../services/moveRenovationService';
import type { MoveEvent, MoveType } from '../types';
import type { RenovationPermit } from '../../renovation/types';
import { useAuth } from '../../../context/AuthContext';
import { realTimeSync } from '../../../services/realTimeSync';
import { realtimeService } from '../../../services/realtimeService';
import { FileUpload } from '../../../components/ui/FileUpload';
import { RazorpayCheckoutModal } from '../../../domains/payments/RazorpayCheckoutModal';
import { AdvertisementPopup } from '../../../components/ads/AdvertisementPopup';
import { OffersLauncherPill } from '../../../components/ads/OffersLauncherPill';
import { Modal } from '../../../components/ui/Modal';

export const MoveRenovationHub: React.FC = () => {
  const { currentUser } = useAuth();
  const activeRole = (currentUser?.role || '').toLowerCase();

  const isAdmin = ['admin', 'secretary'].includes(activeRole);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(5000);
  const [depositPurpose, setDepositPurpose] = useState('Move-In Refundable Security Deposit');
  const [_contractorDocUrl, setContractorDocUrl] = useState('');
  const [isAdOpen, setIsAdOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'MOVES' | 'RENOVATIONS' | 'CALENDAR' | 'SECURITY_SCANNER'>('MOVES');
  const [moves, setMoves] = useState<MoveEvent[]>(() => moveRenovationService.getMoves());
  const [renovations, setRenovations] = useState<RenovationPermit[]>(() => moveRenovationService.getRenovations());

  const [_searchQuery, _setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'CREATE_MOVE' | 'CREATE_RENOVATION' | 'VIEW_GATEPASS' | null>(null);
  const [_selectedMove, _setSelectedMove] = useState<MoveEvent | null>(null);
  const [_selectedRenovation, _setSelectedRenovation] = useState<RenovationPermit | null>(null);

  // Forms
  const [moveForm, setMoveForm] = useState({
    moveType: 'MOVE_IN' as MoveType,
    flatNumber: 'A-101',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    liftName: 'Freight Elevator 1',
    timeSlot: '09:00 - 12:00' as any,
    vehicleNumber: 'MH-12-AB-9988',
    driverName: 'Raju Driver',
    driverPhone: '+91 98765 00112',
    vehicleType: 'TRUCK' as any,
    vendorCompany: 'Express Movers',
    vendorContact: 'Sunil Manager',
    vendorPhone: '+91 98765 44332',
    workerCount: 3,
  });

  const [renovationForm, setRenovationForm] = useState({
    projectTitle: 'Kitchen & Bathroom Tiling',
    flatNumber: 'B-204',
    contractorCompany: 'Apex Decorators',
    contractorPhone: '+91 98765 77665',
    startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    allowedHoursStart: '09:00',
    allowedHoursEnd: '18:00',
    noiseRestrictions: 'No drilling between 1 PM and 2 PM',
    weekendRulesAllowed: false,
    materials: 'Tiles (100 Sft), Cement (5 Bags), Adhesives',
    workersText: 'Ramesh Singh (Aadhaar 1234), Suresh Kumar (Aadhaar 5678)',
  });

  const [qrScanInput, setQrScanInput] = useState('');

  const loadData = () => {
    setMoves(moveRenovationService.getMoves());
    setRenovations(moveRenovationService.getRenovations());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = realTimeSync.subscribe('MOVE_RENOVATION_UPDATED', () => {
      loadData();
    });
    const unsubRealtime = realtimeService.subscribe('*', (msg) => {
      if (['MOVE_RENOVATION_UPDATED', 'MOVE_GATE_CHECKED_IN', 'SOCIETY_SYNC'].includes(msg.topic)) {
        loadData();
      }
    });
    return () => {
      unsubscribe();
      unsubRealtime();
    };
  }, []);

  const handleCreateMove = (e: React.FormEvent) => {
    e.preventDefault();
    moveRenovationService.submitMoveRequest({
      moveType: moveForm.moveType,
      flatId: `flt-${moveForm.flatNumber.toLowerCase()}`,
      flatNumber: moveForm.flatNumber,
      residentId: currentUser?.id || 'res-1',
      residentName: currentUser?.name || 'Siddharth Malhotra',
      scheduledDate: moveForm.scheduledDate,
      liftSlot: {
        id: `ls-${Date.now()}`,
        liftName: moveForm.liftName,
        date: moveForm.scheduledDate,
        timeSlot: moveForm.timeSlot,
        isReserved: true,
      },
      vehicle: {
        vehicleNumber: moveForm.vehicleNumber,
        driverName: moveForm.driverName,
        driverPhone: moveForm.driverPhone,
        vehicleType: moveForm.vehicleType,
      },
      vendor: {
        companyName: moveForm.vendorCompany,
        contactPerson: moveForm.vendorContact,
        contactPhone: moveForm.vendorPhone,
        workerCount: moveForm.workerCount,
      },
    });

    setModalMode(null);
    loadData();
    alert('Move request submitted for society admin approval.');
  };

  const handleCreateRenovation = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWorkers = renovationForm.workersText.split(',').map((wStr, idx) => ({
      id: `wrk-${Date.now()}-${idx}`,
      workerName: wStr.trim(),
      idProofType: 'AADAAR' as any,
      idNumber: 'VERIFIED-ID',
      phone: '+91 98765 00000',
      isVerifiedBySecurity: false,
      qrCode: `QR-REN-${Math.floor(1000 + Math.random() * 9000)}`,
    }));

    moveRenovationService.submitRenovation({
      projectTitle: renovationForm.projectTitle,
      flatId: `flt-${renovationForm.flatNumber.toLowerCase()}`,
      flatNumber: renovationForm.flatNumber,
      residentId: currentUser?.id || 'res-1',
      residentName: currentUser?.name || 'Resident',
      contractorCompany: renovationForm.contractorCompany,
      contractorPhone: renovationForm.contractorPhone,
      startDate: renovationForm.startDate,
      endDate: renovationForm.endDate,
      allowedHoursStart: renovationForm.allowedHoursStart,
      allowedHoursEnd: renovationForm.allowedHoursEnd,
      noiseRestrictions: renovationForm.noiseRestrictions,
      weekendRulesAllowed: renovationForm.weekendRulesAllowed,
      workers: parsedWorkers,
      materialsList: renovationForm.materials.split(',').map((m) => m.trim()),
    });

    setModalMode(null);
    loadData();
    alert('Renovation permit request submitted for approval.');
  };

  const handleApproveMove = (id: string) => {
    moveRenovationService.approveMoveRequest(id, currentUser?.name || 'Society Admin');
    loadData();
  };

  const handleApproveRenovation = (id: string) => {
    moveRenovationService.approveRenovation(id, currentUser?.name || 'Society Admin');
    loadData();
  };

  const handleToggleChecklist = (moveId: string, title: string, currentVal: boolean) => {
    moveRenovationService.updateMoveChecklist(moveId, title, !currentVal);
    loadData();
  };

  const handleScanWorkerQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrScanInput) return;

    // Search in renovations for worker match
    const permit = renovations.find((r) =>
      r.workers.some((w) => w.workerName.toLowerCase().includes(qrScanInput.toLowerCase()))
    );

    if (permit) {
      moveRenovationService.verifyWorkerAtGate(permit.id, qrScanInput);
      loadData();
      alert(`SECURITY VERIFIED: Worker "${qrScanInput}" verified against approved permit #${permit.gatepassCode}`);
    } else {
      alert(`SECURITY DENIED: No approved worker permit found matching "${qrScanInput}".`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--aarizo-navy, #083B56) 0%, #0D4767 100%)',
          borderRadius: '16px',
          padding: '1.25rem 1.25rem',
          color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(8, 59, 86, 0.08)',
        }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span style={{ padding: '6px', background: 'rgba(255,255,255,0.12)', color: 'var(--aarizo-sky, #83CBEA)', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <Truck size={22} />
            </span>
            <h2 style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.25rem', margin: 0, letterSpacing: '-0.02em' }}>
              Move-In / Move-Out & Renovation Engine
            </h2>
          </div>
          <p style={{ color: 'var(--aarizo-sky, #83CBEA)', fontSize: '0.8125rem', margin: '4px 0 0' }}>
            Lift reservations, contractor gatepasses, worker list verification & exit clearance checklists.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalMode('CREATE_MOVE')}
            style={{
              background: 'var(--aarizo-blue, #176B91)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              padding: '0.625rem 1rem',
              fontWeight: 600,
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <PlusCircle size={16} /> Request Move Slot
          </button>
          <button
            onClick={() => setModalMode('CREATE_RENOVATION')}
            style={{
              background: '#D99A2B',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '0.625rem 1rem',
              fontWeight: 600,
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <Wrench size={16} /> Renovation Permit
          </button>
        </div>
      </div>

      {/* Tabs */}
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
          marginBottom: '1.25rem',
        }}
      >
        {[
          { key: 'MOVES', label: `Move-In / Move-Out (${moves.length})`, icon: Truck },
          { key: 'RENOVATIONS', label: `Renovation Permits (${renovations.length})`, icon: Wrench },
          { key: 'CALENDAR', label: 'Activity Calendar', icon: Calendar },
          { key: 'SECURITY_SCANNER', label: 'Worker Verification', icon: QrCode },
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
                border: isActive ? 'none' : '1px solid #DCE8EF',
                background: isActive ? 'var(--aarizo-navy, #083B56)' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#475569',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 3px 10px rgba(8, 59, 86, 0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
                flexShrink: 0,
              }}
            >
              <Icon size={15} color={isActive ? 'var(--aarizo-sky, #83CBEA)' : 'var(--aarizo-blue, #176B91)'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: MOVES */}
      {activeTab === 'MOVES' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Scheduled Move-In / Move-Out Requests</h3>
            <button onClick={loadData} className="text-xs text-slate-500 flex items-center gap-1">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moves.map((move) => (
              <div key={move.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded ${
                          move.moveType === 'MOVE_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {move.moveType}
                      </span>
                      <span className="font-bold text-slate-900 text-base">Flat {move.flatNumber}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Resident: {move.residentName}</p>
                  </div>

                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      move.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : move.status === 'SUBMITTED'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {move.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Scheduled Date</span>
                    <strong className="text-slate-800 font-semibold">{move.scheduledDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Lift Slot</span>
                    <strong className="text-slate-800 font-semibold">{move.liftSlot.timeSlot}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Vehicle</span>
                    <span className="text-slate-700 font-medium">{move.vehicle.vehicleNumber} ({move.vehicle.vehicleType})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Vendor</span>
                    <span className="text-slate-700 font-medium">{move.vendor.companyName}</span>
                  </div>
                </div>

                {/* Exit Checklist for Move Out */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Move Clearance Checklist ({move.checklist.filter((c) => c.isCompleted).length} / {move.checklist.length})</span>
                  </h5>
                  <div className="space-y-1">
                    {move.checklist.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleChecklist(move.id, item.title, item.isCompleted)}
                        className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded"
                      >
                        {item.isCompleted ? (
                          <CheckSquare size={14} className="text-emerald-600" />
                        ) : (
                          <Square size={14} className="text-slate-400" />
                        )}
                        <span className={item.isCompleted ? 'line-through text-slate-400' : ''}>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="flex items-center gap-1 font-mono text-xs text-[#083B56] font-bold">
                    <QrCode size={14} /> Pass: {move.gatepassCode}
                  </div>

                  {isAdmin && move.status === 'SUBMITTED' && (
                    <button
                      onClick={() => handleApproveMove(move.id)}
                      className="px-3 py-1.5 bg-[#083B56] hover:bg-[#176B91] text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Approve & Issue Gatepass
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: RENOVATIONS */}
      {activeTab === 'RENOVATIONS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Active Renovation Permits</h3>
            <button onClick={loadData} className="text-xs text-slate-500 flex items-center gap-1">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renovations.map((permit) => (
              <div key={permit.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{permit.projectTitle}</h4>
                    <p className="text-xs text-slate-500">
                      Flat {permit.flatNumber} · Contractor: <strong className="text-slate-800">{permit.contractorCompany}</strong>
                    </p>
                  </div>

                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700">
                    {permit.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Work Duration</span>
                    <strong className="text-slate-800 font-semibold">{permit.startDate} to {permit.endDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Permitted Work Hours</span>
                    <strong className="text-slate-800 font-semibold">{permit.allowedHoursStart} - {permit.allowedHoursEnd}</strong>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle size={13} className="text-amber-700" /> Noise & Weekend Rules:
                  </div>
                  <p>{permit.noiseRestrictions}</p>
                </div>

                {/* Worker List */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-slate-700">Approved Worker List ({permit.workers.length})</h5>
                  <div className="space-y-1">
                    {permit.workers.map((w) => (
                      <div key={w.id} className="p-2 bg-slate-50 rounded-lg flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800">{w.workerName}</span>
                        {w.isVerifiedBySecurity ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] flex items-center gap-1">
                            <ShieldCheck size={11} /> VERIFIED AT GATE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px]">PENDING ENTRY</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="font-mono text-xs text-[#083B56] font-bold">Pass: {permit.gatepassCode}</div>
                  {isAdmin && permit.status === 'SUBMITTED' && (
                    <button
                      onClick={() => handleApproveRenovation(permit.id)}
                      className="px-3 py-1.5 bg-[#083B56] hover:bg-[#176B91] text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Approve Renovation Permit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: CALENDAR */}
      {activeTab === 'CALENDAR' && (
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Society Move & Renovation Activity Calendar</h3>
          <p className="text-xs text-slate-500">Upcoming lift allocations and active contractor permits.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#EAF6FC] rounded-xl border border-[#DCE8EF]">
              <p className="text-xs font-semibold text-[#083B56]">Total Active Moves Today</p>
              <h4 className="text-2xl font-bold text-[#083B56] mt-1">2</h4>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-semibold text-amber-700">Active Renovations</p>
              <h4 className="text-2xl font-bold text-amber-900 mt-1">{renovations.length}</h4>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-700">Reserved Freight Lift Slots</p>
              <h4 className="text-2xl font-bold text-emerald-900 mt-1">3 Slots</h4>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: SECURITY SCANNER */}
      {activeTab === 'SECURITY_SCANNER' && (
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="text-center space-y-1">
            <QrCode size={36} className="mx-auto text-[#083B56]" />
            <h3 className="font-bold text-slate-900 text-lg">Gate Security Contractor & Worker Scanner</h3>
            <p className="text-xs text-slate-500">Verify approved worker names against active permits.</p>
          </div>

          <form onSubmit={handleScanWorkerQR} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Enter / Scan Worker Name or Code</label>
              <input
                type="text"
                required
                placeholder="e.g. Suresh Carpenter"
                value={qrScanInput}
                onChange={(e) => setQrScanInput(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#083B56] hover:bg-[#176B91] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <ShieldCheck size={16} /> Verify & Record Gate Entry
            </button>
          </form>
        </div>
      )}

      {/* Create Move Modal */}
      <Modal
        isOpen={modalMode === 'CREATE_MOVE'}
        onClose={() => setModalMode(null)}
        title="Schedule Move-In / Move-Out"
        subtitle="Register move details, vehicle NOC and freight elevator time slot"
        icon={<Truck size={20} />}
        maxWidth="520px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('create-move-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2.5 text-white text-xs font-extrabold rounded-xl shadow-md bg-[#F06543]"
            >
              Submit Move Request
            </button>
          </div>
        }
      >
        <form id="create-move-form" onSubmit={handleCreateMove} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Move Type</label>
              <select
                value={moveForm.moveType}
                onChange={(e) => setMoveForm({ ...moveForm, moveType: e.target.value as any })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs bg-white font-bold text-slate-800"
              >
                <option value="MOVE_IN">MOVE-IN</option>
                <option value="MOVE_OUT">MOVE-OUT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Flat Number</label>
              <input
                type="text"
                required
                value={moveForm.flatNumber}
                onChange={(e) => setMoveForm({ ...moveForm, flatNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                required
                value={moveForm.scheduledDate}
                onChange={(e) => setMoveForm({ ...moveForm, scheduledDate: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Freight Lift Time Slot</label>
              <select
                value={moveForm.timeSlot}
                onChange={(e) => setMoveForm({ ...moveForm, timeSlot: e.target.value as any })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs bg-white font-bold text-slate-800"
              >
                <option value="09:00 - 12:00">09:00 AM - 12:00 PM</option>
                <option value="12:00 - 15:00">12:00 PM - 03:00 PM</option>
                <option value="15:00 - 18:00">03:00 PM - 06:00 PM</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Vehicle Number</label>
              <input
                type="text"
                required
                value={moveForm.vehicleNumber}
                onChange={(e) => setMoveForm({ ...moveForm, vehicleNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Packers & Movers Company</label>
              <input
                type="text"
                required
                value={moveForm.vendorCompany}
                onChange={(e) => setMoveForm({ ...moveForm, vendorCompany: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <FileUpload
              category="general"
              label="Movers Agreement / Gatepass NOC (Optional)"
              onUploadSuccess={(url) => setContractorDocUrl(url)}
            />
          </div>
        </form>
      </Modal>

      {/* Create Renovation Modal */}
      <Modal
        isOpen={modalMode === 'CREATE_RENOVATION'}
        onClose={() => setModalMode(null)}
        title="Request Renovation Permit"
        subtitle="Submit interior work approval & contractor details for committee clearance"
        icon={<Wrench size={20} />}
        maxWidth="520px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setDepositAmount(15000);
                setDepositPurpose(`Renovation Security Deposit: Flat ${renovationForm.flatNumber}`);
                setIsRazorpayOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-emerald-500"
            >
              Pay ₹15k Deposit
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('create-renovation-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2.5 text-white text-xs font-extrabold rounded-xl shadow-md bg-[#F06543]"
            >
              Submit Permit Request
            </button>
          </div>
        }
      >
        <form id="create-renovation-form" onSubmit={handleCreateRenovation} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Project Title</label>
            <input
              type="text"
              required
              value={renovationForm.projectTitle}
              onChange={(e) => setRenovationForm({ ...renovationForm, projectTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Flat Number</label>
              <input
                type="text"
                required
                value={renovationForm.flatNumber}
                onChange={(e) => setRenovationForm({ ...renovationForm, flatNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Contractor Company</label>
              <input
                type="text"
                required
                value={renovationForm.contractorCompany}
                onChange={(e) => setRenovationForm({ ...renovationForm, contractorCompany: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={renovationForm.startDate}
                onChange={(e) => setRenovationForm({ ...renovationForm, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={renovationForm.endDate}
                onChange={(e) => setRenovationForm({ ...renovationForm, endDate: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Worker Names (Comma separated)</label>
            <textarea
              required
              rows={2}
              value={renovationForm.workersText}
              onChange={(e) => setRenovationForm({ ...renovationForm, workersText: e.target.value })}
              className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium text-slate-900"
            />
          </div>

          <div>
            <FileUpload
              category="kyc"
              label="Architectural Layout / Contractor License PDF (Optional)"
              onUploadSuccess={(url) => setContractorDocUrl(url)}
            />
          </div>
        </form>
      </Modal>

      {/* Razorpay Refundable Deposit Modal */}
      <RazorpayCheckoutModal
        isOpen={isRazorpayOpen}
        onClose={() => setIsRazorpayOpen(false)}
        amount={depositAmount}
        purpose={depositPurpose}
        societyName="Green Valley Society"
        invoiceNumber={`DEP-${Date.now().toString().slice(-6)}`}
        userName={currentUser?.name || 'Resident'}
        userPhone={currentUser?.phone || '9876543210'}
        onSuccess={() => {
          setIsRazorpayOpen(false);
          alert('Security deposit of ₹' + depositAmount.toLocaleString() + ' paid! Society receipt generated.');
        }}
      />

      {/* Society Partner Discounts Launcher & Modal */}
      <OffersLauncherPill onClick={() => setIsAdOpen(true)} label="Movers &amp; Interior Deals" />
      <AdvertisementPopup isOpen={isAdOpen} onClose={() => setIsAdOpen(false)} />
    </div>
  );
};

