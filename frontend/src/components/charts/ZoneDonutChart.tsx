import React from 'react';

const COLORS = ['#5ac8fa', '#34c759', '#ff9500', '#ff6b6b', '#af52de', '#007aff', '#ffcc00', '#636366'];

interface Props {
  data: { zone: string; count: number }[];
  total: number;
}

export function ZoneDonutChart({ data, total }: Props) {
  const radius = 60;
  const cx = 80, cy = 80;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((item, i) => {
    const pct = item.count / total;
    const dash = pct * circumference;
    const seg = { ...item, dash, offset, color: COLORS[i % COLORS.length], pct };
    offset += dash;
    return seg;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        {segments.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
            stroke={s.color} strokeWidth={20}
            strokeDasharray={`${s.dash} ${circumference}`}
            strokeDashoffset={-s.offset}
            transform={`rotate(-90, ${cx}, ${cy})`}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#333" fontSize={20} fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#999" fontSize={10}>台设备</text>
      </svg>
      <div>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#666' }}>{s.zone} ({(s.pct * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
