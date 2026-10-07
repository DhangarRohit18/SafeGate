import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  FileText,
  Paperclip,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  PieChart as PieChartIcon,
  Calendar,
  Layers,
  Edit,
  ArrowLeft,
} from 'lucide-react';
import { societyExpenseEngine } from '../services/societyExpenseEngine';
import { ExpenseOverviewKpis } from './ExpenseOverviewKpis';
import { ExpenseModals } from './ExpenseModals';
import type {
  SocietyExpense,
  Budget,
  ExpenseCategory,
  ExpenseStatus,
  ExpenseSummary,
  VendorInvoice,
} from '../types';
import { DataTable } from '../../../components/ui/DataTable';
import { MobileDataCard } from '../../../components/ui/MobileDataCard';

interface SocietyExpenseHubProps {
  userRole?: 'SOCIETY_ADMIN' | 'COMMITTEE_MEMBER' | 'FACILITY_MANAGER' | 'SUPER_ADMIN';
}

export const SocietyExpenseHub: React.FC<SocietyExpenseHubProps> = ({
  userRole = 'SOCIETY_ADMIN',
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EXPENSES' | 'BUDGET' | 'ANALYTICS'>('OVERVIEW');
  const [expenses, setExpenses] = useState<SocietyExpense[]>([]);
  const [budget, setBudget] = useState<Budget | undefined>(undefined);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ExpenseStatus | 'ALL'>('ALL');

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<VendorInvoice | null>(null);

  // Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('utilities');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [expenseVendor, setExpenseVendor] = useState('');

  // Invoice Form State
  const [attachInvoice, setAttachInvoice] = useState(false);
  const [invoiceNum, setInvoiceNum] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');

  // Budget Edit Form State
  const [budgetCategories, setBudgetCategories] = useState<
    { category: ExpenseCategory; allocatedAmount: number }[]
  >([
    { category: 'utilities', allocatedAmount: 160000 },
    { category: 'staff', allocatedAmount: 120000 },
    { category: 'maintenance', allocatedAmount: 50000 },
    { category: 'repair', allocatedAmount: 30000 },
    { category: 'AMC', allocatedAmount: 90000 },
    { category: 'security', allocatedAmount: 185000 },
    { category: 'events', allocatedAmount: 25000 },
    { category: 'cleaning', allocatedAmount: 25000 },
    { category: 'other', allocatedAmount: 15000 },
  ]);

  const refreshData = () => {
    const list = societyExpenseEngine.getExpenses({
      category: selectedCategory,
      status: selectedStatus,
      searchQuery,
    });
    setExpenses(list);
    setBudget(societyExpenseEngine.getCurrentBudget());
    setSummary(societyExpenseEngine.getExpenseSummary());
  };

  useEffect(() => {
    refreshData();
  }, [selectedCategory, selectedStatus, searchQuery]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || expenseAmount <= 0) return;

    let invoiceObj: VendorInvoice | undefined = undefined;
    if (attachInvoice && invoiceNum) {
      invoiceObj = {
        id: `inv-${Date.now()}`,
        invoiceNumber: invoiceNum,
        vendorName: expenseVendor || 'Direct Vendor',
        invoiceDate: expenseDate,
        dueDate: invoiceDueDate || expenseDate,
        amount: expenseAmount,
        documentUrl: invoiceUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      };
    }

    societyExpenseEngine.createExpense({
      societyId: 'soc-gvs',
      title: expenseTitle,
      description: expenseDesc,
      category: expenseCategory,
      amount: Number(expenseAmount),
      expenseDate: expenseDate,
      vendorName: expenseVendor,
      invoice: invoiceObj,
      status: 'PENDING_APPROVAL',
      createdBy: 'user-current',
      createdByName: userRole === 'COMMITTEE_MEMBER' ? 'Committee Member' : 'Mayuri Udar (Admin)',
    });

    setIsExpenseModalOpen(false);
    resetExpenseForm();
    refreshData();
  };

  const resetExpenseForm = () => {
    setExpenseTitle('');
    setExpenseDesc('');
    setExpenseCategory('utilities');
    setExpenseAmount(0);
    setExpenseVendor('');
    setAttachInvoice(false);
    setInvoiceNum('');
    setInvoiceDueDate('');
    setInvoiceUrl('');
  };

  const handleApproveExpense = (id: string, isApproved: boolean) => {
    societyExpenseEngine.approveExpense(
      id,
      'committee-user',
      'Rajesh Kumar (Treasurer)',
      isApproved ? 'APPROVED' : 'REJECTED'
    );
    refreshData();
  };

  const handleMarkPaid = (id: string) => {
    const ref = prompt('Enter payment transaction reference (e.g. UPI/NEFT ID):', 'NEFT/2026/BANK-882');
    if (ref) {
      societyExpenseEngine.markExpensePaid(id, ref);
      refreshData();
    }
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    societyExpenseEngine.saveBudget({
      societyId: 'soc-gvs',
      title: 'September 2026 Revised Budget',
      fiscalYear: '2026-2027',
      period: 'MONTHLY',
      month: '2026-09',
      totalAllocated: budgetCategories.reduce((a, b) => a + Number(b.allocatedAmount || 0), 0),
      categories: budgetCategories,
      status: 'APPROVED',
      createdBy: 'committee-user',
      createdByName: 'Rajesh Kumar (Treasurer)',
    });
    setIsBudgetModalOpen(false);
    refreshData();
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
      amt
    );
  };

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* ── Subheader Bar matching Residents, Domestic Help, Parking & Vendors tabs ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1rem 0.75rem',
          background: 'var(--aarizo-card-blue, #F4FAFE)',
          borderBottom: '1px solid var(--aarizo-border, #DCE8EF)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <button
            onClick={() => window.history.back()}
            aria-label="Back"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#ffffff',
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
              Society Expenses &amp; Budget
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
              Green Valley Society · Track society expenditures &amp; annual budget
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {(userRole === 'COMMITTEE_MEMBER' || userRole === 'SOCIETY_ADMIN') && (
            <button
              type="button"
              onClick={() => setIsBudgetModalOpen(true)}
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
              <Edit size={14} style={{ color: 'var(--aarizo-navy, #083B56)' }} /> Configure Budget
            </button>
          )}

          {userRole !== 'COMMITTEE_MEMBER' && (
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
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
              <Plus size={15} /> Record Expense
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 space-y-5">
        {/* Overview KPI Stat Cards */}
        <ExpenseOverviewKpis
          summary={summary}
          pendingCount={expenses.filter((e) => e.status === 'PENDING_APPROVAL').length}
          formatCurrency={formatCurrency}
        />

        {/* Sub-Tab Navigation Bar - Integrated Segmented Control Container */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #DCE8EF',
            borderRadius: '16px',
            padding: '0.4rem',
            boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: 'OVERVIEW', label: 'Budget vs Actual', icon: PieChartIcon },
              { key: 'EXPENSES', label: 'Expense Audit', icon: FileText },
              { key: 'BUDGET', label: 'Breakdown', icon: Layers },
              { key: 'ANALYTICS', label: 'Analytics', icon: TrendingUp },
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

        {/* TAB 1: OVERVIEW & VARIANCE */}
        {activeTab === 'OVERVIEW' && summary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem', boxShadow: '0 2px 8px rgba(8,59,86,0.03)' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#083B56', margin: '0 0 0.875rem' }}>
                Category-Wise Budget vs Actual Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {summary.categoryBreakdown.map((item) => {
                  const percent = item.budgeted > 0 ? Math.min(Math.round((item.actual / item.budgeted) * 100), 100) : 0;
                  const isOver = item.variance < 0;

                  return (
                    <div
                      key={item.category}
                      style={{
                        background: '#F7FBFE',
                        borderRadius: '12px',
                        border: '1px solid #DCE8EF',
                        padding: '0.75rem 0.875rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#083B56', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {item.category}
                          </span>
                          {isOver && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#DC2626', background: '#FEF2F2', padding: '0.1rem 0.4rem', borderRadius: '6px', border: '1px solid #FECACA' }}>
                              OVER BUDGET
                            </span>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#083B56' }}>{formatCurrency(item.actual)}</span>
                          <span style={{ fontSize: '0.72rem', color: '#657785', marginLeft: '0.25rem', fontWeight: 600 }}>/ {formatCurrency(item.budgeted)}</span>
                        </div>
                      </div>

                      {/* Progress Track */}
                      <div style={{ width: '100%', height: '8px', background: '#EAF6FC', borderRadius: '9999px', overflow: 'hidden', margin: '0.35rem 0', border: '1px solid #DCE8EF' }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: '9999px',
                            width: `${percent}%`,
                            background: isOver ? '#DC2626' : percent > 85 ? '#F06543' : '#059669',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', marginTop: '0.25rem' }}>
                        <span style={{ color: '#657785', fontWeight: 600 }}>Utilized: {percent}%</span>
                        <span style={{ fontWeight: 800, color: isOver ? '#DC2626' : '#059669' }}>
                          Variance: {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPENSES AUDIT LIST */}
        {activeTab === 'EXPENSES' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col md:flex-row gap-3 justify-between items-center">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search expense, vendor, invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.35rem' }}
                  className="w-full pr-3 py-2 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs text-[#083B56] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543]"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="bg-white border border-[#DCE8EF] rounded-xl px-3 py-2 text-xs font-extrabold text-[#083B56] cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="utilities">Utilities</option>
                  <option value="staff">Staff</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="repair">Repair</option>
                  <option value="AMC">AMC</option>
                  <option value="security">Security</option>
                  <option value="events">Events</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="bg-white border border-[#DCE8EF] rounded-xl px-3 py-2 text-xs font-extrabold text-[#083B56] cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PAID">Paid</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

          {/* Expense Items List / Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <DataTable
              columns={[
                {
                  key: 'title',
                  header: 'Expense Record',
                  render: (item: SocietyExpense) => (
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar size={12} /> {item.expenseDate} • Created by {item.createdByName}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'category',
                  header: 'Category',
                  render: (item: SocietyExpense) => (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category}
                    </span>
                  )
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  render: (item: SocietyExpense) => (
                    <div className="font-bold text-slate-900 text-sm">{formatCurrency(item.amount)}</div>
                  )
                },
                {
                  key: 'vendor',
                  header: 'Vendor / Invoice',
                  render: (item: SocietyExpense) => (
                    <div>
                      <div className="font-semibold text-slate-800">{item.vendorName || 'Internal'}</div>
                      {item.invoice ? (
                        <button
                          onClick={() => {
                            setActiveInvoice(item.invoice!);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="mt-1 text-[11px] text-[#176B91] font-semibold flex items-center gap-1 hover:underline"
                        >
                          <Paperclip size={12} /> #{item.invoice.invoiceNumber}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">No invoice attached</span>
                      )}
                    </div>
                  )
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (item: SocietyExpense) => (
                    <div>
                      {item.status === 'PAID' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                          <CheckCircle size={12} /> PAID
                        </span>
                      )}
                      {item.status === 'APPROVED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EAF6FC] text-[#083B56] border border-[#DCE8EF] flex items-center gap-1 w-max">
                          <CheckCircle size={12} /> APPROVED
                        </span>
                      )}
                      {item.status === 'PENDING_APPROVAL' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-max">
                          <AlertTriangle size={12} /> PENDING
                        </span>
                      )}
                      {item.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-max">
                          <XCircle size={12} /> REJECTED
                        </span>
                      )}
                    </div>
                  )
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (item: SocietyExpense) => (
                    <div className="text-right space-x-1.5">
                      {item.status === 'PENDING_APPROVAL' &&
                        (userRole === 'COMMITTEE_MEMBER' || userRole === 'SOCIETY_ADMIN') && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveExpense(item.id, true)}
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
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveExpense(item.id, false)}
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
                              Reject
                            </button>
                          </>
                        )}

                      {item.status === 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(item.id)}
                          style={{
                            background: '#083B56',
                            color: '#ffffff',
                            fontWeight: 800,
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                          }}
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  )
                }
              ]}
              data={expenses}
              keyExtractor={(item: SocietyExpense) => item.id}
              pageSize={10}
              mobileRender={(item: SocietyExpense) => (
                <MobileDataCard
                  title={item.title}
                  subtitle={`${formatCurrency(item.amount)} • ${item.category} • ${item.expenseDate}`}
                  status={
                    item.status === 'PAID' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        PAID
                      </span>
                    ) : item.status === 'APPROVED' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EAF6FC] text-[#083B56] border border-[#DCE8EF]">
                        APPROVED
                      </span>
                    ) : item.status === 'PENDING_APPROVAL' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                        PENDING
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                        REJECTED
                      </span>
                    )
                  }
                  attributes={[
                    { label: 'Description', value: item.description },
                    { label: 'Vendor', value: item.vendorName || 'Internal' },
                    { label: 'Created By', value: item.createdByName }
                  ]}
                  actions={
                    <div className="flex flex-wrap gap-2 w-full mt-2">
                      {item.invoice && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveInvoice(item.invoice!);
                            setIsInvoiceModalOpen(true);
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
                          }}
                        >
                          View Invoice #{item.invoice.invoiceNumber}
                        </button>
                      )}
                      {item.status === 'PENDING_APPROVAL' &&
                        (userRole === 'COMMITTEE_MEMBER' || userRole === 'SOCIETY_ADMIN') && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveExpense(item.id, true)}
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
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveExpense(item.id, false)}
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
                              Reject
                            </button>
                          </>
                        )}
                      {item.status === 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(item.id)}
                          style={{
                            width: '100%',
                            padding: '0.45rem 0.75rem',
                            background: '#083B56',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  }
                />
              )}
            />
          </div>
        </div>
      )}

      {/* TAB 3: BUDGET BREAKDOWN */}
      {activeTab === 'BUDGET' && budget && (
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#DCE8EF] shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DCE8EF] min-w-0">
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-[#083B56] leading-tight">{budget.title}</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Period: {budget.month} • Total Allocation: {formatCurrency(budget.totalAllocated)}
              </p>
            </div>
            <span className="px-3 py-1 bg-[#ECFDF5] text-[#059669] rounded-full font-extrabold text-xs border border-[#A7F3D0] shrink-0">
              Status: {budget.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {budget.categories.map((c) => {
              const matchingCategory = summary?.categoryBreakdown.find((cb) => cb.category.toUpperCase() === c.category.toUpperCase() || cb.category.toLowerCase().includes(c.category.toLowerCase()));
              const actual = matchingCategory ? matchingCategory.actual : 0;
              const percent = c.allocatedAmount > 0 ? Math.min(Math.round((actual / c.allocatedAmount) * 100), 100) : 0;
              const isOver = actual > c.allocatedAmount;

              return (
                <div key={c.category} className="p-4 bg-[#F7FBFE] rounded-xl border border-[#DCE8EF] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#083B56] uppercase tracking-wider">{c.category}</span>
                    {isOver && (
                      <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        OVER
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between">
                    <h4 className="text-lg font-extrabold text-[#083B56]">{formatCurrency(c.allocatedAmount)}</h4>
                    <span className="text-xs font-bold text-slate-500">Spent: {formatCurrency(actual)}</span>
                  </div>

                  <div className="w-full h-2 bg-[#EAF6FC] rounded-full overflow-hidden border border-[#DCE8EF]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percent}%`,
                        background: isOver ? '#DC2626' : percent > 85 ? '#F06543' : '#059669',
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-[#DCE8EF]">{c.notes || 'Routine society allocation'}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: VENDOR & MONTHLY ANALYTICS */}
      {activeTab === 'ANALYTICS' && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#DCE8EF] shadow-2xs space-y-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between min-w-0 pb-3 border-b border-[#DCE8EF] gap-2">
              <h2 className="text-base font-extrabold text-[#083B56] leading-tight">Vendor Payout Ranking</h2>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#EAF6FC] text-[#083B56] border border-[#DCE8EF] shrink-0">
                Top Suppliers
              </span>
            </div>
            <div className="space-y-3">
              {summary.vendorSpending.map((v, idx) => (
                <div key={v.vendorName} className="flex items-center justify-between p-3.5 bg-[#F7FBFE] rounded-xl border border-[#DCE8EF] gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span style={{ width: 26, height: 26, borderRadius: '50%', background: idx === 0 ? '#FEF9E7' : '#EAF6FC', border: idx === 0 ? '1px solid #FDE68A' : '1px solid #DCE8EF', color: idx === 0 ? '#D97706' : '#083B56', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-[#083B56] truncate">{v.vendorName}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">{v.count} invoice(s) processed</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#F06543] shrink-0">{formatCurrency(v.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#DCE8EF] shadow-2xs space-y-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between min-w-0 pb-3 border-b border-[#DCE8EF] gap-2">
              <h2 className="text-base font-extrabold text-[#083B56] leading-tight">Monthly Expenditure History</h2>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#EAF6FC] text-[#083B56] border border-[#DCE8EF] shrink-0">
                Fiscal Records
              </span>
            </div>
            <div className="space-y-3">
              {summary.monthlySpending.map((m) => (
                <div key={m.month} className="flex items-center justify-between p-3.5 bg-[#F7FBFE] rounded-xl border border-[#DCE8EF]">
                  <div className="flex items-center gap-2.5">
                    <div style={{ width: 30, height: 30, borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F06543', flexShrink: 0 }}>
                      <Calendar size={15} />
                    </div>
                    <span className="text-xs font-extrabold text-[#083B56]">{m.month}</span>
                  </div>
                  <span className="text-xs font-extrabold text-[#083B56]">{formatCurrency(m.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Expense Modals */}
      <ExpenseModals
        isExpenseModalOpen={isExpenseModalOpen}
        setIsExpenseModalOpen={setIsExpenseModalOpen}
        handleCreateExpense={handleCreateExpense}
        expenseTitle={expenseTitle}
        setExpenseTitle={setExpenseTitle}
        expenseCategory={expenseCategory}
        setExpenseCategory={setExpenseCategory}
        expenseAmount={expenseAmount}
        setExpenseAmount={setExpenseAmount}
        expenseDate={expenseDate}
        setExpenseDate={setExpenseDate}
        expenseVendor={expenseVendor}
        setExpenseVendor={setExpenseVendor}
        expenseDesc={expenseDesc}
        setExpenseDesc={setExpenseDesc}
        expenseHasInvoice={attachInvoice}
        setExpenseHasInvoice={setAttachInvoice}
        invoiceNumber={invoiceNum}
        setInvoiceNumber={setInvoiceNum}
        invoiceDocUrl={invoiceUrl}
        setInvoiceDocUrl={setInvoiceUrl}
        isInvoiceModalOpen={isInvoiceModalOpen}
        setIsInvoiceModalOpen={setIsInvoiceModalOpen}
        activeInvoice={activeInvoice}
        formatCurrency={formatCurrency}
        isBudgetModalOpen={isBudgetModalOpen}
        setIsBudgetModalOpen={setIsBudgetModalOpen}
        budgetCategories={budgetCategories}
        setBudgetCategories={setBudgetCategories}
        handleSaveBudget={handleSaveBudget}
      />
    </div>
  );
};
