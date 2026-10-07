import { CheckCircle2 } from 'lucide-react';
import type { AssetItem, AssetCategory } from '../types';
import { FileUpload } from '../../../components/ui/FileUpload';
import { Modal } from '../../../components/ui/Modal';

interface AssetModalsProps {
  modalMode: 'ADD' | 'INSPECT' | 'RENEW' | 'AUDIT' | null;
  setModalMode: (mode: 'ADD' | 'INSPECT' | 'RENEW' | 'AUDIT' | null) => void;
  activeAssetForModal: AssetItem | null;
  addForm: {
    name: string;
    assetCode: string;
    category: AssetCategory;
    location: string;
    vendorName: string;
    vendorContact: string;
    amcStartDate: string;
    amcExpiryDate: string;
    insuranceExpiryDate: string;
    certificateExpiryDate: string;
    inspectionScheduleFrequencyDays: number;
  };
  setAddForm: React.Dispatch<React.SetStateAction<any>>;
  handleAddSubmit: (e: React.FormEvent) => void;
  inspectForm: {
    result: 'PASSED' | 'FAILED' | 'NEEDS_ATTENTION';
    notes: string;
    proofUrl: string;
  };
  setInspectForm: React.Dispatch<React.SetStateAction<any>>;
  handleInspectSubmit: (e: React.FormEvent) => void;
  renewForm: {
    renewalType: 'AMC' | 'INSURANCE' | 'CERTIFICATE';
    newExpiryDate: string;
    vendorName: string;
    cost: number;
    documentUrl: string;
    notes: string;
  };
  setRenewForm: React.Dispatch<React.SetStateAction<any>>;
  handleRenewSubmit: (e: React.FormEvent) => void;
}

export const AssetModals: React.FC<AssetModalsProps> = ({
  modalMode,
  setModalMode,
  activeAssetForModal,
  addForm,
  setAddForm,
  handleAddSubmit,
  inspectForm,
  setInspectForm,
  handleInspectSubmit,
  renewForm,
  setRenewForm,
  handleRenewSubmit,
}) => {
  if (!modalMode) return null;

  return (
    <>
      {/* Add Asset Modal */}
      <Modal
        isOpen={modalMode === 'ADD'}
        onClose={() => setModalMode(null)}
        title="Register New Asset"
        subtitle="Add infrastructure equipment or amenity to society compliance registry"
        maxWidth="520px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('add-asset-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2.5 text-white text-xs font-extrabold rounded-xl shadow-md bg-[#F06543]"
            >
              Save &amp; Register
            </button>
          </div>
        }
      >
        <form id="add-asset-form" onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Asset Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Tower B Lift 2"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Asset Code</label>
              <input
                type="text"
                required
                placeholder="AST-LIFT-B2"
                value={addForm.assetCode}
                onChange={(e) => setAddForm({ ...addForm, assetCode: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Category</label>
              <select
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value as AssetCategory })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs bg-white font-bold text-slate-800"
              >
                <option value="LIFT">Lift</option>
                <option value="GENERATOR">Generator</option>
                <option value="PUMP">Pump</option>
                <option value="CCTV">CCTV</option>
                <option value="FIRE_SYSTEM">Fire System</option>
                <option value="SWIMMING_POOL">Swimming Pool</option>
                <option value="GYM_EQUIPMENT">Gym Equipment</option>
                <option value="ELECTRICAL_EQUIPMENT">Electrical Equipment</option>
                <option value="WATER_SYSTEMS">Water Systems</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Location</label>
            <input
              type="text"
              required
              placeholder="e.g. Clubhouse Floor 1"
              value={addForm.location}
              onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
              className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Vendor Name</label>
              <input
                type="text"
                placeholder="Vendor / AMC Provider"
                value={addForm.vendorName}
                onChange={(e) => setAddForm({ ...addForm, vendorName: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Vendor Contact</label>
              <input
                type="text"
                placeholder="+91 98765 00000"
                value={addForm.vendorContact}
                onChange={(e) => setAddForm({ ...addForm, vendorContact: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">AMC Expiry</label>
              <input
                type="date"
                required
                value={addForm.amcExpiryDate}
                onChange={(e) => setAddForm({ ...addForm, amcExpiryDate: e.target.value })}
                className="w-full px-2 py-2 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Insurance Expiry</label>
              <input
                type="date"
                required
                value={addForm.insuranceExpiryDate}
                onChange={(e) => setAddForm({ ...addForm, insuranceExpiryDate: e.target.value })}
                className="w-full px-2 py-2 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Cert Expiry</label>
              <input
                type="date"
                required
                value={addForm.certificateExpiryDate}
                onChange={(e) => setAddForm({ ...addForm, certificateExpiryDate: e.target.value })}
                className="w-full px-2 py-2 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Record Inspection Modal */}
      <Modal
        isOpen={modalMode === 'INSPECT' && !!activeAssetForModal}
        onClose={() => setModalMode(null)}
        title="Record Maintenance Inspection"
        subtitle={activeAssetForModal ? `Recording inspection for ${activeAssetForModal.name} (${activeAssetForModal.assetCode})` : ''}
        maxWidth="480px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('inspect-asset-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-extrabold rounded-xl shadow-md"
            >
              Submit Inspection
            </button>
          </div>
        }
      >
        <form id="inspect-asset-form" onSubmit={handleInspectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Inspection Outcome</label>
            <select
              value={inspectForm.result}
              onChange={(e) => setInspectForm({ ...inspectForm, result: e.target.value as any })}
              className="w-full px-3.5 py-2.5 border rounded-xl text-xs bg-white font-bold text-slate-800"
            >
              <option value="PASSED">PASSED (All systems healthy)</option>
              <option value="NEEDS_ATTENTION">NEEDS ATTENTION (Minor observations)</option>
              <option value="FAILED">FAILED (Non-compliant / Repair needed)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Inspector Notes</label>
            <textarea
              required
              rows={3}
              placeholder="Record servicing details, replaced parts, pressure levels..."
              value={inspectForm.notes}
              onChange={(e) => setInspectForm({ ...inspectForm, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium text-slate-900"
            />
          </div>

          <div>
            <FileUpload
              category="tickets"
              label="Upload Inspection Proof / Servicing Photo"
              onUploadSuccess={(url) => setInspectForm({ ...inspectForm, proofUrl: url })}
            />
            {inspectForm.proofUrl && (
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 size={13} /> Inspection Proof Attached
              </p>
            )}
          </div>
        </form>
      </Modal>

      {/* Renew AMC Modal */}
      <Modal
        isOpen={modalMode === 'RENEW' && !!activeAssetForModal}
        onClose={() => setModalMode(null)}
        title="Renew AMC / Insurance / Certificate"
        subtitle={activeAssetForModal ? `Renewing contracts for ${activeAssetForModal.name}` : ''}
        maxWidth="480px"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('renew-asset-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2.5 text-white text-xs font-extrabold rounded-xl shadow-md bg-[#F06543]"
            >
              Save &amp; Renew
            </button>
          </div>
        }
      >
        <form id="renew-asset-form" onSubmit={handleRenewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Renewal Target</label>
            <select
              value={renewForm.renewalType}
              onChange={(e) => setRenewForm({ ...renewForm, renewalType: e.target.value as any })}
              className="w-full px-3.5 py-2.5 border rounded-xl text-xs bg-white font-bold text-slate-800"
            >
              <option value="AMC">AMC Contract</option>
              <option value="INSURANCE">Asset Insurance Policy</option>
              <option value="CERTIFICATE">Government Safety Certificate</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">New Expiry Date</label>
            <input
              type="date"
              required
              value={renewForm.newExpiryDate}
              onChange={(e) => setRenewForm({ ...renewForm, newExpiryDate: e.target.value })}
              className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Contractor / Vendor Name</label>
            <input
              type="text"
              placeholder="Vendor Name"
              value={renewForm.vendorName}
              onChange={(e) => setRenewForm({ ...renewForm, vendorName: e.target.value })}
              className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Cost (₹)</label>
              <input
                type="number"
                placeholder="45000"
                value={renewForm.cost}
                onChange={(e) => setRenewForm({ ...renewForm, cost: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <FileUpload
                category="kyc"
                label="Upload Signed AMC Contract PDF"
                onUploadSuccess={(url) => setRenewForm({ ...renewForm, documentUrl: url })}
              />
              {renewForm.documentUrl && (
                <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Contract PDF Attached
                </p>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Audit History Modal */}
      <Modal
        isOpen={modalMode === 'AUDIT' && !!activeAssetForModal}
        onClose={() => setModalMode(null)}
        title="Asset Audit History"
        subtitle={activeAssetForModal ? `${activeAssetForModal.name} (${activeAssetForModal.assetCode})` : ''}
        maxWidth="540px"
        footer={
          <button
            onClick={() => setModalMode(null)}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
          >
            Close
          </button>
        }
      >
        {activeAssetForModal && (
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Immutable Change Logs</h4>
            <div className="space-y-2">
              {activeAssetForModal.auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <strong className="text-[#083B56] font-semibold">{log.action}</strong>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-800">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</p>
                  <div className="text-[11px] text-slate-400">Performed by: {log.performedBy} ({log.performedRole})</div>
                </div>
              ))}
            </div>

            {activeAssetForModal.inspections.length > 0 && (
              <>
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider pt-2">Recent Inspections</h4>
                <div className="space-y-2">
                  {activeAssetForModal.inspections.map((insp) => (
                    <div key={insp.id} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className={insp.result === 'PASSED' ? 'text-emerald-700' : 'text-rose-700'}>
                          Result: {insp.result}
                        </span>
                        <span className="text-slate-400">{insp.inspectionDate}</span>
                      </div>
                      <p className="text-slate-700">{insp.notes}</p>
                      <div className="text-[11px] text-slate-400">Inspector: {insp.inspectorName}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

