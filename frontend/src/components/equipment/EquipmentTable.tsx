import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ProfessionalTable, type Column } from '@/components/workstation/shared/ProfessionalTable';
import { listEquipment } from '../../api/equipment';
import { ExpandableRow } from './ExpandableRow';
import { useConfigStore } from '../../store/configStore';
import type { Equipment } from '../../types';

interface Props {
  configId: string | null;
  search: string;
  onEdit: (equip: Equipment) => void;
  onSelect: (equip: Equipment) => void;
}

const STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; text: string }> = {
  approved: { variant: 'default', text: '已批准' },
  in_development: { variant: 'secondary', text: '在研' },
  qualifying: { variant: 'outline', text: '鉴定中' },
  discontinued: { variant: 'destructive', text: '停产' },
};

const PAGE_SIZE = 50;

export function EquipmentTable({ configId, search, onEdit, onSelect }: Props) {
  const { activeConfigId } = useConfigStore();
  const [data, setData] = useState<Equipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset and fetch from beginning when configId or search changes
  const fetchInitial = useCallback(async () => {
    if (!configId) return;
    setLoading(true);
    setOffset(0);
    try {
      const result = await listEquipment({
        config_id: configId,
        search: search || undefined,
        offset: 0,
        limit: PAGE_SIZE,
      });
      setData(result.items);
      setTotal(result.total);
      setOffset(result.items.length);
    } catch {
      toast.error('加载设备列表失败');
    } finally {
      setLoading(false);
    }
  }, [configId, search]);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  // Load more
  const loadMore = useCallback(async () => {
    if (!configId || loadingMore || offset >= total) return;
    setLoadingMore(true);
    try {
      const result = await listEquipment({
        config_id: configId,
        search: search || undefined,
        offset,
        limit: PAGE_SIZE,
      });
      setData(prev => [...prev, ...result.items]);
      setOffset(prev => prev + result.items.length);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [configId, search, offset, total, loadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const columns: Column<Equipment>[] = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 200,
      render: (v: string) => <span className="font-medium text-foreground">{v}</span> },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata', width: 50,
      render: (v: string) => <span className="tabular-nums text-muted-foreground">{v}</span> },
    { title: 'LIN号', key: 'lin', width: 110,
      render: (_: any, r: Equipment) => <span className="font-mono text-xs text-muted-foreground">{r.config_data?.lin_number || '-'}</span> },
    { title: '重量', key: 'mass', width: 80, align: 'right' as const,
      render: (_: any, r: Equipment) => {
        const w = r.config_data?.mass_kg ?? r.weight_balance?.mass_kg;
        if (w == null) return <span className="text-muted-foreground/40">-</span>;
        return <span className="tabular-nums font-medium">{w.toFixed(1)}</span>;
      } },
    { title: '电压', dataIndex: 'power_voltage', key: 'pv', width: 60,
      render: (v: string) => v ? <span className="tabular-nums">{v}V</span> : <span className="text-muted-foreground/40">-</span> },
    {
      title: '状态', key: 'status', width: 72,
      render: (_: any, r: Equipment) => {
        const s = r.config_data?.equipment_status || 'in_development';
        const cfg = STATUS_BADGES[s] || { variant: 'secondary' as const, text: s };
        return <Badge variant={cfg.variant}>{cfg.text}</Badge>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 text-xs text-muted-foreground">
        共 {total} 台设备{data.length < total ? `，已加载 ${data.length} 台` : ''}
      </div>
      <ProfessionalTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        onEdit={onEdit}
        hideATA
        onRow={(record) => ({
          onClick: () => onSelect(record),
        })}
        expandable={{
          render: (record) => (
            <ExpandableRow
              equipment={record}
              configId={activeConfigId || ''}
              onSaved={fetchInitial}
            />
          ),
        }}
      />
      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-px" />
      {loadingMore && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {offset >= total && total > 0 && (
        <div className="py-3 text-center text-xs text-muted-foreground/50">
          — 全部 {total} 台设备 —
        </div>
      )}
    </div>
  );
}
