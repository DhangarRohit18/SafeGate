import React, { useState } from 'react';
import type { CanonicalBillingRecord, PaymentCategory } from '../../../domains/secretary/types';
import { CreditCard, Send } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import '../secretary.css';

interface IssueBillModalProps {
  onClose: () => void;
  onIssueBill: (bill: Omit<CanonicalBillingRecord, 'id' | 'billNumber' | 'accountReference' | 'amountPaid' | 'outstandingAmount' | 'status'>) => void;
}

export const IssueBillModal: React.FC<IssueBillModalProps> = ({ onClose, onIssueBill }) => {
  const [title, setTitle] = useState<string>('October 2026 Maintenance Dues');
  const [billingCycle, setBillingCycle] = useState<string>('Oct 2026');
  const [category, setCategory] = useState<PaymentCategory>('maintenance');
  const [targetFlat, setTargetFlat] = useState<string>('ALL');
  const [baseFee, setBaseFee] = useState<number>(4250);
  const [dueDate, setDueDate] = useState<string>('2026-10-15');
  const [description, setDescription] = useState<string>(
    'Monthly society maintenance fee covering 24/7 security, housekeeping, lift maintenance, and water pumping.'
  );

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onIssueBill({
      billingCycle,
      category,
      title: title.trim(),
      residentName: targetFlat === 'ALL' ? 'All Society Residents' : 'Sarvesh Kulkarni',
      flatNumber: targetFlat === 'ALL' ? 'ALL' : '1204',
      blockWing: targetFlat === 'ALL' ? 'All Blocks' : 'Block B',
      canonicalDisplay: targetFlat === 'ALL' ? 'Entire Society (128 Units)' : 'Tower B · Flat 1204',
      totalAmount: Number(baseFee) || 4250,
      dueDate,
      description: description.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Issue Maintenance Bill"
      subtitle="Generate and dispatch invoices to residents"
      icon={<CreditCard size={18} className="text-[#F06543]" />}
      maxWidth="520px"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Send size={15} />
            <span>Generate & Dispatch</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-[#083B56] mb-1">Bill Item Title</label>
          <input
            type="text"
            required
            className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F06543]"
            placeholder="e.g. October 2026 Maintenance Dues"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#083B56] mb-1">Billing Cycle</label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F06543]"
              placeholder="Oct 2026"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#083B56] mb-1">Bill Category</label>
            <select
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F06543]"
              value={category}
              onChange={(e) => setCategory(e.target.value as PaymentCategory)}
            >
              <option value="maintenance">Maintenance</option>
              <option value="parking">Parking & EV</option>
              <option value="amenity">Amenity Fee</option>
              <option value="electricity">Electricity Sub-meter</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#083B56] mb-1">Total Amount (₹)</label>
            <input
              type="number"
              required
              min={1}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F06543]"
              placeholder="4250"
              value={baseFee}
              onChange={(e) => setBaseFee(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#083B56] mb-1">Due Date</label>
            <input
              type="date"
              required
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F06543]"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#083B56] mb-1">Target Units</label>
          <select
            className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F06543]"
            value={targetFlat}
            onChange={(e) => setTargetFlat(e.target.value)}
          >
            <option value="ALL">Entire Society (All 128 Units)</option>
            <option value="1204">Tower B · Flat 1204 (Sarvesh Kulkarni)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#083B56] mb-1">Description & Breakdown</label>
          <textarea
            rows={3}
            className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F06543]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};

