import React, { useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';

/**
 * Loads the real CE-25A fuselage from an STL file exported from CATIA STEP.
 *
 * STL coordinate system (from STEP):
 *   X: 150 ~ 18900  (fuselage length, STA direction)
 *   Y: -1178 ~ 1255 (left-right, BL direction)
 *   Z: -991 ~ 991   (up-down, WL direction)
 *
 * We scale from mm to scene units (1 scene unit = 1 mm here, matching equipment STA coords).
 * The model center is approximately at X=9500, Y=0, Z=0.
 */
export function FuselageSTL() {
  const geometry = useLoader(STLLoader, '/fuselage.stl');
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group>
      {/* Semi-transparent solid surface */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhysicalMaterial
          color="#8ab4d8"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          roughness={0.4}
          metalness={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Wireframe overlay for structure visibility */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#5588aa"
          wireframe
          transparent
          opacity={0.06}
        />
      </mesh>
    </group>
  );
}
