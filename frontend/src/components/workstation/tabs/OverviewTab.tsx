import React from 'react';
import { EquipmentTable } from '../../equipment/EquipmentTable';
import { ConstraintPanel } from '../../constraints/ConstraintPanel';
import type { Equipment, ValidationReport } from '../../../types';

interface Props {
  configId: string | null;
  search: string;
  report: ValidationReport | null;
  onEdit: (equip: Equipment) => void;
  onSelect: (equip: Equipment) => void;
}

export function OverviewTab({ configId, search, report, onEdit, onSelect }: Props) {
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)' }}>
      <div style={{ flex: 1, overflow: 'auto', paddingRight: 16 }}>
        <EquipmentTable configId={configId} search={search} onEdit={onEdit} onSelect={onSelect} />
      </div>
      <ConstraintPanel report={report} />
    </div>
  );
}
