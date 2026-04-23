import { useMemo, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StatsCard } from '@/components/workstation/shared/StatsCard';
import { StatsRow } from '@/components/workstation/shared/StatsRow';
import { ProfessionalTable } from '@/components/workstation/shared/ProfessionalTable';
import type { Column } from '@/components/workstation/shared/ProfessionalTable';
import { ProfessionalPanel } from '@/components/workstation/shared/ProfessionalPanel';
import { CoverageRing } from '@/components/workstation/charts/CoverageRing';
import { ConnectorHistogram } from '@/components/workstation/charts/ConnectorHistogram';
import type { Equipment, ValidationReport } from '@/types';

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

/* ------------------------------------------------------------------ */
/* ATA Color Palette                                                   */
/* ------------------------------------------------------------------ */
const ATA_COLORS = [
  '#1E40AF', '#059669', '#D97706', '#DC2626', '#7C3AED',
  '#0891B2', '#BE185D', '#4338CA', '#65A30D', '#EA580C',
  '#2563EB', '#0D9488', '#CA8A04', '#9333EA', '#E11D48',
  '#0284C7', '#16A34A', '#DB2777', '#6366F1', '#F97316',
  '#3B82F6', '#14B8A6', '#EAB308', '#A855F7', '#F43F5E',
];

/* ------------------------------------------------------------------ */
/* Chord Diagram Types                                                 */
/* ------------------------------------------------------------------ */
interface ATAArc {
  ata: string;
  count: number;
  connectors: number;
  startAngle: number;
  endAngle: number;
  color: string;
  index: number;
}

interface Chord {
  sourceAta: string;
  targetAta: string;
  value: number;
  sourceStart: number;
  sourceEnd: number;
  targetStart: number;
  targetEnd: number;
  color: string;
}

/* ------------------------------------------------------------------ */
/* SVG path helpers                                                    */
/* ------------------------------------------------------------------ */
function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${start.x},${start.y} A ${r},${r} 0 ${largeArc} 1 ${end.x},${end.y}`;
}

function chordPath(
  cx: number, cy: number, r: number,
  srcStart: number, srcEnd: number,
  tgtStart: number, tgtEnd: number,
): string {
  const s1 = polarToCartesian(cx, cy, r, srcStart);
  const s2 = polarToCartesian(cx, cy, r, srcEnd);
  const t1 = polarToCartesian(cx, cy, r, tgtStart);
  const t2 = polarToCartesian(cx, cy, r, tgtEnd);
  return [
    `M ${s1.x},${s1.y}`,
    `A ${r},${r} 0 0 1 ${s2.x},${s2.y}`,
    `Q ${cx},${cy} ${t1.x},${t1.y}`,
    `A ${r},${r} 0 0 1 ${t2.x},${t2.y}`,
    `Q ${cx},${cy} ${s1.x},${s1.y}`,
    'Z',
  ].join(' ');
}

/* ------------------------------------------------------------------ */
/* EWISTab Component                                                   */
/* ------------------------------------------------------------------ */
export function EWISTab({ equipment, report: _report, onSelect }: Props) {
  const [hoveredAta, setHoveredAta] = useState<string | null>(null);

  /* ---- Basic stats ---- */
  const hasEicdCount = useMemo(() => equipment.filter(e => e.has_eicd === true).length, [equipment]);
  const totalConnectors = useMemo(() => equipment.reduce((sum, e) => sum + (e.connector_count || 0), 0), [equipment]);
  const specialWiringCount = useMemo(() => equipment.filter(e => e.has_special_wiring === true).length, [equipment]);
  const highComplexity = useMemo(() => equipment.filter(e => (e.connector_count ?? 0) >= 5).length, [equipment]);
  const eicdPct = useMemo(
    () => equipment.length > 0 ? ((hasEicdCount / equipment.length) * 100).toFixed(0) : '0',
    [hasEicdCount, equipment.length],
  );

  /* ---- ATA grouping for chord diagram ---- */
  const ataMap = useMemo(() => {
    const map: Record<string, { count: number; connectors: number; zones: Set<string> }> = {};
    for (const e of equipment) {
      const ata = e.ata_chapter || '未知';
      if (!map[ata]) map[ata] = { count: 0, connectors: 0, zones: new Set() };
      map[ata].count++;
      map[ata].connectors += e.connector_count || 0;
      const zone = e.config_data?.zone_name || '未知';
      map[ata].zones.add(zone);
    }
    return map;
  }, [equipment]);

  /* ---- Chord diagram data ---- */
  const chordData = useMemo(() => {
    const CX = 180, CY = 180, R = 140, INNER_R = 130;
    const GAP = 0.02; // gap between arcs in radians

    const ataEntries = Object.entries(ataMap)
      .sort((a, b) => b[1].connectors - a[1].connectors)
      .slice(0, 15); // Limit to top 15 ATA chapters for readability

    const totalConnectors = ataEntries.reduce((s, [, v]) => s + Math.max(v.connectors, 1), 0);

    // Build arcs
    const arcs: ATAArc[] = [];
    const totalAngle = 2 * Math.PI - ataEntries.length * GAP;
    let currentAngle = -Math.PI / 2; // Start from top

    ataEntries.forEach(([ata, data], i) => {
      const proportion = Math.max(data.connectors, 1) / totalConnectors;
      const arcAngle = proportion * totalAngle;
      arcs.push({
        ata,
        count: data.count,
        connectors: data.connectors,
        startAngle: currentAngle,
        endAngle: currentAngle + arcAngle,
        color: ATA_COLORS[i % ATA_COLORS.length],
        index: i,
      });
      currentAngle += arcAngle + GAP;
    });

    // Build chords: co-location (shared zones between ATA pairs)
    const chords: Chord[] = [];
    const ataZoneMap: Record<string, Set<string>> = {};
    for (const [ata, data] of ataEntries) {
      ataZoneMap[ata] = data.zones;
    }

    for (let i = 0; i < arcs.length; i++) {
      for (let j = i + 1; j < arcs.length; j++) {
        const zonesA = ataZoneMap[arcs[i].ata];
        const zonesB = ataZoneMap[arcs[j].ata];
        if (!zonesA || !zonesB) continue;

        // Count shared zones
        let sharedCount = 0;
        for (const z of zonesA) {
          if (zonesB.has(z) && z !== '未知') sharedCount++;
        }

        if (sharedCount > 0) {
          const srcMid = (arcs[i].startAngle + arcs[i].endAngle) / 2;
          const tgtMid = (arcs[j].startAngle + arcs[j].endAngle) / 2;
          const chordWidth = Math.min(sharedCount * 0.015, 0.08);

          chords.push({
            sourceAta: arcs[i].ata,
            targetAta: arcs[j].ata,
            value: sharedCount,
            sourceStart: srcMid - chordWidth,
            sourceEnd: srcMid + chordWidth,
            targetStart: tgtMid - chordWidth,
            targetEnd: tgtMid + chordWidth,
            color: arcs[i].color,
          });
        }
      }
    }

    return { arcs, chords, cx: CX, cy: CY, r: R, innerR: INNER_R };
  }, [ataMap]);

  /* ---- ATA EICD coverage data ---- */
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

  /* ---- Table columns ---- */
  const columns: Column<Equipment>[] = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
    {
      title: '连接器数', key: 'connector_count', width: 80, align: 'right',
      render: (_, r) => {
        const c = r.connector_count;
        if (c == null) return <span className="text-muted-foreground/50">-</span>;
        return (
          <span className={cn('tabular-nums', c >= 5 ? 'font-bold text-amber-600' : 'text-foreground')}>
            {c}
          </span>
        );
      },
    },
    {
      title: '有EICD', key: 'has_eicd', width: 70,
      render: (_, r) => {
        if (r.has_eicd === true) return <Badge className="bg-green-500 text-white">有</Badge>;
        if (r.has_eicd === false) return <Badge variant="secondary">无</Badge>;
        return <span className="text-muted-foreground/50">-</span>;
      },
    },
    {
      title: '特殊布线', key: 'special_wiring', width: 75,
      render: (_, r) => {
        if (r.has_special_wiring === true) return <Badge className="bg-orange-500 text-white">是</Badge>;
        if (r.has_special_wiring === false) return <span className="text-muted-foreground/50">否</span>;
        return <span className="text-muted-foreground/50">-</span>;
      },
    },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata', width: 55 },
    { title: '区域', key: 'zone', width: 100, render: (_, r) => r.config_data?.zone_name || '-' },
    { title: '电压范围', key: 'voltage_range', width: 100, render: (_, r) => r.voltage_range || '-' },
    { title: '供应商', key: 'supplier', width: 100, render: (_, r) => r.supplier_name || '-' },
  ];

  /* ---- Banner ---- */
  const eicdPctNum = parseFloat(eicdPct);
  const bannerClasses = eicdPctNum < 30
    ? 'bg-red-50 border-red-200'
    : eicdPctNum < 60
      ? 'bg-orange-50 border-orange-200'
      : 'bg-green-50 border-green-200';
  const bannerDotColor = eicdPctNum < 30 ? 'bg-red-500' : eicdPctNum < 60 ? 'bg-orange-500' : 'bg-green-500';
  const bannerPctColor = eicdPctNum < 30 ? 'text-red-500' : eicdPctNum < 60 ? 'text-orange-500' : 'text-green-500';

  const handleAtaHover = useCallback((ata: string | null) => setHoveredAta(ata), []);

  return (
    <div className="flex h-[calc(100vh-180px)]">
      <style>{`
        .ewis-row-high-complexity td { background: #fff7e6 !important; }
        .ewis-chord-arc { transition: opacity 0.2s; cursor: pointer; }
        .ewis-chord-path { transition: opacity 0.2s; }
        .ewis-arc-label { pointer-events: none; user-select: none; }
      `}</style>

      <div className="flex-1 overflow-auto pr-4">
        {/* Hook Banner */}
        <div className={cn('flex items-center gap-2 rounded-md border px-4 py-2.5 mb-3', bannerClasses)}>
          <div className={cn('size-2 shrink-0 rounded-full', bannerDotColor)} />
          <span className="text-[13px] text-foreground">
            全机{' '}
            <span className="font-bold text-blue-800">{totalConnectors} 个</span>连接器，EICD 覆盖率仅{' '}
            <span className={cn('font-bold', bannerPctColor)}>{eicdPct}%</span>。
            <span className="font-bold text-amber-600">{highComplexity} 台</span>设备连接器{'\u2265'}5（高复杂度）。
          </span>
        </div>

        {/* Stats Row */}
        <StatsRow>
          <StatsCard label="有EICD" value={hasEicdCount} color="#34C759" />
          <StatsCard label="总连接器" value={totalConnectors} color="#1E40AF" />
          <StatsCard label="特殊布线" value={specialWiringCount} color="#FF9500" />
        </StatsRow>

        {/* Chord Diagram */}
        <Card size="sm" className="mb-4">
          <CardHeader>
            <CardTitle>ATA 系统互连关系图（基于区域共址）</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="flex items-start gap-4">
              <svg
                width={360}
                height={360}
                viewBox="0 0 360 360"
                className="block shrink-0"
              >
                <defs>
                  {chordData.arcs.map(arc => (
                    <radialGradient key={`grad-${arc.ata}`} id={`chord-grad-${arc.index}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={arc.color} stopOpacity={0.6} />
                      <stop offset="100%" stopColor={arc.color} stopOpacity={0.15} />
                    </radialGradient>
                  ))}
                </defs>

                {/* Chords (background) */}
                {chordData.chords.map((chord, i) => {
                  const isHighlighted = hoveredAta === null ||
                    hoveredAta === chord.sourceAta ||
                    hoveredAta === chord.targetAta;
                  return (
                    <path
                      key={i}
                      className="ewis-chord-path"
                      d={chordPath(
                        chordData.cx, chordData.cy, chordData.innerR,
                        chord.sourceStart, chord.sourceEnd,
                        chord.targetStart, chord.targetEnd,
                      )}
                      fill={chord.color}
                      fillOpacity={isHighlighted ? 0.25 : 0.03}
                      stroke={chord.color}
                      strokeWidth={0.5}
                      strokeOpacity={isHighlighted ? 0.4 : 0.05}
                    />
                  );
                })}

                {/* ATA Arcs */}
                {chordData.arcs.map(arc => {
                  const isHighlighted = hoveredAta === null || hoveredAta === arc.ata;
                  const midAngle = (arc.startAngle + arc.endAngle) / 2;
                  const labelR = chordData.r + 16;
                  const labelPos = polarToCartesian(chordData.cx, chordData.cy, labelR, midAngle);
                  const textAnchor = midAngle > Math.PI / 2 && midAngle < 3 * Math.PI / 2 ? 'end' : 'start';
                  const arcAngle = arc.endAngle - arc.startAngle;

                  return (
                    <g
                      key={arc.ata}
                      className="ewis-chord-arc"
                      onMouseEnter={() => handleAtaHover(arc.ata)}
                      onMouseLeave={() => handleAtaHover(null)}
                      style={{ opacity: isHighlighted ? 1 : 0.15 }}
                    >
                      {/* Outer arc (thick) */}
                      <path
                        d={arcPath(chordData.cx, chordData.cy, chordData.r, arc.startAngle, arc.endAngle)}
                        fill="none"
                        stroke={arc.color}
                        strokeWidth={10}
                        strokeLinecap="butt"
                      />
                      {/* Inner highlight line */}
                      <path
                        d={arcPath(chordData.cx, chordData.cy, chordData.innerR, arc.startAngle, arc.endAngle)}
                        fill="none"
                        stroke={arc.color}
                        strokeWidth={2}
                        strokeOpacity={0.4}
                      />
                      {/* Label (only if arc is wide enough) */}
                      {arcAngle > 0.15 && (
                        <text
                          className="ewis-arc-label"
                          x={labelPos.x}
                          y={labelPos.y}
                          textAnchor={textAnchor}
                          dominantBaseline="middle"
                          fill={arc.color}
                          fontSize={9}
                          fontWeight={600}
                        >
                          {arc.ata}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Center label */}
                <text
                  x={chordData.cx}
                  y={chordData.cy - 8}
                  textAnchor="middle"
                  fill="#333"
                  fontSize={14}
                  fontWeight={700}
                >
                  {chordData.arcs.length}
                </text>
                <text
                  x={chordData.cx}
                  y={chordData.cy + 8}
                  textAnchor="middle"
                  fill="#999"
                  fontSize={9}
                >
                  ATA 系统
                </text>
              </svg>

              {/* Chord legend */}
              <div className="flex-1 max-h-[340px] overflow-y-auto">
                <div className="text-[11px] font-semibold text-muted-foreground mb-2">ATA 系统连接器统计</div>
                {chordData.arcs.map(arc => (
                  <div
                    key={arc.ata}
                    className={cn(
                      'flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-pointer mb-0.5',
                      hoveredAta === arc.ata && 'bg-muted',
                    )}
                    onMouseEnter={() => handleAtaHover(arc.ata)}
                    onMouseLeave={() => handleAtaHover(null)}
                  >
                    <div
                      className="size-2.5 shrink-0 rounded-sm"
                      style={{ background: arc.color }}
                    />
                    <span className="text-[10px] text-foreground flex-1">ATA-{arc.ata}</span>
                    <span className="text-[10px] text-muted-foreground">{arc.count}台</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">{arc.connectors}个</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Table */}
        <ProfessionalTable
          columns={columns}
          dataSource={equipment}
          onRow={(record) => ({ onClick: () => onSelect(record) })}
        />
      </div>

      {/* Right Panel */}
      <ProfessionalPanel>
        <Card size="sm">
          <CardHeader>
            <CardTitle>EICD 覆盖率</CardTitle>
          </CardHeader>
          <CardContent>
            <CoverageRing covered={hasEicdCount} total={equipment.length} label="EICD 覆盖率" />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>连接器分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectorHistogram equipment={equipment} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>ATA EICD 覆盖</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[220px] overflow-y-auto">
              {/* Header */}
              <div className="flex text-[10px] text-muted-foreground font-semibold border-b pb-1 mb-1">
                <div className="w-[50px]">ATA</div>
                <div className="flex-1 text-right">总数</div>
                <div className="flex-1 text-right">有EICD</div>
                <div className="flex-1 text-right">覆盖率</div>
              </div>
              {/* Rows */}
              {ataEicdData.map(([ata, { total, hasEicd }]) => {
                const rate = total > 0 ? hasEicd / total : 0;
                const rateColor = rate < 0.3 ? 'text-red-500' : rate < 0.6 ? 'text-orange-500' : 'text-green-500';
                const rateBg = rate < 0.3 ? 'bg-red-500/10' : rate < 0.6 ? 'bg-orange-500/10' : 'bg-green-500/10';
                return (
                  <div
                    key={ata}
                    className="flex text-[11px] leading-[22px] border-b border-border/30"
                  >
                    <div className="w-[50px] font-medium">{ata}</div>
                    <div className="flex-1 text-right text-muted-foreground">{total}</div>
                    <div className="flex-1 text-right text-muted-foreground">{hasEicd}</div>
                    <div className={cn('flex-1 text-right font-semibold rounded px-1', rateColor, rateBg)}>
                      {total > 0 ? `${(rate * 100).toFixed(0)}%` : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
