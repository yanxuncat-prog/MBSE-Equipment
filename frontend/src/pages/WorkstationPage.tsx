import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
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
    } catch { toast.error('加载失败'); }
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
      if (editEquip) { await updateEquipment(editEquip.id, values); toast.success('更新成功'); }
      else { await createEquipment(values); toast.success('创建成功'); }
      setFormOpen(false); loadAll(); (window as any).__constraintRefresh?.();
    } catch { toast.error('保存失败'); }
  };

  return (
    <div>
      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="weight">重量</TabsTrigger>
          <TabsTrigger value="electrical">电气</TabsTrigger>
          <TabsTrigger value="do160">DO-160</TabsTrigger>
          <TabsTrigger value="bonding">搭接</TabsTrigger>
          <TabsTrigger value="layout">布局</TabsTrigger>
          <TabsTrigger value="ewis">EWIS</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab configId={activeConfigId} search={search} report={report} onEdit={handleEdit} onSelect={handleSelect} />
        </TabsContent>
        <TabsContent value="weight">
          <WeightTab equipment={allEquipment} report={report} onSelect={handleSelect} />
        </TabsContent>
        <TabsContent value="electrical">
          <ElectricalTab equipment={allEquipment} report={report} onSelect={handleSelect} />
        </TabsContent>
        <TabsContent value="do160">
          <DO160Tab equipment={allEquipment} onSelect={handleSelect} />
        </TabsContent>
        <TabsContent value="bonding">
          <BondingTab equipment={allEquipment} onSelect={handleSelect} />
        </TabsContent>
        <TabsContent value="layout">
          <LayoutTab equipment={allEquipment} onSelect={handleSelect} />
        </TabsContent>
        <TabsContent value="ewis">
          <EWISTab equipment={allEquipment} onSelect={handleSelect} />
        </TabsContent>
      </Tabs>
      <EquipmentForm open={formOpen} equipment={editEquip} onSave={handleSave} onCancel={() => setFormOpen(false)} />
      <EquipmentDetail equipment={selectedEquip} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
