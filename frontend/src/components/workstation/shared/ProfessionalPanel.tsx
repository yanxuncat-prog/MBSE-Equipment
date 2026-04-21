import React from 'react';

export function ProfessionalPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 280, flexShrink: 0, paddingLeft: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {children}
    </div>
  );
}
