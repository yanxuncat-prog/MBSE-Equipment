import React from 'react';
import { Card, Statistic } from 'antd';

interface Props {
  title: string;
  value: number | string;
  suffix?: string;
  color?: string;
  precision?: number;
}

export function StatsCard({ title, value, suffix, color = '#333', precision }: Props) {
  return (
    <Card size="small" style={{ flex: 1 }}>
      <Statistic title={title} value={value} suffix={suffix} precision={precision} valueStyle={{ color, fontSize: 20 }} />
    </Card>
  );
}
