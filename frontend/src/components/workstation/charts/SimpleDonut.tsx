const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

interface Segment { label: string; value: number; color?: string; }
interface Props { segments: Segment[]; title?: string; size?: number; }

export function SimpleDonut({ segments, title, size = 140 }: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="text-center text-xs text-muted-foreground">无数据</div>;
  const r = 45, cx = size / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="text-center">
      {title && <div className="text-xs font-semibold mb-1.5">{title}</div>}
      <div className="flex items-center justify-center gap-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${title || '设备分布'}环形图`}>
          <title>{title || '设备分布'}环形图</title>
          {segments.map((seg, i) => {
            const dash = (seg.value / total) * circ;
            const el = <circle key={i} cx={cx} cy={cx} r={r} fill="none" stroke={seg.color || COLORS[i % COLORS.length]} strokeWidth={18} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-offset} transform={`rotate(-90, ${cx}, ${cx})`} />;
            offset += dash;
            return el;
          })}
          <text x={cx} y={cx - 2} textAnchor="middle" fill="var(--foreground)" fontSize={16} fontWeight="bold">{total}</text>
          <text x={cx} y={cx + 11} textAnchor="middle" fill="var(--muted-foreground)" fontSize={10}>台设备</text>
        </svg>
        <div className="text-left space-y-1">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="size-2 shrink-0 rounded-sm" style={{ background: seg.color || COLORS[i % COLORS.length] }} />
              <span className="text-xs text-muted-foreground">{seg.label} ({seg.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
