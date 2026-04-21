import React, { useMemo } from 'react';
import { Button, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StatsCard } from '../shared/StatsCard';
import { StatsRow } from '../shared/StatsRow';
import { ProfessionalTable } from '../shared/ProfessionalTable';
import { ProfessionalPanel } from '../shared/ProfessionalPanel';
import { HorizontalBar } from '../charts/HorizontalBar';
import type { Equipment, ValidationReport } from '../../../types';

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

export function LayoutTab({ equipment, onSelect }: Props) {
  const zoneGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const e of equipment) {
      const key = e.config_data?.zone_name || '未知';
      groups[key] = (groups[key] || 0) + 1;
    }
    return groups;
  }, [equipment]);

  const uniqueZones = Object.keys(zoneGroups).filter(k => k !== '未知').length;

  const densestZone = useMemo(() => {
    let maxName = '-';
    let maxCount = 0;
    for (const [name, count] of Object.entries(zoneGroups)) {
      if (count > maxCount) { maxName = name; maxCount = count; }
    }
    return { name: maxName, count: maxCount };
  }, [zoneGroups]);

  const needsAdjustment = useMemo(
    () => equipment.filter(e => e.config_data?.layout_adjustment != null && e.config_data.layout_adjustment !== '').length,
    [equipment],
  );

  const zoneBarItems = useMemo(() =>
    Object.entries(zoneGroups)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    [zoneGroups],
  );

  const columns: ColumnsType<Equipment> = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', fixed: 'left', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', fixed: 'left', width: 160, ellipsis: true },
    { title: '区域', key: 'zone', width: 100, render: (_, r) => r.config_data?.zone_name || '-' },
    { title: '机架位置', key: 'rack', width: 100, ellipsis: true, render: (_, r) => r.config_data?.rack_position || '-' },
    { title: 'STA', key: 'sta', width: 60, align: 'right', render: (_, r) => r.config_data?.sta?.toFixed(0) || '-' },
    { title: 'WL', key: 'wl', width: 60, align: 'right', render: (_, r) => r.config_data?.wl?.toFixed(0) || '-' },
    { title: 'BL', key: 'bl', width: 60, align: 'right', render: (_, r) => r.config_data?.bl?.toFixed(0) || '-' },
    { title: '尺寸(mm)', key: 'dimensions', width: 110, ellipsis: true, render: (_, r) => r.dimensions_mm || '-' },
    { title: '安装方式', key: 'install', width: 110, ellipsis: true, render: (_, r) => r.config_data?.install_method || '-' },
    { title: '布局调整', key: 'layout_adj', width: 150, ellipsis: true, render: (_, r) => r.config_data?.layout_adjustment || '-' },
    {
      title: '0号机设备', key: 'batch0', width: 80,
      render: (_, r) => r.config_data?.use_batch0_device === true ? '是' : r.config_data?.use_batch0_device === false ? '否' : '-',
    },
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
      <style>{`
        .row-needs-adjustment td { background: #fffbe6 !important; }
      `}</style>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: 16 }}>
        <StatsRow>
          <StatsCard title="安装区域" value={uniqueZones} color="#007aff" />
          <StatsCard title="最密集区域" value={`${densestZone.name} (${densestZone.count})`} color="#ff9500" />
          <StatsCard title="需布局调整" value={needsAdjustment} color="#ff3b30" />
        </StatsRow>
        <ProfessionalTable
          columns={columns}
          data={equipment}
          onRowClick={onSelect}
          scrollX={1200}
          rowClassName={(record) =>
            record.config_data?.layout_adjustment != null && record.config_data.layout_adjustment !== ''
              ? 'row-needs-adjustment' : ''
          }
        />
      </div>
      <ProfessionalPanel>
        <Card size="small" title="区域密度">
          <HorizontalBar items={zoneBarItems} />
        </Card>
        <Card size="small">
          <Button type="primary" block onClick={() => window.location.href = '/spatial'}>
            打开空间视图 →
          </Button>
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
