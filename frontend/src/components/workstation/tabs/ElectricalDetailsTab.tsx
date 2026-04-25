import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  listElectricalDetails,
  listFlightPhases,
  listLoadWorkModes,
} from '@/api/electrical-details';
import { useConfigStore } from '@/store/configStore';

/* ── Types ── */
interface Detail {
  load_id: string; equipment_name: string; ata_chapter: string;
  voltage_level: string; working_power_kw: string; peak_power_kw: string;
  supply_channels: string; emergency_sheddable: string;
  soft_start: string; voltage_range: string; peak_power_time_s: string;
  peak_to_working_ratio: string;
  [k: string]: any;
}
interface Phase {
  phase_code: string; phase_name: string; duration_min: string;
  peak_simultaneity: string; emergency_simultaneity: string;
}
interface WorkMode {
  load_id: string; work_mode: string; equipment_name: string;
  ata_chapter: string; voltage_level: string; emergency_sheddable: string;
  power_demand_kw: string;
  g0: string; g1: string; g2: string; g3: string;
  g4: string; g5: string; g6: string; g7: string; g8: string;
  [k: string]: any;
}

const PK = ['g0','g1','g2','g3','g4','g5','g6','g7','g8'] as const;
function pf(v: any): number {
  if (v == null || v === '' || v === '/' || v === '-') return 0;
  const n = parseFloat(String(v)); return isNaN(n) ? 0 : n;
}

/* ── Phase power computation ── */
interface PhasePower {
  phase: string; name: string; duration: number;
  peak270: number; peak28: number; peak800: number;
  emerg270: number; emerg28: number; emerg800: number;
  energy: number;
}

function computePhasePowers(workModes: WorkMode[], phases: Phase[]): PhasePower[] {
  const byLoad = new Map<string, WorkMode[]>();
  for (const wm of workModes) {
    const arr = byLoad.get(wm.load_id) || [];
    arr.push(wm);
    byLoad.set(wm.load_id, arr);
  }
  const sorted = [...phases].sort((a, b) => a.phase_code.localeCompare(b.phase_code));

  return sorted.map((phase, pi) => {
    const pk = PK[pi];
    if (!pk) return null;
    const dur = pf(phase.duration_min);
    let p270 = 0, p28 = 0, p800 = 0, e270 = 0, e28 = 0, e800 = 0, energy = 0;

    for (const [, modes] of byLoad) {
      // Weighted sum: effective_power = SUM(power × duty_cycle_fraction)
      let effectivePower = 0;
      let volt = '', shed = '';
      for (const m of modes) {
        const fraction = pf(m[pk]); // duty cycle fraction (0.0 ~ 1.0)
        const pw = pf(m.power_demand_kw);
        effectivePower += pw * fraction;
        if (pw > 0 && !volt) {
          volt = String(m.voltage_level || '').replace('V','');
          shed = m.emergency_sheddable || '';
        }
      }
      if (effectivePower <= 0) continue;
      if (volt === '270') { p270 += effectivePower; if (shed !== '是') e270 += effectivePower; }
      else if (volt === '800') { p800 += effectivePower; if (shed !== '是') e800 += effectivePower; }
      else { p28 += effectivePower; if (shed !== '是') e28 += effectivePower; }
      energy += effectivePower * dur / 60;
    }
    return { phase: phase.phase_code, name: phase.phase_name, duration: dur, peak270: p270, peak28: p28, peak800: p800, emerg270: e270, emerg28: e28, emerg800: e800, energy };
  }).filter(Boolean) as PhasePower[];
}

/* ── Compact power curve (responsive SVG) ── */
function PowerCurve({ data, label, color }: {
  data: { phase: string; name: string; peak: number; emerg: number }[];
  label: string; color: string;
}) {
  if (data.length === 0) return null;
  const W = 440, H = 140;
  const pad = { t: 14, r: 12, b: 32, l: 42 };
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  const maxVal = Math.max(...data.flatMap(d => [d.peak, d.emerg]), 0.1);
  const sx = (i: number) => pad.l + (i / Math.max(data.length - 1, 1)) * cw;
  const sy = (v: number) => pad.t + ch - (v / maxVal) * ch;

  const mkPath = (key: 'peak' | 'emerg') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${sx(i)},${sy(d[key])}`).join('');

  // Fill area under peak line
  const areaPath = mkPath('peak') + `L${sx(data.length-1)},${sy(0)}L${sx(0)},${sy(0)}Z`;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block w-4 h-0.5 rounded" style={{ backgroundColor: color }} /> 峰值
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block w-4 h-0.5 rounded border-b border-dashed" style={{ borderColor: color }} /> 应急
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="功率曲线图">
        <title>功率曲线图</title>
        {/* Grid */}
        {[0, 0.5, 1].map(f => (
          <g key={f}>
            <line x1={pad.l} y1={sy(maxVal*f)} x2={W-pad.r} y2={sy(maxVal*f)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={pad.l-4} y={sy(maxVal*f)+3} textAnchor="end" fill="var(--muted-foreground)" fontSize={9}>
              {(maxVal*f).toFixed(maxVal > 10 ? 0 : 1)}
            </text>
          </g>
        ))}
        <text x={6} y={pad.t+ch/2} fill="var(--muted-foreground)" fontSize={8}
          textAnchor="middle" transform={`rotate(-90,6,${pad.t+ch/2})`}>kW</text>

        {/* Area fill */}
        <path d={areaPath} fill={color} opacity={0.06} />

        {/* Lines */}
        <path d={mkPath('peak')} fill="none" stroke={color} strokeWidth={1.5} />
        <path d={mkPath('emerg')} fill="none" stroke={color} strokeWidth={1} strokeDasharray="3,2" opacity={0.5} />

        {/* Points + values */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={sx(i)} cy={sy(d.peak)} r={2.5} fill={color} />
            {d.peak > 0 && (
              <text x={sx(i)} y={sy(d.peak)-6} textAnchor="middle" fill={color} fontSize={8} fontWeight={600}>
                {d.peak.toFixed(d.peak > 10 ? 0 : 1)}
              </text>
            )}
          </g>
        ))}

        {/* X labels */}
        {data.map((d, i) => (
          <g key={`x${i}`}>
            <text x={sx(i)} y={H-pad.b+12} textAnchor="middle" fill="var(--muted-foreground)" fontSize={8}>{d.phase}</text>
            <text x={sx(i)} y={H-pad.b+22} textAnchor="middle" fill="var(--muted-foreground)" fontSize={7}>{d.name}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── Main Component ── */
export function ElectricalDetailsTab() {
  const { activeConfigId, activeProgramId, activeATA } = useConfigStore();
  const [rawDetails, setRawDetails] = useState<Detail[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [rawWorkModes, setRawWorkModes] = useState<WorkMode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeConfigId) return;
    setLoading(true);
    Promise.all([
      listElectricalDetails(activeConfigId),
      listFlightPhases(activeProgramId || activeConfigId),
      listLoadWorkModes(activeConfigId),
    ]).then(([d, p, w]) => { setRawDetails(d); setPhases(p); setRawWorkModes(w); })
      .finally(() => setLoading(false));
  }, [activeConfigId]);

  // Filter by ATA when selected in GlobalNav
  const details = useMemo(() => {
    if (!activeATA) return rawDetails;
    return rawDetails.filter(d => {
      const ata = d.ata_chapter || '';
      return ata.includes(`ATA${activeATA}`) || ata.includes(`ata${activeATA}`) || ata === activeATA;
    });
  }, [rawDetails, activeATA]);

  const workModes = useMemo(() => {
    if (!activeATA) return rawWorkModes;
    return rawWorkModes.filter(w => {
      const ata = w.ata_chapter || '';
      return ata.includes(`ATA${activeATA}`) || ata.includes(`ata${activeATA}`) || ata === activeATA;
    });
  }, [rawWorkModes, activeATA]);

  const kpis = useMemo(() => {
    const v270 = details.filter(d => String(d.voltage_level) === '270');
    const v28 = details.filter(d => String(d.voltage_level) === '28');
    const v800 = details.filter(d => String(d.voltage_level) === '800');
    const sum = (arr: Detail[]) => arr.reduce((s, d) => s + pf(d.working_power_kw), 0);
    const shedYes = details.filter(d => d.emergency_sheddable === '是').length;
    const shedNo = details.filter(d => d.emergency_sheddable === '否').length;
    const dualCh = details.filter(d => (d.supply_channels || '').includes('双')).length;
    const singleCh = details.filter(d => (d.supply_channels || '').includes('单')).length;
    return {
      cnt270: v270.length, sum270: sum(v270),
      cnt28: v28.length, sum28: sum(v28),
      cnt800: v800.length, sum800: sum(v800),
      shedYes, shedNo, shedPct: (shedYes + shedNo) > 0 ? Math.round(shedYes / (shedYes + shedNo) * 100) : 0,
      dualCh, singleCh,
    };
  }, [details]);

  const phasePowers = useMemo(() => computePhasePowers(workModes, phases), [workModes, phases]);
  const chart270 = useMemo(() => phasePowers.map(p => ({ phase: p.phase, name: p.name, peak: p.peak270, emerg: p.emerg270 })), [phasePowers]);
  const chart28 = useMemo(() => phasePowers.map(p => ({ phase: p.phase, name: p.name, peak: p.peak28, emerg: p.emerg28 })), [phasePowers]);
  const chart800 = useMemo(() => phasePowers.map(p => ({ phase: p.phase, name: p.name, peak: p.peak800, emerg: p.emerg800 })), [phasePowers]);
  const has800 = chart800.some(d => d.peak > 0);
  const totalEnergy = phasePowers.reduce((s, p) => s + p.energy, 0);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-4 gap-3">
        <Card size="sm"><CardContent>
          <div className="text-xs text-muted-foreground mb-0.5">270V 负载</div>
          <div className="text-lg font-bold tabular-nums">{kpis.cnt270} <span className="text-xs font-normal text-muted-foreground">台 · {kpis.sum270.toFixed(1)} kW</span></div>
        </CardContent></Card>
        <Card size="sm"><CardContent>
          <div className="text-xs text-muted-foreground mb-0.5">28V 负载</div>
          <div className="text-lg font-bold tabular-nums">{kpis.cnt28} <span className="text-xs font-normal text-muted-foreground">台 · {kpis.sum28.toFixed(1)} kW</span></div>
        </CardContent></Card>
        <Card size="sm"><CardContent>
          <div className="text-xs text-muted-foreground mb-0.5">800V 负载</div>
          <div className="text-lg font-bold tabular-nums">{kpis.cnt800} <span className="text-xs font-normal text-muted-foreground">台 · {kpis.sum800.toFixed(1)} kW</span></div>
        </CardContent></Card>
        <Card size="sm"><CardContent>
          <div className="text-xs text-muted-foreground mb-0.5">应急可卸载</div>
          <div className="text-lg font-bold tabular-nums">{kpis.shedPct}% <span className="text-xs font-normal text-muted-foreground">· 双通道{kpis.dualCh} 单通道{kpis.singleCh}</span></div>
        </CardContent></Card>
      </div>

      {/* Power curves */}
      <div className={`grid gap-3 ${has800 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <Card size="sm"><CardContent className="pt-3">
          <PowerCurve data={chart270} label="270V 功率曲线" color="var(--chart-1)" />
        </CardContent></Card>
        <Card size="sm"><CardContent className="pt-3">
          <PowerCurve data={chart28} label="28V 功率曲线" color="var(--chart-4)" />
        </CardContent></Card>
        {has800 && (
          <Card size="sm"><CardContent className="pt-3">
            <PowerCurve data={chart800} label="800V 功率曲线" color="var(--chart-2)" />
          </CardContent></Card>
        )}
      </div>

      {/* Data Insights */}
      <div className="rounded-lg border border-chart-1/20 bg-chart-1/5 px-4 py-2.5 space-y-1">
        <p className="text-xs"><span className="font-semibold text-chart-1">800V 电推进 {kpis.sum800.toFixed(0)}kW 占全机负载 {((kpis.sum800 / (kpis.sum270 + kpis.sum28 + kpis.sum800 || 1)) * 100).toFixed(0)}%</span></p>
        {phasePowers.length > 0 && (() => {
          const g4 = phasePowers.find(p => p.phase === 'G4');
          const g5 = phasePowers.find(p => p.phase === 'G5');
          const ratio = g4 && g5 && (g5.peak270 + g5.peak28 + g5.peak800) > 0
            ? ((g4.peak270 + g4.peak28 + g4.peak800) / (g5.peak270 + g5.peak28 + g5.peak800)).toFixed(1) : null;
          return ratio ? <p className="text-xs text-muted-foreground">起飞阶段(G4)功率是巡航(G5)的 {ratio} 倍</p> : null;
        })()}
        <p className="text-xs text-muted-foreground">28V 系统 {kpis.cnt28} 台设备仅 {kpis.sum28.toFixed(1)}kW — 管理复杂度高但功率占比低</p>
      </div>

      {/* Energy + Stats table side by side */}
      <div className="grid grid-cols-5 gap-3">
        {/* Energy bars */}
        <Card size="sm" className="col-span-2">
          <CardHeader><CardTitle>电量需求 <span className="ml-1 text-xs font-normal text-muted-foreground">{totalEnergy.toFixed(1)} kWh</span></CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {phasePowers.map(d => {
                const maxE = Math.max(...phasePowers.map(p => p.energy), 0.1);
                return (
                  <div key={d.phase} className="flex items-center gap-2">
                    <span className="w-7 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{d.phase}</span>
                    <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                      <div className="h-full rounded bg-chart-1"
                        style={{ width: `${(d.energy / maxE) * 100}%`, opacity: 0.3 + 0.7 * (d.energy / maxE) }} />
                    </div>
                    <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{d.energy > 0 ? d.energy.toFixed(1) : '0'}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Phase stats table */}
        <Card size="sm" className="col-span-3">
          <CardHeader><CardTitle>峰值功率统计</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1 text-left font-medium">阶段</th>
                  <th className="py-1 text-right font-medium">时长</th>
                  <th className="py-1 text-right font-medium">270V峰值</th>
                  <th className="py-1 text-right font-medium">28V峰值</th>
                  <th className="py-1 text-right font-medium">800V峰值</th>
                  <th className="py-1 text-right font-medium">总计</th>
                  <th className="py-1 text-right font-medium">270V应急</th>
                  <th className="py-1 text-right font-medium">28V应急</th>
                </tr>
              </thead>
              <tbody>
                {phasePowers.map(p => (
                  <tr key={p.phase} className="border-b border-border/40">
                    <td className="py-1 text-foreground/80">{p.phase} {p.name}</td>
                    <td className="py-1 text-right tabular-nums">{p.duration}m</td>
                    <td className="py-1 text-right tabular-nums">{p.peak270.toFixed(1)}</td>
                    <td className="py-1 text-right tabular-nums">{p.peak28.toFixed(1)}</td>
                    <td className="py-1 text-right tabular-nums">{p.peak800.toFixed(1)}</td>
                    <td className="py-1 text-right tabular-nums font-medium">{(p.peak270+p.peak28+p.peak800).toFixed(1)}</td>
                    <td className="py-1 text-right tabular-nums text-muted-foreground">{p.emerg270.toFixed(1)}</td>
                    <td className="py-1 text-right tabular-nums text-muted-foreground">{p.emerg28.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
