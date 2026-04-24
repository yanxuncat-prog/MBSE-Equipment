import { useMemo, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/workstation/shared/StatsCard';
import { StatsRow } from '@/components/workstation/shared/StatsRow';
import { ProfessionalTable } from '@/components/workstation/shared/ProfessionalTable';
import type { Column } from '@/components/workstation/shared/ProfessionalTable';
import { ProfessionalPanel } from '@/components/workstation/shared/ProfessionalPanel';
import { BusStatusDots } from '@/components/charts/BusStatusDots';
import { HorizontalBar } from '@/components/workstation/charts/HorizontalBar';
import { SimpleDonut } from '@/components/workstation/charts/SimpleDonut';
import type { Equipment, ValidationReport } from '@/types';

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
  onEdit?: (equip: Equipment) => void;
}

/* ------------------------------------------------------------------ */
/* Color helpers                                                       */
/* ------------------------------------------------------------------ */
function busColor(pct: number): string {
  if (pct > 100) return 'var(--status-danger)';
  if (pct > 85) return 'var(--status-warn)';
  return 'var(--status-ok)';
}

function busColorBg(pct: number): string {
  if (pct > 100) return 'color-mix(in srgb, var(--status-danger) 12%, transparent)';
  if (pct > 85) return 'color-mix(in srgb, var(--status-warn) 12%, transparent)';
  return 'color-mix(in srgb, var(--status-ok) 10%, transparent)';
}

/* ------------------------------------------------------------------ */
/* Sankey cubic bezier path                                            */
/* ------------------------------------------------------------------ */
function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

/* ------------------------------------------------------------------ */
/* Types for Sankey nodes/links                                        */
/* ------------------------------------------------------------------ */
interface SankeyNode {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  column: 'source' | 'bus' | 'equipment';
  loadPct?: number;
  value?: number;
}

interface SankeyLink {
  sourceId: string;
  targetId: string;
  value: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  color: string;
  width: number;
  busId: string;
}

const FLIGHT_PHASES = ['地面', '起飞', '巡航', '着陆', '应急'] as const;

/* ------------------------------------------------------------------ */
/* Bus Badge variant helper                                            */
/* ------------------------------------------------------------------ */
function busBadgeClasses(pct: number): string {
  if (pct > 100) return 'bg-red-500/15 text-red-700 border-red-200';
  if (pct > 85) return 'bg-orange-500/15 text-orange-700 border-orange-200';
  return 'bg-green-500/15 text-green-700 border-green-200';
}

/* ------------------------------------------------------------------ */
/* ElectricalTab Component                                             */
/* ------------------------------------------------------------------ */
export function ElectricalTab({ equipment, report, onSelect, onEdit }: Props) {
  const [hoveredBus, setHoveredBus] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<string>('巡航');

  const elecEngine = report?.engines.find(e => e.engine_name === 'electrical_load');
  const buses: Record<string, any> = elecEngine?.details?.buses ?? {};
  const busEntries = Object.values(buses) as {
    bus_name: string; load_ratio_pct: number; load_kva: number; capacity_kva: number;
  }[];

  const maxLoadBus = useMemo(() => {
    if (busEntries.length === 0) return null;
    return busEntries.reduce((max, b) => b.load_ratio_pct > max.load_ratio_pct ? b : max, busEntries[0]);
  }, [busEntries]);

  const maxLoadRatio = maxLoadBus?.load_ratio_pct ?? 0;
  const maxLoadMargin = maxLoadBus ? (maxLoadBus.capacity_kva - maxLoadBus.load_kva) : 0;

  const primaryCount = useMemo(
    () => equipment.filter(e => e.is_primary_electrical === true).length,
    [equipment],
  );
  const elecCount = useMemo(
    () => equipment.filter(e => e.is_electrical === true).length,
    [equipment],
  );
  const nonElecCount = useMemo(
    () => equipment.filter(e => e.is_electrical !== true).length,
    [equipment],
  );

  /* ---- Sankey computation ---- */
  const sankeyData = useMemo(() => {
    const SVG_W = 780, SVG_H = 420;
    const COL_SOURCE = 50, COL_BUS = 320, COL_EQUIP = 600;
    const NODE_W = 28;

    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // --- Source nodes (left) ---
    const totalCapacity = busEntries.reduce((s, b) => s + b.capacity_kva, 0);
    const genCapacity = totalCapacity * 0.8;
    const batCapacity = totalCapacity * 0.2;
    const sourceGap = 30;
    const sourceHeight = (SVG_H - 60 - sourceGap) / 2;

    nodes.push({
      id: 'src-gen', label: '发电机', column: 'source',
      x: COL_SOURCE, y: 30, w: NODE_W, h: Math.max(sourceHeight, 40),
      color: 'var(--chart-1)', value: genCapacity,
    });
    nodes.push({
      id: 'src-bat', label: '电池', column: 'source',
      x: COL_SOURCE, y: 30 + sourceHeight + sourceGap, w: NODE_W, h: Math.max(sourceHeight, 40),
      color: 'var(--chart-2)', value: batCapacity,
    });

    // --- Bus nodes (middle) ---
    const busGap = 12;
    const availH = SVG_H - 40;
    const totalBusCap = busEntries.reduce((s, b) => s + b.capacity_kva, 0) || 1;
    let busY = 20;

    const busNodeMap: Record<string, SankeyNode> = {};
    for (const b of busEntries) {
      const h = Math.max((b.capacity_kva / totalBusCap) * (availH - busEntries.length * busGap), 30);
      const node: SankeyNode = {
        id: `bus-${b.bus_name}`, label: b.bus_name, column: 'bus',
        x: COL_BUS, y: busY, w: NODE_W + 16, h,
        color: busColor(b.load_ratio_pct),
        loadPct: b.load_ratio_pct,
        value: b.load_kva,
      };
      nodes.push(node);
      busNodeMap[b.bus_name] = node;
      busY += h + busGap;
    }

    // --- Equipment nodes (right): group by bus ---
    const equipByBus: Record<string, Equipment[]> = {};
    for (const e of equipment) {
      if (!e.is_electrical) continue;
      const bn = e.config_data?.bus_name || '未知';
      if (!equipByBus[bn]) equipByBus[bn] = [];
      equipByBus[bn].push(e);
    }

    let equipY = 20;
    const maxPower = Math.max(
      ...equipment.filter(e => e.is_electrical).map(e => e.electrical_load?.power_kva_normal ?? 0),
      0.1,
    );

    for (const b of busEntries) {
      const eqs = (equipByBus[b.bus_name] || []).sort(
        (a, z) => (z.electrical_load?.power_kva_normal ?? 0) - (a.electrical_load?.power_kva_normal ?? 0),
      );
      const sliced = eqs.slice(0, 8); // Show top 8 per bus to avoid clutter

      for (const eq of sliced) {
        const power = eq.electrical_load?.power_kva_normal ?? 0;
        const h = Math.max((power / maxPower) * 32, 8);
        const node: SankeyNode = {
          id: `eq-${eq.id}`, label: eq.name, column: 'equipment',
          x: COL_EQUIP, y: equipY, w: NODE_W - 4, h,
          color: busNodeMap[b.bus_name]?.color ?? 'var(--muted-foreground)',
          value: power,
        };
        nodes.push(node);
        equipY += h + 4;

        // Link bus -> equipment
        const busNode = busNodeMap[b.bus_name];
        if (busNode) {
          links.push({
            sourceId: busNode.id, targetId: node.id,
            value: power,
            sx: busNode.x + busNode.w, sy: busNode.y + busNode.h / 2,
            tx: node.x, ty: node.y + node.h / 2,
            color: busNode.color,
            width: Math.max(power / maxPower * 6, 1),
            busId: busNode.id,
          });
        }
      }

      if (eqs.length > 8) {
        // "+N more" placeholder
        const moreNode: SankeyNode = {
          id: `more-${b.bus_name}`, label: `+${eqs.length - 8} 更多...`, column: 'equipment',
          x: COL_EQUIP, y: equipY, w: NODE_W - 4, h: 12,
          color: 'var(--muted)', value: 0,
        };
        nodes.push(moreNode);
        equipY += 16;
      }

      equipY += 8;
    }

    // --- Links: sources -> buses ---
    for (const b of busEntries) {
      const busNode = busNodeMap[b.bus_name];
      if (!busNode) continue;
      // Generator provides ~80%, battery ~20%
      const genNode = nodes.find(n => n.id === 'src-gen')!;
      const batNode = nodes.find(n => n.id === 'src-bat')!;

      links.push({
        sourceId: 'src-gen', targetId: busNode.id,
        value: b.load_kva * 0.8,
        sx: genNode.x + genNode.w, sy: genNode.y + genNode.h / 2,
        tx: busNode.x, ty: busNode.y + busNode.h * 0.35,
        color: busNode.color,
        width: Math.max((b.load_kva / totalBusCap) * 10, 1.5),
        busId: busNode.id,
      });
      links.push({
        sourceId: 'src-bat', targetId: busNode.id,
        value: b.load_kva * 0.2,
        sx: batNode.x + batNode.w, sy: batNode.y + batNode.h / 2,
        tx: busNode.x, ty: busNode.y + busNode.h * 0.65,
        color: busNode.color,
        width: Math.max((b.load_kva / totalBusCap) * 4, 1),
        busId: busNode.id,
      });
    }

    return { nodes, links, svgW: SVG_W, svgH: Math.max(SVG_H, equipY + 20) };
  }, [busEntries, equipment]);

  /* ---- Bus bar items for right panel ---- */
  const busBarItems = useMemo(
    () => busEntries
      .map(b => ({ label: b.bus_name, value: Math.round(b.load_ratio_pct), suffix: '%' }))
      .sort((a, b) => b.value - a.value),
    [busEntries],
  );

  /* ---- Table columns ---- */
  const columns: Column<Equipment>[] = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
    {
      title: '母线', key: 'bus', width: 100,
      render: (_, r) => {
        const bn = r.config_data?.bus_name;
        if (!bn) return <span className="text-muted-foreground">-</span>;
        const busInfo = busEntries.find(b => b.bus_name === bn);
        const pct = busInfo?.load_ratio_pct ?? 0;
        return (
          <Badge variant="outline" className={busBadgeClasses(pct)}>
            {bn}
          </Badge>
        );
      },
    },
    {
      title: '功耗(kVA)', key: 'power', width: 90, align: 'right',
      render: (_, r) => (
        <span className="tabular-nums">
          {r.electrical_load?.power_kva_normal?.toFixed(2) || '-'}
        </span>
      ),
    },
    { title: '供电电压', key: 'voltage', width: 80, render: (_, r) => r.power_voltage || '-' },
    { title: '供电余度', key: 'redundancy', width: 80, render: (_, r) => r.power_redundancy || '-' },
    {
      title: '一级设备', key: 'primary', width: 70, align: 'center',
      render: (_, r) => r.is_primary_electrical === true
        ? <span className="text-amber-500 font-bold">&#9733;</span>
        : <span className="text-muted-foreground/40">-</span>,
    },
    {
      title: '电设备', key: 'is_elec', width: 70, align: 'center',
      render: (_, r) => r.is_electrical === true
        ? <span className="text-green-500">&#9679;</span>
        : <span className="text-muted-foreground/30">&#9675;</span>,
    },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata', width: 55 },
  ];

  const handleBusHover = useCallback((busId: string | null) => setHoveredBus(busId), []);

  /* Banner */
  const bannerClasses = maxLoadRatio > 100
    ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
    : maxLoadRatio > 85
      ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
      : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800';

  const bannerDotColor = maxLoadRatio > 100 ? 'bg-red-500' : maxLoadRatio > 85 ? 'bg-orange-500' : 'bg-green-500';
  const bannerValueColor = maxLoadRatio > 100 ? 'text-red-600' : maxLoadRatio > 85 ? 'text-orange-600' : 'text-green-600';

  return (
    <div className="flex h-[calc(100vh-180px)]">
      <style>{`
        .el-row-non-electrical td { opacity: 0.35; }
        .el-sankey-link { transition: opacity 0.2s; }
        .el-sankey-node { transition: opacity 0.2s; cursor: pointer; }
      `}</style>

      <div className="flex-1 overflow-auto pr-4">
        {/* Hook Banner */}
        <div className={`flex items-center gap-2 rounded-md border px-4 py-2.5 mb-3 ${bannerClasses}`}>
          <div className={`h-2 w-2 shrink-0 rounded-full ${bannerDotColor}`} />
          <p className="text-[13px] text-foreground">
            {maxLoadBus ? (
              <>
                <strong>{maxLoadBus.bus_name}</strong> 母线负荷率{' '}
                <span className={`font-bold ${bannerValueColor}`}>{maxLoadRatio.toFixed(1)}%</span>
                ——距满载仅剩{' '}
                <span className="font-bold text-blue-700 dark:text-blue-400">{maxLoadMargin.toFixed(1)} kVA</span>。
              </>
            ) : (
              '无母线负荷数据。'
            )}
          </p>
        </div>

        {/* Stats Row */}
        <StatsRow>
          <Card size="sm" className="flex-1">
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">母线状态</div>
              {busEntries.length > 0 ? <BusStatusDots buses={buses} /> : <span className="text-muted-foreground/50 text-xs">无数据</span>}
            </CardContent>
          </Card>
          <StatsCard
            label="最高负荷"
            value={`${maxLoadRatio.toFixed(1)}%`}
            color={maxLoadRatio > 85 ? 'var(--status-warn)' : 'var(--status-ok)'}
          />
          <StatsCard label="一级用电设备" value={primaryCount} color="var(--status-warn)" />
        </StatsRow>

        {/* Sankey Flow Diagram */}
        <Card size="sm" className="mb-4">
          <CardHeader className="border-b">
            <CardTitle>供电流向图</CardTitle>
            <CardAction>
              <div className="flex gap-1">
                {FLIGHT_PHASES.map(phase => (
                  <Button
                    key={phase}
                    size="xs"
                    variant={activePhase === phase ? 'default' : 'outline'}
                    onClick={() => setActivePhase(phase)}
                  >
                    {phase}
                  </Button>
                ))}
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="overflow-x-auto p-2">
            <svg
              width={sankeyData.svgW}
              height={sankeyData.svgH}
              viewBox={`0 0 ${sankeyData.svgW} ${sankeyData.svgH}`}
              className="block w-full min-h-[300px]"
              role="img"
              aria-label="电气系统桑基图"
            >
              <title>电气系统桑基图</title>
              <defs>
                {/* Glow filter for highlighted buses */}
                <filter id="el-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Links (draw first, behind nodes) */}
              {sankeyData.links.map((link, i) => {
                const isHighlighted = hoveredBus === null || hoveredBus === link.busId;
                return (
                  <path
                    key={i}
                    className="el-sankey-link"
                    d={bezierPath(link.sx, link.sy, link.tx, link.ty)}
                    fill="none"
                    stroke={link.color}
                    strokeWidth={link.width}
                    strokeOpacity={isHighlighted ? 0.35 : 0.06}
                  />
                );
              })}

              {/* Nodes */}
              {sankeyData.nodes.map(node => {
                const isHighlighted = hoveredBus === null || hoveredBus === `bus-${node.label}` ||
                  sankeyData.links.some(l => (l.sourceId === node.id || l.targetId === node.id) && hoveredBus === l.busId);
                const isBus = node.column === 'bus';

                return (
                  <g
                    key={node.id}
                    className="el-sankey-node"
                    style={{ opacity: isHighlighted ? 1 : 0.1 }}
                    onMouseEnter={() => isBus ? handleBusHover(node.id) : undefined}
                    onMouseLeave={() => isBus ? handleBusHover(null) : undefined}
                  >
                    {/* Node rectangle */}
                    <rect
                      x={node.x} y={node.y} width={node.w} height={node.h}
                      rx={3}
                      fill={isBus ? busColorBg(node.loadPct ?? 0) : node.color}
                      fillOpacity={isBus ? 1 : 0.85}
                      stroke={node.color}
                      strokeWidth={isBus ? 2 : 1}
                      filter={isBus && hoveredBus === node.id ? 'url(#el-glow)' : undefined}
                    />
                    {/* Bus: filled bar showing load% */}
                    {isBus && node.loadPct !== undefined && (
                      <rect
                        x={node.x + 2}
                        y={node.y + node.h * (1 - Math.min(node.loadPct, 100) / 100)}
                        width={node.w - 4}
                        height={node.h * Math.min(node.loadPct, 100) / 100}
                        rx={2}
                        fill={node.color}
                        fillOpacity={0.55}
                      />
                    )}
                    {/* Labels */}
                    {node.column === 'source' && (
                      <>
                        <text
                          x={node.x + node.w / 2} y={node.y + node.h / 2 - 4}
                          textAnchor="middle" fill="var(--primary-foreground)" fontSize={10} fontWeight={600}
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                        >
                          {node.label}
                        </text>
                        <text
                          x={node.x + node.w / 2} y={node.y + node.h / 2 + 10}
                          textAnchor="middle" fill="var(--primary-foreground)" fontSize={8} fillOpacity={0.8}
                        >
                          {(node.value ?? 0).toFixed(0)} kVA
                        </text>
                      </>
                    )}
                    {isBus && (
                      <>
                        <text
                          x={node.x - 4} y={node.y + node.h / 2 - 4}
                          textAnchor="end" fill="var(--foreground)" fontSize={9} fontWeight={600}
                        >
                          {node.label}
                        </text>
                        <text
                          x={node.x - 4} y={node.y + node.h / 2 + 8}
                          textAnchor="end" fill={node.color} fontSize={8}
                        >
                          {(node.loadPct ?? 0).toFixed(0)}% | {(node.value ?? 0).toFixed(1)} kVA
                        </text>
                      </>
                    )}
                    {node.column === 'equipment' && (
                      <text
                        x={node.x + node.w + 6} y={node.y + node.h / 2 + 3}
                        fill="var(--muted-foreground)" fontSize={8}
                        className="pointer-events-auto"
                      >
                        <title>{node.label}: {(node.value ?? 0).toFixed(2)} kVA</title>
                        {node.label.length > 14 ? node.label.slice(0, 14) + '...' : node.label}
                        {' '}{(node.value ?? 0).toFixed(1)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Column headers */}
              <text x={64} y={14} fill="var(--muted-foreground)" fontSize={10} fontWeight={600}>电源</text>
              <text x={334} y={14} fill="var(--muted-foreground)" fontSize={10} fontWeight={600}>母线</text>
              <text x={614} y={14} fill="var(--muted-foreground)" fontSize={10} fontWeight={600}>用电设备</text>
            </svg>
          </CardContent>
        </Card>

        {/* Professional Table */}
        <ProfessionalTable
          columns={columns}
          dataSource={equipment}
          onRow={(record) => ({ onClick: () => onSelect(record) })}
          onEdit={onEdit}
          rowKey="id"
        />
      </div>

      {/* Right Panel */}
      <ProfessionalPanel>
        <Card size="sm">
          <CardHeader>
            <CardTitle>母线负荷排序</CardTitle>
          </CardHeader>
          <CardContent>
            {busBarItems.length > 0 ? (
              <HorizontalBar items={busBarItems} />
            ) : (
              <span className="text-muted-foreground/50 text-xs">无数据</span>
            )}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>飞行阶段</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {FLIGHT_PHASES.map(phase => (
                <Badge
                  key={phase}
                  variant={activePhase === phase ? 'default' : 'outline'}
                  className={`cursor-pointer text-xs ${activePhase === phase ? 'bg-blue-800 hover:bg-blue-700' : ''}`}
                  onClick={() => setActivePhase(phase)}
                >
                  {phase}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              当前选中: <strong>{activePhase}</strong> 阶段
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>用电设备统计</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleDonut segments={[
              { label: '电设备', value: elecCount, color: 'var(--chart-1)' },
              { label: '非电设备', value: nonElecCount, color: 'var(--muted)' },
            ]} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>一级设备</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-2">
              <div className="text-[28px] font-bold text-amber-500">{primaryCount}</div>
              <div className="text-xs text-muted-foreground">一级用电设备</div>
            </div>
          </CardContent>
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
