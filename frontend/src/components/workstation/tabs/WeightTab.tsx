import React, { useMemo } from 'react';
import { Card, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StatsCard } from '../shared/StatsCard';
import { StatsRow } from '../shared/StatsRow';
import { ProfessionalTable } from '../shared/ProfessionalTable';
import { ProfessionalPanel } from '../shared/ProfessionalPanel';
import { CGEnvelopeChart } from '../../charts/CGEnvelopeChart';
import { HorizontalBar } from '../charts/HorizontalBar';
import type { Equipment, ValidationReport } from '../../../types';

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

const STATUS_TAGS: Record<string, { color: string; text: string }> = {
  approved: { color: 'green', text: '已批准' },
  in_development: { color: 'blue', text: '在研' },
  qualifying: { color: 'orange', text: '鉴定中' },
  discontinued: { color: 'red', text: '停产' },
};

export function WeightTab({ equipment, report, onSelect }: Props) {
  const weightEngine = report?.engines.find(e => e.engine_name === 'weight_balance');
  const cgPctMac = weightEngine?.details?.cg_pct_mac ?? 0;
  const totalMassKg = weightEngine?.details?.total_mass_kg ?? 0;
  const mtowMarginKg = weightEngine?.details?.mtow_margin_kg ?? 0;

  const totalWeight = useMemo(
    () => equipment.reduce((sum, e) => sum + (e.weight_balance?.mass_kg ?? 0), 0),
    [equipment],
  );
  const missingCount = useMemo(
    () => equipment.filter(e => e.weight_balance == null).length,
    [equipment],
  );

  const cgColor = weightEngine?.status === 'pass' ? '#34c759' : weightEngine?.status === 'warning' ? '#ff9500' : '#ff3b30';

  const ataBarItems = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const e of equipment) {
      if (e.weight_balance?.mass_kg) {
        const key = e.ata_chapter || '未知';
        groups[key] = (groups[key] || 0) + e.weight_balance.mass_kg;
      }
    }
    return Object.entries(groups)
      .map(([label, value]) => ({ label, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [equipment]);

  const zoneBarItems = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const e of equipment) {
      if (e.weight_balance?.mass_kg) {
        const key = e.config_data?.zone_name || '未知';
        groups[key] = (groups[key] || 0) + e.weight_balance.mass_kg;
      }
    }
    return Object.entries(groups)
      .map(([label, value]) => ({ label, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [equipment]);

  const columns: ColumnsType<Equipment> = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', fixed: 'left', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', fixed: 'left', width: 160, ellipsis: true },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata_chapter', width: 55 },
    {
      title: '重量(kg)', key: 'mass_kg', width: 80, align: 'right', defaultSortOrder: 'descend',
      sorter: (a, b) => (a.weight_balance?.mass_kg ?? 0) - (b.weight_balance?.mass_kg ?? 0),
      render: (_, r) => r.weight_balance?.mass_kg?.toFixed(1) || '-',
    },
    {
      title: 'STA(力臂)', key: 'sta', width: 70, align: 'right',
      render: (_, r) => r.config_data?.sta?.toFixed(0) || '-',
    },
    {
      title: '力矩(kg·mm)', key: 'moment', width: 100, align: 'right',
      render: (_, r) => {
        const mass = r.weight_balance?.mass_kg;
        const sta = r.config_data?.sta;
        if (mass != null && sta != null) return (mass * sta).toLocaleString('zh-CN', { maximumFractionDigits: 0 });
        return '-';
      },
    },
    { title: '区域', key: 'zone', width: 100, render: (_, r) => r.config_data?.zone_name || '-' },
    { title: '供应商', key: 'supplier', width: 100, ellipsis: true, render: (_, r) => r.supplier_name || '-' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 70,
      render: (s: string) => {
        const cfg = STATUS_TAGS[s] || { color: 'default', text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: 16 }}>
        <StatsRow>
          <StatsCard title="总重量" value={totalWeight.toFixed(1)} suffix="kg" color="#007aff" />
          <StatsCard title="CG 位置" value={cgPctMac.toFixed(1)} suffix="% MAC" color={cgColor} />
          <StatsCard title="MTOW 余量" value={mtowMarginKg.toFixed(1)} suffix="kg" color="#5ac8fa" />
          <StatsCard title="缺重量数据" value={missingCount} color="#ff9500" />
        </StatsRow>
        <ProfessionalTable columns={columns} data={equipment} onRowClick={onSelect} scrollX={1100} />
      </div>
      <ProfessionalPanel>
        <Card size="small" title="CG 包线图">
          <CGEnvelopeChart
            cgPctMac={cgPctMac}
            totalMassKg={totalMassKg}
            mtowKg={100000}
            fwdLimitPct={20}
            aftLimitPct={40}
            status={weightEngine?.status ?? 'pass'}
            width={250}
            height={180}
          />
        </Card>
        <Card size="small" title="按ATA重量分布">
          <HorizontalBar items={ataBarItems} />
        </Card>
        <Card size="small" title="按区域重量分布">
          <HorizontalBar items={zoneBarItems} />
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
