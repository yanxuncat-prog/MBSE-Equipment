import React, { useMemo } from 'react';
import { Card, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StatsCard } from '../shared/StatsCard';
import { StatsRow } from '../shared/StatsRow';
import { ProfessionalTable } from '../shared/ProfessionalTable';
import { ProfessionalPanel } from '../shared/ProfessionalPanel';
import { SimpleDonut } from '../charts/SimpleDonut';
import { HorizontalBar } from '../charts/HorizontalBar';
import type { Equipment, ValidationReport } from '../../../types';

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

const GROUNDING_COLORS: Record<string, string> = {
  '面搭接': 'green',
  '线搭接': 'blue',
};

export function BondingTab({ equipment, onSelect }: Props) {
  const surfaceCount = useMemo(() => equipment.filter(e => e.shell_grounding_method === '面搭接').length, [equipment]);
  const wireCount = useMemo(() => equipment.filter(e => e.shell_grounding_method === '线搭接').length, [equipment]);
  const noGrounding = useMemo(
    () => equipment.filter(e => e.shell_grounding_method === '无' || e.shell_grounding_method === 'TBD').length,
    [equipment],
  );
  const missingData = useMemo(
    () => equipment.filter(e => e.shell_grounding_method == null || e.shell_grounding_method === '').length,
    [equipment],
  );

  const groundingSegments = useMemo(() => {
    const counts: Record<string, number> = { '面搭接': 0, '线搭接': 0, '无': 0, 'TBD': 0, '未知': 0 };
    for (const e of equipment) {
      const m = e.shell_grounding_method;
      if (!m || m === '') counts['未知']++;
      else if (counts[m] !== undefined) counts[m]++;
      else counts[m] = (counts[m] || 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([label, value]) => ({ label, value }));
  }, [equipment]);

  const shellSegments = useMemo(() => {
    let metal = 0, nonMetal = 0, unknown = 0;
    for (const e of equipment) {
      if (e.is_metal_shell === true) metal++;
      else if (e.is_metal_shell === false) nonMetal++;
      else unknown++;
    }
    return [
      { label: '金属', value: metal, color: '#5ac8fa' },
      { label: '非金属', value: nonMetal, color: '#ff9500' },
      { label: '未知', value: unknown, color: '#d1d1d6' },
    ].filter(s => s.value > 0);
  }, [equipment]);

  const bondingTypeItems = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const e of equipment) {
      const key = e.config_data?.bonding_type || '未知';
      groups[key] = (groups[key] || 0) + 1;
    }
    return Object.entries(groups)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [equipment]);

  const columns: ColumnsType<Equipment> = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', fixed: 'left', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', fixed: 'left', width: 160, ellipsis: true },
    {
      title: '壳体金属', key: 'metal_shell', width: 75,
      render: (_, r) => r.is_metal_shell === true ? '是' : r.is_metal_shell === false ? '否' : '-',
    },
    { title: '壳体处理', key: 'shell_treatment', width: 120, ellipsis: true, render: (_, r) => r.metal_shell_non_conductive || '-' },
    {
      title: '接地方式', key: 'grounding', width: 80,
      render: (_, r) => {
        const m = r.shell_grounding_method;
        if (!m) return '-';
        const color = GROUNDING_COLORS[m] || 'default';
        return <Tag color={color}>{m}</Tag>;
      },
    },
    { title: '搭接类型', key: 'bonding_type', width: 90, ellipsis: true, render: (_, r) => r.config_data?.bonding_type || '-' },
    { title: '阻值(mΩ)', key: 'resistance', width: 80, render: (_, r) => r.config_data?.bonding_resistance || '-' },
    { title: '搭接位置', key: 'bonding_pos', width: 120, ellipsis: true, render: (_, r) => r.config_data?.bonding_position || '-' },
    { title: '故障路径', key: 'fault_path', width: 100, ellipsis: true, render: (_, r) => r.shell_grounding_fault_path || '-' },
    { title: '特殊要求', key: 'special_req', width: 120, ellipsis: true, render: (_, r) => r.grounding_special_requirements || '-' },
    {
      title: 'PACE图纸', key: 'pace', width: 70,
      render: (_, r) => r.config_data?.in_pace_drawing === true ? '是' : r.config_data?.in_pace_drawing === false ? '否' : '-',
    },
    { title: '物理特性', key: 'physical', width: 150, ellipsis: true, render: (_, r) => r.physical_characteristics || '-' },
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
      <style>{`
        .row-missing-data td { background: #fff2f0 !important; }
      `}</style>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: 16 }}>
        <StatsRow>
          <StatsCard title="面搭接" value={surfaceCount} color="#34c759" />
          <StatsCard title="线搭接" value={wireCount} color="#5ac8fa" />
          <StatsCard title="无接地" value={noGrounding} color="#ff9500" />
          <StatsCard title="缺数据" value={missingData} color="#ff3b30" />
        </StatsRow>
        <ProfessionalTable
          columns={columns}
          data={equipment}
          onRowClick={onSelect}
          scrollX={1500}
          rowClassName={(record) =>
            (record.shell_grounding_method == null || record.shell_grounding_method === '') &&
            (record.config_data?.bonding_type == null || record.config_data?.bonding_type === '')
              ? 'row-missing-data' : ''
          }
        />
      </div>
      <ProfessionalPanel>
        <Card size="small" title="接地方式分布">
          <SimpleDonut segments={groundingSegments} />
        </Card>
        <Card size="small" title="壳体材质">
          <SimpleDonut segments={shellSegments} />
        </Card>
        <Card size="small" title="搭接类型">
          <HorizontalBar items={bondingTypeItems} />
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
