import { Database, LayoutList, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  total: number;
  viewMode: 'table' | 'card';
  onViewModeChange: (m: 'table' | 'card') => void;
}

export function LibraryToolbar({ total, viewMode, onViewModeChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Database className="size-5 text-primary" />
        <h2 className="text-base font-semibold">设备库清单</h2>
        <Badge variant="secondary" className="text-xs">{total} 种</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">型号:</span>
        <span className="text-xs bg-background border rounded px-2 py-0.5">CE-25A</span>
        <div className="flex border rounded overflow-hidden ml-2">
          <button
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-1 px-3 py-1 text-xs transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
          >
            <LayoutList className="size-3.5" /> 表单
          </button>
          <button
            onClick={() => onViewModeChange('card')}
            className={`flex items-center gap-1 px-3 py-1 text-xs transition-colors ${viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
          >
            <LayoutGrid className="size-3.5" /> 卡片
          </button>
        </div>
      </div>
    </div>
  );
}
