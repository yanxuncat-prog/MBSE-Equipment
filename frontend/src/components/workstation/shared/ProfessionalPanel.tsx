import React from 'react';
import { LAYOUT } from '../../../styles/layout';

export function ProfessionalPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: LAYOUT.RIGHT_PANEL_WIDTH,
      flexShrink: 0,
      paddingLeft: LAYOUT.GAP.LG,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: LAYOUT.GAP.MD,
    }}>
      {children}
    </div>
  );
}
