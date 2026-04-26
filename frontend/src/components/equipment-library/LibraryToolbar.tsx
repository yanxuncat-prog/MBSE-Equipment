import { useState, useRef, useEffect } from 'react';
import { Database, LayoutList, LayoutGrid, ChevronDown, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ATAOption } from '@/api/equipment-library';

type StatusTab = 'all' | 'draft' | 'valid';

interface Props {
  total: number;
  viewMode: 'table' | 'card';
  onViewModeChange: (m: 'table' | 'card') => void;
  ataOptions: ATAOption[];
  selectedATAs: string[];
  onATAChange: (atas: string[]) => void;
  statusTab: StatusTab;
  onStatusChange: (s: StatusTab) => void;
  draftCount: number;
  validCount: number;
  selectedCount: number;
  onBatchConfirm: () => void;
}

export function LibraryToolbar({
  total, viewMode, onViewModeChange,
  ataOptions, selectedATAs, onATAChange,
  statusTab, onStatusChange,
  draftCount, validCount,
  selectedCount, onBatchConfirm,
}: Props) {
  const [ataOpen, setAtaOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ataOpen) return;
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setAtaOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ataOpen]);

  const toggleATA = (ata: string) => {
    if (selectedATAs.includes(ata)) onATAChange(selectedATAs.filter(a => a !== ata));
    else onATAChange([...selectedATAs, ata]);
  };

  const allSelected = selectedATAs.length === 0 || selectedATAs.length === ataOptions.length;
  const ataLabel = allSelected ? '全部章节' : `${selectedATAs.length} 个ATA`;

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg flex-wrap">
      {/* Title */}
      <Database className="size-4 text-primary shrink-0" />
      <h2 className="text-sm font-semibold shrink-0">设备库</h2>
      <Badge variant="secondary" className="text-[10px]">{total}</Badge>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Program */}
      <span className="text-xs text-muted-foreground">型号:</span>
      <span className="text-xs bg-background border rounded px-2 py-0.5">CE-25A</span>

      <div className="w-px h-5 bg-border mx-1" />

      {/* ATA multi-select */}
      <div className="relative" ref={popRef}>
        <span className="text-xs text-muted-foreground mr-1">ATA:</span>
        <button
          onClick={() => setAtaOpen(!ataOpen)}
          className="inline-flex items-center gap-1 bg-background border rounded px-2 py-0.5 text-xs hover:bg-muted cursor-pointer"
        >
          {ataLabel} <ChevronDown className="size-3" />
        </button>
        {ataOpen && (
          <div className="absolute z-50 top-full mt-1 left-0 w-52 max-h-60 overflow-y-auto bg-popover border rounded-lg shadow-lg p-2">
            <button
              className="w-full text-left text-xs px-2 py-1 hover:bg-muted rounded mb-1 text-blue-600 cursor-pointer"
              onClick={() => onATAChange([])}
            >
              {allSelected ? '取消全选' : '全选'}
            </button>
            {ataOptions.map(opt => (
              <label key={opt.ata} className="flex items-center gap-2 px-2 py-0.5 hover:bg-muted rounded cursor-pointer text-xs">
                <Checkbox
                  checked={allSelected || selectedATAs.includes(opt.ata)}
                  onCheckedChange={() => {
                    if (allSelected) onATAChange(ataOptions.map(o => o.ata).filter(a => a !== opt.ata));
                    else toggleATA(opt.ata);
                  }}
                />
                <span>ATA-{opt.ata}</span>
                <span className="text-muted-foreground ml-auto">({opt.count})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Status */}
      <div className="flex gap-0.5">
        {([
          { key: 'all' as StatusTab, label: '全部' },
          { key: 'draft' as StatusTab, label: `待确认(${draftCount})` },
          { key: 'valid' as StatusTab, label: `已入库(${validCount})` },
        ]).map(t => (
          <button key={t.key} onClick={() => onStatusChange(t.key)}
            className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${statusTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >{t.label}</button>
        ))}
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      {/* View toggle */}
      <div className="flex border rounded overflow-hidden">
        <button onClick={() => onViewModeChange('table')}
          className={`flex items-center gap-1 px-2 py-0.5 text-xs transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
        ><LayoutList className="size-3" /> 表单</button>
        <button onClick={() => onViewModeChange('card')}
          className={`flex items-center gap-1 px-2 py-0.5 text-xs transition-colors cursor-pointer ${viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
        ><LayoutGrid className="size-3" /> 卡片</button>
      </div>

      {/* Batch confirm (right-aligned) */}
      {statusTab !== 'valid' && selectedCount > 0 && (
        <div className="ml-auto">
          <Button size="sm" className="h-6 text-xs" onClick={onBatchConfirm}>
            <CheckCheck className="size-3 mr-1" /> 批量确认({selectedCount})
          </Button>
        </div>
      )}
    </div>
  );
}
