import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  FileText,
  RefreshCw,
  Receipt,
  Printer,
  Filter,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { billingService } from '../../../services/billingService';
import { paymentRepository } from '../../../repositories/payments/PaymentRepository';
import type {
  SocietyInvoice,
  BillingCycle,
  PaymentTransaction,
  BillingAnalytics,
  InvoiceStatus,
  PaymentMethod,
} from '../../../types/billing';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ReceiptModal } from '../../../components/billing/ReceiptModal';
import { DataTable } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';
import { apiClient } from '../../../services/apiClient';
import { realtimeService } from '../../../services/realtimeService';
import { FileUpload } from '../../../components/ui/FileUpload';
import { Modal } from '../../../components/ui/Modal';

export const BillingManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const currentSocietyId = 'soc-gvs';
  const adminActor = { id: 'admin-1', name: 'Mayuri Udar', role: 'SOCIETY_ADMIN' };

  const [activeTab, setActiveTab] = useState<'INVOICES' | 'CYCLES' | 'TRANSACTIONS'>('INVOICES');
  const [invoices, setInvoices] = useState<SocietyInvoice[]>([]);
  const [cycles, setCycles] = useState<BillingCycle[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [analytics, setAnalytics] = useState<BillingAnalytics>({
    totalBilled: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
    collectionPercentage: 0,
  });

  // Invoice Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Transaction Filters
  const [txnSearch, setTxnSearch] = useState('');
  const [txnStatus, setTxnStatus] = useState<string>('ALL');
  const [txnDate, setTxnDate] = useState('');
  const [txnMinAmount, setTxnMinAmount] = useState<number | ''>('');

  // Refund Modal State
  const [refundTarget, setRefundTarget] = useState<PaymentTransaction | null>(null);
  const [refundReasonInput, setRefundReasonInput] = useState('Admin Authorized Refund');
  const [refundAmountInput, setRefundAmountInput] = useState<number>(0);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Modal State for New Cycle
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [cycleName, setCycleName] = useState('');
  const [cycleMonth, setCycleMonth] = useState('2026-10');
  const [dueDate, setDueDate] = useState('2026-10-25');

  // Modal State for Manual Payment
  const [manualInvoice, setManualInvoice] = useState<SocietyInvoice | null>(null);
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [manualMethod, setManualMethod] = useState<PaymentMethod>('CASH');
  const [manualNotes, setManualNotes] = useState('');
  const [manualReceiptUrl, setManualReceiptUrl] = useState('');

  // Modal State for Penalty / Adjustment
  const [penaltyInvoice, setPenaltyInvoice] = useState<SocietyInvoice | null>(null);
  const [penaltyType, setPenaltyType] = useState<'PENALTY' | 'SPECIAL_CONTRIBUTION' | 'OTHER'>('PENALTY');
  const [penaltyAmount, setPenaltyAmount] = useState<number>(250);
  const [penaltyReason, setPenaltyReason] = useState('');

  // Receipt Modal State
  const [receiptInvoice, setReceiptInvoice] = useState<SocietyInvoice | null>(null);
  const [receiptTxn, setReceiptTxn] = useState<PaymentTransaction | undefined>(undefined);

  const reloadData = async () => {
    try {
      const dbInvoices = await apiClient.getBillingInvoices();
      if (dbInvoices && Array.isArray(dbInvoices) && dbInvoices.length > 0) {
        const mapped: SocietyInvoice[] = dbInvoices.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          societyId: inv.societyId || 'soc-gvs',
          flatId: inv.flatId || 'flat-1204',
          flatCode: inv.flat?.flatNumber ? `B-${inv.flat.flatNumber}` : 'B-1204',
          residentId: inv.residentId || 'res-1',
          residentName: inv.resident?.name || 'Vikram Joshi',
          billingCycleId: inv.cycleId || 'cycle-2026-09',
          cycleName: 'September 2026 Maintenance & Utility Bill',
          lineItems: [
            { id: 'li-1', component: 'MAINTENANCE', description: 'Monthly Society Maintenance Fee', amount: Number(inv.maintenanceAmount || 0) },
            { id: 'li-2', component: 'WATER', description: 'Water & Common Utility Charges', amount: Number(inv.utilityAmount || 0) },
          ],
          totalAmount: Number(inv.totalAmount || 0),
          paidAmount: Number(inv.paidAmount || 0),
          outstandingBalance: inv.status === 'PAID' ? 0 : Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0),
          status: inv.status as any,
          dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
          createdAt: new Date(inv.createdAt).toISOString(),
          updatedAt: new Date(inv.updatedAt).toISOString(),
        }));
        setInvoices(mapped);
      } else {
        setInvoices(billingService.getInvoices(currentSocietyId));
      }

      // Fetch payments from Prisma/PostgreSQL
      const dbPayments = await apiClient.getPayments(currentSocietyId);
      if (dbPayments && Array.isArray(dbPayments) && dbPayments.length > 0) {
        const mappedTxns: PaymentTransaction[] = dbPayments.map((p: any) => ({
          id: p.id,
          invoiceId: p.invoiceId || 'inv-unknown',
          invoiceNumber: p.invoice?.invoiceNumber || p.metadata?.invoiceNumber || p.invoiceId || 'INV-PAYMENT',
          societyId: p.societyId,
          flatCode: p.invoice?.flat?.flatNumber ? `B-${p.invoice.flat.flatNumber}` : 'B-1204',
          residentName: p.resident?.name || 'Resident',
          transactionId: p.razorpayPaymentId || p.razorpayOrderId || p.id,
          amount: Number(p.amount || 0),
          paymentMethod: (p.paymentMethod as any) || 'RAZORPAY',
          status: p.status === 'SUCCESS' ? 'SUCCESS' : p.status === 'REFUNDED' ? 'REFUNDED' : 'FAILED',
          gatewayReference: p.razorpayPaymentId || p.razorpayOrderId || 'N/A',
          gatewayResponseNotes: p.refundReason || p.failureReason || (p.status === 'SUCCESS' ? 'Verified by PostgreSQL/Prisma' : ''),
          paymentDate: new Date(p.createdAt).toLocaleString('en-IN'),
        }));
        setTransactions(mappedTxns);
      } else {
        setTransactions(billingService.getTransactions(currentSocietyId));
      }
    } catch {
      setInvoices(billingService.getInvoices(currentSocietyId));
      setTransactions(billingService.getTransactions(currentSocietyId));
    }
    setCycles(billingService.getBillingCycles(currentSocietyId));
    setAnalytics(billingService.getAnalytics(currentSocietyId));
  };

  useEffect(() => {
    reloadData();

    // Live Firestore payments listener for admin billing dashboard
    const unsubPayments = paymentRepository.subscribeBySociety(currentSocietyId, (livePayments) => {
      if (livePayments && livePayments.length > 0) {
        const mappedTxns: PaymentTransaction[] = livePayments.map((p) => {
          let dateStr = new Date().toLocaleString('en-IN');
          if (p.createdAt) {
            try {
              dateStr = typeof p.createdAt?.toDate === 'function'
                ? p.createdAt.toDate().toLocaleString('en-IN')
                : new Date(p.createdAt).toLocaleString('en-IN');
            } catch {
              dateStr = new Date().toLocaleString('en-IN');
            }
          }
          return {
            id: p.id,
            invoiceId: p.invoiceId,
            invoiceNumber: p.invoiceNumber || p.invoiceId,
            societyId: p.societyId,
            flatCode: p.flatCode || '',
            residentName: p.residentName || 'Resident',
            transactionId: p.razorpayPaymentId || p.id,
            amount: p.amount,
            paymentMethod: (p.paymentMethod as any) || 'RAZORPAY',
            status: p.status === 'SUCCESS' ? 'SUCCESS' : p.status === 'REFUNDED' ? 'REFUNDED' : 'FAILED',
            gatewayReference: p.razorpayPaymentId || p.razorpayOrderId || 'N/A',
            gatewayResponseNotes: p.refundReason || p.failureReason || (p.status === 'SUCCESS' ? 'Cryptographically verified via Razorpay' : ''),
            paymentDate: dateStr,
          };
        });

        setTransactions((prev) => {
          const liveIds = new Set(mappedTxns.map((t) => t.id));
          const nonDupes = prev.filter((p) => !liveIds.has(p.id) && !liveIds.has(p.transactionId));
          return [...mappedTxns, ...nonDupes];
        });
      }
    });

    const unsub = realtimeService.subscribe('*', () => {
      reloadData();
    });
    return () => {
      unsubPayments();
      unsub();
    };
  }, [currentSocietyId]);

  const handleCreateCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName) return;

    billingService.createBillingCycle(
      {
        societyId: currentSocietyId,
        cycleName,
        cycleMonth,
        dueDate,
      },
      adminActor
    );

    setIsCycleModalOpen(false);
    setCycleName('');
    reloadData();
  };

  const handleManualPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInvoice || manualAmount <= 0) return;

    const finalNotes = manualReceiptUrl
      ? `${manualNotes ? manualNotes + ' - ' : ''}Receipt: ${manualReceiptUrl}`
      : manualNotes;

    billingService.recordManualPayment(
      manualInvoice.id,
      manualAmount,
      manualMethod,
      finalNotes,
      adminActor
    );

    setManualInvoice(null);
    setManualAmount(0);
    setManualNotes('');
    setManualReceiptUrl('');
    reloadData();
  };

  const handlePenaltySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!penaltyInvoice || penaltyAmount <= 0) return;

    billingService.applyPenaltyOrAdjustment(
      penaltyInvoice.id,
      penaltyType,
      penaltyAmount,
      penaltyReason || 'Admin Applied Charge',
      adminActor
    );

    setPenaltyInvoice(null);
    setPenaltyAmount(250);
    setPenaltyReason('');
    reloadData();
  };

  const exportReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'InvoiceNumber,FlatCode,ResidentName,TotalAmount,PaidAmount,OutstandingBalance,Status,DueDate\n' +
      invoices
        .map(
          (i) =>
            `${i.invoiceNumber},${i.flatCode},"${i.residentName}",${i.totalAmount},${i.paidAmount},${i.outstandingBalance},${i.status},${i.dueDate}`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Society_Billing_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch =
      i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.flatCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.residentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      (t.transactionId || '').toLowerCase().includes(txnSearch.toLowerCase()) ||
      (t.invoiceNumber || '').toLowerCase().includes(txnSearch.toLowerCase()) ||
      (t.residentName || '').toLowerCase().includes(txnSearch.toLowerCase()) ||
      (t.flatCode || '').toLowerCase().includes(txnSearch.toLowerCase());
    const matchesStatus = txnStatus === 'ALL' || t.status === txnStatus;
    const matchesDate = !txnDate || (t.paymentDate && t.paymentDate.includes(txnDate));
    const matchesAmount = txnMinAmount === '' || t.amount >= Number(txnMinAmount);
    return matchesSearch && matchesStatus && matchesDate && matchesAmount;
  });

  const getStatusVariant = (status: InvoiceStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIALLY_PAID':
        return 'info';
      case 'UNPAID':
        return 'warning';
      case 'OVERDUE':
      case 'FAILED':
        return 'danger';
      case 'REFUNDED':
        return 'purple';
      default:
        return 'neutral';
    }
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--aarizo-page, #F7FBFE)', paddingBottom: '2.5rem' }}>
      {/* ── Subheader / Top Bar ── */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--aarizo-border, #DCE8EF)',
          padding: '0.875rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 1px 3px rgba(8, 59, 86, 0.03)',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--aarizo-card-blue, #F4FAFE)',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--aarizo-navy, #083B56)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Billing &amp; Payments
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Manage society bills and collections
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={exportReport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.875rem',
              borderRadius: '10px',
              background: '#ffffff',
              color: 'var(--aarizo-navy, #083B56)',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(8, 59, 86, 0.04)',
              whiteSpace: 'nowrap',
            }}
          >
            <Download size={14} style={{ color: 'var(--aarizo-navy, #083B56)' }} /> Export Report
          </button>

          <button
            type="button"
            onClick={() => setIsCycleModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.875rem',
              borderRadius: '10px',
              background: 'var(--aarizo-coral, #F06543)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={15} /> New Cycle
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 space-y-5">
        {/* ── Summary Metrics KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '14px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'var(--aarizo-card-blue, #F4FAFE)', border: '1px solid var(--aarizo-border, #DCE8EF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aarizo-navy, #083B56)', flexShrink: 0 }}>
              <CreditCard size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>TOTAL BILLED</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)' }}>{formatCurrency(analytics.totalBilled)}</span>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '14px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>TOTAL COLLECTED</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{formatCurrency(analytics.totalCollected)}</span>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '14px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#FFF5F2', border: '1px solid #FDBA74', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F06543', flexShrink: 0 }}>
              <DollarSign size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>OUTSTANDING</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F06543' }}>{formatCurrency(analytics.totalOutstanding)}</span>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--aarizo-border, #DCE8EF)',
              borderRadius: '14px',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', flexShrink: 0 }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', fontWeight: 600, display: 'block' }}>OVERDUE TOTAL</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626' }}>{formatCurrency(analytics.totalOverdue)}</span>
            </div>
          </div>
        </div>

        {/* ── Sub-Tab Navigation Bar - Integrated Segmented Control Container ── */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #DCE8EF',
            borderRadius: '16px',
            padding: '0.4rem',
            boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { key: 'INVOICES', label: `Invoices & Collections (${invoices.length})`, icon: FileText },
              { key: 'CYCLES', label: `Billing Cycles (${cycles.length})`, icon: RefreshCw },
              { key: 'TRANSACTIONS', label: `Transactions & Logs (${transactions.length})`, icon: Receipt },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    background: active ? '#F06543' : '#F7FBFE',
                    color: active ? '#ffffff' : '#083B56',
                    border: active ? '1px solid #F06543' : '1px solid #DCE8EF',
                    borderRadius: '12px',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: active ? '0 3px 10px rgba(240, 101, 67, 0.28)' : 'none',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    transition: 'all 0.18s ease-in-out',
                  }}
                >
                  <Icon size={15} color={active ? '#ffffff' : '#F06543'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TAB 1: INVOICES & COLLECTIONS ── */}
        {activeTab === 'INVOICES' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col md:flex-row gap-3 justify-between items-center">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search flat, resident, invoice number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.35rem' }}
                  className="w-full pr-3 py-2 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs text-[#083B56] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-[#DCE8EF] rounded-xl px-3 py-2 text-xs font-extrabold text-[#083B56] cursor-pointer"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                <option value="PAID">PAID</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            {/* Invoices Table & Mobile Cards */}
            <div className="bg-white rounded-2xl border border-[#DCE8EF] shadow-2xs p-4">
              <DataTable
                columns={[
                  { key: 'invoiceNumber', header: 'Invoice ID', render: (inv: SocietyInvoice) => <span className="font-extrabold text-[#083B56]">{inv.invoiceNumber}</span> },
                  { key: 'flatResident', header: 'Flat & Resident', render: (inv: SocietyInvoice) => `Flat ${inv.flatCode} (${inv.residentName})` },
                  { key: 'totalAmount', header: 'Total', render: (inv: SocietyInvoice) => <span className="font-extrabold text-[#083B56]">{formatCurrency(inv.totalAmount)}</span> },
                  { key: 'paidAmount', header: 'Paid', render: (inv: SocietyInvoice) => <span className="text-[#059669] font-extrabold">{formatCurrency(inv.paidAmount)}</span> },
                  { key: 'balance', header: 'Balance', render: (inv: SocietyInvoice) => <span className="text-[#DC2626] font-extrabold">{formatCurrency(inv.outstandingBalance)}</span> },
                  { key: 'dueDate', header: 'Due Date' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (inv: SocietyInvoice) => <StatusBadge variant={getStatusVariant(inv.status)} label={inv.status} />
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (inv: SocietyInvoice) => (
                      <div className="space-x-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => setReceiptInvoice(inv)}
                          style={{
                            background: '#F4FAFE',
                            color: '#083B56',
                            border: '1px solid #DCE8EF',
                            fontWeight: 800,
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                          }}
                        >
                          Receipt
                        </button>

                        {inv.outstandingBalance > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setManualInvoice(inv);
                                setManualAmount(inv.outstandingBalance);
                              }}
                              style={{
                                background: '#059669',
                                color: '#ffffff',
                                fontWeight: 800,
                                padding: '0.35rem 0.75rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                boxShadow: '0 1px 4px rgba(5, 150, 105, 0.2)',
                              }}
                            >
                              Mark Paid
                            </button>

                            <button
                              type="button"
                              onClick={() => setPenaltyInvoice(inv)}
                              style={{
                                background: '#FEF2F2',
                                color: '#DC2626',
                                fontWeight: 800,
                                padding: '0.35rem 0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #FECACA',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                              }}
                            >
                              + Charge
                            </button>
                          </>
                        )}
                      </div>
                    )
                  }
                ]}
                data={filteredInvoices}
                keyExtractor={(inv: SocietyInvoice) => inv.id}
                pageSize={10}
                mobileRender={(inv: SocietyInvoice) => (
                  <MobileDataCard
                    title={`Flat ${inv.flatCode} • ${inv.residentName}`}
                    subtitle={`Invoice #${inv.invoiceNumber} • Due: ${inv.dueDate}`}
                    status={<StatusBadge variant={getStatusVariant(inv.status)} label={inv.status} />}
                    attributes={[
                      { label: 'Total Billed', value: formatCurrency(inv.totalAmount) },
                      { label: 'Amount Paid', value: formatCurrency(inv.paidAmount) },
                      { label: 'Outstanding Balance', value: formatCurrency(inv.outstandingBalance) }
                    ]}
                    actions={
                      <div className="flex flex-wrap gap-2 w-full mt-2">
                        <button
                          type="button"
                          onClick={() => setReceiptInvoice(inv)}
                          style={{
                            flex: 1,
                            padding: '0.45rem 0.75rem',
                            border: '1px solid #DCE8EF',
                            color: '#083B56',
                            background: '#F4FAFE',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            borderRadius: '10px',
                            cursor: 'pointer',
                          }}
                        >
                          Receipt
                        </button>
                        {inv.outstandingBalance > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setManualInvoice(inv);
                                setManualAmount(inv.outstandingBalance);
                              }}
                              style={{
                                flex: 1,
                                padding: '0.45rem 0.75rem',
                                background: '#059669',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                borderRadius: '10px',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)',
                              }}
                            >
                              Mark Paid
                            </button>
                            <button
                              type="button"
                              onClick={() => setPenaltyInvoice(inv)}
                              style={{
                                flex: 1,
                                padding: '0.45rem 0.75rem',
                                background: '#FEF2F2',
                                color: '#DC2626',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                borderRadius: '10px',
                                border: '1px solid #FECACA',
                                cursor: 'pointer',
                              }}
                            >
                              + Charge
                            </button>
                          </>
                        )}
                      </div>
                    }
                  />
                )}
              />
            </div>
          </div>
        )}

        {/* ── TAB 2: BILLING CYCLES ── */}
        {activeTab === 'CYCLES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cycles.map((c) => (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-[#DCE8EF] shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-[#083B56]">{c.cycleName}</span>
                  <StatusBadge variant={c.status === 'PUBLISHED' ? 'success' : 'neutral'} label={c.status} />
                </div>
                <div className="text-xs text-slate-500 space-y-1 font-medium">
                  <div>Cycle Month: <strong className="text-[#083B56]">{c.cycleMonth}</strong></div>
                  <div>Payment Due Date: <strong className="text-[#083B56]">{c.dueDate}</strong></div>
                  <div>Created At: <strong className="text-[#083B56]">{new Date(c.createdAt).toLocaleDateString()}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB 3: TRANSACTIONS & GATEWAY LOGS ── */}
        {activeTab === 'TRANSACTIONS' && (
          <div className="bg-white rounded-2xl border border-[#DCE8EF] shadow-2xs p-4 space-y-4">
            <div className="p-3.5 bg-[#F7FBFE] rounded-xl border border-[#DCE8EF] flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-extrabold text-[#083B56] shrink-0">
                <Filter className="w-4 h-4 text-[#F06543]" />
                <span>Payment Filters:</span>
              </div>

              <div className="flex-1 min-w-[180px] relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search Txn ID, Resident, Flat, Invoice..."
                  value={txnSearch}
                  onChange={(e) => setTxnSearch(e.target.value)}
                  style={{ paddingLeft: '2.15rem' }}
                  className="w-full pr-3 py-1.5 bg-white border border-[#DCE8EF] rounded-lg text-xs font-medium text-[#083B56] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F06543]/30"
                />
              </div>

              <select
                value={txnStatus}
                onChange={(e) => setTxnStatus(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#DCE8EF] rounded-lg text-xs font-extrabold text-[#083B56] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="REFUNDED">Refunded</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>

              <input
                type="date"
                value={txnDate}
                onChange={(e) => setTxnDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#DCE8EF] rounded-lg text-xs text-[#083B56]"
                title="Filter by payment date"
              />

              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">Min ₹:</span>
                <input
                  type="number"
                  placeholder="0"
                  value={txnMinAmount}
                  onChange={(e) => setTxnMinAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-20 px-2 py-1.5 bg-white border border-[#DCE8EF] rounded-lg text-xs text-[#083B56]"
                />
              </div>

              {(txnSearch || txnStatus !== 'ALL' || txnDate || txnMinAmount !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setTxnSearch('');
                    setTxnStatus('ALL');
                    setTxnDate('');
                    setTxnMinAmount('');
                  }}
                  className="px-2.5 py-1.5 text-rose-600 font-extrabold hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <DataTable
              columns={[
                {
                  key: 'transactionId',
                  header: 'Txn ID',
                  render: (t: PaymentTransaction) => (
                    <span className="font-extrabold text-[#083B56] font-mono select-all">
                      {t.transactionId}
                    </span>
                  ),
                },
                { key: 'invoiceNumber', header: 'Invoice' },
                {
                  key: 'flatResident',
                  header: 'Flat & Resident',
                  render: (t: PaymentTransaction) => `Flat ${t.flatCode} (${t.residentName})`,
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  render: (t: PaymentTransaction) => <span className="font-extrabold text-[#083B56]">{formatCurrency(t.amount)}</span>,
                },
                { key: 'paymentMethod', header: 'Method' },
                {
                  key: 'status',
                  header: 'Status',
                  render: (t: PaymentTransaction) => (
                    <StatusBadge
                      variant={t.status === 'SUCCESS' ? 'success' : t.status === 'REFUNDED' ? 'purple' : 'danger'}
                      label={t.status}
                    />
                  ),
                },
                { key: 'paymentDate', header: 'Date' },
                {
                  key: 'receipt',
                  header: 'Receipt',
                  render: (t: PaymentTransaction) => (
                    <button
                      type="button"
                      onClick={() => {
                        const matchInv = invoices.find((i) => i.id === t.invoiceId || i.invoiceNumber === t.invoiceNumber) || {
                          id: t.invoiceId,
                          invoiceNumber: t.invoiceNumber || 'INV-PAID',
                          societyId: currentSocietyId,
                          flatId: 'flat-1204',
                          flatCode: t.flatCode,
                          residentId: 'res-unknown',
                          residentName: t.residentName,
                          billingCycleId: 'cycle-admin',
                          cycleName: 'Society Maintenance Dues',
                          lineItems: [{ id: 'li-1', component: 'MAINTENANCE', description: 'Maintenance Dues', amount: t.amount }],
                          totalAmount: t.amount,
                          paidAmount: t.amount,
                          outstandingBalance: 0,
                          status: 'PAID',
                          dueDate: t.paymentDate,
                          createdAt: t.paymentDate,
                          updatedAt: t.paymentDate,
                        };
                        setReceiptInvoice(matchInv);
                        setReceiptTxn(t);
                      }}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        background: '#F4FAFE',
                        border: '1px solid #DCE8EF',
                        color: '#083B56',
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Printer size={13} />
                      <span>Receipt</span>
                    </button>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Refund Action',
                  render: (t: PaymentTransaction) => (
                    t.status === 'SUCCESS' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRefundTarget(t);
                          setRefundAmountInput(t.amount);
                          setRefundReasonInput('Admin Approved Refund / Settlement Adjustment');
                        }}
                        style={{
                          background: '#FEF2F2',
                          color: '#DC2626',
                          fontWeight: 800,
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #FECACA',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                        }}
                      >
                        Refund
                      </button>
                    ) : null
                  ),
                },
              ]}
              data={filteredTransactions}
              keyExtractor={(t: PaymentTransaction) => t.id}
              pageSize={10}
              mobileRender={(t: PaymentTransaction) => (
                <MobileDataCard
                  title={`Txn #${t.transactionId} • Flat ${t.flatCode}`}
                  subtitle={`Invoice: ${t.invoiceNumber} • Resident: ${t.residentName}`}
                  status={
                    <StatusBadge
                      variant={t.status === 'SUCCESS' ? 'success' : t.status === 'REFUNDED' ? 'purple' : 'danger'}
                      label={t.status}
                    />
                  }
                  attributes={[
                    { label: 'Amount', value: formatCurrency(t.amount) },
                    { label: 'Payment Method', value: t.paymentMethod },
                    { label: 'Gateway Reference', value: t.gatewayReference || 'N/A' },
                    { label: 'Date', value: t.paymentDate },
                  ]}
                  actions={
                    <div className="flex items-center gap-2 w-full mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const matchInv = invoices.find((i) => i.id === t.invoiceId || i.invoiceNumber === t.invoiceNumber) || {
                            id: t.invoiceId,
                            invoiceNumber: t.invoiceNumber || 'INV-PAID',
                            societyId: currentSocietyId,
                            flatId: 'flat-1204',
                            flatCode: t.flatCode,
                            residentId: 'res-unknown',
                            residentName: t.residentName,
                            billingCycleId: 'cycle-admin',
                            cycleName: 'Society Maintenance Dues',
                            lineItems: [{ id: 'li-1', component: 'MAINTENANCE', description: 'Maintenance Dues', amount: t.amount }],
                            totalAmount: t.amount,
                            paidAmount: t.amount,
                            outstandingBalance: 0,
                            status: 'PAID',
                            dueDate: t.paymentDate,
                            createdAt: t.paymentDate,
                            updatedAt: t.paymentDate,
                          };
                          setReceiptInvoice(matchInv);
                          setReceiptTxn(t);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.75rem',
                          border: '1px solid #DCE8EF',
                          color: '#083B56',
                          background: '#F4FAFE',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Printer size={14} /> Receipt
                      </button>
                      {t.status === 'SUCCESS' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRefundTarget(t);
                            setRefundAmountInput(t.amount);
                            setRefundReasonInput('Admin Approved Refund / Settlement Adjustment');
                          }}
                          style={{
                            flex: 1,
                            padding: '0.45rem 0.75rem',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            borderRadius: '10px',
                            border: '1px solid #FECACA',
                            cursor: 'pointer',
                          }}
                        >
                          Process Refund
                        </button>
                      )}
                    </div>
                  }
                />
              )}
            />
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {/* Modal: New Billing Cycle */}
      <Modal
        isOpen={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
        title="Create New Billing Cycle"
        subtitle="Publish society-wide recurring maintenance invoices"
        maxWidth="500px"
      >
        <form onSubmit={handleCreateCycle} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-extrabold text-[#083B56] mb-1.5">Cycle Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. October 2026 Maintenance Bill"
              className="w-full px-3.5 py-2.5 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs font-semibold text-[#083B56] focus:outline-none focus:ring-2 focus:ring-[#F06543]/30"
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#083B56] mb-1.5">Cycle Month</label>
              <input
                type="month"
                className="w-full px-3.5 py-2.5 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs font-semibold text-[#083B56] focus:outline-none focus:ring-2 focus:ring-[#F06543]/30"
                value={cycleMonth}
                onChange={(e) => setCycleMonth(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#083B56] mb-1.5">Due Date</label>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs font-semibold text-[#083B56] focus:outline-none focus:ring-2 focus:ring-[#F06543]/30"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#DCE8EF]">
            <button
              type="button"
              onClick={() => setIsCycleModalOpen(false)}
              className="px-4 py-2.5 border border-[#DCE8EF] hover:bg-[#F4FAFE] text-[#083B56] font-extrabold rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#F06543] hover:bg-[#e05432] text-white font-extrabold rounded-xl text-xs shadow-md transition"
            >
              Publish Cycle &amp; Generate Invoices
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Manual Offline Payment */}
      <Modal
        isOpen={Boolean(manualInvoice)}
        onClose={() => setManualInvoice(null)}
        title={manualInvoice ? `Record Offline Payment · Unit ${manualInvoice.flatCode}` : 'Record Offline Payment'}
        subtitle="Acknowledge cash, physical cheque, or direct bank transfer"
        maxWidth="500px"
      >
        {manualInvoice && (
          <form onSubmit={handleManualPaymentSubmit} className="space-y-4 pt-1">
            <div className="p-3 bg-[#F7FBFE] rounded-xl text-xs flex justify-between items-center border border-[#DCE8EF]">
              <span className="text-slate-500 font-medium">Outstanding Balance:</span>
              <span className="font-extrabold text-[#083B56] text-sm">{formatCurrency(manualInvoice.outstandingBalance)}</span>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#083B56] mb-1.5">Amount Received (₹) *</label>
              <input
                type="number"
                required
                min={1}
                max={manualInvoice.outstandingBalance}
                className="w-full px-3.5 py-2.5 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs font-extrabold text-[#083B56] focus:outline-none focus:ring-2 focus:ring-[#F06543]/30"
                value={manualAmount}
                onChange={(e) => setManualAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#083B56] mb-1.5">Payment Method *</label>
              <select
                className="w-full px-3.5 py-2.5 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs font-semibold text-[#083B56] focus:outline-none focus:ring-2 focus:ring-[#F06543]/30"
                value={manualMethod}
                onChange={(e) => setManualMethod(e.target.value as PaymentMethod)}
              >
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI Direct</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#083B56] mb-1.5">Cheque No / Reference Notes</label>
              <input
                type="text"
                placeholder="e.g. HDFC Cheque #009210 or UTR Number"
                className="w-full px-3.5 py-2.5 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs font-semibold text-[#083B56] focus:outline-none focus:ring-2 focus:ring-[#F06543]/30"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#083B56] mb-1.5">
                Cheque / Counterfoil Photo (Optional)
              </label>
              <FileUpload
                category="receipts"
                label="Upload Cheque Photo or Counterfoil"
                currentUrl={manualReceiptUrl}
                onUploadSuccess={(url: string) => setManualReceiptUrl(url)}
                onRemove={() => setManualReceiptUrl('')}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#DCE8EF]">
              <button
                type="button"
                onClick={() => setManualInvoice(null)}
                className="px-4 py-2.5 border border-[#DCE8EF] hover:bg-[#F4FAFE] text-[#083B56] font-extrabold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-extrabold rounded-xl text-xs shadow-md transition"
              >
                Record Payment
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Penalty or Adjustment */}
      <Modal
        isOpen={Boolean(penaltyInvoice)}
        onClose={() => setPenaltyInvoice(null)}
        title={penaltyInvoice ? `Apply Charge / Penalty · Unit ${penaltyInvoice.flatCode}` : 'Apply Charge / Penalty'}
        subtitle="Impose overdue late fee or special society contribution fund"
        maxWidth="480px"
      >
        {penaltyInvoice && (
          <form onSubmit={handlePenaltySubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-extrabold text-[#083B56] mb-1.5">Charge Type</label>
              <select
                className="w-full px-3.5 py-2.5 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs font-semibold text-[#083B56] focus:outline-none focus:ring-2 focus:ring-[#F06543]/30"
                value={penaltyType}
                onChange={(e) => setPenaltyType(e.target.value as any)}
              >
                <option value="PENALTY">Late Penalty Charge</option>
                <option value="SPECIAL_CONTRIBUTION">Special Contribution Fund</option>
                <option value="OTHER">Other Adjustment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#083B56] mb-1.5">Amount (₹) *</label>
              <input
                type="number"
                required
                min={1}
                className="w-full px-3.5 py-2.5 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs font-extrabold text-[#083B56] focus:outline-none focus:ring-2 focus:ring-[#F06543]/30"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#083B56] mb-1.5">Reason / Description</label>
              <input
                type="text"
                placeholder="e.g. Overdue payment penalty"
                className="w-full px-3.5 py-2.5 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs font-semibold text-[#083B56] focus:outline-none focus:ring-2 focus:ring-[#F06543]/30"
                value={penaltyReason}
                onChange={(e) => setPenaltyReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#DCE8EF]">
              <button
                type="button"
                onClick={() => setPenaltyInvoice(null)}
                className="px-4 py-2.5 border border-[#DCE8EF] hover:bg-[#F4FAFE] text-[#083B56] font-extrabold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white font-extrabold rounded-xl text-xs shadow-md transition"
              >
                Apply Charge
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Admin Refund Processor */}
      <Modal
        isOpen={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        title="Process Razorpay Refund"
        subtitle="Initiate instant gateway refund back to source instrument"
        maxWidth="500px"
      >
        {refundTarget && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsProcessingRefund(true);
              try {
                const res = await billingService.processRefund(
                  refundTarget.id,
                  refundAmountInput,
                  refundReasonInput,
                  adminActor
                );
                alert(res.message || 'Refund successfully processed.');
                setRefundTarget(null);
                reloadData();
              } catch (err: any) {
                alert(err?.message || 'Refund failed');
              } finally {
                setIsProcessingRefund(false);
              }
            }}
            className="space-y-4 pt-1"
          >
            <div className="p-3 bg-[#F7FBFE] rounded-xl text-xs space-y-1.5 border border-[#DCE8EF]">
              <div>Transaction ID: <span className="font-mono font-extrabold text-[#083B56]">{refundTarget.transactionId}</span></div>
              <div>Resident: <strong>{refundTarget.residentName} (Flat {refundTarget.flatCode})</strong></div>
              <div>Invoice: <strong>{refundTarget.invoiceNumber}</strong></div>
              <div>Original Amount Paid: <strong className="text-[#059669]">{formatCurrency(refundTarget.amount)}</strong></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-[#083B56] mb-1.5">Refund Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={refundTarget.amount}
                  value={refundAmountInput}
                  onChange={(e) => setRefundAmountInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs font-extrabold text-[#083B56] focus:outline-none focus:ring-2 focus:ring-[#F06543]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#083B56] mb-1.5">Reason for Refund *</label>
                <input
                  type="text"
                  required
                  value={refundReasonInput}
                  onChange={(e) => setRefundReasonInput(e.target.value)}
                  placeholder="e.g. Duplicate transaction or billing dispute adjustment"
                  className="w-full px-3.5 py-2.5 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs font-semibold text-[#083B56] focus:outline-none focus:ring-2 focus:ring-[#F06543]/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#DCE8EF]">
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="px-4 py-2.5 border border-[#DCE8EF] hover:bg-[#F4FAFE] text-[#083B56] font-extrabold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessingRefund}
                className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50"
              >
                {isProcessingRefund ? 'Processing via Razorpay...' : `Confirm Refund of ${formatCurrency(refundAmountInput)}`}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Printable Receipt */}
      {receiptInvoice && (
        <ReceiptModal
          invoice={receiptInvoice}
          transaction={receiptTxn || transactions.find((t) => t.invoiceId === receiptInvoice.id)}
          onClose={() => {
            setReceiptInvoice(null);
            setReceiptTxn(undefined);
          }}
        />
      )}
    </div>
  );
};

export default BillingManagementPage;
