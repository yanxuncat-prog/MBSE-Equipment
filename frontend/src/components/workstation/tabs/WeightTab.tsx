import { useMemo, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { StatsCard } from '@/components/workstation/shared/StatsCard';
import { StatsRow } from '@/components/workstation/shared/StatsRow';
import { ProfessionalTable } from '@/components/workstation/shared/ProfessionalTable';
import type { Column } from '@/components/workstation/shared/ProfessionalTable';
import { ProfessionalPanel } from '@/components/workstation/shared/ProfessionalPanel';
import { CGEnvelopeChart } from '@/components/charts/CGEnvelopeChart';
import { HorizontalBar } from '@/components/workstation/charts/HorizontalBar';
import type { Equipment, ValidationReport } from '@/types';

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

const STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string; text: string }> = {
  approved: { variant: 'default', className: 'bg-green-500/15 text-green-700 border-green-200', text: '已批准' },
  in_development: { variant: 'default', className: 'bg-blue-500/15 text-blue-700 border-blue-200', text: '在研' },
  qualifying: { variant: 'default', className: 'bg-orange-500/15 text-orange-700 border-orange-200', text: '鉴定中' },
  discontinued: { variant: 'default', className: 'bg-red-500/15 text-red-700 border-red-200', text: '停产' },
};

const ATA_COLORS = [
  '#1E40AF', '#3B82F6', '#2563EB', '#1D4ED8', '#60A5FA',
  '#93C5FD', '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD',
  '#059669', '#10B981', '#34D399', '#6EE7B7', '#F59E0B',
  '#FBBF24', '#FCD34D', '#F97316', '#FB923C', '#FDBA74',
  '#DC2626', '#EF4444', '#F87171', '#0EA5E9', '#38BDF8',
];

/* ------------------------------------------------------------------ */
/* Squarified Treemap Layout                                          */
/* ------------------------------------------------------------------ */
interface TreemapRect {
  label: string;
  value: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  isLargest: boolean;
  hasMissing: boolean;
}

/* Simple row-based squarified layout for better aspect ratios */
function layoutTreemap(
  items: { label: string; value: number; color: string; hasMissing: boolean }[],
  x: number, y: number, w: number, h: number,
): TreemapRect[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, i) => s + i.value, 0);
  if (total === 0) return [];
  const largestLabel = sorted[0].label;

  const rects: TreemapRect[] = [];
  let remaining = [...sorted];
  let cx = x, cy = y, cw = w, ch = h;
  let remainingTotal = total;

  while (remaining.length > 0) {
    const isHorizontal = cw >= ch;
    const sideLength = isHorizontal ? ch : cw;

    // Greedily fill a row
    const row: typeof remaining = [];
    let rowTotal = 0;

    for (const item of remaining) {
      const testTotal = rowTotal + item.value;
      const testFraction = testTotal / remainingTotal;
      const rowLength = isHorizontal ? cw * testFraction : ch * testFraction;

      if (row.length > 0) {
        // Check aspect ratio of last item
        const lastLen = (item.value / testTotal) * sideLength;
        const ar = Math.max(rowLength / lastLen, lastLen / rowLength);
        if (ar > 4 && row.length >= 2) break;
      }

      row.push(item);
      rowTotal = testTotal;
    }

    // Layout the row
    const rowFraction = rowTotal / remainingTotal;
    const rowWidth = isHorizontal ? cw * rowFraction : cw;
    const rowHeight = isHorizontal ? ch : ch * rowFraction;

    let rx = cx, ry = cy;
    for (const item of row) {
      const itemFraction = item.value / rowTotal;
      const itemW = isHorizontal ? rowWidth : rowWidth * itemFraction;
      const itemH = isHorizontal ? rowHeight * itemFraction : rowHeight;

      rects.push({
        label: item.label,
        value: item.value,
        x: rx,
        y: ry,
        w: Math.max(itemW, 1),
        h: Math.max(itemH, 1),
        color: item.color,
        isLargest: item.label === largestLabel,
        hasMissing: item.hasMissing,
      });

      if (isHorizontal) {
        ry += itemH;
      } else {
        rx += itemW;
      }
    }

    // Shrink remaining area
    if (isHorizontal) {
      cx += rowWidth;
      cw -= rowWidth;
    } else {
      cy += rowHeight;
      ch -= rowHeight;
    }

    remaining = remaining.slice(row.length);
    remainingTotal -= rowTotal;
  }

  return rects;
}

/* ------------------------------------------------------------------ */
/* WeightTab Component                                                */
/* ------------------------------------------------------------------ */
export function WeightTab({ equipment, report, onSelect }: Props) {
  const [hoveredAta, setHoveredAta] = useState<string | null>(null);

  const weightEngine = report?.engines.find(e => e.engine_name === 'weight_balance');
  const cgPctMac = weightEngine?.details?.cg_pct_mac ?? 0;
  const totalMassKg = weightEngine?.details?.total_mass_kg ?? 0;
  const mtowMarginKg = weightEngine?.details?.mtow_margin_kg ?? 0;

  const totalMass = useMemo(
    () => equipment.reduce((sum, e) => sum + (e.weight_balance?.mass_kg ?? 0), 0),
    [equipment],
  );
  const missingCount = useMemo(
    () => equipment.filter(e => e.weight_balance == null).length,
    [equipment],
  );

  const cgColor = weightEngine?.status === 'pass' ? '#34C759' : weightEngine?.status === 'warning' ? '#FF9500' : '#FF3B30';

  /* ---- Treemap data: group by ATA chapter ---- */
  const ataGroups = useMemo(() => {
    const groups: Record<string, { total: number; count: number; missingCount: number }> = {};
    for (const e of equipment) {
      const ata = e.ata_chapter || '未知';
      if (!groups[ata]) groups[ata] = { total: 0, count: 0, missingCount: 0 };
      groups[ata].count++;
      if (e.weight_balance?.mass_kg) {
        groups[ata].total += e.weight_balance.mass_kg;
      } else {
        groups[ata].missingCount++;
      }
    }
    return Object.entries(groups)
      .map(([label, g], i) => ({
        label,
        value: Math.max(g.total, g.missingCount > 0 && g.total === 0 ? 1 : 0), // ensure visible
        color: ATA_COLORS[i % ATA_COLORS.length],
        hasMissing: g.missingCount > 0 && g.total === 0,
        totalWeight: g.total,
        count: g.count,
        missingCount: g.missingCount,
      }))
      .filter(g => g.value > 0 || g.hasMissing)
      .sort((a, b) => b.value - a.value);
  }, [equipment]);

  const treemapRects = useMemo(
    () => layoutTreemap(ataGroups, 4, 4, 692, 296),
    [ataGroups],
  );

  /* ---- Bar chart data ---- */
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

  /* ---- Sorted equipment for table ---- */
  const sortedEquipment = useMemo(
    () => [...equipment].sort((a, b) => (b.weight_balance?.mass_kg ?? 0) - (a.weight_balance?.mass_kg ?? 0)),
    [equipment],
  );

  const columns: Column<Equipment>[] = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata_chapter', width: 55 },
    {
      title: '重量(kg)', key: 'mass_kg', width: 80, align: 'right',
      render: (_, r) => r.weight_balance?.mass_kg?.toFixed(1) || <span className="text-muted-foreground/40">-</span>,
    },
    {
      title: 'STA(力臂)', key: 'sta', width: 70, align: 'right',
      render: (_, r) => r.config_data?.sta?.toFixed(0) || '-',
    },
    {
      title: '力矩(kg·mm)', key: 'moment', width: 110, align: 'right',
      render: (_, r) => {
        const mass = r.weight_balance?.mass_kg;
        const sta = r.config_data?.sta;
        if (mass != null && sta != null) return (mass * sta).toLocaleString('zh-CN', { maximumFractionDigits: 0 });
        return '-';
      },
    },
    { title: '区域', key: 'zone', width: 100, render: (_, r) => r.config_data?.zone_name || '-' },
    { title: '供应商', key: 'supplier', width: 100, render: (_, r) => r.supplier_name || '-' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 70,
      render: (s: string) => {
        const cfg = STATUS_BADGES[s] || { variant: 'outline' as const, className: '', text: s };
        return <Badge variant={cfg.variant} className={cfg.className}>{cfg.text}</Badge>;
      },
    },
  ];

  const handleMouseEnter = useCallback((label: string) => setHoveredAta(label), []);
  const handleMouseLeave = useCallback(() => setHoveredAta(null), []);

  /* Banner severity */
  const bannerColor = missingCount > 20 ? '#FF3B30' : missingCount > 5 ? '#FF9500' : '#34C759';
  const bannerBg = missingCount > 20 ? 'bg-red-50' : missingCount > 5 ? 'bg-orange-50' : 'bg-green-50';
  const bannerBorder = missingCount > 20 ? 'border-red-200' : missingCount > 5 ? 'border-orange-200' : 'border-green-200';

  return (
    <div className="flex h-[calc(100vh-180px)]">
      <style>{`
        .wt-treemap-rect { transition: opacity 0.2s, stroke-width 0.2s; cursor: pointer; }
        .wt-treemap-rect:hover { stroke: #1E40AF !important; stroke-width: 3 !important; }
        @keyframes wt-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

      <div className="flex-1 overflow-auto pr-4">
        {/* Hook Banner */}
        <div className={`flex items-center gap-2 rounded-md border px-4 py-2.5 mb-3 ${bannerBg} ${bannerBorder}`}>
          <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: bannerColor }} />
          <p className="text-[13px] text-foreground">
            <strong>CE-25A</strong> 当前总重{' '}
            <span className="font-bold text-blue-800">{totalMass.toFixed(1)} kg</span>
            ，CG <span className="font-bold" style={{ color: cgColor }}>{cgPctMac.toFixed(1)}% MAC</span>
            。{missingCount > 0 && (
              <span className="text-orange-500">
                {missingCount} 台设备缺重量数据。
              </span>
            )}
          </p>
        </div>

        {/* Stats Row */}
        <StatsRow className="mb-3">
          <StatsCard label="总重量" value={`${totalMass.toFixed(1)} kg`} color="#1E40AF" />
          <StatsCard label="CG 位置" value={`${cgPctMac.toFixed(1)}% MAC`} color={cgColor} />
          <StatsCard label="MTOW 余量" value={`${mtowMarginKg.toFixed(1)} kg`} color="#3B82F6" />
          <StatsCard label="缺重量数据" value={missingCount} color="#FF9500" />
        </StatsRow>

        {/* Treemap Visualization */}
        <Card size="sm" className="mb-4">
          <CardHeader className="border-b">
            <CardTitle>重量分布图 (按ATA章节)</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <svg width={700} height={304} viewBox="0 0 700 304" className="block w-full">
              <defs>
                <pattern id="wt-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#999" strokeWidth="1" strokeOpacity="0.4" />
                </pattern>
              </defs>
              {treemapRects.map((rect) => {
                const dimmed = hoveredAta !== null && hoveredAta !== rect.label;
                const showLabel = rect.w > 40 && rect.h > 28;
                const showValue = rect.w > 50 && rect.h > 42;
                return (
                  <g
                    key={rect.label}
                    className="wt-treemap-rect"
                    onMouseEnter={() => handleMouseEnter(rect.label)}
                    onMouseLeave={handleMouseLeave}
                    style={{ opacity: dimmed ? 0.25 : 1 }}
                  >
                    {/* Background rect */}
                    <rect
                      x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                      rx={3}
                      fill={rect.hasMissing ? 'url(#wt-hatch)' : rect.color}
                      fillOpacity={rect.hasMissing ? 1 : 0.82}
                      stroke={rect.isLargest ? '#F59E0B' : '#fff'}
                      strokeWidth={rect.isLargest ? 3 : 1.5}
                    />
                    {/* Label */}
                    {showLabel && (
                      <text
                        x={rect.x + rect.w / 2}
                        y={rect.y + rect.h / 2 - (showValue ? 6 : 0)}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={rect.w > 80 ? 12 : 10}
                        fontWeight={600}
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)', pointerEvents: 'none' }}
                      >
                        ATA-{rect.label}
                      </text>
                    )}
                    {showValue && (
                      <text
                        x={rect.x + rect.w / 2}
                        y={rect.y + rect.h / 2 + 10}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={rect.w > 80 ? 11 : 9}
                        fillOpacity={0.9}
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)', pointerEvents: 'none' }}
                      >
                        {rect.value.toFixed(0)} kg
                      </text>
                    )}
                    {/* Largest annotation callout */}
                    {rect.isLargest && rect.w > 60 && (
                      <>
                        <line
                          x1={rect.x + rect.w - 4} y1={rect.y + 4}
                          x2={rect.x + rect.w + 16} y2={rect.y - 12}
                          stroke="#F59E0B" strokeWidth={1.5}
                        />
                        <rect
                          x={rect.x + rect.w + 14} y={rect.y - 26}
                          width={56} height={18} rx={3}
                          fill="#F59E0B"
                        />
                        <text
                          x={rect.x + rect.w + 42} y={rect.y - 14}
                          textAnchor="middle" fill="#fff" fontSize={9} fontWeight={600}
                        >
                          最重
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
            {/* Legend */}
            <TooltipProvider>
              <div className="flex flex-wrap gap-2 border-t px-1 pt-2 mt-1">
                {ataGroups.slice(0, 12).map((g) => (
                  <Tooltip key={g.label}>
                    <TooltipTrigger
                      render={
                        <div
                          className={`flex items-center gap-1 cursor-pointer rounded px-1.5 py-0.5 ${hoveredAta === g.label ? 'bg-blue-50' : ''}`}
                          onMouseEnter={() => handleMouseEnter(g.label)}
                          onMouseLeave={handleMouseLeave}
                        />
                      }
                    >
                      <div className="h-2.5 w-2.5 rounded-sm" style={{ background: g.hasMissing ? '#ccc' : g.color }} />
                      <span className="text-[10px] text-muted-foreground">ATA-{g.label}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {`ATA-${g.label}: ${g.totalWeight.toFixed(0)} kg (${g.count} 台${g.missingCount > 0 ? `, ${g.missingCount} 台缺数据` : ''})`}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Professional Table */}
        <ProfessionalTable
          columns={columns}
          dataSource={sortedEquipment}
          onRow={(record) => ({ onClick: () => onSelect(record) })}
        />
      </div>

      {/* Right Panel */}
      <ProfessionalPanel>
        <Card size="sm">
          <CardHeader className="border-b">
            <CardTitle>CG 包线图</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="border-b">
            <CardTitle>按ATA重量分布 (Top 8)</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBar items={ataBarItems} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="border-b">
            <CardTitle>按区域重量分布</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBar items={zoneBarItems} />
          </CardContent>
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
