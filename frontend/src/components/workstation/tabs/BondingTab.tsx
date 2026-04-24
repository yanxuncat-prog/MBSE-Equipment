import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProfessionalTable } from '@/components/workstation/shared/ProfessionalTable';
import type { Column } from '@/components/workstation/shared/ProfessionalTable';
import type { Equipment } from '@/types';

interface Props {
  equipment: Equipment[];
  onSelect: (e: Equipment) => void;
  onEdit?: (e: Equipment) => void;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Extract ATA system name: "EATA32 起落架系统" → "起落架系统" */
function ataSystemName(desc: string | null): string {
  if (!desc) return '未知';
  const parts = desc.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : desc;
}

/** Top N keys by count, rest collapsed into "其他" */
function topN(counts: Record<string, number>, n: number) {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, n);
  const restCount = sorted.slice(n).reduce((s, [, v]) => s + v, 0);
  return { top, restCount };
}

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];
const MUTED_COLOR = 'var(--muted)';

/* ------------------------------------------------------------------ */
/* Progress Ring (SVG)                                                  */
/* ------------------------------------------------------------------ */
function ProgressRing({ value, size = 48 }: { value: number; size?: number }) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-500"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-xs font-semibold"
      >
        {value}%
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* BondingTab Component                                                */
/* ------------------------------------------------------------------ */
export function BondingTab({ equipment, onSelect, onEdit }: Props) {
  /* ---- KPI metrics ---- */
  const kpis = useMemo(() => {
    const electricalDevices = equipment.filter((e) => e.is_electrical === true);
    const withBondingType = electricalDevices.filter(
      (e) => e.config_data?.bonding_type && e.config_data.bonding_type.trim() !== '',
    );
    const coverageRate =
      electricalDevices.length > 0
        ? Math.round((withBondingType.length / electricalDevices.length) * 100)
        : 0;

    // bonding_method distribution
    const methodCounts: Record<string, number> = {};
    for (const e of equipment) {
      const m = e.config_data?.bonding_method;
      if (m && m.trim() !== '') {
        methodCounts[m] = (methodCounts[m] || 0) + 1;
      }
    }

    // PACE coverage
    const paceTrue = equipment.filter((e) => e.config_data?.in_pace_drawing === true).length;
    const paceFalse = equipment.filter((e) => e.config_data?.in_pace_drawing === false).length;
    const paceTotal = paceTrue + paceFalse;
    const paceRate = paceTotal > 0 ? Math.round((paceTrue / paceTotal) * 100) : 0;

    return { coverageRate, withBondingType: withBondingType.length, electricalTotal: electricalDevices.length, methodCounts, paceRate, paceTrue, paceTotal };
  }, [equipment]);

  /* ---- Grouped bar chart data: bonding_type composition per ATA ---- */
  const { ataData, typeColorMap, legendItems } = useMemo(() => {
    // Collect bonding_type counts globally to pick top 5
    const globalTypeCounts: Record<string, number> = {};
    const ataMap: Record<string, Record<string, number>> = {};

    for (const e of equipment) {
      const bt = e.config_data?.bonding_type;
      if (!bt || bt.trim() === '') continue;
      const ataLabel = ataSystemName(e.description);

      globalTypeCounts[bt] = (globalTypeCounts[bt] || 0) + 1;
      if (!ataMap[ataLabel]) ataMap[ataLabel] = {};
      ataMap[ataLabel][bt] = (ataMap[ataLabel][bt] || 0) + 1;
    }

    const { top, restCount } = topN(globalTypeCounts, 5);
    const topTypes = new Set(top.map(([k]) => k));

    // Build color map
    const colorMap: Record<string, string> = {};
    top.forEach(([k], i) => {
      colorMap[k] = CHART_COLORS[i];
    });
    colorMap['其他'] = MUTED_COLOR;

    // Legend items
    const legend = top.map(([label, count], i) => ({
      label,
      count,
      color: CHART_COLORS[i],
    }));
    if (restCount > 0) {
      legend.push({ label: '其他', count: restCount, color: MUTED_COLOR });
    }

    // Build ATA rows, merging non-top types into "其他"
    const rows = Object.entries(ataMap)
      .map(([ata, types]) => {
        const segments: { type: string; count: number }[] = [];
        let otherCount = 0;
        for (const [t, c] of Object.entries(types)) {
          if (topTypes.has(t)) {
            segments.push({ type: t, count: c });
          } else {
            otherCount += c;
          }
        }
        if (otherCount > 0) segments.push({ type: '其他', count: otherCount });
        const total = segments.reduce((s, seg) => s + seg.count, 0);
        return { ata, segments, total };
      })
      .sort((a, b) => b.total - a.total);

    return {
      ataData: rows,
      typeColorMap: colorMap,
      legendItems: legend,
    };
  }, [equipment]);

  /* ---- Waffle chart data: bonding_method ---- */
  const waffleData = useMemo(() => {
    const items: { method: string; color: string }[] = [];
    const methodList = Object.keys(kpis.methodCounts);
    // Assign colors deterministically
    const colorAssign: Record<string, string> = {};
    methodList.forEach((m, i) => {
      colorAssign[m] = CHART_COLORS[i % CHART_COLORS.length];
    });

    for (const e of equipment) {
      const m = e.config_data?.bonding_method;
      if (m && m.trim() !== '') {
        items.push({ method: m, color: colorAssign[m] || MUTED_COLOR });
      }
    }
    // Sort so same methods are grouped
    items.sort((a, b) => a.method.localeCompare(b.method));

    return { items: items.slice(0, 80), colorAssign };
  }, [equipment, kpis.methodCounts]);

  /* ---- Table: filtered to devices with at least one bonding field ---- */
  const tableData = useMemo(() => {
    return equipment.filter((e) => {
      const cd = e.config_data;
      if (!cd) return false;
      return (
        (cd.bonding_type && cd.bonding_type.trim() !== '') ||
        (cd.bonding_method && cd.bonding_method.trim() !== '') ||
        (cd.install_method && cd.install_method.trim() !== '') ||
        (cd.bonding_resistance && cd.bonding_resistance.trim() !== '') ||
        (cd.bonding_position && cd.bonding_position.trim() !== '') ||
        cd.in_pace_drawing != null
      );
    });
  }, [equipment]);

  const columns: Column<Equipment>[] = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
    {
      title: 'ATA系统',
      key: 'ata',
      width: 120,
      render: (_, r) => ataSystemName(r.description),
    },
    {
      title: '搭接类型',
      key: 'bonding_type',
      width: 110,
      render: (_, r) => {
        const v = r.config_data?.bonding_type;
        if (!v) return <span className="text-muted-foreground/50">-</span>;
        return <Badge variant="secondary">{v}</Badge>;
      },
    },
    {
      title: '搭接方式',
      key: 'bonding_method',
      width: 100,
      render: (_, r) => {
        const v = r.config_data?.bonding_method;
        if (!v) return <span className="text-muted-foreground/50">-</span>;
        return <Badge variant="outline">{v}</Badge>;
      },
    },
    {
      title: '安装方式',
      key: 'install_method',
      width: 130,
      render: (_, r) => r.config_data?.install_method || <span className="text-muted-foreground/50">-</span>,
    },
    {
      title: '搭接阻值',
      key: 'bonding_resistance',
      width: 90,
      render: (_, r) => r.config_data?.bonding_resistance || <span className="text-muted-foreground/50">-</span>,
    },
    {
      title: '搭接位置',
      key: 'bonding_position',
      width: 130,
      render: (_, r) => r.config_data?.bonding_position || <span className="text-muted-foreground/50">-</span>,
    },
    {
      title: 'PACE图纸',
      key: 'pace',
      width: 80,
      render: (_, r) => {
        if (r.config_data?.in_pace_drawing === true) return <Badge className="bg-green-600 text-white">有</Badge>;
        if (r.config_data?.in_pace_drawing === false) return <Badge variant="secondary">无</Badge>;
        return <span className="text-muted-foreground/50">-</span>;
      },
    },
  ];

  /* ---- SVG grouped bar chart dimensions ---- */
  const barChartHeight = Math.max(200, ataData.length * 32 + 40);
  const barChartWidth = 600;
  const labelWidth = 100;
  const barAreaWidth = barChartWidth - labelWidth - 20;
  const maxTotal = Math.max(...ataData.map((d) => d.total), 1);

  return (
    <div className="space-y-4 overflow-auto pb-6">
      {/* ============================================================ */}
      {/* 1. KPI Row                                                    */}
      {/* ============================================================ */}
      <div className="grid grid-cols-3 gap-4">
        {/* KPI: 搭接覆盖率 */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>搭接覆盖率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ProgressRing value={kpis.coverageRate} />
              <div className="text-sm text-muted-foreground">
                <span className="text-lg font-bold text-foreground">{kpis.withBondingType}</span>
                <span> / {kpis.electricalTotal}</span>
                <div className="text-xs">电气设备已定义搭接类型</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI: 搭接方式分布 */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>搭接方式分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {Object.entries(kpis.methodCounts).map(([method, count], i) => (
                <div key={method} className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-sm"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-sm">
                    {method}{' '}
                    <span className="font-bold text-foreground">{count}</span>
                  </span>
                  {i < Object.keys(kpis.methodCounts).length - 1 && (
                    <span className="text-muted-foreground/40">|</span>
                  )}
                </div>
              ))}
              {Object.keys(kpis.methodCounts).length === 0 && (
                <span className="text-sm text-muted-foreground">暂无数据</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPI: PACE覆盖率 */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>PACE覆盖率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ProgressRing value={kpis.paceRate} />
              <div className="text-sm text-muted-foreground">
                <span className="text-lg font-bold text-foreground">{kpis.paceTrue}</span>
                <span> / {kpis.paceTotal}</span>
                <div className="text-xs">设备已纳入PACE图纸</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* 2. Grouped bar chart by ATA (pure SVG)                       */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle>按ATA系统 - 搭接类型分布</CardTitle>
        </CardHeader>
        <CardContent>
          {ataData.length > 0 ? (
            <>
              <svg
                width="100%"
                viewBox={`0 0 ${barChartWidth} ${barChartHeight}`}
                className="overflow-visible"
                role="img"
                aria-label="搭接类型分布图"
              >
                <title>搭接类型分布图</title>
                {ataData.map((row, ri) => {
                  const y = ri * 32 + 20;
                  let xOffset = 0;
                  return (
                    <g key={row.ata}>
                      {/* ATA label */}
                      <text
                        x={labelWidth - 8}
                        y={y + 11}
                        textAnchor="end"
                        className="fill-muted-foreground text-xs"
                      >
                        {row.ata.length > 8 ? row.ata.slice(0, 8) + '...' : row.ata}
                      </text>
                      {/* Stacked bar segments */}
                      {row.segments.map((seg) => {
                        const w = (seg.count / maxTotal) * barAreaWidth;
                        const x = labelWidth + xOffset;
                        xOffset += w;
                        return (
                          <rect
                            key={seg.type}
                            x={x}
                            y={y}
                            width={Math.max(w, 1)}
                            height={20}
                            rx={3}
                            fill={typeColorMap[seg.type] || MUTED_COLOR}
                            className="transition-all duration-300"
                          >
                            <title>{`${seg.type}: ${seg.count}`}</title>
                          </rect>
                        );
                      })}
                      {/* Total count */}
                      <text
                        x={labelWidth + xOffset + 6}
                        y={y + 14}
                        className="fill-muted-foreground text-xs"
                      >
                        {row.total}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {legendItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="size-2.5 rounded-sm"
                      style={{ background: item.color }}
                    />
                    <span className="text-muted-foreground">
                      {item.label}{' '}
                      <span className="font-semibold text-foreground">{item.count}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">暂无搭接类型数据</div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 3. Waffle chart for bonding_method (pure CSS/div grid)        */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle>搭接方式 - 华夫图</CardTitle>
        </CardHeader>
        <CardContent>
          {waffleData.items.length > 0 ? (
            <>
              <div className="grid grid-cols-[repeat(20,1fr)] gap-1">
                {waffleData.items.map((cell, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-sm transition-colors"
                    style={{ background: cell.color }}
                    title={cell.method}
                  />
                ))}
                {/* Pad remaining cells to 80 */}
                {Array.from({ length: Math.max(0, 80 - waffleData.items.length) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square rounded-sm"
                    style={{ background: 'var(--muted)' }}
                  />
                ))}
              </div>
              {/* Waffle legend */}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {Object.entries(waffleData.colorAssign).map(([method, color]) => (
                  <div key={method} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="size-2.5 rounded-sm"
                      style={{ background: color }}
                    />
                    <span className="text-muted-foreground">
                      {method}{' '}
                      <span className="font-semibold text-foreground">
                        {kpis.methodCounts[method] || 0}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">暂无搭接方式数据</div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 4. Bottom: Data Table                                         */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle>搭接数据明细</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ProfessionalTable
            columns={columns}
            dataSource={tableData}
            onRow={(record) => ({ onClick: () => onSelect(record) })}
            onEdit={onEdit}
            maxHeight="400px"
          />
        </CardContent>
      </Card>
    </div>
  );
}
