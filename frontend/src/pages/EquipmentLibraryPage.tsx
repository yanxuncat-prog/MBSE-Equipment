import { useState, useEffect, useCallback, useMemo } from 'react';
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

/* ── Helper ── */
function BoolIcon({ value }: { value: boolean | null | undefined }) {
  if (value === true) return <Check className="size-3.5 text-green-600" />;
  if (value === false) return <X className="size-3.5 text-muted-foreground/40" />;
  return <span className="text-muted-foreground/30">-</span>;
}

function Cell({ value, mono }: { value: any; mono?: boolean }) {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground/30">-</span>;
  if (typeof value === 'boolean') return <BoolIcon value={value} />;
  if (typeof value === 'number') return <span className="tabular-nums">{value}</span>;
  return <span className={mono ? 'font-mono' : ''}>{String(value)}</span>;
}

/* ── Column definitions by attribute group ── */
type Col = { key: string; label: string; align?: 'center' | 'right'; mono?: boolean; };

const ATTR_GROUPS: { key: string; label: string; columns: Col[] }[] = [
  {
    key: 'identity', label: '标识与分类',
    columns: [
      { key: 'part_number', label: '件号', mono: true },
      { key: 'name', label: '设备类型名称' },
      { key: 'name_en', label: '英文名称' },
      { key: 'abbreviation_en', label: '英文缩写' },
      { key: 'ata_chapter', label: 'ATA' },
      { key: 'equipment_type', label: '类型' },
      { key: 'dal', label: 'DAL' },
      { key: 'supplier_part_number', label: '供应商件号' },
      { key: 'description', label: '描述' },
    ],
  },
  {
    key: 'physical', label: '物理特性',
    columns: [
      { key: 'part_number', label: '件号', mono: true },
      { key: 'name', label: '设备类型名称' },
      { key: 'dimensions_mm', label: '尺寸(mm)' },
      { key: 'connector_count', label: '连接器数量', align: 'right' },
      { key: 'is_metal_shell', label: '金属壳体', align: 'center' },
      { key: 'metal_shell_non_conductive', label: '壳体不导电处理' },
    ],
  },
  {
    key: 'electrical', label: '电气特性',
    columns: [
      { key: 'part_number', label: '件号', mono: true },
      { key: 'name', label: '设备类型名称' },
      { key: 'is_electrical', label: '电设备', align: 'center' },
      { key: 'is_primary_electrical', label: '一级用电', align: 'center' },
      { key: 'has_eicd', label: 'EICD', align: 'center' },
      { key: 'power_voltage', label: '供电电压' },
      { key: 'voltage_range', label: '电压范围' },
      { key: 'power_redundancy', label: '供电余度' },
      { key: 'power_watts', label: '用电功率' },
      { key: 'power_kva_normal', label: '正常功耗(kW)', align: 'right' },
      { key: 'power_kva_emergency', label: '应急功耗(kW)', align: 'right' },
      { key: 'power_kva_max', label: '峰��功耗(kW)', align: 'right' },
      { key: 'soft_start', label: '软启动' },
      { key: 'peak_power_time_s', label: '峰值时间(s)' },
      { key: 'dissimilar_supply', label: '异类供电' },
      { key: 'emergency_sheddable', label: '应急可卸' },
    ],
  },
  {
    key: 'grounding', label: '接地与搭接',
    columns: [
      { key: 'part_number', label: '件号', mono: true },
      { key: 'name', label: '设备类型名称' },
      { key: 'internal_grounding', label: '内部共地' },
      { key: 'shell_grounding_method', label: '壳体接地方式' },
      { key: 'shell_grounding_fault_path', label: '故障电流路径' },
      { key: 'grounding_special_requirements', label: '接地特殊要求' },
      { key: 'grounding_terminal_diameter', label: '接地端子内径' },
      { key: 'bonding_method', label: '搭接方式' },
      { key: 'bonding_type', label: '搭接类型' },
      { key: 'bonding_resistance', label: '搭接阻值(mΩ)' },
    ],
  },
  {
    key: 'mechanical', label: '机械接口',
    columns: [
      { key: 'part_number', label: '件号', mono: true },
      { key: 'name', label: '设备类型名称' },
      { key: 'screw_spec', label: '螺钉牌号' },
      { key: 'bracket_delegated_158', label: '托架委托158', align: 'center' },
      { key: 'has_tolerance_drawing', label: '公差工程图', align: 'center' },
    ],
  },
];

type StatusTab = 'all' | 'draft' | 'valid';

export function EquipmentLibraryPage() {
  const [items, setItems] = useState<LibraryEquipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [attrGroup, setAttrGroup] = useState('identity');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const status = statusTab === 'all' ? undefined : statusTab;
      const res = await listLibraryEquipment({ search: search || undefined, library_status: status, limit: 2000 });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('设备库加载失败', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusTab]);

  useEffect(() => {
    setSelected(new Set());
    const timer = setTimeout(fetchList, 300);
    return () => clearTimeout(timer);
  }, [fetchList]);

  const draftCount = useMemo(() => items.filter(i => i.library_status === 'draft').length, [items]);
  const validCount = useMemo(() => items.filter(i => i.library_status === 'valid').length, [items]);
  const activeGroup = ATTR_GROUPS.find(g => g.key === attrGroup) || ATTR_GROUPS[0];
  const showActions = statusTab !== 'valid';

  const handleConfirmOne = async (id: string) => {
    try { await validateEquipment(id); toast.success('设备已确认入库'); fetchList(); }
    catch { toast.error('确认失败'); }
  };
  const handleConfirmBatch = async () => {
    if (selected.size === 0) { toast.error('请先选择要确认的设备'); return; }
    try {
      const r = await validateBatch(Array.from(selected));
      toast.success(`已确认 ${r.validated_count} 台设备入库`);
      setSelected(new Set()); fetchList();
    } catch { toast.error('批量确认失败'); }
  };
  const handleSelectAll = () => {
    const draftIds = items.filter(i => i.library_status === 'draft').map(i => i.id);
    setSelected(prev => prev.size === draftIds.length ? new Set() : new Set(draftIds));
  };
  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Database className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">设备库清单</h2>
          <Badge variant="secondary">{total} 种</Badge>
        </div>
        <div className="flex items-center gap-3">
          {showActions && selected.size > 0 && (
            <Button size="sm" onClick={handleConfirmBatch}>
              <CheckCheck className="size-3.5 mr-1" />批量确认 ({selected.size})
            </Button>
          )}
          <div className="relative w-[220px]">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="搜索件号/名称..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: 'all', label: '全部' },
          { key: 'draft', label: `待确认 (${draftCount})` },
          { key: 'valid', label: `已入库 (${validCount})` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setStatusTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${statusTab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >{t.label}</button>
        ))}
      </div>

      {/* Attribute group tabs */}
      <div className="flex gap-1">
        {ATTR_GROUPS.map(g => (
          <button key={g.key} onClick={() => setAttrGroup(g.key)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${attrGroup === g.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >{g.label}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {showActions && (
                  <th className="px-2 py-2 w-8">
                    <Checkbox checked={selected.size > 0 && selected.size === items.filter(i => i.library_status === 'draft').length} onCheckedChange={handleSelectAll} />
                  </th>
                )}
                <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">状态</th>
                {activeGroup.columns.map(col => (
                  <th key={col.key} className={`px-2 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}>
                    {col.label}
                  </th>
                ))}
                {showActions && <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">操作</th>}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className={`border-b last:border-0 transition-colors ${selected.has(item.id) ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                  {showActions && (
                    <td className="px-2 py-1.5">
                      {item.library_status === 'draft' && <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} />}
                    </td>
                  )}
                  <td className="px-2 py-1.5">
                    <Badge variant={item.library_status === 'valid' ? 'default' : 'secondary'}
                      className={`text-[10px] ${item.library_status === 'valid' ? 'bg-green-600' : 'bg-amber-500 text-white'}`}>
                      {item.library_status === 'valid' ? 'Valid' : 'Draft'}
                    </Badge>
                  </td>
                  {activeGroup.columns.map(col => (
                    <td key={col.key} className={`px-2 py-1.5 text-xs ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}>
                      <Cell value={(item as any)[col.key]} mono={col.mono} />
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-2 py-1.5 text-center">
                      {item.library_status === 'draft' && (
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleConfirmOne(item.id)}>确认入库</Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={activeGroup.columns.length + 3} className="px-2 py-12 text-center text-muted-foreground">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
