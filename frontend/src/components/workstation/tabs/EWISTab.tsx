import React from 'react';
import { Typography } from 'antd';
import type { Equipment, ValidationReport } from '../../../types';

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

export function EWISTab({ equipment }: Props) {
  return <Typography.Text type="secondary">EWIS 视图开发中...</Typography.Text>;
}
