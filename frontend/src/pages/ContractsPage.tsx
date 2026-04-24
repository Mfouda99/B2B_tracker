import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../api';
import { Globe } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import { Briefcase, FileText, TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#141d35', border: '1px solid #1e2d4d', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#e2e8f0' }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#94a3b8' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, display: 'flex', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', marginTop: 3 }} />
          {p.name}: <strong>{p.value?.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
};

export default function ContractsPage() {
  const [stats, setStats] = useState<any>(null);
  const [contractsByLc, setContractsByLc] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.stats(), api.contractsByLc(), api.monthlyContracts()])
      .then(([s, cbl, m]) => {
        setStats(s);
        setContractsByLc(cbl);
        setMonthly(m);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state"><div className="spinner" /><span>Loading contracts data...</span></div>;
  if (!stats) return <div className="error-state"><Globe size={40} /><p>No data</p></div>;

  const igvLcTop = (contractsByLc?.igv || []).slice(0, 15);
  const igteLcTop = (contractsByLc?.igte || []).slice(0, 15);

  const combinedLc = [...igvLcTop, ...igteLcTop].reduce((acc: any[], cur: any) => {
    const name = cur.lc || cur.name;
    const existing = acc.find(a => a.lc === name);
    if (existing) {
      if (cur.count !== undefined) existing.total = (existing.total || 0) + cur.count;
    } else {
      acc.push({ lc: name, igv: 0, igte: 0, total: 0 });
    }
    return acc;
  }, []);

  igvLcTop.forEach((d: any) => {
    const item = combinedLc.find(c => c.lc === d.lc);
    if (item) item.igv = d.count;
  });
  igteLcTop.forEach((d: any) => {
    const item = combinedLc.find(c => c.lc === d.lc);
    if (item) item.igte = d.count;
  });
  combinedLc.forEach(c => { c.total = c.igv + c.igte; });
  combinedLc.sort((a, b) => b.total - a.total);

  return (
    <div>
      <div className="page-header">
        <h1><span className="gradient-text">Contracts</span> Analytics</h1>
        <p>Contract submissions across all programs and local chapters</p>
      </div>

      <div className="kpi-grid">
        <KpiCard icon={<Briefcase size={20} color="#4f8ef7" />} value={stats.igv.total_contracts} label="IGV Contracts"
          color="linear-gradient(90deg,#4f8ef7,#6ba3ff)" iconBg="rgba(79,142,247,0.15)" />
        <KpiCard icon={<Briefcase size={20} color="#a78bfa" />} value={stats.igte.total_contracts} label="IGTa/e Contracts"
          color="linear-gradient(90deg,#7c3aed,#a78bfa)" iconBg="rgba(167,139,250,0.15)" />
        <KpiCard icon={<FileText size={20} color="#10b981" />} value={stats.combined.total_contracts} label="Total Contracts"
          color="linear-gradient(90deg,#059669,#10b981)" iconBg="rgba(16,185,129,0.15)" />
        <KpiCard icon={<TrendingUp size={20} color="#f59e0b" />} value={monthly.length} label="Months Active"
          color="linear-gradient(90deg,#d97706,#f59e0b)" iconBg="rgba(245,158,11,0.15)" />
      </div>

      {/* Monthly trend */}
      <div className="chart-card section-gap">
        <div className="chart-card-header">
          <div><div className="chart-card-title">Monthly Contract Volume — IGV vs IGTa/e</div><div className="chart-card-sub">All-time trend</div></div>
          <span className="chart-tag tag-both">Both</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Line type="monotone" dataKey="igv" stroke="#4f8ef7" strokeWidth={2.5} dot={{ r: 3 }} name="IGV" />
            <Line type="monotone" dataKey="igte" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 3 }} name="IGTa/e" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Combined contracts by LC */}
      <div className="chart-card section-gap">
        <div className="chart-card-header">
          <div><div className="chart-card-title">Contracts by LC — IGV vs IGTa/e</div><div className="chart-card-sub">Top local chapters stacked</div></div>
          <span className="chart-tag tag-both">Both</span>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={combinedLc.slice(0, 15)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
            <XAxis dataKey="lc" tick={{ fill: '#64748b', fontSize: 10 }} angle={-25} textAnchor="end" height={65} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Bar dataKey="igv" name="IGV" stackId="a" fill="#4f8ef7" />
            <Bar dataKey="igte" name="IGTa/e" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="charts-grid charts-row-2 section-gap">
        {/* IGV by LC */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div><div className="chart-card-title">IGV Contracts by LC</div><div className="chart-card-sub">Top 15 chapters</div></div>
            <span className="chart-tag tag-igv">IGV</span>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>LC</th><th>Contracts</th><th>Share</th></tr></thead>
              <tbody>
                {igvLcTop.map((d: any, i: number) => {
                  const total = igvLcTop.reduce((s: number, r: any) => s + r.count, 0);
                  return (
                    <tr key={d.lc}>
                      <td><span className={`rank-badge ${i < 3 ? ['gold', 'silver', 'bronze'][i] : ''}`}>{i + 1}</span></td>
                      <td><strong>{d.lc}</strong></td>
                      <td style={{ color: '#4f8ef7', fontWeight: 700 }}>{d.count}</td>
                      <td>
                        <div className="prog-bar">
                          <div className="prog-fill" style={{ width: `${(d.count / total) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* IGTa/e by LC */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div><div className="chart-card-title">IGTa/e Contracts by LC</div><div className="chart-card-sub">Top 15 chapters</div></div>
            <span className="chart-tag tag-igte">IGTa/e</span>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>LC</th><th>Contracts</th><th>Share</th></tr></thead>
              <tbody>
                {igteLcTop.map((d: any, i: number) => {
                  const total = igteLcTop.reduce((s: number, r: any) => s + r.count, 0);
                  return (
                    <tr key={d.lc}>
                      <td><span className={`rank-badge ${i < 3 ? ['gold', 'silver', 'bronze'][i] : ''}`}>{i + 1}</span></td>
                      <td><strong>{d.lc}</strong></td>
                      <td style={{ color: '#a78bfa', fontWeight: 700 }}>{d.count}</td>
                      <td>
                        <div className="prog-bar">
                          <div className="prog-fill" style={{ width: `${(d.count / total) * 100}%`, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)' }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
