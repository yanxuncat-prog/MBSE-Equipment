import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Configuration } from '../../types';

const STATUS_CONFIG: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
  draft: { variant: 'secondary', label: '草稿' },
  baseline: { variant: 'default', label: '基线' },
  frozen: { variant: 'outline', label: '冻结' },
  archived: { variant: 'secondary', label: '归档' },
};

interface Props {
  configs: Configuration[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ConfigTimeline({ configs, activeId, onSelect }: Props) {
  return (
    <div className="space-y-0">
      {configs.map((c, index) => {
        const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
        const isActive = c.id === activeId;
        const isLast = index === configs.length - 1;
        return (
          <div key={c.id} className={cn("relative pl-6", isLast ? "pb-0" : "pb-4")}>
            {/* Timeline dot */}
            <div
              className={cn(
                "absolute left-0 top-3 size-3 rounded-full border-2 bg-background",
                isActive ? "border-primary" : "border-muted-foreground/30"
              )}
            />
            {/* Timeline connector line */}
            {!isLast && (
              <div className="absolute left-[5px] top-6 bottom-0 w-px bg-border" />
            )}
            {/* Content */}
            <div
              onClick={() => onSelect(c.id)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-2 transition-all border",
                isActive
                  ? "bg-primary/5 border-primary/30"
                  : "bg-transparent border-transparent hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("text-sm", isActive ? "font-semibold" : "font-medium")}>
                  {c.version}
                </span>
                <Badge variant={sc.variant}>{sc.label}</Badge>
                {c.status === 'baseline' && <Lock className="size-3.5 text-green-600" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {c.equipment_count} 台设备{c.description ? ` · ${c.description}` : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
