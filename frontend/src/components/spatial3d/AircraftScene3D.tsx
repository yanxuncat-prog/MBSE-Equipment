import React, { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FuselageSTL } from './FuselageSTL';
import type { Equipment, Zone } from '../../types';

/**
 * CE-25A full aircraft from STEP:
 *   X: 150 ~ 19750 mm  (length ~19.6m)
 *   Y: -2147 ~ 4123 mm (span ~6.3m, origin offset)
 *   Z: -4083 ~ 11501 mm (height ~15.6m including vertical tail)
 *
 * Scale: 1 scene unit = 100mm (0.001 scale factor from mm)
 * This puts the aircraft at ~196 units long in scene space.
 */
const S = 0.01; // mm → scene units (1 unit = 100mm = 10cm)

// Model center approximations
const CX = 10000 * S; // ~100 (mid-fuselage)
const CY = 1000 * S;  // ~10 (Y offset due to asymmetric origin)
const CZ = 3000 * S;  // ~30 (approximate fuselage center Z)

const ATA_COLORS: Record<string, string> = {
  '21': '#5ac8fa', '23': '#34c759', '24': '#ff9500', '25': '#ff375f',
  '26': '#af52de', '27': '#007aff', '28': '#ffcc00', '29': '#8e8e93',
  '30': '#ff6b6b', '31': '#30b0c7', '32': '#636366', '33': '#a2845e',
  '34': '#ff6b6b', '35': '#a2845e', '42': '#5856d6', '46': '#ff2d55',
  '86': '#ff3b30', '87': '#ff9500', '90': '#007aff', '92': '#34c759',
};

// ------- Equipment Marker -------

function EquipMarker({ equipment, position, selected, onClick, size }: {
  equipment: Equipment;
  position: [number, number, number];
  selected: boolean;
  onClick: (e: Equipment) => void;
  size: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const ata = equipment.ata_chapter?.slice(0, 2) || '99';
  const color = ATA_COLORS[ata] || '#8e8e93';
  const r = selected ? size * 1.5 : hovered ? size * 1.2 : size;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(selected ? 1 + Math.sin(state.clock.elapsedTime * 3) * 0.25 : 1);
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
        <meshStandardMaterial color={color} emissive={selected || hovered ? color : '#000'} emissiveIntensity={selected ? 0.6 : hovered ? 0.3 : 0} />
      </mesh>
      {(hovered || selected) && (
        <Html position={[0, 0, r * 3]} center style={{ pointerEvents: 'none' }}>
          <div className="rounded-md border bg-popover/95 px-2 py-1.5 text-[10px] text-popover-foreground whitespace-nowrap"
            style={{ borderColor: color }}>
            <div className="font-semibold" style={{ color }}>{equipment.part_number}</div>
            <div>{equipment.name}</div>
            {equipment.weight_balance && <div className="text-muted-foreground">{equipment.weight_balance.mass_kg.toFixed(1)} kg</div>}
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

  // Map abstract equipment coords (STA 0-1100) → real STEP coords (X 150-19750)
  const staToX = (sta: number) => (150 + sta * ((19750 - 150) / 1100)) * S;
  const blToY = (bl: number) => (bl * 15) * S; // scale BL to approximate real Y range
  const wlToZ = (wl: number) => ((wl - 150) * 15) * S; // WL 150≈center, scale to Z

  const markerSize = 1.5; // scene units

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-3 rounded-md bg-background/95 px-2.5 py-1.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="show-equipment"
            checked={showEquipment}
            onCheckedChange={(checked) => setShowEquipment(checked === true)}
          />
          <Label htmlFor="show-equipment" className="text-xs cursor-pointer">设备标记</Label>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {positioned.length} 台 | 左键旋转 · 滚轮缩放 · 右键平移
        </span>
      </div>

      {/* Model info */}
      <div className="absolute top-2 right-2 z-10 rounded bg-black/75 px-2 py-1 text-[9px] text-neutral-400">
        CE-25A 完整模型 · 19.6m × 6.3m
      </div>

      {/* ATA legend */}
      <div className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-1.5 rounded-md bg-background/95 px-2 py-1.5 text-[9px] max-w-[450px]">
        {[
          ['23', '通信', '#34c759'], ['24', '电源', '#ff9500'], ['26', '防火', '#af52de'],
          ['27', '飞控', '#007aff'], ['31', '指示', '#30b0c7'], ['34', '导航', '#ff6b6b'],
          ['86', '电推进', '#ff3b30'], ['其他', '', '#8e8e93'],
        ].map(([a, n, c]) => (
          <span key={a} className="flex items-center gap-0.5">
            <span className="inline-block size-[7px] rounded-full" style={{ background: c }} />
            <span className="text-muted-foreground">{a}{n ? ` ${n}` : ''}</span>
          </span>
        ))}
      </div>

      <Canvas style={{ background: '#060a12' }}>
        <Suspense fallback={null}>
          <PerspectiveCamera
            makeDefault
            position={[CX, CY - 250, CZ + 150]}
            fov={50}
            near={0.1}
            far={10000}
          />
          <OrbitControls
            target={[CX, CY, CZ]}
            minDistance={20}
            maxDistance={3000}
            enableDamping
            dampingFactor={0.08}
          />

          {/* Lighting */}
          <ambientLight intensity={0.45} />
          <directionalLight position={[CX, CY - 300, CZ + 300]} intensity={0.8} />
          <directionalLight position={[CX, CY + 300, CZ + 100]} intensity={0.3} />
          <hemisphereLight args={['#b0d0ff', '#1a1a2e', 0.3]} />

          {/* Ground plane */}
          <Grid
            args={[400, 200]}
            position={[CX, CY, -45]}
            cellSize={10}
            cellThickness={0.3}
            cellColor="#121a28"
            sectionSize={50}
            sectionThickness={0.5}
            sectionColor="#1a2840"
            fadeDistance={3000}
            infiniteGrid={false}
          />

          {/* CE-25A full aircraft model */}
          <group scale={[S, S, S]}>
            <FuselageSTL />
          </group>

          {/* Equipment markers */}
          {showEquipment && positioned.map(equip => {
            const cd = equip.config_data!;
            return (
              <EquipMarker
                key={equip.id}
                equipment={equip}
                position={[staToX(cd.sta!), blToY(cd.bl || 0), wlToZ(cd.wl || 150)]}
                selected={equip.id === selectedId}
                onClick={onSelect}
                size={markerSize}
              />
            );
          })}
        </Suspense>
      </Canvas>
    </div>
  );
}
