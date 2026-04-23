import { useRef, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Parametric aircraft fuselage — semi-transparent shell built from cross-sections.
 * The fuselage is oriented along the X axis (STA direction).
 * STA range: 0 (nose) to 1100 (tail).
 * Y axis = BL (left-right), Z axis = WL (up-down, inverted so higher WL = higher Z).
 */
export function AircraftFuselage() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    // Define fuselage cross-section radii at various stations
    // Format: [sta, radiusY (half-width BL), radiusZ (half-height WL), centerZ]
    const sections: [number, number, number, number][] = [
      [0, 0.2, 0.2, 170],      // nose tip
      [50, 1.0, 1.0, 170],     // nose cone
      [120, 2.0, 2.2, 170],    // cockpit start
      [200, 2.8, 3.0, 170],    // cockpit
      [350, 3.2, 3.5, 165],    // forward fuselage
      [500, 3.3, 3.5, 160],    // center fuselage
      [700, 3.3, 3.5, 160],    // mid fuselage
      [850, 3.0, 3.2, 165],    // aft fuselage
      [950, 2.2, 2.5, 170],    // tail cone start
      [1050, 1.0, 1.5, 175],   // tail cone
      [1100, 0.3, 0.8, 180],   // tail tip
    ];

    const radialSegments = 24;
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];

    // Generate vertices for each section
    for (let s = 0; s < sections.length; s++) {
      const [sta, ry, rz, cz] = sections[s];
      for (let r = 0; r <= radialSegments; r++) {
        const theta = (r / radialSegments) * Math.PI * 2;
        const x = sta;
        const y = ry * Math.cos(theta);
        const z = cz + rz * Math.sin(theta);
        vertices.push(x, y, z);
        // Approximate normal
        normals.push(0, Math.cos(theta), Math.sin(theta));
      }
    }

    // Generate indices (triangles between adjacent sections)
    const ringSize = radialSegments + 1;
    for (let s = 0; s < sections.length - 1; s++) {
      for (let r = 0; r < radialSegments; r++) {
        const a = s * ringSize + r;
        const b = s * ringSize + r + 1;
        const c = (s + 1) * ringSize + r;
        const d = (s + 1) * ringSize + r + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      {/* Semi-transparent fuselage shell */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhysicalMaterial
          color="#88aacc"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          roughness={0.3}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>
      {/* Wireframe overlay */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#6688aa"
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>
    </group>
  );
}

/**
 * Horizontal tail (simplified flat plate at tail section).
 */
export function HorizontalTail() {
  return (
    <mesh position={[1020, 0, 200]} rotation={[0, 0, 0]}>
      <boxGeometry args={[80, 120, 1.5]} />
      <meshPhysicalMaterial color="#88aacc" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/**
 * Vertical tail (simplified flat plate).
 */
export function VerticalTail() {
  return (
    <mesh position={[1020, 0, 220]} rotation={[Math.PI / 2, 0, 0]}>
      <boxGeometry args={[80, 50, 1.5]} />
      <meshPhysicalMaterial color="#88aacc" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/**
 * Wings (simplified flat shapes).
 */
export function Wings() {
  const wingShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Wing planform (right wing, top view)
    shape.moveTo(0, 0);        // root leading edge
    shape.lineTo(100, 0);      // root trailing edge
    shape.lineTo(60, 150);     // tip trailing edge
    shape.lineTo(20, 150);     // tip leading edge
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = { depth: 1.5, bevelEnabled: false };

  return (
    <group position={[400, 0, 130]}>
      {/* Right wing */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[wingShape, extrudeSettings]} />
        <meshPhysicalMaterial color="#88aacc" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Left wing (mirrored) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, -1, 1]}>
        <extrudeGeometry args={[wingShape, extrudeSettings]} />
        <meshPhysicalMaterial color="#88aacc" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * Complete aircraft structure.
 */
export function AircraftStructure() {
  return (
    <group>
      <AircraftFuselage />
      <Wings />
      <HorizontalTail />
      <VerticalTail />
    </group>
  );
}
