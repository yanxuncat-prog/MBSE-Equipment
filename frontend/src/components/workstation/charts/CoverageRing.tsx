import React from 'react';

interface Props { covered: number; total: number; label: string; color?: string; size?: number; }

export function CoverageRing({ covered, total, label, color = '#34C759', size = 120 }: Props) {
  const pct = total > 0 ? covered / total : 0;
  const r = (size - 20) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f0f0f0" strokeWidth={10} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round" transform={`rotate(-90, ${cx}, ${cx})`} />
        <text x={cx} y={cx - 4} textAnchor="middle" fill="#333" fontSize={16} fontWeight="bold">{(pct * 100).toFixed(0)}%</text>
        <text x={cx} y={cx + 12} textAnchor="middle" fill="#999" fontSize={9}>{covered}/{total}</text>
      </svg>
      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
  );
}
