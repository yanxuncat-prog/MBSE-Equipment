import React from 'react';

export function StatsRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>{children}</div>;
}
