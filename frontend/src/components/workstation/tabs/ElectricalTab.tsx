import React, { useMemo } from 'react';
import { Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StatsCard } from '../shared/StatsCard';
import { StatsRow } from '../shared/StatsRow';
import { ProfessionalTable } from '../shared/ProfessionalTable';
import { ProfessionalPanel } from '../shared/ProfessionalPanel';
import { BusStatusDots } from '../../charts/BusStatusDots';
import { HorizontalBar } from '../charts/HorizontalBar';
import { SimpleDonut } from '../charts/SimpleDonut';
import type { Equipment, ValidationReport } from '../../../types';

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

export function ElectricalTab({ equipment, report, onSelect }: Props) {
  const elecEngine = report?.engines.find(e => e.engine_name === 'electrical_load');
  const buses: Record<string, any> = elecEngine?.details?.buses ?? {};
  const busEntries = Object.values(buses) as { bus_name: string; load_ratio_pct: number; load_kva: number; capacity_kva: number }[];

  const maxLoadRatio = useMemo(
    () => busEntries.length > 0 ? Math.max(...busEntries.map(b => b.load_ratio_pct)) : 0,
    [busEntries],
  );

  const primaryCount = useMemo(
    () => equipment.filter(e => e.is_primary_electrical === true).length,
    [equipment],
  );

  const elecCount = useMemo(
    () => equipment.filter(e => e.is_electrical === true).length,
    [equipment],
  );
  const nonElecCount = useMemo(
    () => equipment.filter(e => e.is_electrical !== true).length,
    [equipment],
  );

  const busBarItems = useMemo(
    () => busEntries.map(b => ({ label: b.bus_name, value: Math.round(b.load_ratio_pct), suffix: '%' })),
    [busEntries],
  );

  const columns: ColumnsType<Equipment> = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', fixed: 'left', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', fixed: 'left', width: 160, ellipsis: true },
    { title: '母线', key: 'bus', width: 100, render: (_, r) => r.config_data?.bus_name || '-' },
    {
      title: '功耗(kVA)', key: 'power', width: 80, align: 'right',
      render: (_, r) => r.electrical_load?.power_kva_normal?.toFixed(2) || '-',
    },
    { title: '供电电压', key: 'voltage', width: 80, render: (_, r) => r.power_voltage || '-' },
    { title: '供电余度', key: 'redundancy', width: 80, render: (_, r) => r.power_redundancy || '-' },
    { title: '一级设备', key: 'primary', width: 70, render: (_, r) => r.is_primary_electrical === true ? '是' : '-' },
    { title: '是否电设备', key: 'is_elec', width: 80, render: (_, r) => r.is_electrical === true ? '是' : r.is_electrical === false ? '否' : '-' },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata', width: 55 },
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
      <style>{`
        .row-non-electrical td { opacity: 0.4; }
      `}</style>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: 16 }}>
        <StatsRow>
          <Card size="small" style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>母线状态</div>
            {busEntries.length > 0 ? <BusStatusDots buses={buses} /> : <span style={{ color: '#ccc', fontSize: 12 }}>无数据</span>}
          </Card>
          <StatsCard
            title="最高负荷"
            value={maxLoadRatio.toFixed(1)}
            suffix="%"
            color={maxLoadRatio > 85 ? '#ff9500' : '#34c759'}
          />
          <StatsCard title="一级用电设备" value={primaryCount} color="#5ac8fa" />
        </StatsRow>
        <ProfessionalTable
          columns={columns}
          data={equipment}
          onRowClick={onSelect}
          scrollX={1000}
          rowClassName={(record) => (record.is_electrical === false || record.is_electrical == null) ? 'row-non-electrical' : ''}
        />
      </div>
      <ProfessionalPanel>
        <Card size="small" title="母线负荷">
          {busBarItems.length > 0 ? <HorizontalBar items={busBarItems} /> : <span style={{ color: '#ccc', fontSize: 12 }}>无数据</span>}
        </Card>
        <Card size="small" title="用电设备统计">
          <SimpleDonut segments={[
            { label: '电设备', value: elecCount, color: '#007aff' },
            { label: '非电设备', value: nonElecCount, color: '#d1d1d6' },
          ]} />
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
