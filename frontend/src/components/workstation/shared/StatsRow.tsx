import React from 'react';
import { LAYOUT } from '../../../styles/layout';

export function StatsRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: LAYOUT.GAP.MD, marginBottom: LAYOUT.GAP.LG }}>
      {children}
    </div>
  );
}
