import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid } from '@react-three/drei';
import { Checkbox, Space, Typography } from 'antd';
import { AircraftStructure } from './AircraftModel';
import { EquipmentMarker3D } from './EquipmentMarker3D';
import { ZonePlanes } from './ZonePlanes';
import { StaRuler } from './StaRuler';
import type { Equipment, Zone } from '../../types';

const { Text } = Typography;

interface Props {
  equipment: Equipment[];
  zones: Zone[];
  selectedId: string | null;
  onSelect: (equip: Equipment) => void;
}

export function AircraftScene3D({ equipment, zones, selectedId, onSelect }: Props) {
  const [showZones, setShowZones] = useState(true);
  const [showWireframe, setShowWireframe] = useState(false);

  // Filter equipment that has 3D position data
  const positioned = equipment.filter(e => e.config_data?.sta != null);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Controls overlay */}
      <div style={{
        position: 'absolute', top: 8, left: 8, zIndex: 10,
        background: 'rgba(255,255,255,0.9)', padding: '8px 12px',
        borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}>
        <Space size={16}>
          <Checkbox checked={showZones} onChange={e => setShowZones(e.target.checked)}>区域标注</Checkbox>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {positioned.length} 台设备 | 鼠标左键旋转 · 滚轮缩放 · 右键平移
          </Text>
        </Space>
      </div>

      {/* ATA color legend */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8, zIndex: 10,
        background: 'rgba(255,255,255,0.9)', padding: '6px 10px',
        borderRadius: 6, fontSize: 10, display: 'flex', gap: 8, flexWrap: 'wrap',
        maxWidth: 500,
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

      <Canvas style={{ background: '#0a0e17' }}>
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera makeDefault position={[550, -250, 300]} fov={50} />
          <OrbitControls
            target={[500, 0, 165]}
            minDistance={50}
            maxDistance={2000}
            enableDamping
            dampingFactor={0.1}
          />

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[500, -200, 400]} intensity={0.8} />
          <directionalLight position={[500, 200, 100]} intensity={0.3} />
          <pointLight position={[200, 0, 250]} intensity={0.3} color="#5ac8fa" />
          <pointLight position={[800, 0, 250]} intensity={0.3} color="#ff9500" />

          {/* Ground grid */}
          <Grid
            args={[1200, 200]}
            position={[550, 0, 115]}
            rotation={[0, 0, 0]}
            cellSize={50}
            cellThickness={0.3}
            cellColor="#1a2a3a"
            sectionSize={200}
            sectionThickness={0.6}
            sectionColor="#2a3a4a"
            fadeDistance={2000}
            infiniteGrid={false}
          />

          {/* Aircraft structure */}
          <AircraftStructure />

          {/* Zone visualization */}
          <ZonePlanes zones={zones} visible={showZones} />

          {/* STA ruler */}
          <StaRuler />

          {/* Equipment markers */}
          {positioned.map(equip => (
            <EquipmentMarker3D
              key={equip.id}
              equipment={equip}
              selected={equip.id === selectedId}
              onClick={onSelect}
            />
          ))}
        </Suspense>
      </Canvas>
    </div>
  );
}
