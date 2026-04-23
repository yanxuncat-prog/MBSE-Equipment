import { useState, useEffect, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProfessionalTable, type Column } from '@/components/workstation/shared/ProfessionalTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import { Pencil, Loader2 } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import { listEquipment } from '../api/equipment';
import client from '../api/client';
import type { Equipment } from '../types';

/* ───── Status definitions ───── */
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  inquiry:    { label: '询价',   color: '#5AC8FA' },
  contracted: { label: '合同',   color: '#007AFF' },
  producing:  { label: '生产中', color: '#FF9500' },
  inspecting: { label: '检验',   color: '#AF52DE' },
  shipping:   { label: '在途',   color: '#34C759' },
  delivered:  { label: '已到货', color: '#52C41A' },
};

const NOT_STARTED_COLOR = '#8E8E93';
const OVERDUE_COLOR = '#FF3B30';

const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([value, { label }]) => ({ value, label }));

const LOCATION_OPTIONS = ['北京', '上海', '成都', '西安', '沈阳', '大场', '其他'];

/* ───── Helpers ───── */
function getOverdueDays(item: Equipment): number {
  const planned = item.config_data?.planned_delivery_date;
  const status = item.config_data?.procurement_status;
  if (!planned || status === 'delivered') return 0;
  const diff = dayjs().startOf('day').diff(dayjs(planned), 'day');
  return diff > 0 ? diff : 0;
}

function getStatusLabel(status: string | null | undefined): string {
  if (!status) return '未启动';
  return STATUS_MAP[status]?.label ?? status;
}

function getStatusColor(status: string | null | undefined): string {
  if (!status) return NOT_STARTED_COLOR;
  return STATUS_MAP[status]?.color ?? NOT_STARTED_COLOR;
}

/* ───── Simple Donut (city distribution) ───── */
function SimpleDonut({ data, total }: { data: { name: string; count: number }[]; total: number }) {
  const COLORS = ['#5ac8fa', '#34c759', '#ff9500', '#ff6b6b', '#af52de', '#007aff', '#ffcc00', '#636366'];
  const radius = 50;
  const cx = 65, cy = 65;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = data.map((item, i) => {
    const pct = total > 0 ? item.count / total : 0;
    const dash = pct * circumference;
    const seg = { ...item, dash, offset, color: COLORS[i % COLORS.length], pct };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-3">
      <svg width={130} height={130} viewBox="0 0 130 130">
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f0f0f0" strokeWidth={16} />
        ) : (
          segments.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
              stroke={s.color} strokeWidth={16}
              strokeDasharray={`${s.dash} ${circumference}`}
              strokeDashoffset={-s.offset}
              transform={`rotate(-90, ${cx}, ${cy})`}
            />
          ))
        )}
        <text x={cx} y={cy - 2} textAnchor="middle" fill="#333" fontSize={16} fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#999" fontSize={9}>台</text>
      </svg>
      <div>
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1 mb-0.5">
            <div className="w-[7px] h-[7px] rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-[11px] text-muted-foreground">{s.name} ({s.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Horizontal Bar (supplier delivered count) ───── */
function HorizontalBar({ data }: { data: { name: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const COLORS = ['#52C41A', '#34C759', '#5ac8fa', '#007aff', '#af52de', '#ff9500'];
  return (
    <div>
      {data.map((item, i) => (
        <div key={item.name} className="flex items-center mb-1.5">
          <span className="w-20 text-[11px] text-right mr-2 text-muted-foreground truncate">
            {item.name || '-'}
          </span>
          <div className="flex-1 h-3.5 bg-muted rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm"
              style={{
                width: `${(item.count / max) * 100}%`,
                background: COLORS[i % COLORS.length],
                minWidth: item.count > 0 ? 4 : 0,
              }}
            />
          </div>
          <span className="w-[30px] text-[11px] ml-1.5 text-foreground font-semibold">{item.count}</span>
        </div>
      ))}
      {data.length === 0 && <span className="text-xs text-muted-foreground">暂无数据</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════ */

type EnrichedEquipment = Equipment & {
  _overdueDays: number;
  _status: string | null;
  _location: string | null;
};

export function ProcurementPage() {
  const { activeConfigId } = useConfigStore();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);

  /* Filters */
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterLocation, setFilterLocation] = useState<string | null>(null);
  const [filterSupplier, setFilterSupplier] = useState<string | null>(null);
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  /* Drawer */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [formStatus, setFormStatus] = useState<string | undefined>(undefined);
  const [formLocation, setFormLocation] = useState<string | undefined>(undefined);
  const [formPlannedDate, setFormPlannedDate] = useState<string>('');
  const [formEstimatedDate, setFormEstimatedDate] = useState<string>('');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  /* ── Load data ── */
  const loadData = useCallback(async () => {
    if (!activeConfigId) { setEquipment([]); return; }
    setLoading(true);
    try {
      const result = await listEquipment({ config_id: activeConfigId, limit: 2000 });
      setEquipment(result.items);
    } catch {
      toast.error('加载设备数据失败');
    } finally {
      setLoading(false);
    }
  }, [activeConfigId]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Derived data ── */
  const enriched = useMemo<EnrichedEquipment[]>(() => equipment.map(e => ({
    ...e,
    _overdueDays: getOverdueDays(e),
    _status: e.config_data?.procurement_status ?? null,
    _location: e.config_data?.procurement_location ?? null,
  })), [equipment]);

  /* Status summary counts */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { _all: 0, _not_started: 0, _overdue: 0 };
    Object.keys(STATUS_MAP).forEach(k => { counts[k] = 0; });
    enriched.forEach(e => {
      counts._all++;
      if (!e._status) { counts._not_started++; }
      else { counts[e._status] = (counts[e._status] || 0) + 1; }
      if (e._overdueDays > 0) counts._overdue++;
    });
    return counts;
  }, [enriched]);

  /* Filtered list */
  const filtered = useMemo(() => {
    let list = enriched;
    if (filterStatus === '_not_started') {
      list = list.filter(e => !e._status);
    } else if (filterStatus === '_overdue') {
      list = list.filter(e => e._overdueDays > 0);
    } else if (filterStatus) {
      list = list.filter(e => e._status === filterStatus);
    }
    if (filterLocation) {
      list = list.filter(e => e._location === filterLocation);
    }
    if (filterSupplier) {
      list = list.filter(e => e.supplier_name === filterSupplier);
    }
    if (onlyOverdue) {
      list = list.filter(e => e._overdueDays > 0);
    }
    return list;
  }, [enriched, filterStatus, filterLocation, filterSupplier, onlyOverdue]);

  /* Unique suppliers */
  const suppliers = useMemo(() => {
    const set = new Set<string>();
    equipment.forEach(e => { if (e.supplier_name) set.add(e.supplier_name); });
    return Array.from(set).sort();
  }, [equipment]);

  /* Unique locations */
  const locations = useMemo(() => {
    const set = new Set<string>();
    equipment.forEach(e => { if (e.config_data?.procurement_location) set.add(e.config_data.procurement_location); });
    return Array.from(set).sort();
  }, [equipment]);

  /* ── Right-panel analytics ── */
  const cityDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach(e => {
      const loc = e._location || '未指定';
      map[loc] = (map[loc] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [enriched]);

  const overdueUrgent = useMemo(() => {
    return enriched
      .filter(e => e._overdueDays > 0)
      .sort((a, b) => b._overdueDays - a._overdueDays)
      .slice(0, 8);
  }, [enriched]);

  const supplierDelivered = useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach(e => {
      if (e._status === 'delivered') {
        const s = e.supplier_name || '未知';
        map[s] = (map[s] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [enriched]);

  /* ── Open edit drawer ── */
  const openEdit = (item: Equipment) => {
    setEditingItem(item);
    const cd = item.config_data;
    setFormStatus(cd?.procurement_status ?? undefined);
    setFormLocation(cd?.procurement_location ?? undefined);
    setFormPlannedDate(cd?.planned_delivery_date ?? '');
    setFormEstimatedDate(cd?.estimated_delivery_date ?? '');
    setFormNotes(cd?.procurement_notes ?? '');
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem || !activeConfigId) return;
    setSaving(true);
    try {
      await client.put(`/configurations/${activeConfigId}/equipment/${editingItem.id}/procurement`, {
        procurement_status: formStatus ?? null,
        procurement_location: formLocation ?? null,
        planned_delivery_date: formPlannedDate || null,
        estimated_delivery_date: formEstimatedDate || null,
        procurement_notes: formNotes || null,
      });
      toast.success('保存成功');
      setDrawerOpen(false);
      loadData();
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  /* ── No config selected ── */
  if (!activeConfigId) {
    return (
      <div className="text-center py-20">
        <span className="text-muted-foreground">请先在顶部选择构型</span>
      </div>
    );
  }

  /* ── Table columns ── */
  const columns: Column<EnrichedEquipment>[] = [
    {
      title: 'LIN号',
      dataIndex: 'lin_number',
      key: 'lin_number',
      width: 100,
      render: (v: string | null) => v || '-',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
    },
    {
      title: '供应商',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      width: 120,
      render: (v: string | null) => v || '-',
    },
    {
      title: '状态',
      key: 'status',
      width: 140,
      render: (_: any, record: EnrichedEquipment) => {
        const st = record._status;
        const overdue = record._overdueDays;
        return (
          <div className="flex items-center gap-1">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: getStatusColor(st) }}
            >
              {getStatusLabel(st)}
            </span>
            {overdue > 0 && (
              <span className="text-[11px] font-semibold" style={{ color: OVERDUE_COLOR }}>
                逾期{overdue}天
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: '位置',
      key: 'location',
      width: 90,
      render: (_: any, record: EnrichedEquipment) => record._location || '-',
    },
    {
      title: '计划交付',
      key: 'planned',
      width: 110,
      render: (_: any, record: EnrichedEquipment) => record.config_data?.planned_delivery_date || '-',
    },
    {
      title: '预计/实际',
      key: 'estimated',
      width: 110,
      render: (_: any, record: EnrichedEquipment) => record.config_data?.estimated_delivery_date || '-',
    },
    {
      title: '逾期天数',
      key: 'overdue',
      width: 80,
      render: (_: any, record: EnrichedEquipment) => {
        const d = record._overdueDays;
        if (d > 0) return <span className="font-bold" style={{ color: OVERDUE_COLOR }}>{d}</span>;
        return '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      render: (_: any, record: EnrichedEquipment) => (
        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => openEdit(record)}>
          <Pencil className="size-3 mr-1" />
          编辑
        </Button>
      ),
    },
  ];

  /* ═══════════ Render ═══════════ */
  return (
    <div className="flex gap-4">
      {/* ── Main area ── */}
      <div className="flex-1 min-w-0">
        {/* Status summary bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-3 py-1 text-[13px] cursor-pointer transition-colors bg-background',
              filterStatus === null ? 'border-primary border-2 text-primary' : 'border-border text-foreground'
            )}
            onClick={() => setFilterStatus(null)}
          >
            全部 <b>{statusCounts._all}</b>
          </button>
          <button
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-3 py-1 text-[13px] cursor-pointer transition-colors',
              filterStatus === '_not_started'
                ? 'text-white'
                : 'bg-background'
            )}
            style={{
              borderColor: NOT_STARTED_COLOR,
              ...(filterStatus === '_not_started'
                ? { backgroundColor: NOT_STARTED_COLOR, color: '#fff' }
                : { color: NOT_STARTED_COLOR }),
            }}
            onClick={() => setFilterStatus(filterStatus === '_not_started' ? null : '_not_started')}
          >
            未启动 <b>{statusCounts._not_started}</b>
          </button>
          {Object.entries(STATUS_MAP).map(([key, { label, color }]) => (
            <button
              key={key}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-3 py-1 text-[13px] cursor-pointer transition-colors',
                filterStatus === key ? 'text-white' : 'bg-background'
              )}
              style={{
                borderColor: color,
                ...(filterStatus === key
                  ? { backgroundColor: color, color: '#fff' }
                  : { color }),
              }}
              onClick={() => setFilterStatus(filterStatus === key ? null : key)}
            >
              {label} <b>{statusCounts[key] || 0}</b>
            </button>
          ))}
          <button
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-3 py-1 text-[13px] cursor-pointer transition-colors',
              filterStatus === '_overdue' ? 'text-white' : 'bg-background'
            )}
            style={{
              borderColor: OVERDUE_COLOR,
              ...(filterStatus === '_overdue'
                ? { backgroundColor: OVERDUE_COLOR, color: '#fff' }
                : { color: OVERDUE_COLOR }),
            }}
            onClick={() => setFilterStatus(filterStatus === '_overdue' ? null : '_overdue')}
          >
            逾期 <b>{statusCounts._overdue}</b>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex gap-3 mb-3 flex-wrap items-center">
          <Select value={filterStatus ?? undefined} onValueChange={(v) => setFilterStatus(v || null)}>
            <SelectTrigger size="sm" className="w-[130px]">
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_not_started">未启动</SelectItem>
              {STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
              <SelectItem value="_overdue">逾期</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterLocation ?? undefined} onValueChange={(v) => setFilterLocation(v || null)}>
            <SelectTrigger size="sm" className="w-[120px]">
              <SelectValue placeholder="筛选位置" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSupplier ?? undefined} onValueChange={(v) => setFilterSupplier(v || null)}>
            <SelectTrigger size="sm" className="w-[150px]">
              <SelectValue placeholder="筛选供应商" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={onlyOverdue}
              onCheckedChange={(checked) => setOnlyOverdue(checked === true)}
            />
            <span className="text-[13px]">只看逾期</span>
          </label>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ProfessionalTable<EnrichedEquipment>
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            className={cn(
              // Overdue row highlighting via CSS
              '[&_tr]:transition-colors',
            )}
          />
        )}
      </div>

      {/* ── Right panel ── */}
      <div className="w-[280px] shrink-0 space-y-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>城市分布</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleDonut data={cityDistribution} total={enriched.length} />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>逾期紧急</CardTitle>
          </CardHeader>
          <CardContent>
            {overdueUrgent.length === 0 ? (
              <span className="text-xs text-muted-foreground">无逾期设备</span>
            ) : (
              <div>
                {overdueUrgent.map((e) => (
                  <div key={e.id} className="flex justify-between items-center py-1 border-b border-border/50 last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs block truncate">{e.name}</span>
                      <span className="text-[10px] text-muted-foreground">{e.supplier_name || '-'}</span>
                    </div>
                    <Badge variant="destructive" className="text-[10px] ml-2 shrink-0">
                      {e._overdueDays}天
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>供应商交付</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBar data={supplierDelivered} />
          </CardContent>
        </Card>
      </div>

      {/* ── Edit Sheet ── */}
      <Sheet open={drawerOpen} onOpenChange={(open) => { if (!open) setDrawerOpen(false); }}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>采购信息 - {editingItem?.name || ''}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            <div>
              <label className="block text-sm font-medium mb-1">状态</label>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v ?? undefined)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">位置</label>
              <Select value={formLocation} onValueChange={(v) => setFormLocation(v ?? undefined)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择位置" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_OPTIONS.map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">计划交付日期</label>
              <Input
                type="date"
                value={formPlannedDate}
                onChange={(e) => setFormPlannedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">预计/实际交付日期</label>
              <Input
                type="date"
                value={formEstimatedDate}
                onChange={(e) => setFormEstimatedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">备注</label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={4}
                placeholder="采购备注"
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="size-4 animate-spin mr-1" />}
              保存
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
