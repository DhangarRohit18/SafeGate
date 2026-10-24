import React from 'react';
import type { PaymentRecord, PaymentMethod } from '../../../domains/payments';
import { RazorpayCheckoutModal } from '../../../domains/payments/RazorpayCheckoutModal';

export interface PaymentCheckoutProps {
  isOpen: boolean;
  payment: PaymentRecord | null;
  onClose: () => void;
  onPaymentSuccess: (
    paymentId: string,
    method: PaymentMethod,
    transactionId: string
  ) => void;
}

/**
 * PaymentCheckout
 * High-performance, multi-channel payment checkout adapter bridging
 * resident billing records to the comprehensive Dwellora Razorpay Payment Hub.
 */
export const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  isOpen,
  payment,
  onClose,
  onPaymentSuccess,
}) => {
  if (!isOpen || !payment) return null;

  const totalAmount = payment.amount + (payment.penaltyAmount || 0);
  const flatCodeMatch = payment.description?.match(/(?:Flat|Unit)\s+([A-Za-z0-9-]+)/i);
  const flatCode = flatCodeMatch ? flatCodeMatch[1] : 'B-1204';

  return (
    <RazorpayCheckoutModal
      isOpen={isOpen}
      onClose={onClose}
      amount={totalAmount}
      purpose={payment.title || 'Society Maintenance & Utilities'}
      societyName="Green Valley Society"
      invoiceNumber={payment.accountReference || payment.id}
      invoiceId={payment.id}
      userName="Sarvesh Kulkarni"
      userPhone="9822399887"
      userEmail="resident@dwellora.com"
      flatCode={flatCode}
      onSuccess={(details) => {
        onPaymentSuccess(payment.id, details.method as PaymentMethod, details.transactionId);
      }}
    />
  );
};
