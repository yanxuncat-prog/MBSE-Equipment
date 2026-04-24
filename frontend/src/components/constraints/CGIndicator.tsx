
import type { ConstraintStatus } from '../../types';

interface Props {
  details: Record<string, any>;
  status: ConstraintStatus;
}

const STATUS_COLORS = { pass: '#34C759', warning: '#FF9500', blocked: '#FF3B30' };

export function CGIndicator({ details, status }: Props) {
  const totalMass = details.total_mass_kg || 0;
  const cgPct = details.cg_pct_mac || 0;
  const mtowMargin = details.mtow_margin_kg || 0;
  const mtowRatio = details.mtow_ratio_pct || 0;

  // CG bar: forward limit at 20%, aft limit at 40%, range 0-60% for display
  const barWidth = 230;
  const fwdLimit = 20;
  const aftLimit = 40;
  const displayRange = 60;
  const cgPos = Math.max(0, Math.min(displayRange, cgPct));
  const markerX = (cgPos / displayRange) * barWidth;
  const fwdX = (fwdLimit / displayRange) * barWidth;
  const aftX = (aftLimit / displayRange) * barWidth;
  const color = STATUS_COLORS[status] || STATUS_COLORS.pass;

  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span className="text-xs">重量: {totalMass.toFixed(1)} kg</span>
        <span className="text-xs">MTOW: {mtowRatio.toFixed(0)}%</span>
      </div>

      <svg width={barWidth} height={28} className="my-1 block" role="img" aria-label="重心指示器">
        <title>重心指示器</title>
        {/* Background */}
        <rect x={0} y={8} width={barWidth} height={12} rx={6} fill="var(--muted)" />
        {/* Safe zone */}
        <rect x={fwdX} y={8} width={aftX - fwdX} height={12} fill="var(--status-ok)" opacity={0.3} />
        {/* Forward limit */}
        <line x1={fwdX} y1={4} x2={fwdX} y2={24} stroke="var(--muted-foreground)" strokeWidth={1.5} />
        {/* Aft limit */}
        <line x1={aftX} y1={4} x2={aftX} y2={24} stroke="var(--muted-foreground)" strokeWidth={1.5} />
        {/* CG marker */}
        <circle cx={markerX} cy={14} r={5} fill={color} stroke="var(--primary-foreground)" strokeWidth={2} />
        {/* Labels */}
        <text x={fwdX} y={3} fontSize={8} textAnchor="middle" fill="var(--muted-foreground)">{fwdLimit}%</text>
        <text x={aftX} y={3} fontSize={8} textAnchor="middle" fill="var(--muted-foreground)">{aftLimit}%</text>
      </svg>

      <div className="flex justify-between">
        <span className="text-xs" style={{ color }}>CG: {cgPct.toFixed(1)}% MAC</span>
        <span className="text-xs text-muted-foreground">余量: {mtowMargin.toFixed(0)} kg</span>
      </div>
    </div>
  );
}
