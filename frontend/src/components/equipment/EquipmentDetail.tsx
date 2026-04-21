import React from 'react';
import { Drawer, Descriptions, Tag, Divider } from 'antd';
import type { Equipment } from '../../types';

interface Props {
  equipment: Equipment | null;
  open: boolean;
  onClose: () => void;
}

export function EquipmentDetail({ equipment, open, onClose }: Props) {
  if (!equipment) return null;

  return (
    <Drawer title={`${equipment.part_number} — ${equipment.name}`} open={open} onClose={onClose} width={480}>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="件号">{equipment.part_number}</Descriptions.Item>
        <Descriptions.Item label="名称">{equipment.name}</Descriptions.Item>
        <Descriptions.Item label="ATA章节">{equipment.ata_chapter}</Descriptions.Item>
        <Descriptions.Item label="类型">{equipment.equipment_type}</Descriptions.Item>
        <Descriptions.Item label="状态"><Tag>{equipment.status}</Tag></Descriptions.Item>
        <Descriptions.Item label="描述">{equipment.description || '-'}</Descriptions.Item>
      </Descriptions>

      {equipment.installation && (
        <>
          <Divider orientation="left">安装位置</Divider>
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="STA">{equipment.installation.sta ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="WL">{equipment.installation.wl ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="BL">{equipment.installation.bl ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="机架位置">{equipment.installation.rack_position ?? '-'}</Descriptions.Item>
          </Descriptions>
        </>
      )}

      {equipment.weight_balance && (
        <>
          <Divider orientation="left">重量数据</Divider>
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="重量">{equipment.weight_balance.mass_kg} kg</Descriptions.Item>
            <Descriptions.Item label="力臂STA">{equipment.weight_balance.arm_sta} mm</Descriptions.Item>
          </Descriptions>
        </>
      )}

      {equipment.electrical_load && (
        <>
          <Divider orientation="left">电气数据</Divider>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="正常功耗">{equipment.electrical_load.power_kva_normal} kVA</Descriptions.Item>
            <Descriptions.Item label="应急功耗">{equipment.electrical_load.power_kva_emergency ?? '-'} kVA</Descriptions.Item>
          </Descriptions>
        </>
      )}
    </Drawer>
  );
}
