import React, { useState } from 'react';
import { Tabs, Slider, Space, Typography } from 'antd';
import type { Equipment, Zone } from '../../types';
import { AircraftSideView } from './AircraftSideView';
import { AircraftTopView } from './AircraftTopView';
import { SectionView } from './SectionView';

const { Text } = Typography;

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
        items={[
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
