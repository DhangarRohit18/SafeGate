import React from 'react';
import { RazorpayCheckout } from '../../components/billing/RazorpayCheckout';
import type { CheckoutResult } from '../../services/payment/RazorpayService';

export interface RazorpayCheckoutModalProps {
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
  invoiceId?: string;
  userPhone?: string;
  userEmail?: string;
  userName?: string;
  flatCode?: string;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  purpose,
  societyName = 'Green Valley Society',
  invoiceNumber = 'INV-2026-001',
  invoiceId = 'inv-101',
  userPhone = '9876543210',
  userEmail = 'resident@dwellora.com',
  userName = 'Resident',
  flatCode = 'Flat Unit',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4"
      style={{ zIndex: 99999 }}
    >
      <RazorpayCheckout
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        amount={amount}
        societyName={societyName}
        purpose={purpose}
        residentName={userName}
        residentEmail={userEmail}
        residentPhone={userPhone}
        flatCode={flatCode}
        onClose={onClose}
        onSuccess={(res: CheckoutResult) => {
          onSuccess({
            transactionId: res.paymentId || `pay_${Date.now()}`,
            method: 'upi',
            amount: res.amount || amount,
          });
        }}
      />
    </div>
  );
};
