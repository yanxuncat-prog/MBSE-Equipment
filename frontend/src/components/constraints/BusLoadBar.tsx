import React from 'react';
import { Progress, Typography } from 'antd';

const { Text } = Typography;

interface Props {
  busName: string;
  loadKva: number;
  capacityKva: number;
  loadRatioPct: number;
}

export function BusLoadBar({ busName, loadKva, capacityKva, loadRatioPct }: Props) {
  const color = loadRatioPct > 100 ? '#FF3B30' : loadRatioPct > 85 ? '#FF9500' : '#34C759';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <Text style={{ fontSize: 12 }}>{busName}</Text>
        <Text style={{ fontSize: 11, color }}>{loadKva.toFixed(1)}/{capacityKva.toFixed(0)} kVA</Text>
      </div>
      <Progress
        percent={Math.min(loadRatioPct, 100)}
        size="small"
        strokeColor={color}
        showInfo={false}
        style={{ marginBottom: 0 }}
      />
    </div>
  );
}
