import React from 'react';
import type { Equipment } from '../../types';
import { EquipmentMarker } from './EquipmentMarker';

interface Props {
  equipment: Equipment[];
  staCurrent: number;
  selectedId: string | null;
  onSelect: (equip: Equipment) => void;
}

export function SectionView({ equipment, staCurrent, selectedId, onSelect }: Props) {
  // Filter equipment near the current STA (within +/-30)
  const nearby = equipment.filter(e => {
    const sta = e.installation?.sta;
    return sta != null && Math.abs(sta - staCurrent) <= 30;
  });

  return (
    <svg viewBox="0 60 300 260" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', background: '#fafafa' }}>
      {/* Section title */}
      <text x={150} y={80} fontSize={12} fill="#666" textAnchor="middle" fontFamily="monospace">截面 STA {staCurrent}</text>

      {/* Fuselage cross-section (ellipse) */}
      <ellipse cx={150} cy={160} rx={70} ry={90} fill="none" stroke="#999" strokeWidth={2} />

      {/* Floor line */}
      <line x1={85} y1={180} x2={215} y2={180} stroke="#ccc" strokeWidth={1} strokeDasharray="3,3" />
      <text x={220} y={183} fontSize={7} fill="#ccc">客舱地板</text>

      {/* Equipment markers in section view */}
      {nearby.map(e => (
        <EquipmentMarker key={e.id} equipment={e} view="section" selected={e.id === selectedId} onClick={onSelect} />
      ))}

      {/* Equipment count */}
      <text x={150} y={275} fontSize={10} fill="#999" textAnchor="middle">{nearby.length} 台设备在此截面附近</text>
    </svg>
  );
}
