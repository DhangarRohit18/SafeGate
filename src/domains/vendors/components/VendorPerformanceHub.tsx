import React, { useState, useEffect } from 'react';
import {
  Star,
  AlertCircle,
  CheckCircle,
  Ban,
  Columns,
  Eye,
  EyeOff,
  Award,
  BarChart,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { vendorPerformanceEngine } from '../services/vendorPerformanceEngine';
import type { VendorScorecard, VendorStatus } from '../types';

export const VendorPerformanceHub: React.FC = () => {
  const [vendors, setVendors] = useState<VendorScorecard[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Side-by-Side Comparison State
  const [comparisonVendorIds, setComparisonVendorIds] = useState<string[]>([]);
  const [isCompareView, setIsCompareView] = useState(false);

  // Detailed Modal State
  const [activeVendor, setActiveVendor] = useState<VendorScorecard | null>(null);

  const refreshData = () => {
    const list = vendorPerformanceEngine.getVendorScorecards(selectedCategory);
    setVendors(list);
  };

  useEffect(() => {
    refreshData();
  }, [selectedCategory]);

  const handleStatusChange = (vendorId: string, status: VendorStatus) => {
    vendorPerformanceEngine.updateVendorStatus(vendorId, status);
    refreshData();
    if (activeVendor && activeVendor.vendorId === vendorId) {
      setActiveVendor(vendorPerformanceEngine.getVendorById(vendorId) || null);
    }
  };

  const handleTogglePublicVisibility = (vendorId: string, current: boolean) => {
    vendorPerformanceEngine.togglePublicRanking(vendorId, !current);
    refreshData();
    if (activeVendor && activeVendor.vendorId === vendorId) {
      setActiveVendor(vendorPerformanceEngine.getVendorById(vendorId) || null);
    }
  };

  const toggleSelectForComparison = (id: string) => {
    if (comparisonVendorIds.includes(id)) {
      setComparisonVendorIds(comparisonVendorIds.filter((vId) => vId !== id));
    } else {
      if (comparisonVendorIds.length >= 3) {
        alert('You can compare at most 3 vendors side-by-side.');
        return;
      }
      setComparisonVendorIds([...comparisonVendorIds, id]);
    }
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const comparedVendors = vendorPerformanceEngine.compareVendors(comparisonVendorIds);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
      amt
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE8EF] shadow-2xs gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base md:text-lg font-black text-[#083B56] leading-tight">Vendor Management</h2>
          </div>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Green Valley Society · Track vendor contracts, ratings &amp; performance
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {comparisonVendorIds.length > 0 && (
            <button
              onClick={() => setIsCompareView(!isCompareView)}
              className={`px-3.5 py-2 font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isCompareView
                  ? 'bg-[#083B56] text-white border-transparent'
                  : 'bg-[#F06543] text-white hover:bg-[#D85332] border-white/20'
              }`}
            >
              <Columns size={16} />
              {isCompareView ? 'Exit Comparison' : `Compare Selected (${comparisonVendorIds.length})`}
            </button>
          )}
        </div>
      </div>

      {/* SIDE-BY-SIDE COMPARISON VIEW */}
      {isCompareView && comparedVendors.length > 0 ? (
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#DCE8EF] shadow-2xs space-y-6">
          <div className="flex justify-between items-center border-b border-[#DCE8EF] pb-4">
            <div>
              <h2 className="text-base font-black text-[#083B56]">Side-by-Side Vendor Matrix</h2>
              <p className="text-xs text-slate-500">
                Comparing {comparedVendors.length} vendors based on real historical service analytics.
              </p>
            </div>
            <button
              onClick={() => setIsCompareView(false)}
              className="text-xs font-bold text-slate-500 hover:text-[#083B56] cursor-pointer"
            >
              Close Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comparedVendors.map((vendor) => (
              <div
                key={vendor.vendorId}
                className="p-5 rounded-2xl border border-[#DCE8EF] bg-[#F7FBFE] space-y-4 relative"
              >
                {vendor.status === 'PREFERRED' && (
                  <span className="absolute top-4 right-4 px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full flex items-center gap-1 border border-amber-200">
                    <Award size={12} /> PREFERRED VENDOR
                  </span>
                )}

                <div>
                  <h3 className="font-bold text-base text-[#083B56]">{vendor.vendorName}</h3>
                  <span className="text-xs text-slate-500 font-medium">{vendor.category}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#DCE8EF] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contract Rate / Price:</span>
                    <span className="font-bold text-[#083B56]">{formatCurrency(vendor.metrics.hourlyRateOrPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Overall Rating:</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <Star size={12} fill="currentColor" /> {vendor.metrics.rating} / 5.0
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SLA Compliance:</span>
                    <span className="font-bold text-emerald-600">{vendor.metrics.slaCompliancePercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg Response Time:</span>
                    <span className="font-bold text-slate-800">{vendor.metrics.averageResponseTimeMinutes} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Repeat Complaints:</span>
                    <span
                      className={`font-bold ${
                        vendor.metrics.repeatComplaintsCount > 2 ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {vendor.metrics.repeatComplaintsCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Completed Jobs:</span>
                    <span className="font-bold text-slate-900">{vendor.metrics.completedJobsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer Satisfaction:</span>
                    <span className="font-bold text-[#083B56]">{vendor.metrics.customerSatisfactionPercentage}%</span>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-2 border-t border-[#DCE8EF] flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleStatusChange(vendor.vendorId, 'PREFERRED')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                      vendor.status === 'PREFERRED'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-[#DCE8EF] text-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    Preferred
                  </button>
                  <button
                    onClick={() => handleStatusChange(vendor.vendorId, 'APPROVED')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                      vendor.status === 'APPROVED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-[#DCE8EF] text-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(vendor.vendorId, 'SUSPENDED')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                      vendor.status === 'SUSPENDED'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border border-[#DCE8EF] text-slate-700 hover:bg-rose-50'
                    }`}
                  >
                    Suspend
                  </button>
                  <button
                    onClick={() => handleStatusChange(vendor.vendorId, 'BLACKLISTED')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                      vendor.status === 'BLACKLISTED'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-[#DCE8EF] text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Blacklist
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VENDOR GRID LIST VIEW */
        <div className="space-y-4">
          {/* Controls & Search */}
          <div className="bg-white p-4 rounded-2xl border border-[#DCE8EF] shadow-2xs flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search vendor name, category, representative..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.35rem' }}
                className="w-full pr-3 py-2 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F06543]/30 focus:border-[#F06543]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Filter size={15} className="text-[#F06543] shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-[#DCE8EF] rounded-xl px-3 py-2 text-xs font-extrabold text-[#083B56] focus:outline-none focus:ring-2 focus:ring-[#F06543]/30 shrink-0 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Elevator">Elevator &amp; Lift</option>
                <option value="Security">Security Services</option>
                <option value="Plumbing">Plumbing &amp; Hydraulic</option>
              </select>
            </div>
          </div>

          {/* Vendors Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredVendors.map((vendor) => {
              const isSelected = comparisonVendorIds.includes(vendor.vendorId);
              return (
                <div
                  key={vendor.vendorId}
                  style={{
                    background: '#ffffff',
                    border: isSelected ? '2px solid var(--aarizo-coral, #F06543)' : '1px solid var(--aarizo-border, #DCE8EF)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    boxShadow: '0 2px 8px rgba(8, 59, 86, 0.03)',
                    position: 'relative',
                  }}
                  className="space-y-4 transition-all"
                >
                  {/* Top Bar */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-base text-[#083B56]">{vendor.vendorName}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{vendor.category}</p>
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectForComparison(vendor.vendorId)}
                        className="rounded text-[#F06543] focus:ring-[#F06543] w-4 h-4"
                      />
                      <span className="text-xs font-bold text-[#083B56]">Compare</span>
                    </label>
                  </div>

                  {/* Rating & Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-[#FEF9E7] px-2.5 py-1 rounded-lg border border-[#FDE68A]">
                      <Star size={14} className="text-[#D97706] fill-[#D97706]" />
                      <span className="text-xs font-extrabold text-[#B45309]">{vendor.metrics.rating}</span>
                      <span className="text-[10px] text-[#D97706] font-semibold">({vendor.metrics.completedJobsCount} jobs)</span>
                    </div>

                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                        background:
                          vendor.status === 'PREFERRED'
                            ? '#FEF9E7'
                            : vendor.status === 'APPROVED'
                            ? '#ECFDF5'
                            : vendor.status === 'SUSPENDED'
                            ? '#FFF1F2'
                            : '#F1F5F9',
                        color:
                          vendor.status === 'PREFERRED'
                            ? '#B45309'
                            : vendor.status === 'APPROVED'
                            ? '#059669'
                            : vendor.status === 'SUSPENDED'
                            ? '#E11D48'
                            : '#475569',
                        border:
                          vendor.status === 'PREFERRED'
                            ? '1px solid #FDE68A'
                            : vendor.status === 'APPROVED'
                            ? '1px solid #A7F3D0'
                            : vendor.status === 'SUSPENDED'
                            ? '1px solid #FECDD3'
                            : '1px solid #E2E8F0',
                      }}
                    >
                      {vendor.status}
                    </span>
                  </div>

                  {/* Key Metrics Grid */}
                  <div
                    style={{
                      background: 'var(--aarizo-card-blue, #F4FAFE)',
                      border: '1px solid var(--aarizo-border, #DCE8EF)',
                      borderRadius: '12px',
                      padding: '0.75rem',
                    }}
                    className="grid grid-cols-2 gap-2 text-xs"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold block">SLA Compliance</span>
                      <span className="font-black text-emerald-600 text-sm">{vendor.metrics.slaCompliancePercentage}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Avg Response</span>
                      <span className="font-black text-[#083B56] text-sm">{vendor.metrics.averageResponseTimeMinutes} mins</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Repeat Complaints</span>
                      <span
                        className={`font-black text-sm ${
                          vendor.metrics.repeatComplaintsCount > 2 ? 'text-rose-600' : 'text-[#083B56]'
                        }`}
                      >
                        {vendor.metrics.repeatComplaintsCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Satisfaction</span>
                      <span className="font-black text-[#083B56] text-sm">{vendor.metrics.customerSatisfactionPercentage}%</span>
                    </div>
                  </div>

                  {/* Public Visibility Guard */}
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-[#DCE8EF]">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      {vendor.isPubliclyRanked ? (
                        <Eye size={12} className="text-emerald-600" />
                      ) : (
                        <EyeOff size={12} className="text-slate-400" />
                      )}
                      Public Rank: {vendor.isPubliclyRanked ? 'Visible' : 'Hidden'}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleTogglePublicVisibility(vendor.vendorId, vendor.isPubliclyRanked)
                      }
                      className="text-[11px] font-extrabold text-[#F06543] hover:underline cursor-pointer"
                    >
                      Toggle Visibility
                    </button>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveVendor(vendor)}
                      style={{
                        background: 'var(--aarizo-coral, #F06543)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.45rem 0.85rem',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <BarChart size={14} /> Full Scorecard
                    </button>

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(vendor.vendorId, 'PREFERRED')}
                        title="Mark as Preferred Vendor"
                        style={{
                          background: '#FEF9E7',
                          color: '#B45309',
                          border: '1px solid #FDE68A',
                          borderRadius: '8px',
                          padding: '0.4rem',
                          cursor: 'pointer',
                        }}
                      >
                        <Award size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(vendor.vendorId, 'APPROVED')}
                        title="Approve Vendor"
                        style={{
                          background: '#ECFDF5',
                          color: '#059669',
                          border: '1px solid #A7F3D0',
                          borderRadius: '8px',
                          padding: '0.4rem',
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(vendor.vendorId, 'SUSPENDED')}
                        title="Suspend Vendor"
                        style={{
                          background: '#FFF1F2',
                          color: '#E11D48',
                          border: '1px solid #FECDD3',
                          borderRadius: '8px',
                          padding: '0.4rem',
                          cursor: 'pointer',
                        }}
                      >
                        <AlertCircle size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(vendor.vendorId, 'BLACKLISTED')}
                        title="Blacklist Vendor"
                        style={{
                          background: '#182230',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.4rem',
                          cursor: 'pointer',
                        }}
                      >
                        <Ban size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAILED SCORECARD MODAL */}
      {activeVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 md:p-6 shadow-2xl border border-[#DCE8EF] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#DCE8EF] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#083B56]">{activeVendor.vendorName}</h2>
                <p className="text-xs text-slate-500">{activeVendor.category} • Rep: {activeVendor.contactPerson} ({activeVendor.phone})</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveVendor(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#F7FBFE] p-4 rounded-xl text-xs border border-[#DCE8EF]">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">SLA COMPLIANCE</span>
                <span className="text-base font-bold text-emerald-600">{activeVendor.metrics.slaCompliancePercentage}%</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">AVG RESPONSE</span>
                <span className="text-base font-bold text-slate-900">{activeVendor.metrics.averageResponseTimeMinutes} mins</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">REPEAT COMPLAINTS</span>
                <span className="text-base font-bold text-rose-600">{activeVendor.metrics.repeatComplaintsCount}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">COMPLETED JOBS</span>
                <span className="text-base font-bold text-[#083B56]">{activeVendor.metrics.completedJobsCount}</span>
              </div>
            </div>

            {/* Historical Quarterly Breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#083B56] uppercase tracking-wider">Historical Performance Log</h3>
              <div className="space-y-1.5">
                {activeVendor.metrics.historicalDataPoints.map((h) => (
                  <div key={h.period} className="flex justify-between items-center p-2.5 bg-[#F7FBFE] border border-[#DCE8EF] rounded-xl text-xs">
                    <span className="font-bold text-[#083B56]">{h.period}</span>
                    <span className="text-slate-600">{h.jobsCompleted} jobs completed</span>
                    <span className="font-semibold text-emerald-700">{h.slaMetCount}/{h.totalSlaCount} SLA Met</span>
                    <span className="font-bold text-amber-600">{h.avgRating} ★</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Work Order History */}
            {activeVendor.recentJobHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#DCE8EF]">
                <h3 className="text-xs font-bold text-[#083B56] uppercase tracking-wider">Recent Job Inspections</h3>
                <div className="space-y-2">
                  {activeVendor.recentJobHistory.map((j) => (
                    <div key={j.jobId} className="p-3 bg-[#F7FBFE] rounded-xl border border-[#DCE8EF] text-xs">
                      <div className="flex justify-between items-center font-bold text-[#083B56]">
                        <span>{j.title}</span>
                        <span className="text-amber-600">{j.rating} ★</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                        <span>Date: {j.date}</span>
                        <span>Response: {j.responseTimeMinutes} mins</span>
                        <span className={j.slaMet ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                          {j.slaMet ? 'SLA Met' : 'SLA Breached'}
                        </span>
                      </div>
                      {j.residentFeedback && (
                        <p className="text-[11px] text-slate-600 italic mt-1 bg-white p-2 rounded-lg border border-[#DCE8EF]">
                          "{j.residentFeedback}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
