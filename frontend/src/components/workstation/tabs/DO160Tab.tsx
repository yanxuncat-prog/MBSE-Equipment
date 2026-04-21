import React, { useMemo } from 'react';
import { Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StatsCard } from '../shared/StatsCard';
import { StatsRow } from '../shared/StatsRow';
import { ProfessionalTable } from '../shared/ProfessionalTable';
import { ProfessionalPanel } from '../shared/ProfessionalPanel';
import { CoverageRing } from '../charts/CoverageRing';
import { SimpleDonut } from '../charts/SimpleDonut';
import type { Equipment, ValidationReport } from '../../../types';

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

const DAL_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

export function DO160Tab({ equipment, onSelect }: Props) {
  const hasDal = useMemo(() => equipment.filter(e => e.dal != null && e.dal !== '').length, [equipment]);
  const noDal = useMemo(() => equipment.filter(e => e.dal == null || e.dal === '').length, [equipment]);
  const hasTemp = useMemo(() => equipment.filter(e => e.do160_temp_qual_level != null && e.do160_temp_qual_level !== '').length, [equipment]);
  const notOnboard = useMemo(() => equipment.filter(e => e.first_flight_onboard === false).length, [equipment]);

  const firstFlightCount = useMemo(() => equipment.filter(e => e.first_flight_onboard === true).length, [equipment]);
  const phase2Count = useMemo(() => equipment.filter(e => e.phase2_onboard === true).length, [equipment]);

  const dalSegments = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, '未定义': 0 };
    for (const e of equipment) {
      const d = e.dal;
      if (d && counts[d] !== undefined) counts[d]++;
      else if (!d || d === '') counts['未定义']++;
      else counts[d] = (counts[d] || 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([label, value]) => ({ label, value }));
  }, [equipment]);

  const columns: ColumnsType<Equipment> = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', fixed: 'left', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', fixed: 'left', width: 160, ellipsis: true },
    {
      title: 'DAL', dataIndex: 'dal', key: 'dal', width: 50,
      sorter: (a, b) => (DAL_ORDER[a.dal ?? ''] ?? 99) - (DAL_ORDER[b.dal ?? ''] ?? 99),
      render: (v: string | null) => v || '-',
    },
    { title: '设计要求等级', key: 'design_level', width: 100, ellipsis: true, render: (_, r) => r.do160_temp_design_level || '-' },
    { title: '鉴定等级', key: 'qual_level', width: 100, ellipsis: true, render: (_, r) => r.do160_temp_qual_level || '-' },
    {
      title: '鉴定符合情况', key: 'compliance', width: 120, ellipsis: true,
      render: (_, r) => {
        const v = r.do160_temp_compliance || '-';
        const isNon = v.includes('不') || v.includes('未');
        return <span style={isNon ? { color: '#ff3b30' } : undefined}>{v}</span>;
      },
    },
    { title: '正常工作温度', key: 'normal_temp', width: 100, render: (_, r) => r.normal_operating_temp || '-' },
    { title: '短时工作温度', key: 'short_temp', width: 100, render: (_, r) => r.short_term_temp || '-' },
    { title: '地面停放温度', key: 'ground_temp', width: 100, render: (_, r) => r.ground_storage_temp || '-' },
    { title: '高度', key: 'altitude', width: 70, render: (_, r) => r.operating_altitude || '-' },
    { title: '鉴定报告号', key: 'qual_report', width: 120, ellipsis: true, render: (_, r) => r.qual_report_number || '-' },
    {
      title: '首飞上机', key: 'first_flight', width: 70,
      render: (_, r) => r.first_flight_onboard === true ? '是' : r.first_flight_onboard === false ? '否' : '-',
    },
    {
      title: '二阶段上机', key: 'phase2', width: 80,
      render: (_, r) => r.phase2_onboard === true ? '是' : r.phase2_onboard === false ? '否' : '-',
    },
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: 16 }}>
        <StatsRow>
          <StatsCard title="有鉴定数据" value={hasDal} color="#34c759" />
          <StatsCard title="缺鉴定数据" value={noDal} color="#ff3b30" />
          <StatsCard title="有温度数据" value={hasTemp} color="#5ac8fa" />
          <StatsCard title="首飞未上机" value={notOnboard} color="#ff9500" />
        </StatsRow>
        <ProfessionalTable columns={columns} data={equipment} onRowClick={onSelect} scrollX={1500} />
      </div>
      <ProfessionalPanel>
        <Card size="small" title="DAL 分布">
          <SimpleDonut segments={dalSegments} />
        </Card>
        <Card size="small" title="鉴定覆盖率">
          <CoverageRing covered={hasDal} total={equipment.length} label="已有鉴定数据" />
        </Card>
        <Card size="small" title="上机统计">
          <div style={{ fontSize: 13, lineHeight: 2 }}>
            <div>首飞上机: <strong>{firstFlightCount}</strong> 台</div>
            <div>二阶段上机: <strong>{phase2Count}</strong> 台</div>
            <div>首飞未上机: <strong>{notOnboard}</strong> 台</div>
          </div>
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
