import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Database, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  listLibraryEquipment,
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

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listLibraryEquipment({ search: search || undefined, limit: 2000 });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('设备库加载失败', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchList, 300);
    return () => clearTimeout(timer);
  }, [fetchList]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Database className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">设备库清单</h2>
          <Badge variant="secondary" className="ml-1">{total} 种设备</Badge>
        </div>
        <div className="relative w-[280px]">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索件号 / 名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
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
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">件号</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">设备类型名称</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">ATA</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">类型</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground whitespace-nowrap">电设备</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground whitespace-nowrap">EICD</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">供电电压</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground whitespace-nowrap">功耗(kW)</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">尺寸</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
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
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
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
