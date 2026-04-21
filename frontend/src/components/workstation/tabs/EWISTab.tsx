import React, { useMemo } from 'react';
import { Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StatsCard } from '../shared/StatsCard';
import { StatsRow } from '../shared/StatsRow';
import { ProfessionalTable } from '../shared/ProfessionalTable';
import { ProfessionalPanel } from '../shared/ProfessionalPanel';
import { CoverageRing } from '../charts/CoverageRing';
import { ConnectorHistogram } from '../charts/ConnectorHistogram';
import type { Equipment, ValidationReport } from '../../../types';

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

export function EWISTab({ equipment, onSelect }: Props) {
  const hasEicdCount = useMemo(() => equipment.filter(e => e.has_eicd === true).length, [equipment]);
  const totalConnectors = useMemo(() => equipment.reduce((sum, e) => sum + (e.connector_count || 0), 0), [equipment]);
  const specialWiringCount = useMemo(() => equipment.filter(e => e.has_special_wiring === true).length, [equipment]);

  const ataEicdData = useMemo(() => {
    const groups: Record<string, { total: number; hasEicd: number }> = {};
    for (const e of equipment) {
      const ata = e.ata_chapter || '未知';
      if (!groups[ata]) groups[ata] = { total: 0, hasEicd: 0 };
      groups[ata].total++;
      if (e.has_eicd === true) groups[ata].hasEicd++;
    }
    return Object.entries(groups)
      .sort((a, b) => b[1].total - a[1].total);
  }, [equipment]);

  const columns: ColumnsType<Equipment> = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', fixed: 'left', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', fixed: 'left', width: 160, ellipsis: true },
    {
      title: '连接器数', key: 'connector_count', width: 75, align: 'right', defaultSortOrder: 'descend',
      sorter: (a, b) => (a.connector_count ?? 0) - (b.connector_count ?? 0),
      render: (_, r) => r.connector_count ?? '-',
    },
    {
      title: '有EICD', key: 'has_eicd', width: 65,
      render: (_, r) => r.has_eicd === true ? '有' : r.has_eicd === false ? '无' : '-',
    },
    {
      title: '特殊布线', key: 'special_wiring', width: 70,
      render: (_, r) => r.has_special_wiring === true ? '是' : r.has_special_wiring === false ? '否' : '-',
    },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata', width: 55 },
    { title: '区域', key: 'zone', width: 100, render: (_, r) => r.config_data?.zone_name || '-' },
    { title: '电压范围', key: 'voltage_range', width: 100, ellipsis: true, render: (_, r) => r.voltage_range || '-' },
    { title: '供应商', key: 'supplier', width: 100, ellipsis: true, render: (_, r) => r.supplier_name || '-' },
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
      <style>{`
        .row-high-complexity td { background: #fff7e6 !important; }
      `}</style>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: 16 }}>
        <StatsRow>
          <StatsCard title="有EICD" value={hasEicdCount} color="#34c759" />
          <StatsCard title="总连接器" value={totalConnectors} color="#5ac8fa" />
          <StatsCard title="特殊布线" value={specialWiringCount} color="#ff9500" />
        </StatsRow>
        <ProfessionalTable
          columns={columns}
          data={equipment}
          onRowClick={onSelect}
          scrollX={950}
          rowClassName={(record) =>
            (record.connector_count ?? 0) >= 5 ? 'row-high-complexity' : ''
          }
        />
      </div>
      <ProfessionalPanel>
        <Card size="small" title="EICD 覆盖率">
          <CoverageRing covered={hasEicdCount} total={equipment.length} label="EICD 覆盖率" />
        </Card>
        <Card size="small" title="连接器分布">
          <ConnectorHistogram equipment={equipment} />
        </Card>
        <Card size="small" title="ATA EICD覆盖">
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            <div style={{ display: 'flex', fontSize: 10, color: '#999', borderBottom: '1px solid #f0f0f0', paddingBottom: 4, marginBottom: 4 }}>
              <div style={{ width: 50 }}>ATA</div>
              <div style={{ flex: 1, textAlign: 'right' }}>总数</div>
              <div style={{ flex: 1, textAlign: 'right' }}>有EICD</div>
              <div style={{ flex: 1, textAlign: 'right' }}>覆盖率</div>
            </div>
            {ataEicdData.map(([ata, { total, hasEicd }]) => (
              <div key={ata} style={{ display: 'flex', fontSize: 11, lineHeight: '22px', borderBottom: '1px solid #fafafa' }}>
                <div style={{ width: 50, fontWeight: 500 }}>{ata}</div>
                <div style={{ flex: 1, textAlign: 'right', color: '#666' }}>{total}</div>
                <div style={{ flex: 1, textAlign: 'right', color: '#666' }}>{hasEicd}</div>
                <div style={{ flex: 1, textAlign: 'right', color: total > 0 && hasEicd / total >= 0.8 ? '#34c759' : '#ff9500' }}>
                  {total > 0 ? `${((hasEicd / total) * 100).toFixed(0)}%` : '-'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
