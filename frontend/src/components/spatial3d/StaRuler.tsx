
import { Html } from '@react-three/drei';

/**
 * STA ruler along the fuselage X axis with tick marks and labels.
 */
export function StaRuler() {
  const ticks = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100];
  const y = -6; // slightly to the right of centerline
  const z = 125; // below fuselage floor

  return (
    <group>
      {/* Main axis line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, y, z, 1100, y, z]), 3]}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#666" transparent opacity={0.5} />
      </line>

      {/* Tick marks and labels */}
      {ticks.map((sta) => (
        <group key={sta}>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([sta, y, z, sta, y, z - 3]), 3]}
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#888" transparent opacity={0.5} />
          </line>
          <Html position={[sta, y, z - 7]} center style={{ pointerEvents: 'none' }}>
            <span style={{ fontSize: 8, color: '#999', fontFamily: 'monospace' }}>{sta}</span>
          </Html>
        </group>
      ))}

      {/* "STA" label */}
      <Html position={[550, y, z - 14]} center style={{ pointerEvents: 'none' }}>
        <span style={{ fontSize: 9, color: '#777', fontFamily: 'monospace' }}>STA (mm)</span>
      </Html>
    </group>
  );
}
