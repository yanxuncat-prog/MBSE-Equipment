import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Database, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  listLibraryEquipment,
  getEquipmentConfigs,
  type LibraryEquipment,
  type LibraryEquipmentDetail,
} from '@/api/equipment-library';

export function EquipmentLibraryPage() {
  const [items, setItems] = useState<LibraryEquipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<LibraryEquipmentDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listLibraryEquipment({ search: search || undefined, limit: 500 });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchList, 300);
    return () => clearTimeout(timer);
  }, [fetchList]);

  const handleRowClick = async (equip: LibraryEquipment) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = await getEquipmentConfigs(equip.id);
      setDetail(data);
    } catch {
      // silently fail
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Database className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">设备库</h2>
          <Badge variant="secondary" className="ml-1">{total} 条</Badge>
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
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">件号</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">设备名称</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">ATA</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">类型</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">使用构型数</th>
                <th className="px-4 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className="border-b last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono text-xs">{item.part_number}</td>
                  <td className="px-4 py-2.5">{item.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{item.ata_chapter}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-xs">{item.equipment_type}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary" className="text-xs">{item.config_count}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-base">
              {detail ? `${detail.equipment.master_name}` : '设备详情'}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {/* Equipment info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">件号: </span>
                  <span className="font-mono">{detail.equipment.part_number}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ATA: </span>
                  <span>{detail.equipment.ata_chapter}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">类型: </span>
                  <Badge variant="outline" className="text-xs">{detail.equipment.equipment_type}</Badge>
                </div>
              </div>

              {/* Config usage list */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">使用该设备的构型</h4>
                {detail.configs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">暂无构型使用此设备</p>
                ) : (
                  <div className="space-y-1.5">
                    {detail.configs.map((cfg) => (
                      <div
                        key={cfg.config_id}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cfg.config_version}</span>
                          {cfg.config_name && (
                            <span className="text-muted-foreground">{cfg.config_name}</span>
                          )}
                          {cfg.is_frozen && (
                            <Badge variant="secondary" className="text-xs">冻结</Badge>
                          )}
                        </div>
                        {cfg.mass_kg != null && (
                          <span className="text-xs text-muted-foreground">{cfg.mass_kg} kg</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
