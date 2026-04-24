import { useEffect, useState, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Equipment } from '../../types';
import { useConfigStore } from '../../store/configStore';
import client from '../../api/client';
import { ChangeLogViewer } from './ChangeLogViewer';

interface Props {
  open: boolean;
  equipment: Equipment | null;
  onSave: (values: any, reason?: string) => void;
  onCancel: () => void;
}

/* ── Field metadata ── */
interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  target: 'equipment' | 'config_equipment' | 'weight_balance' | 'electrical_load';
}

const BOOL_OPTS = [
  { value: '__none__', label: '未设置' },
  { value: 'true', label: '是' },
  { value: 'false', label: '否' },
];

/* ── Field groups ── */
const FIELD_GROUPS: { key: string; label: string; fields: FieldDef[] }[] = [
  {
    key: 'basic', label: '基本信息',
    fields: [
      { key: 'part_number', label: '件号', type: 'text', target: 'equipment' },
      { key: 'name', label: '名称', type: 'text', target: 'equipment' },
      { key: 'name_en', label: '英文名称', type: 'text', target: 'equipment' },
      { key: 'lin_number', label: 'LIN号', type: 'text', target: 'config_equipment' },
      { key: 'internal_number', label: '内部编号', type: 'text', target: 'config_equipment' },
      { key: 'ata_chapter', label: 'ATA章节', type: 'text', target: 'equipment' },
      { key: 'equipment_type', label: '类型', type: 'select', target: 'equipment', options: [
        { value: 'LRU', label: 'LRU' }, { value: 'SRU', label: 'SRU' },
        { value: 'structural', label: '结构件' }, { value: 'cable', label: '线缆' },
      ]},
      { key: 'equipment_status', label: '状态', type: 'select', target: 'config_equipment', options: [
        { value: 'in_development', label: '在研' }, { value: 'qualifying', label: '鉴定中' },
        { value: 'approved', label: '已批准' }, { value: 'discontinued', label: '停产' },
      ]},
      { key: 'description', label: '描述', type: 'textarea', target: 'equipment' },
      { key: 'responsible_person', label: '负责人', type: 'text', target: 'config_equipment' },
    ],
  },
  {
    key: 'classify', label: '分类属性',
    fields: [
      { key: 'is_electrical', label: '是否电设备', type: 'boolean', target: 'equipment' },
      { key: 'is_primary_electrical', label: '一级用电设备', type: 'boolean', target: 'equipment' },
      { key: 'has_eicd', label: '是否有EICD', type: 'boolean', target: 'equipment' },
      { key: 'dal', label: 'DAL等级', type: 'select', target: 'equipment', options: [
        { value: '__none__', label: '未设置' }, { value: 'A', label: 'A' }, { value: 'B', label: 'B' },
        { value: 'C', label: 'C' }, { value: 'D', label: 'D' }, { value: 'E', label: 'E' },
      ]},
      { key: 'is_optional', label: '是否选装', type: 'boolean', target: 'config_equipment' },
      { key: 'equipment_level', label: '设备等级', type: 'text', target: 'config_equipment' },
      { key: 'has_special_wiring', label: '特殊布线', type: 'boolean', target: 'config_equipment' },
    ],
  },
  {
    key: 'weight', label: '重量/位置',
    fields: [
      { key: 'mass_kg', label: '重量 (kg)', type: 'number', target: 'weight_balance' },
      { key: 'sta', label: 'STA (mm)', type: 'number', target: 'config_equipment' },
      { key: 'bl', label: 'BL (mm)', type: 'number', target: 'config_equipment' },
      { key: 'wl', label: 'WL (mm)', type: 'number', target: 'config_equipment' },
      { key: 'dimensions_mm', label: '尺寸 (长×高×宽mm)', type: 'text', target: 'equipment' },
    ],
  },
  {
    key: 'electrical', label: '电气特性',
    fields: [
      { key: 'power_kva_normal', label: '正常功耗 (kW)', type: 'number', target: 'electrical_load' },
      { key: 'power_kva_emergency', label: '应急功耗 (kW)', type: 'number', target: 'electrical_load' },
      { key: 'power_kva_max', label: '峰值功耗 (kW)', type: 'number', target: 'electrical_load' },
      { key: 'power_voltage', label: '供电电压', type: 'text', target: 'equipment' },
      { key: 'power_redundancy', label: '供电余度', type: 'text', target: 'equipment' },
      { key: 'voltage_range', label: '电压范围 (V)', type: 'text', target: 'equipment' },
    ],
  },
  {
    key: 'bonding', label: '搭接/安装',
    fields: [
      { key: 'bonding_method', label: '搭接方式', type: 'select', target: 'config_equipment', options: [
        { value: '__none__', label: '未设置' }, { value: '面搭接', label: '面搭接' }, { value: '线搭接', label: '线搭接' },
      ]},
      { key: 'bonding_type', label: '搭接类型', type: 'text', target: 'config_equipment' },
      { key: 'bonding_resistance', label: '搭接阻值 (mΩ)', type: 'text', target: 'config_equipment' },
      { key: 'bonding_position', label: '搭接位置', type: 'text', target: 'config_equipment' },
      { key: 'install_method', label: '安装方式', type: 'text', target: 'config_equipment' },
      { key: 'in_pace_drawing', label: 'PACE图纸', type: 'boolean', target: 'config_equipment' },
      { key: 'layout_adjustment', label: '布置调整需求', type: 'textarea', target: 'config_equipment' },
    ],
  },
  {
    key: 'notes', label: '备注',
    fields: [
      { key: 'notes', label: '备注', type: 'textarea', target: 'equipment' },
    ],
  },
];

const PRESETS: { label: string; groups: string[] }[] = [
  { label: '全部', groups: FIELD_GROUPS.map(g => g.key) },
  { label: '重量', groups: ['weight'] },
  { label: '搭接', groups: ['bonding'] },
  { label: '电气', groups: ['electrical'] },
  { label: '基本+分类', groups: ['basic', 'classify'] },
];

/* ── Helpers ── */
function getFieldValue(equip: Equipment | null, field: FieldDef): string {
  if (!equip) return '';
  if (field.target === 'weight_balance') return String(equip.weight_balance?.mass_kg ?? '');
  if (field.target === 'electrical_load') return String((equip.electrical_load as any)?.[field.key] ?? '');
  if (field.target === 'config_equipment') return String((equip.config_data as any)?.[field.key] ?? '');
  const v = (equip as any)[field.key];
  if (v === true) return 'true';
  if (v === false) return 'false';
  return String(v ?? '');
}

export function EquipmentForm({ open, equipment, onSave, onCancel }: Props) {
  const { activeConfigId } = useConfigStore();
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set(FIELD_GROUPS.map(g => g.key)));
  const [step, setStep] = useState<'select' | 'edit'>('select');
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState('');

  // Init form when opening
  useEffect(() => {
    if (!open) return;
    setStep(equipment ? 'select' : 'edit'); // new → skip selection
    setReason('');
    if (!equipment) {
      setSelectedGroups(new Set(['basic']));
    } else {
      setSelectedGroups(new Set(FIELD_GROUPS.map(g => g.key)));
    }
    // Populate form from equipment
    const f: Record<string, string> = {};
    for (const group of FIELD_GROUPS) {
      for (const field of group.fields) {
        f[field.key] = getFieldValue(equipment, field);
      }
    }
    setForm(f);
  }, [open, equipment]);

  const u = useCallback((key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const visibleGroups = FIELD_GROUPS.filter(g => selectedGroups.has(g.key));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (equipment && activeConfigId) {
        // Use the new combined update API
        const eqFields: Record<string, any> = {};
        const ceFields: Record<string, any> = {};
        let wbData: any = null;
        let elData: any = null;

        for (const group of visibleGroups) {
          for (const field of group.fields) {
            const val = form[field.key];
            if (val === '' || val === undefined) continue;

            let parsed: any = val;
            if (field.type === 'number') parsed = parseFloat(val) || null;
            if (field.type === 'boolean') parsed = val === 'true' ? true : val === 'false' ? false : null;
            if (field.type === 'select' && val === '__none__') parsed = null;

            if (field.target === 'equipment') eqFields[field.key] = parsed;
            else if (field.target === 'config_equipment') ceFields[field.key] = parsed;
            else if (field.target === 'weight_balance') {
              if (parsed != null) wbData = { mass_kg: parsed };
            }
            else if (field.target === 'electrical_load') {
              if (!elData) elData = {};
              if (parsed != null) elData[field.key] = parsed;
            }
          }
        }

        const url = reason
          ? `/configurations/${activeConfigId}/equipment/${equipment.id}?reason=${encodeURIComponent(reason)}`
          : `/configurations/${activeConfigId}/equipment/${equipment.id}`;
        await client.patch(url, {
          equipment: Object.keys(eqFields).length > 0 ? eqFields : undefined,
          config_equipment: Object.keys(ceFields).length > 0 ? ceFields : undefined,
          weight_balance: wbData,
          electrical_load: elData,
        });
        onSave({}, reason);
      } else {
        // Create mode - use legacy API
        const body: any = {
          part_number: form.part_number,
          name: form.name,
          ata_chapter: form.ata_chapter || '00',
          equipment_type: form.equipment_type || 'LRU',
          description: form.description,
        };
        if (form.mass_kg) body.weight_balance = { mass_kg: parseFloat(form.mass_kg) };
        if (form.power_kva_normal) body.electrical_load = { power_kva_normal: parseFloat(form.power_kva_normal) };
        onSave(body);
      }
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (groups: string[]) => {
    setSelectedGroups(new Set(groups));
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">
            {equipment ? `编辑: ${equipment.name}` : '添加设备'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Field group selection (only for edit mode) */}
        {step === 'select' && equipment && (
          <div className="flex-1 space-y-4">
            <div className="text-sm text-muted-foreground">选择要编辑的字段组：</div>
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <Button key={p.label} variant="outline" size="sm" className="h-7 text-xs"
                  onClick={() => applyPreset(p.groups)}>
                  {p.label}
                </Button>
              ))}
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              {FIELD_GROUPS.map(g => (
                <div key={g.key} className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <Checkbox
                    id={`grp-${g.key}`}
                    checked={selectedGroups.has(g.key)}
                    onCheckedChange={(checked) => {
                      const next = new Set(selectedGroups);
                      checked ? next.add(g.key) : next.delete(g.key);
                      setSelectedGroups(next);
                    }}
                  />
                  <label htmlFor={`grp-${g.key}`} className="flex-1 cursor-pointer">
                    <span className="text-sm font-medium">{g.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{g.fields.length} 字段</span>
                  </label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onCancel}>取消</Button>
              <Button onClick={() => setStep('edit')} disabled={selectedGroups.size === 0}>
                开始编辑 ({selectedGroups.size} 组)
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Edit form */}
        {(step === 'edit' || !equipment) && (
          <>
            <Tabs defaultValue={visibleGroups[0]?.key || 'basic'} className="flex-1">
              <TabsList variant="line" className="flex-wrap">
                {visibleGroups.map(g => (
                  <TabsTrigger key={g.key} value={g.key} className="text-xs">{g.label}</TabsTrigger>
                ))}
              </TabsList>
              <div className="h-[360px] overflow-y-auto mt-2">
                {visibleGroups.map(g => (
                  <TabsContent key={g.key} value={g.key} className="mt-0">
                    <div className="grid grid-cols-2 gap-3">
                      {g.fields.map(field => (
                        <div key={field.key} className={cn("space-y-1", field.type === 'textarea' && "col-span-2")}>
                          <Label className="text-xs">{field.label}</Label>
                          {field.type === 'textarea' ? (
                            <Textarea rows={2} value={form[field.key] || ''} onChange={e => u(field.key, e.target.value)} className="text-sm" />
                          ) : field.type === 'boolean' ? (
                            <Select value={form[field.key] || '__none__'} onValueChange={v => { if (v) u(field.key, v); }}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue>{BOOL_OPTS.find(o => o.value === (form[field.key] || '__none__'))?.label}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {BOOL_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : field.type === 'select' ? (
                            <Select value={form[field.key] || '__none__'} onValueChange={v => { if (v) u(field.key, v === '__none__' ? '' : v); }}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue>{field.options?.find(o => o.value === (form[field.key] || '__none__'))?.label || form[field.key]}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input value={form[field.key] || ''} onChange={e => u(field.key, e.target.value)}
                              type={field.type === 'number' ? 'number' : 'text'} className="h-8 text-sm" />
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
            {/* Reason field (edit mode only) */}
            {equipment && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">变更原因(可选)</label>
                <Input placeholder="填写变更原因..." value={reason} onChange={(e) => setReason(e.target.value)} className="h-8 text-sm" />
              </div>
            )}

            {/* Change log (edit mode only) */}
            {equipment && activeConfigId && (
              <ChangeLogViewer entityType="config_equipment" entityId={`${activeConfigId}:${equipment.id}`} />
            )}

            <DialogFooter>
              {equipment && <Button variant="ghost" size="sm" onClick={() => setStep('select')}>返回选择</Button>}
              <div className="flex-1" />
              <Button variant="outline" onClick={onCancel}>取消</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
