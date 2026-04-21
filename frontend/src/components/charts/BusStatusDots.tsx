import React from 'react';
import { Popover, Progress, Typography } from 'antd';

const { Text } = Typography;

interface BusInfo {
  bus_name: string;
  load_kva: number;
  capacity_kva: number;
  load_ratio_pct: number;
}

interface Props {
  buses: Record<string, BusInfo>;
}

export function BusStatusDots({ buses }: Props) {
  const entries = Object.entries(buses);

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {entries.map(([id, bus]) => {
        const color = bus.load_ratio_pct > 100 ? '#FF3B30' : bus.load_ratio_pct > 85 ? '#FF9500' : '#34C759';
        const shortName = bus.bus_name.replace('BUS ', '').replace(' ', '');

        return (
          <Popover
            key={id}
            title={bus.bus_name}
            content={
              <div style={{ width: 180 }}>
                <Progress percent={Math.min(bus.load_ratio_pct, 100)} strokeColor={color} size="small" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ fontSize: 12 }}>{bus.load_kva.toFixed(1)} / {bus.capacity_kva.toFixed(0)} kVA</Text>
                  <Text style={{ fontSize: 12, color }}>余量 {(bus.capacity_kva - bus.load_kva).toFixed(1)}</Text>
                </div>
              </div>
            }
          >
            <div style={{ textAlign: 'center', cursor: 'pointer' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: bus.load_ratio_pct > 85 ? `0 0 8px ${color}` : 'none',
              }} />
              <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{shortName}</div>
            </div>
          </Popover>
        );
      })}
    </div>
  );
}
