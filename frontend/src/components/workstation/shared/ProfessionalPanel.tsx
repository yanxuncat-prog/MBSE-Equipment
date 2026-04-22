import React from 'react';
import { cn } from '@/lib/utils';

interface ProfessionalPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function ProfessionalPanel({ children, className }: ProfessionalPanelProps) {
  return (
    <div className={cn("w-[280px] shrink-0 space-y-4 overflow-y-auto", className)}>
      {children}
    </div>
  );
}
