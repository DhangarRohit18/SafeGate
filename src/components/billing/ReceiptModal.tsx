import React from 'react';
import { Printer, CheckCircle, Shield, FileText } from 'lucide-react';
import type { SocietyInvoice, PaymentTransaction } from '../../types/billing';
import { Modal } from '../ui/Modal';

interface ReceiptModalProps {
  invoice: SocietyInvoice;
  transaction?: PaymentTransaction;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ invoice, transaction, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Official Payment Receipt & Tax Invoice"
      subtitle={`Invoice #${invoice.invoiceNumber}`}
      maxWidth="640px"
      icon={<FileText className="w-5 h-5" />}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F06543] hover:bg-[#d85434] text-white shadow-md transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </>
      }
    >
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-5">
        <div className="flex items-start justify-between border-b pb-4 border-slate-200">
          <div>
            <div className="flex items-center gap-2 font-black text-base text-[#083B56] uppercase tracking-wide">
              <Shield className="w-5 h-5 text-[#F06543]" /> Grand Vista Towers RWA
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Plot 14, Sector 5, Palm Beach Rd, Navi Mumbai 400706
            </div>
            <div className="text-xs text-slate-500">Reg No: RWA/MH/2022/88190</div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
              RECEIPT ISSUED
            </span>
            <div className="text-xs font-semibold text-slate-700 mt-2">
              Date: {transaction?.paymentDate || new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Billed To Resident:</span>
            <div className="font-bold text-slate-900 mt-0.5">{invoice.residentName}</div>
            <div className="text-slate-600">Flat Code: {invoice.flatCode}</div>
          </div>
          <div className="text-right">
            <span className="text-slate-500 font-medium">Invoice Reference:</span>
            <div className="font-bold text-slate-900 mt-0.5">{invoice.invoiceNumber}</div>
            <div className="text-slate-600">
              Txn ID: {transaction?.transactionId || 'N/A'}
            </div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Component</th>
                <th className="p-2.5">Description</th>
                <th className="p-2.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {invoice.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="p-2.5 font-semibold text-[#083B56]">{item.component}</td>
                  <td className="p-2.5">{item.description}</td>
                  <td className="p-2.5 text-right font-medium">₹{item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-end space-y-1.5 text-xs pt-2 border-t border-slate-200">
          <div className="flex justify-between w-48 text-slate-600">
            <span>Total Billed:</span>
            <span>₹{invoice.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between w-48 font-bold text-emerald-600 text-sm">
            <span>Paid Amount:</span>
            <span>₹{invoice.paidAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between w-48 text-rose-600 font-semibold">
            <span>Balance Remaining:</span>
            <span>₹{invoice.outstandingBalance.toLocaleString()}</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle className="w-4 h-4" /> Payment verified by Gateway Adapter
          </div>
          <div>Computer generated receipt — no signature required.</div>
        </div>
      </div>
    </Modal>
  );
};

