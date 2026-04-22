import React from 'react';
import { cn } from '@/lib/utils';

interface StatsRowProps {
  children: React.ReactNode;
  className?: string;
}

export function StatsRow({ children, className }: StatsRowProps) {
  return (
    <div className={cn("grid auto-cols-fr grid-flow-col gap-3", className)}>
      {children}
    </div>
  );
}
