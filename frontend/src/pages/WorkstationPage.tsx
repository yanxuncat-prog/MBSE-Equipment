import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useConfigStore } from '../store/configStore';
import { useConstraintWS } from '../hooks/useConstraintWS';
import { createEquipment, updateEquipment, listEquipment } from '../api/equipment';
import { workstationActions } from '../components/layout/GlobalNav';
import { EquipmentForm } from '../components/equipment/EquipmentForm';
import { OverviewTab } from '../components/workstation/tabs/OverviewTab';
import { WeightTab } from '../components/workstation/tabs/WeightTab';
import { ElectricalTab } from '../components/workstation/tabs/ElectricalTab';
import { DO160Tab } from '../components/workstation/tabs/DO160Tab';
import { LayoutTab } from '../components/workstation/tabs/LayoutTab';
import { ElectricalDetailsTab } from '../components/workstation/tabs/ElectricalDetailsTab';
import { FlightPhasesTab } from '../components/workstation/tabs/FlightPhasesTab';
import { LoadWorkModesTab } from '../components/workstation/tabs/LoadWorkModesTab';
import type { Equipment } from '../types';

export function WorkstationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'overview';
  const { activeConfigId, activeATA } = useConfigStore();
  const report = useConstraintWS(activeConfigId);
  const [formOpen, setFormOpen] = useState(false);
  const [editEquip, setEditEquip] = useState<Equipment | null>(null);
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

  // Filter by ATA if selected
  const filteredEquipment = useMemo(() => {
    if (!activeATA) return allEquipment;
    return allEquipment.filter(e => e.ata_chapter === activeATA);
  }, [allEquipment, activeATA]);

  useEffect(() => {
    workstationActions.onAdd = () => { setEditEquip(null); setFormOpen(true); };
    workstationActions.onSearch = (v: string) => setSearch(v);
    return () => { workstationActions.onAdd = null; workstationActions.onSearch = null; };
  }, []);

  const handleSelect = (_e: Equipment) => { /* preview handled by OverviewTab */ };
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
      <Tabs value={tabFromUrl} onValueChange={(v) => setSearchParams({ tab: v })}>
        <TabsContent value="overview">
          <OverviewTab configId={activeConfigId} search={search} report={report} onEdit={handleEdit} onSelect={handleSelect} allEquipment={filteredEquipment} />
        </TabsContent>
        <TabsContent value="weight">
          <WeightTab equipment={filteredEquipment} report={report} onSelect={handleSelect} onEdit={handleEdit} />
        </TabsContent>
        <TabsContent value="electrical">
          <ElectricalTab equipment={filteredEquipment} report={report} onSelect={handleSelect} onEdit={handleEdit} />
        </TabsContent>
        <TabsContent value="do160">
          <DO160Tab equipment={filteredEquipment} onSelect={handleSelect} onEdit={handleEdit} />
        </TabsContent>
        <TabsContent value="layout">
          <LayoutTab equipment={filteredEquipment} onSelect={handleSelect} onEdit={handleEdit} />
        </TabsContent>
        <TabsContent value="ewis">
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="p-6 rounded-lg border bg-card max-w-lg text-center space-y-3">
              <h3 className="font-semibold text-lg">EICD 平台状态</h3>
              <p className="text-sm text-muted-foreground">
                EICD平台独立管理连接器和针孔关系。当前与设备管理平台断开联动，各自独立管理。
                后续再考虑数据同步机制。
              </p>
              <Badge variant="secondary">独立运行</Badge>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="elec-details">
          <ElectricalDetailsTab />
        </TabsContent>
        <TabsContent value="flight-phases">
          <FlightPhasesTab />
        </TabsContent>
        <TabsContent value="load-modes">
          <LoadWorkModesTab />
        </TabsContent>
      </Tabs>
      <EquipmentForm open={formOpen} equipment={editEquip} onSave={handleSave} onCancel={() => setFormOpen(false)} />
    </div>
  );
}
