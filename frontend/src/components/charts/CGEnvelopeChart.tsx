import React from 'react';

interface Props {
  cgPctMac: number;
  totalMassKg: number;
  mtowKg: number;
  fwdLimitPct: number;  // e.g., 20
  aftLimitPct: number;  // e.g., 40
  status: 'pass' | 'warning' | 'blocked';
  width?: number;
  height?: number;
}

const STATUS_COLORS = { pass: '#34C759', warning: '#FF9500', blocked: '#FF3B30' };

export function CGEnvelopeChart({
  cgPctMac, totalMassKg, mtowKg,
  fwdLimitPct = 20, aftLimitPct = 40,
  status, width = 320, height = 200,
}: Props) {
  // Chart area
  const pad = { top: 20, right: 30, bottom: 35, left: 55 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  // Scales: X = 0-60 %MAC, Y = 0 to mtowKg*1.1
  const xMin = 0, xMax = 60;
  const yMin = 0, yMax = mtowKg * 1.1;
  const sx = (v: number) => pad.left + ((v - xMin) / (xMax - xMin)) * cw;
  const sy = (v: number) => pad.top + ch - ((v - yMin) / (yMax - yMin)) * ch;

  // Envelope polygon points (simplified trapezoid)
  const envPoints = [
    [fwdLimitPct, 0],
    [fwdLimitPct - 2, mtowKg * 0.3],
    [fwdLimitPct - 3, mtowKg * 0.7],
    [fwdLimitPct, mtowKg],
    [aftLimitPct, mtowKg],
    [aftLimitPct + 3, mtowKg * 0.7],
    [aftLimitPct + 2, mtowKg * 0.3],
    [aftLimitPct, 0],
  ].map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ');

  const dotColor = STATUS_COLORS[status];
  const cx = sx(cgPctMac);
  const cy = sy(totalMassKg);

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {/* Envelope */}
      <polygon points={envPoints} fill="rgba(52,199,89,0.12)" stroke="#34C759" strokeWidth={1.5} strokeDasharray="4,2" />

      {/* MTOW line */}
      <line x1={pad.left} y1={sy(mtowKg)} x2={width - pad.right} y2={sy(mtowKg)}
            stroke="#FF3B30" strokeWidth={0.8} strokeDasharray="4,3" />
      <text x={width - pad.right + 4} y={sy(mtowKg) + 3} fill="#FF3B30" fontSize={8}>MTOW</text>

      {/* Axes */}
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} stroke="#666" strokeWidth={0.8} />
      <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} stroke="#666" strokeWidth={0.8} />

      {/* X axis labels */}
      {[0, 10, 20, 30, 40, 50, 60].map(v => (
        <text key={v} x={sx(v)} y={height - pad.bottom + 14} fill="#999" fontSize={8} textAnchor="middle">{v}%</text>
      ))}
      <text x={pad.left + cw / 2} y={height - 4} fill="#999" fontSize={9} textAnchor="middle">CG (%MAC)</text>

      {/* Y axis labels */}
      {[0, 0.25, 0.5, 0.75, 1.0].map(f => {
        const v = Math.round(mtowKg * f);
        return <text key={f} x={pad.left - 6} y={sy(v) + 3} fill="#999" fontSize={8} textAnchor="end">{v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}</text>;
      })}
      <text x={14} y={pad.top + ch / 2} fill="#999" fontSize={9} textAnchor="middle" transform={`rotate(-90, 14, ${pad.top + ch / 2})`}>重量 (kg)</text>

      {/* Forward/Aft limit labels */}
      <text x={sx(fwdLimitPct)} y={pad.top - 6} fill="#888" fontSize={8} textAnchor="middle">前限 {fwdLimitPct}%</text>
      <text x={sx(aftLimitPct)} y={pad.top - 6} fill="#888" fontSize={8} textAnchor="middle">后限 {aftLimitPct}%</text>

      {/* Current CG point */}
      <circle cx={cx} cy={cy} r={7} fill={dotColor} stroke="#fff" strokeWidth={2} />
      <text x={cx + 12} y={cy - 4} fill={dotColor} fontSize={9} fontWeight="bold">{cgPctMac.toFixed(1)}%</text>
      <text x={cx + 12} y={cy + 8} fill="#999" fontSize={8}>{totalMassKg.toFixed(0)} kg</text>
    </svg>
  );
}
