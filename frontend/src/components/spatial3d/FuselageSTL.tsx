import React from 'react';
import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';

/**
 * Loads the CE-25A complete aircraft from STL (converted from STEP).
 *
 * STEP coordinate system:
 *   X: 150 ~ 19750 mm  (fuselage length)
 *   Y: -2147 ~ 4123 mm (span, asymmetric due to modeling origin)
 *   Z: -4083 ~ 11501 mm (height including vertical tail)
 */
export function FuselageSTL() {
  const geometry = useLoader(STLLoader, '/ce25a.stl');

  return (
    <group>
      {/* Semi-transparent solid */}
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color="#90b8d8"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          roughness={0.3}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>
      {/* Wireframe */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#6090b0"
          wireframe
          transparent
          opacity={0.05}
        />
      </mesh>
    </group>
  );
}
