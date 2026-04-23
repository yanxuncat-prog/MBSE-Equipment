
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { Zone } from '../../types';

const ZONE_COLORS: Record<string, string> = {
  '100': '#34c759',
  '110': '#5ac8fa',
  '120': '#ff9500',
  '130': '#007aff',
  '140': '#af52de',
  '150': '#ff6b6b',
  '200': '#ffcc00',
  '300': '#ff3b30',
  '400': '#636366',
  '999': '#999999',
};

interface Props {
  zones: Zone[];
  visible: boolean;
}

/**
 * Semi-transparent zone planes on the "floor" of the fuselage (Z ≈ 130)
 * to show where each zone spans along the fuselage.
 */
export function ZonePlanes({ zones, visible }: Props) {
  if (!visible) return null;

  return (
    <group>
      {zones.map((zone) => {
        const color = ZONE_COLORS[zone.zone_code] || '#888888';
        const staLen = zone.sta_to - zone.sta_from;
        const blWidth = 8; // thin strip on each side
        const x = zone.sta_from + staLen / 2;
        const z = 130; // floor level

        return (
          <group key={zone.id}>
            {/* Zone floor plane */}
            <mesh position={[x, 0, z]} rotation={[0, 0, 0]}>
              <planeGeometry args={[staLen, blWidth]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.25}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Zone boundary lines (vertical planes at start/end) */}
            <mesh position={[zone.sta_from, 0, 165]}>
              <planeGeometry args={[0.5, 70]} />
              <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>

            {/* Zone label */}
            <Html
              position={[x, 0, z - 6]}
              center
              style={{ pointerEvents: 'none' }}
            >
              <div style={{
                fontSize: 9,
                color,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                textShadow: '0 0 3px rgba(0,0,0,0.5)',
              }}>
                {zone.zone_code} {zone.name}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
