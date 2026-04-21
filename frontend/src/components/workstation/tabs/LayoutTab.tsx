import React from 'react';
import { Typography } from 'antd';
import type { Equipment, ValidationReport } from '../../../types';

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

export function LayoutTab({ equipment }: Props) {
  return <Typography.Text type="secondary">Layout 视图开发中...</Typography.Text>;
}
