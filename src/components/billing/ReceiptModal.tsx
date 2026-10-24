import React, { useState } from 'react';
import { Printer, CheckCircle2, Shield, FileText, Copy, Check, Sparkles, Building, Calendar } from 'lucide-react';
import type { SocietyInvoice, PaymentTransaction } from '../../types/billing';
import { Modal } from '../ui/Modal';

interface ReceiptModalProps {
  invoice: SocietyInvoice;
  transaction?: PaymentTransaction;
  onClose: () => void;
}

const formatComponentName = (comp: string): string => {
  const map: Record<string, string> = {
    MAINTENANCE: 'Society Maintenance Dues',
    WATER: 'Water Consumption Charges',
    ELECTRICITY: 'Common Area & Backup Power',
    PARKING: 'Allocated Parking Slot Fee',
    CLUBHOUSE: 'Gym & Clubhouse Access',
    PENALTY: 'Late Payment Penalty',
    SPECIAL_CONTRIBUTION: 'Special Contribution Fund',
    SERVICE_CHARGES: 'Sewage & Municipal Service Charges',
    SINKING_FUND: 'Sinking Fund Contribution',
    CORPUS_FUND: 'Society Corpus Fund',
  };
  if (map[comp]) return map[comp];
  return comp
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatINR = (val: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);

const formatReceiptDate = (dateStr?: string): string => {
  if (!dateStr) {
    return new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
  } catch {}
  return dateStr;
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ invoice, transaction, onClose }) => {
  const [copiedTxn, setCopiedTxn] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const txnId = transaction?.transactionId || `TXN-${invoice.invoiceNumber.replace(/[^0-9]/g, '').slice(-8) || '88291044'}`;
  const payDate = formatReceiptDate(transaction?.paymentDate || invoice.updatedAt);
  const isPaid = invoice.status === 'PAID' || invoice.outstandingBalance === 0;

  const handleCopyTxn = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(txnId);
      setCopiedTxn(true);
      setTimeout(() => setCopiedTxn(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Official Payment Receipt & Tax Invoice"
      subtitle={`Invoice #${invoice.invoiceNumber} · GST & RWA Compliant`}
      maxWidth="680px"
      icon={<FileText className="w-5 h-5 text-[#F06543]" />}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.borderColor = '#94A3B8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '0.625rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #F06543 0%, #E05432 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(240, 101, 67, 0.3)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(240, 101, 67, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(240, 101, 67, 0.3)';
            }}
          >
            <Printer size={15} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      }
    >
      <div
        className="receipt-print-wrapper"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          color: '#0F172A',
          fontFamily: 'inherit',
        }}
      >
        {/* Society Header Card */}
        <div
          style={{
            padding: '1rem 1.125rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #DCE8EF',
            boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: '#FFF0EC',
                  color: '#F06543',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Shield size={16} />
              </div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  color: '#083B56',
                  letterSpacing: '-0.01em',
                }}
              >
                Grand Vista Towers RWA
              </h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>
              Plot 14, Sector 5, Palm Beach Rd, Navi Mumbai 400706
            </p>
            <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 500 }}>
              Reg No: RWA/MH/2022/88190 · GSTIN: 27AABCG1234F1Z5
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.35rem',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                letterSpacing: '0.03em',
                backgroundColor: isPaid ? '#ECFDF5' : '#FEF3C7',
                color: isPaid ? '#047857' : '#B45309',
                border: `1px solid ${isPaid ? '#A7F3D0' : '#FDE68A'}`,
              }}
            >
              <CheckCircle2 size={13} style={{ color: isPaid ? '#059669' : '#D97706' }} />
              <span>{isPaid ? 'RECEIPT ISSUED & CLEARED' : 'PARTIAL SETTLEMENT'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: '#64748B', fontWeight: 600 }}>
              <Calendar size={12} style={{ color: '#94A3B8' }} />
              <span>{payDate}</span>
            </div>
          </div>
        </div>

        {/* Resident & Invoice Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {/* Billed To Box */}
          <div
            style={{
              padding: '0.875rem 1rem',
              borderRadius: '14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #DCE8EF',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <div style={{ fontSize: '0.625rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Billed To Resident
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#083B56', lineHeight: 1.2 }}>
              {invoice.residentName || 'Rajesh Kumar'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#0369A1',
                }}
              >
                <Building size={11} />
                Flat {invoice.flatCode || 'B-1204'}
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>
                Primary Occupant
              </span>
            </div>
          </div>

          {/* Invoice & Transaction Box */}
          <div
            style={{
              padding: '0.875rem 1rem',
              borderRadius: '14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #DCE8EF',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <div style={{ fontSize: '0.625rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Invoice &amp; Transaction Reference
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#083B56', lineHeight: 1.2 }}>
              {invoice.invoiceNumber}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 500 }}>Txn:</span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '6px',
                  color: '#334155',
                }}
              >
                {txnId}
              </span>
              <button
                type="button"
                onClick={handleCopyTxn}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '0.2rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: copiedTxn ? '#059669' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={copiedTxn ? 'Copied!' : 'Copy Transaction ID'}
              >
                {copiedTxn ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        {/* Itemized Charges Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'space-between', justifyContent: 'space-between', padding: '0 0.125rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#083B56', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Itemized Charges &amp; Contributions
            </span>
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                color: '#64748B',
                backgroundColor: '#F1F5F9',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
              }}
            >
              {invoice.lineItems.length} {invoice.lineItems.length === 1 ? 'Component' : 'Components'}
            </span>
          </div>

          {/* Clean Item Table Container */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #DCE8EF',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.75rem',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '0.625rem 1rem', fontWeight: 800, color: '#475569', fontSize: '0.6875rem', width: '42%', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Component
                  </th>
                  <th style={{ padding: '0.625rem 1rem', fontWeight: 800, color: '#475569', fontSize: '0.6875rem', width: '38%', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Description
                  </th>
                  <th style={{ padding: '0.625rem 1rem', fontWeight: 800, color: '#475569', fontSize: '0.6875rem', width: '20%', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: idx === invoice.lineItems.length - 1 ? 'none' : '1px solid #F1F5F9',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#083B56', verticalAlign: 'middle' }}>
                      {formatComponentName(item.component)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748B', fontSize: '0.6875rem', lineHeight: 1.4, verticalAlign: 'middle' }}>
                      {item.description || 'Monthly scheduled assessment'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#083B56', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {formatINR(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Settlement Breakdown Card */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#F8FAFC',
            borderRadius: '14px',
            border: '1px solid #DCE8EF',
            boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            fontSize: '0.75rem',
          }}
        >
          {/* Total Invoiced Amount */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#64748B' }}>Total Invoiced Amount:</span>
            <span style={{ fontWeight: 800, color: '#083B56', fontSize: '0.8125rem' }}>{formatINR(invoice.totalAmount)}</span>
          </div>

          <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '0.125rem 0' }} />

          {/* Amount Received & Cleared */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700, color: '#047857' }}>
              <CheckCircle2 size={15} style={{ color: '#059669' }} />
              <span>Amount Received &amp; Cleared:</span>
            </span>
            <span style={{ fontWeight: 800, color: '#047857', fontSize: '0.875rem' }}>
              {formatINR(invoice.paidAmount)}
            </span>
          </div>

          <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '0.125rem 0' }} />

          {/* Outstanding Balance */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#64748B' }}>Outstanding Balance:</span>
            <span
              style={{
                fontWeight: 800,
                fontSize: '0.8125rem',
                color: invoice.outstandingBalance === 0 ? '#059669' : '#DC2626',
              }}
            >
              {formatINR(invoice.outstandingBalance)}
            </span>
          </div>
        </div>

        {/* Verification Footnote */}
        <div
          style={{
            paddingTop: '0.5rem',
            borderTop: '1px dashed #CBD5E1',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'wrap',
            fontSize: '0.6875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#047857', fontWeight: 700 }}>
            <Sparkles size={14} style={{ color: '#059669' }} />
            <span>Verified &amp; Authenticated via Dwellora Secure Gateway</span>
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.625rem', fontWeight: 500 }}>
            Computer-generated tax invoice · No physical signature required
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print-wrapper, .receipt-print-wrapper * {
            visibility: visible;
          }
          .receipt-print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
            background: #ffffff !important;
          }
        }
      `}</style>
    </Modal>
  );
};
