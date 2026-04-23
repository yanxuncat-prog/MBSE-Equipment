import React, { useState } from 'react';
import type { Equipment } from '../../types';

const ATA_COLORS: Record<string, string> = {
  '21': '#5ac8fa', '23': '#34c759', '24': '#ff9500', '25': '#ff375f',
  '26': '#af52de', '27': '#007aff', '28': '#ffcc00', '29': '#8e8e93',
  '31': '#30b0c7', '34': '#ff6b6b', '35': '#a2845e', '49': '#636366',
};

interface Props {
  equipment: Equipment;
  view: 'side' | 'top' | 'section';
  selected: boolean;
  onClick: (equip: Equipment) => void;
}

export function EquipmentMarker({ equipment, view, selected, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const cd = equipment.config_data;
  if (!cd) return null;

  let cx: number, cy: number;
  if (view === 'side') {
    cx = cd.sta || 0;
    cy = 300 - (cd.wl || 150);
  } else if (view === 'top') {
    cx = cd.sta || 0;
    cy = 150 - (cd.bl || 0);
  } else {
    cx = 150 + (cd.bl || 0);
    cy = 300 - (cd.wl || 150);
  }

  const ataPrefix = equipment.ata_chapter.split('-')[0];
  const color = ATA_COLORS[ataPrefix] || '#8e8e93';
  const r = selected ? 8 : 5;

  return (
    <g
      onClick={() => onClick(equipment)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer"
    >
      {selected && (
        <circle cx={cx} cy={cy} r={12} fill="none" stroke={color} strokeWidth={2} opacity={0.5}>
          <animate attributeName="r" values="10;14;10" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={cx} cy={cy} r={r} fill={color} stroke="#fff" strokeWidth={1.5} />
      {hovered && (
        <g>
          <rect x={cx + 10} y={cy - 24} width={Math.max(equipment.part_number.length, equipment.name.length) * 7 + 12} height={32} rx={4} fill="rgba(0,0,0,0.85)" />
          <text x={cx + 16} y={cy - 10} fontSize={10} fill="#fff" fontFamily="monospace">{equipment.part_number}</text>
          <text x={cx + 16} y={cy + 2} fontSize={9} fill="#ccc">{equipment.name}</text>
        </g>
      )}
    </g>
  );
}
