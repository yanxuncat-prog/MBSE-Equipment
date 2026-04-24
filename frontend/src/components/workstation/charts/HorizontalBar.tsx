const COLORS = ['#5ac8fa', '#007aff', '#34c759', '#ff9500', '#ff6b6b', '#af52de', '#ffcc00', '#30b0c7', '#a2845e', '#636366'];

interface BarItem { label: string; value: number; suffix?: string; }
interface Props { items: BarItem[]; title?: string; }

export function HorizontalBar({ items, title }: Props) {
  const max = items.length > 0 ? Math.max(...items.map(i => i.value)) : 1;

  return (
    <div>
      {title && <div className="mb-2 text-xs font-semibold">{title}</div>}
      {items.map((item, i) => (
        <div key={item.label} className="mb-1 flex items-center">
          <span className="mr-1.5 w-[60px] text-right text-xs text-muted-foreground">{item.label}</span>
          <div className="h-3.5 flex-1 overflow-hidden rounded bg-muted">
            <div
              className="h-full rounded"
              style={{ width: `${(item.value / max) * 100}%`, background: COLORS[i % COLORS.length], minWidth: item.value > 0 ? 2 : 0 }}
            />
          </div>
          <span className="ml-1.5 w-[50px] text-xs text-muted-foreground">{item.value}{item.suffix || ''}</span>
        </div>
      ))}
    </div>
  );
}
