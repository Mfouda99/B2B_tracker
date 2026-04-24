import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, Cell,
} from 'recharts';
import { api } from '../api';
import { Globe, Calendar } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import { FileCheck, TrendingUp, Users, Award, BarChart2 } from 'lucide-react';

function rateColor(rate: number) {
  if (rate >= 50) return '#10b981';
  if (rate >= 25) return '#f59e0b';
  if (rate >= 10) return '#a78bfa';
  return '#ef4444';
}

function ratePillStyle(rate: number): React.CSSProperties {
  const c = rateColor(rate);
  return { color: c, background: `${c}22`, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 };
}

const COUNTED_STATUSES = new Set(['open', 'un_publish', 'expired']);

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

const dateInputStyle: React.CSSProperties = {
  background: '#0d1526',
  border: '1px solid #1e2d4d',
  borderRadius: 8,
  color: '#e2e8f0',
  padding: '6px 10px',
  fontSize: 13,
  colorScheme: 'dark' as any,
};

function parseDate(str: string): Date | null {
  if (!str) return null;
  const parts = str.trim().split('/');
  if (parts.length < 3) return null;
  const [m, d, y] = parts.map(Number);
  if (!m || !d || !y || y < 2000) return null;
  return new Date(y, m - 1, d);
}

export default function IgtePage() {
  const [allSubs, setAllSubs] = useState<any[]>([]);
  const [contractTypes, setContractTypes] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [monthlyRaw, setMonthlyRaw] = useState<any[]>([]);
  const [totalContracts, setTotalContracts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [radarCount, setRadarCount] = useState(15);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    Promise.all([
      api.stats(), api.igteSubmissions(),
      api.contractTypes(), api.industryBreakdown(),
      api.monthlyContracts(),
    ]).then(([s, subs, ct, ind, m]) => {
      setAllSubs(subs || []);
      setTotalContracts(s.igte?.total_contracts ?? 0);
      setContractTypes(ct.igte || []);
      setIndustries(ind.igte_industries || []);
      setMonthlyRaw(m);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const fromDate = useMemo(() => dateFrom ? new Date(dateFrom) : null, [dateFrom]);
  const toDate = useMemo(() => dateTo ? new Date(dateTo + 'T23:59:59') : null, [dateTo]);

  const filteredSubs = useMemo(() => {
    if (!fromDate && !toDate) return allSubs;
    return allSubs.filter(r => {
      const d = parseDate(r['Contract Signature Date'] || '');
      if (!d) return false;
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [allSubs, fromDate, toDate]);

  const stats = useMemo(() => {
    const subs = filteredSubs;
    return {
      total_submissions: subs.length,
      total_opens: subs.reduce((s: number, r: any) => s + (Number(r['Total Opens']) || 0), 0),
      total_apds: subs.reduce((s: number, r: any) => s + (Number(r['APDs']) || 0), 0),
      total_res: subs.reduce((s: number, r: any) => s + (Number(r['REs']) || 0), 0),
      ecb_opens: subs.reduce((s: number, r: any) => s + (Number(r['Opens By ECB']) || 0), 0),
    };
  }, [filteredSubs]);

  const lcIgteTop = useMemo(() => {
    const map: Record<string, any> = {};
    for (const r of filteredSubs) {
      const lc = (r['AIESEC Local Chapter Name'] || '').trim() || 'Unknown';
      if (!map[lc]) map[lc] = { lc, igte_submissions: 0, igte_opens: 0, igte_apds: 0, igte_res: 0 };
      map[lc].igte_submissions += 1;
      map[lc].igte_opens += Number(r['Total Opens']) || 0;
      map[lc].igte_apds += Number(r['APDs']) || 0;
      map[lc].igte_res += Number(r['REs']) || 0;
    }
    return Object.values(map).sort((a, b) => b.igte_res - a.igte_res).slice(0, 15);
  }, [filteredSubs]);

  const allLcsSorted = useMemo(() => {
    const map: Record<string, any> = {};
    for (const r of filteredSubs) {
      const lc = (r['AIESEC Local Chapter Name'] || '').trim() || 'Unknown';
      if (!map[lc]) map[lc] = { lc, igte_submissions: 0, igte_opens: 0, igte_apds: 0, igte_res: 0 };
      map[lc].igte_submissions += 1;
      map[lc].igte_opens += Number(r['Total Opens']) || 0;
      map[lc].igte_apds += Number(r['APDs']) || 0;
      map[lc].igte_res += Number(r['REs']) || 0;
    }
    return Object.values(map).sort((a, b) => b.igte_res - a.igte_res);
  }, [filteredSubs]);

  const monthly = useMemo(() => {
    if (!fromDate && !toDate) return monthlyRaw;
    return monthlyRaw.filter(row => {
      if (!row.month) return true;
      const [y, m] = row.month.split('-').map(Number);
      const rowDate = new Date(y, m - 1, 1);
      if (fromDate && rowDate < new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)) return false;
      if (toDate && rowDate > new Date(toDate.getFullYear(), toDate.getMonth(), 1)) return false;
      return true;
    });
  }, [monthlyRaw, fromDate, toDate]);

  const fulfillment = useMemo(() => {
    const filtered = filteredSubs.filter(r =>
      COUNTED_STATUSES.has((r['Status (Expa)'] || '').trim().toLowerCase())
    );
    const apdsMap: Record<string, number> = {};
    const slotsMap: Record<string, number> = {};
    for (const r of filtered) {
      const lc = (r['AIESEC Local Chapter Name'] || '').trim();
      if (!lc) continue;
      apdsMap[lc] = (apdsMap[lc] || 0) + (Number(r['APDs']) || 0);
      slotsMap[lc] = (slotsMap[lc] || 0) + (Number(r['Opens By ECB']) || 0);
    }
    const allLcs = new Set([...Object.keys(apdsMap), ...Object.keys(slotsMap)]);
    const rows = Array.from(allLcs).map(lc => {
      const apds = apdsMap[lc] || 0;
      const slots = slotsMap[lc] || 0;
      const rate = slots > 0 ? Math.round((apds / slots) * 1000) / 10 : 0;
      return { lc, apds, slots, fulfillment_rate: rate };
    });
    return rows.sort((a, b) => b.fulfillment_rate - a.fulfillment_rate);
  }, [filteredSubs]);

  const radarData = useMemo(() =>
    allLcsSorted.slice(0, radarCount).map(lc => ({
      lc: lc.lc.split(' ')[0],
      Submissions: lc.igte_submissions,
      Opens: lc.igte_opens,
      APDs: lc.igte_apds,
      REs: lc.igte_res,
    })),
    [allLcsSorted, radarCount]
  );

  if (loading) return <div className="loading-state"><div className="spinner" /><span>Loading IGTa/e data...</span></div>;

  const isFiltered = !!(fromDate || toDate);

  return (
    <div>
      <div className="page-header">
        <h1><span className="gradient-text">IGTa/e</span> Submissions & Contracts</h1>
        <p>Incoming Global Talent & Exchange — talent programs, internships and teaching exchanges</p>
      </div>

      {/* Date filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Calendar size={16} color="#a78bfa" />
        <span style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>Contract Date:</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={dateInputStyle} />
        <span style={{ fontSize: 13, color: '#64748b' }}>→</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={dateInputStyle} />
        {isFiltered && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); }}
            style={{ background: '#1e2d4d', border: 'none', borderRadius: 8, color: '#94a3b8', padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
            Clear
          </button>
        )}
        {isFiltered && (
          <span style={{ fontSize: 12, color: '#a78bfa', marginLeft: 4 }}>
            {filteredSubs.length} submissions shown
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className="kpi-grid">
        <KpiCard icon={<FileCheck size={20} color="#a78bfa" />} value={stats.total_submissions} label="IGTa/e Submissions"
          color="linear-gradient(90deg,#7c3aed,#a78bfa)" iconBg="rgba(167,139,250,0.15)" />
        <KpiCard icon={<BarChart2 size={20} color="#4f8ef7" />} value={totalContracts} label="IGTa/e Contracts"
          color="linear-gradient(90deg,#4f8ef7,#6ba3ff)" iconBg="rgba(79,142,247,0.15)" />
        <KpiCard icon={<TrendingUp size={20} color="#10b981" />} value={stats.total_opens} label="Total Opens"
          color="linear-gradient(90deg,#059669,#10b981)" iconBg="rgba(16,185,129,0.15)" />
        <KpiCard icon={<Users size={20} color="#f59e0b" />} value={stats.total_apds} label="APDs"
          color="linear-gradient(90deg,#d97706,#f59e0b)" iconBg="rgba(245,158,11,0.15)" />
        <KpiCard icon={<Award size={20} color="#ef4444" />} value={stats.total_res} label="REs"
          color="linear-gradient(90deg,#dc2626,#ef4444)" iconBg="rgba(239,68,68,0.15)" />
        <KpiCard icon={<Globe size={20} color="#06b6d4" />} value={stats.ecb_opens} label="ECB Opens"
          color="linear-gradient(90deg,#0891b2,#06b6d4)" iconBg="rgba(6,182,212,0.15)" />
      </div>

      {/* Monthly area chart */}
      <div className="chart-card section-gap">
        <div className="chart-card-header">
          <div className="chart-card-title">Monthly IGTa/e Contract Volume</div>
          <span className="chart-tag tag-igte">IGTa/e</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthly}>
            <defs>
              <linearGradient id="igteGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="igte" name="IGTa/e Contracts" stroke="#a78bfa" fill="url(#igteGrad)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Contract types */}
      <div className="chart-card section-gap">
        <div className="chart-card-header">
          <div className="chart-card-title">Contract Types</div>
          <span className="chart-tag tag-igte">IGTa/e</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={contractTypes.slice(0, 8)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis dataKey="type" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={160} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Contracts" fill="#a78bfa" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Industries */}
      <div className="chart-card section-gap">
        <div className="chart-card-header">
          <div className="chart-card-title">Top Industries</div>
          <span className="chart-tag tag-igte">IGTa/e</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={industries.slice(0, 8)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Contracts" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* LC Performance table */}
      <div className="chart-card section-gap">
        <div className="chart-card-header">
          <div className="chart-card-title">Top 15 LCs — IGTa/e Performance</div>
          <span className="chart-tag tag-igte">IGTa/e</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Local Chapter</th><th>Submissions</th><th>Opens</th><th>APDs</th><th>REs</th><th>Progress</th></tr>
            </thead>
            <tbody>
              {lcIgteTop.map((lc, i) => {
                const max = lcIgteTop[0]?.igte_res || 1;
                return (
                  <tr key={lc.lc}>
                    <td><span className={`rank-badge ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>{i + 1}</span></td>
                    <td><strong>{lc.lc}</strong></td>
                    <td className="secondary">{lc.igte_submissions.toLocaleString()}</td>
                    <td className="secondary">{lc.igte_opens.toLocaleString()}</td>
                    <td className="secondary">{lc.igte_apds.toLocaleString()}</td>
                    <td><strong style={{ color: '#a78bfa' }}>{lc.igte_res.toLocaleString()}</strong></td>
                    <td>
                      <div className="prog-bar">
                        <div className="prog-fill" style={{ width: `${(lc.igte_res / max) * 100}%`, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)' }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fulfillment rate */}
      <div className="chart-card section-gap">
        <div className="chart-card-header">
          <div className="chart-card-title">Fulfillment Rate by LC</div>
          <span className="chart-tag tag-igte">IGTa/e</span>
        </div>
        <ResponsiveContainer width="100%" height={Math.max(320, fulfillment.length * 28)}>
          <BarChart data={fulfillment} layout="vertical" margin={{ left: 10, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`}
              tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis dataKey="lc" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={140} />
            <Tooltip
              content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: '#141d35', border: '1px solid #1e2d4d', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#e2e8f0' }}>
                    <div style={{ fontWeight: 700, marginBottom: 6, color: '#94a3b8' }}>{d.lc}</div>
                    <div>APDs: <strong>{d.apds}</strong></div>
                    <div>Slots: <strong>{d.slots}</strong></div>
                    <div>Rate: <strong style={{ color: rateColor(d.fulfillment_rate) }}>{d.fulfillment_rate}%</strong></div>
                  </div>
                );
              }}
            />
            <ReferenceLine x={25} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '25%', fill: '#f59e0b', fontSize: 10 }} />
            <ReferenceLine x={50} stroke="#10b981" strokeDasharray="4 4" label={{ value: '50%', fill: '#10b981', fontSize: 10 }} />
            <Bar dataKey="fulfillment_rate" name="Fulfillment %" radius={[0, 4, 4, 0]}>
              {fulfillment.map((d: any, i: number) => (
                <Cell key={i} fill={rateColor(d.fulfillment_rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="table-wrapper" style={{ marginTop: 24 }}>
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Local Chapter</th><th>APDs</th><th>Slots</th><th>Fulfillment Rate</th><th>Progress</th></tr>
            </thead>
            <tbody>
              {fulfillment.map((d: any, i: number) => (
                <tr key={d.lc}>
                  <td><span className={`rank-badge ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>{i + 1}</span></td>
                  <td><strong>{d.lc}</strong></td>
                  <td className="secondary">{d.apds.toLocaleString()}</td>
                  <td className="secondary">{d.slots.toLocaleString()}</td>
                  <td><span style={ratePillStyle(d.fulfillment_rate)}>{d.fulfillment_rate}%</span></td>
                  <td>
                    <div className="prog-bar" style={{ minWidth: 100 }}>
                      <div className="prog-fill" style={{ width: `${Math.min(d.fulfillment_rate, 100)}%`, background: rateColor(d.fulfillment_rate) }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="legend" style={{ marginTop: 16 }}>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#10b981' }} />≥ 50% Excellent</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#f59e0b' }} />25–49% Good</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#a78bfa' }} />10–24% Fair</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#ef4444' }} />&lt; 10% Low</div>
        </div>
      </div>

      {/* Radar */}
      {radarData.length > 0 && (
        <div className="chart-card section-gap">
          <div className="chart-card-header">
            <div className="chart-card-title">LC Performance Radar — Top {radarCount}</div>
            <span className="chart-tag tag-igte">IGTa/e</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>Show LCs:</span>
            <input
              type="range" min={3} max={allLcsSorted.length} value={radarCount}
              onChange={e => setRadarCount(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#a78bfa' }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', minWidth: 28, textAlign: 'right' }}>{radarCount}</span>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(360, radarCount * 18)}>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="#1e2d4d" />
              {React.createElement(PolarAngleAxis as any, {
                dataKey: 'lc',
                tick: { fill: '#94a3b8', fontSize: radarCount > 20 ? 9 : 11 }
              })}
              <Radar name="REs" dataKey="REs" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.3} />
              <Radar name="APDs" dataKey="APDs" stroke="#4f8ef7" fill="#4f8ef7" fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
