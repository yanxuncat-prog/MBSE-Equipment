import { useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { StatsCard } from '@/components/workstation/shared/StatsCard';
import { StatsRow } from '@/components/workstation/shared/StatsRow';
import { ProfessionalTable, type Column } from '@/components/workstation/shared/ProfessionalTable';
import { ProfessionalPanel } from '@/components/workstation/shared/ProfessionalPanel';
import { HorizontalBar } from '@/components/workstation/charts/HorizontalBar';
import { cn } from '@/lib/utils';
import type { Equipment, ValidationReport } from '@/types';

// Lazy load 3D scene
const AircraftScene3D = lazy(() =>
  import('@/components/spatial3d/AircraftScene3D').then(m => ({ default: m.AircraftScene3D }))
);

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

/* ------------------------------------------------------------------ */
/* Zone color palette                                                  */
/* ------------------------------------------------------------------ */
const ZONE_COLORS = [
  '#1E40AF', '#059669', '#D97706', '#DC2626', '#7C3AED',
  '#0891B2', '#BE185D', '#4338CA', '#65A30D', '#EA580C',
  '#2563EB', '#0D9488', '#CA8A04', '#9333EA', '#E11D48',
  '#0284C7', '#16A34A', '#DB2777', '#6366F1', '#F97316',
];

/* ------------------------------------------------------------------ */
/* Aircraft silhouette SVG path (simplified side view)                 */
/* ------------------------------------------------------------------ */
const FUSELAGE_PATH = 'M30,50 Q20,50 15,48 L5,46 Q0,44 2,42 L15,40 Q20,38 30,38 L280,38 Q310,38 325,40 L340,42 Q345,44 342,46 L330,48 Q320,50 310,50 Z';
const TAIL_PATH = 'M310,38 L325,20 Q330,15 335,18 L340,38';
const COCKPIT_PATH = 'M30,38 L15,36 Q5,34 3,38 L10,42 Q15,44 30,44';

/* ------------------------------------------------------------------ */
/* View mode segmented control options                                 */
/* ------------------------------------------------------------------ */
const VIEW_OPTIONS = [
  { label: '3D 模型', value: '3d' },
  { label: '2D 密度图', value: '2d' },
];

/* ------------------------------------------------------------------ */
/* LayoutTab Component                                                 */
/* ------------------------------------------------------------------ */
export function LayoutTab({ equipment, onSelect }: Props) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<string>('3d');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleEquipSelect = useCallback((e: Equipment) => {
    setSelectedId(e.id);
    onSelect(e);
  }, [onSelect]);

  /* ---- Zone grouping ---- */
  const zoneCounts = useMemo(() => {
    const map = new Map<string, number>();
    equipment.forEach(e => {
      const zone = e.config_data?.zone_name || '未知';
      map.set(zone, (map.get(zone) || 0) + 1);
    });
    return map;
  }, [equipment]);

  const sortedZones = useMemo(
    () => [...zoneCounts.entries()].sort((a, b) => b[1] - a[1]),
    [zoneCounts],
  );

  const uniqueZones = sortedZones.filter(([k]) => k !== '未知').length;

  const densestZone = useMemo(() => {
    if (sortedZones.length === 0) return { name: '-', count: 0 };
    return { name: sortedZones[0][0], count: sortedZones[0][1] };
  }, [sortedZones]);

  const adjustments = useMemo(
    () => equipment.filter(e => e.config_data?.layout_adjustment != null && e.config_data.layout_adjustment !== ''),
    [equipment],
  );

  /* ---- Install method distribution ---- */
  const installMethodItems = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const e of equipment) {
      const key = e.config_data?.install_method || '未知';
      groups[key] = (groups[key] || 0) + 1;
    }
    return Object.entries(groups)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [equipment]);

  /* ---- Zone bar items ---- */
  const zoneBarItems = useMemo(
    () => sortedZones.map(([label, value]) => ({ label, value })),
    [sortedZones],
  );

  /* ---- Zone density bar data (for SVG) ---- */
  const totalEquip = equipment.length || 1;
  const zoneDensityBarData = useMemo(() => {
    const BAR_WIDTH = 680;
    let x = 0;
    return sortedZones.map(([name, count], i) => {
      const w = Math.max((count / totalEquip) * BAR_WIDTH, 4);
      const item = { name, count, x, w, color: ZONE_COLORS[i % ZONE_COLORS.length] };
      x += w;
      return item;
    });
  }, [sortedZones, totalEquip]);

  /* ---- Fuselage overlay spans ---- */
  const fuselageZoneSpans = useMemo(() => {
    const FUSE_START = 30;
    const FUSE_END = 310;
    const FUSE_W = FUSE_END - FUSE_START;
    let x = FUSE_START;
    return sortedZones.map(([name, count], i) => {
      const w = Math.max((count / totalEquip) * FUSE_W, 2);
      const item = { name, count, x, w, color: ZONE_COLORS[i % ZONE_COLORS.length] };
      x += w;
      return item;
    });
  }, [sortedZones, totalEquip]);

  /* ---- Table columns ---- */
  const columns: Column<Equipment>[] = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '区域', key: 'zone', width: 100, render: (_, r) => r.config_data?.zone_name || '-' },
    { title: '机架位置', key: 'rack', width: 100, render: (_, r) => r.config_data?.rack_position || '-' },
    { title: 'STA', key: 'sta', width: 60, align: 'right', render: (_, r) => r.config_data?.sta?.toFixed(0) || '-' },
    { title: 'WL', key: 'wl', width: 60, align: 'right', render: (_, r) => r.config_data?.wl?.toFixed(0) || '-' },
    { title: 'BL', key: 'bl', width: 60, align: 'right', render: (_, r) => r.config_data?.bl?.toFixed(0) || '-' },
    { title: '尺寸(mm)', key: 'dimensions', width: 110, render: (_, r) => r.dimensions_mm || '-' },
    { title: '安装方式', key: 'install', width: 110, render: (_, r) => r.config_data?.install_method || '-' },
    { title: '布局调整需求', key: 'layout_adj', width: 150, render: (_, r) => r.config_data?.layout_adjustment || '-' },
    {
      title: '0号机设备', key: 'batch0', width: 80,
      render: (_, r) => r.config_data?.use_batch0_device === true ? '是' : r.config_data?.use_batch0_device === false ? '否' : '-',
    },
  ];

  /* ---- Banner ---- */
  const bannerColor = adjustments.length > 20 ? '#FF3B30' : adjustments.length > 5 ? '#FF9500' : '#34C759';
  const bannerBg = adjustments.length > 20 ? 'bg-red-50' : adjustments.length > 5 ? 'bg-orange-50' : 'bg-green-50';
  const bannerBorder = adjustments.length > 20 ? 'border-red-200' : adjustments.length > 5 ? 'border-orange-200' : 'border-green-200';

  const handleZoneHover = useCallback((zone: string | null) => setHoveredZone(zone), []);

  return (
    <div className="flex h-[calc(100vh-180px)]">
      <style>{`
        .layout-row-adjustment td { background: #fffbe6 !important; }
        .layout-zone-segment { transition: opacity 0.2s, filter 0.2s; cursor: pointer; }
        .layout-zone-segment:hover { filter: brightness(1.15); }
        .layout-fuse-overlay { transition: opacity 0.2s; }
      `}</style>

      <div className="flex-1 overflow-auto pr-4">
        {/* Hook Banner */}
        <div className={cn('flex items-center gap-2 rounded-md border px-4 py-2.5 mb-3', bannerBg, bannerBorder)}>
          <div className="size-2 shrink-0 rounded-full" style={{ background: bannerColor }} />
          <span className="text-[13px] text-foreground">
            {densestZone.name} 区域{' '}
            <span className="font-bold text-blue-800">{densestZone.count} 台</span>设备，全机密度最高。
            <span className="font-bold text-orange-500">{adjustments.length} 台</span>设备有布局调整需求。
          </span>
        </div>

        {/* Stats Row */}
        <StatsRow>
          <StatsCard label="安装区域" value={uniqueZones} color="#007aff" />
          <StatsCard label={`最密集: ${densestZone.name}`} value={`${densestZone.count} 台`} color="#FF9500" />
          <StatsCard label="需布局调整" value={adjustments.length} color="#FF3B30" />
        </StatsRow>

        {/* 3D / 2D View Toggle */}
        <Card size="sm" className="mb-4">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>空间布局视图</CardTitle>
              <div className="inline-flex h-8 items-center rounded-lg bg-muted p-[3px]">
                {VIEW_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setViewMode(opt.value)}
                    className={cn(
                      "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                      viewMode === opt.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className={viewMode === '3d' ? '!p-0' : ''}>
            {viewMode === '3d' ? (
              <div className="h-[400px] rounded-b-xl bg-[#060a12]">
                <Suspense fallback={
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">加载 3D 引擎...</span>
                  </div>
                }>
                  <AircraftScene3D
                    equipment={equipment}
                    zones={[]}
                    selectedId={selectedId}
                    onSelect={handleEquipSelect}
                  />
                </Suspense>
              </div>
            ) : (
              /* Zone Density 2D Visualization - original SVG */
              <TooltipProvider>
                <svg width={700} height={170} viewBox="0 0 700 170" className="block w-full">
                  {/* Zone Density Bar */}
                  <text x={10} y={14} fill="#999" fontSize={10} fontWeight={600}>区域密度条</text>
                  {zoneDensityBarData.map((zone) => {
                    const dimmed = hoveredZone !== null && hoveredZone !== zone.name;
                    return (
                      <g
                        key={zone.name}
                        className="layout-zone-segment"
                        onMouseEnter={() => handleZoneHover(zone.name)}
                        onMouseLeave={() => handleZoneHover(null)}
                        style={{ opacity: dimmed ? 0.25 : 1 }}
                      >
                        <Tooltip>
                          <TooltipTrigger>
                            <rect
                              x={10 + zone.x}
                              y={22}
                              width={Math.max(zone.w - 1, 2)}
                              height={32}
                              rx={2}
                              fill={zone.color}
                              fillOpacity={0.85}
                            />
                          </TooltipTrigger>
                          <TooltipContent>{`${zone.name}: ${zone.count} 台设备`}</TooltipContent>
                        </Tooltip>
                        {zone.w > 40 && (
                          <>
                            <text
                              x={10 + zone.x + zone.w / 2}
                              y={36}
                              textAnchor="middle"
                              fill="#fff"
                              fontSize={9}
                              fontWeight={600}
                              className="pointer-events-none"
                              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                            >
                              {zone.name.length > 6 ? zone.name.slice(0, 6) + '..' : zone.name}
                            </text>
                            <text
                              x={10 + zone.x + zone.w / 2}
                              y={48}
                              textAnchor="middle"
                              fill="#fff"
                              fontSize={8}
                              fillOpacity={0.9}
                              className="pointer-events-none"
                              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                            >
                              {zone.count}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}

                  {/* Aircraft silhouette with zone overlays */}
                  <g transform="translate(0, 65)">
                    <text x={10} y={14} fill="#999" fontSize={10} fontWeight={600}>机体侧视图</text>

                    {/* Fuselage outline (background) */}
                    <g transform="translate(10, 22) scale(1.95, 1)">
                      <path d={FUSELAGE_PATH} fill="#f0f0f0" stroke="#d9d9d9" strokeWidth={1} />
                      <path d={TAIL_PATH} fill="#e8e8e8" stroke="#d9d9d9" strokeWidth={1} />
                      <path d={COCKPIT_PATH} fill="#e8e8e8" stroke="#d9d9d9" strokeWidth={1} />

                      {/* Zone color overlays on fuselage */}
                      {fuselageZoneSpans.map((zone) => {
                        const dimmed = hoveredZone !== null && hoveredZone !== zone.name;
                        return (
                          <rect
                            key={zone.name}
                            className="layout-fuse-overlay cursor-pointer"
                            x={zone.x}
                            y={39}
                            width={Math.max(zone.w, 1)}
                            height={10}
                            fill={zone.color}
                            fillOpacity={dimmed ? 0.1 : 0.6}
                            rx={1}
                            onMouseEnter={() => handleZoneHover(zone.name)}
                            onMouseLeave={() => handleZoneHover(null)}
                          />
                        );
                      })}
                    </g>
                  </g>

                  {/* Zone legend */}
                  <g transform="translate(10, 150)">
                    {sortedZones.slice(0, 10).map(([name], i) => {
                      const xPos = i * 68;
                      if (xPos > 660) return null;
                      return (
                        <g
                          key={name}
                          className="cursor-pointer"
                          onMouseEnter={() => handleZoneHover(name)}
                          onMouseLeave={() => handleZoneHover(null)}
                        >
                          <rect x={xPos} y={-2} width={8} height={8} rx={2} fill={ZONE_COLORS[i % ZONE_COLORS.length]} />
                          <text x={xPos + 11} y={6} fill="#666" fontSize={8}>{name.length > 5 ? name.slice(0, 5) + '..' : name}</text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </TooltipProvider>
            )}
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
            <CardTitle>区域设备密度</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBar items={zoneBarItems} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>安装方式分布</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBar items={installMethodItems} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>{`布局调整需求 (${adjustments.length})`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto">
              {adjustments.length === 0 ? (
                <div className="py-3 text-center text-xs text-muted-foreground">无调整需求</div>
              ) : (
                adjustments.map(e => (
                  <div
                    key={e.id}
                    className="mb-1 cursor-pointer rounded border border-amber-300 bg-amber-50 px-2 py-1.5 transition-colors hover:bg-amber-100"
                    onClick={() => onSelect(e)}
                  >
                    <div className="text-[11px] font-semibold text-foreground">
                      {e.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {e.config_data?.layout_adjustment}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
