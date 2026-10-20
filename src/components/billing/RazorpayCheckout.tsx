import React, { useState } from 'react';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Lock,
  ArrowRight,
  RefreshCw,
  Printer,
  XCircle,
  Building2,
  User,
  Smartphone,
  Building,
  Sparkles,
  FileText,
  X,
} from 'lucide-react';
import { RazorpayService, type CheckoutResult } from '../../services/payment/RazorpayService';
import { ReceiptModal } from './ReceiptModal';
import type { SocietyInvoice, PaymentTransaction } from '../../types/billing';

export type PaymentUIState = 'READY' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING';

export interface RazorpayCheckoutProps {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  societyName?: string;
  purpose?: string;
  residentName?: string;
  residentEmail?: string;
  residentPhone?: string;
  flatCode?: string;
  onSuccess?: (result: CheckoutResult) => void;
  onFailure?: (error: string) => void;
  onClose?: () => void;
  asModal?: boolean;
}

export const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  invoiceId,
  invoiceNumber,
  amount,
  societyName = 'Green Valley Society',
  purpose = 'Society Maintenance & Utility Bill',
  residentName = 'Sarvesh Kulkarni',
  residentEmail = 'resident@dwellora.com',
  residentPhone = '9822399887',
  flatCode = 'B-1204',
  onSuccess,
  onFailure,
  onClose,
  asModal = false,
}) => {
  const [uiState, setUiState] = useState<PaymentUIState>('READY');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [completedPayment, setCompletedPayment] = useState<CheckoutResult | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  const handleStartPayment = async () => {
    if (uiState === 'PROCESSING') return;

    setUiState('PROCESSING');
    setStatusMessage('Initiating secure handshake with Razorpay...');
    setErrorMessage('');

    try {
      const result = await RazorpayService.executeCheckout({
        invoiceId,
        invoiceNumber,
        societyName,
        purpose,
        userName: residentName,
        userEmail: residentEmail,
        userPhone: residentPhone,
        onProcessing: (msg) => {
          setStatusMessage(msg);
        },
      });

      if (result.success) {
        setUiState('SUCCESS');
        setCompletedPayment(result);
        onSuccess?.(result);
      } else if (result.cancelled) {
        setUiState('CANCELLED');
        setStatusMessage('Payment cancelled by user.');
      } else {
        setUiState('FAILED');
        setErrorMessage(result.message || 'Payment failed or was declined by bank.');
        onFailure?.(result.message || 'Payment failed.');
      }
    } catch (err: any) {
      console.error('[RazorpayCheckout] Payment error:', err);
      setUiState('FAILED');
      const errText =
        err?.message ||
        'Payment verification encountered a network error. If amount was deducted, it will auto-reconcile within 10 minutes.';
      setErrorMessage(errText);
      onFailure?.(errText);
    }
  };

  const receiptInvoice: SocietyInvoice = {
    id: invoiceId,
    invoiceNumber,
    societyId: 'soc-gvs',
    flatId: 'flat-current',
    flatCode,
    residentId: 'res-current',
    residentName,
    billingCycleId: 'cycle-current',
    cycleName: purpose,
    lineItems: [
      { id: 'li-1', component: 'MAINTENANCE', description: purpose, amount },
    ],
    totalAmount: amount,
    paidAmount: amount,
    outstandingBalance: 0,
    status: 'PAID',
    dueDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const receiptTxn: PaymentTransaction | undefined = completedPayment?.paymentId
    ? {
        id: completedPayment.paymentId,
        invoiceId,
        invoiceNumber,
        societyId: 'soc-gvs',
        flatCode,
        residentName,
        transactionId: completedPayment.paymentId,
        amount,
        paymentMethod: 'ONLINE_GATEWAY',
        status: 'SUCCESS',
        gatewayReference: completedPayment.paymentId,
        gatewayResponseNotes: completedPayment.message || 'Cryptographically verified with Razorpay',
        paymentDate: new Date().toLocaleString(),
      }
    : undefined;

  const content = (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #DCE8EF',
        boxShadow: '0 25px 65px -12px rgba(8, 59, 86, 0.35)',
        maxWidth: '480px',
        width: '100%',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. Header (Uniform Dwellora Modal Header) */}
      <div
        style={{
          padding: '1.125rem 1.25rem',
          borderBottom: '1px solid #E8F1F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          background: '#ffffff',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '14px',
              backgroundColor: '#FFF0EC',
              color: '#F06543',
              border: '1px solid #FDF0ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CreditCard size={20} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 900,
                  color: '#083B56',
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                }}
              >
                Dwellora Pay
              </h3>
              <span
                style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  background: '#ECFDF5',
                  color: '#059669',
                  border: '1px solid #A7F3D0',
                  fontSize: '0.625rem',
                  fontWeight: 900,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                <ShieldCheck size={11} /> Razorpay Verified
              </span>
            </div>
            <p
              style={{
                margin: '0.2rem 0 0 0',
                fontSize: '0.75rem',
                color: '#657785',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {societyName} · Secure Payment Gateway
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={uiState === 'PROCESSING'}
            aria-label="Close checkout"
            style={{
              background: '#F8FAFC',
              border: '1px solid #DCE8EF',
              color: '#657785',
              cursor: uiState === 'PROCESSING' ? 'not-allowed' : 'pointer',
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              opacity: uiState === 'PROCESSING' ? 0.4 : 1,
            }}
          >
            <X size={18} strokeWidth={2.25} />
          </button>
        )}
      </div>

      {/* 2. Bill Highlight Strip */}
      <div
        style={{
          background: '#F8FAFC',
          borderBottom: '1px solid #E8F1F5',
          padding: '1rem 1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#083B56',
              background: '#ffffff',
              border: '1px solid #DCE8EF',
              padding: '0.2rem 0.55rem',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <FileText size={12} style={{ color: '#0284C7' }} />
            <span>{invoiceNumber}</span>
          </span>

          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 900,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FDE68A',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            PAYABLE DUES
          </span>
        </div>

        <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <h4
              style={{
                fontSize: '0.875rem',
                fontWeight: 900,
                color: '#083B56',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {purpose}
            </h4>
            <div
              style={{
                fontSize: '0.725rem',
                color: '#657785',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '0.25rem',
                fontWeight: 600,
              }}
            >
              <Building2 size={12} style={{ color: '#0284C7' }} />
              <span>{residentName} · {flatCode}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Total Payable
            </span>
            <span
              style={{
                fontSize: '1.75rem',
                fontWeight: 900,
                color: '#083B56',
                lineHeight: 1,
                display: 'block',
                marginTop: '0.15rem',
                letterSpacing: '-0.02em',
              }}
            >
              ₹{Number(amount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Body States */}
      <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
        {/* STATE: PROCESSING */}
        {uiState === 'PROCESSING' && (
          <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  border: '4px solid #F1F5F9',
                  borderTopColor: 'var(--aarizo-coral, #F06543)',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <CreditCard size={24} style={{ color: '#083B56', position: 'absolute', inset: 0, margin: 'auto' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#083B56', margin: 0 }}>
                Payment Processing
              </h3>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#D97706', margin: '0.25rem 0 0 0' }}>
                Please do not close or refresh this window.
              </p>
              <p style={{ fontSize: '0.75rem', color: '#657785', margin: '0.5rem auto 0 auto', maxWidth: 280 }}>
                {statusMessage || 'Verifying transaction status with Razorpay servers...'}
              </p>
            </div>
          </div>
        )}

        {/* STATE: SUCCESS */}
        {uiState === 'SUCCESS' && completedPayment && (
          <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#ECFDF5',
                border: '2px solid #A7F3D0',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle size={36} />
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 900, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Verified Cryptographically by Server
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#083B56', margin: '0.25rem 0' }}>
                ₹{Number(completedPayment.amount || amount).toLocaleString('en-IN')}
              </h3>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#16A34A', margin: 0 }}>
                Payment Received &amp; Ledger Updated!
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div
              style={{
                width: '100%',
                background: '#F8FAFC',
                borderRadius: '16px',
                padding: '1rem',
                border: '1px solid #DCE8EF',
                textAlign: 'left',
                fontSize: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Transaction ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#083B56' }}>
                  {completedPayment.paymentId}
                </span>
              </div>
              {completedPayment.orderId && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Razorpay Order:</span>
                  <span style={{ fontFamily: 'monospace', color: '#64748B' }}>
                    {completedPayment.orderId}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Payment Date:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {new Date().toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '0.4rem' }}>
                <span style={{ color: '#64748B' }}>Status:</span>
                <span style={{ fontWeight: 900, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle size={14} /> PAID
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowReceipt(true)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  border: '1px solid #DCE8EF',
                  color: '#083B56',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  minHeight: '44px',
                }}
              >
                <Printer size={15} style={{ color: '#0284C7' }} />
                <span>View Receipt</span>
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: 'var(--aarizo-coral, #F06543)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.8125rem',
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: '44px',
                    boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                  }}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}

        {/* STATE: FAILED */}
        {uiState === 'FAILED' && (
          <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#FEF2F2',
                border: '2px solid #FECACA',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <XCircle size={32} />
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#991B1B', margin: 0 }}>
                Payment Declined or Interrupted
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', maxWidth: 320, margin: '0.35rem auto 0 auto' }}>
                {errorMessage || 'The bank or gateway declined the transaction. No funds were debited.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartPayment}
              style={{
                width: '100%',
                padding: '0.875rem 1.25rem',
                borderRadius: '12px',
                background: 'var(--aarizo-coral, #F06543)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '0.8125rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                minHeight: '44px',
              }}
            >
              <RefreshCw size={15} />
              <span>Retry Payment via Razorpay</span>
            </button>
          </div>
        )}

        {/* STATE: CANCELLED */}
        {uiState === 'CANCELLED' && (
          <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={28} />
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#083B56', margin: 0 }}>
                Payment Session Cancelled
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#657785', margin: '0.25rem 0 0 0' }}>
                You closed the checkout session. No funds were debited from your account.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartPayment}
              style={{
                width: '100%',
                padding: '0.875rem 1.25rem',
                borderRadius: '12px',
                background: '#083B56',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.8125rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                minHeight: '44px',
              }}
            >
              <RefreshCw size={15} />
              <span>Start Over</span>
            </button>
          </div>
        )}

        {/* STATE: READY */}
        {uiState === 'READY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Accepted Methods Card */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #DCE8EF',
                borderRadius: '16px',
                padding: '0.875rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#083B56',
                  marginBottom: '0.6rem',
                }}
              >
                <span>Available Payment Modes</span>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 900,
                    color: '#059669',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    textTransform: 'uppercase',
                  }}
                >
                  <Sparkles size={10} /> Instant Verification
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem' }}>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #DCE8EF',
                    borderRadius: '10px',
                    padding: '0.5rem 0.25rem',
                    textAlign: 'center',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    color: '#083B56',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 1px 2px rgba(8, 59, 86, 0.02)',
                  }}
                >
                  <Smartphone size={14} style={{ color: '#0284C7' }} />
                  <span style={{ fontSize: '0.625rem', whiteSpace: 'nowrap' }}>UPI / QR</span>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #DCE8EF',
                    borderRadius: '10px',
                    padding: '0.5rem 0.25rem',
                    textAlign: 'center',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    color: '#083B56',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 1px 2px rgba(8, 59, 86, 0.02)',
                  }}
                >
                  <CreditCard size={14} style={{ color: '#059669' }} />
                  <span style={{ fontSize: '0.625rem', whiteSpace: 'nowrap' }}>Debit Cards</span>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #DCE8EF',
                    borderRadius: '10px',
                    padding: '0.5rem 0.25rem',
                    textAlign: 'center',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    color: '#083B56',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 1px 2px rgba(8, 59, 86, 0.02)',
                  }}
                >
                  <CreditCard size={14} style={{ color: '#F06543' }} />
                  <span style={{ fontSize: '0.625rem', whiteSpace: 'nowrap' }}>Credit Cards</span>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #DCE8EF',
                    borderRadius: '10px',
                    padding: '0.5rem 0.25rem',
                    textAlign: 'center',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    color: '#083B56',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 1px 2px rgba(8, 59, 86, 0.02)',
                  }}
                >
                  <Building size={14} style={{ color: '#9333EA' }} />
                  <span style={{ fontSize: '0.625rem', whiteSpace: 'nowrap' }}>Net Banking</span>
                </div>
              </div>
            </div>

            {/* Resident Breakdown Details */}
            <div
              style={{
                fontSize: '0.75rem',
                color: '#657785',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                borderTop: '1px solid #E8F1F5',
                paddingTop: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={13} style={{ color: '#0284C7' }} />
                  <span>Paying For:</span>
                </span>
                <strong style={{ color: '#083B56', fontWeight: 800 }}>
                  {residentName} ({flatCode})
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Building2 size={13} style={{ color: '#0284C7' }} />
                  <span>Society Ledger:</span>
                </span>
                <span style={{ color: '#083B56', fontWeight: 700 }}>
                  {societyName}
                </span>
              </div>
            </div>

            {/* Pay Button (Primary Dwellora Coral CTA) */}
            <button
              type="button"
              onClick={handleStartPayment}
              style={{
                width: '100%',
                padding: '0.95rem 1.25rem',
                borderRadius: '14px',
                background: 'var(--aarizo-coral, #F06543)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '0.9375rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 16px rgba(240, 101, 67, 0.35)',
                minHeight: '48px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Pay ₹{Number(amount).toLocaleString('en-IN')} via Razorpay</span>
              <ArrowRight size={18} />
            </button>

            {/* Security Assurance Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                fontSize: '0.6875rem',
                color: '#657785',
                fontWeight: 600,
              }}
            >
              <Lock size={13} style={{ color: '#059669' }} />
              <span>256-Bit SSL Encrypted &amp; PCI-DSS Level 1 Verified</span>
            </div>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      {showReceipt && (
        <ReceiptModal
          invoice={receiptInvoice}
          transaction={receiptTxn}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );

  if (asModal) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(8, 20, 32, 0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
        onClick={onClose}
      >
        <div onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return content;
};
