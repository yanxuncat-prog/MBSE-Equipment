import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { ProfessionalTable, type Column } from '../shared/ProfessionalTable';
import { listLoadWorkModes } from '@/api/electrical-details';
import { useConfigStore } from '@/store/configStore';

export function LoadWorkModesTab() {
  const { activeConfigId } = useConfigStore();
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeConfigId) return;
    setLoading(true);
    listLoadWorkModes(activeConfigId).then(setRawData).finally(() => setLoading(false));
  }, [activeConfigId]);

  const data = useMemo(() => rawData, [rawData]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;

  const columns: Column<any>[] = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin', width: 120 },
    { title: '负载ID', dataIndex: 'load_id', key: 'lid', width: 160 },
    { title: '工作模式', dataIndex: 'work_mode', key: 'mode', width: 80 },
    { title: '电压(V)', dataIndex: 'voltage_level', key: 'vl', width: 70, align: 'right' },
    { title: '应急可卸', dataIndex: 'emergency_sheddable', key: 'es', width: 80 },
    { title: '负载类型', dataIndex: 'load_type', key: 'lt', width: 90 },
    { title: '功率(kW)', dataIndex: 'power_demand_kw', key: 'pwr', width: 80, align: 'right' },
    { title: 'G0', dataIndex: 'g0', key: 'g0', width: 40, align: 'center' },
    { title: 'G1', dataIndex: 'g1', key: 'g1', width: 40, align: 'center' },
    { title: 'G2', dataIndex: 'g2', key: 'g2', width: 40, align: 'center' },
    { title: 'G3', dataIndex: 'g3', key: 'g3', width: 40, align: 'center' },
    { title: 'G4', dataIndex: 'g4', key: 'g4', width: 40, align: 'center' },
    { title: 'G5', dataIndex: 'g5', key: 'g5', width: 40, align: 'center' },
    { title: 'G6', dataIndex: 'g6', key: 'g6', width: 40, align: 'center' },
    { title: 'G7', dataIndex: 'g7', key: 'g7', width: 40, align: 'center' },
    { title: 'G8', dataIndex: 'g8', key: 'g8', width: 40, align: 'center' },
  ];

  return (
    <div>
      <div className="mb-2 text-xs text-muted-foreground">共 {data.length} 条工作模式记录</div>
      <ProfessionalTable columns={columns} dataSource={data} rowKey="id" onEdit={() => {}} />
    </div>
  );
}
