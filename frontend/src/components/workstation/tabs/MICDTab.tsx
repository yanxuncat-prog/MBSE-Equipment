import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ProfessionalTable, type Column } from '../shared/ProfessionalTable';
import { StatsRow } from '../shared/StatsRow';
import { StatsCard } from '../shared/StatsCard';
import { useConfigStore } from '@/store/configStore';
import { listMICD, createMICD, updateMICD, confirmMICD } from '@/api/micd';
import type { Equipment, MICDRecord } from '@/types';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
interface Props {
  equipment: Equipment[];
}

/* ------------------------------------------------------------------ */
/* Blank form state                                                    */
/* ------------------------------------------------------------------ */
const EMPTY_FORM: Partial<MICDRecord> = {
  equipment_id: '',
  installation_structure_id: '',
  bonding_surface: '',
  fastener_brand: '',
  fastener_count: undefined,
  fastener_team: '',
  bracket_model: '',
  bracket_source: '',
  bracket_mass_kg: undefined,
  screw_spec: '',
  wire_bonding_size: '',
  digital_model_config: '',
  has_tolerance_drawing: false,
  tolerance_drawing_url: '',
  notes: '',
};

/* ------------------------------------------------------------------ */
/* MICDTab Component                                                   */
/* ------------------------------------------------------------------ */
export function MICDTab({ equipment }: Props) {
  const { activeConfigId } = useConfigStore();
  const [records, setRecords] = useState<MICDRecord[]>([]);
  const [, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MICDRecord | null>(null);
  const [form, setForm] = useState<Partial<MICDRecord>>(EMPTY_FORM);

  /* ---------- Data loading ---------- */
  const load = useCallback(async () => {
    if (!activeConfigId) { setRecords([]); return; }
    setLoading(true);
    try {
      const result = await listMICD({ config_id: activeConfigId, limit: 2000 });
      setRecords(result.items);
    } catch {
      toast.error('MICD 数据加载失败');
    } finally {
      setLoading(false);
    }
  }, [activeConfigId]);

  useEffect(() => { load(); }, [load]);

  /* ---------- KPI stats ---------- */
  const stats = useMemo(() => {
    const total = records.length;
    const confirmed = records.filter(r => r.is_confirmed).length;
    const rate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : '0.0';
    return { total, confirmed, rate };
  }, [records]);

  /* ---------- Equipment name lookup ---------- */
  const equipName = useCallback(
    (equipId: string) => equipment.find(e => e.id === equipId)?.name ?? equipId,
    [equipment],
  );

  /* ---------- Confirm workflow ---------- */
  const handleConfirm = async (record: MICDRecord) => {
    try {
      await confirmMICD(record.id, '当前用户');
      toast.success('确认成功');
      load();
    } catch {
      toast.error('确认失败');
    }
  };

  /* ---------- Create / Edit dialog ---------- */
  const openCreate = () => {
    setEditRecord(null);
    setForm({ ...EMPTY_FORM, config_id: activeConfigId ?? '' });
    setDialogOpen(true);
  };

  const openEdit = (record: MICDRecord) => {
    setEditRecord(record);
    setForm({ ...record });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.equipment_id) {
      toast.error('请选择设备');
      return;
    }
    try {
      if (editRecord) {
        await updateMICD(editRecord.id, form);
        toast.success('更新成功');
      } else {
        await createMICD({ ...form, config_id: activeConfigId ?? '' });
        toast.success('创建成功');
      }
      setDialogOpen(false);
      load();
    } catch {
      toast.error('保存失败');
    }
  };

  const updateField = <K extends keyof MICDRecord>(key: K, value: MICDRecord[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  /* ---------- Columns ---------- */
  const columns: Column<MICDRecord>[] = useMemo(() => [
    {
      title: '设备名称',
      dataIndex: 'equipment_id',
      key: 'equipment_id',
      width: 160,
      render: (_: any, record: MICDRecord) => equipName(record.equipment_id),
    },
    {
      title: '安装结构件编号',
      dataIndex: 'installation_structure_id',
      key: 'installation_structure_id',
      width: 140,
    },
    {
      title: '托架型号',
      dataIndex: 'bracket_model',
      key: 'bracket_model',
      width: 120,
    },
    {
      title: '托架来源',
      dataIndex: 'bracket_source',
      key: 'bracket_source',
      width: 100,
    },
    {
      title: '托架重量(kg)',
      dataIndex: 'bracket_mass_kg',
      key: 'bracket_mass_kg',
      width: 100,
      align: 'right',
      render: (v: number | null) => v != null ? v.toFixed(2) : '-',
    },
    {
      title: '螺钉规格',
      dataIndex: 'screw_spec',
      key: 'screw_spec',
      width: 100,
    },
    {
      title: '确认状态',
      dataIndex: 'is_confirmed',
      key: 'is_confirmed',
      width: 90,
      render: (v: boolean) =>
        v ? (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
            已确认
          </Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
            未确认
          </Badge>
        ),
    },
    {
      title: '确认日期',
      dataIndex: 'confirmed_at',
      key: 'confirmed_at',
      width: 110,
      render: (v: string | null) => v ? v.slice(0, 10) : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: any, record: MICDRecord) => (
        <div className="flex items-center gap-1">
          {!record.is_confirmed && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs text-emerald-600"
              onClick={(e) => { e.stopPropagation(); handleConfirm(record); }}
            >
              <CheckCircle2 className="size-3" />
              确认
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={(e) => { e.stopPropagation(); openEdit(record); }}
          >
            编辑
          </Button>
        </div>
      ),
    },
  ], [equipName]);

  /* ---------- Render ---------- */
  if (!activeConfigId) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        请先选择一个构型
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <StatsRow>
        <StatsCard label="总记录数" value={stats.total} />
        <StatsCard
          label="已确认"
          value={
            <span className="text-[color:var(--status-ok)]">{stats.confirmed}</span>
          }
        />
        <StatsCard
          label="确认率(%)"
          value={
            <span>
              {stats.rate}
              <span className="ml-0.5 text-sm font-normal">%</span>
            </span>
          }
        />
      </StatsRow>

      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">MICD 记录</h3>
        <Button size="sm" className="h-7 gap-1 text-xs" onClick={openCreate}>
          <Plus className="size-3.5" />
          新建记录
        </Button>
      </div>

      {/* Table */}
      <ProfessionalTable<MICDRecord>
        columns={columns}
        dataSource={records}
        rowKey="id"
        maxHeight="calc(100vh - 340px)"
        hideATA
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editRecord ? '编辑 MICD 记录' : '新建 MICD 记录'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* Equipment selector */}
            <div className="grid gap-1.5">
              <Label>设备 *</Label>
              <Select
                value={form.equipment_id || ''}
                onValueChange={(v) => { if (v) updateField('equipment_id', v); }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择设备" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* installation_structure_id */}
            <div className="grid gap-1.5">
              <Label>安装结构件编号</Label>
              <Input
                value={form.installation_structure_id ?? ''}
                onChange={e => updateField('installation_structure_id', e.target.value)}
              />
            </div>

            {/* bracket_model + bracket_source */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>托架型号</Label>
                <Input
                  value={form.bracket_model ?? ''}
                  onChange={e => updateField('bracket_model', e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>托架来源</Label>
                <Input
                  value={form.bracket_source ?? ''}
                  onChange={e => updateField('bracket_source', e.target.value)}
                />
              </div>
            </div>

            {/* bracket_mass_kg + screw_spec */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>托架重量(kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.bracket_mass_kg ?? ''}
                  onChange={e => updateField('bracket_mass_kg', e.target.value ? Number(e.target.value) : null as any)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>螺钉规格</Label>
                <Input
                  value={form.screw_spec ?? ''}
                  onChange={e => updateField('screw_spec', e.target.value)}
                />
              </div>
            </div>

            {/* bonding_surface */}
            <div className="grid gap-1.5">
              <Label>搭接面</Label>
              <Input
                value={form.bonding_surface ?? ''}
                onChange={e => updateField('bonding_surface', e.target.value)}
              />
            </div>

            {/* fastener_brand + fastener_count */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>紧固件品牌</Label>
                <Input
                  value={form.fastener_brand ?? ''}
                  onChange={e => updateField('fastener_brand', e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>紧固件数量</Label>
                <Input
                  type="number"
                  value={form.fastener_count ?? ''}
                  onChange={e => updateField('fastener_count', e.target.value ? Number(e.target.value) : null as any)}
                />
              </div>
            </div>

            {/* fastener_team */}
            <div className="grid gap-1.5">
              <Label>紧固件组</Label>
              <Input
                value={form.fastener_team ?? ''}
                onChange={e => updateField('fastener_team', e.target.value)}
              />
            </div>

            {/* wire_bonding_size */}
            <div className="grid gap-1.5">
              <Label>搭接线尺寸</Label>
              <Input
                value={form.wire_bonding_size ?? ''}
                onChange={e => updateField('wire_bonding_size', e.target.value)}
              />
            </div>

            {/* digital_model_config */}
            <div className="grid gap-1.5">
              <Label>数模配置</Label>
              <Input
                value={form.digital_model_config ?? ''}
                onChange={e => updateField('digital_model_config', e.target.value)}
              />
            </div>

            {/* has_tolerance_drawing + tolerance_drawing_url */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="has_tolerance_drawing"
                checked={form.has_tolerance_drawing ?? false}
                onCheckedChange={(v) => updateField('has_tolerance_drawing', !!v)}
              />
              <Label htmlFor="has_tolerance_drawing">有公差图纸</Label>
            </div>
            {form.has_tolerance_drawing && (
              <div className="grid gap-1.5">
                <Label>公差图纸链接</Label>
                <Input
                  value={form.tolerance_drawing_url ?? ''}
                  onChange={e => updateField('tolerance_drawing_url', e.target.value)}
                />
              </div>
            )}

            {/* notes */}
            <div className="grid gap-1.5">
              <Label>备注</Label>
              <Input
                value={form.notes ?? ''}
                onChange={e => updateField('notes', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              {editRecord ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
