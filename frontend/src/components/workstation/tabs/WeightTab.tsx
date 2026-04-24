import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Loader2, TrendingDown, ArrowDown, ArrowUp } from 'lucide-react';
import { listConfigs } from '@/api/configurations';
import { computeWeightReduction } from '@/api/weight-reduction';
import { useConfigStore } from '@/store/configStore';
import type { Equipment, ValidationReport, Configuration, WeightReductionResult } from '../../../types';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
  onEdit?: (equip: Equipment) => void;
}

interface TreemapNode {
  id: string;
  label: string;
  value: number;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  colorVar?: string;
  children?: TreemapNode[];
}

interface ATAGroup {
  ata: string;
  ataName: string;
  totalWeight: number;
  devices: { name: string; weight: number }[];
}

/* ------------------------------------------------------------------ */
/* ATA Name Extraction                                                */
/* ------------------------------------------------------------------ */
function extractATAName(description: string | null): string {
  if (!description) return '未知系统';
  const parts = description.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : description;
}

/* ------------------------------------------------------------------ */
/* Squarify Treemap Algorithm                                         */
/* ------------------------------------------------------------------ */
function squarify(
  items: { id: string; label: string; value: number; opacity: number }[],
  x: number,
  y: number,
  w: number,
  h: number,
): TreemapNode[] {
  if (items.length === 0 || w <= 0 || h <= 0) return [];

  const totalValue = items.reduce((s, i) => s + i.value, 0);
  if (totalValue <= 0) return [];

  const sorted = [...items].sort((a, b) => b.value - a.value);
  const normalizedItems = sorted.map((item) => ({
    ...item,
    normalizedValue: (item.value / totalValue) * w * h,
  }));

  const result: TreemapNode[] = [];
  let remaining = [...normalizedItems];
  let cx = x,
    cy = y,
    cw = w,
    ch = h;

  while (remaining.length > 0) {
    const isWide = cw >= ch;
    const side = isWide ? ch : cw;

    // Find the best row using worst aspect ratio heuristic
    let bestRow: typeof remaining = [];
    let bestWorst = Infinity;

    for (let i = 1; i <= remaining.length; i++) {
      const row = remaining.slice(0, i);
      const rowSum = row.reduce((s, r) => s + r.normalizedValue, 0);
      const rowWidth = rowSum / side;

      let worst = 0;
      for (const item of row) {
        const itemLen = item.normalizedValue / rowWidth;
        const ar = Math.max(rowWidth / itemLen, itemLen / rowWidth);
        worst = Math.max(worst, ar);
      }

      if (worst <= bestWorst) {
        bestWorst = worst;
        bestRow = row;
      } else {
        break; // aspect ratio getting worse, stop
      }
    }

    if (bestRow.length === 0) bestRow = [remaining[0]];

    // Layout the best row
    const rowSum = bestRow.reduce((s, r) => s + r.normalizedValue, 0);
    const rowThickness = rowSum / side;

    let rx = cx,
      ry = cy;
    for (const item of bestRow) {
      const itemLen = item.normalizedValue / rowThickness;
      const nodeW = isWide ? rowThickness : itemLen;
      const nodeH = isWide ? itemLen : rowThickness;

      result.push({
        id: item.id,
        label: item.label,
        value: item.value,
        x: rx,
        y: ry,
        w: Math.max(nodeW, 0),
        h: Math.max(nodeH, 0),
        opacity: item.opacity,
      });

      if (isWide) {
        ry += itemLen;
      } else {
        rx += itemLen;
      }
    }

    // Shrink remaining area
    if (isWide) {
      cx += rowThickness;
      cw -= rowThickness;
    } else {
      cy += rowThickness;
      ch -= rowThickness;
    }

    remaining = remaining.slice(bestRow.length);
  }

  return result;
}

/* ------------------------------------------------------------------ */
/* Tooltip Component                                                  */
/* ------------------------------------------------------------------ */
function TreemapTooltip({
  x,
  y,
  name,
  weight,
  containerWidth,
}: {
  x: number;
  y: number;
  name: string;
  weight: number;
  containerWidth: number;
}) {
  const tipWidth = 160;
  const adjustedX = x + tipWidth > containerWidth ? x - tipWidth - 8 : x + 12;
  const adjustedY = y - 40;

  return (
    <div
      className="pointer-events-none absolute z-50 rounded-md border bg-card px-3 py-2 shadow-md"
      style={{
        left: adjustedX,
        top: Math.max(4, adjustedY),
        minWidth: tipWidth,
      }}
    >
      <p className="text-sm font-medium text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground">{weight.toFixed(2)} kg</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* WeightTab Component                                                */
/* ------------------------------------------------------------------ */
export function WeightTab({ equipment, report: _report, onSelect: _onSelect, onEdit: _onEdit }: Props) {
  const { activeProgramId } = useConfigStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    weight: number;
  } | null>(null);

  /* ---- Weight reduction state ---- */
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [baseConfigId, setBaseConfigId] = useState<string | null>(null);
  const [compareConfigId, setCompareConfigId] = useState<string | null>(null);
  const [reductionData, setReductionData] = useState<WeightReductionResult | null>(null);
  const [reductionLoading, setReductionLoading] = useState(false);

  // Load configs when programId changes
  useEffect(() => {
    if (!activeProgramId) { setConfigs([]); return; }
    listConfigs(activeProgramId).then(cfgs => {
      setConfigs(cfgs);
      if (cfgs.length >= 2) {
        setBaseConfigId(prev => prev ?? cfgs[0].id);
        setCompareConfigId(prev => prev ?? cfgs[1].id);
      }
    }).catch(() => setConfigs([]));
  }, [activeProgramId]);

  // Fetch reduction data when both configs selected
  useEffect(() => {
    if (!baseConfigId || !compareConfigId || baseConfigId === compareConfigId) {
      setReductionData(null);
      return;
    }
    setReductionLoading(true);
    computeWeightReduction(baseConfigId, compareConfigId)
      .then(setReductionData)
      .catch(() => setReductionData(null))
      .finally(() => setReductionLoading(false));
  }, [baseConfigId, compareConfigId]);

  // ATA grouped reduction for bar chart
  const ataReduction = useMemo(() => {
    if (!reductionData) return [];
    const map = new Map<string, number>();
    for (const item of reductionData.items) {
      const ata = item.ata_chapter || '未知';
      map.set(ata, (map.get(ata) || 0) + (item.diff_kg ?? 0));
    }
    return Array.from(map.entries())
      .map(([ata, diff]) => ({ ata, diff }))
      .sort((a, b) => b.diff - a.diff);
  }, [reductionData]);

  // Top 10 reducers
  const top10Reducers = useMemo(() => {
    if (!reductionData) return [];
    return [...reductionData.items]
      .filter(i => i.diff_kg != null)
      .sort((a, b) => (b.diff_kg ?? 0) - (a.diff_kg ?? 0))
      .slice(0, 10);
  }, [reductionData]);

  // Responsive container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ---- KPI calculations ---- */
  const totalWeight = useMemo(
    () => equipment.reduce((sum, e) => sum + ((e.config_data?.mass_kg) ?? 0), 0),
    [equipment],
  );

  const withWeightCount = useMemo(
    () => equipment.filter((e) => (e.config_data?.mass_kg) != null).length,
    [equipment],
  );

  const coveragePct = equipment.length > 0 ? (withWeightCount / equipment.length) * 100 : 0;

  const heaviest = useMemo(() => {
    let best: Equipment | null = null;
    for (const e of equipment) {
      const w = e.config_data?.mass_kg;
      if (
        w != null &&
        (best == null || w > ((best.config_data?.mass_kg) ?? 0))
      ) {
        best = e;
      }
    }
    return best;
  }, [equipment]);

  /* ---- ATA grouping for treemap ---- */
  const ataGroups = useMemo<ATAGroup[]>(() => {
    const map = new Map<string, ATAGroup>();
    for (const e of equipment) {
      const ata = e.ata_chapter || '未知';
      if (!map.has(ata)) {
        map.set(ata, {
          ata,
          ataName: extractATAName(e.description),
          totalWeight: 0,
          devices: [],
        });
      }
      const group = map.get(ata)!;
      const w = (e.config_data?.mass_kg) ?? 0;
      group.totalWeight += w;
      if (w > 0) {
        group.devices.push({ name: e.name, weight: w });
      }
    }
    return Array.from(map.values())
      .filter((g) => g.totalWeight > 0)
      .sort((a, b) => b.totalWeight - a.totalWeight);
  }, [equipment]);

  /* ---- Treemap layout ---- */
  const treemapHeight = 340;
  const padding = 3;

  const maxGroupWeight = useMemo(
    () => Math.max(...ataGroups.map((g) => g.totalWeight), 1),
    [ataGroups],
  );

  // Outer treemap: ATA groups
  const outerRects = useMemo(
    () =>
      squarify(
        ataGroups.map((g) => ({
          id: g.ata,
          label: `ATA-${g.ata} ${g.ataName}`,
          value: g.totalWeight,
          opacity: 0.15 + 0.85 * (g.totalWeight / maxGroupWeight),
        })),
        0,
        0,
        containerWidth,
        treemapHeight,
      ),
    [ataGroups, containerWidth, maxGroupWeight],
  );

  // Inner treemap: devices within each ATA group
  // Global max device weight for consistent color mapping
  const globalMaxWeight = useMemo(
    () => Math.max(...ataGroups.flatMap(g => g.devices.map(d => d.weight)), 1),
    [ataGroups],
  );

  const innerRects = useMemo(() => {
    const allInner: TreemapNode[] = [];
    for (let gi = 0; gi < outerRects.length; gi++) {
      const outer = outerRects[gi];
      const group = ataGroups.find((g) => g.ata === outer.id);
      if (!group || group.devices.length === 0) continue;

      const inset = padding + 18;
      const innerX = outer.x + padding;
      const innerY = outer.y + inset;
      const innerW = outer.w - padding * 2;
      const innerH = outer.h - inset - padding;

      if (innerW <= 0 || innerH <= 0) continue;

      const deviceRects = squarify(
        group.devices.map((d, i) => ({
          id: `${outer.id}-${i}`,
          label: d.name,
          value: d.weight,
          // Log-scale opacity to handle extreme weight differences (0.02kg ~ 201kg)
          opacity: 0.3 + 0.7 * (Math.log(1 + d.weight) / Math.log(1 + globalMaxWeight)),
        })),
        innerX,
        innerY,
        innerW,
        innerH,
      );
      allInner.push(...deviceRects);
    }
    return allInner;
  }, [outerRects, ataGroups, globalMaxWeight]);

  /* ---- Tooltip handlers ---- */
  const handleCellMouseMove = useCallback(
    (e: React.MouseEvent, name: string, weight: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        name,
        weight,
      });
    },
    [],
  );

  const handleCellMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div className="space-y-4 p-1">
      {/* ---- KPI Cards ---- */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Weight */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              总重量
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {totalWeight.toFixed(2)}{' '}
              <span className="text-sm font-normal text-muted-foreground">kg</span>
            </p>
          </CardContent>
        </Card>

        {/* Data Coverage */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              数据覆盖率
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {coveragePct.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {withWeightCount} / {equipment.length} 台设备有重量数据
            </p>
          </CardContent>
        </Card>

        {/* Heaviest Device */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              最重设备
            </p>
            {heaviest ? (
              <>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {((heaviest.config_data?.mass_kg) ?? 0).toFixed(2)}{' '}
                  <span className="text-sm font-normal text-muted-foreground">kg</span>
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{heaviest.name}</p>
              </>
            ) : (
              <p className="mt-1 text-lg text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Insights */}
      <div className="rounded-lg border border-chart-1/20 bg-chart-1/5 px-4 py-2.5 space-y-1">
        {(() => {
          const sorted = [...ataGroups].sort((a, b) => b.totalWeight - a.totalWeight);
          const top3Weight = sorted.slice(0, 3).reduce((s, g) => s + g.totalWeight, 0);
          const top3Pct = totalWeight > 0 ? (top3Weight / totalWeight * 100).toFixed(0) : '0';
          const top3Names = sorted.slice(0, 3).map(g => `${g.ataName} ${g.totalWeight.toFixed(0)}kg`).join(' + ');
          const lightCount = equipment.filter(e => ((e.config_data?.mass_kg) ?? 0) > 0 && ((e.config_data?.mass_kg) ?? 0) < 1).length;
          const lightPct = withWeightCount > 0 ? (lightCount / withWeightCount * 100).toFixed(0) : '0';
          const lightWeightPct = totalWeight > 0 ? (equipment.filter(e => ((e.config_data?.mass_kg) ?? 0) > 0 && ((e.config_data?.mass_kg) ?? 0) < 1).reduce((s, e) => s + ((e.config_data?.mass_kg) ?? 0), 0) / totalWeight * 100).toFixed(1) : '0';
          return (
            <>
              <p className="text-xs"><span className="font-semibold text-chart-1">前 3 个 ATA 系统贡献 {top3Pct}% 重量</span> — {top3Names}</p>
              <p className="text-xs text-muted-foreground">{lightPct}% 的设备 &lt;1kg，仅贡献 {lightWeightPct}% 重量</p>
            </>
          );
        })()}
      </div>

      {/* ---- Treemap Visualization ---- */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              重量分布图
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                面积与颜色深浅均正比于设备重量
              </span>
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>轻</span>
              <div className="flex h-3">
                {[0.15, 0.3, 0.5, 0.7, 0.9].map(op => (
                  <div key={op} className="w-5 h-full" style={{ backgroundColor: 'var(--chart-1)', opacity: op }} />
                ))}
              </div>
              <span>重</span>
            </div>
          </div>
          <div ref={containerRef} className="relative w-full" style={{ height: treemapHeight }}>
            <svg
              width={containerWidth}
              height={treemapHeight}
              viewBox={`0 0 ${containerWidth} ${treemapHeight}`}
              className="block"
              role="img"
              aria-label="重量分布矩形树图"
            >
              <title>重量分布矩形树图</title>
              {/* ATA group outlines */}
              {outerRects.map((rect) => (
                <g key={`group-${rect.id}`}>
                  <rect
                    x={rect.x + 0.5}
                    y={rect.y + 0.5}
                    width={Math.max(rect.w - 1, 0)}
                    height={Math.max(rect.h - 1, 0)}
                    rx={4}
                    className="fill-muted/40 stroke-border"
                    strokeWidth={1}
                  />
                  {rect.w > 50 && rect.h > 24 && (
                    <text
                      x={rect.x + padding + 2}
                      y={rect.y + 13}
                      className="fill-muted-foreground"
                      fontSize={10}
                      fontWeight={500}
                    >
                      {rect.label}
                    </text>
                  )}
                </g>
              ))}

              {/* Device cells with clipped text */}
              {innerRects.map((rect) => {
                const rw = Math.max(rect.w - 1, 0);
                const rh = Math.max(rect.h - 1, 0);
                const showLabel = rw > 36 && rh > 18;
                return (
                  <g key={rect.id}>
                    {/* Clip path to prevent text overflow */}
                    {showLabel && (
                      <defs>
                        <clipPath id={`clip-${rect.id}`}>
                          <rect x={rect.x + 2} y={rect.y + 1} width={rw - 4} height={rh - 2} />
                        </clipPath>
                      </defs>
                    )}
                    <rect
                      x={rect.x + 0.5}
                      y={rect.y + 0.5}
                      width={rw}
                      height={rh}
                      rx={2}
                      style={{
                        fill: 'var(--chart-1)',
                        fillOpacity: rect.opacity,
                        cursor: 'pointer',
                        transition: 'fill-opacity 0.15s ease',
                      }}
                      stroke="var(--background)"
                      strokeWidth={1}
                      onMouseMove={(e) => handleCellMouseMove(e, rect.label, rect.value)}
                      onMouseLeave={handleCellMouseLeave}
                    />
                    {showLabel && (
                      <g clipPath={`url(#clip-${rect.id})`} className="pointer-events-none">
                        <text
                          x={rect.x + rect.w / 2}
                          y={rect.y + rect.h / 2 - (rh > 32 ? 5 : 0)}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={rw > 80 ? 10 : 8}
                          fontWeight={500}
                          fill="var(--primary-foreground)"
                        >
                          {rect.label}
                        </text>
                        {rh > 32 && (
                          <text
                            x={rect.x + rect.w / 2}
                            y={rect.y + rect.h / 2 + 9}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={8}
                            fill="var(--primary-foreground)"
                            opacity={0.8}
                          >
                            {rect.value.toFixed(1)}kg
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover tooltip */}
            {tooltip && (
              <TreemapTooltip
                x={tooltip.x}
                y={tooltip.y}
                name={tooltip.name}
                weight={tooltip.weight}
                containerWidth={containerWidth}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* ---- Weight Reduction Analysis Section ---- */}
      <div className="border-t pt-6 mt-2">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingDown className="size-4" />
            减重分析
          </h3>
          {baseConfigId && compareConfigId && (
            <p className="text-xs text-muted-foreground mt-0.5">
              对比构型: {configs.find(c => c.id === baseConfigId)?.version || '-'} vs {configs.find(c => c.id === compareConfigId)?.version || '-'}
            </p>
          )}
        </div>

        {/* Config selectors */}
        <div className="flex gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">基准构型</span>
            <Select value={baseConfigId ?? undefined} onValueChange={v => setBaseConfigId(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择基准构型" />
              </SelectTrigger>
              <SelectContent>
                {configs.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.version}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">对比构型</span>
            <Select value={compareConfigId ?? undefined} onValueChange={v => setCompareConfigId(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择对比构型" />
              </SelectTrigger>
              <SelectContent>
                {configs.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.version}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {reductionLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!reductionLoading && reductionData && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">基准总重</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                    {reductionData.total_base_mass_kg.toFixed(2)}{' '}
                    <span className="text-sm font-normal text-muted-foreground">kg</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">对比总重</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                    {reductionData.total_compare_mass_kg.toFixed(2)}{' '}
                    <span className="text-sm font-normal text-muted-foreground">kg</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">总减重</p>
                  <p className={`mt-1 text-2xl font-bold tabular-nums ${reductionData.total_reduction_kg > 0 ? 'text-status-ok' : reductionData.total_reduction_kg < 0 ? 'text-status-danger' : 'text-foreground'}`}>
                    {reductionData.total_reduction_kg > 0 ? '+' : ''}{reductionData.total_reduction_kg.toFixed(2)}{' '}
                    <span className="text-sm font-normal text-muted-foreground">kg</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    共对比 {reductionData.matched_count} 台设备
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ATA bar chart + Top 10 table */}
            <div className="grid grid-cols-2 gap-4">
              {/* ATA Reduction Bar Chart */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground mb-3">按 ATA 章节减重分布</p>
                  {ataReduction.length > 0 ? (() => {
                    const maxAbs = Math.max(...ataReduction.map(d => Math.abs(d.diff)), 0.1);
                    return (
                      <div className="space-y-1.5">
                        {ataReduction.map(item => {
                          const pct = (Math.abs(item.diff) / maxAbs) * 100;
                          const isPositive = item.diff > 0;
                          return (
                            <div key={item.ata} className="flex items-center">
                              <span className="w-16 shrink-0 text-right text-xs text-muted-foreground mr-2">
                                ATA-{item.ata}
                              </span>
                              <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: isPositive ? 'var(--status-ok)' : 'var(--status-danger)',
                                    minWidth: Math.abs(item.diff) > 0 ? 4 : 0,
                                  }}
                                />
                              </div>
                              <span className={`w-20 shrink-0 ml-2 text-right text-xs tabular-nums font-medium ${isPositive ? 'text-status-ok' : 'text-status-danger'}`}>
                                {isPositive ? '+' : ''}{item.diff.toFixed(1)} kg
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })() : (
                    <span className="text-xs text-muted-foreground">暂无数据</span>
                  )}
                </CardContent>
              </Card>

              {/* Top 10 Reducers Table */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground mb-3">减重 Top 10</p>
                  {top10Reducers.length > 0 ? (
                    <div className="overflow-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="text-left py-1.5 pr-2 font-medium">名称</th>
                            <th className="text-left py-1.5 pr-2 font-medium w-12">ATA</th>
                            <th className="text-right py-1.5 pr-2 font-medium w-16">基准</th>
                            <th className="text-right py-1.5 pr-2 font-medium w-16">对比</th>
                            <th className="text-right py-1.5 pr-2 font-medium w-16">减重</th>
                            <th className="text-right py-1.5 font-medium w-14">减重%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {top10Reducers.map((item, i) => {
                            const diffKg = item.diff_kg ?? 0;
                            const baseMass = item.base_mass_kg ?? 0;
                            const pct = baseMass > 0 ? ((diffKg / baseMass) * 100) : 0;
                            const isPositive = diffKg > 0;
                            return (
                              <tr key={i} className="border-b border-border/50 last:border-b-0">
                                <td className="py-1.5 pr-2 truncate max-w-[140px]">{item.name}</td>
                                <td className="py-1.5 pr-2 text-muted-foreground">{item.ata_chapter}</td>
                                <td className="py-1.5 pr-2 text-right tabular-nums">{baseMass.toFixed(1)}</td>
                                <td className="py-1.5 pr-2 text-right tabular-nums">{(item.compare_mass_kg ?? 0).toFixed(1)}</td>
                                <td className={`py-1.5 pr-2 text-right tabular-nums font-medium ${isPositive ? 'text-status-ok' : 'text-status-danger'}`}>
                                  <span className="inline-flex items-center gap-0.5">
                                    {isPositive ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />}
                                    {Math.abs(diffKg).toFixed(1)}
                                  </span>
                                </td>
                                <td className={`py-1.5 text-right tabular-nums ${isPositive ? 'text-status-ok' : 'text-status-danger'}`}>
                                  {pct.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">暂无数据</span>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {!reductionLoading && !reductionData && baseConfigId && compareConfigId && baseConfigId !== compareConfigId && (
          <div className="text-center py-8 text-sm text-muted-foreground">加载减重数据失败或暂无数据</div>
        )}

        {(!baseConfigId || !compareConfigId || baseConfigId === compareConfigId) && !reductionLoading && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {configs.length < 2 ? '需要至少两个构型才能进行减重对比' : '请选择两个不同的构型进行对比'}
          </div>
        )}
      </div>

    </div>
  );
}
