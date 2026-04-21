import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

const COLORS = ['#5ac8fa', '#007aff', '#34c759', '#ff9500', '#ff6b6b', '#af52de', '#ffcc00', '#30b0c7', '#a2845e', '#636366'];

interface Props {
  data: { ata: string; count: number }[];
  total: number;
}

export function ATADistributionBar({ data, total }: Props) {
  const maxCount = data.length > 0 ? data[0].count : 1;

  return (
    <div>
      {data.map((item, i) => (
        <div key={item.ata} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ width: 52, fontSize: 11, textAlign: 'right', marginRight: 8, color: '#999' }}>ATA-{item.ata}</Text>
          <div style={{ flex: 1, height: 16, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${(item.count / maxCount) * 100}%`,
              height: '100%',
              background: COLORS[i % COLORS.length],
              borderRadius: 3,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <Text style={{ width: 40, fontSize: 11, marginLeft: 8, color: '#666' }}>{item.count}台</Text>
        </div>
      ))}
    </div>
  );
}
