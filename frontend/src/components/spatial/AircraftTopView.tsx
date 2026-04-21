import React from 'react';
import type { Equipment, Zone } from '../../types';
import { EquipmentMarker } from './EquipmentMarker';

interface Props {
  equipment: Equipment[];
  zones: Zone[];
  selectedId: string | null;
  onSelect: (equip: Equipment) => void;
}

const FUSELAGE_TOP_PATH = 'M 50,150 Q 0,150 30,140 L 200,120 L 600,110 L 800,110 L 1050,120 L 1150,145 Q 1160,150 1150,155 L 1050,180 L 800,190 L 600,190 L 200,180 L 30,160 Q 0,150 50,150 Z';

export function AircraftTopView({ equipment, zones, selectedId, onSelect }: Props) {
  return (
    <svg viewBox="-20 80 1250 140" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', background: '#fafafa' }}>
      {/* Centerline */}
      <line x1={0} y1={150} x2={1200} y2={150} stroke="#e0e0e0" strokeWidth={0.5} strokeDasharray="4,4" />

      {/* Fuselage top outline */}
      <path d={FUSELAGE_TOP_PATH} fill="none" stroke="#999" strokeWidth={2} />

      {/* BL labels */}
      <text x={-15} y={153} fontSize={8} fill="#999" fontFamily="monospace">BL0</text>

      {equipment.map(e => (
        <EquipmentMarker key={e.id} equipment={e} view="top" selected={e.id === selectedId} onClick={onSelect} />
      ))}
    </svg>
  );
}
