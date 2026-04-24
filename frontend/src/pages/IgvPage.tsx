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
  if (rate >= 10) return '#4f8ef7';
  return '#ef4444';
}

function ratePillStyle(rate: number): React.CSSProperties {
  const c = rateColor(rate);
  return { color: c, background: `${c}22`, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 };
}

const COLORS = ['#4f8ef7', '#6ba3ff', '#93c5fd', '#bfdbfe', '#dbeafe', '#1d4ed8', '#2563eb', '#3b82f6'];

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

function parseDate(str: string): Date | null {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length >= 3) {
    const [m, d, y] = parts;
    const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

export default function IgvPage() {
  const [rawSubs, setRawSubs] = useState<any[]>([]);
  const [rawLcPerf, setRawLcPerf] = useState<any[]>([]);
  const [rawContractTypes, setRawContractTypes] = useState<any[]>([]);
  const [rawFields, setRawFields] = useState<any[]>([]);
  const [rawMonthly, setRawMonthly] = useState<any[]>([]);
  const [rawFulfillment, setRawFulfillment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [radarCount, setRadarCount] = useState(15);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    Promise.all([
      api.stats(), api.lcPerformance(), api.statusBreakdown(),
      api.contractTypes(), api.orgSize(), api.industryBreakdown(),
      api.monthlyContracts(), api.fulfillmentRate(), api.igvSubmissions(),
    ]).then(([s, lc, _sd, ct, _os, ind, m, fr, subs]) => {
      setRawSubs(subs);
      setRawLcPerf(lc);
      setRawContractTypes(ct.igv || []);
      setRawFields(ind.igv_fields || []);
      setRawMonthly(m);
      setRawFulfillment(fr.igv || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const fromDate = dateFrom ? new Date(dateFrom) : null;
  const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;

  const filteredSubs = useMemo(() => {
    if (!fromDate && !toDate) return rawSubs;
    return rawSubs.filter(r => {
      const d = parseDate(r['Contract Signature Date'] || '');
      if (!d) return false;
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [rawSubs, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const total_submissions = filteredSubs.length;
    const total_opens = filteredSubs.reduce((s, r) => s + (parseInt(r['Total  Opens']) || 0), 0);
    const total_apds = filteredSubs.reduce((s, r) => s + (parseInt(r['APDs']) || 0), 0);
    const total_res = filteredSubs.reduce((s, r) => s + (parseInt(r['REs']) || 0), 0);
    const ecb_opens = filteredSubs.reduce((s, r) => s + (parseInt(r['Total  Opens by ECB']) || 0), 0);
    return { total_submissions, total_opens, total_apds, total_res, ecb_opens, total_contracts: rawContractTypes.reduce((s, r) => s + r.count, 0) };
  }, [filteredSubs, rawContractTypes]);

  const lcIgvTop = useMemo(() => {
    if (!fromDate && !toDate) return [...rawLcPerf].sort((a, b) => b.igv_res - a.igv_res).slice(0, 15);
    const map: Record<string, any> = {};
    filteredSubs.forEach(r => {
      const lc = (r['AIESEC Local Chapter Name'] || '').trim();
      if (!lc) return;
      if (!map[lc]) map[lc] = { lc, igv_submissions: 0, igv_opens: 0, igv_apds: 0, igv_res: 0 };
      map[lc].igv_submissions++;
      map[lc].igv_opens += parseInt(r['Total  Opens']) || 0;
      map[lc].igv_apds += parseInt(r['APDs']) || 0;
      map[lc].igv_res += parseInt(r['REs']) || 0;
    });
    return Object.values(map).sort((a, b) => b.igv_res - a.igv_res).slice(0, 15);
  }, [filteredSubs, rawLcPerf, dateFrom, dateTo]);

  const allLcsSorted = useMemo(() => {
    if (!fromDate && !toDate) return [...rawLcPerf].sort((a, b) => b.igv_res - a.igv_res);
    return lcIgvTop;
  }, [lcIgvTop, rawLcPerf, dateFrom, dateTo]);

  const monthly = useMemo(() => {
    if (!fromDate && !toDate) return rawMonthly;
    return rawMonthly.filter(r => {
      if (!r.month) return false;
      const [y, m] = r.month.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      if (fromDate && d < new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)) return false;
      if (toDate && d > new Date(toDate.getFullYear(), toDate.getMonth(), 1)) return false;
      return true;
    });
  }, [rawMonthly, dateFrom, dateTo]);

  const fulfillment = useMemo(() => {
    if (!fromDate && !toDate) return rawFulfillment;
    const COUNTED = new Set(['open', 'un_publish', 'expired']);
    const apds: Record<string, number> = {};
    const slots: Record<string, number> = {};
    filteredSubs.forEach(r => {
      const lc = (r['AIESEC Local Chapter Name'] || '').trim();
      const status = (r['Status (Expa)'] || '').trim().toLowerCase();
      if (!lc || !COUNTED.has(status)) return;
      apds[lc] = (apds[lc] || 0) + (parseInt(r['APDs']) || 0);
      slots[lc] = (slots[lc] || 0) + (parseInt(r['Total  Opens by ECB']) || 0);
    });
    return Object.keys(apds).map(lc => ({
      lc, apds: apds[lc], slots: slots[lc] || 0,
      fulfillment_rate: slots[lc] ? Math.round((apds[lc] / slots[lc]) * 1000) / 10 : 0,
    })).sort((a, b) => b.fulfillment_rate - a.fulfillment_rate);
  }, [filteredSubs, rawFulfillment, dateFrom, dateTo]);

  const radarData = allLcsSorted.slice(0, radarCount).map(lc => ({
    lc: lc.lc.split(' ')[0],
    Submissions: lc.igv_submissions,
    Opens: lc.igv_opens,
    APDs: lc.igv_apds,
    REs: lc.igv_res,
  }));

  const isFiltered = !!(dateFrom || dateTo);

  if (loading) return <div className="loading-state"><div className="spinner" /><span>Loading IGV data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1><span className="gradient-text">IGV</span> Submissions & Contracts</h1>
        <p>Incoming Global Volunteer analytics — submissions, contracts and LC performance</p>
      </div>

      {/* Date filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <Calendar size={16} color="#64748b" />
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Filter by Contract Signature Date:</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={dateInputStyle} />
        <span style={{ fontSize: 12, color: '#64748b' }}>to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={dateInputStyle} />
        {isFiltered && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); }}
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            Clear
          </button>
        )}
        {isFiltered && (
          <span style={{ fontSize: 12, color: '#4f8ef7', fontWeight: 600 }}>
            {filteredSubs.length.toLocaleString()} submissions in range
          </span>
        )}
      </div>

      <div className="kpi-grid">
        <KpiCard icon={<FileCheck size={20} color="#4f8ef7" />} value={stats.total_submissions} label="IGV Submissions"
          color="linear-gradient(90deg,#4f8ef7,#6ba3ff)" iconBg="rgba(79,142,247,0.15)" />
        <KpiCard icon={<BarChart2 size={20} color="#a78bfa" />} value={stats.total_contracts} label="IGV Contracts"
          color="linear-gradient(90deg,#7c3aed,#a78bfa)" iconBg="rgba(167,139,250,0.15)" />
        <KpiCard icon={<TrendingUp size={20} color="#10b981" />} value={stats.total_opens} label="Total Opens"
          color="linear-gradient(90deg,#059669,#10b981)" iconBg="rgba(16,185,129,0.15)" />
        <KpiCard icon={<Users size={20} color="#f59e0b" />} value={stats.total_apds} label="APDs"
          color="linear-gradient(90deg,#d97706,#f59e0b)" iconBg="rgba(245,158,11,0.15)" />
        <KpiCard icon={<Award size={20} color="#ef4444" />} value={stats.total_res} label="REs"
          color="linear-gradient(90deg,#dc2626,#ef4444)" iconBg="rgba(239,68,68,0.15)" />
        <KpiCard icon={<Globe size={20} color="#06b6d4" />} value={stats.ecb_opens} label="ECB Opens"
          color="linear-gradient(90deg,#0891b2,#06b6d4)" iconBg="rgba(6,182,212,0.15)" />
      </div>

      <div className="chart-card section-gap">
        <div className="chart-card-header">
          <div className="chart-card-title">Monthly IGV Contract Volume</div>
          <span className="chart-tag tag-igv">IGV</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthly}>
            <defs>
              <linearGradient id="igvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="igv" name="IGV Contracts" stroke="#4f8ef7" fill="url(#igvGrad)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card section-gap">
        <div className="chart-card-header">
          <div className="chart-card-title">Contract Types</div>
          <span className="chart-tag tag-igv">IGV</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rawContractTypes.slice(0, 8)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis dataKey="type" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={160} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Contracts" fill="#4f8ef7" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card section-gap">
        <div className="chart-card-header">
          <div className="chart-card-title">Fields of Work</div>
          <span className="chart-tag tag-igv">IGV</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rawFields.slice(0, 8)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Contracts" fill="#4f8ef7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card section-gap">
        <div className="chart-card-header">
          <div className="chart-card-title">Top 15 LCs — IGV Performance</div>
          <span className="chart-tag tag-igv">IGV</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Local Chapter</th><th>Submissions</th><th>Opens</th><th>APDs</th><th>REs</th><th>Progress</th></tr>
            </thead>
            <tbody>
              {lcIgvTop.map((lc, i) => {
                const max = lcIgvTop[0]?.igv_res || 1;
                return (
                  <tr key={lc.lc}>
                    <td><span className={`rank-badge ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>{i + 1}</span></td>
                    <td><strong>{lc.lc}</strong></td>
                    <td className="secondary">{lc.igv_submissions.toLocaleString()}</td>
                    <td className="secondary">{lc.igv_opens.toLocaleString()}</td>
                    <td className="secondary">{lc.igv_apds.toLocaleString()}</td>
                    <td><strong style={{ color: '#4f8ef7' }}>{lc.igv_res.toLocaleString()}</strong></td>
                    <td>
                      <div className="prog-bar">
                        <div className="prog-fill" style={{ width: `${(lc.igv_res / max) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="chart-card section-gap">
        <div className="chart-card-header">
          <div className="chart-card-title">Fulfillment Rate by LC</div>
          <span className="chart-tag tag-igv">IGV</span>
        </div>
        <ResponsiveContainer width="100%" height={Math.max(320, fulfillment.length * 28)}>
          <BarChart data={fulfillment} layout="vertical" margin={{ left: 10, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4d" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#64748b', fontSize: 11 }} />
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
          <div className="legend-item"><div className="legend-dot" style={{ background: '#4f8ef7' }} />10–24% Fair</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#ef4444' }} />&lt; 10% Low</div>
        </div>
      </div>

      {radarData.length > 0 && (
        <div className="chart-card section-gap">
          <div className="chart-card-header">
            <div className="chart-card-title">LC Performance Radar — Top {radarCount}</div>
            <span className="chart-tag tag-igv">IGV</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>Show LCs:</span>
            <input type="range" min={3} max={allLcsSorted.length} value={radarCount}
              onChange={e => setRadarCount(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#4f8ef7' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#4f8ef7', minWidth: 28, textAlign: 'right' }}>{radarCount}</span>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(360, radarCount * 18)}>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="#1e2d4d" />
              {React.createElement(PolarAngleAxis as any, { dataKey: 'lc', tick: { fill: '#94a3b8', fontSize: radarCount > 20 ? 9 : 11 } })}
              <Radar name="REs" dataKey="REs" stroke="#4f8ef7" fill="#4f8ef7" fillOpacity={0.3} />
              <Radar name="APDs" dataKey="APDs" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

const dateInputStyle: React.CSSProperties = {
  background: '#141d35', border: '1px solid #1e2d4d', color: '#e2e8f0',
  borderRadius: 6, padding: '5px 10px', fontSize: 13,
  colorScheme: 'dark',
};
