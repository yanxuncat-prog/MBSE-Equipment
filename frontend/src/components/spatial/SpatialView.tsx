import React, { useState, lazy, Suspense } from 'react';
import { Tabs, Slider, Space, Typography, Spin } from 'antd';
import type { Equipment, Zone } from '../../types';
import { AircraftSideView } from './AircraftSideView';
import { AircraftTopView } from './AircraftTopView';
import { SectionView } from './SectionView';

const { Text } = Typography;

// Lazy load 3D scene (Three.js is heavy)
const AircraftScene3D = lazy(() =>
  import('../spatial3d/AircraftScene3D').then(m => ({ default: m.AircraftScene3D }))
);

interface Props {
  equipment: Equipment[];
  zones: Zone[];
  selectedId: string | null;
  onSelect: (equip: Equipment) => void;
}

export function SpatialView({ equipment, zones, selectedId, onSelect }: Props) {
  const [sta, setSta] = useState(400);

  return (
    <div style={{ height: '100%' }}>
      <Tabs
        defaultActiveKey="3d"
        items={[
          {
            key: '3d',
            label: '3D 视图',
            children: (
              <div style={{ height: 'calc(100vh - 240px)', minHeight: 500 }}>
                <Suspense fallback={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Spin size="large" tip="加载 3D 引擎..." />
                  </div>
                }>
                  <AircraftScene3D equipment={equipment} zones={zones} selectedId={selectedId} onSelect={onSelect} />
                </Suspense>
              </div>
            ),
          },
          {
            key: 'side',
            label: '侧视图',
            children: (
              <div style={{ height: 'calc(100vh - 240px)' }}>
                <AircraftSideView equipment={equipment} zones={zones} selectedId={selectedId} onSelect={onSelect} />
              </div>
            ),
          },
          {
            key: 'top',
            label: '俯视图',
            children: (
              <div style={{ height: 'calc(100vh - 240px)' }}>
                <AircraftTopView equipment={equipment} zones={zones} selectedId={selectedId} onSelect={onSelect} />
              </div>
            ),
          },
          {
            key: 'section',
            label: '截面图',
            children: (
              <div>
                <Space style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12 }}>STA位置:</Text>
                  <Slider min={100} max={1100} value={sta} onChange={setSta} style={{ width: 300 }} />
                  <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{sta}</Text>
                </Space>
                <div style={{ height: 'calc(100vh - 280px)' }}>
                  <SectionView equipment={equipment} staCurrent={sta} selectedId={selectedId} onSelect={onSelect} />
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
