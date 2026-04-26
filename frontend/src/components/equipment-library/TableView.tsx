import { useState, useMemo } from 'react';
import { Check, X, Info, Pencil, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ATTR_GROUPS } from './column-defs';
import { KnowledgePanel } from './KnowledgePanel';
import type { LibraryEquipment } from '@/api/equipment-library';

interface WarningEntry { field: string; label: string; type: string; detail: string; }

function parseWarnings(raw: string | null): WarningEntry[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function BoolIcon({ value }: { value: boolean | null | undefined }) {
  if (value === true) return <Check className="size-3.5 text-green-600" />;
  if (value === false) return <X className="size-3.5 text-muted-foreground/40" />;
  return <span className="text-muted-foreground/30">-</span>;
}

function CellValue({ value, mono }: { value: any; mono?: boolean }) {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground/30">-</span>;
  if (typeof value === 'boolean') return <BoolIcon value={value} />;
  if (typeof value === 'number') return <span className="tabular-nums">{value}</span>;
  return <span className={mono ? 'font-mono text-[10px]' : ''}>{String(value)}</span>;
}

interface Props {
  items: LibraryEquipment[];
  attrGroup: string;
  onAttrGroupChange: (g: string) => void;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onConfirmOne: (id: string) => void;
  onEdit: (id: string, group?: string) => void;
  onDelete: (id: string) => void;
  showActions: boolean;
}

export function TableView({ items, attrGroup, onAttrGroupChange, selected, onToggleSelect, onSelectAll, onConfirmOne, onEdit, onDelete, showActions }: Props) {
  const [colSearch, setColSearch] = useState<Record<string, string>>({});
  const [knowledgeKey, setKnowledgeKey] = useState<string | null>(null);

  const group = ATTR_GROUPS.find(g => g.key === attrGroup) || ATTR_GROUPS[0];

  const filtered = useMemo(() => {
    const activeFilters = Object.entries(colSearch).filter(([, v]) => v.trim());
    if (activeFilters.length === 0) return items;
    return items.filter(item =>
      activeFilters.every(([key, search]) => {
        const val = (item as any)[key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(search.toLowerCase());
      })
    );
  }, [items, colSearch]);

  const draftItems = filtered.filter(i => i.library_status === 'draft');

  // Pre-parse warnings for all items: Map<itemId, Set<fieldKey>>
  const warningMap = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    for (const item of items) {
      const ws = parseWarnings(item.warnings);
      if (ws.length > 0) {
        const fieldMap = new Map<string, string>();
        for (const w of ws) fieldMap.set(w.field, w.detail);
        map.set(item.id, fieldMap);
      }
    }
    return map;
  }, [items]);

  // Count warnings per group for tab badges
  const groupWarningCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of ATTR_GROUPS) counts[g.key] = 0;
    for (const [, fieldMap] of warningMap) {
      for (const [fieldKey] of fieldMap) {
        for (const g of ATTR_GROUPS) {
          if (g.columns.some(c => c.key === fieldKey)) { counts[g.key]++; break; }
        }
      }
    }
    return counts;
  }, [warningMap]);

  return (
    <>
      {/* Attribute group tabs */}
      <div className="flex gap-1 mb-3">
        {ATTR_GROUPS.map(g => (
          <button key={g.key} onClick={() => { onAttrGroupChange(g.key); setColSearch({}); }}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors inline-flex items-center gap-1 ${attrGroup === g.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            {g.icon} {g.label}
            {groupWarningCounts[g.key] > 0 && (
              <span className={`text-[9px] px-1 rounded ${attrGroup === g.key ? 'bg-amber-300 text-amber-900' : 'bg-amber-100 text-amber-600'}`}>
                {groupWarningCounts[g.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: 'auto' }}>
          <thead>
            <tr className="border-b bg-muted/50">
              {showActions && (
                <th className="px-2 py-2 w-8">
                  <Checkbox checked={selected.size > 0 && selected.size === draftItems.length} onCheckedChange={onSelectAll} />
                </th>
              )}
              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">操作</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">状态</th>
              {group.columns.map(col => (
                <th key={col.key} className="px-2 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                  <span className="inline-flex items-center gap-0.5">
                    {col.label}
                    <button onClick={() => setKnowledgeKey(col.key)} className="text-blue-400 hover:text-blue-600 cursor-pointer">
                      <Info className="size-3" />
                    </button>
                  </span>
                </th>
              ))}
            </tr>
            {/* Column search row */}
            <tr className="border-b bg-amber-50/50">
              {showActions && <td className="px-2 py-1" />}
              <td className="px-2 py-1" />
              <td className="px-2 py-1" />
              {group.columns.map(col => (
                <td key={col.key} className="px-1 py-1">
                  {col.searchable ? (
                    <Input className="h-6 text-xs px-1.5 border-amber-200" placeholder="🔍"
                      value={colSearch[col.key] || ''} onChange={e => setColSearch(prev => ({ ...prev, [col.key]: e.target.value }))} />
                  ) : null}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const itemWarnings = warningMap.get(item.id);
              return (
                <tr key={item.id} className={`border-b last:border-0 transition-colors ${selected.has(item.id) ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                  {showActions && (
                    <td className="px-2 py-1.5">
                      {item.library_status === 'draft' && <Checkbox checked={selected.has(item.id)} onCheckedChange={() => onToggleSelect(item.id)} />}
                    </td>
                  )}
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1 justify-center">
                      <button onClick={() => onEdit(item.id)} className="text-blue-500 hover:text-blue-700 cursor-pointer" title="编辑">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => onDelete(item.id)} className="text-red-400 hover:text-red-600 cursor-pointer" title="删除">
                        <Trash2 className="size-3.5" />
                      </button>
                      {item.library_status === 'draft' && (
                        <button onClick={() => onConfirmOne(item.id)} className="text-green-500 hover:text-green-700 cursor-pointer" title="确认入库">
                          <CheckCircle className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-left">
                    <Badge variant={item.library_status === 'valid' ? 'default' : 'secondary'}
                      className={`text-[10px] ${item.library_status === 'valid' ? 'bg-green-600' : 'bg-amber-500 text-white'}`}>
                      {item.library_status === 'valid' ? 'Valid' : 'Draft'}
                    </Badge>
                  </td>
                  {group.columns.map(col => {
                    const warning = itemWarnings?.get(col.key);
                    return (
                      <td key={col.key} className="px-2 py-1.5 text-xs text-left">
                        <span className="inline-flex items-center gap-0.5">
                          <span className="truncate max-w-[180px]"><CellValue value={(item as any)[col.key]} mono={col.mono} /></span>
                          {warning && (
                            <button
                              onClick={() => onEdit(item.id, attrGroup)}
                              className="text-amber-500 hover:text-amber-700 cursor-pointer shrink-0"
                              title={warning}
                            >
                              <AlertTriangle className="size-3" />
                            </button>
                          )}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={group.columns.length + 3} className="px-2 py-12 text-center text-muted-foreground">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <KnowledgePanel fieldKey={knowledgeKey} open={knowledgeKey !== null} onClose={() => setKnowledgeKey(null)} />
    </>
  );
}
