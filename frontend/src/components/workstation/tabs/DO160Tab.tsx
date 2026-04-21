import React, { useMemo, useState, useCallback } from 'react';
import { Card, Switch, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StatsCard } from '../shared/StatsCard';
import { StatsRow } from '../shared/StatsRow';
import { ProfessionalTable } from '../shared/ProfessionalTable';
import { ProfessionalPanel } from '../shared/ProfessionalPanel';
import { CoverageRing } from '../charts/CoverageRing';
import { SimpleDonut } from '../charts/SimpleDonut';
import type { Equipment, ValidationReport } from '../../../types';

const { Text } = Typography;

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

const DAL_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
const DAL_COLORS: Record<string, string> = {
  A: '#FF3B30', B: '#FF9500', C: '#F59E0B', D: '#34C759', '未定义': '#d1d1d6',
};

/* ------------------------------------------------------------------ */
/* Cell status evaluation                                              */
/* ------------------------------------------------------------------ */
type CellStatus = 'good' | 'problem' | 'missing' | 'bool-true' | 'bool-false' | 'text';

function evaluateCell(value: any, isBoolField: boolean = false): CellStatus {
  if (value === null || value === undefined || value === '') return 'missing';
  if (isBoolField) return value === true ? 'bool-true' : 'bool-false';
  if (typeof value === 'string') {
    if (value.includes('不') || value.includes('未')) return 'problem';
    return 'good';
  }
  return 'good';
}

function cellStyle(status: CellStatus): React.CSSProperties {
  switch (status) {
    case 'good':
      return {
        background: 'radial-gradient(circle at center, #34C759 0%, #e8f5e9 100%)',
        color: '#1a5e2a',
      };
    case 'problem':
      return {
        background: 'radial-gradient(circle at center, #FF3B30 0%, #ffebee 100%)',
        color: '#fff',
        fontWeight: 600,
      };
    case 'missing':
      return {
        background: `repeating-linear-gradient(
          -45deg,
          #f5f5f5,
          #f5f5f5 4px,
          #e8e8e8 4px,
          #e8e8e8 8px
        )`,
        color: '#bbb',
      };
    case 'bool-true':
      return { background: '#e8f5e9', textAlign: 'center' };
    case 'bool-false':
      return { background: '#ffebee', textAlign: 'center' };
    default:
      return {};
  }
}

function cellContent(value: any, status: CellStatus): React.ReactNode {
  switch (status) {
    case 'missing': return <span style={{ fontSize: 11 }}>--</span>;
    case 'bool-true': return <span style={{ color: '#34C759', fontSize: 14 }}>&#9679;</span>;
    case 'bool-false': return <span style={{ color: '#FF3B30', fontSize: 14 }}>&#9679;</span>;
    default: return <span style={{ fontSize: 11 }}>{String(value)}</span>;
  }
}

/* ------------------------------------------------------------------ */
/* Heatmap column definitions                                          */
/* ------------------------------------------------------------------ */
interface HeatmapColumn {
  key: string;
  title: string;
  width: number;
  getValue: (e: Equipment) => any;
  isBool?: boolean;
}

const HEATMAP_COLS: HeatmapColumn[] = [
  { key: 'dal', title: 'DAL', width: 50, getValue: e => e.dal },
  { key: 'design_level', title: '设计要求等级', width: 90, getValue: e => e.do160_temp_design_level },
  { key: 'qual_level', title: '鉴定等级', width: 80, getValue: e => e.do160_temp_qual_level },
  { key: 'compliance', title: '鉴定符合', width: 80, getValue: e => e.do160_temp_compliance },
  { key: 'normal_temp', title: '正常温度', width: 80, getValue: e => e.normal_operating_temp },
  { key: 'short_temp', title: '短时温度', width: 80, getValue: e => e.short_term_temp },
  { key: 'ground_temp', title: '地面温度', width: 80, getValue: e => e.ground_storage_temp },
  { key: 'altitude', title: '高度', width: 60, getValue: e => e.operating_altitude },
  { key: 'report', title: '报告号', width: 90, getValue: e => e.qual_report_number },
  { key: 'first_flight', title: '首飞', width: 50, getValue: e => e.first_flight_onboard, isBool: true },
  { key: 'phase2', title: '二阶段', width: 55, getValue: e => e.phase2_onboard, isBool: true },
];

/* ------------------------------------------------------------------ */
/* DO160Tab Component                                                  */
/* ------------------------------------------------------------------ */
export function DO160Tab({ equipment, report, onSelect }: Props) {
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);

  /* ---- Computed stats ---- */
  const hasDal = useMemo(() => equipment.filter(e => e.dal != null && e.dal !== '').length, [equipment]);
  const noDal = useMemo(() => equipment.filter(e => e.dal == null || e.dal === '').length, [equipment]);
  const hasTemp = useMemo(
    () => equipment.filter(e => e.do160_temp_qual_level != null && e.do160_temp_qual_level !== '').length,
    [equipment],
  );
  const firstFlightCount = useMemo(() => equipment.filter(e => e.first_flight_onboard === true).length, [equipment]);
  const phase2Count = useMemo(() => equipment.filter(e => e.phase2_onboard === true).length, [equipment]);

  const dalPct = equipment.length > 0 ? ((hasDal / equipment.length) * 100).toFixed(1) : '0';

  /* ---- Sort by DAL priority ---- */
  const sortedEquipment = useMemo(() => {
    return [...equipment].sort((a, b) => {
      const aOrder = a.dal ? (DAL_ORDER[a.dal] ?? 4) : 5;
      const bOrder = b.dal ? (DAL_ORDER[b.dal] ?? 4) : 5;
      return aOrder - bOrder;
    });
  }, [equipment]);

  /* ---- Detect "problem rows" for filter ---- */
  const hasAnyProblem = useCallback((e: Equipment): boolean => {
    for (const col of HEATMAP_COLS) {
      const val = col.getValue(e);
      const status = evaluateCell(val, col.isBool);
      if (status === 'problem' || status === 'missing' || status === 'bool-false') return true;
    }
    return false;
  }, []);

  const displayEquipment = useMemo(() => {
    if (!showProblemsOnly) return sortedEquipment;
    return sortedEquipment.filter(hasAnyProblem);
  }, [sortedEquipment, showProblemsOnly, hasAnyProblem]);

  const problemCount = useMemo(() => sortedEquipment.filter(hasAnyProblem).length, [sortedEquipment, hasAnyProblem]);

  /* ---- DAL donut segments ---- */
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
      .map(([label, value]) => ({ label, value, color: DAL_COLORS[label] || '#636366' }));
  }, [equipment]);

  /* ---- Standard table columns ---- */
  const columns: ColumnsType<Equipment> = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', fixed: 'left', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', fixed: 'left', width: 160, ellipsis: true },
    {
      title: 'DAL', dataIndex: 'dal', key: 'dal', width: 50,
      sorter: (a, b) => (DAL_ORDER[a.dal ?? ''] ?? 99) - (DAL_ORDER[b.dal ?? ''] ?? 99),
      render: (v: string | null) => {
        if (!v) return <span style={{ color: '#ccc' }}>-</span>;
        return <span style={{ color: DAL_COLORS[v] || '#333', fontWeight: 700 }}>{v}</span>;
      },
    },
    { title: '设计要求等级', key: 'design_level', width: 100, ellipsis: true, render: (_, r) => r.do160_temp_design_level || '-' },
    { title: '鉴定等级', key: 'qual_level', width: 100, ellipsis: true, render: (_, r) => r.do160_temp_qual_level || '-' },
    {
      title: '鉴定符合情况', key: 'compliance', width: 120, ellipsis: true,
      render: (_, r) => {
        const v = r.do160_temp_compliance || '-';
        const isNon = v.includes('不') || v.includes('未');
        return <span style={isNon ? { color: '#FF3B30', fontWeight: 600 } : undefined}>{v}</span>;
      },
    },
    { title: '正常工作温度', key: 'normal_temp', width: 100, render: (_, r) => r.normal_operating_temp || '-' },
    { title: '短时工作温度', key: 'short_temp', width: 100, render: (_, r) => r.short_term_temp || '-' },
    { title: '地面停放温度', key: 'ground_temp', width: 100, render: (_, r) => r.ground_storage_temp || '-' },
    { title: '高度', key: 'altitude', width: 70, render: (_, r) => r.operating_altitude || '-' },
    { title: '鉴定报告号', key: 'qual_report', width: 120, ellipsis: true, render: (_, r) => r.qual_report_number || '-' },
    {
      title: '首飞上机', key: 'first_flight', width: 70,
      render: (_, r) => r.first_flight_onboard === true ? <span style={{ color: '#34C759' }}>是</span> : r.first_flight_onboard === false ? <span style={{ color: '#FF3B30' }}>否</span> : '-',
    },
    {
      title: '二阶段上机', key: 'phase2', width: 80,
      render: (_, r) => r.phase2_onboard === true ? <span style={{ color: '#34C759' }}>是</span> : r.phase2_onboard === false ? <span style={{ color: '#FF3B30' }}>否</span> : '-',
    },
  ];

  /* Banner */
  const bannerColor = hasDal < equipment.length * 0.5 ? '#FF3B30' : hasDal < equipment.length * 0.8 ? '#FF9500' : '#34C759';
  const bannerBg = hasDal < equipment.length * 0.5 ? '#FFF1F0' : hasDal < equipment.length * 0.8 ? '#FFF7E6' : '#F6FFED';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
      <style>{`
        .do160-matrix-table { border-collapse: collapse; font-size: 11px; width: 100%; }
        .do160-matrix-table th {
          background: #f7f8fa; color: #666; font-weight: 600; font-size: 10px;
          padding: 6px 4px; border: 1px solid #e8e8e8; position: sticky; top: 0; z-index: 2;
          white-space: nowrap;
        }
        .do160-matrix-table td {
          padding: 4px 6px; border: 1px solid #e8e8e8; text-align: center;
          transition: all 0.15s;
        }
        .do160-matrix-table tr:hover td { outline: 2px solid #3B82F6; outline-offset: -1px; }
        .do160-matrix-table .fixed-col {
          position: sticky; background: #fff; z-index: 1; text-align: left;
        }
        .do160-matrix-table .fixed-col-0 { left: 0; }
        .do160-matrix-table .fixed-col-1 { left: 90px; }
        .do160-heatmap-cell { min-height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 3px; }
        .do160-dal-badge {
          display: inline-block; padding: 1px 6px; border-radius: 3px; font-weight: 700; font-size: 11px;
        }
      `}</style>

      <div style={{ flex: 1, overflow: 'auto', paddingRight: 16 }}>
        {/* Hook Banner */}
        <div style={{ padding: '10px 16px', borderRadius: 6, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, background: bannerBg, border: `1px solid ${bannerColor}33` }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: bannerColor, flexShrink: 0 }} />
          <Text style={{ fontSize: 13, color: '#333' }}>
            <strong>{equipment.length}</strong> 台设备中，仅{' '}
            <span style={{ color: '#1E40AF', fontWeight: 700 }}>{hasDal} 台</span> 完成 DAL 鉴定 (
            <span style={{ color: bannerColor, fontWeight: 700 }}>{dalPct}%</span>
            )。首飞前需完成所有 A/B 级设备鉴定。
          </Text>
        </div>

        {/* Stats Row with CoverageRing */}
        <StatsRow>
          <Card size="small" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>DAL 覆盖</div>
            <CoverageRing covered={hasDal} total={equipment.length} label="已有 DAL" color="#1E40AF" size={90} />
          </Card>
          <Card size="small" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>温度鉴定</div>
            <CoverageRing covered={hasTemp} total={equipment.length} label="温度数据" color="#3B82F6" size={90} />
          </Card>
          <Card size="small" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>首飞就绪</div>
            <CoverageRing covered={firstFlightCount} total={equipment.length} label="首飞上机" color="#34C759" size={90} />
          </Card>
          <Card size="small" style={{ flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>缺鉴定</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#FF3B30' }}>{noDal}</div>
              <div style={{ fontSize: 11, color: '#999' }}>台设备</div>
            </div>
          </Card>
        </StatsRow>

        {/* Qualification Matrix Heatmap */}
        <Card
          size="small"
          title={`鉴定矩阵热力图 (${displayEquipment.length} 台)`}
          style={{ marginBottom: 16 }}
          bodyStyle={{ padding: 0, maxHeight: 420, overflowY: 'auto', overflowX: 'auto' }}
          extra={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 12, color: '#999' }}>只看问题项</Text>
              <Switch
                size="small"
                checked={showProblemsOnly}
                onChange={setShowProblemsOnly}
              />
              {showProblemsOnly && (
                <Text style={{ fontSize: 11, color: '#FF9500' }}>({problemCount} 台)</Text>
              )}
            </div>
          }
        >
          <table className="do160-matrix-table">
            <thead>
              <tr>
                <th className="fixed-col fixed-col-0" style={{ width: 90, minWidth: 90 }}>LIN号</th>
                <th className="fixed-col fixed-col-1" style={{ width: 130, minWidth: 130 }}>名称</th>
                {HEATMAP_COLS.map(col => (
                  <th key={col.key} style={{ width: col.width, minWidth: col.width }}>{col.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayEquipment.map(eq => (
                <tr
                  key={eq.id}
                  onClick={() => onSelect(eq)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="fixed-col fixed-col-0" style={{ fontSize: 10, color: '#666', whiteSpace: 'nowrap' }}>
                    {eq.lin_number || '-'}
                  </td>
                  <td className="fixed-col fixed-col-1" style={{ fontSize: 10, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                    <Tooltip title={eq.name}>{eq.name}</Tooltip>
                  </td>
                  {HEATMAP_COLS.map(col => {
                    const val = col.getValue(eq);
                    const status = evaluateCell(val, col.isBool);
                    const style = cellStyle(status);

                    // Special rendering for DAL column
                    if (col.key === 'dal' && val) {
                      return (
                        <td key={col.key}>
                          <span
                            className="do160-dal-badge"
                            style={{ background: `${DAL_COLORS[val] || '#999'}22`, color: DAL_COLORS[val] || '#999' }}
                          >
                            {val}
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={col.key} style={style}>
                        <div className="do160-heatmap-cell">
                          {cellContent(val, status)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {displayEquipment.length === 0 && (
                <tr>
                  <td colSpan={2 + HEATMAP_COLS.length} style={{ padding: 24, color: '#ccc', textAlign: 'center' }}>
                    {showProblemsOnly ? '无问题项设备' : '无设备数据'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        {/* Heatmap Legend */}
        <div style={{ display: 'flex', gap: 16, padding: '4px 8px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 2, background: 'radial-gradient(circle at center, #34C759, #e8f5e9)' }} />
            <Text style={{ fontSize: 10, color: '#888' }}>数据完整</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 2, background: 'radial-gradient(circle at center, #FF3B30, #ffebee)' }} />
            <Text style={{ fontSize: 10, color: '#888' }}>不符合/未完成</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 2, background: 'repeating-linear-gradient(-45deg, #f5f5f5, #f5f5f5 3px, #e0e0e0 3px, #e0e0e0 6px)' }} />
            <Text style={{ fontSize: 10, color: '#888' }}>缺失</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#34C759', fontSize: 12 }}>&#9679;</span>
            <Text style={{ fontSize: 10, color: '#888' }}>是</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#FF3B30', fontSize: 12 }}>&#9679;</span>
            <Text style={{ fontSize: 10, color: '#888' }}>否</Text>
          </div>
        </div>

        {/* Professional Table (full detail) */}
        <ProfessionalTable columns={columns} data={displayEquipment} onRowClick={onSelect} scrollX={1500} />
      </div>

      {/* Right Panel */}
      <ProfessionalPanel>
        <Card size="small" title="DAL 分布">
          <SimpleDonut segments={dalSegments} />
        </Card>
        <Card size="small" title="DAL 覆盖率">
          <CoverageRing covered={hasDal} total={equipment.length} label="已完成 DAL 鉴定" color="#1E40AF" />
        </Card>
        <Card size="small" title="温度数据覆盖">
          <CoverageRing covered={hasTemp} total={equipment.length} label="有温度鉴定数据" color="#3B82F6" />
        </Card>
        <Card size="small" title="上机统计">
          <div style={{ fontSize: 13, lineHeight: 2.2, padding: '4px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>首飞上机</span>
              <strong style={{ color: '#34C759' }}>{firstFlightCount} 台</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>二阶段上机</span>
              <strong style={{ color: '#3B82F6' }}>{phase2Count} 台</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid #f0f0f0' }}>
              <span style={{ color: '#666' }}>问题设备</span>
              <strong style={{ color: '#FF3B30' }}>{problemCount} 台</strong>
            </div>
          </div>
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
