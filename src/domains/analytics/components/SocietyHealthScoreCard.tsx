import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Wrench,
  DollarSign,
  FileCheck,
  Smile,
  Leaf,
  TrendingUp,
  Download,
  Calendar,
} from 'lucide-react';
import { societyHealthScoreEngine } from '../services/societyHealthScoreEngine';
import type { SocietyHealthScoreData, HealthScoreComponent } from '../types';

export const SocietyHealthScoreCard: React.FC = () => {
  const [data, setData] = useState<SocietyHealthScoreData | null>(null);
  const [_selectedPillar, setSelectedPillar] = useState<HealthScoreComponent | null>(null);

  useEffect(() => {
    setData(societyHealthScoreEngine.calculateHealthScore());
  }, []);

  if (!data) return null;

  const handleExportAGMReport = () => {
    const reportText = `
=====================================================
GREEN VALLEY RESIDENCY - ANNUAL GENERAL MEETING (AGM)
SOCIETY HEALTH & OPERATIONAL AUDIT REPORT
Generated Date: ${data.asOfDate}
Overall Society Health Score: ${data.overallScore}/100 (Grade: ${data.grade})
Status: ${data.status}
=====================================================

1. CORE PILLAR PERFORMANCE SCORES:
-----------------------------------------------------
- Security Health: ${data.pillars.securityHealth.score}/100 (Weight: 15%)
  Key Input: ${data.pillars.securityHealth.keyInput}

- Operations & SLA: ${data.pillars.operationsHealth.score}/100 (Weight: 20%)
  Key Input: ${data.pillars.operationsHealth.keyInput}

- Financial Health: ${data.pillars.financialHealth.score}/100 (Weight: 20%)
  Key Input: ${data.pillars.financialHealth.keyInput}

- Compliance & AMC: ${data.pillars.complianceHealth.score}/100 (Weight: 20%)
  Key Input: ${data.pillars.complianceHealth.keyInput}

- Resident Experience: ${data.pillars.residentExperience.score}/100 (Weight: 15%)
  Key Input: ${data.pillars.residentExperience.keyInput}

- Sustainability Index: ${data.pillars.sustainability.score}/100 (Weight: 10%)
  Key Input: ${data.pillars.sustainability.keyInput}

2. HISTORICAL SCORE PROGRESSION (AGM TREND):
-----------------------------------------------------
${data.historicalTrends
  .map((t) => `${t.period}: Overall Score ${t.overallScore}/100 (Sec: ${t.security}, Ops: ${t.operations}, Fin: ${t.financial}, Comp: ${t.compliance})`)
  .join('\n')}

=====================================================
Certified by AARIZO Society Intelligence Engine
    `;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AGM_Society_Health_Audit_Report_${data.asOfDate}.txt`;
    link.click();
  };

  const pillarList = [
    { key: 'securityHealth', label: 'Security Health', icon: ShieldCheck, color: 'emerald' },
    { key: 'operationsHealth', label: 'Operations Health', icon: Wrench, color: 'indigo' },
    { key: 'financialHealth', label: 'Financial Health', icon: DollarSign, color: 'blue' },
    { key: 'complianceHealth', label: 'Compliance Health', icon: FileCheck, color: 'amber' },
    { key: 'residentExperience', label: 'Resident Experience', icon: Smile, color: 'purple' },
    { key: 'sustainability', label: 'Sustainability', icon: Leaf, color: 'teal' },
  ] as const;

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#DCE8EF] shadow-2xs space-y-6">
      {/* Top Banner: Score Gauge & AGM Export */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-6 rounded-2xl gap-6"
        style={{ background: '#F4FAFE', border: '1px solid #DCE8EF' }}
      >
        <div className="flex items-center gap-5">
          {/* Main Score Badge */}
          <div
            className="relative flex items-center justify-center w-24 h-24 rounded-2xl text-white shadow-md shrink-0"
            style={{ background: '#083B56', border: '1px solid #DCE8EF' }}
          >
            <div className="text-center">
              <span className="text-3xl font-extrabold">{data.overallScore}</span>
              <span className="text-[10px] block font-bold text-[#83CBEA] uppercase">/ 100</span>
            </div>
            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#F06543] text-white font-black text-xs rounded-full shadow-sm">
              Grade {data.grade}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-[#083B56]">Society Health &amp; Operational Index</h2>
              <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#059669] rounded-full text-xs font-extrabold border border-[#A7F3D0]">
                {data.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Transparent score synthesized in real-time from 6 domain pillars: compliance, AMCs, SLA times, financials, sustainability, and security.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportAGMReport}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.55rem 1rem',
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
          <Download size={15} /> Export AGM Audit Report
        </button>
      </div>

      {/* 6 Core Pillar Grid */}
      <div>
        <h3 className="text-sm font-extrabold text-[#083B56] mb-3 flex items-center gap-2">
          <Activity size={16} className="text-[#F06543]" /> Transparent Score Components &amp; Domain Inputs
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pillarList.map((p) => {
            const pillar = data.pillars[p.key];
            const Icon = p.icon;
            return (
              <div
                key={p.key}
                onClick={() => setSelectedPillar(pillar)}
                className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-white rounded-lg border text-[#083B56] shadow-xs">
                      <Icon size={18} />
                    </span>
                    <span className="font-bold text-xs text-slate-800">{pillar.name}</span>
                  </div>
                  <span className="text-base font-extrabold text-slate-900">{pillar.score}/100</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#176B91] h-full rounded-full transition-all"
                    style={{ width: `${pillar.score}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                  <span>Weight: {pillar.weight * 100}%</span>
                  <span className="text-[#083B56] font-bold">Contribution: +{pillar.weightedScore.toFixed(1)}</span>
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 bg-white p-2 rounded-lg border border-slate-100">
                  {pillar.keyInput}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Score Trends (AGM Chart / Table) */}
      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-600" /> Historical Performance Trends (AGM Reporting)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Period</th>
                <th className="p-3">Overall Score</th>
                <th className="p-3">Security</th>
                <th className="p-3">Operations</th>
                <th className="p-3">Financial</th>
                <th className="p-3">Compliance</th>
                <th className="p-3">Sustainability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data.historicalTrends.map((t) => (
                <tr key={t.period} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-400" /> {t.period}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-[#EAF6FC] text-[#083B56] font-extrabold rounded">
                      {t.overallScore}/100
                    </span>
                  </td>
                  <td className="p-3 text-slate-800">{t.security}</td>
                  <td className="p-3 text-slate-800">{t.operations}</td>
                  <td className="p-3 text-slate-800">{t.financial}</td>
                  <td className="p-3 text-slate-800">{t.compliance}</td>
                  <td className="p-3 text-slate-800">{t.sustainability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
