import React, { useMemo, useState, useCallback } from 'react';
import { Button, Card, Tooltip, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { StatsCard } from '../shared/StatsCard';
import { StatsRow } from '../shared/StatsRow';
import { ProfessionalTable } from '../shared/ProfessionalTable';
import { ProfessionalPanel } from '../shared/ProfessionalPanel';
import { HorizontalBar } from '../charts/HorizontalBar';
import type { Equipment, ValidationReport } from '../../../types';

const { Text } = Typography;

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
/* LayoutTab Component                                                 */
/* ------------------------------------------------------------------ */
export function LayoutTab({ equipment, onSelect }: Props) {
  const navigate = useNavigate();
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

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
  const columns: ColumnsType<Equipment> = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', fixed: 'left', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', fixed: 'left', width: 160, ellipsis: true },
    { title: '区域', key: 'zone', width: 100, render: (_, r) => r.config_data?.zone_name || '-' },
    { title: '机架位置', key: 'rack', width: 100, ellipsis: true, render: (_, r) => r.config_data?.rack_position || '-' },
    { title: 'STA', key: 'sta', width: 60, align: 'right', render: (_, r) => r.config_data?.sta?.toFixed(0) || '-' },
    { title: 'WL', key: 'wl', width: 60, align: 'right', render: (_, r) => r.config_data?.wl?.toFixed(0) || '-' },
    { title: 'BL', key: 'bl', width: 60, align: 'right', render: (_, r) => r.config_data?.bl?.toFixed(0) || '-' },
    { title: '尺寸(mm)', key: 'dimensions', width: 110, ellipsis: true, render: (_, r) => r.dimensions_mm || '-' },
    { title: '安装方式', key: 'install', width: 110, ellipsis: true, render: (_, r) => r.config_data?.install_method || '-' },
    { title: '布局调整需求', key: 'layout_adj', width: 150, ellipsis: true, render: (_, r) => r.config_data?.layout_adjustment || '-' },
    {
      title: '0号机设备', key: 'batch0', width: 80,
      render: (_, r) => r.config_data?.use_batch0_device === true ? '是' : r.config_data?.use_batch0_device === false ? '否' : '-',
    },
  ];

  /* ---- Banner ---- */
  const bannerColor = adjustments.length > 20 ? '#FF3B30' : adjustments.length > 5 ? '#FF9500' : '#34C759';
  const bannerBg = adjustments.length > 20 ? '#FFF1F0' : adjustments.length > 5 ? '#FFF7E6' : '#F6FFED';

  const handleZoneHover = useCallback((zone: string | null) => setHoveredZone(zone), []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
      <style>{`
        .layout-row-adjustment td { background: #fffbe6 !important; }
        .layout-zone-segment { transition: opacity 0.2s, filter 0.2s; cursor: pointer; }
        .layout-zone-segment:hover { filter: brightness(1.15); }
        .layout-fuse-overlay { transition: opacity 0.2s; }
      `}</style>

      <div style={{ flex: 1, overflow: 'auto', paddingRight: 16 }}>
        {/* Hook Banner */}
        <div style={{ padding: '10px 16px', borderRadius: 6, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, background: bannerBg, border: `1px solid ${bannerColor}33` }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: bannerColor, flexShrink: 0 }} />
          <Text style={{ fontSize: 13, color: '#333' }}>
            {densestZone.name} 区域{' '}
            <span style={{ color: '#1E40AF', fontWeight: 700 }}>{densestZone.count} 台</span>设备，全机密度最高。
            <span style={{ color: '#FF9500', fontWeight: 700 }}>{adjustments.length} 台</span>设备有布局调整需求。
          </Text>
        </div>

        {/* Stats Row */}
        <StatsRow>
          <StatsCard title="安装区域" value={uniqueZones} color="#007aff" />
          <StatsCard title={`最密集: ${densestZone.name}`} value={densestZone.count} suffix="台" color="#FF9500" />
          <StatsCard title="需布局调整" value={adjustments.length} color="#FF3B30" />
        </StatsRow>

        {/* Zone Density Visualization */}
        <Card size="small" title="区域设备密度分布" style={{ marginBottom: 16 }} bodyStyle={{ padding: 12 }}>
          <svg width={700} height={170} viewBox="0 0 700 170" style={{ display: 'block', width: '100%' }}>
            {/* Zone Density Bar */}
            <text x={10} y={14} fill="#999" fontSize={10} fontWeight={600}>区域密度条</text>
            {zoneDensityBarData.map((zone, i) => {
              const dimmed = hoveredZone !== null && hoveredZone !== zone.name;
              return (
                <g
                  key={zone.name}
                  className="layout-zone-segment"
                  onMouseEnter={() => handleZoneHover(zone.name)}
                  onMouseLeave={() => handleZoneHover(null)}
                  style={{ opacity: dimmed ? 0.25 : 1 }}
                >
                  <Tooltip title={`${zone.name}: ${zone.count} 台设备`}>
                    <rect
                      x={10 + zone.x}
                      y={22}
                      width={Math.max(zone.w - 1, 2)}
                      height={32}
                      rx={2}
                      fill={zone.color}
                      fillOpacity={0.85}
                    />
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
                        style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
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
                        style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
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
                {fuselageZoneSpans.map((zone, i) => {
                  const dimmed = hoveredZone !== null && hoveredZone !== zone.name;
                  return (
                    <rect
                      key={zone.name}
                      className="layout-fuse-overlay"
                      x={zone.x}
                      y={39}
                      width={Math.max(zone.w, 1)}
                      height={10}
                      fill={zone.color}
                      fillOpacity={dimmed ? 0.1 : 0.6}
                      rx={1}
                      onMouseEnter={() => handleZoneHover(zone.name)}
                      onMouseLeave={() => handleZoneHover(null)}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                })}
              </g>
            </g>

            {/* Zone legend */}
            <g transform="translate(10, 150)">
              {sortedZones.slice(0, 10).map(([name, count], i) => {
                const xPos = i * 68;
                if (xPos > 660) return null;
                return (
                  <g
                    key={name}
                    style={{ cursor: 'pointer' }}
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
        </Card>

        {/* Professional Table */}
        <ProfessionalTable
          columns={columns}
          data={equipment}
          onRowClick={onSelect}
          scrollX={1200}
          rowClassName={(record) =>
            record.config_data?.layout_adjustment != null && record.config_data.layout_adjustment !== ''
              ? 'layout-row-adjustment' : ''
          }
        />
      </div>

      {/* Right Panel */}
      <ProfessionalPanel>
        <Card size="small" title="区域设备密度">
          <HorizontalBar items={zoneBarItems} />
        </Card>
        <Card size="small" title="安装方式分布">
          <HorizontalBar items={installMethodItems} />
        </Card>
        <Card size="small" bodyStyle={{ padding: '12px 16px' }}>
          <Button
            type="primary"
            block
            size="large"
            onClick={() => navigate('/spatial')}
            style={{ background: '#1E40AF', borderColor: '#1E40AF', fontWeight: 600 }}
          >
            打开 3D 空间视图 →
          </Button>
        </Card>
        <Card size="small" title={`布局调整需求 (${adjustments.length})`}>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {adjustments.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#ccc', fontSize: 12, padding: 12 }}>无调整需求</div>
            ) : (
              adjustments.map(e => (
                <div
                  key={e.id}
                  style={{
                    padding: '6px 8px', marginBottom: 4, borderRadius: 4,
                    background: '#FFFBE6', border: '1px solid #ffe58f', cursor: 'pointer',
                  }}
                  onClick={() => onSelect(e)}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#333', marginBottom: 2 }}>
                    {e.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#666' }}>
                    {e.config_data?.layout_adjustment}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
