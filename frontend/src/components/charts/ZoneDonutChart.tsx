interface Props {
  data: { zone: string; count: number }[];
  total: number;
}

const CHART_VARS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export function ZoneDonutChart({ data, total }: Props) {
  const radius = 60;
  const cx = 80, cy = 80;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((item, i) => {
    const pct = item.count / total;
    const dash = pct * circumference;
    const seg = { ...item, dash, offset, color: CHART_VARS[i % CHART_VARS.length], pct };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={160} height={160} viewBox="0 0 160 160" role="img" aria-label="区域分布环形图">
        <title>区域分布环形图</title>
        {segments.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
            stroke={s.color} strokeWidth={18}
            strokeDasharray={`${s.dash} ${circumference}`}
            strokeDashoffset={-s.offset}
            transform={`rotate(-90, ${cx}, ${cy})`}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--foreground)" fontSize={20} fontWeight="600">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--muted-foreground)" fontSize={10}>台设备</text>
      </svg>
      <div className="space-y-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-muted-foreground">{s.zone} ({(s.pct * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
