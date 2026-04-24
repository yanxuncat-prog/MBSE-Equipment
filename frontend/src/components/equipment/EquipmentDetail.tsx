import React from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Equipment } from '../../types';

interface Props {
  equipment: Equipment | null;
  open: boolean;
  onClose: () => void;
}

const STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; text: string }> = {
  approved: { variant: 'default', text: '已批准' },
  in_development: { variant: 'secondary', text: '在研' },
  qualifying: { variant: 'outline', text: '鉴定中' },
  discontinued: { variant: 'destructive', text: '停产' },
};

function DescriptionItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="text-muted-foreground">{label}</div>
      <div>{children}</div>
    </>
  );
}

export function EquipmentDetail({ equipment, open, onClose }: Props) {
  if (!equipment) return null;

  const eqStatus = equipment.config_data?.equipment_status || 'in_development';
  const statusCfg = STATUS_BADGES[eqStatus] || { variant: 'secondary' as const, text: eqStatus };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{equipment.part_number} — {equipment.name}</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <DescriptionItem label="件号">{equipment.part_number}</DescriptionItem>
            <DescriptionItem label="名称">{equipment.name}</DescriptionItem>
            <DescriptionItem label="ATA章节">{equipment.ata_chapter}</DescriptionItem>
            <DescriptionItem label="类型">{equipment.equipment_type}</DescriptionItem>
            <DescriptionItem label="供应商">{equipment.supplier_name || '-'}</DescriptionItem>
            <DescriptionItem label="状态">
              <Badge variant={statusCfg.variant}>{statusCfg.text}</Badge>
            </DescriptionItem>
            <DescriptionItem label="描述">{equipment.description || '-'}</DescriptionItem>
          </div>

          {/* Config-level install location */}
          {equipment.config_data && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">安装位置 (构型级)</span>
                  <Separator className="flex-1" />
                </div>
                <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <div className="text-muted-foreground">区域</div>
                  <div>{equipment.config_data.zone_name ?? '-'}</div>
                  <div className="text-muted-foreground">机架位置</div>
                  <div>{equipment.config_data.rack_position ?? '-'}</div>
                  <div className="text-muted-foreground">STA</div>
                  <div>{equipment.config_data.sta ?? '-'}</div>
                  <div className="text-muted-foreground">WL</div>
                  <div>{equipment.config_data.wl ?? '-'}</div>
                  <div className="text-muted-foreground">BL</div>
                  <div>{equipment.config_data.bl ?? '-'}</div>
                  <div className="text-muted-foreground">母线</div>
                  <div>{equipment.config_data.bus_name ?? '-'}</div>
                </div>
              </div>
            </>
          )}

          {/* Weight data */}
          {equipment.weight_balance && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">重量数据</span>
                <Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <DescriptionItem label="重量">{equipment.weight_balance.mass_kg} kg</DescriptionItem>
              </div>
            </div>
          )}

          {/* Electrical data */}
          {equipment.electrical_load && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">电气数据</span>
                <Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <DescriptionItem label="正常功耗">{equipment.electrical_load.power_kva_normal} kVA</DescriptionItem>
                <DescriptionItem label="应急功耗">{equipment.electrical_load.power_kva_emergency ?? '-'} kVA</DescriptionItem>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
