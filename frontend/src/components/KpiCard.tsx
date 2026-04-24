import React from 'react';

interface KpiCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  sub?: string;
  color: string;
  iconBg: string;
}

export default function KpiCard({ icon, value, label, sub, color, iconBg }: KpiCardProps) {
  const formatted = typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <div className="kpi-card" style={{ '--accent-color': color } as React.CSSProperties}>
      <div className="kpi-icon" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="kpi-value">{formatted}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
