
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
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      <div className="flex-1 overflow-auto">
        <EquipmentTable configId={configId} search={search} onEdit={onEdit} onSelect={onSelect} />
      </div>
      <ConstraintPanel report={report} />
    </div>
  );
}
