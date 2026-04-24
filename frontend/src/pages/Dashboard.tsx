import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, FileCheck, TrendingUp, Award, Briefcase, Globe } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import { api } from '../api';

const COLORS = ['#4f8ef7', '#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#141d35', border: '1px solid #1e2d4d', borderRadius: 10,
      padding: '10px 14px', fontSize: 12, color: '#e2e8f0'
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#94a3b8' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          {p.name}: <strong>{p.value?.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [topLcs, setTopLcs] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any>(null);
  const [industries, setIndustries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.stats(), api.topLcs(), api.monthlyContracts(),
      api.statusBreakdown(), api.industryBreakdown()
    ]).then(([s, t, m, sd, ind]) => {
      setStats(s); setTopLcs(t); setMonthly(m);
      setStatusData(sd); setIndustries(ind);
      setLoading(false);
    }).catch(() => { setError('Failed to load data. Is the backend running?'); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" />
      <span>Loading dashboard data...</span>
    </div>
  );

  if (error) return <div className="error-state"><Globe size={40} /><p>{error}</p></div>;

  const c = stats.combined;
  const igv = stats.igv;
  const igte = stats.igte;

  const statusIgv = (statusData?.igv || []).map((d: any) => ({ ...d, name: d.status }));
  const statusIgte = (statusData?.igte || []).map((d: any) => ({ ...d, name: d.status }));

  const combinedStatus = [...statusIgv, ...statusIgte].reduce((acc: any, cur: any) => {
    const existing = acc.find((a: any) => a.status === cur.status);
    if (existing) existing.count += cur.count;
    else acc.push({ ...cur });
    return acc;
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Overview <span className="gradient-text">Dashboard</span></h1>
        <p>Combined IGV + IGTa/e analytics across all AIESEC Local Chapters</p>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        <KpiCard icon={<FileCheck size={20} color="#4f8ef7" />} value={c.total_submissions} label="Total Submissions"
          sub={`IGV: ${igv.total_submissions} · IGTa/e: ${igte.total_submissions}`}
          color="linear-gradient(90deg,#4f8ef7,#6ba3ff)" iconBg="rgba(79,142,247,0.15)" />
        <KpiCard icon={<Briefcase size={20} color="#a78bfa" />} value={c.total_contracts} label="Total Contracts"
          sub={`IGV: ${igv.total_contracts} · IGTa/e: ${igte.total_contracts}`}
          color="linear-gradient(90deg,#7c3aed,#a78bfa)" iconBg="rgba(167,139,250,0.15)" />
        <KpiCard icon={<TrendingUp size={20} color="#10b981" />} value={c.total_opens} label="Total Opens"
          sub="Across all submissions"
          color="linear-gradient(90deg,#059669,#10b981)" iconBg="rgba(16,185,129,0.15)" />
        <KpiCard icon={<Users size={20} color="#f59e0b" />} value={c.total_apds} label="Total APDs"
          sub="Approved & Pending"
          color="linear-gradient(90deg,#d97706,#f59e0b)" iconBg="rgba(245,158,11,0.15)" />
        <KpiCard icon={<Award size={20} color="#ef4444" />} value={c.total_res} label="Total REs"
          sub="Realizations"
          color="linear-gradient(90deg,#dc2626,#ef4444)" iconBg="rgba(239,68,68,0.15)" />
        <KpiCard icon={<Globe size={20} color="#06b6d4" />} value={igv.ecb_opens + igte.ecb_opens} label="ECB Opens"
          sub="Opens by ECB"
          color="linear-gradient(90deg,#0891b2,#06b6d4)" iconBg="rgba(6,182,212,0.15)" />
      </div>

      {/* Monthly contracts trend */}
      <div className="section-gap">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Monthly Contract Submissions</div>
              <div className="chart-card-sub">IGV vs IGTa/e trend over time</div>
            </div>
            <span className="chart-tag tag-both">Combined</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
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
      </div>

      {/* Status breakdown + Industries */}
      <div className="charts-grid charts-row-2 section-gap">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Submission Status Breakdown</div>
              <div className="chart-card-sub">Combined IGV + IGTa/e statuses</div>
            </div>
            <span className="chart-tag tag-both">All</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={combinedStatus} dataKey="count" nameKey="status" cx="50%" cy="50%"
                outerRadius={90} label={(p: any) => `${p.status} ${((p.percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {combinedStatus.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Top Industries (IGTa/e)</div>
              <div className="chart-card-sub">Contract distribution by sector</div>
            </div>
            <span className="chart-tag tag-igte">IGTa/e</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={(industries?.igte_industries || []).slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Contracts" fill="#a78bfa" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top LCs */}
      <div className="section-gap">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-card-title">Top Local Chapters by Realizations</div>
              <div className="chart-card-sub">Combined IGV + IGTa/e REs</div>
            </div>
            <span className="chart-tag tag-both">Top 15</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topLcs.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
              <XAxis dataKey="lc" tick={{ fill: '#64748b', fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="res" name="REs" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f8ef7" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* IGV fields */}
      <div className="chart-card section-gap">
        <div className="chart-card-header">
          <div>
            <div className="chart-card-title">Fields of Work (IGV)</div>
            <div className="chart-card-sub">Opportunity distribution by field</div>
          </div>
          <span className="chart-tag tag-igv">IGV</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={(industries?.igv_fields || []).slice(0, 12)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={130} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Contracts" fill="#4f8ef7" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
