import { useState, useMemo } from 'react';
import { EquipmentTable } from '../../equipment/EquipmentTable';
import { cn } from '@/lib/utils';
import type { Equipment, ValidationReport } from '../../../types';

interface Props {
  configId: string | null;
  search: string;
  report: ValidationReport | null;
  onEdit: (equip: Equipment) => void;
  onSelect: (equip: Equipment) => void;
  allEquipment?: Equipment[];
}

/* ── Visual Equipment Preview ── */
function EquipmentVisualPreview({ equipment, allEquipment }: { equipment: Equipment; allEquipment: Equipment[] }) {
  const e = equipment;

  // Compute contextual metrics
  const metrics = useMemo(() => {
    const weights = allEquipment.map(eq => (eq.config_data?.mass_kg) ?? 0).filter(w => w > 0).sort((a, b) => a - b);
    const myWeight = (e.config_data?.mass_kg) ?? 0;
    const weightRank = myWeight > 0 ? weights.filter(w => w <= myWeight).length / weights.length : 0;

    // Power share within same voltage group
    const myVoltage = e.power_voltage || '';
    const sameVoltageTotal = allEquipment
      .filter(eq => eq.power_voltage === myVoltage && eq.config_data?.power_kva_normal)
      .reduce((s, eq) => s + (eq.config_data?.power_kva_normal ?? 0), 0);
    const myPower = e.config_data?.power_kva_normal ?? 0;
    const powerShare = sameVoltageTotal > 0 ? myPower / sameVoltageTotal : 0;

    // Data completeness per dimension (for radar)
    const weightFields = [e.config_data?.mass_kg, e.dimensions_mm];
    const layoutFields = [e.config_data?.sta, e.config_data?.bl, e.config_data?.wl, e.config_data?.install_method];
    const elecFields = [e.power_voltage, e.config_data?.power_kva_normal, e.power_redundancy, e.is_electrical];
    const envFields: any[] = [];  // DO-160 fields moved to do160_records

    const completeness = (fields: any[]) => fields.filter(f => f != null && f !== '' && f !== undefined).length / fields.length;

    return {
      weightRank,
      myWeight,
      powerShare,
      myPower,
      myVoltage,
      sameVoltageTotal,
      radar: {
        weight: completeness(weightFields),
        layout: completeness(layoutFields),
        electrical: completeness(elecFields),
        environment: completeness(envFields),
      },
    };
  }, [e, allEquipment]);

  // STA position on aircraft (0-21000mm)
  const sta = e.config_data?.sta ?? 0;
  const staPct = Math.min(100, Math.max(0, (sta / 21000) * 100));

  // Radar chart points
  const radarSize = 80;
  const radarCx = radarSize, radarCy = radarSize;
  const radarR = radarSize * 0.7;
  const axes = [
    { label: '重量', angle: -Math.PI / 2, value: metrics.radar.weight },
    { label: '布置', angle: 0, value: metrics.radar.layout },
    { label: '电气', angle: Math.PI / 2, value: metrics.radar.electrical },
    { label: '环境', angle: Math.PI, value: metrics.radar.environment },
  ];

  const radarPoints = axes.map(a => ({
    x: radarCx + Math.cos(a.angle) * radarR * a.value,
    y: radarCy + Math.sin(a.angle) * radarR * a.value,
  }));
  const radarPath = radarPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join('') + 'Z';

  const gridPoints = (scale: number) => axes.map(a => ({
    x: radarCx + Math.cos(a.angle) * radarR * scale,
    y: radarCy + Math.sin(a.angle) * radarR * scale,
  }));
  const gridPath = (scale: number) => {
    const pts = gridPoints(scale);
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join('') + 'Z';
  };

  // Status dots
  const statuses = [
    { label: '搭接', value: e.bonding_type || null, color: e.bonding_type ? 'bg-chart-1' : 'bg-muted' },
    { label: 'EICD', value: e.has_eicd, color: e.has_eicd === true ? 'bg-status-ok' : e.has_eicd === false ? 'bg-status-danger' : 'bg-muted' },
    { label: '选装', value: e.config_data?.is_optional, color: e.config_data?.is_optional === true ? 'bg-status-warn' : e.config_data?.is_optional === false ? 'bg-status-ok' : 'bg-muted' },
  ];

  const displayVal = (v: any) => {
    if (v === true) return '是';
    if (v === false) return '否';
    if (v == null || v === '') return '-';
    return String(v);
  };

  return (
    <div className="space-y-4 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold truncate">{e.name}</h3>
        <p className="text-xs text-muted-foreground truncate">{e.part_number} · ATA-{e.ata_chapter}</p>
      </div>

      {/* Radar chart: data completeness */}
      <div className="flex justify-center">
        <svg width={radarSize * 2} height={radarSize * 2} viewBox={`0 0 ${radarSize * 2} ${radarSize * 2}`}>
          {/* Grid */}
          {[0.25, 0.5, 0.75, 1].map(s => (
            <path key={s} d={gridPath(s)} fill="none" stroke="var(--border)" strokeWidth={0.5} opacity={0.5} />
          ))}
          {/* Axes */}
          {axes.map((a, i) => (
            <line key={i} x1={radarCx} y1={radarCy}
              x2={radarCx + Math.cos(a.angle) * radarR}
              y2={radarCy + Math.sin(a.angle) * radarR}
              stroke="var(--border)" strokeWidth={0.5} />
          ))}
          {/* Data area */}
          <path d={radarPath} fill="var(--chart-1)" fillOpacity={0.15} stroke="var(--chart-1)" strokeWidth={1.5} />
          {/* Points */}
          {radarPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--chart-1)" />
          ))}
          {/* Labels */}
          {axes.map((a, i) => {
            const lx = radarCx + Math.cos(a.angle) * (radarR + 14);
            const ly = radarCy + Math.sin(a.angle) * (radarR + 14);
            return (
              <text key={i} x={lx} y={ly + 3} textAnchor="middle" fill="var(--muted-foreground)" fontSize={9}>
                {a.label}
              </text>
            );
          })}
        </svg>
      </div>
      <p className="text-center text-xs text-muted-foreground -mt-2">数据完整度</p>

      {/* Weight percentile bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">重量</span>
          <span className="font-medium tabular-nums">{metrics.myWeight > 0 ? `${metrics.myWeight.toFixed(2)} kg` : '-'}</span>
        </div>
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-chart-1" style={{ width: `${metrics.weightRank * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {metrics.myWeight > 0 ? `超过 ${(metrics.weightRank * 100).toFixed(0)}% 的设备` : '无重量数据'}
        </p>
      </div>

      {/* STA position ruler */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">纵向位置</span>
          <span className="font-medium tabular-nums">{sta > 0 ? `STA ${sta.toFixed(0)}` : '-'}</span>
        </div>
        {sta > 0 ? (
          <>
            <div className="relative h-2 rounded-full bg-muted">
              <div className="absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-chart-1 border-2 border-background"
                style={{ left: `${staPct}%`, transform: `translate(-50%, -50%)` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
              <span>机头</span><span>前机身</span><span>中机身</span><span>后机身</span><span>尾段</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">无位置数据</p>
        )}
      </div>

      {/* Power share bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">功耗占比 ({metrics.myVoltage || '-'}V)</span>
          <span className="font-medium tabular-nums">{metrics.myPower > 0 ? `${metrics.myPower.toFixed(3)} kW` : '-'}</span>
        </div>
        {metrics.myPower > 0 ? (
          <>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-chart-4" style={{ width: `${Math.max(1, metrics.powerShare * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              占{metrics.myVoltage}V系统 {(metrics.powerShare * 100).toFixed(1)}%
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">无电气数据</p>
        )}
      </div>

      {/* Status dots */}
      <div className="space-y-1.5">
        {statuses.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div className={cn("size-2.5 rounded-full shrink-0", s.color)} />
            <span className="text-xs text-muted-foreground w-10">{s.label}</span>
            <span className="text-xs font-medium">{displayVal(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function OverviewTab({ configId, search, onEdit, onSelect, allEquipment: allEquipProp }: Props) {
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  const allEquipment = allEquipProp || [];

  const handleSelect = (e: Equipment) => {
    setSelectedEquip(e);
    onSelect(e);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-160px)]">
      <div className="flex-1 overflow-auto">
        <EquipmentTable
          configId={configId} search={search} onEdit={onEdit} onSelect={handleSelect}
        />
      </div>
      <div className="w-[240px] shrink-0 overflow-hidden rounded-lg border bg-card p-3">
        {selectedEquip ? (
          <EquipmentVisualPreview equipment={selectedEquip} allEquipment={allEquipment} />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            点击设备行查看预览
          </div>
        )}
      </div>
    </div>
  );
}
