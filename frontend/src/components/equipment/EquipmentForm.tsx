import { useEffect, useState, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Equipment } from '../../types';

interface Props {
  open: boolean;
  equipment: Equipment | null;  // null = create mode
  onSave: (values: any) => void;
  onCancel: () => void;
}

interface FormState {
  part_number: string;
  name: string;
  ata_chapter: string;
  equipment_type: string;
  status: string;
  description: string;
  mass_kg: string;
  sta: string;
  wl: string;
  bl: string;
  power_kva_normal: string;
}

const INITIAL_STATE: FormState = {
  part_number: '',
  name: '',
  ata_chapter: '',
  equipment_type: 'LRU',
  status: 'in_development',
  description: '',
  mass_kg: '',
  sta: '',
  wl: '',
  bl: '',
  power_kva_normal: '',
};

export function EquipmentForm({ open, equipment, onSave, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (open) {
      if (equipment) {
        setForm({
          part_number: equipment.part_number || '',
          name: equipment.name || '',
          ata_chapter: equipment.ata_chapter || '',
          equipment_type: equipment.equipment_type || 'LRU',
          status: equipment.status || 'in_development',
          description: equipment.description || '',
          mass_kg: equipment.weight_balance?.mass_kg != null ? String(equipment.weight_balance.mass_kg) : '',
          sta: equipment.config_data?.sta != null ? String(equipment.config_data.sta) : '',
          wl: equipment.config_data?.wl != null ? String(equipment.config_data.wl) : '',
          bl: equipment.config_data?.bl != null ? String(equipment.config_data.bl) : '',
          power_kva_normal: equipment.electrical_load?.power_kva_normal != null
            ? String(equipment.electrical_load.power_kva_normal)
            : '',
        });
      } else {
        setForm(INITIAL_STATE);
      }
      setErrors({});
    }
  }, [open, equipment]);

  const updateField = useCallback((field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.part_number.trim()) newErrors.part_number = '件号为必填项';
    if (!form.name.trim()) newErrors.name = '名称为必填项';
    if (!form.ata_chapter.trim()) newErrors.ata_chapter = 'ATA章节为必填项';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOk = () => {
    if (!validate()) return;

    const body: any = {
      part_number: form.part_number,
      name: form.name,
      ata_chapter: form.ata_chapter,
      equipment_type: form.equipment_type || 'LRU',
      status: form.status || 'in_development',
      description: form.description || undefined,
    };
    if (form.mass_kg) {
      body.weight_balance = { mass_kg: parseFloat(form.mass_kg) };
    }
    if (form.power_kva_normal) {
      body.electrical_load = { power_kva_normal: parseFloat(form.power_kva_normal) };
    }
    onSave(body);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {equipment ? `编辑设备: ${equipment.part_number}` : '添加设备'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic">
          <TabsList>
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="install">安装位置</TabsTrigger>
            <TabsTrigger value="weight">重量数据</TabsTrigger>
            <TabsTrigger value="elec">电气数据</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="part_number">件号 <span className="text-destructive">*</span></Label>
                <Input
                  id="part_number"
                  value={form.part_number}
                  onChange={(e) => updateField('part_number', e.target.value)}
                  aria-invalid={!!errors.part_number}
                />
                {errors.part_number && <p className="text-xs text-destructive">{errors.part_number}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">名称 <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ata_chapter">ATA章节 <span className="text-destructive">*</span></Label>
                <Input
                  id="ata_chapter"
                  value={form.ata_chapter}
                  onChange={(e) => updateField('ata_chapter', e.target.value)}
                  placeholder="如: 34-21"
                  aria-invalid={!!errors.ata_chapter}
                />
                {errors.ata_chapter && <p className="text-xs text-destructive">{errors.ata_chapter}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>类型</Label>
                <Select value={form.equipment_type} onValueChange={(v) => v && updateField('equipment_type', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LRU">LRU</SelectItem>
                    <SelectItem value="SRU">SRU</SelectItem>
                    <SelectItem value="structural">结构件</SelectItem>
                    <SelectItem value="cable">线缆</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>状态</Label>
                <Select value={form.status} onValueChange={(v) => v && updateField('status', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_development">在研</SelectItem>
                    <SelectItem value="qualifying">鉴定中</SelectItem>
                    <SelectItem value="approved">已批准</SelectItem>
                    <SelectItem value="discontinued">停产</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  rows={2}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="install">
            <div className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground">
                安装位置 (STA/WL/BL) 和母线分配为构型级属性，在构型中管理。
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="sta">STA (站位)</Label>
                <Input id="sta" type="number" value={form.sta} disabled />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wl">WL (水线)</Label>
                <Input id="wl" type="number" value={form.wl} disabled />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bl">BL (翼肋线)</Label>
                <Input id="bl" type="number" value={form.bl} disabled />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="weight">
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="mass_kg">重量 (kg)</Label>
                <Input
                  id="mass_kg"
                  type="number"
                  min={0}
                  step={0.1}
                  value={form.mass_kg}
                  onChange={(e) => updateField('mass_kg', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="elec">
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="power_kva_normal">正常功耗 (kVA)</Label>
                <Input
                  id="power_kva_normal"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.power_kva_normal}
                  onChange={(e) => updateField('power_kva_normal', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>取消</Button>
          <Button onClick={handleOk}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
