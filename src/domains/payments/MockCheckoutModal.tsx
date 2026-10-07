import React, { useState } from 'react';
import { ShieldCheck, CreditCard, Smartphone, Building, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from './states';
import { Modal } from '../../components/ui/Modal';

export interface MockCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentDetails: {
    transactionId: string;
    method: 'upi' | 'card' | 'net_banking';
    amount: number;
  }) => void;
  amount: number;
  purpose: string;
  societyName?: string;
  invoiceNumber?: string;
}

export const MockCheckoutModal: React.FC<MockCheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  purpose,
  societyName = 'Green Valley Society',
  invoiceNumber = 'INV-2026-09',
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'net_banking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [simulationOutcome, setSimulationOutcome] = useState<'SUCCESS' | 'FAILED'>('SUCCESS');

  if (!isOpen) return null;

  const handlePay = async () => {
    setIsProcessing(true);
    await new Promise((res) => setTimeout(res, 1200));

    if (simulationOutcome === 'SUCCESS') {
      const transactionId = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
      onSuccess({
        transactionId,
        method: selectedMethod,
        amount,
      });
      setIsProcessing(false);
      onClose();
    } else {
      setIsProcessing(false);
      alert('Mock Payment Simulation: Transaction was declined by bank test simulator.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={societyName}
      subtitle={`Order #${invoiceNumber} • ${purpose}`}
      icon={<ShieldCheck className="w-5 h-5 text-[#F06543]" />}
      maxWidth="480px"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#F06543] hover:bg-[#d85434] text-white shadow-md transition flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : (
              `Pay ${formatCurrency(amount)}`
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Payment Summary */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Order: {invoiceNumber}</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">{purpose}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-500 font-medium">Amount Due</div>
            <div className="text-xl font-black text-[#083B56]">
              {formatCurrency(amount)}
            </div>
          </div>
        </div>

        {/* Method Selectors */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Payment Method</div>

          {/* UPI */}
          <button
            type="button"
            onClick={() => setSelectedMethod('upi')}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
              selectedMethod === 'upi'
                ? 'border-[#F06543] bg-[#FFF0EC] text-[#F06543]'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#F06543]" />
              <div className="text-left">
                <div className="font-bold text-xs">UPI (GPay, PhonePe, Paytm)</div>
                <div className="text-[11px] text-slate-500">Fast & Zero Gateway Surcharge</div>
              </div>
            </div>
            {selectedMethod === 'upi' && <CheckCircle2 className="w-5 h-5 text-[#F06543]" />}
          </button>

          {/* Cards */}
          <button
            type="button"
            onClick={() => setSelectedMethod('card')}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
              selectedMethod === 'card'
                ? 'border-[#F06543] bg-[#FFF0EC] text-[#F06543]'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-[#083B56]" />
              <div className="text-left">
                <div className="font-bold text-xs">Credit / Debit Cards</div>
                <div className="text-[11px] text-slate-500">Visa, Mastercard, RuPay</div>
              </div>
            </div>
            {selectedMethod === 'card' && <CheckCircle2 className="w-5 h-5 text-[#F06543]" />}
          </button>

          {/* Net Banking */}
          <button
            type="button"
            onClick={() => setSelectedMethod('net_banking')}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
              selectedMethod === 'net_banking'
                ? 'border-[#F06543] bg-[#FFF0EC] text-[#F06543]'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-slate-600" />
              <div className="text-left">
                <div className="font-bold text-xs">Net Banking</div>
                <div className="text-[11px] text-slate-500">All major Indian banks</div>
              </div>
            </div>
            {selectedMethod === 'net_banking' && <CheckCircle2 className="w-5 h-5 text-[#F06543]" />}
          </button>
        </div>

        {/* Demo Test Switcher */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-600" /> Test Simulator:
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSimulationOutcome('SUCCESS')}
              className={`px-2 py-1 rounded-md font-bold text-xs transition ${
                simulationOutcome === 'SUCCESS' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              Success
            </button>
            <button
              type="button"
              onClick={() => setSimulationOutcome('FAILED')}
              className={`px-2 py-1 rounded-md font-bold text-xs transition ${
                simulationOutcome === 'FAILED' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              Fail
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

