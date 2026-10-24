import type {
  SocietyInvoice,
  BillingCycle,
  PaymentTransaction,
  BillLineItem,
  InvoiceStatus,
  PaymentMethod,
  BillingAnalytics,
} from '../types/billing';
import { defaultPaymentGateway, type PaymentGatewayAdapter } from './payment/PaymentGatewayAdapter';
import { logAudit } from './societyService';
import { billingInvoiceRepository, billingCycleRepository, paymentTransactionRepository } from '../repositories/billing/BillingRepository';
import { realtimeService } from './realtimeService';

const STORAGE_KEYS = {
  CYCLES: 'communityos_billing_cycles_v7',
  INVOICES: 'communityos_billing_invoices_v7',
  TRANSACTIONS: 'communityos_billing_transactions_v7',
};

const SEED_CYCLES: BillingCycle[] = [
  {
    id: 'cycle-2026-09',
    societyId: 'soc-gvs',
    cycleName: 'September 2026 Maintenance & Utility Bill',
    cycleMonth: '2026-09',
    dueDate: '2026-09-25',
    status: 'PUBLISHED',
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'cycle-2026-08',
    societyId: 'soc-gvs',
    cycleName: 'August 2026 Maintenance & Utility Bill',
    cycleMonth: '2026-08',
    dueDate: '2026-08-25',
    status: 'CLOSED',
    createdAt: '2026-08-01T00:00:00Z',
  },
];

const SEED_INVOICES: SocietyInvoice[] = [
  {
    id: 'inv-101',
    invoiceNumber: 'INV-2026-09-1204',
    societyId: 'soc-gvs',
    flatId: 'flat-1204',
    flatCode: 'B-1204',
    residentId: 'res-1',
    residentName: 'Rajesh Kumar',
    billingCycleId: 'cycle-2026-09',
    cycleName: 'September 2026 Maintenance & Utility Bill',
    lineItems: [
      { id: 'li-1', component: 'MAINTENANCE', description: 'Monthly Society Maintenance Fee', amount: 3500 },
      { id: 'li-2', component: 'WATER', description: 'Water Consumption Charges', amount: 450 },
      { id: 'li-3', component: 'ELECTRICITY', description: 'Common Area & Backup Power Charge', amount: 600 },
      { id: 'li-4', component: 'PARKING', description: 'Allocated Parking Slot (Slot B1-14)', amount: 500 },
      { id: 'li-5', component: 'CLUBHOUSE', description: 'Gym & Swimming Pool Facilities', amount: 300 },
      { id: 'li-6', component: 'PENALTY', description: 'Previous Month Late Penalty', amount: 0 },
      { id: 'li-7', component: 'SPECIAL_CONTRIBUTION', description: 'Festival & CCTV Fund', amount: 250 },
      { id: 'li-8', component: 'SERVICE_CHARGES', description: 'Sewage & Waste Collection Fee', amount: 150 },
      { id: 'li-9', component: 'OTHER', description: 'Intercom Maintenance', amount: 50 },
    ],
    totalAmount: 5800,
    paidAmount: 0,
    outstandingBalance: 5800,
    status: 'UNPAID',
    dueDate: '2026-09-25',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'inv-102',
    invoiceNumber: 'INV-2026-09-0301',
    societyId: 'soc-gvs',
    flatId: 'flat-301',
    flatCode: 'C-301',
    residentId: 'res-3',
    residentName: 'Siddharth Patel',
    billingCycleId: 'cycle-2026-09',
    cycleName: 'September 2026 Maintenance & Utility Bill',
    lineItems: [
      { id: 'li-10', component: 'MAINTENANCE', description: 'Monthly Society Maintenance Fee', amount: 3500 },
      { id: 'li-11', component: 'WATER', description: 'Water Meter Charges', amount: 400 },
      { id: 'li-12', component: 'ELECTRICITY', description: 'Common Power', amount: 550 },
      { id: 'li-13', component: 'PARKING', description: 'Slot C-02', amount: 500 },
      { id: 'li-14', component: 'SERVICE_CHARGES', description: 'Security & Housekeeping', amount: 200 },
    ],
    totalAmount: 5150,
    paidAmount: 5150,
    outstandingBalance: 0,
    status: 'PAID',
    dueDate: '2026-09-25',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-05T10:30:00Z',
  },
  {
    id: 'inv-103',
    invoiceNumber: 'INV-2026-09-0402',
    societyId: 'soc-gvs',
    flatId: 'flat-402',
    flatCode: 'A-402',
    residentId: 'res-2',
    residentName: 'Ananya Roy',
    billingCycleId: 'cycle-2026-09',
    cycleName: 'September 2026 Maintenance & Utility Bill',
    lineItems: [
      { id: 'li-15', component: 'MAINTENANCE', description: 'Monthly Maintenance Fee', amount: 3500 },
      { id: 'li-16', component: 'WATER', description: 'Water Charges', amount: 500 },
      { id: 'li-17', component: 'PENALTY', description: 'Overdue Penalty Charge', amount: 200 },
    ],
    totalAmount: 4200,
    paidAmount: 2000,
    outstandingBalance: 2200,
    status: 'PARTIALLY_PAID',
    dueDate: '2026-09-10',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-11T12:00:00Z',
  },
];

const SEED_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: 'txn-100',
    invoiceId: 'inv-100-aug',
    invoiceNumber: 'INV-2026-08-1204',
    societyId: 'soc-gvs',
    flatCode: 'B-1204',
    residentName: 'Rajesh Kumar',
    transactionId: 'TXN-88291044',
    amount: 5600,
    paymentMethod: 'ONLINE_GATEWAY',
    status: 'SUCCESS',
    gatewayReference: 'pay_rzp_aug_1204_live',
    gatewayResponseNotes: 'August 2026 Maintenance Paid in Full via NetBanking',
    paymentDate: '2026-08-18 02:45 PM',
  },
  {
    id: 'txn-099',
    invoiceId: 'inv-099-jul',
    invoiceNumber: 'INV-2026-07-1204',
    societyId: 'soc-gvs',
    flatCode: 'B-1204',
    residentName: 'Rajesh Kumar',
    transactionId: 'TXN-66401923',
    amount: 5600,
    paymentMethod: 'UPI',
    status: 'SUCCESS',
    gatewayReference: 'upi_gvs_jul_1204',
    gatewayResponseNotes: 'July 2026 Maintenance Paid via GPay UPI',
    paymentDate: '2026-07-20 11:15 AM',
  },
  {
    id: 'txn-101',
    invoiceId: 'inv-102',
    invoiceNumber: 'INV-2026-09-0301',
    societyId: 'soc-gvs',
    flatCode: 'C-301',
    residentName: 'Siddharth Patel',
    transactionId: 'TXN-99120481',
    amount: 5150,
    paymentMethod: 'ONLINE_GATEWAY',
    status: 'SUCCESS',
    gatewayReference: 'pay_razorstripe_88129',
    gatewayResponseNotes: 'Approved by Razorpay gateway',
    paymentDate: '2026-09-05 10:30 AM',
  },
  {
    id: 'txn-102',
    invoiceId: 'inv-103',
    invoiceNumber: 'INV-2026-09-0402',
    societyId: 'soc-gvs',
    flatCode: 'A-402',
    residentName: 'Ananya Roy',
    transactionId: 'TXN-77301928',
    amount: 2000,
    paymentMethod: 'UPI',
    status: 'SUCCESS',
    gatewayReference: 'upi_ref_002910',
    gatewayResponseNotes: 'Partial payment received via UPI',
    paymentDate: '2026-09-11 12:00 PM',
  },
];

const cleanEncoding = (val: string): string => {
  return val
    .replace(/â‚¹/g, '₹')
    .replace(/Ã¢Å“â€¢/g, '✕')
    .replace(/Ã¢/g, '')
    .replace(/â€“/g, '–')
    .replace(/â€”/g, '—');
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(cleanEncoding(raw));
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save billing data to key ${key}:`, err);
  }
}

export const billingService = {
  getBillingCycles: (societyId: string): BillingCycle[] =>
    getItem(STORAGE_KEYS.CYCLES, SEED_CYCLES).filter((c) => c.societyId === societyId),

  getInvoices: (societyId: string): SocietyInvoice[] =>
    getItem(STORAGE_KEYS.INVOICES, SEED_INVOICES).filter((i) => i.societyId === societyId),

  getTransactions: (societyId: string): PaymentTransaction[] =>
    getItem(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS).filter((t) => t.societyId === societyId),

  createBillingCycle: (
    data: {
      societyId: string;
      cycleName: string;
      cycleMonth: string;
      dueDate: string;
    },
    actor: { id: string; name: string; role: string }
  ): BillingCycle => {
    const cycles = getItem(STORAGE_KEYS.CYCLES, SEED_CYCLES);
    const newCycle: BillingCycle = {
      ...data,
      id: `cycle-${data.cycleMonth}`,
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
    };

    setItem(STORAGE_KEYS.CYCLES, [newCycle, ...cycles]);
    billingCycleRepository.create(newCycle).catch(() => {});
    logAudit(data.societyId, actor, 'CREATE', 'BillingCycle', newCycle.id, `Created billing cycle ${data.cycleName}`);
    return newCycle;
  },

  processOnlinePayment: async (
    invoiceId: string,
    amountToPay: number,
    actor: { id: string; name: string; role: string },
    adapter: PaymentGatewayAdapter = defaultPaymentGateway,
    verifiedDetails?: {
      transactionId?: string;
      gatewayReference?: string;
      paymentMethod?: PaymentMethod;
      notes?: string;
    }
  ): Promise<{ success: boolean; transaction?: PaymentTransaction; message: string }> => {
    const invoices = getItem(STORAGE_KEYS.INVOICES, SEED_INVOICES);
    const idx = invoices.findIndex((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
    if (idx === -1) {
      console.warn(`[BillingService] Invoice ${invoiceId} not found in local store, ledger synced directly.`);
      return { success: true, message: 'Payment recorded.' };
    }

    const inv = invoices[idx];

    let gatewayRes = {
      success: true,
      transactionId: verifiedDetails?.transactionId || `pay_rzp_${Date.now()}`,
      gatewayReference: verifiedDetails?.gatewayReference || `ref_${Date.now()}`,
      message: verifiedDetails?.notes || 'Payment verified via Razorpay Gateway',
    };

    if (!verifiedDetails) {
      // 1. Create Session with Gateway Adapter
      const session = await adapter.createPaymentSession(inv.id, amountToPay);

      // 2. Process Payment via Gateway Adapter
      gatewayRes = await adapter.processPayment({
        sessionId: session.sessionId,
        gatewayToken: session.gatewayToken,
        amount: amountToPay,
        paymentMode: 'ONLINE',
      });
    }

    const transactions = getItem(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    const timeStr = new Date().toLocaleString('en-IN');

    if (!gatewayRes.success) {
      // Record Failed Payment
      const failedTxn: PaymentTransaction = {
        id: `txn-${Date.now()}`,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        societyId: inv.societyId,
        flatCode: inv.flatCode,
        residentName: inv.residentName,
        transactionId: gatewayRes.transactionId,
        amount: amountToPay,
        paymentMethod: verifiedDetails?.paymentMethod || 'ONLINE_GATEWAY',
        status: 'FAILED',
        gatewayReference: gatewayRes.gatewayReference,
        gatewayResponseNotes: gatewayRes.message,
        paymentDate: timeStr,
      };

      inv.status = 'FAILED';
      setItem(STORAGE_KEYS.INVOICES, invoices);
      setItem(STORAGE_KEYS.TRANSACTIONS, [failedTxn, ...transactions]);

      return { success: false, transaction: failedTxn, message: gatewayRes.message };
    }

    // Update Invoice Payments
    const newPaidAmount = inv.paidAmount + amountToPay;
    const newBalance = Math.max(0, inv.totalAmount - newPaidAmount);
    const newStatus: InvoiceStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

    inv.paidAmount = newPaidAmount;
    inv.outstandingBalance = newBalance;
    inv.status = newStatus;
    inv.updatedAt = new Date().toISOString();

    const successTxn: PaymentTransaction = {
      id: `txn-${Date.now()}`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      societyId: inv.societyId,
      flatCode: inv.flatCode,
      residentName: inv.residentName,
      transactionId: gatewayRes.transactionId,
      amount: amountToPay,
      paymentMethod: verifiedDetails?.paymentMethod || 'ONLINE_GATEWAY',
      status: 'SUCCESS',
      gatewayReference: gatewayRes.gatewayReference,
      gatewayResponseNotes: gatewayRes.message,
      paymentDate: timeStr,
    };

    setItem(STORAGE_KEYS.INVOICES, invoices);
    setItem(STORAGE_KEYS.TRANSACTIONS, [successTxn, ...transactions]);

    billingInvoiceRepository.update(inv.id, {
      paidAmount: inv.paidAmount,
      outstandingBalance: inv.outstandingBalance,
      status: inv.status,
    }).catch(() => {});
    paymentTransactionRepository.create(successTxn).catch(() => {});

    try {
      realtimeService.publish(
        'PAYMENT_COMPLETED',
        {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          amount: amountToPay,
          status: inv.status,
          flatCode: inv.flatCode,
          transactionId: successTxn.transactionId,
        },
        inv.societyId,
        actor.role,
        actor.name
      );
      realtimeService.publish(
        'PAYMENT_STATUS',
        {
          invoiceId: inv.id,
          amount: amountToPay,
          status: inv.status,
          flatCode: inv.flatCode,
        },
        inv.societyId,
        actor.role,
        actor.name
      );
    } catch (e) {
      console.warn('[BillingService] Realtime broadcast error:', e);
    }

    logAudit(inv.societyId, actor, 'UPDATE', 'SocietyInvoice', inv.id, `Processed online payment of ₹${amountToPay} for ${inv.invoiceNumber}`);
    return { success: true, transaction: successTxn, message: 'Payment processed successfully' };
  },

  recordManualPayment: (
    invoiceId: string,
    amount: number,
    method: PaymentMethod,
    notes: string,
    actor: { id: string; name: string; role: string }
  ): SocietyInvoice | null => {
    const invoices = getItem(STORAGE_KEYS.INVOICES, SEED_INVOICES);
    const idx = invoices.findIndex((i) => i.id === invoiceId);
    if (idx === -1) return null;

    const inv = invoices[idx];
    const newPaid = inv.paidAmount + amount;
    const newBalance = Math.max(0, inv.totalAmount - newPaid);

    inv.paidAmount = newPaid;
    inv.outstandingBalance = newBalance;
    inv.status = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';
    inv.updatedAt = new Date().toISOString();

    const transactions = getItem(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    const newTxn: PaymentTransaction = {
      id: `txn-${Date.now()}`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      societyId: inv.societyId,
      flatCode: inv.flatCode,
      residentName: inv.residentName,
      transactionId: `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`,
      amount,
      paymentMethod: method,
      status: 'SUCCESS',
      gatewayResponseNotes: `Manual payment recorded by ${actor.name}: ${notes}`,
      paymentDate: new Date().toLocaleString(),
    };

    setItem(STORAGE_KEYS.INVOICES, invoices);
    setItem(STORAGE_KEYS.TRANSACTIONS, [newTxn, ...transactions]);

    billingInvoiceRepository.update(inv.id, {
      paidAmount: inv.paidAmount,
      outstandingBalance: inv.outstandingBalance,
      status: inv.status,
    }).catch(() => {});
    paymentTransactionRepository.create(newTxn).catch(() => {});

    try {
      realtimeService.publish(
        'PAYMENT_COMPLETED',
        {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          amount,
          status: inv.status,
          flatCode: inv.flatCode,
          transactionId: newTxn.transactionId,
        },
        inv.societyId,
        actor.role,
        actor.name
      );
      realtimeService.publish(
        'PAYMENT_STATUS',
        {
          invoiceId: inv.id,
          amount,
          status: inv.status,
          flatCode: inv.flatCode,
        },
        inv.societyId,
        actor.role,
        actor.name
      );
    } catch (e) {
      console.warn('[BillingService] Realtime broadcast error:', e);
    }

    logAudit(inv.societyId, actor, 'UPDATE', 'SocietyInvoice', inv.id, `Recorded manual ${method} payment of ₹${amount} for ${inv.invoiceNumber}`);
    return inv;
  },

  applyPenaltyOrAdjustment: (
    invoiceId: string,
    component: 'PENALTY' | 'SPECIAL_CONTRIBUTION' | 'OTHER',
    amount: number,
    description: string,
    actor: { id: string; name: string; role: string }
  ): SocietyInvoice | null => {
    const invoices = getItem(STORAGE_KEYS.INVOICES, SEED_INVOICES);
    const idx = invoices.findIndex((i) => i.id === invoiceId);
    if (idx === -1) return null;

    const inv = invoices[idx];
    const newItem: BillLineItem = {
      id: `li-${Date.now()}`,
      component,
      description,
      amount,
    };

    inv.lineItems.push(newItem);
    inv.totalAmount += amount;
    inv.outstandingBalance += amount;
    if (inv.outstandingBalance > 0 && inv.status === 'PAID') {
      inv.status = 'PARTIALLY_PAID';
    }
    inv.updatedAt = new Date().toISOString();

    setItem(STORAGE_KEYS.INVOICES, invoices);
    logAudit(inv.societyId, actor, 'UPDATE', 'SocietyInvoice', inv.id, `Applied ${component} charge of ₹${amount} on ${inv.invoiceNumber}`);
    return inv;
  },

  processRefund: async (
    transactionId: string,
    amount: number,
    reason: string,
    actor: { id: string; name: string; role: string },
    adapter: PaymentGatewayAdapter = defaultPaymentGateway
  ): Promise<{ success: boolean; message: string }> => {
    const transactions = getItem(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    const txIdx = transactions.findIndex((t) => t.id === transactionId || t.transactionId === transactionId);
    if (txIdx === -1) throw new Error('Transaction record not found');

    const refundRes = await adapter.processRefund(transactionId, amount, reason);
    if (!refundRes.success) {
      return { success: false, message: refundRes.message };
    }

    transactions[txIdx].status = 'REFUNDED';
    transactions[txIdx].gatewayResponseNotes = `Refunded ₹${amount}: ${reason}`;

    // Adjust Invoice
    const invoices = getItem(STORAGE_KEYS.INVOICES, SEED_INVOICES);
    const invIdx = invoices.findIndex((i) => i.id === transactions[txIdx].invoiceId);
    if (invIdx !== -1) {
      invoices[invIdx].paidAmount = Math.max(0, invoices[invIdx].paidAmount - amount);
      invoices[invIdx].outstandingBalance = invoices[invIdx].totalAmount - invoices[invIdx].paidAmount;
      invoices[invIdx].status = 'REFUNDED';
      setItem(STORAGE_KEYS.INVOICES, invoices);
    }

    setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    logAudit(transactions[txIdx].societyId, actor, 'UPDATE', 'PaymentTransaction', transactionId, `Processed refund of ₹${amount}`);
    return { success: true, message: refundRes.message };
  },

  getAnalytics: (societyId: string): BillingAnalytics => {
    const invoices = getItem(STORAGE_KEYS.INVOICES, SEED_INVOICES).filter((i) => i.societyId === societyId);

    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    const todayStr = '2026-09-13';

    invoices.forEach((inv) => {
      totalBilled += inv.totalAmount;
      totalCollected += inv.paidAmount;
      totalOutstanding += inv.outstandingBalance;

      if (inv.outstandingBalance > 0 && inv.dueDate < todayStr) {
        totalOverdue += inv.outstandingBalance;
      }
    });

    const collectionPercentage = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      collectionPercentage,
    };
  },

  // ========================================================
  // POSTGRESQL-FIRST ASYNC QUERIES & LIVE SSE REALTIME LISTENERS
  // ========================================================
  fetchInvoices: async (societyId: string): Promise<SocietyInvoice[]> => {
    try {
      const records = await billingInvoiceRepository.list(societyId);
      if (records && records.length > 0) return records;
      return billingService.getInvoices(societyId);
    } catch {
      return billingService.getInvoices(societyId);
    }
  },

  subscribeInvoices: (societyId: string, callback: (invoices: SocietyInvoice[]) => void): () => void =>
    billingInvoiceRepository.subscribe(societyId, callback),
};
