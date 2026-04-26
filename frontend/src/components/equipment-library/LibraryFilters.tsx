import { useState, useRef, useEffect } from 'react';
import { CheckCheck, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ATAOption } from '@/api/equipment-library';

type StatusTab = 'all' | 'draft' | 'valid';

interface Props {
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

export function LibraryFilters({ ataOptions, selectedATAs, onATAChange, statusTab, onStatusChange, draftCount, validCount, selectedCount, onBatchConfirm }: Props) {
  const [ataOpen, setAtaOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!ataOpen) return;
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setAtaOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ataOpen]);

  const toggleATA = (ata: string) => {
    if (selectedATAs.includes(ata)) {
      onATAChange(selectedATAs.filter(a => a !== ata));
    } else {
      onATAChange([...selectedATAs, ata]);
    }
  };

  const allSelected = selectedATAs.length === 0 || selectedATAs.length === ataOptions.length;
  const ataLabel = allSelected ? '全部章节' : `${selectedATAs.length} 个ATA`;

  return (
    <div className="flex items-center gap-3 px-1 py-1">
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
          <div className="absolute z-50 top-full mt-1 left-0 w-56 max-h-64 overflow-y-auto bg-popover border rounded-lg shadow-lg p-2">
            <button
              className="w-full text-left text-xs px-2 py-1 hover:bg-muted rounded mb-1 text-blue-600 cursor-pointer"
              onClick={() => { onATAChange([]); }}
            >
              {allSelected ? '取消全选' : '全选'}
            </button>
            {ataOptions.map(opt => (
              <label key={opt.ata} className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded cursor-pointer text-xs">
                <Checkbox
                  checked={allSelected || selectedATAs.includes(opt.ata)}
                  onCheckedChange={() => {
                    if (allSelected) {
                      // Switch from "all" to "all except this one"
                      onATAChange(ataOptions.map(o => o.ata).filter(a => a !== opt.ata));
                    } else {
                      toggleATA(opt.ata);
                    }
                  }}
                />
                <span>ATA-{opt.ata}</span>
                <span className="text-muted-foreground ml-auto">({opt.count})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Status tabs */}
      <span className="text-xs text-muted-foreground ml-2">状态:</span>
      <div className="flex gap-0.5">
        {([
          { key: 'all' as StatusTab, label: '全部' },
          { key: 'draft' as StatusTab, label: `待确认 (${draftCount})` },
          { key: 'valid' as StatusTab, label: `已入库 (${validCount})` },
        ]).map(t => (
          <button key={t.key} onClick={() => onStatusChange(t.key)}
            className={`px-3 py-1 text-xs font-medium border-b-2 transition-colors cursor-pointer ${statusTab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >{t.label}</button>
        ))}
      </div>

      {/* Batch confirm */}
      {statusTab !== 'valid' && selectedCount > 0 && (
        <div className="ml-auto">
          <Button size="sm" onClick={onBatchConfirm}>
            <CheckCheck className="size-3.5 mr-1" /> 批量确认 ({selectedCount})
          </Button>
        </div>
      )}
    </div>
  );
}
