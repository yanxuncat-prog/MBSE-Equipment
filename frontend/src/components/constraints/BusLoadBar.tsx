import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  busName: string;
  loadKva: number;
  capacityKva: number;
  loadRatioPct: number;
}

export function BusLoadBar({ busName, loadKva, capacityKva, loadRatioPct }: Props) {
  const pct = Math.min(loadRatioPct, 100);
  const color =
    loadRatioPct > 100
      ? 'bg-destructive'
      : loadRatioPct > 85
        ? 'bg-yellow-500'
        : 'bg-green-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{busName}</span>
        <span className={cn('text-muted-foreground', loadRatioPct > 100 && 'text-destructive', loadRatioPct > 85 && loadRatioPct <= 100 && 'text-yellow-600')}>
          {loadKva.toFixed(1)}/{capacityKva.toFixed(0)} kVA
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
