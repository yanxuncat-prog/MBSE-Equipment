import { useMemo, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Equipment } from '@/types';

/* ── Props ── */
interface Props {
  equipment: Equipment[];
  onSelect: (e: Equipment) => void;
  onEdit?: (e: Equipment) => void;
}

/* ── Constants ── */
const ZONES = [
  { label: '机头', min: 0, max: 3000 },
  { label: '前机身', min: 3000, max: 6000 },
  { label: '中机身', min: 6000, max: 10000 },
  { label: '后机身', min: 10000, max: 15000 },
  { label: '尾段', min: 15000, max: 22000 },
] as const;

const ATA_COLORS: Record<string, string> = {
  '21': 'var(--chart-1)', '23': 'var(--chart-2)', '24': 'var(--chart-3)',
  '27': 'var(--chart-4)', '32': 'var(--chart-5)', '33': 'var(--chart-1)',
  '34': 'var(--chart-2)', '86': 'var(--chart-3)', '30': 'var(--chart-4)',
  '46': 'var(--chart-5)',
};

const ATA_NAMES: Record<string, string> = {
  '21': '空调', '23': '通信', '24': '电源', '25': '设备/装饰', '26': '防火',
  '27': '飞控', '30': '防除冰', '31': '指示/记录', '32': '起落架', '33': '照明',
  '34': '导航', '42': '机载网络', '44': '客舱', '46': '信息系统', '52': '舱门',
  '86': '电推进', '87': '试飞改装', '90': '自主飞行', '92': '地面网联',
};

type ViewMode = 'side' | 'top' | 'section';

/* ── Coordinate mapping ── */
// Side view: STA → x, WL → y
const SIDE = { xMin: 0, xMax: 21000, yMin: -12000, yMax: 12000, vbW: 1000, vbH: 300 };
// Top view: STA → x, BL → y
const TOP = { xMin: 0, xMax: 21000, yMin: -3500, yMax: 3500, vbW: 1000, vbH: 200 };

function mapCoord(val: number, domainMin: number, domainMax: number, rangeMin: number, rangeMax: number) {
  return rangeMin + ((val - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
}

/* ── Equipment Marker (inline) ── */
function Marker({ x, y, ata, name, pn, mass, selected, onClick, onHover }: {
  x: number; y: number; ata: string; name: string; pn: string; mass: number;
  selected: boolean; onClick: () => void; onHover: (info: { x: number; y: number; name: string; pn: string; mass: number } | null) => void;
}) {
  const color = ATA_COLORS[ata] || 'var(--muted-foreground)';
  const r = selected ? 6 : Math.max(2, Math.min(5, Math.sqrt(mass) * 0.8));

  return (
    <g onClick={onClick} onMouseEnter={(e) => {
      const svg = (e.target as SVGElement).ownerSVGElement;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      onHover({ x: svgPt.x, y: svgPt.y, name, pn, mass });
    }} onMouseLeave={() => onHover(null)} style={{ cursor: 'pointer' }}>
      {selected && (
        <circle cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth={1.5} opacity={0.4}>
          <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={x} cy={y} r={r} fill={color} stroke="var(--background)" strokeWidth={1} opacity={0.85} />
    </g>
  );
}

/* ── Main Component ── */
export function LayoutTab({ equipment, onSelect, onEdit: _onEdit }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('side');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sectionSta, setSectionSta] = useState(8000);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; pn: string; mass: number } | null>(null);

  const positioned = useMemo(() =>
    equipment.filter(e => e.config_data?.sta != null),
    [equipment],
  );

  const handleClick = useCallback((e: Equipment) => {
    setSelectedId(e.id);
    onSelect(e);
  }, [onSelect]);

  /* ── KPIs ── */
  const totalWeight = useMemo(() => positioned.reduce((s, e) => s + (e.config_data?.mass_kg ?? 0), 0), [positioned]);
  const zoneStats = useMemo(() => ZONES.map(z => ({
    ...z,
    count: positioned.filter(e => e.config_data!.sta! >= z.min && e.config_data!.sta! < z.max).length,
    weight: positioned.filter(e => e.config_data!.sta! >= z.min && e.config_data!.sta! < z.max)
      .reduce((s, e) => s + (e.config_data?.mass_kg ?? 0), 0),
  })), [positioned]);

  /* ── ATA legend ── */
  const ataLegend = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of positioned) counts[e.ata_chapter] = (counts[e.ata_chapter] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [positioned]);

  /* ── Section view filtered equipment ── */
  const sectionEquip = useMemo(() =>
    positioned.filter(e => Math.abs((e.config_data?.sta ?? 0) - sectionSta) <= 500),
    [positioned, sectionSta],
  );

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3">
        <Card size="sm"><CardContent>
          <div className="text-xs text-muted-foreground">有位置数据</div>
          <div className="text-lg font-bold tabular-nums">{positioned.length} <span className="text-xs font-normal text-muted-foreground">/ {equipment.length}</span></div>
        </CardContent></Card>
        <Card size="sm"><CardContent>
          <div className="text-xs text-muted-foreground">总重量</div>
          <div className="text-lg font-bold tabular-nums">{totalWeight.toFixed(0)} <span className="text-xs font-normal text-muted-foreground">kg</span></div>
        </CardContent></Card>
        <Card size="sm"><CardContent>
          <div className="text-xs text-muted-foreground">最密区段</div>
          <div className="text-lg font-bold">{zoneStats.sort((a, b) => b.count - a.count)[0]?.label || '-'}</div>
        </CardContent></Card>
        <Card size="sm"><CardContent>
          <div className="text-xs text-muted-foreground">区段分布</div>
          <div className="text-xs tabular-nums mt-1">{zoneStats.map(z => `${z.label} ${z.count}`).join(' | ')}</div>
        </CardContent></Card>
      </div>

      {/* View Switcher + Main Visualization */}
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>设备空间分布</CardTitle>
            <div className="flex items-center gap-1">
              {(['side', 'top', 'section'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-md transition-colors",
                    viewMode === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {v === 'side' ? '侧视图' : v === 'top' ? '俯视图' : '截面图'}
                </button>
              ))}
            </div>
          </div>
          {/* ATA Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {ataLegend.map(([ata, count]) => (
              <span key={ata} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="size-2 rounded-full" style={{ backgroundColor: ATA_COLORS[ata] || 'var(--muted-foreground)' }} />
                {ATA_NAMES[ata] || `ATA-${ata}`} ({count})
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {/* Section STA slider */}
          {viewMode === 'section' && (
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-muted-foreground">STA位置:</span>
              <input
                type="range" min={0} max={21000} step={100} value={sectionSta}
                onChange={e => setSectionSta(Number(e.target.value))}
                className="flex-1 h-1.5 accent-primary"
              />
              <span className="text-xs tabular-nums font-medium w-16 text-right">{sectionSta} mm</span>
            </div>
          )}

          <div className="relative">
            {/* ─── Side View ─── */}
            {viewMode === 'side' && (
              <svg viewBox={`0 0 ${SIDE.vbW} ${SIDE.vbH}`} className="w-full" style={{ maxHeight: 350 }} role="img" aria-label="设备空间分布图-侧视图">
                <title>设备空间分布图-侧视图</title>
                {/* Aircraft silhouette */}
                <image href="/aircraft-side.svg" x={30} y={30} width={940} height={240}
                  preserveAspectRatio="xMidYMid meet" opacity={0.3} style={{ pointerEvents: 'none' }} />
                {/* Zone dividers */}
                {ZONES.slice(1).map(z => {
                  const x = mapCoord(z.min, SIDE.xMin, SIDE.xMax, 30, 970);
                  return <line key={z.label} x1={x} y1={40} x2={x} y2={260} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3,2" />;
                })}
                {/* Zone labels */}
                {ZONES.map(z => {
                  const x = mapCoord((z.min + z.max) / 2, SIDE.xMin, SIDE.xMax, 30, 970);
                  return <text key={z.label} x={x} y={280} textAnchor="middle" fill="var(--muted-foreground)" fontSize={9}>{z.label}</text>;
                })}
                {/* STA ruler */}
                {[0, 3000, 6000, 9000, 12000, 15000, 18000, 21000].map(sta => {
                  const x = mapCoord(sta, SIDE.xMin, SIDE.xMax, 30, 970);
                  return <text key={sta} x={x} y={295} textAnchor="middle" fill="var(--muted-foreground)" fontSize={7} className="tabular-nums">{sta}</text>;
                })}
                {/* Equipment */}
                {positioned.map(e => {
                  const x = mapCoord(e.config_data!.sta!, SIDE.xMin, SIDE.xMax, 30, 970);
                  const y = mapCoord(-(e.config_data?.wl ?? 0), SIDE.yMin, SIDE.yMax, 40, 260);
                  return <Marker key={e.id} x={x} y={y} ata={e.ata_chapter} name={e.name} pn={e.part_number}
                    mass={e.config_data?.mass_kg ?? 0.5} selected={e.id === selectedId}
                    onClick={() => handleClick(e)} onHover={setTooltip} />;
                })}
              </svg>
            )}

            {/* ─── Top View ─── */}
            {viewMode === 'top' && (
              <svg viewBox={`0 0 ${TOP.vbW} ${TOP.vbH}`} className="w-full" style={{ maxHeight: 300 }} role="img" aria-label="设备空间分布图-俯视图">
                <title>设备空间分布图-俯视图</title>
                {/* Aircraft silhouette */}
                <image href="/aircraft-top.svg" x={30} y={10} width={940} height={180}
                  preserveAspectRatio="xMidYMid meet" opacity={0.3} style={{ pointerEvents: 'none' }} />
                {/* Centerline */}
                <line x1={30} y1={100} x2={970} y2={100} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="4,3" />
                <text x={15} y={103} fill="var(--muted-foreground)" fontSize={7}>BL0</text>
                {/* Equipment */}
                {positioned.map(e => {
                  const x = mapCoord(e.config_data!.sta!, TOP.xMin, TOP.xMax, 30, 970);
                  const y = mapCoord(-(e.config_data?.bl ?? 0), TOP.yMin, TOP.yMax, 10, 190);
                  return <Marker key={e.id} x={x} y={y} ata={e.ata_chapter} name={e.name} pn={e.part_number}
                    mass={e.config_data?.mass_kg ?? 0.5} selected={e.id === selectedId}
                    onClick={() => handleClick(e)} onHover={setTooltip} />;
                })}
              </svg>
            )}

            {/* ─── Section View ─── */}
            {viewMode === 'section' && (
              <svg viewBox="0 0 400 320" className="w-full" style={{ maxHeight: 350 }} role="img" aria-label="设备空间分布图-截面图">
                <title>设备空间分布图-截面图</title>
                <text x={200} y={20} textAnchor="middle" fill="var(--foreground)" fontSize={12} fontWeight={600}>
                  截面 STA {sectionSta} mm
                </text>
                {/* Fuselage cross-section */}
                <ellipse cx={200} cy={160} rx={120} ry={100} fill="none" stroke="var(--border)" strokeWidth={2} />
                {/* Floor line */}
                <line x1={90} y1={190} x2={310} y2={190} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3,3" />
                <text x={315} y={193} fill="var(--muted-foreground)" fontSize={8}>客舱地板</text>
                {/* BL/WL axes */}
                <line x1={200} y1={55} x2={200} y2={265} stroke="var(--border)" strokeWidth={0.3} strokeDasharray="2,2" />
                <text x={200} y={50} textAnchor="middle" fill="var(--muted-foreground)" fontSize={7}>WL</text>
                <line x1={75} y1={160} x2={325} y2={160} stroke="var(--border)" strokeWidth={0.3} strokeDasharray="2,2" />
                <text x={330} y={163} fill="var(--muted-foreground)" fontSize={7}>BL</text>
                {/* Equipment in section */}
                {sectionEquip.map(e => {
                  const bl = e.config_data?.bl ?? 0;
                  const wl = e.config_data?.wl ?? 0;
                  const cx = 200 + (bl / 3500) * 110;
                  const cy = 160 - (wl / 12000) * 90;
                  return <Marker key={e.id} x={cx} y={cy} ata={e.ata_chapter} name={e.name} pn={e.part_number}
                    mass={e.config_data?.mass_kg ?? 0.5} selected={e.id === selectedId}
                    onClick={() => handleClick(e)} onHover={setTooltip} />;
                })}
                <text x={200} y={300} textAnchor="middle" fill="var(--muted-foreground)" fontSize={10}>
                  {sectionEquip.length} 台设备在 STA {sectionSta}±500mm 范围内
                </text>
              </svg>
            )}

            {/* Tooltip */}
            {tooltip && (
              <div className="pointer-events-none absolute z-50 rounded-md border bg-popover px-3 py-2 shadow-md"
                style={{ left: `${(tooltip.x / (viewMode === 'section' ? 400 : 1000)) * 100}%`, top: `${(tooltip.y / (viewMode === 'section' ? 320 : viewMode === 'top' ? 200 : 300)) * 100}%`, transform: 'translate(8px, -100%)' }}>
                <p className="text-sm font-medium text-popover-foreground">{tooltip.name}</p>
                <p className="text-xs text-muted-foreground">{tooltip.pn} · {tooltip.mass.toFixed(1)} kg</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Insights */}
      <div className="rounded-lg border border-chart-1/20 bg-chart-1/5 px-4 py-2.5 space-y-1">
        {(() => {
          const leftCount = positioned.filter(e => (e.config_data?.bl ?? 0) < -200).length;
          const rightCount = positioned.filter(e => (e.config_data?.bl ?? 0) > 200).length;
          const rearWeight = positioned.filter(e => (e.config_data?.sta ?? 0) >= 10000 && (e.config_data?.sta ?? 0) < 15000).reduce((s, e) => s + (e.config_data?.mass_kg ?? 0), 0);
          const rearPct = totalWeight > 0 ? (rearWeight / totalWeight * 100).toFixed(0) : '0';
          const rearDevices = positioned.filter(e => (e.config_data?.sta ?? 0) >= 10000 && (e.config_data?.sta ?? 0) < 15000).length;
          const rearDevPct = positioned.length > 0 ? (rearDevices / positioned.length * 100).toFixed(0) : '0';
          return (
            <>
              <p className="text-xs"><span className="font-semibold text-chart-1">左右不对称：左侧 {leftCount} 台 vs 右侧 {rightCount} 台</span>（{leftCount > 0 ? (leftCount / (rightCount || 1)).toFixed(1) : 0}:1）</p>
              <p className="text-xs text-muted-foreground">后机身(STA 10000-15000) 仅 {rearDevPct}% 的设备，承载 {rearPct}% 重量</p>
            </>
          );
        })()}
      </div>

      {/* Zone Weight Breakdown */}
      <Card size="sm">
        <CardHeader><CardTitle>区段重量分布</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {zoneStats.map((z) => {
              const maxW = Math.max(...zoneStats.map(s => s.weight), 1);
              return (
                <div key={z.label} className="text-center">
                  <div className="h-24 flex items-end justify-center">
                    <div className="w-10 rounded-t bg-chart-1 transition-all"
                      style={{ height: `${(z.weight / maxW) * 100}%`, opacity: 0.3 + 0.7 * (z.weight / maxW) }} />
                  </div>
                  <div className="mt-1 text-xs font-medium">{z.label}</div>
                  <div className="text-xs tabular-nums text-muted-foreground">{z.weight.toFixed(0)} kg</div>
                  <div className="text-xs tabular-nums text-muted-foreground">{z.count} 台</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
