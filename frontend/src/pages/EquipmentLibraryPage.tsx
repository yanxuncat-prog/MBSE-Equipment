import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Database, Check, X, CheckCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  listLibraryEquipment,
  validateEquipment,
  validateBatch,
  type LibraryEquipment,
} from '@/api/equipment-library';

function BoolIcon({ value }: { value: boolean | null | undefined }) {
  if (value === true) return <Check className="size-3.5 text-green-600" />;
  if (value === false) return <X className="size-3.5 text-muted-foreground/40" />;
  return <span className="text-muted-foreground/30">-</span>;
}

export function EquipmentLibraryPage() {
  const [items, setItems] = useState<LibraryEquipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'draft' | 'valid'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const status = tab === 'all' ? undefined : tab;
      const res = await listLibraryEquipment({
        search: search || undefined,
        library_status: status,
        limit: 2000,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('设备库加载失败', err);
    } finally {
      setLoading(false);
    }
  }, [search, tab]);

  useEffect(() => {
    setSelected(new Set());
    const timer = setTimeout(fetchList, 300);
    return () => clearTimeout(timer);
  }, [fetchList]);

  const draftCount = items.filter(i => i.library_status === 'draft').length;
  const validCount = items.filter(i => i.library_status === 'valid').length;

  const handleConfirmOne = async (id: string) => {
    try {
      await validateEquipment(id);
      toast.success('设备已确认入库');
      fetchList();
    } catch {
      toast.error('确认失败');
    }
  };

  const handleConfirmBatch = async () => {
    if (selected.size === 0) {
      toast.error('请先选择要确认的设备');
      return;
    }
    try {
      const result = await validateBatch(Array.from(selected));
      toast.success(`已确认 ${result.validated_count} 台设备入库`);
      setSelected(new Set());
      fetchList();
    } catch {
      toast.error('批量确认失败');
    }
  };

  const handleSelectAll = () => {
    const draftIds = items.filter(i => i.library_status === 'draft').map(i => i.id);
    if (selected.size === draftIds.length && draftIds.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(draftIds));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Database className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">设备库清单</h2>
          <Badge variant="secondary" className="ml-1">{total} 种设备</Badge>
        </div>
        <div className="flex items-center gap-3">
          {tab !== 'valid' && selected.size > 0 && (
            <Button size="sm" onClick={handleConfirmBatch}>
              <CheckCheck className="size-3.5 mr-1" />
              批量确认入库 ({selected.size})
            </Button>
          )}
          <div className="relative w-[240px]">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索件号 / 名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: 'all', label: '全部', count: total },
          { key: 'draft', label: '待确认 (Draft)', count: draftCount || undefined },
          { key: 'valid', label: '已入库 (Valid)', count: validCount || undefined },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            }`}
          >
            {t.label}
            {t.count !== undefined && tab === 'all' && t.key !== 'all' && (
              <span className="ml-1.5 text-xs text-muted-foreground">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {tab !== 'valid' && (
                  <th className="px-3 py-2.5 w-10">
                    <Checkbox
                      checked={selected.size > 0 && selected.size === items.filter(i => i.library_status === 'draft').length}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                )}
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">状态</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">件号</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">设备类型名称</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">ATA</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">类型</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground whitespace-nowrap">电设备</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground whitespace-nowrap">EICD</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">供电电压</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground whitespace-nowrap">功耗(kW)</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">尺寸</th>
                {tab !== 'valid' && (
                  <th className="px-3 py-2.5 text-center font-medium text-muted-foreground whitespace-nowrap">操作</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b last:border-0 transition-colors ${
                    selected.has(item.id) ? 'bg-primary/5' : 'hover:bg-muted/30'
                  }`}
                >
                  {tab !== 'valid' && (
                    <td className="px-3 py-2">
                      {item.library_status === 'draft' && (
                        <Checkbox
                          checked={selected.has(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                        />
                      )}
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <Badge
                      variant={item.library_status === 'valid' ? 'default' : 'secondary'}
                      className={`text-[10px] ${item.library_status === 'valid' ? 'bg-green-600' : 'bg-amber-500 text-white'}`}
                    >
                      {item.library_status === 'valid' ? 'Valid' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{item.part_number}</td>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.ata_chapter}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="text-[10px]">{item.equipment_type}</Badge>
                  </td>
                  <td className="px-3 py-2 text-center"><BoolIcon value={item.is_electrical} /></td>
                  <td className="px-3 py-2 text-center"><BoolIcon value={item.has_eicd} /></td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{item.power_voltage || '-'}</td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums">{item.power_kva_normal?.toFixed(1) ?? '-'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{item.dimensions_mm || '-'}</td>
                  {tab !== 'valid' && (
                    <td className="px-3 py-2 text-center">
                      {item.library_status === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => handleConfirmOne(item.id)}
                        >
                          确认入库
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
