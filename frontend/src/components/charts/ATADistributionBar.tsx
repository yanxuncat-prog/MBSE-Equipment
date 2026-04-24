interface Props {
  data: { ata: string; count: number }[];
  total: number;
}

export function ATADistributionBar({ data }: Props) {
  const maxCount = data.length > 0 ? data[0].count : 1;

  return (
    <div>
      {data.map((item, i) => {
        const opacity = Math.max(0.35, 1 - i * 0.07);
        return (
          <div key={item.ata} className="mb-1.5 flex items-center">
            <span className="mr-2 w-[52px] text-right text-xs text-muted-foreground">ATA-{item.ata}</span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
              <div
                className="h-full rounded bg-chart-1 transition-all duration-500"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  opacity,
                }}
              />
            </div>
            <span className="ml-2 w-10 text-xs text-muted-foreground">{item.count}台</span>
          </div>
        );
      })}
    </div>
  );
}
