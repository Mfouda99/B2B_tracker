import React from 'react';
import { FileText, Building2, BarChart3 } from 'lucide-react';

export type Page = 'igv' | 'igte' | 'contracts';

interface NavbarProps {
  page: Page;
  setPage: (p: Page) => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'igv', label: 'IGV Tracker', icon: <FileText size={14} /> },
  { id: 'igte', label: 'IGTa/e Tracker', icon: <Building2 size={14} /> },
  { id: 'contracts', label: 'Contracts', icon: <BarChart3 size={14} /> },
];

export default function Navbar({ page, setPage }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img
          src="https://aiesec-logos.s3.eu-west-1.amazonaws.com/White%20Watermark%20-%20Blue%20AIESEC%20Human.png"
          alt="AIESEC"
          style={{ width: 40, height: 40, objectFit: 'contain' }}
        />
        <div>
          <div className="navbar-title">B2B Tracker</div>
          <div className="navbar-subtitle">AIESEC Egypt · Live Analytics</div>
        </div>
      </div>

      <ul className="navbar-nav">
        {NAV_ITEMS.map(item => (
          <li key={item.id}>
            <button
              className={page === item.id ? 'active' : ''}
              onClick={() => setPage(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <span className="navbar-badge">LIVE</span>
    </nav>
  );
}
