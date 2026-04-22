import { useEffect, useState, useCallback } from 'react';
import {
  CircleCheck, AlertTriangle, CircleX, Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useConfigStore } from '../store/configStore';
import { validateConfig } from '../api/constraints';
import { listConfigs } from '../api/configurations';
import client from '../api/client';
import type { ValidationReport, Configuration } from '../types';
import { CGEnvelopeChart } from '../components/charts/CGEnvelopeChart';
import { BusStatusDots } from '../components/charts/BusStatusDots';
import { ATADistributionBar } from '../components/charts/ATADistributionBar';
import { ZoneDonutChart } from '../components/charts/ZoneDonutChart';

const STATUS_CFG = {
  pass: {
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    icon: <CircleCheck className="size-6" />,
    text: '全机约束状态：正常',
  },
  warning: {
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    icon: <AlertTriangle className="size-6" />,
    text: '全机约束状态：注意',
  },
  blocked: {
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    icon: <CircleX className="size-6" />,
    text: '全机约束状态：超限',
  },
};

const BAR_COLORS = [
  'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500',
  'bg-sky-400', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500',
  'bg-amber-600', 'bg-gray-500',
];

export function DashboardPage() {
  const { activeConfigId, activeSeriesId } = useConfigStore();
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!activeConfigId) return;
    setLoading(true);
    try {
      const [rpt, statsResp, cfgList] = await Promise.all([
        validateConfig({ config_id: activeConfigId }),
        client.get('/dashboard/stats', { params: { config_id: activeConfigId } }).then(r => r.data),
        activeSeriesId ? listConfigs(activeSeriesId) : Promise.resolve([]),
      ]);
      setReport(rpt);
      setStats(statsResp);
      setConfigs(cfgList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeConfigId, activeSeriesId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!activeConfigId) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        请先在顶部选择构型
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const overallStatus = (report?.overall_status || 'pass') as keyof typeof STATUS_CFG;
  const sc = STATUS_CFG[overallStatus];
  const wbEngine = report?.engines.find(e => e.engine_name === 'weight_balance');
  const elEngine = report?.engines.find(e => e.engine_name === 'electrical_load');
  const wbDetails = wbEngine?.details || {};
  const buses = (elEngine?.details?.buses || {}) as Record<string, any>;

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* Row 0: Overall Status Banner */}
      <div className={cn(
        'mb-4 flex items-center gap-3 rounded-lg border px-6 py-4',
        sc.bg, sc.border,
      )}>
        <span className={sc.color}>{sc.icon}</span>
        <div>
          <p className={cn('text-base font-semibold', sc.color)}>{sc.text}</p>
          <p className="text-xs text-muted-foreground">
            CG {wbDetails.cg_pct_mac?.toFixed(1) || '-'}% MAC 包线内 |
            最高母线负荷 {Math.max(...Object.values(buses).map((b: any) => b.load_ratio_pct || 0), 0).toFixed(0)}% |
            总重量 {wbDetails.total_mass_kg?.toFixed(0) || '-'} kg
          </p>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="mb-4 grid grid-cols-5 gap-3">
        <Card size="sm">
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {stats?.equipment_count || 0}<span className="ml-1 text-sm font-normal text-muted-foreground">台</span>
            </div>
            <div className="text-xs text-muted-foreground">设备总数</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {wbDetails.total_mass_kg?.toFixed(1) || 0}<span className="ml-1 text-sm font-normal text-muted-foreground">kg</span>
            </div>
            <div className="text-xs text-muted-foreground">总重量</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className={cn('text-2xl font-bold', sc.color)}>
              {wbDetails.cg_pct_mac?.toFixed(1) || 0}<span className="ml-1 text-sm font-normal text-muted-foreground">% MAC</span>
            </div>
            <div className="text-xs text-muted-foreground">CG 位置</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {stats?.weight_equipped_count || 0}<span className="ml-1 text-sm font-normal text-muted-foreground">/ {stats?.equipment_count || 0}</span>
            </div>
            <div className="text-xs text-muted-foreground">有重量数据</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="text-2xl font-bold text-sky-400">
              {stats?.config_count || 0}<span className="ml-1 text-sm font-normal text-muted-foreground">个</span>
            </div>
            <div className="text-xs text-muted-foreground">构型版本</div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: CG Envelope + Bus Status */}
      <div className="mb-4 flex gap-3">
        <div className="min-w-0" style={{ flex: '14 1 0%' }}>
          <Card size="sm">
            <CardHeader>
              <CardTitle>CG 包线图</CardTitle>
            </CardHeader>
            <CardContent>
              <CGEnvelopeChart
                cgPctMac={wbDetails.cg_pct_mac || 0}
                totalMassKg={wbDetails.total_mass_kg || 0}
                mtowKg={100000}
                fwdLimitPct={20}
                aftLimitPct={40}
                status={wbEngine?.status as any || 'pass'}
                width={500}
                height={220}
              />
            </CardContent>
          </Card>
        </div>
        <div className="min-w-0 flex flex-col gap-3" style={{ flex: '10 1 0%' }}>
          <Card size="sm">
            <CardHeader>
              <CardTitle>母线状态</CardTitle>
            </CardHeader>
            <CardContent>
              <BusStatusDots buses={buses} />
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>约束健康度</CardTitle>
            </CardHeader>
            <CardContent>
              {report?.engines.map(eng => {
                const eColor = eng.status === 'pass' ? 'text-green-500' : eng.status === 'warning' ? 'text-orange-500' : 'text-red-500';
                const eIcon = eng.status === 'pass' ? '\u2713' : eng.status === 'warning' ? '\u26A0' : '\u2717';
                return (
                  <div key={eng.engine_name} className="flex items-center justify-between border-b border-muted py-1.5 last:border-b-0">
                    <span className="text-[13px]">{eng.engine_name === 'weight_balance' ? '重量/CG' : '电气负荷'}</span>
                    <span className={cn('text-[13px] font-semibold', eColor)}>{eIcon} {eng.summary.slice(0, 30)}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 3: Distribution Charts */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>ATA 系统分布</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.ata_distribution && <ATADistributionBar data={stats.ata_distribution} total={stats.equipment_count} />}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>区域分布</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.zone_distribution && <ZoneDonutChart data={stats.zone_distribution} total={stats.equipment_count} />}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>重量分布 (按ATA)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.weight_distribution && (
              <div className="space-y-1.5">
                {stats.weight_distribution.map((item: any, i: number) => (
                  <div key={item.ata} className="flex items-center">
                    <span className="w-13 shrink-0 text-right text-[11px] text-muted-foreground mr-2">ATA-{item.ata}</span>
                    <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded', BAR_COLORS[i % BAR_COLORS.length])}
                        style={{ width: `${(item.weight_kg / (stats.weight_distribution[0]?.weight_kg || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="w-14 shrink-0 ml-2 text-[11px] text-muted-foreground">{item.weight_kg}kg</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Timeline + Info */}
      <div className="flex gap-3">
        <div className="min-w-0" style={{ flex: '16 1 0%' }}>
          <Card size="sm">
            <CardHeader>
              <CardTitle>构型变更时间线</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {configs.map((c, index) => {
                  const isLast = index === configs.length - 1;
                  return (
                    <div key={c.id} className={cn('relative pl-6', isLast ? 'pb-0' : 'pb-4')}>
                      {/* Timeline dot */}
                      <div className={cn(
                        'absolute left-0 top-1 size-3 rounded-full border-2 bg-background',
                        c.status === 'baseline' ? 'border-green-500' : 'border-blue-500',
                      )} />
                      {/* Timeline connector line */}
                      {!isLast && (
                        <div className="absolute left-[5px] top-4 bottom-0 w-px bg-border" />
                      )}
                      {/* Content */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{c.version}</span>
                          <Badge variant={c.status === 'baseline' ? 'default' : 'secondary'}>
                            {c.status === 'baseline' ? '基线' : '草稿'}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {c.equipment_count} 台设备{c.description ? ` \u00B7 ${c.description}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="min-w-0 flex flex-col gap-3" style={{ flex: '8 1 0%' }}>
          <Card size="sm">
            <CardHeader>
              <CardTitle>待办提醒</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">评审流程模块（待开发）</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>供应商状态</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">供应商协同模块（待开发）</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
