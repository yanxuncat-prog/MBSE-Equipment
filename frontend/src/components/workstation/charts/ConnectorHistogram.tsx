interface Props { equipment: { connector_count: number | null }[]; }

export function ConnectorHistogram({ equipment }: Props) {
  const buckets: Record<string, number> = { '0': 0, '1': 0, '2-3': 0, '4-5': 0, '6+': 0, '未知': 0 };
  for (const e of equipment) {
    const c = e.connector_count;
    if (c == null) buckets['未知']++;
    else if (c === 0) buckets['0']++;
    else if (c === 1) buckets['1']++;
    else if (c <= 3) buckets['2-3']++;
    else if (c <= 5) buckets['4-5']++;
    else buckets['6+']++;
  }
  const max = Math.max(...Object.values(buckets), 1);
  const colors = ['#e0e0e0', '#5ac8fa', '#34c759', '#ff9500', '#ff6b6b', '#999'];

  return (
    <div>
      <div className="mb-2 text-xs font-semibold">连接器数分布</div>
      {Object.entries(buckets).map(([label, count], i) => (
        <div key={label} className="mb-1 flex items-center">
          <span className="mr-1.5 w-8 text-right text-xs text-muted-foreground">{label}</span>
          <div className="h-3.5 flex-1 overflow-hidden rounded bg-muted">
            <div className="h-full rounded" style={{ width: `${(count / max) * 100}%`, background: colors[i % colors.length] }} />
          </div>
          <span className="ml-1 w-[30px] text-xs text-muted-foreground">{count}</span>
        </div>
      ))}
    </div>
  );
}
