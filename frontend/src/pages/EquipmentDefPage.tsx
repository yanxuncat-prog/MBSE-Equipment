import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ProfessionalTable, type Column } from '@/components/workstation/shared/ProfessionalTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { listEquipment, deleteEquipment } from '../api/equipment';
import { EquipmentForm } from '../components/equipment/EquipmentForm';
import type { Equipment } from '../types';

const PAGE_SIZE = 50;

/**
 * Equipment Definition page — manages device-intrinsic properties.
 * No configuration context needed. Shows ALL equipment in the system.
 */
export function EquipmentDefPage() {
  const [data, setData] = useState<Equipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editEquip, setEditEquip] = useState<Equipment | null>(null);
  const [detailEquip, setDetailEquip] = useState<Equipment | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setOffset(0);
    try {
      const result = await listEquipment({
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
  }, [search]);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || offset >= total) return;
    setLoadingMore(true);
    try {
      const result = await listEquipment({
        search: search || undefined,
        offset,
        limit: PAGE_SIZE,
      });
      setData(prev => [...prev, ...result.items]);
      setOffset(prev => prev + result.items.length);
    } catch { /* silent */ } finally {
      setLoadingMore(false);
    }
  }, [search, offset, total, loadingMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('确认删除?')) return;
    await deleteEquipment(id);
    toast.success('已删除');
    fetchInitial();
  };

  const handleSave = async (values: any) => {
    try {
      if (editEquip) {
        const { updateEquipment } = await import('../api/equipment');
        await updateEquipment(editEquip.id, values);
        toast.success('更新成功');
      } else {
        const { createEquipment } = await import('../api/equipment');
        await createEquipment(values);
        toast.success('创建成功');
      }
      setFormOpen(false);
      fetchInitial();
    } catch {
      toast.error('保存失败');
    }
  };

  const columns: Column<Equipment>[] = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '件号', dataIndex: 'part_number', key: 'pn', width: 150 },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata', width: 55 },
    { title: '类型', dataIndex: 'equipment_type', key: 'type', width: 70 },
    { title: '英文名称', dataIndex: 'name_en', key: 'name_en', width: 180,
      render: (v: string | null) => v || '-' },
    { title: 'DAL', dataIndex: 'dal', key: 'dal', width: 50,
      render: (v: string | null) => v || '-' },
    { title: '重量(kg)', key: 'mass', width: 80, align: 'right',
      render: (_: any, r: Equipment) => r.weight_balance?.mass_kg?.toFixed(1) || '-' },
    { title: '尺寸(mm)', dataIndex: 'dimensions_mm', key: 'dims', width: 120,
      render: (v: string | null) => v || '-' },
    { title: '连接器数', dataIndex: 'connector_count', key: 'conn', width: 75, align: 'right',
      render: (v: number | null) => v ?? '-' },
    { title: '电压范围(V)', dataIndex: 'voltage_range', key: 'volt', width: 110,
      render: (v: string | null) => v || '-' },
    { title: '壳体金属', dataIndex: 'is_metal_shell', key: 'metal', width: 75,
      render: (v: boolean | null) => v === true ? '是' : v === false ? '否' : '-' },
    { title: '接地方式', dataIndex: 'shell_grounding_method', key: 'gnd', width: 90,
      render: (v: string | null) => v || '-' },
    { title: '功耗(kVA)', key: 'power', width: 80, align: 'right',
      render: (_: any, r: Equipment) => r.electrical_load?.power_kva_normal?.toFixed(1) || '-' },
    { title: 'EICD', dataIndex: 'has_eicd', key: 'eicd', width: 55,
      render: (v: boolean | null) => v === true ? '有' : v === false ? '无' : '-' },
    { title: '供应商', key: 'supplier', width: 120,
      render: (_: any, r: Equipment) => r.supplier_name || '-' },
    { title: '', key: 'action', width: 40,
      render: (_: any, record: Equipment) => (
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-destructive hover:text-destructive"
          onClick={(e) => handleDelete(record.id, e as any)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ),
    },
  ];

  /* ── Description list helper ── */
  const DescItem = ({ label, children, span = false }: { label: string; children: React.ReactNode; span?: boolean }) => (
    <>
      <dt className="text-xs text-muted-foreground font-medium py-1.5 px-2 bg-muted/50 border-b border-r">{label}</dt>
      <dd className={`text-sm py-1.5 px-2 border-b ${span ? 'col-span-3' : ''}`}>{children}</dd>
    </>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex gap-3 mb-3 items-center">
        <Button size="sm" onClick={() => { setEditEquip(null); setFormOpen(true); }}>
          <Plus className="size-3.5 mr-1" />
          新建设备
        </Button>
        <div className="relative w-60">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索LIN号/件号/名称"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 h-7 text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          共 {total} 台设备{data.length < total ? `，已加载 ${data.length}` : ''}
          （设备固有属性，不依赖构型）
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ProfessionalTable
          columns={columns}
          dataSource={data}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => setDetailEquip(record),
          })}
        />
      )}
      <div ref={sentinelRef} className="h-px" />
      {loadingMore && (
        <div className="text-center py-4">
          <Loader2 className="size-4 animate-spin text-muted-foreground inline-block" />
        </div>
      )}
      {offset >= total && total > 0 && (
        <div className="text-center py-3 text-xs text-muted-foreground/50">— 全部 {total} 台设备 —</div>
      )}

      {/* Create/Edit form */}
      <EquipmentForm open={formOpen} equipment={editEquip} onSave={handleSave} onCancel={() => setFormOpen(false)} />

      {/* Detail sheet */}
      <Sheet open={!!detailEquip} onOpenChange={(open) => { if (!open) setDetailEquip(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {detailEquip ? `${detailEquip.part_number} — ${detailEquip.name}` : ''}
            </SheetTitle>
          </SheetHeader>

          {detailEquip && (
            <div className="px-4 pb-4 space-y-4">
              {/* Basic info */}
              <dl className="grid grid-cols-[auto_1fr_auto_1fr] border-t border-l text-left">
                <DescItem label="件号">{detailEquip.part_number}</DescItem>
                <DescItem label="ATA">{detailEquip.ata_chapter}</DescItem>
                <DescItem label="名称" span>{detailEquip.name}</DescItem>
                <DescItem label="英文名称" span>{detailEquip.name_en || '-'}</DescItem>
                <DescItem label="类型">{detailEquip.equipment_type}</DescItem>
                <DescItem label="DAL">{detailEquip.dal || '-'}</DescItem>
                <DescItem label="供应商" span>{detailEquip.supplier_name || '-'}</DescItem>
              </dl>

              {detailEquip.weight_balance && (
                <>
                  <Separator />
                  <h4 className="text-sm font-medium text-muted-foreground">重量</h4>
                  <dl className="grid grid-cols-[auto_1fr] border-t border-l text-left">
                    <DescItem label="重量">{detailEquip.weight_balance.mass_kg} kg</DescItem>
                  </dl>
                </>
              )}

              <Separator />
              <h4 className="text-sm font-medium text-muted-foreground">物理特性</h4>
              <dl className="grid grid-cols-[auto_1fr_auto_1fr] border-t border-l text-left">
                <DescItem label="尺寸">{detailEquip.dimensions_mm || '-'}</DescItem>
                <DescItem label="连接器数">{detailEquip.connector_count ?? '-'}</DescItem>
                <DescItem label="壳体金属">{detailEquip.is_metal_shell === true ? '是' : detailEquip.is_metal_shell === false ? '否' : '-'}</DescItem>
                <DescItem label="电压范围">{detailEquip.voltage_range || '-'}</DescItem>
                <DescItem label="接地方式" span>{detailEquip.shell_grounding_method || '-'}</DescItem>
                <DescItem label="内部接地" span>{detailEquip.internal_grounding || '-'}</DescItem>
              </dl>

              <Separator />
              <h4 className="text-sm font-medium text-muted-foreground">电气</h4>
              <dl className="grid grid-cols-[auto_1fr_auto_1fr] border-t border-l text-left">
                <DescItem label="是否电设备">{detailEquip.is_electrical === true ? '是' : detailEquip.is_electrical === false ? '否' : '-'}</DescItem>
                <DescItem label="EICD">{detailEquip.has_eicd === true ? '有' : detailEquip.has_eicd === false ? '无' : '-'}</DescItem>
                <DescItem label="功耗">{detailEquip.electrical_load?.power_kva_normal?.toFixed(2) || '-'} kVA</DescItem>
                <DescItem label="供电余度">{detailEquip.power_redundancy || '-'}</DescItem>
              </dl>

              {/* DO-160 data now managed via DO-160 records */}

              <div className="pt-2">
                <Button size="sm" onClick={() => { setDetailEquip(null); setEditEquip(detailEquip); setFormOpen(true); }}>
                  编辑设备
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
