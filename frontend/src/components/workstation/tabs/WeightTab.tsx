import React, { useMemo, useState, useCallback } from 'react';
import { Card, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StatsCard } from '../shared/StatsCard';
import { StatsRow } from '../shared/StatsRow';
import { ProfessionalTable } from '../shared/ProfessionalTable';
import { ProfessionalPanel } from '../shared/ProfessionalPanel';
import { CGEnvelopeChart } from '../../charts/CGEnvelopeChart';
import { HorizontalBar } from '../charts/HorizontalBar';
import type { Equipment, ValidationReport } from '../../../types';

const { Text } = Typography;

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

const STATUS_TAGS: Record<string, { color: string; text: string }> = {
  approved: { color: 'green', text: '已批准' },
  in_development: { color: 'blue', text: '在研' },
  qualifying: { color: 'orange', text: '鉴定中' },
  discontinued: { color: 'red', text: '停产' },
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

function squarify(
  items: { label: string; value: number; color: string; hasMissing: boolean }[],
  x: number, y: number, w: number, h: number,
): TreemapRect[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, i) => s + i.value, 0);
  if (total === 0) return [];
  const largestLabel = sorted[0].label;

  const rects: TreemapRect[] = [];
  let cx = x, cy = y, cw = w, ch = h;

  for (const item of sorted) {
    const ratio = item.value / total;
    const isVerticalSlice = cw >= ch;
    const rw = isVerticalSlice ? cw * ratio : cw;
    const rh = isVerticalSlice ? ch : ch * ratio;

    // Ensure minimum size
    const finalW = Math.max(rw, 2);
    const finalH = Math.max(rh, 2);

    rects.push({
      label: item.label,
      value: item.value,
      x: cx,
      y: cy,
      w: finalW,
      h: finalH,
      color: item.color,
      isLargest: item.label === largestLabel,
      hasMissing: item.hasMissing,
    });

    if (isVerticalSlice) {
      cx += finalW;
      cw -= finalW;
    } else {
      cy += finalH;
      ch -= finalH;
    }
  }
  return rects;
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

  const columns: ColumnsType<Equipment> = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', fixed: 'left', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', fixed: 'left', width: 160, ellipsis: true },
    { title: 'ATA', dataIndex: 'ata_chapter', key: 'ata_chapter', width: 55 },
    {
      title: '重量(kg)', key: 'mass_kg', width: 80, align: 'right', defaultSortOrder: 'descend',
      sorter: (a, b) => (a.weight_balance?.mass_kg ?? 0) - (b.weight_balance?.mass_kg ?? 0),
      render: (_, r) => r.weight_balance?.mass_kg?.toFixed(1) || <span style={{ color: '#ccc' }}>-</span>,
    },
    {
      title: 'STA(力臂)', key: 'sta', width: 70, align: 'right',
      render: (_, r) => r.config_data?.sta?.toFixed(0) || '-',
    },
    {
      title: '力矩(kg\u00B7mm)', key: 'moment', width: 110, align: 'right',
      render: (_, r) => {
        const mass = r.weight_balance?.mass_kg;
        const sta = r.config_data?.sta;
        if (mass != null && sta != null) return (mass * sta).toLocaleString('zh-CN', { maximumFractionDigits: 0 });
        return '-';
      },
    },
    { title: '区域', key: 'zone', width: 100, render: (_, r) => r.config_data?.zone_name || '-' },
    { title: '供应商', key: 'supplier', width: 100, ellipsis: true, render: (_, r) => r.supplier_name || '-' },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 70,
      render: (s: string) => {
        const cfg = STATUS_TAGS[s] || { color: 'default', text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
  ];

  const handleMouseEnter = useCallback((label: string) => setHoveredAta(label), []);
  const handleMouseLeave = useCallback(() => setHoveredAta(null), []);

  /* Banner severity */
  const bannerColor = missingCount > 20 ? '#FF3B30' : missingCount > 5 ? '#FF9500' : '#34C759';
  const bannerBg = missingCount > 20 ? '#FFF1F0' : missingCount > 5 ? '#FFF7E6' : '#F6FFED';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
      <style>{`
        .wt-treemap-rect { transition: opacity 0.2s, stroke-width 0.2s; cursor: pointer; }
        .wt-treemap-rect:hover { stroke: #1E40AF !important; stroke-width: 3 !important; }
        .wt-banner { padding: 10px 16px; border-radius: 6px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        @keyframes wt-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

      <div style={{ flex: 1, overflow: 'auto', paddingRight: 16 }}>
        {/* Hook Banner */}
        <div className="wt-banner" style={{ background: bannerBg, border: `1px solid ${bannerColor}33` }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: bannerColor, flexShrink: 0 }} />
          <Text style={{ fontSize: 13, color: '#333' }}>
            <strong>CE-25A</strong> 当前总重{' '}
            <span style={{ color: '#1E40AF', fontWeight: 700 }}>{totalMass.toFixed(1)} kg</span>
            ，CG <span style={{ color: cgColor, fontWeight: 700 }}>{cgPctMac.toFixed(1)}% MAC</span>
            。{missingCount > 0 && (
              <span style={{ color: '#FF9500' }}>
                {missingCount} 台设备缺重量数据。
              </span>
            )}
          </Text>
        </div>

        {/* Stats Row */}
        <StatsRow>
          <StatsCard title="总重量" value={totalMass.toFixed(1)} suffix="kg" color="#1E40AF" />
          <StatsCard title="CG 位置" value={cgPctMac.toFixed(1)} suffix="% MAC" color={cgColor} />
          <StatsCard title="MTOW 余量" value={mtowMarginKg.toFixed(1)} suffix="kg" color="#3B82F6" />
          <StatsCard title="缺重量数据" value={missingCount} color="#FF9500" />
        </StatsRow>

        {/* Treemap Visualization */}
        <Card size="small" title="重量分布图 (按ATA章节)" style={{ marginBottom: 16 }} bodyStyle={{ padding: 8 }}>
          <svg width={700} height={304} viewBox="0 0 700 304" style={{ display: 'block', width: '100%' }}>
            <defs>
              <pattern id="wt-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#999" strokeWidth="1" strokeOpacity="0.4" />
              </pattern>
            </defs>
            {treemapRects.map((rect, i) => {
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 4px 0', borderTop: '1px solid #f0f0f0', marginTop: 4 }}>
            {ataGroups.slice(0, 12).map((g, i) => (
              <Tooltip key={g.label} title={`ATA-${g.label}: ${g.totalWeight.toFixed(0)} kg (${g.count} 台${g.missingCount > 0 ? `, ${g.missingCount} 台缺数据` : ''})`}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '2px 6px',
                    borderRadius: 3, background: hoveredAta === g.label ? '#E0F2FE' : 'transparent',
                  }}
                  onMouseEnter={() => handleMouseEnter(g.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: g.hasMissing ? '#ccc' : g.color }} />
                  <span style={{ fontSize: 10, color: '#666' }}>ATA-{g.label}</span>
                </div>
              </Tooltip>
            ))}
          </div>
        </Card>

        {/* Professional Table */}
        <ProfessionalTable columns={columns} data={sortedEquipment} onRowClick={onSelect} scrollX={1100} />
      </div>

      {/* Right Panel */}
      <ProfessionalPanel>
        <Card size="small" title="CG 包线图">
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
        </Card>
        <Card size="small" title="按ATA重量分布 (Top 8)">
          <HorizontalBar items={ataBarItems} />
        </Card>
        <Card size="small" title="按区域重量分布">
          <HorizontalBar items={zoneBarItems} />
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
