import React, { useMemo, useState, useCallback } from 'react';
import { Card, Collapse, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StatsCard } from '../shared/StatsCard';
import { StatsRow } from '../shared/StatsRow';
import { ProfessionalTable } from '../shared/ProfessionalTable';
import { ProfessionalPanel } from '../shared/ProfessionalPanel';
import { SimpleDonut } from '../charts/SimpleDonut';
import { HorizontalBar } from '../charts/HorizontalBar';
import type { Equipment, ValidationReport } from '../../../types';

const { Text } = Typography;

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

const GROUNDING_COLORS: Record<string, string> = {
  '面搭接': 'green',
  '线搭接': 'blue',
  '无': 'default',
  'TBD': 'default',
};

const GROUP_META: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  '面搭接': { color: '#34C759', bg: '#F6FFED', border: '#b7eb8f', icon: '■' },
  '线搭接': { color: '#1E40AF', bg: '#E6F7FF', border: '#91d5ff', icon: '━' },
  '无接地/TBD': { color: '#FF9500', bg: '#FFF7E6', border: '#ffe58f', icon: '○' },
  '缺搭接数据': { color: '#FF3B30', bg: '#FFF1F0', border: '#ffa39e', icon: '⚠' },
};

/* ------------------------------------------------------------------ */
/* BondingTab Component                                                */
/* ------------------------------------------------------------------ */
export function BondingTab({ equipment, onSelect }: Props) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['缺搭接数据']);

  /* ---- Group equipment ---- */
  const surfaceBond = useMemo(() => equipment.filter(e => e.shell_grounding_method === '面搭接'), [equipment]);
  const wireBond = useMemo(() => equipment.filter(e => e.shell_grounding_method === '线搭接'), [equipment]);
  const noGround = useMemo(
    () => equipment.filter(e => e.shell_grounding_method != null && e.shell_grounding_method !== '' && ['无', 'TBD'].includes(e.shell_grounding_method)),
    [equipment],
  );
  const missingBond = useMemo(
    () => equipment.filter(e => !e.shell_grounding_method || e.shell_grounding_method === ''),
    [equipment],
  );

  /* ---- Shell material stats ---- */
  const metalShell = useMemo(() => equipment.filter(e => e.is_metal_shell === true).length, [equipment]);
  const nonMetalShell = useMemo(() => equipment.filter(e => e.is_metal_shell === false).length, [equipment]);
  const unknownShell = useMemo(() => equipment.filter(e => e.is_metal_shell == null).length, [equipment]);

  /* ---- Non-metal on composite count (simulated) ---- */
  const nonMetalOnComposite = useMemo(() => equipment.filter(e => e.is_metal_shell === false).length, [equipment]);

  /* ---- Donut: grounding method distribution ---- */
  const groundingSegments = useMemo(() => {
    return [
      { label: '面搭接', value: surfaceBond.length, color: '#34C759' },
      { label: '线搭接', value: wireBond.length, color: '#1E40AF' },
      { label: '无/TBD', value: noGround.length, color: '#FF9500' },
      { label: '未知', value: missingBond.length, color: '#d1d1d6' },
    ].filter(s => s.value > 0);
  }, [surfaceBond, wireBond, noGround, missingBond]);

  /* ---- Donut: shell material ---- */
  const shellSegments = useMemo(() => {
    return [
      { label: '金属壳体', value: metalShell, color: '#5ac8fa' },
      { label: '非金属壳体', value: nonMetalShell, color: '#ff9500' },
      { label: '未知', value: unknownShell, color: '#d1d1d6' },
    ].filter(s => s.value > 0);
  }, [metalShell, nonMetalShell, unknownShell]);

  /* ---- Bar: bonding type distribution ---- */
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

  /* ---- Table columns ---- */
  const columns: ColumnsType<Equipment> = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', fixed: 'left', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', fixed: 'left', width: 160, ellipsis: true },
    {
      title: '壳体金属', key: 'metal_shell', width: 80,
      render: (_, r) => {
        if (r.is_metal_shell === true) return <Tag color="blue">是</Tag>;
        if (r.is_metal_shell === false) return <Tag color="orange">否</Tag>;
        return <span style={{ color: '#ccc' }}>-</span>;
      },
    },
    {
      title: '接地方式', key: 'grounding', width: 85,
      render: (_, r) => {
        const m = r.shell_grounding_method;
        if (!m) return <span style={{ color: '#ccc' }}>-</span>;
        const color = GROUNDING_COLORS[m] || 'default';
        return <Tag color={color}>{m}</Tag>;
      },
    },
    { title: '搭接类型', key: 'bonding_type', width: 90, ellipsis: true, render: (_, r) => r.config_data?.bonding_type || '-' },
    { title: '阻值(mΩ)', key: 'resistance', width: 80, render: (_, r) => r.config_data?.bonding_resistance || '-' },
    { title: '搭接位置', key: 'bonding_pos', width: 120, ellipsis: true, render: (_, r) => r.config_data?.bonding_position || '-' },
    { title: '故障路径', key: 'fault_path', width: 100, ellipsis: true, render: (_, r) => r.shell_grounding_fault_path || '-' },
    {
      title: 'PACE图纸', key: 'pace', width: 75,
      render: (_, r) => {
        if (r.config_data?.in_pace_drawing === true) return <Tag color="green">有</Tag>;
        if (r.config_data?.in_pace_drawing === false) return <Tag color="default">无</Tag>;
        return <span style={{ color: '#ccc' }}>-</span>;
      },
    },
    { title: '物理特性', key: 'physical', width: 150, ellipsis: true, render: (_, r) => r.physical_characteristics || '-' },
  ];

  /* ---- Group data for Collapse panels ---- */
  const groups = useMemo(() => [
    { key: '面搭接', label: '面搭接', data: surfaceBond },
    { key: '线搭接', label: '线搭接', data: wireBond },
    { key: '无接地/TBD', label: '无接地/TBD', data: noGround },
    { key: '缺搭接数据', label: '缺搭接数据', data: missingBond },
  ], [surfaceBond, wireBond, noGround, missingBond]);

  /* ---- Banner ---- */
  const bannerColor = missingBond.length > 20 ? '#FF3B30' : missingBond.length > 5 ? '#FF9500' : '#34C759';
  const bannerBg = missingBond.length > 20 ? '#FFF1F0' : missingBond.length > 5 ? '#FFF7E6' : '#F6FFED';

  const handleCollapseChange = useCallback((keys: string | string[]) => {
    setExpandedKeys(Array.isArray(keys) ? keys : [keys]);
  }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
      <style>{`
        .bonding-row-missing td { background: #fff2f0 !important; }
        .bonding-collapse .ant-collapse-header {
          padding: 8px 12px !important;
          border-radius: 6px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
        }
        .bonding-collapse .ant-collapse-content-box {
          padding: 0 !important;
        }
        .bonding-collapse .ant-collapse-item {
          border: none !important;
          margin-bottom: 8px !important;
        }
        .bonding-group-header {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }
        .bonding-group-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 20px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          padding: 0 8px;
        }
        .bonding-group-summary {
          font-size: 11px;
          color: #999;
          font-weight: 400;
          margin-left: auto;
        }
      `}</style>

      <div style={{ flex: 1, overflow: 'auto', paddingRight: 16 }}>
        {/* Hook Banner */}
        <div style={{ padding: '10px 16px', borderRadius: 6, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, background: bannerBg, border: `1px solid ${bannerColor}33` }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: bannerColor, flexShrink: 0 }} />
          <Text style={{ fontSize: 13, color: '#333' }}>
            <strong>{nonMetalOnComposite}</strong> 台非金属壳体设备安装在复材结构上。
            <span style={{ color: '#FF3B30', fontWeight: 700 }}>{missingBond.length} 台</span>设备缺少搭接数据。
          </Text>
        </div>

        {/* Stats Row */}
        <StatsRow>
          <StatsCard title="面搭接数" value={surfaceBond.length} color="#34C759" />
          <StatsCard title="线搭接数" value={wireBond.length} color="#1E40AF" />
          <StatsCard title="无接地" value={noGround.length} color="#FF9500" />
          <StatsCard title="缺数据" value={missingBond.length} color="#FF3B30" />
        </StatsRow>

        {/* Grouped Collapsible Table */}
        <Collapse
          className="bonding-collapse"
          activeKey={expandedKeys}
          onChange={handleCollapseChange}
          bordered={false}
          style={{ background: 'transparent' }}
          items={groups.map(group => {
            const meta = GROUP_META[group.key] || GROUP_META['缺搭接数据'];
            return {
              key: group.key,
              label: (
                <div className="bonding-group-header">
                  <span style={{ color: meta.color }}>{meta.icon}</span>
                  <span>{group.label}</span>
                  <span
                    className="bonding-group-count"
                    style={{ background: meta.color }}
                  >
                    {group.data.length}
                  </span>
                  <span className="bonding-group-summary">
                    {group.key === '面搭接' && group.data.length > 0 && '标准搭接方式'}
                    {group.key === '线搭接' && group.data.length > 0 && '线性搭接连接'}
                    {group.key === '无接地/TBD' && group.data.length > 0 && '需确认接地方案'}
                    {group.key === '缺搭接数据' && group.data.length > 0 && '需补充搭接信息'}
                  </span>
                </div>
              ),
              style: {
                background: meta.bg,
                border: `1px solid ${meta.border}`,
                borderRadius: 6,
              },
              children: group.data.length > 0 ? (
                <ProfessionalTable
                  columns={columns}
                  data={group.data}
                  onRowClick={onSelect}
                  scrollX={1300}
                  rowClassName={(record) =>
                    (!record.shell_grounding_method || record.shell_grounding_method === '') ? 'bonding-row-missing' : ''
                  }
                />
              ) : (
                <div style={{ padding: 16, textAlign: 'center', color: '#ccc', fontSize: 12 }}>此分组无设备</div>
              ),
            };
          })}
        />
      </div>

      {/* Right Panel */}
      <ProfessionalPanel>
        <Card size="small" title="接地方式分布">
          <SimpleDonut segments={groundingSegments} />
        </Card>
        <Card size="small" title="壳体材质">
          <SimpleDonut segments={shellSegments} />
          <div style={{ fontSize: 10, color: '#FF9500', textAlign: 'center', marginTop: 8, padding: '4px 8px', background: '#FFF7E6', borderRadius: 4, border: '1px solid #ffe58f' }}>
            非金属壳体设备需额外接地处理
          </div>
        </Card>
        <Card size="small" title="搭接类型分布">
          <HorizontalBar items={bondingTypeItems} />
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
