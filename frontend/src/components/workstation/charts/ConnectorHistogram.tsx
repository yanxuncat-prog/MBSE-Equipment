import React from 'react';
import { Typography } from 'antd';
const { Text } = Typography;

interface Props { equipment: { connector_count: number | null }[]; }

export function ConnectorHistogram({ equipment }: Props) {
  const buckets: Record<string, number> = { '0': 0, '1': 0, '2-3': 0, '4-5': 0, '6+': 0, '未知': 0 };
  for (const e of equipment) {
    const c = e.connector_count;
    if (c == null) buckets['未知']++;
    else if (c === 0) buckets['0']++;
    else if (c === 1) buckets['1']++;
    else if (c <= 3) buckets['2-3']++;
    else if (c <= 5) buckets['4-5']++;
    else buckets['6+']++;
  }
  const max = Math.max(...Object.values(buckets), 1);
  const colors = ['#e0e0e0', '#5ac8fa', '#34c759', '#ff9500', '#ff6b6b', '#999'];
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>连接器数分布</div>
      {Object.entries(buckets).map(([label, count], i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ width: 32, fontSize: 10, textAlign: 'right', marginRight: 6, color: '#999' }}>{label}</Text>
          <div style={{ flex: 1, height: 14, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${(count / max) * 100}%`, height: '100%', background: colors[i % colors.length], borderRadius: 3 }} />
          </div>
          <Text style={{ width: 30, fontSize: 10, marginLeft: 4, color: '#666' }}>{count}</Text>
        </div>
      ))}
    </div>
  );
}
