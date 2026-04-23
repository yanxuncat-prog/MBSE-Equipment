
import { CircleCheck, AlertTriangle, CircleX } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ValidationReport } from '../../types';
import { CGIndicator } from './CGIndicator';
import { BusLoadBar } from './BusLoadBar';

const STATUS_CONFIG = {
  pass: {
    className: 'bg-green-500 text-white hover:bg-green-500',
    icon: <CircleCheck className="h-3.5 w-3.5" />,
    text: '正常',
  },
  warning: {
    className: 'bg-yellow-500 text-white hover:bg-yellow-500',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    text: '注意',
  },
  blocked: {
    className: 'bg-destructive text-white hover:bg-destructive',
    icon: <CircleX className="h-3.5 w-3.5" />,
    text: '超限',
  },
};

interface Props {
  report: ValidationReport | null;
}

export function ConstraintPanel({ report }: Props) {
  if (!report) {
    return (
      <div className="flex w-[280px] items-center justify-center border-l bg-muted/40 p-4">
        <span className="text-sm text-muted-foreground">选择构型后显示约束状态</span>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[report.overall_status] || STATUS_CONFIG.pass;
  const wbEngine = report.engines.find(e => e.engine_name === 'weight_balance');
  const elEngine = report.engines.find(e => e.engine_name === 'electrical_load');

  return (
    <div className="w-[280px] overflow-y-auto border-l bg-muted/40 p-4">
      <div className="mb-4 text-center">
        <Badge className={statusCfg.className}>
          <span className="flex items-center gap-1 px-1 py-0.5 text-sm">
            {statusCfg.icon}
            {statusCfg.text}
          </span>
        </Badge>
      </div>

      {wbEngine && (
        <Card size="sm" className="mb-3">
          <CardHeader className="border-b">
            <CardTitle>重量 / CG</CardTitle>
          </CardHeader>
          <CardContent>
            <CGIndicator details={wbEngine.details} status={wbEngine.status} />
          </CardContent>
        </Card>
      )}

      {elEngine && elEngine.details.buses && (
        <Card size="sm" className="mb-3">
          <CardHeader className="border-b">
            <CardTitle>电气负荷</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {Object.entries(elEngine.details.buses as Record<string, any>).map(([busId, bus]: [string, any]) => (
                <BusLoadBar key={busId} busName={bus.bus_name} loadKva={bus.load_kva} capacityKva={bus.capacity_kva} loadRatioPct={bus.load_ratio_pct} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
