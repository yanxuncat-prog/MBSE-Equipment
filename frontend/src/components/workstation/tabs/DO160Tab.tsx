import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { StatsRow } from '@/components/workstation/shared/StatsRow';
import { ProfessionalTable, type Column } from '@/components/workstation/shared/ProfessionalTable';
import { ProfessionalPanel } from '@/components/workstation/shared/ProfessionalPanel';
import { CoverageRing } from '@/components/workstation/charts/CoverageRing';
import { SimpleDonut } from '@/components/workstation/charts/SimpleDonut';
import type { Equipment, ValidationReport } from '@/types';

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
    case 'missing': return <span className="text-[11px]">--</span>;
    case 'bool-true': return <span className="text-[#34C759] text-sm">&#9679;</span>;
    case 'bool-false': return <span className="text-[#FF3B30] text-sm">&#9679;</span>;
    default: return <span className="text-[11px]">{String(value)}</span>;
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
export function DO160Tab({ equipment, report: _report, onSelect }: Props) {
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
  const columns: Column<Equipment>[] = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
    {
      title: 'DAL', dataIndex: 'dal', key: 'dal', width: 50,
      render: (v: string | null) => {
        if (!v) return <span className="text-muted-foreground">-</span>;
        return <span className="font-bold" style={{ color: DAL_COLORS[v] || '#333' }}>{v}</span>;
      },
    },
    { title: '设计要求等级', key: 'design_level', width: 100, render: (_, r) => r.do160_temp_design_level || '-' },
    { title: '鉴定等级', key: 'qual_level', width: 100, render: (_, r) => r.do160_temp_qual_level || '-' },
    {
      title: '鉴定符合情况', key: 'compliance', width: 120,
      render: (_, r) => {
        const v = r.do160_temp_compliance || '-';
        const isNon = v.includes('不') || v.includes('未');
        return <span className={isNon ? 'text-[#FF3B30] font-semibold' : ''}>{v}</span>;
      },
    },
    { title: '正常工作温度', key: 'normal_temp', width: 100, render: (_, r) => r.normal_operating_temp || '-' },
    { title: '短时工作温度', key: 'short_temp', width: 100, render: (_, r) => r.short_term_temp || '-' },
    { title: '地面停放温度', key: 'ground_temp', width: 100, render: (_, r) => r.ground_storage_temp || '-' },
    { title: '高度', key: 'altitude', width: 70, render: (_, r) => r.operating_altitude || '-' },
    { title: '鉴定报告号', key: 'qual_report', width: 120, render: (_, r) => r.qual_report_number || '-' },
    {
      title: '首飞上机', key: 'first_flight', width: 70,
      render: (_, r) => r.first_flight_onboard === true ? <span className="text-[#34C759]">是</span> : r.first_flight_onboard === false ? <span className="text-[#FF3B30]">否</span> : '-',
    },
    {
      title: '二阶段上机', key: 'phase2', width: 80,
      render: (_, r) => r.phase2_onboard === true ? <span className="text-[#34C759]">是</span> : r.phase2_onboard === false ? <span className="text-[#FF3B30]">否</span> : '-',
    },
  ];

  /* Banner */
  const bannerColor = hasDal < equipment.length * 0.5 ? '#FF3B30' : hasDal < equipment.length * 0.8 ? '#FF9500' : '#34C759';
  const bannerBg = hasDal < equipment.length * 0.5 ? '#FFF1F0' : hasDal < equipment.length * 0.8 ? '#FFF7E6' : '#F6FFED';

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-180px)]">
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

        <div className="flex-1 overflow-auto pr-4">
          {/* Hook Banner */}
          <div
            className="flex items-center gap-2 rounded-md px-4 py-2.5 mb-3"
            style={{ background: bannerBg, border: `1px solid ${bannerColor}33` }}
          >
            <div className="size-2 shrink-0 rounded-full" style={{ background: bannerColor }} />
            <p className="text-[13px] text-foreground">
              <strong>{equipment.length}</strong> 台设备中，仅{' '}
              <span className="font-bold text-[#1E40AF]">{hasDal} 台</span> 完成 DAL 鉴定 (
              <span className="font-bold" style={{ color: bannerColor }}>{dalPct}%</span>
              )。首飞前需完成所有 A/B 级设备鉴定。
            </p>
          </div>

          {/* Stats Row with CoverageRing */}
          <StatsRow>
            <Card size="sm" className="flex-1 text-center">
              <CardContent>
                <div className="text-[11px] text-muted-foreground mb-1">DAL 覆盖</div>
                <CoverageRing covered={hasDal} total={equipment.length} label="已有 DAL" color="#1E40AF" size={90} />
              </CardContent>
            </Card>
            <Card size="sm" className="flex-1 text-center">
              <CardContent>
                <div className="text-[11px] text-muted-foreground mb-1">温度鉴定</div>
                <CoverageRing covered={hasTemp} total={equipment.length} label="温度数据" color="#3B82F6" size={90} />
              </CardContent>
            </Card>
            <Card size="sm" className="flex-1 text-center">
              <CardContent>
                <div className="text-[11px] text-muted-foreground mb-1">首飞就绪</div>
                <CoverageRing covered={firstFlightCount} total={equipment.length} label="首飞上机" color="#34C759" size={90} />
              </CardContent>
            </Card>
            <Card size="sm" className="flex-1">
              <CardContent className="text-center">
                <div className="text-[11px] text-muted-foreground mb-2">缺鉴定</div>
                <div className="text-[28px] font-bold text-[#FF3B30]">{noDal}</div>
                <div className="text-[11px] text-muted-foreground">台设备</div>
              </CardContent>
            </Card>
          </StatsRow>

          {/* Qualification Matrix Heatmap */}
          <Card size="sm" className="mb-4">
            <CardHeader className="border-b">
              <CardTitle>{`鉴定矩阵热力图 (${displayEquipment.length} 台)`}</CardTitle>
              <CardAction>
                <div className="flex items-center gap-2">
                  <Label htmlFor="problems-only" className="text-xs text-muted-foreground cursor-pointer">只看问题项</Label>
                  <Checkbox
                    id="problems-only"
                    checked={showProblemsOnly}
                    onCheckedChange={(checked: boolean) => setShowProblemsOnly(checked)}
                  />
                  {showProblemsOnly && (
                    <span className="text-[11px] text-[#FF9500]">({problemCount} 台)</span>
                  )}
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0 max-h-[420px] overflow-y-auto overflow-x-auto">
              <table className="do160-matrix-table">
                <thead>
                  <tr>
                    <th className="fixed-col fixed-col-0 w-[90px] min-w-[90px]">LIN号</th>
                    <th className="fixed-col fixed-col-1 w-[130px] min-w-[130px]">名称</th>
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
                      className="cursor-pointer"
                    >
                      <td className="fixed-col fixed-col-0 text-[10px] text-muted-foreground whitespace-nowrap">
                        {eq.lin_number || '-'}
                      </td>
                      <td className="fixed-col fixed-col-1 text-[10px] text-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[130px]">
                        <Tooltip>
                          <TooltipTrigger>{eq.name}</TooltipTrigger>
                          <TooltipContent>{eq.name}</TooltipContent>
                        </Tooltip>
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
                      <td colSpan={2 + HEATMAP_COLS.length} className="p-6 text-muted-foreground text-center">
                        {showProblemsOnly ? '无问题项设备' : '无设备数据'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Heatmap Legend */}
          <div className="flex gap-4 px-2 py-1 mb-3">
            <div className="flex items-center gap-1">
              <div className="size-3.5 rounded-sm" style={{ background: 'radial-gradient(circle at center, #34C759, #e8f5e9)' }} />
              <span className="text-[10px] text-muted-foreground">数据完整</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-3.5 rounded-sm" style={{ background: 'radial-gradient(circle at center, #FF3B30, #ffebee)' }} />
              <span className="text-[10px] text-muted-foreground">不符合/未完成</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-3.5 rounded-sm" style={{ background: 'repeating-linear-gradient(-45deg, #f5f5f5, #f5f5f5 3px, #e0e0e0 3px, #e0e0e0 6px)' }} />
              <span className="text-[10px] text-muted-foreground">缺失</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#34C759] text-xs">&#9679;</span>
              <span className="text-[10px] text-muted-foreground">是</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#FF3B30] text-xs">&#9679;</span>
              <span className="text-[10px] text-muted-foreground">否</span>
            </div>
          </div>

          {/* Professional Table (full detail) */}
          <ProfessionalTable columns={columns} dataSource={displayEquipment} onRow={(record) => ({ onClick: () => onSelect(record) })} />
        </div>

        {/* Right Panel */}
        <ProfessionalPanel>
          <Card size="sm">
            <CardHeader>
              <CardTitle>DAL 分布</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleDonut segments={dalSegments} />
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>DAL 覆盖率</CardTitle>
            </CardHeader>
            <CardContent>
              <CoverageRing covered={hasDal} total={equipment.length} label="已完成 DAL 鉴定" color="#1E40AF" />
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>温度数据覆盖</CardTitle>
            </CardHeader>
            <CardContent>
              <CoverageRing covered={hasTemp} total={equipment.length} label="有温度鉴定数据" color="#3B82F6" />
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>上机统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[13px] leading-[2.2] py-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">首飞上机</span>
                  <strong className="text-[#34C759]">{firstFlightCount} 台</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">二阶段上机</span>
                  <strong className="text-[#3B82F6]">{phase2Count} 台</strong>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">问题设备</span>
                  <strong className="text-[#FF3B30]">{problemCount} 台</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </ProfessionalPanel>
      </div>
    </TooltipProvider>
  );
}
