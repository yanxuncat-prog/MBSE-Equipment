import React from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: React.ReactNode;
  color?: string;
  className?: string;
}

export function StatsCard({ label, value, color, className }: StatsCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-3", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}
