const COLORS = ['#5ac8fa', '#007aff', '#34c759', '#ff9500', '#ff6b6b', '#af52de', '#ffcc00', '#30b0c7', '#a2845e', '#636366'];

interface Props {
  data: { ata: string; count: number }[];
  total: number;
}

export function ATADistributionBar({ data }: Props) {
  const maxCount = data.length > 0 ? data[0].count : 1;

  return (
    <div>
      {data.map((item, i) => (
        <div key={item.ata} className="mb-1.5 flex items-center">
          <span className="mr-2 w-[52px] text-right text-[11px] text-muted-foreground">ATA-{item.ata}</span>
          <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
            <div
              className="h-full rounded transition-all duration-500"
              style={{ width: `${(item.count / maxCount) * 100}%`, background: COLORS[i % COLORS.length] }}
            />
          </div>
          <span className="ml-2 w-10 text-[11px] text-muted-foreground">{item.count}台</span>
        </div>
      ))}
    </div>
  );
}
