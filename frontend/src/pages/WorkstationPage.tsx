import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, message } from 'antd';
import { useConfigStore } from '../store/configStore';
import { useConstraintWS } from '../hooks/useConstraintWS';
import { createEquipment, updateEquipment, listEquipment } from '../api/equipment';
import { workstationActions } from '../components/layout/GlobalNav';
import { EquipmentForm } from '../components/equipment/EquipmentForm';
import { EquipmentDetail } from '../components/equipment/EquipmentDetail';
import { OverviewTab } from '../components/workstation/tabs/OverviewTab';
import { WeightTab } from '../components/workstation/tabs/WeightTab';
import { ElectricalTab } from '../components/workstation/tabs/ElectricalTab';
import { DO160Tab } from '../components/workstation/tabs/DO160Tab';
import { BondingTab } from '../components/workstation/tabs/BondingTab';
import { LayoutTab } from '../components/workstation/tabs/LayoutTab';
import { EWISTab } from '../components/workstation/tabs/EWISTab';
import type { Equipment } from '../types';

export function WorkstationPage() {
  const { activeConfigId } = useConfigStore();
  const report = useConstraintWS(activeConfigId);
  const [formOpen, setFormOpen] = useState(false);
  const [editEquip, setEditEquip] = useState<Equipment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  const [search, setSearch] = useState('');
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);

  const loadAll = useCallback(async () => {
    if (!activeConfigId) { setAllEquipment([]); return; }
    try {
      const result = await listEquipment({ config_id: activeConfigId, limit: 2000 });
      setAllEquipment(result.items);
    } catch { message.error('加载失败'); }
  }, [activeConfigId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    workstationActions.onAdd = () => { setEditEquip(null); setFormOpen(true); };
    workstationActions.onSearch = (v: string) => setSearch(v);
    return () => { workstationActions.onAdd = null; workstationActions.onSearch = null; };
  }, []);

  const handleSelect = (e: Equipment) => { setSelectedEquip(e); setDetailOpen(true); };
  const handleEdit = (e: Equipment) => { setEditEquip(e); setFormOpen(true); };
  const handleSave = async (values: any) => {
    try {
      if (editEquip) { await updateEquipment(editEquip.id, values); message.success('更新成功'); }
      else { await createEquipment(values); message.success('创建成功'); }
      setFormOpen(false); loadAll(); (window as any).__constraintRefresh?.();
    } catch { message.error('保存失败'); }
  };

  return (
    <div>
      <Tabs defaultActiveKey="overview" size="small" items={[
        { key: 'overview', label: '总览', children: <OverviewTab configId={activeConfigId} search={search} report={report} onEdit={handleEdit} onSelect={handleSelect} /> },
        { key: 'weight', label: '重量管理', children: <WeightTab equipment={allEquipment} report={report} onSelect={handleSelect} /> },
        { key: 'electrical', label: '电气负荷', children: <ElectricalTab equipment={allEquipment} report={report} onSelect={handleSelect} /> },
        { key: 'do160', label: '环境鉴定', children: <DO160Tab equipment={allEquipment} onSelect={handleSelect} /> },
        { key: 'bonding', label: '接地搭接', children: <BondingTab equipment={allEquipment} onSelect={handleSelect} /> },
        { key: 'layout', label: '安装布局', children: <LayoutTab equipment={allEquipment} onSelect={handleSelect} /> },
        { key: 'ewis', label: 'EWIS', children: <EWISTab equipment={allEquipment} onSelect={handleSelect} /> },
      ]} />
      <EquipmentForm open={formOpen} equipment={editEquip} onSave={handleSave} onCancel={() => setFormOpen(false)} />
      <EquipmentDetail equipment={selectedEquip} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
