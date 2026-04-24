import type React from 'react';
import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ProfessionalTable, type Column } from '@/components/workstation/shared/ProfessionalTable';
import type { Equipment } from '@/types';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
interface Props {
  equipment: Equipment[];
  onSelect: (equip: Equipment) => void;
  onEdit?: (equip: Equipment) => void;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** "EATA32 起落架系统" → "起落架系统" */
function extractATASystemName(description: string | null): string {
  if (!description) return '未知系统';
  const parts = description.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(' ') : description;
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return '0';
  return ((numerator / denominator) * 100).toFixed(1);
}

/* ------------------------------------------------------------------ */
/* ATA row data for the coverage matrix                                */
/* ------------------------------------------------------------------ */
interface ATARow {
  ata: string;
  ataName: string;
  electrical: number;
  hasEicd: number;
  noEicd: number;
  unknownEicd: number;
  coveragePct: number;
}

/* ------------------------------------------------------------------ */
/* EWISTab Component                                                   */
/* ------------------------------------------------------------------ */
export function EWISTab({ equipment, onSelect, onEdit }: Props) {
  /* ---- Classify devices ---- */
  const electricalDevices = useMemo(
    () => equipment.filter((e) => e.is_electrical === true),
    [equipment],
  );
  const nonElectricalCount = useMemo(
    () => equipment.filter((e) => e.is_electrical === false).length,
    [equipment],
  );
  const unknownElectricalCount = useMemo(
    () => equipment.filter((e) => e.is_electrical == null).length,
    [equipment],
  );

  /* ---- EICD stats (electrical devices only) ---- */
  const hasEicdCount = useMemo(
    () => electricalDevices.filter((e) => e.has_eicd === true).length,
    [electricalDevices],
  );
  const noEicdCount = useMemo(
    () => electricalDevices.filter((e) => e.has_eicd === false).length,
    [electricalDevices],
  );
  const unknownEicdCount = useMemo(
    () => electricalDevices.filter((e) => e.has_eicd == null).length,
    [electricalDevices],
  );

  /* ---- KPI values ---- */
  const totalCount = equipment.length;
  const electricalCount = electricalDevices.length;
  const eicdCoveragePct = pct(hasEicdCount, electricalCount);
  const pendingEicdCount = unknownEicdCount;

  /* ---- ATA grouping for coverage matrix ---- */
  const ataRows: ATARow[] = useMemo(() => {
    const map: Record<string, { ataName: string; electrical: number; hasEicd: number; noEicd: number; unknownEicd: number }> = {};

    for (const e of equipment) {
      const ata = e.ata_chapter || '未知';
      if (e.is_electrical !== true) continue;

      if (!map[ata]) {
        map[ata] = {
          ataName: extractATASystemName(e.description),
          electrical: 0,
          hasEicd: 0,
          noEicd: 0,
          unknownEicd: 0,
        };
      }
      map[ata].electrical++;
      if (e.has_eicd === true) map[ata].hasEicd++;
      else if (e.has_eicd === false) map[ata].noEicd++;
      else map[ata].unknownEicd++;
    }

    return Object.entries(map)
      .map(([ata, d]) => ({
        ata,
        ataName: d.ataName,
        electrical: d.electrical,
        hasEicd: d.hasEicd,
        noEicd: d.noEicd,
        unknownEicd: d.unknownEicd,
        coveragePct: d.electrical > 0 ? (d.hasEicd / d.electrical) * 100 : 0,
      }))
      .sort((a, b) => b.electrical - a.electrical);
  }, [equipment]);

  /* ---- Donut chart data ---- */
  const donutSegments = useMemo(() => {
    const withEicd = hasEicdCount;
    const withoutEicd = noEicdCount + unknownEicdCount;
    const nonElectrical = nonElectricalCount + unknownElectricalCount;
    return [
      { label: '电设备(有EICD)', value: withEicd, color: 'var(--chart-1)' },
      { label: '电设备(无/未知EICD)', value: withoutEicd, color: 'var(--chart-3)' },
      { label: '非电设备', value: nonElectrical, color: 'var(--muted)' },
    ];
  }, [hasEicdCount, noEicdCount, unknownEicdCount, nonElectricalCount, unknownElectricalCount]);

  /* ---- Table: electrical devices sorted by EICD gap ---- */
  const tableData = useMemo(() => {
    return [...electricalDevices].sort((a, b) => {
      // Devices without EICD first (null > false > true)
      const eicdOrder = (e: Equipment) =>
        e.has_eicd === true ? 2 : e.has_eicd === false ? 1 : 0;
      return eicdOrder(a) - eicdOrder(b);
    });
  }, [electricalDevices]);

  const columns: Column<Equipment>[] = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata', width: 70 },
    {
      title: '是否电设备',
      key: 'is_electrical',
      width: 90,
      align: 'center',
      render: (_, r) => renderBool(r.is_electrical),
    },
    {
      title: '有EICD',
      key: 'has_eicd',
      width: 80,
      align: 'center',
      render: (_, r) => renderBool(r.has_eicd),
    },
  ];

  return (
    <div className="space-y-4 overflow-auto h-[calc(100vh-180px)] pr-1">
      {/* ============================================================ */}
      {/* 1. KPI Row                                                    */}
      {/* ============================================================ */}
      <div className="grid grid-cols-3 gap-3">
        <KPICard
          title="电设备数"
          value={electricalCount}
          sub={`/ ${totalCount} 台`}
          pct={pct(electricalCount, totalCount)}
          accent="var(--chart-1)"
        />
        <KPICard
          title="EICD覆盖率"
          value={hasEicdCount}
          sub={`/ ${electricalCount} 电设备`}
          pct={eicdCoveragePct}
          accent="var(--status-ok)"
        />
        <KPICard
          title="待补充EICD"
          value={pendingEicdCount}
          sub="台电设备"
          accent="var(--status-warn)"
        />
      </div>

      {/* ============================================================ */}
      {/* 2. EICD Coverage Matrix by ATA                                */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle>EICD 覆盖率矩阵（按ATA系统）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {/* Header */}
            <div className="grid grid-cols-[minmax(140px,1.5fr)_80px_70px_70px_70px_minmax(120px,1fr)] items-center gap-x-2 px-4 py-2 text-xs font-semibold text-muted-foreground border-b">
              <div>ATA名称</div>
              <div className="text-right">电设备数</div>
              <div className="text-right">有EICD</div>
              <div className="text-right">无EICD</div>
              <div className="text-right">未知</div>
              <div className="text-right">覆盖率</div>
            </div>
            {/* Rows */}
            <div className="max-h-[320px] overflow-y-auto">
              {ataRows.map((row) => {
                const barColor =
                  row.coveragePct > 80
                    ? 'var(--status-ok)'
                    : row.coveragePct >= 50
                      ? 'var(--chart-1)'
                      : 'var(--status-warn)';
                return (
                  <div
                    key={row.ata}
                    className="grid grid-cols-[minmax(140px,1.5fr)_80px_70px_70px_70px_minmax(120px,1fr)] items-center gap-x-2 px-4 py-1.5 text-[13px] border-b border-border/40 hover:bg-muted/40 transition-colors"
                  >
                    <div className="truncate">
                      <span className="text-muted-foreground mr-1.5 font-mono text-xs">{row.ata}</span>
                      <span className="text-foreground">{row.ataName}</span>
                    </div>
                    <div className="text-right tabular-nums font-medium">{row.electrical}</div>
                    <div className="text-right tabular-nums" style={{ color: 'var(--status-ok)' }}>
                      {row.hasEicd}
                    </div>
                    <div className="text-right tabular-nums" style={{ color: 'var(--status-danger, var(--destructive))' }}>
                      {row.noEicd}
                    </div>
                    <div className="text-right tabular-nums text-muted-foreground">{row.unknownEicd}</div>
                    <div className="flex items-center gap-2 justify-end">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(row.coveragePct, 100)}%`,
                            background: barColor,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-semibold tabular-nums w-[38px] text-right"
                        style={{ color: barColor }}
                      >
                        {row.coveragePct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 3. Donut Chart                                                */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle>设备分类构成</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8 justify-center">
            <DonutChart segments={donutSegments} total={totalCount} size={160} thickness={24} />
            <div className="flex flex-col gap-2">
              {donutSegments.map((seg) => (
                <div key={seg.label} className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-sm shrink-0"
                    style={{ background: seg.color }}
                  />
                  <span className="text-sm text-foreground">{seg.label}</span>
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground ml-auto pl-4">
                    {seg.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* 4. Table: Electrical Devices                                  */}
      {/* ============================================================ */}
      <ProfessionalTable
        columns={columns}
        dataSource={tableData}
        onRow={(record) => ({ onClick: () => onSelect(record) })}
        onEdit={onEdit}
        maxHeight="400px"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* KPI Card                                                            */
/* ------------------------------------------------------------------ */
function KPICard({
  title,
  value,
  sub,
  pct,
  accent,
}: {
  title: string;
  value: number;
  sub: string;
  pct?: string;
  accent: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1 pt-1">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: accent }}
          >
            {value}
          </span>
          <span className="text-xs text-muted-foreground">{sub}</span>
        </div>
        {pct != null && (
          <span className="text-xs font-medium tabular-nums" style={{ color: accent }}>
            {pct}%
          </span>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Bool Renderer                                                       */
/* ------------------------------------------------------------------ */
function renderBool(val: boolean | null): React.ReactNode {
  if (val === true)
    return (
      <span className="font-medium" style={{ color: 'var(--status-ok)' }}>
        是
      </span>
    );
  if (val === false)
    return (
      <span className="text-muted-foreground">否</span>
    );
  return <span className="text-muted-foreground/50">-</span>;
}

/* ------------------------------------------------------------------ */
/* SVG Donut Chart (pure)                                              */
/* ------------------------------------------------------------------ */
interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function DonutChart({
  segments,
  total,
  size = 160,
  thickness = 24,
}: {
  segments: DonutSegment[];
  total: number;
  size?: number;
  thickness?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;

  // Filter out zero-value segments
  const activeSegments = segments.filter((s) => s.value > 0);
  const totalValue = activeSegments.reduce((s, seg) => s + seg.value, 0);

  // Build stroke-dasharray/offset for each segment
  let accumulated = 0;
  const arcs = activeSegments.map((seg) => {
    const fraction = totalValue > 0 ? seg.value / totalValue : 0;
    const dashLength = fraction * circumference;
    const offset = -accumulated * circumference / totalValue;
    accumulated += seg.value;
    return { ...seg, dashLength, offset };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" role="img" aria-label="EICD覆盖分布图">
      <title>EICD覆盖分布图</title>
      {/* Background circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={thickness}
        opacity={0.3}
      />
      {/* Segments */}
      {arcs.map((arc) => (
        <circle
          key={arc.label}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={thickness}
          strokeDasharray={`${arc.dashLength} ${circumference - arc.dashLength}`}
          strokeDashoffset={arc.offset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      {/* Center text */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground"
        fontSize={22}
        fontWeight={700}
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground"
        fontSize={11}
      >
        台设备
      </text>
    </svg>
  );
}
