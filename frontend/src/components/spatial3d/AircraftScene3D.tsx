import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import { Checkbox, Space, Typography, Spin } from 'antd';
import { FuselageSTL } from './FuselageSTL';
import { EquipmentMarker3D } from './EquipmentMarker3D';
import { ZonePlanes } from './ZonePlanes';
import { StaRuler } from './StaRuler';
import type { Equipment, Zone } from '../../types';

const { Text } = Typography;

/**
 * Real fuselage from STEP file:
 *   X: 150 ~ 18900 mm (STA)
 *   Y: -1178 ~ 1255 mm (BL)
 *   Z: -991 ~ 991 mm (WL)
 *   Length: ~18750 mm, Width: ~2433 mm, Height: ~1983 mm
 *
 * We scale everything down by /10 so the scene is in "scene units" where 1 unit = 10mm.
 * This keeps Three.js camera/lighting in a reasonable numeric range.
 */
const SCALE = 0.1; // 1 scene unit = 10mm

interface Props {
  equipment: Equipment[];
  zones: Zone[];
  selectedId: string | null;
  onSelect: (equip: Equipment) => void;
}

function LoadingFallback() {
  return (
    <mesh position={[950, 0, 0]}>
      <boxGeometry args={[100, 20, 20]} />
      <meshBasicMaterial color="#334" wireframe />
    </mesh>
  );
}

export function AircraftScene3D({ equipment, zones, selectedId, onSelect }: Props) {
  const [showZones, setShowZones] = useState(true);
  const [showEquipment, setShowEquipment] = useState(true);

  const positioned = equipment.filter(e => e.config_data?.sta != null);

  // Fuselage center in scene coords
  const centerX = 9500 * SCALE; // ~950
  const centerY = 0;
  const centerZ = 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Controls overlay */}
      <div style={{
        position: 'absolute', top: 8, left: 8, zIndex: 10,
        background: 'rgba(255,255,255,0.92)', padding: '8px 12px',
        borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}>
        <Space size={16}>
          <Checkbox checked={showEquipment} onChange={e => setShowEquipment(e.target.checked)}>设备标记</Checkbox>
          <Checkbox checked={showZones} onChange={e => setShowZones(e.target.checked)}>区域标注</Checkbox>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {positioned.length} 台设备 | 左键旋转 · 滚轮缩放 · 右键平移
          </Text>
        </Space>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8, zIndex: 10,
        background: 'rgba(255,255,255,0.92)', padding: '6px 10px',
        borderRadius: 6, fontSize: 10, display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 500,
      }}>
        {[
          ['23', '通信', '#34c759'], ['24', '电源', '#ff9500'], ['26', '防火', '#af52de'],
          ['27', '飞控', '#007aff'], ['31', '指示', '#30b0c7'], ['34', '导航', '#ff6b6b'],
          ['86', '电推进', '#ff3b30'], ['其他', '', '#8e8e93'],
        ].map(([ata, name, color]) => (
          <span key={ata} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ color: '#666' }}>{ata}{name ? ` ${name}` : ''}</span>
          </span>
        ))}
      </div>

      {/* Model info */}
      <div style={{
        position: 'absolute', top: 8, right: 8, zIndex: 10,
        background: 'rgba(0,0,0,0.7)', padding: '6px 10px', borderRadius: 6,
        fontSize: 10, color: '#aaa',
      }}>
        CE-25A Fuselage (STEP) | 18.75m × 2.4m × 2.0m
      </div>

      <Canvas style={{ background: '#080c14' }}>
        <Suspense fallback={<LoadingFallback />}>
          {/* Camera — positioned for 3/4 view of full fuselage */}
          <PerspectiveCamera
            makeDefault
            position={[centerX - 400, -600, 400]}
            fov={45}
            near={1}
            far={10000}
          />
          <OrbitControls
            target={[centerX, centerY, centerZ]}
            minDistance={100}
            maxDistance={5000}
            enableDamping
            dampingFactor={0.08}
          />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[centerX, -500, 500]} intensity={0.8} castShadow />
          <directionalLight position={[centerX, 500, 200]} intensity={0.3} />
          <pointLight position={[200 * SCALE, 0, 300]} intensity={0.4} color="#5ac8fa" distance={2000} />
          <pointLight position={[1500 * SCALE, 0, 300]} intensity={0.4} color="#ff9500" distance={2000} />

          {/* Ground grid — aligned to fuselage */}
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

          {/* REAL fuselage from STEP → STL, scaled to scene */}
          <group scale={[SCALE, SCALE, SCALE]}>
            <FuselageSTL />
          </group>

          {/* Equipment markers — need to scale STA/BL/WL coords to scene units */}
          {showEquipment && positioned.map(equip => {
            const cd = equip.config_data!;
            // Equipment coords are in our abstract system (STA 0-1100, BL -30~30, WL 100-300)
            // Map to real fuselage coords:
            // STA: our 0-1100 maps approximately to STEP X 150-18900 (scale by ~17)
            // BL: our -30~30 maps to STEP Y -1178~1255 (scale by ~40)
            // WL: our 100-300 maps to STEP Z -991~991 (need offset and scale)
            const staScale = (18900 - 150) / 1100;
            const x = (150 + (cd.sta || 500) * staScale) * SCALE;
            const y = (cd.bl || 0) * 40 * SCALE;
            const z = ((cd.wl || 170) - 170) * 10 * SCALE; // WL 170 = center Z=0

            return (
              <EquipmentMarker3DScaled
                key={equip.id}
                equipment={equip}
                position={[x, y, z]}
                selected={equip.id === selectedId}
                onClick={onSelect}
                markerScale={SCALE * 80}
              />
            );
          })}
        </Suspense>
      </Canvas>
    </div>
  );
}

/**
 * Simplified equipment marker that takes pre-calculated position.
 */
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const ATA_COLORS: Record<string, string> = {
  '21': '#5ac8fa', '23': '#34c759', '24': '#ff9500', '25': '#ff375f',
  '26': '#af52de', '27': '#007aff', '28': '#ffcc00', '29': '#8e8e93',
  '30': '#ff6b6b', '31': '#30b0c7', '32': '#636366', '33': '#a2845e',
  '34': '#ff6b6b', '35': '#a2845e', '42': '#5856d6', '46': '#ff2d55',
  '86': '#ff3b30', '87': '#ff9500', '90': '#007aff', '92': '#34c759',
};

function EquipmentMarker3DScaled({ equipment, position, selected, onClick, markerScale }: {
  equipment: Equipment;
  position: [number, number, number];
  selected: boolean;
  onClick: (e: Equipment) => void;
  markerScale: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const ataPrefix = equipment.ata_chapter?.slice(0, 2) || '99';
  const color = ATA_COLORS[ataPrefix] || '#8e8e93';
  const size = selected ? markerScale * 1.5 : hovered ? markerScale * 1.2 : markerScale;

  useFrame((state) => {
    if (meshRef.current && selected) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.3);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
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
        <sphereGeometry args={[size, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={selected || hovered ? color : '#000'}
          emissiveIntensity={selected ? 0.5 : hovered ? 0.3 : 0}
        />
      </mesh>

      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.8, size * 2.2, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {(hovered || selected) && (
        <Html position={[0, 0, size * 3]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.88)', color: '#fff', padding: '6px 10px',
            borderRadius: 6, fontSize: 11, whiteSpace: 'nowrap',
            border: `1px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
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
