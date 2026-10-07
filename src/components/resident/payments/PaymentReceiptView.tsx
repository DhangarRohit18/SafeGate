import React, { useState } from 'react';
import type { PaymentRecord } from '../../../domains/payments';
import { formatCurrency, getPaymentCategoryLabel, getPaymentMethodLabel } from '../../../domains/payments';
import { Button, Toast } from '../../common';
import { ArrowLeft, Download, Printer, CheckCircle2 } from 'lucide-react';
import '../resident.css';
import './payments.css';

export interface PaymentReceiptViewProps {
  payment: PaymentRecord;
  onBack: () => void;
}

export const PaymentReceiptView: React.FC<PaymentReceiptViewProps> = ({ payment, onBack }) => {
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const receiptNum = payment.receipt?.receiptNumber || `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const txnId = payment.transactionId || payment.receipt?.transactionId || 'TXN-89320149';
  const payDate = payment.paymentDate || payment.receipt?.paymentDate || '12 Aug 2026, 04:15 PM';
  const payMethod = payment.paymentMethod || payment.receipt?.paymentMethod || 'upi';

  const totalAmount = payment.amount + (payment.penaltyAmount || 0);

  return (
    <div className="res-receipt-container">
      {toastMsg && <Toast message={toastMsg} type="success" onClose={() => setToastMsg(null)} />}

      {/* Screen Header */}
      <div className="res-screen-header">
        <button className="vis-back-icon-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="vis-screen-title">Payment Receipt</h2>
          <p className="vis-screen-subtitle">Receipt #{receiptNum}</p>
        </div>
      </div>

      {/* Receipt Paper Card */}
      <div className="res-receipt-paper">
        <div className="res-receipt-paper-header">
          <div>
            <span className="receipt-brand-title">Safegate</span>
            <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--color-text)' }}>
              Lakeview Residency RWA
            </h3>
            <span className="receipt-society-name">
              Resident Account: Tower B · Flat 1204
            </span>
          </div>

          <div className="receipt-stamp-paid">
            <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
            PAID & VERIFIED
          </div>
        </div>

        {/* Payer & Receipt Details Grid */}
        <div className="res-detail-info-grid" style={{ padding: 0, border: 'none' }}>
          <div className="res-info-item-row">
            <span className="info-item-lbl">Receipt Number</span>
            <span className="info-item-val" style={{ fontFamily: 'monospace' }}>
              {receiptNum}
            </span>
          </div>

          <div className="res-info-item-row">
            <span className="info-item-lbl">Transaction Reference</span>
            <span className="info-item-val" style={{ fontFamily: 'monospace' }}>
              {txnId}
            </span>
          </div>

          <div className="res-info-item-row">
            <span className="info-item-lbl">Resident Name</span>
            <span className="info-item-val">Sarvesh Kulkarni</span>
          </div>

          <div className="res-info-item-row">
            <span className="info-item-lbl">Payment Date & Time</span>
            <span className="info-item-val">{payDate}</span>
          </div>

          <div className="res-info-item-row">
            <span className="info-item-lbl">Payment Mode</span>
            <span className="info-item-val">{getPaymentMethodLabel(payMethod)}</span>
          </div>
        </div>

        {/* Itemized Table */}
        <table className="res-receipt-table">
          <thead>
            <tr>
              <th>Particulars</th>
              <th>Period</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span style={{ fontWeight: 700, display: 'block' }}>{payment.title}</span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  Category: {getPaymentCategoryLabel(payment.category)}
                </span>
              </td>
              <td>{payment.period}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>
                {formatCurrency(payment.amount)}
              </td>
            </tr>

            {payment.penaltyAmount && payment.penaltyAmount > 0 ? (
              <tr>
                <td>Late Fee / Overdue Penalty</td>
                <td>Surcharge</td>
                <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                  +{formatCurrency(payment.penaltyAmount)}
                </td>
              </tr>
            ) : null}

            <tr className="receipt-total-row">
              <td colSpan={2}>TOTAL AMOUNT PAID</td>
              <td style={{ textAlign: 'right', color: 'var(--color-primary)' }}>
                {formatCurrency(totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="res-receipt-footer-text">
          This is an official computer-generated receipt issued by Lakeview Residency Resident Welfare Association. No physical signature required. Verified via CommunityOS Gateway.
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <Button
          variant="outline"
          fullWidth
          onClick={() => setToastMsg('Simulated PDF Download initiated')}
          leftIcon={<Download size={16} />}
        >
          Download PDF
        </Button>
        <Button
          variant="outline"
          fullWidth
          onClick={() => setToastMsg('Simulated Print Dialog triggered')}
          leftIcon={<Printer size={16} />}
        >
          Print Receipt
        </Button>
      </div>

      <Button variant="primary" fullWidth onClick={onBack}>
        Back to Payments
      </Button>
    </div>
  );
};
