import React, { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Checkbox, Space, Typography } from 'antd';
import { FuselageSTL } from './FuselageSTL';
import type { Equipment, Zone } from '../../types';

const { Text } = Typography;

const SCALE = 0.1; // 1 scene unit = 10mm

const ATA_COLORS: Record<string, string> = {
  '21': '#5ac8fa', '23': '#34c759', '24': '#ff9500', '25': '#ff375f',
  '26': '#af52de', '27': '#007aff', '28': '#ffcc00', '29': '#8e8e93',
  '30': '#ff6b6b', '31': '#30b0c7', '32': '#636366', '33': '#a2845e',
  '34': '#ff6b6b', '35': '#a2845e', '42': '#5856d6', '46': '#ff2d55',
  '86': '#ff3b30', '87': '#ff9500', '90': '#007aff', '92': '#34c759',
};

// ------- Equipment Marker (inline to avoid circular/import issues) -------

function EquipMarker({ equipment, position, selected, onClick, markerSize }: {
  equipment: Equipment;
  position: [number, number, number];
  selected: boolean;
  onClick: (e: Equipment) => void;
  markerSize: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const ataPrefix = equipment.ata_chapter?.slice(0, 2) || '99';
  const color = ATA_COLORS[ataPrefix] || '#8e8e93';
  const r = selected ? markerSize * 1.5 : hovered ? markerSize * 1.2 : markerSize;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(selected ? 1 + Math.sin(state.clock.elapsedTime * 3) * 0.3 : 1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(equipment); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[r, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={selected || hovered ? color : '#000'}
          emissiveIntensity={selected ? 0.5 : hovered ? 0.3 : 0}
        />
      </mesh>
      {(hovered || selected) && (
        <Html position={[0, 0, r * 3]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.88)', color: '#fff', padding: '5px 8px',
            borderRadius: 5, fontSize: 10, whiteSpace: 'nowrap',
            border: `1px solid ${color}`,
          }}>
            <div style={{ fontWeight: 600, color }}>{equipment.part_number}</div>
            <div>{equipment.name}</div>
            {equipment.weight_balance && <div style={{ color: '#aaa' }}>{equipment.weight_balance.mass_kg.toFixed(1)} kg</div>}
          </div>
        </Html>
      )}
    </group>
  );
}

// ------- Main Scene -------

interface Props {
  equipment: Equipment[];
  zones: Zone[];
  selectedId: string | null;
  onSelect: (equip: Equipment) => void;
}

export function AircraftScene3D({ equipment, zones, selectedId, onSelect }: Props) {
  const [showEquipment, setShowEquipment] = useState(true);

  const positioned = equipment.filter(e => e.config_data?.sta != null);
  const centerX = 9500 * SCALE;

  // Map abstract equipment coords → real fuselage coords (scaled)
  const staScale = (18900 - 150) / 1100;
  const markerSize = SCALE * 60;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Controls */}
      <div style={{
        position: 'absolute', top: 8, left: 8, zIndex: 10,
        background: 'rgba(255,255,255,0.92)', padding: '6px 10px',
        borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}>
        <Space size={12}>
          <Checkbox checked={showEquipment} onChange={e => setShowEquipment(e.target.checked)}>设备</Checkbox>
          <Text type="secondary" style={{ fontSize: 10 }}>
            {positioned.length} 台 | 左键旋转 · 滚轮缩放 · 右键平移
          </Text>
        </Space>
      </div>

      {/* Info badge */}
      <div style={{
        position: 'absolute', top: 8, right: 8, zIndex: 10,
        background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: 4,
        fontSize: 9, color: '#888',
      }}>
        CE-25A Fuselage · 18.75m
      </div>

      <Canvas style={{ background: '#080c14' }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[centerX - 300, -500, 350]} fov={45} near={1} far={10000} />
          <OrbitControls target={[centerX, 0, 0]} minDistance={50} maxDistance={4000} enableDamping dampingFactor={0.08} />

          <ambientLight intensity={0.5} />
          <directionalLight position={[centerX, -400, 500]} intensity={0.8} />
          <directionalLight position={[centerX, 400, 200]} intensity={0.3} />

          <Grid
            args={[2500, 500]}
            position={[centerX, 0, -110]}
            cellSize={50}
            cellThickness={0.3}
            cellColor="#151e2a"
            sectionSize={200}
            sectionThickness={0.6}
            sectionColor="#1e2e3e"
            fadeDistance={5000}
            infiniteGrid={false}
          />

          {/* Real fuselage model */}
          <group scale={[SCALE, SCALE, SCALE]}>
            <FuselageSTL />
          </group>

          {/* Equipment markers */}
          {showEquipment && positioned.map(equip => {
            const cd = equip.config_data!;
            const x = (150 + (cd.sta || 500) * staScale) * SCALE;
            const y = (cd.bl || 0) * 40 * SCALE;
            const z = ((cd.wl || 170) - 170) * 10 * SCALE;
            return (
              <EquipMarker
                key={equip.id}
                equipment={equip}
                position={[x, y, z]}
                selected={equip.id === selectedId}
                onClick={onSelect}
                markerSize={markerSize}
              />
            );
          })}
        </Suspense>
      </Canvas>
    </div>
  );
}
