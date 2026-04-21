import React from 'react';
const COLORS = ['#34c759', '#5ac8fa', '#ff9500', '#ff6b6b', '#af52de', '#007aff', '#ffcc00', '#636366'];

interface Segment { label: string; value: number; color?: string; }
interface Props { segments: Segment[]; title?: string; size?: number; }

export function SimpleDonut({ segments, title, size = 140 }: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div style={{ textAlign: 'center', color: '#ccc', fontSize: 12 }}>无数据</div>;
  const r = 45, cx = size / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ textAlign: 'center' }}>
      {title && <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{title}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((seg, i) => {
            const dash = (seg.value / total) * circ;
            const el = <circle key={i} cx={cx} cy={cx} r={r} fill="none" stroke={seg.color || COLORS[i % COLORS.length]} strokeWidth={18} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-offset} transform={`rotate(-90, ${cx}, ${cx})`} />;
            offset += dash;
            return el;
          })}
          <text x={cx} y={cx - 2} textAnchor="middle" fill="#333" fontSize={16} fontWeight="bold">{total}</text>
          <text x={cx} y={cx + 11} textAnchor="middle" fill="#999" fontSize={8}>台设备</text>
        </svg>
        <div style={{ textAlign: 'left' }}>
          {segments.map((seg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color || COLORS[i % COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#666' }}>{seg.label} ({seg.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
