import React, { useState, useEffect } from 'react';
import { usePrototype } from '../../../context/PrototypeContext';
import type { PaymentRecord, PaymentMethod } from '../../../domains/payments';
import { formatCurrency } from '../../../domains/payments';
import { apiClient } from '../../../services/apiClient';
import { realtimeService } from '../../../services/realtimeService';
import { billingService } from '../../../services/billingService';
import { PaymentCard } from './PaymentCard';
import { PaymentDetail } from './PaymentDetail';
import { PaymentCheckout } from './PaymentCheckout';
import { PaymentSuccess } from './PaymentSuccess';
import { PaymentReceiptView } from './PaymentReceiptView';
import { LoadingState, EmptyState, ErrorState, Tabs } from '../../common';
import { CreditCard } from 'lucide-react';
import { triggerHaptic } from '../../../utils/nativeMobile';
import '../resident.css';
import './payments.css';

export interface PaymentsHomeProps {
  onBackToHome?: () => void;
}

type PaymentsSubView = 'main' | 'detail' | 'success' | 'receipt';

export const PaymentsHome: React.FC<PaymentsHomeProps> = () => {
  const { uiState } = usePrototype();

  // Local state for active dues and history loaded from PostgreSQL / local billingService
  const [duesList, setDuesList] = useState<PaymentRecord[]>([]);
  const [historyList, setHistoryList] = useState<PaymentRecord[]>([]);

  const loadInvoices = async () => {
    try {
      const invoices = await apiClient.getBillingInvoices();
      if (invoices && Array.isArray(invoices) && invoices.length > 0) {
        const all: PaymentRecord[] = invoices.map((inv: any) => ({
          id: inv.id,
          title: `Society Maintenance — ${inv.invoiceNumber}`,
          description: `Flat ${inv.flat?.flatNumber || '1204'} monthly maintenance assessment`,
          accountReference: inv.invoiceNumber || 'ACC-1204',
          amount: Number(inv.totalAmount || 0),
          dueDate: new Date(inv.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
          category: 'maintenance',
          status: inv.status === 'PAID' ? 'PAID' : (inv.status === 'OVERDUE' ? 'OVERDUE' : 'DUE'),
          paymentDate: inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('en-IN') : undefined,
          transactionId: inv.id.slice(-8),
          paymentMethod: inv.paymentMode ? (inv.paymentMode.toLowerCase() as any) : undefined,
          period: 'Monthly Assessment',
        }));

        setDuesList(all.filter((i) => i.status !== 'PAID'));
        setHistoryList(all.filter((i) => i.status === 'PAID'));
        return;
      }
    } catch (err) {
      console.warn('Live API fetch note, using fallback ledger store:', err);
    }

    // Fallback to billingService so dues always populate reliably offline
    const localInvoices = billingService.getInvoices('soc-gvs');
    if (localInvoices && localInvoices.length > 0) {
      const all: PaymentRecord[] = localInvoices.map((inv) => ({
        id: inv.id,
        title: inv.cycleName || `Society Maintenance — ${inv.invoiceNumber}`,
        description: `Flat ${inv.flatCode || 'B-1204'} monthly maintenance assessment`,
        accountReference: inv.invoiceNumber,
        amount: inv.totalAmount,
        dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 25, 2026',
        category: 'maintenance',
        status: inv.status === 'PAID' ? 'PAID' : (inv.status === 'OVERDUE' ? 'OVERDUE' : 'DUE'),
        paymentDate: inv.paidAmount >= inv.totalAmount ? 'Aug 12, 2026' : undefined,
        transactionId: inv.id.slice(-8),
        paymentMethod: 'upi',
        period: inv.cycleName,
      }));
      setDuesList(all.filter((i) => i.status !== 'PAID'));
      setHistoryList(all.filter((i) => i.status === 'PAID'));
    }
  };

  useEffect(() => {
    loadInvoices();
    const unsub = realtimeService.subscribe('*', (msg) => {
      if (['PAYMENT_STATUS', 'PAYMENT_COMPLETED', 'BILLING_UPDATED'].includes(msg.topic)) {
        loadInvoices();
      }
    });
    return () => unsub();
  }, []);

  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'history'>('all');
  const [subView, setSubView] = useState<PaymentsSubView>('main');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  // Checkout modal control
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPayment, setCheckoutPayment] = useState<PaymentRecord | null>(null);

  // Success state reference
  const [completedTxnId, setCompletedTxnId] = useState<string>('');

  // Prototype UI States
  if (uiState === 'loading') {
    return <LoadingState message="Loading society maintenance dues & payment history..." />;
  }

  if (uiState === 'empty') {
    return (
      <div className="res-payments-container">
        <div className="res-payments-header">
          <div>
            <h2 className="vis-screen-title">Payments & Dues</h2>
            <p className="vis-screen-subtitle">Lakeview Residency • Tower B • Flat 1204</p>
          </div>
        </div>
        <EmptyState
          title="All Dues Settle Clear"
          description="Flat 1204 has zero outstanding maintenance or utility bills."
          icon={<CreditCard size={36} />}
        />
      </div>
    );
  }

  if (uiState === 'error') {
    return (
      <div className="res-payments-container">
        <ErrorState
          title="Payment Gateway Timeout"
          message="Simulated connection failure to society billing gateway server."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Calculate totals
  const unpaidItems = duesList.filter((d) => d.status === 'DUE' || d.status === 'OVERDUE' || d.status === 'FAILED');
  const totalOutstanding = unpaidItems.reduce(
    (sum, item) => sum + item.amount + (item.penaltyAmount || 0),
    0
  );

  const overdueCount = duesList.filter((d) => d.status === 'OVERDUE').length;

  // Earliest due date
  const nextDueDate = unpaidItems.length > 0 ? unpaidItems[0].dueDate : 'No pending dues';

  // Sub-view renders
  if (subView === 'detail' && selectedPayment) {
    return (
      <PaymentDetail
        payment={selectedPayment}
        onBack={() => setSubView('main')}
        onPayNow={(p) => {
          setCheckoutPayment(p);
          setIsCheckoutOpen(true);
        }}
        onViewReceipt={(p) => {
          setSelectedPayment(p);
          setSubView('receipt');
        }}
      />
    );
  }

  if (subView === 'success' && selectedPayment) {
    return (
      <PaymentSuccess
        payment={selectedPayment}
        transactionId={completedTxnId}
        onViewReceipt={() => setSubView('receipt')}
        onBackToPayments={() => setSubView('main')}
      />
    );
  }

  if (subView === 'receipt' && selectedPayment) {
    return (
      <PaymentReceiptView
        payment={selectedPayment}
        onBack={() => setSubView('main')}
      />
    );
  }

  // Handle Pay Now click
  const handleInitiatePay = (payment: PaymentRecord) => {
    setCheckoutPayment(payment);
    setIsCheckoutOpen(true);
  };

  // Handle Payment Success from Checkout Modal
  const handlePaymentCompleted = (
    paymentId: string,
    method: PaymentMethod,
    txnId: string
  ) => {
    setIsCheckoutOpen(false);

    // Find the item being paid
    const targetItem = duesList.find((d) => d.id === paymentId);

    if (targetItem) {
      const nowStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const updatedPaidRecord: PaymentRecord = {
        ...targetItem,
        status: 'PAID',
        paymentDate: nowStr,
        transactionId: txnId,
        paymentMethod: method,
        receipt: {
          receiptNumber: `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          transactionId: txnId,
          paidAmount: targetItem.amount + (targetItem.penaltyAmount || 0),
          paymentDate: nowStr,
          paymentMethod: method,
          payerName: 'Sarvesh Kulkarni',
          flatCode: 'Flat 1204',
          tower: 'Tower B',
          societyName: 'Lakeview Residency',
          category: targetItem.category,
          itemTitle: targetItem.title,
          period: targetItem.period,
        },
      };

      // Remove from dues list and add to history list
      setDuesList((prev) => prev.filter((d) => d.id !== paymentId));
      setHistoryList((prev) => [updatedPaidRecord, ...prev]);

      setSelectedPayment(updatedPaidRecord);
      setCompletedTxnId(txnId);
      setSubView('success');
      triggerHaptic('success');

      // Persist payment to PostgreSQL backend database
      apiClient
        .updateBillingInvoice(paymentId, {
          status: 'PAID',
          paidAmount: targetItem.amount,
          paymentMode: String(method || 'UPI'),
          paidAt: new Date(),
        })
        .then(() => {
          realtimeService.publish(
            'PAYMENT_STATUS',
            {
              invoiceId: paymentId,
              amount: targetItem.amount,
              status: 'PAID',
              flatCode: '1204',
            },
            'soc-gvs',
            'RESIDENT',
            'Payment Gateway'
          );
          realtimeService.publish(
            'PAYMENT_COMPLETED',
            {
              invoiceId: paymentId,
              amount: targetItem.amount,
              status: 'PAID',
              flatCode: '1204',
            },
            'soc-gvs',
            'RESIDENT',
            'Payment Gateway'
          );
        })
        .catch((err) => {
          console.warn('Note updating invoice in PostgreSQL:', err);
        });

      // Synchronize with billingService local ledger
      billingService
        .processOnlinePayment(
          paymentId,
          targetItem.amount + (targetItem.penaltyAmount || 0),
          { id: 'res-current', name: 'Sarvesh Kulkarni', role: 'RESIDENT' },
          undefined,
          {
            transactionId: txnId,
            gatewayReference: `rzp_${txnId}`,
            paymentMethod: 'ONLINE_GATEWAY',
            notes: `Paid via ${method}`,
          }
        )
        .catch((err) => {
          console.warn('[PaymentsHome] Local ledger sync note:', err);
        });
    }
  };

  // Determine list items to show
  const getDisplayedItems = () => {
    if (activeTab === 'unpaid') return unpaidItems;
    if (activeTab === 'history') return historyList;
    // 'all': pending dues first, then history
    return [...duesList, ...historyList];
  };

  const displayedItems = getDisplayedItems();

  return (
    <div className="res-payments-container">
      {/* Header */}
      <div className="res-payments-header">
        <div>
          <h2 className="vis-screen-title">Payments & Dues</h2>
          <p className="vis-screen-subtitle">Lakeview Residency • Tower B • Flat 1204</p>
        </div>
      </div>

      {/* Top Summary Card */}
      <div className="res-pay-summary-card">
        <div className="res-summary-top">
          <div>
            <span className="summary-label">Total Outstanding Dues</span>
            <div className="summary-total">{formatCurrency(totalOutstanding)}</div>
          </div>
          {overdueCount > 0 && (
            <span className="summary-overdue-pill">
              {overdueCount} Overdue Bill{overdueCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="res-summary-metrics">
          <div>
            <span className="metric-label">Next Due Date</span>
            <div className="metric-val">{nextDueDate}</div>
          </div>
          <div>
            <span className="metric-label">Last Payment</span>
            <div className="metric-val">₹4,250 (12 Aug)</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        tabs={[
          { id: 'all', label: 'All Dues', badge: duesList.length + historyList.length },
          { id: 'unpaid', label: 'Pending Dues', badge: unpaidItems.length },
          { id: 'history', label: 'History', badge: historyList.length },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* List of Payments */}
      {displayedItems.length === 0 ? (
        <EmptyState
          title="No Dues In This Category"
          description="There are currently no records matching this filter."
          icon={<CreditCard size={32} />}
        />
      ) : (
        <div className="res-payment-card-list">
          {displayedItems.map((item) => (
            <PaymentCard
              key={item.id}
              payment={item}
              onPayNow={handleInitiatePay}
              onViewReceipt={(p) => {
                setSelectedPayment(p);
                setSubView('receipt');
              }}
              onCardClick={(p) => {
                setSelectedPayment(p);
                setSubView('detail');
              }}
            />
          ))}
        </div>
      )}

      {/* Checkout Modal */}
      <PaymentCheckout
        isOpen={isCheckoutOpen}
        payment={checkoutPayment}
        onClose={() => setIsCheckoutOpen(false)}
        onPaymentSuccess={handlePaymentCompleted}
      />
    </div>
  );
};
