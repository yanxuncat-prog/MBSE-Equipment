import { useEffect, useState, useCallback } from 'react';
import {
  CircleCheck, AlertTriangle, CircleX, Loader2,
  Plane, Zap, TrendingDown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fmtNumber } from '@/lib/format';
import { useConfigStore } from '../store/configStore';
import { validateConfig } from '../api/constraints';
import { listConfigs } from '../api/configurations';
import { computeWeightReduction } from '../api/weight-reduction';
import client from '../api/client';
import type { ValidationReport, WeightReductionResult } from '../types';
import { CGEnvelopeChart } from '../components/charts/CGEnvelopeChart';

const STATUS_CFG = {
  pass: {
    color: 'text-status-ok',
    bg: 'bg-status-ok/5',
    border: 'border-status-ok/20',
    icon: <CircleCheck className="size-5" />,
    text: '全机约束状态：正常',
  },
  warning: {
    color: 'text-status-warn',
    bg: 'bg-status-warn/5',
    border: 'border-status-warn/20',
    icon: <AlertTriangle className="size-5" />,
    text: '全机约束状态：注意',
  },
  blocked: {
    color: 'text-status-danger',
    bg: 'bg-status-danger/5',
    border: 'border-status-danger/20',
    icon: <CircleX className="size-5" />,
    text: '全机约束状态：超限',
  },
};

const ATA_NAMES: Record<string, string> = {
  '21': '空调', '23': '通信', '24': '电源', '25': '设备/装饰', '26': '防火',
  '27': '飞控', '30': '防除冰', '31': '指示/记录', '32': '起落架', '33': '照明',
  '34': '导航', '35': '氧气', '38': '水/废水', '42': '机载网络', '44': '客舱',
  '46': '信息系统', '52': '舱门', '86': '电推进', '87': '试飞改装', '90': '自主飞行',
  '92': '地面网联', '11': '标牌',
};

export function DashboardPage() {
  const { activeConfigId, activeProgramId } = useConfigStore();
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weightReduction, setWeightReduction] = useState<WeightReductionResult | null>(null);
  const [weightReductionReady, setWeightReductionReady] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!activeConfigId) return;
    setLoading(true);
    try {
      const [rpt, statsResp] = await Promise.all([
        validateConfig({ config_id: activeConfigId }),
        client.get('/dashboard/stats', { params: { config_id: activeConfigId } }).then(r => r.data),
      ]);
      setReport(rpt);
      setStats(statsResp);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeConfigId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Fetch weight reduction with first two configs
  useEffect(() => {
    if (!activeProgramId) { setWeightReduction(null); setWeightReductionReady(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const cfgs = await listConfigs(activeProgramId);
        if (cancelled) return;
        if (cfgs.length < 2) {
          setWeightReduction(null);
          setWeightReductionReady(true);
          return;
        }
        const result = await computeWeightReduction(cfgs[0].id, cfgs[1].id);
        if (!cancelled) {
          setWeightReduction(result);
          setWeightReductionReady(true);
        }
      } catch {
        if (!cancelled) {
          setWeightReduction(null);
          setWeightReductionReady(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [activeProgramId]);

  if (!activeConfigId) {
    return <div className="py-20 text-center text-muted-foreground">请先在顶部选择构型</div>;
  }
  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  const overallStatus = (report?.overall_status || 'pass') as keyof typeof STATUS_CFG;
  const sc = STATUS_CFG[overallStatus];
  const wbEngine = report?.engines.find(e => e.engine_name === 'weight_balance');
  const wbDetails = wbEngine?.details || {};
  const comp = stats?.completeness || {};
  const onboard = stats?.onboard || {};
  const elecSum = stats?.electrical_summary || {};
  const total = stats?.equipment_count || 0;

  // Overall completeness score
  const compFields = Object.values(comp) as { pct: number }[];
  const avgComp = compFields.length > 0 ? Math.round(compFields.reduce((s, f) => s + f.pct, 0) / compFields.length) : 0;

  return (
    <div className="mx-auto max-w-[1200px] space-y-4">
      {/* Status Banner */}
      <div className={cn('flex items-center gap-3 rounded-lg border px-5 py-3', sc.bg, sc.border)}>
        <span className={sc.color}>{sc.icon}</span>
        <div>
          <p className={cn('text-sm font-medium', sc.color)}>{sc.text}</p>
          <p className="text-xs text-muted-foreground">
            总重量 {wbDetails.total_mass_kg ? fmtNumber(wbDetails.total_mass_kg) : '-'} kg |
            CG {wbDetails.cg_pct_mac?.toFixed(1) || '-'}% MAC |
            电推进 {elecSum.propulsion_kva || 0} KVA |
            机载 {elecSum.avionics_kva || 0} KVA
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-3">
        <KPICard value={total} unit="台" label="设备总数" />
        <KPICard value={fmtNumber(stats?.weight_total_kg || 0)} unit="kg" label="总重量" />
        <KPICard
          value={onboard.first_flight?.yes || 0}
          unit={`/ ${total}`}
          label="首飞装机"
          pct={total > 0 ? Math.round((onboard.first_flight?.yes || 0) / total * 100) : 0}
        />
        <KPICard value={`${avgComp}%`} unit="" label="数据完成度" />
        {/* Weight Reduction Summary Card */}
        <Card size="sm">
          <CardContent>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="size-3.5 text-status-ok" />
              <span className="text-xs text-muted-foreground">减重进展</span>
            </div>
            {!weightReductionReady ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">加载中</span>
              </div>
            ) : weightReduction ? (
              <>
                <div className="text-2xl font-bold tabular-nums text-status-ok">
                  {weightReduction.total_reduction_kg > 0 ? '+' : ''}{weightReduction.total_reduction_kg.toFixed(1)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">kg</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  共对比 {weightReduction.matched_count} 台设备
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">需要至少两个构型</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Data Completeness + Onboard Status */}
      <div className="grid grid-cols-2 gap-3">
        {/* Data Completeness */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>数据录入完成度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {[
                { key: 'do160', label: 'DO-160 鉴定' },
                { key: 'weight', label: '重量数据' },
                { key: 'bonding', label: '搭接信息' },
                { key: 'electrical', label: '电气负载' },
                { key: 'eicd', label: 'EICD 信息' },
                { key: 'install', label: '安装方式' },
              ].map(({ key, label }) => {
                const d = comp[key] || { filled: 0, total: 0, pct: 0 };
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700',
                          d.pct >= 80 ? 'bg-status-ok' : d.pct >= 50 ? 'bg-chart-1' : 'bg-status-warn'
                        )}
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {d.filled}/{d.total} <span className="text-foreground font-medium">{d.pct}%</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Onboard Status */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>装机进度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <OnboardBar
                label="首飞装机"
                yes={onboard.first_flight?.yes || 0}
                no={onboard.first_flight?.no || 0}
                unknown={onboard.first_flight?.unknown || 0}
                total={total}
              />
              <OnboardBar
                label="二阶段装机"
                yes={onboard.phase2?.yes || 0}
                no={onboard.phase2?.no || 0}
                unknown={onboard.phase2?.unknown || 0}
                total={total}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: ATA Distribution + Weight Pareto */}
      <div className="grid grid-cols-2 gap-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>ATA 系统分布</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.ata_distribution && (
              <div className="space-y-1.5">
                {stats.ata_distribution.map((item: any, i: number) => {
                  const max = stats.ata_distribution[0]?.count || 1;
                  const opacity = Math.max(0.35, 1 - i * 0.07);
                  return (
                    <div key={item.ata} className="flex items-center">
                      <span className="w-20 shrink-0 text-right text-xs text-muted-foreground mr-2">
                        {ATA_NAMES[item.ata] || `ATA-${item.ata}`}
                      </span>
                      <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                        <div
                          className="h-full rounded bg-chart-1"
                          style={{ width: `${(item.count / max) * 100}%`, opacity }}
                        />
                      </div>
                      <span className="w-10 shrink-0 ml-2 text-xs tabular-nums text-muted-foreground">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>重量分布 (按ATA)</CardTitle>
              <span className="text-xs text-muted-foreground">
                前3项占 {stats?.weight_distribution
                  ? Math.round(stats.weight_distribution.slice(0, 3).reduce((s: number, i: any) => s + i.weight_kg, 0) / stats.weight_total_kg * 100)
                  : 0}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.weight_distribution && (
              <div className="space-y-1.5">
                {stats.weight_distribution.map((item: any, i: number) => {
                  const max = stats.weight_distribution[0]?.weight_kg || 1;
                  const opacity = Math.max(0.35, 1 - i * 0.07);
                  return (
                    <div key={item.ata} className="flex items-center">
                      <span className="w-20 shrink-0 text-right text-xs text-muted-foreground mr-2">
                        {ATA_NAMES[item.ata] || `ATA-${item.ata}`}
                      </span>
                      <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                        <div
                          className="h-full rounded bg-chart-1"
                          style={{ width: `${(item.weight_kg / max) * 100}%`, opacity }}
                        />
                      </div>
                      <span className="w-16 shrink-0 ml-2 text-right text-xs tabular-nums text-muted-foreground">{item.weight_kg}kg</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: CG Envelope + Electrical */}
      <div className="grid grid-cols-2 gap-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>CG 包线图</CardTitle>
          </CardHeader>
          <CardContent>
            <CGEnvelopeChart
              cgPctMac={wbDetails.cg_pct_mac || 0}
              totalMassKg={wbDetails.total_mass_kg || 0}
              mtowKg={100000}
              fwdLimitPct={15}
              aftLimitPct={45}
              status={wbEngine?.status as any || 'pass'}
              width={500}
              height={220}
            />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>电气负载分布</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Propulsion callout */}
            <div className="mb-4 flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2">
              <Plane className="size-4 text-chart-1 shrink-0" />
              <div className="flex-1">
                <span className="text-xs text-muted-foreground">电推进系统 (ATA-86)</span>
              </div>
              <span className="text-lg font-bold tabular-nums text-foreground">
                {elecSum.propulsion_kva || 0}
                <span className="ml-1 text-xs font-normal text-muted-foreground">KVA</span>
              </span>
            </div>
            {/* Avionics breakdown */}
            <div className="mb-2 flex items-center gap-2">
              <Zap className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">机载系统合计</span>
              <span className="text-xs font-medium tabular-nums">{elecSum.avionics_kva || 0} KVA</span>
            </div>
            <div className="space-y-1.5">
              {(elecSum.avionics_by_ata || []).map((item: any, i: number) => {
                const max = elecSum.avionics_by_ata?.[0]?.kva || 1;
                const opacity = Math.max(0.4, 1 - i * 0.08);
                return (
                  <div key={item.ata} className="flex items-center">
                    <span className="w-16 shrink-0 text-right text-xs text-muted-foreground mr-2">
                      {ATA_NAMES[item.ata] || `ATA-${item.ata}`}
                    </span>
                    <div className="flex-1 h-3 rounded bg-muted overflow-hidden">
                      <div className="h-full rounded bg-chart-1" style={{ width: `${(item.kva / max) * 100}%`, opacity }} />
                    </div>
                    <span className="w-16 shrink-0 ml-2 text-right text-xs tabular-nums text-muted-foreground">{item.kva} kW</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

/* ─── Sub-components ─── */

function KPICard({ value, unit, label, pct }: {
  value: string | number; unit: string; label: string; pct?: number;
}) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="text-2xl font-bold tabular-nums text-foreground">
          {value}<span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          {pct !== undefined && (
            <span className={cn('text-xs font-medium',
              pct >= 80 ? 'text-status-ok' : pct >= 50 ? 'text-chart-1' : 'text-status-warn'
            )}>
              {pct}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OnboardBar({ label, yes, no, unknown, total }: {
  label: string; yes: number; no: number; unknown: number; total: number;
}) {
  const yesPct = total > 0 ? (yes / total) * 100 : 0;
  const noPct = total > 0 ? (no / total) * 100 : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[13px] font-medium">{label}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          <span className="text-foreground font-medium">{yes}</span> / {total} 台
        </span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {yesPct > 0 && (
          <div className="h-full bg-chart-1 transition-all duration-500" style={{ width: `${yesPct}%` }} />
        )}
        {noPct > 0 && (
          <div className="h-full bg-muted-foreground/20 transition-all duration-500" style={{ width: `${noPct}%` }} />
        )}
      </div>
      <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-chart-1" /> 装机 {yes}
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-muted-foreground/20" /> 不装 {no}
        </span>
        {unknown > 0 && (
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-muted" /> 待定 {unknown}
          </span>
        )}
      </div>
    </div>
  );
}
