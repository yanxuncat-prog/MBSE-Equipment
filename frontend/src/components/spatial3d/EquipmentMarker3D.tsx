import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Equipment } from '../../types';

// ATA chapter → color mapping
const ATA_COLORS: Record<string, string> = {
  '21': '#5ac8fa', '23': '#34c759', '24': '#ff9500', '25': '#ff375f',
  '26': '#af52de', '27': '#007aff', '28': '#ffcc00', '29': '#8e8e93',
  '30': '#ff6b6b', '31': '#30b0c7', '32': '#636366', '33': '#a2845e',
  '34': '#ff6b6b', '35': '#a2845e', '42': '#5856d6', '46': '#ff2d55',
  '86': '#ff3b30', '87': '#ff9500', '90': '#007aff', '92': '#34c759',
};

interface Props {
  equipment: Equipment;
  selected: boolean;
  onClick: (equip: Equipment) => void;
}

export function EquipmentMarker3D({ equipment, selected, onClick }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const cd = equipment.config_data;
  if (!cd || cd.sta == null) return null;

  // Map STA/BL/WL to 3D coordinates
  // X = STA (along fuselage), Y = BL (left-right), Z = WL (up-down)
  const x = cd.sta;
  const y = cd.bl || 0;
  const z = cd.wl || 160;

  const ataPrefix = equipment.ata_chapter?.slice(0, 2) || '99';
  const color = ATA_COLORS[ataPrefix] || '#8e8e93';
  const size = selected ? 2.5 : hovered ? 2.0 : 1.5;

  // Pulsing animation for selected equipment
  useFrame((state) => {
    if (meshRef.current && selected) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      meshRef.current.scale.setScalar(scale);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    onClick(equipment);
  }, [equipment, onClick]);

  return (
    <group position={[x, y, z]}>
      {/* Equipment sphere */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? color : hovered ? color : '#000000'}
          emissiveIntensity={selected ? 0.5 : hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Selection ring */}
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.5, 4.5, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover tooltip */}
      {(hovered || selected) && (
        <Html
          position={[0, 0, 5]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 11,
            whiteSpace: 'nowrap',
            border: `1px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontWeight: 600, color }}>{equipment.part_number}</div>
            <div>{equipment.name}</div>
            {equipment.config_data?.mass_kg != null && (
              <div style={{ color: '#aaa' }}>{equipment.config_data.mass_kg.toFixed(1)} kg</div>
            )}
          </div>
        </Html>
      )}

      {/* Drop line to floor (z=100, approximate bottom of fuselage) */}
      {(hovered || selected) && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0, 0, -(z - 100)]), 3]}
              count={2}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={color} transparent opacity={0.4} />
        </line>
      )}
    </group>
  );
}
