import React, { useEffect, useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { api } from '../api';

type TableKey = 'igv_submissions' | 'igte_submissions' | 'igv_contracts' | 'igte_contracts';

const TABLE_CONFIGS: { key: TableKey; label: string; tag: string; tagClass: string; fetcher: () => Promise<any> }[] = [
  { key: 'igv_submissions', label: 'IGV Submissions', tag: 'IGV', tagClass: 'tag-igv', fetcher: api.igvSubmissions },
  { key: 'igte_submissions', label: 'IGTa/e Submissions', tag: 'IGTa/e', tagClass: 'tag-igte', fetcher: api.igteSubmissions },
  { key: 'igv_contracts', label: 'IGV Contracts', tag: 'IGV', tagClass: 'tag-igv', fetcher: api.igvContracts },
  { key: 'igte_contracts', label: 'IGTa/e Contracts', tag: 'IGTa/e', tagClass: 'tag-igte', fetcher: api.igteContracts },
];

function StatusPill({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  if (s === 'open') return <span className="pill pill-open">open</span>;
  if (s.includes('un_publish') || s.includes('unpublish')) return <span className="pill pill-unpublish">unpublished</span>;
  return <span className="pill pill-default">{status || '—'}</span>;
}

function DataTable({ data, loading }: { data: any[]; loading: boolean }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const columns = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)));
  }, [data, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusCols = columns.filter(c => c.toLowerCase().includes('status'));

  if (loading) return <div className="loading-state"><div className="spinner" /><span>Loading...</span></div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div className="search-bar">
          <Search size={14} color="#64748b" />
          <input
            placeholder="Search all columns..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {filtered.length.toLocaleString()} rows · page {page} of {totalPages}
        </span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col} className={statusCols.includes(col) ? '' : 'secondary'}>
                    {statusCols.includes(col) ? <StatusPill status={row[col]} /> : row[col] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          <button style={btnStyle} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const p = page <= 4 ? i + 1 : page + i - 3;
            if (p < 1 || p > totalPages) return null;
            return (
              <button key={p} style={{ ...btnStyle, ...(p === page ? activeBtnStyle : {}) }} onClick={() => setPage(p)}>{p}</button>
            );
          })}
          <button style={btnStyle} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: '#141d35', border: '1px solid #1e2d4d', color: '#94a3b8',
  borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12,
};
const activeBtnStyle: React.CSSProperties = { background: '#1a2540', color: '#4f8ef7', borderColor: '#4f8ef7' };

export default function TablesPage() {
  const [activeTable, setActiveTable] = useState<TableKey>('igv_submissions');
  const [tableData, setTableData] = useState<Record<TableKey, any[]>>({
    igv_submissions: [], igte_submissions: [], igv_contracts: [], igte_contracts: []
  });
  const [loading, setLoading] = useState<Record<TableKey, boolean>>({
    igv_submissions: false, igte_submissions: false, igv_contracts: false, igte_contracts: false
  });

  useEffect(() => {
    const cfg = TABLE_CONFIGS.find(t => t.key === activeTable)!;
    if (tableData[activeTable].length > 0) return;
    setLoading(prev => ({ ...prev, [activeTable]: true }));
    cfg.fetcher().then(data => {
      setTableData(prev => ({ ...prev, [activeTable]: data }));
      setLoading(prev => ({ ...prev, [activeTable]: false }));
    }).catch(() => setLoading(prev => ({ ...prev, [activeTable]: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTable]);

  const active = TABLE_CONFIGS.find(t => t.key === activeTable)!;

  return (
    <div>
      <div className="page-header">
        <h1>Raw <span className="gradient-text">Data Tables</span></h1>
        <p>Browse, search and explore all raw data from Google Sheets</p>
      </div>

      <div className="tabs">
        {TABLE_CONFIGS.map(cfg => (
          <button key={cfg.key} className={activeTable === cfg.key ? 'active' : ''} onClick={() => setActiveTable(cfg.key)}>
            {cfg.label}
            {tableData[cfg.key].length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 10, color: '#64748b' }}>({tableData[cfg.key].length.toLocaleString()})</span>
            )}
          </button>
        ))}
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <div className="chart-card-title">{active.label}</div>
            <div className="chart-card-sub">{tableData[activeTable].length.toLocaleString()} records from Google Sheets</div>
          </div>
          <span className={`chart-tag ${active.tagClass}`}>{active.tag}</span>
        </div>
        <DataTable data={tableData[activeTable]} loading={loading[activeTable]} />
      </div>
    </div>
  );
}
