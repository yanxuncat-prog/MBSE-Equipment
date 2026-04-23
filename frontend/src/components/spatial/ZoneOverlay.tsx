
import type { Zone } from '../../types';

const ZONE_COLORS: Record<string, string> = {
  '131': 'rgba(52, 199, 89, 0.12)',
  '132': 'rgba(90, 200, 250, 0.12)',
  '141': 'rgba(255, 149, 0, 0.12)',
  '142': 'rgba(255, 59, 48, 0.12)',
};

interface Props {
  zone: Zone;
  view: 'side' | 'top';
}

export function ZoneOverlay({ zone, view }: Props) {
  const x = zone.sta_from;
  const width = zone.sta_to - zone.sta_from;
  const y = view === 'side' ? (300 - (zone.wl_to || 220)) : (150 - (zone.bl_to || 50));
  const height = view === 'side'
    ? ((zone.wl_to || 220) - (zone.wl_from || 100))
    : ((zone.bl_to || 50) - (zone.bl_from || -50));

  const color = ZONE_COLORS[zone.zone_code] || 'rgba(128, 128, 128, 0.1)';

  return (
    <g>
      <rect x={x} y={y} width={width} height={Math.abs(height)} fill={color} stroke="none" />
      <text x={x + 5} y={y + 14} fontSize={10} fill="#999" fontFamily="monospace">
        Zone {zone.zone_code}
      </text>
    </g>
  );
}
