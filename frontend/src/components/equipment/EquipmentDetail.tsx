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
        <Descriptions.Item label="供应商">{equipment.supplier_name || '-'}</Descriptions.Item>
        <Descriptions.Item label="状态"><Tag>{equipment.status}</Tag></Descriptions.Item>
        <Descriptions.Item label="描述">{equipment.description || '-'}</Descriptions.Item>
      </Descriptions>

      {equipment.config_data && (
        <>
          <Divider orientation="left">安装位置 (构型级)</Divider>
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="区域">{equipment.config_data.zone_name ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="机架位置">{equipment.config_data.rack_position ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="STA">{equipment.config_data.sta ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="WL">{equipment.config_data.wl ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="BL">{equipment.config_data.bl ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="母线">{equipment.config_data.bus_name ?? '-'}</Descriptions.Item>
          </Descriptions>
        </>
      )}

      {equipment.weight_balance && (
        <>
          <Divider orientation="left">重量数据</Divider>
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="重量">{equipment.weight_balance.mass_kg} kg</Descriptions.Item>
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
