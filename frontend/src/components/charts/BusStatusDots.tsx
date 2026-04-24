import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle } from '@/components/ui/popover';

interface BusInfo {
  bus_name: string;
  load_kva: number;
  capacity_kva: number;
  load_ratio_pct: number;
}

interface Props {
  buses: Record<string, BusInfo>;
}

export function BusStatusDots({ buses }: Props) {
  const entries = Object.entries(buses);

  return (
    <div className="flex flex-wrap gap-3">
      {entries.map(([id, bus]) => {
        const pct = Math.min(bus.load_ratio_pct, 100);
        const dotClass = bus.load_ratio_pct > 100
          ? 'bg-status-danger'
          : bus.load_ratio_pct > 85
            ? 'bg-status-warn'
            : 'bg-status-ok';
        const textClass = bus.load_ratio_pct > 100
          ? 'text-status-danger'
          : bus.load_ratio_pct > 85
            ? 'text-status-warn'
            : 'text-status-ok';
        const barClass = bus.load_ratio_pct > 100
          ? 'bg-status-danger'
          : bus.load_ratio_pct > 85
            ? 'bg-status-warn'
            : 'bg-status-ok';
        const shortName = bus.bus_name.replace('BUS ', '').replace(' ', '');

        return (
          <Popover key={id}>
            <PopoverTrigger>
              <div className="cursor-pointer text-center">
                <div className={cn('size-5 rounded-full', dotClass)} />
                <div className="mt-0.5 text-xs text-muted-foreground">{shortName}</div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[200px]">
              <PopoverHeader>
                <PopoverTitle>{bus.bus_name}</PopoverTitle>
              </PopoverHeader>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full transition-all', barClass)} style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-muted-foreground">{bus.load_kva.toFixed(1)} / {bus.capacity_kva.toFixed(0)} kVA</span>
                <span className={textClass}>余量 {(bus.capacity_kva - bus.load_kva).toFixed(1)}</span>
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
