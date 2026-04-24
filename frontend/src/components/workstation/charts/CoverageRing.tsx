interface Props { covered: number; total: number; label: string; color?: string; size?: number; }

export function CoverageRing({ covered, total, label, color = 'var(--chart-1)', size = 120 }: Props) {
  const pct = total > 0 ? covered / total : 0;
  const r = (size - 20) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div className="text-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}覆盖率环形图`}>
        <title>{label}覆盖率环形图</title>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--muted)" strokeWidth={10} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round" transform={`rotate(-90, ${cx}, ${cx})`} />
        <text x={cx} y={cx - 4} textAnchor="middle" fill="var(--foreground)" fontSize={16} fontWeight="bold">{(pct * 100).toFixed(0)}%</text>
        <text x={cx} y={cx + 12} textAnchor="middle" fill="var(--muted-foreground)" fontSize={11}>{covered}/{total}</text>
      </svg>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
