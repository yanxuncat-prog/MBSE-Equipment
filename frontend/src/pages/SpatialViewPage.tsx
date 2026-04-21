import React, { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { SpatialView } from '../components/spatial/SpatialView';
import { EquipmentDetail } from '../components/equipment/EquipmentDetail';
import { useConfigStore } from '../store/configStore';
import { listEquipment } from '../api/equipment';
import type { Equipment, Zone } from '../types';
import client from '../api/client';

export function SpatialViewPage() {
  const { activeConfigId, activeSeriesId } = useConfigStore();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);

  const fetchEquipment = useCallback(async () => {
    if (!activeConfigId) return;
    try {
      const result = await listEquipment({ config_id: activeConfigId, limit: 200 });
      setEquipment(result.items.filter(e => e.installation));
    } catch {
      message.error('加载设备失败');
    }
  }, [activeConfigId]);

  const fetchZones = useCallback(async () => {
    if (!activeSeriesId) return;
    try {
      const { data } = await client.get('/zones', { params: { series_id: activeSeriesId } });
      setZones(data);
    } catch { /* zones API may not exist yet, silent fail */ }
  }, [activeSeriesId]);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);
  useEffect(() => { fetchZones(); }, [fetchZones]);

  const handleSelect = (equip: Equipment) => {
    setSelectedId(equip.id);
    setSelectedEquip(equip);
    setDetailOpen(true);
  };

  return (
    <div>
      <SpatialView equipment={equipment} zones={zones} selectedId={selectedId} onSelect={handleSelect} />
      <EquipmentDetail equipment={selectedEquip} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
