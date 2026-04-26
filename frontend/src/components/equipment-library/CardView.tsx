import { useState } from 'react';
import { Check, X, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ATTR_GROUPS, computeFillRate } from './column-defs';
import { KnowledgePanel } from './KnowledgePanel';
import type { LibraryEquipment } from '@/api/equipment-library';

function BoolIcon({ value }: { value: boolean | null | undefined }) {
  if (value === true) return <Check className="size-3 text-green-600 inline" />;
  if (value === false) return <X className="size-3 text-muted-foreground/40 inline" />;
  return <span className="text-muted-foreground/30">-</span>;
}

function AttrValue({ value }: { value: any }) {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground/30">未填写</span>;
  if (typeof value === 'boolean') return <BoolIcon value={value} />;
  if (typeof value === 'number') return <span className="tabular-nums">{value}</span>;
  return <span>{String(value)}</span>;
}

interface Props {
  items: LibraryEquipment[];
  onConfirmOne: (id: string) => void;
  showActions: boolean;
}

export function CardView({ items, onConfirmOne, showActions }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [knowledgeKey, setKnowledgeKey] = useState<string | null>(null);

  return (
    <>
      {expandedId ? (
        // Expanded detail card
        <ExpandedCard
          item={items.find(i => i.id === expandedId)!}
          onClose={() => setExpandedId(null)}
          onConfirm={onConfirmOne}
          onKnowledge={setKnowledgeKey}
          showActions={showActions}
        />
      ) : (
        // Grid view
        <div className="grid grid-cols-3 gap-3">
          {items.map(item => (
            <SummaryCard key={item.id} item={item} onClick={() => setExpandedId(item.id)} />
          ))}
          {items.length === 0 && (
            <div className="col-span-3 py-12 text-center text-muted-foreground">暂无数据</div>
          )}
        </div>
      )}

      <KnowledgePanel fieldKey={knowledgeKey} open={knowledgeKey !== null} onClose={() => setKnowledgeKey(null)} />
    </>
  );
}

function SummaryCard({ item, onClick }: { item: LibraryEquipment; onClick: () => void }) {
  const fill = computeFillRate(item as any);
  const fillColor = fill >= 80 ? 'bg-green-100 text-green-700' : fill >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';

  return (
    <div
      onClick={onClick}
      className="border rounded-lg p-3 bg-card cursor-pointer hover:shadow-md transition-shadow relative"
    >
      <div className="absolute top-2 right-2">
        <Badge variant={item.library_status === 'valid' ? 'default' : 'secondary'}
          className={`text-[9px] ${item.library_status === 'valid' ? 'bg-green-600' : 'bg-amber-500 text-white'}`}>
          {item.library_status === 'valid' ? 'Valid' : 'Draft'}
        </Badge>
      </div>
      <div className="font-semibold text-sm mb-0.5 pr-14 truncate">{item.name}</div>
      <div className="font-mono text-[10px] text-muted-foreground mb-2">{item.part_number}</div>
      <div className="grid grid-cols-2 gap-1 text-[11px]">
        <div><span className="text-muted-foreground">ATA:</span> {item.ata_chapter}</div>
        <div><span className="text-muted-foreground">类型:</span> {item.equipment_type}</div>
        <div><span className="text-muted-foreground">电压:</span> {item.power_voltage || <span className="text-muted-foreground/30">-</span>}</div>
        <div><span className="text-muted-foreground">功耗:</span> {item.power_kva_normal?.toFixed(1) ?? <span className="text-muted-foreground/30">-</span>}</div>
      </div>
      <div className="mt-2 pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground">
        <span>属性完成度</span>
        <span className={`px-1.5 rounded ${fillColor}`}>{fill}%</span>
      </div>
    </div>
  );
}

function ExpandedCard({ item, onClose, onConfirm, onKnowledge, showActions }: {
  item: LibraryEquipment;
  onClose: () => void;
  onConfirm: (id: string) => void;
  onKnowledge: (key: string) => void;
  showActions: boolean;
}) {
  return (
    <div className="border-2 border-primary/30 rounded-xl p-5 bg-card shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold">{item.name}</div>
          <div className="font-mono text-xs text-muted-foreground">
            {item.part_number} · ATA-{item.ata_chapter} · {item.equipment_type}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={item.library_status === 'valid' ? 'default' : 'secondary'}
            className={`text-[10px] ${item.library_status === 'valid' ? 'bg-green-600' : 'bg-amber-500 text-white'}`}>
            {item.library_status === 'valid' ? 'Valid' : 'Draft'}
          </Badge>
          {showActions && item.library_status === 'draft' && (
            <Button size="sm" onClick={() => onConfirm(item.id)}>确认入库</Button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none cursor-pointer">✕</button>
        </div>
      </div>

      {/* Attribute groups in 2-col grid */}
      <div className="grid grid-cols-2 gap-3">
        {ATTR_GROUPS.filter(g => g.key !== 'identity').map(group => (
          <div key={group.key} className="border rounded-lg p-3">
            <div className={`font-semibold text-xs mb-2 ${group.color}`}>
              {group.icon} {group.label}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              {group.columns.filter(c => c.key !== 'part_number' && c.key !== 'name').map(col => (
                <div key={col.key} className="flex items-center gap-0.5">
                  <span className="text-muted-foreground shrink-0">{col.label}:</span>
                  <span className="truncate"><AttrValue value={(item as any)[col.key]} /></span>
                  <button onClick={() => onKnowledge(col.key)} className="text-blue-400 hover:text-blue-600 shrink-0 cursor-pointer">
                    <Info className="size-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Back to grid */}
      <div className="mt-3 text-center">
        <Button variant="ghost" size="sm" onClick={onClose}>← 返回列表</Button>
      </div>
    </div>
  );
}
