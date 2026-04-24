import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ProfessionalTable, type Column } from '../shared/ProfessionalTable';
import { listFlightPhases } from '@/api/electrical-details';
import { useConfigStore } from '@/store/configStore';

export function FlightPhasesTab() {
  const { activeConfigId } = useConfigStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeConfigId) return;
    setLoading(true);
    listFlightPhases(activeConfigId).then(setData).finally(() => setLoading(false));
  }, [activeConfigId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;

  const columns: Column<any>[] = [
    { title: '阶段编号', dataIndex: 'phase_code', key: 'code', width: 80 },
    { title: '阶段名称', dataIndex: 'phase_name', key: 'name', width: 130 },
    { title: '原统计运行阶段', dataIndex: 'original_phase', key: 'orig', width: 200,
      render: (v: string) => <span className="truncate block max-w-[190px]">{v || '-'}</span> },
    { title: '时长(min)', dataIndex: 'duration_min', key: 'dur', width: 80, align: 'right' },
    { title: '阶段定义', dataIndex: 'phase_definition', key: 'def', width: 350,
      render: (v: string) => <span className="line-clamp-2 block max-w-[340px] text-xs leading-tight">{v || '-'}</span> },
    { title: '舵面情况', dataIndex: 'control_surface', key: 'ctrl', width: 200,
      render: (v: string) => <span className="truncate block max-w-[190px]">{v || '-'}</span> },
    { title: '飞行速度TAS', dataIndex: 'speed_tas', key: 'tas', width: 110 },
    { title: '飞行高度', dataIndex: 'altitude', key: 'alt', width: 90 },
    { title: '峰值同时系数', dataIndex: 'peak_simultaneity', key: 'psim', width: 100, align: 'right' },
    { title: '应急同时系数', dataIndex: 'emergency_simultaneity', key: 'esim', width: 100, align: 'right' },
    { title: '270V功率来源', dataIndex: 'power_source_270v', key: 'src', width: 160,
      render: (v: string) => <span className="truncate block max-w-[150px]">{v || '-'}</span> },
  ];

  return (
    <div>
      <div className="mb-2 text-xs text-muted-foreground">共 {data.length} 个飞行阶段</div>
      <ProfessionalTable columns={columns} dataSource={data} rowKey="id" onEdit={() => {}} />
    </div>
  );
}
