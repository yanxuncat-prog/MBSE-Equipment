import React from 'react';
import { Typography } from 'antd';
const { Text } = Typography;
const COLORS = ['#5ac8fa', '#007aff', '#34c759', '#ff9500', '#ff6b6b', '#af52de', '#ffcc00', '#30b0c7', '#a2845e', '#636366'];

interface BarItem { label: string; value: number; suffix?: string; }
interface Props { items: BarItem[]; title?: string; }

export function HorizontalBar({ items, title }: Props) {
  const max = items.length > 0 ? Math.max(...items.map(i => i.value)) : 1;
  return (
    <div>
      {title && <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{title}</div>}
      {items.map((item, i) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
          <Text style={{ width: 60, fontSize: 10, textAlign: 'right', marginRight: 6, color: '#999' }}>{item.label}</Text>
          <div style={{ flex: 1, height: 14, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${(item.value / max) * 100}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: 3, minWidth: item.value > 0 ? 2 : 0 }} />
          </div>
          <Text style={{ width: 50, fontSize: 10, marginLeft: 6, color: '#666' }}>{item.value}{item.suffix || ''}</Text>
        </div>
      ))}
    </div>
  );
}
