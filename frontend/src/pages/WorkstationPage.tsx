import React, { useState } from 'react';
import { message } from 'antd';
import { EquipmentTable } from '../components/equipment/EquipmentTable';
import { EquipmentForm } from '../components/equipment/EquipmentForm';
import { EquipmentDetail } from '../components/equipment/EquipmentDetail';
import { ConstraintPanel } from '../components/constraints/ConstraintPanel';
import { useConstraintWS } from '../hooks/useConstraintWS';
import { useConfigStore } from '../store/configStore';
import { createEquipment, updateEquipment } from '../api/equipment';
import type { Equipment } from '../types';

export function WorkstationPage() {
  const { activeConfigId } = useConfigStore();
  const report = useConstraintWS(activeConfigId);

  const [formOpen, setFormOpen] = useState(false);
  const [editEquip, setEditEquip] = useState<Equipment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => { setEditEquip(null); setFormOpen(true); };
  const handleEdit = (e: Equipment) => { setEditEquip(e); setFormOpen(true); };
  const handleSelect = (e: Equipment) => { setSelectedEquip(e); setDetailOpen(true); };

  const handleSave = async (values: any) => {
    try {
      if (editEquip) {
        await updateEquipment(editEquip.id, values);
        message.success('更新成功');
      } else {
        await createEquipment(values);
        message.success('创建成功');
      }
      setFormOpen(false);
      setRefreshKey(k => k + 1);
      (window as any).__constraintRefresh?.();
    } catch {
      message.error('保存失败');
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: 16 }} key={refreshKey}>
        <EquipmentTable configId={activeConfigId} onAdd={handleAdd} onEdit={handleEdit} onSelect={handleSelect} />
      </div>
      <ConstraintPanel report={report} />
      <EquipmentForm open={formOpen} equipment={editEquip} onSave={handleSave} onCancel={() => setFormOpen(false)} />
      <EquipmentDetail equipment={selectedEquip} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
