
import type { Equipment, Zone } from '../../types';
import { ZoneOverlay } from './ZoneOverlay';
import { EquipmentMarker } from './EquipmentMarker';

interface Props {
  equipment: Equipment[];
  zones: Zone[];
  selectedId: string | null;
  onSelect: (equip: Equipment) => void;
}

// Simplified CE-25A fuselage side profile SVG path
const FUSELAGE_PATH = 'M 50,150 Q 0,150 30,148 L 80,130 Q 120,110 200,105 L 400,100 L 800,100 Q 1000,100 1050,110 L 1100,130 Q 1150,145 1150,155 Q 1150,165 1100,180 L 1050,195 Q 1000,205 800,210 L 400,210 L 200,205 Q 120,200 80,185 L 30,165 Q 0,160 50,158 Z';

const STA_MARKS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200];

export function AircraftSideView({ equipment, zones, selectedId, onSelect }: Props) {
  return (
    <svg viewBox="-20 60 1250 260" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', background: '#fafafa' }}>
      {/* Zone overlays */}
      {zones.map(z => <ZoneOverlay key={z.id} zone={z} view="side" />)}

      {/* Fuselage outline */}
      <path d={FUSELAGE_PATH} fill="none" stroke="#999" strokeWidth={2} />

      {/* STA ruler */}
      {STA_MARKS.map(sta => (
        <g key={sta}>
          <line x1={sta} y1={215} x2={sta} y2={225} stroke="#ccc" strokeWidth={0.5} />
          <text x={sta} y={235} fontSize={8} fill="#999" textAnchor="middle" fontFamily="monospace">{sta}</text>
        </g>
      ))}
      <line x1={0} y1={220} x2={1200} y2={220} stroke="#ddd" strokeWidth={0.5} />

      {/* Equipment markers */}
      {equipment.map(e => (
        <EquipmentMarker key={e.id} equipment={e} view="side" selected={e.id === selectedId} onClick={onSelect} />
      ))}
    </svg>
  );
}
