import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Tabs } from 'antd';
import type { Equipment } from '../../types';

interface Props {
  open: boolean;
  equipment: Equipment | null;  // null = create mode
  onSave: (values: any) => void;
  onCancel: () => void;
}

export function EquipmentForm({ open, equipment, onSave, onCancel }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (equipment) {
        form.setFieldsValue({
          ...equipment,
          mass_kg: equipment.weight_balance?.mass_kg,
          arm_sta: equipment.weight_balance?.arm_sta,
          sta: equipment.installation?.sta,
          wl: equipment.installation?.wl,
          bl: equipment.installation?.bl,
          bus_id: equipment.electrical_load?.bus_id,
          power_kva_normal: equipment.electrical_load?.power_kva_normal,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, equipment, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      const body: any = {
        part_number: values.part_number,
        name: values.name,
        ata_chapter: values.ata_chapter,
        equipment_type: values.equipment_type || 'LRU',
        status: values.status || 'in_development',
        description: values.description,
      };
      if (values.sta != null || values.wl != null || values.bl != null) {
        body.installation = { sta: values.sta, wl: values.wl, bl: values.bl, zone_id: values.zone_id };
      }
      if (values.mass_kg != null) {
        body.weight_balance = { mass_kg: values.mass_kg, arm_sta: values.arm_sta || values.sta || 0 };
      }
      if (values.power_kva_normal != null && values.bus_id) {
        body.electrical_load = { bus_id: values.bus_id, power_kva_normal: values.power_kva_normal };
      }
      onSave(body);
    });
  };

  return (
    <Modal
      title={equipment ? `编辑设备: ${equipment.part_number}` : '添加设备'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={640}
      destroyOnClose
    >
      <Form form={form} layout="vertical" size="small">
        <Tabs items={[
          {
            key: 'basic', label: '基本信息',
            children: (
              <>
                <Form.Item name="part_number" label="件号" rules={[{ required: true }]}><Input /></Form.Item>
                <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
                <Form.Item name="ata_chapter" label="ATA章节" rules={[{ required: true }]}><Input placeholder="如: 34-21" /></Form.Item>
                <Form.Item name="equipment_type" label="类型" initialValue="LRU">
                  <Select options={[
                    { value: 'LRU', label: 'LRU' }, { value: 'SRU', label: 'SRU' },
                    { value: 'structural', label: '结构件' }, { value: 'cable', label: '线缆' },
                  ]} />
                </Form.Item>
                <Form.Item name="status" label="状态" initialValue="in_development">
                  <Select options={[
                    { value: 'in_development', label: '在研' }, { value: 'qualifying', label: '鉴定中' },
                    { value: 'approved', label: '已批准' }, { value: 'discontinued', label: '停产' },
                  ]} />
                </Form.Item>
                <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
              </>
            ),
          },
          {
            key: 'install', label: '安装位置',
            children: (
              <>
                <Form.Item name="sta" label="STA (站位)"><InputNumber style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="wl" label="WL (水线)"><InputNumber style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="bl" label="BL (翼肋线)"><InputNumber style={{ width: '100%' }} /></Form.Item>
              </>
            ),
          },
          {
            key: 'weight', label: '重量数据',
            children: (
              <>
                <Form.Item name="mass_kg" label="重量 (kg)"><InputNumber style={{ width: '100%' }} min={0} step={0.1} /></Form.Item>
                <Form.Item name="arm_sta" label="力臂 STA (mm)"><InputNumber style={{ width: '100%' }} /></Form.Item>
              </>
            ),
          },
          {
            key: 'elec', label: '电气数据',
            children: (
              <>
                <Form.Item name="bus_id" label="母线"><Input placeholder="母线UUID" /></Form.Item>
                <Form.Item name="power_kva_normal" label="正常功耗 (kVA)"><InputNumber style={{ width: '100%' }} min={0} step={0.01} /></Form.Item>
              </>
            ),
          },
        ]} />
      </Form>
    </Modal>
  );
}
