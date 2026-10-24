import React, { useState } from 'react';
import type { ParkingSlot } from '../../types/parking';
import { QrCode } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { Modal } from '../ui/Modal';
import { QRGenerator } from '../ui/QRGenerator';

interface VisualParkingMapProps {
  slots: ParkingSlot[];
  onSlotClick?: (slot: ParkingSlot) => void;
  onEntryScan?: (slot: ParkingSlot) => void;
  onExitScan?: (slot: ParkingSlot) => void;
}

export const VisualParkingMap: React.FC<VisualParkingMapProps> = ({
  slots,
  onEntryScan,
  onExitScan,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const getSlotColor = (state: ParkingSlot['occupancyState']) => {
    switch (state) {
      case 'AVAILABLE':
        return { bg: '#ecfdf5', border: '#10b981', color: '#047857' };
      case 'OCCUPIED':
        return { bg: '#fef2f2', border: '#ef4444', color: '#b91c1c' };
      case 'RESERVED':
        return { bg: '#EAF6FC', border: '#176B91', color: '#083B56' };
      case 'VISITOR':
        return { bg: '#fffbeb', border: '#f59e0b', color: '#b45309' };
      case 'BLOCKED':
        return { bg: '#f1f5f9', border: '#64748b', color: '#475569' };
      default:
        return { bg: '#f8fafc', border: '#cbd5e1', color: '#334155' };
    }
  };

  const levels = Array.from(new Set(slots.map((s) => s.level)));

  return (
    <div>
      {/* Legend Bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
          padding: '0.75rem 1rem',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} />
          <span>Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }} />
          <span>Occupied</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#176B91' }} />
          <span>Reserved</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f59e0b' }} />
          <span>Visitor</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#64748b' }} />
          <span>Blocked</span>
        </div>
      </div>

      {/* Levels & Grid Map */}
      {levels.map((level) => {
        const levelSlots = slots.filter((s) => s.level === level);
        return (
          <div key={level} style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>
              {level} Parking Grid
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {levelSlots.map((slot) => {
                const style = getSlotColor(slot.occupancyState);
                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: '0.85rem 0.65rem',
                      borderRadius: '10px',
                      background: style.bg,
                      border: `2px solid ${style.border}`,
                      color: style.color,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      userSelect: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{slot.slotNumber}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, marginTop: '0.2rem', textTransform: 'uppercase' }}>
                      {slot.occupancyState}
                    </div>
                    {slot.assignedVehicleNumber && (
                      <div style={{ fontSize: '0.65rem', marginTop: '0.35rem', fontWeight: 600, opacity: 0.85 }}>
                        {slot.assignedVehicleNumber}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Interactive Slot Detail Modal */}
      {selectedSlot && (
        <Modal isOpen={!!selectedSlot} onClose={() => setSelectedSlot(null)} title={`Parking Bay ${selectedSlot.slotNumber}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Location: <strong className="text-[#083B56]">{selectedSlot.level}</strong></span>
              <StatusBadge label={selectedSlot.occupancyState} variant={selectedSlot.occupancyState === 'OCCUPIED' ? 'danger' : selectedSlot.occupancyState === 'AVAILABLE' ? 'success' : 'info'} />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-[#083B56] space-y-1.5">
              <div><span className="text-slate-500">Assigned Flat: </span><strong>{selectedSlot.assignedFlatCode || 'Unassigned'}</strong></div>
              <div><span className="text-slate-500">Primary Resident: </span><strong>{selectedSlot.assignedResidentName || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Registered Vehicle: </span><strong className="font-mono">{selectedSlot.assignedVehicleNumber || 'N/A'}</strong></div>
              <div><span className="text-slate-500">Slot Category: </span><strong>{selectedSlot.slotType}</strong></div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowQRModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-[#083B56] hover:bg-slate-50 transition-colors"
              >
                <QrCode size={15} /> View Parking QR
              </button>

              {selectedSlot.occupancyState !== 'OCCUPIED' && onEntryScan && (
                <button
                  type="button"
                  onClick={() => { onEntryScan(selectedSlot); setSelectedSlot(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
                >
                  Scan Vehicle Entry
                </button>
              )}

              {selectedSlot.occupancyState === 'OCCUPIED' && onExitScan && (
                <button
                  type="button"
                  onClick={() => { onExitScan(selectedSlot); setSelectedSlot(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-600 hover:bg-slate-700 text-white text-sm font-bold transition-colors"
                >
                  Scan Vehicle Exit
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Parking QR Modal */}
      {selectedSlot && showQRModal && (
        <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title={`Parking Permit QR — ${selectedSlot.slotNumber}`}>
          <div className="flex flex-col items-center gap-4 py-1">
            <p className="text-sm text-slate-500 text-center">
              Present this permit QR to the security scanner for instant gate parking clearance.
            </p>
            <QRGenerator value={selectedSlot.qrDataString} label={`${selectedSlot.slotNumber} · ${selectedSlot.assignedVehicleNumber || 'PERMIT'}`} size={180} />
          </div>
        </Modal>
      )}
    </div>
  );
};
