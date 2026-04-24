import { useEffect, useState, useMemo } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Configuration, ConfigDiffResponse } from '../../types';
import { diffConfigs } from '../../api/configurations';

interface Props {
  configs: Configuration[];
}

const ATA_NAMES: Record<string, string> = {
  '11': '标牌与标识', '21': '空调系统', '23': '通信系统', '24': '电源系统',
  '25': '设备/装饰', '26': '防火', '27': '飞行控制', '30': '防除冰', '31': '指示/记录',
  '32': '起落架', '33': '照明系统', '34': '导航系统', '35': '氧气', '38': '水/废水',
  '42': '机载网络', '44': '客舱系统', '46': '信息系统', '52': '舱门',
  '86': '电推进', '87': '试飞改装', '90': '自主飞行', '92': '地面网联',
};

const FIELD_LABELS: Record<string, string> = {
  dimensions_mm: '尺寸', has_eicd: 'EICD', is_electrical: '电设备',
  install_method: '安装方式', bonding_type: '搭接类型', bonding_method: '搭接方式',
  mass_kg: '重量(kg)', power_redundancy: '供电余度',
};

function fmtVal(v: any): string {
  if (v === null || v === undefined) return '-';
  if (v === true) return '是';
  if (v === false) return '否';
  return String(v);
}

interface ATAGroup {
  ata: string;
  name: string;
  countA: number;
  countB: number;
  onlyA: string[];
  onlyB: string[];
  changed: { name: string; changes: Record<string, any> }[];
  common: string[];
}

export function ConfigDiff({ configs }: Props) {
  const [configA, setConfigA] = useState('');
  const [configB, setConfigB] = useState('');
  const [diff, setDiff] = useState<ConfigDiffResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedATA, setSelectedATA] = useState<ATAGroup | null>(null);

  useEffect(() => {
    if (configs.length >= 2 && !configA && !configB) {
      setConfigA(configs[0].id);
      setConfigB(configs[1].id);
    }
  }, [configs, configA, configB]);

  useEffect(() => {
    if (configA && configB) {
      setLoading(true);
      diffConfigs(configA, configB)
        .then(setDiff)
        .catch(() => setDiff(null))
        .finally(() => setLoading(false));
    }
  }, [configA, configB]);

  const nameA = configs.find(c => c.id === configA)?.version || '';
  const nameB = configs.find(c => c.id === configB)?.version || '';

  const ataGroups = useMemo(() => {
    if (!diff) return [];
    const groups: Record<string, ATAGroup> = {};
    const ensure = (ata: string) => {
      if (!groups[ata]) groups[ata] = { ata, name: ATA_NAMES[ata] || `ATA-${ata}`, countA: 0, countB: 0, onlyA: [], onlyB: [], changed: [], common: [] };
      return groups[ata];
    };
    for (const item of diff.removed) { const g = ensure(item.ata_chapter); g.onlyA.push(item.name); g.countA++; }
    for (const item of diff.added) { const g = ensure(item.ata_chapter); g.onlyB.push(item.name); g.countB++; }
    for (const item of diff.modified) { const g = ensure(item.ata_chapter); g.changed.push({ name: item.name, changes: item.changes || {} }); g.countA++; g.countB++; }
    for (const item of diff.unchanged) { const g = ensure(item.ata_chapter); g.common.push(item.name); g.countA++; g.countB++; }
    return Object.values(groups).sort((a, b) => (b.countA + b.countB) - (a.countA + a.countB));
  }, [diff]);

  const maxCount = Math.max(...ataGroups.map(g => Math.max(g.countA, g.countB)), 1);

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="flex items-center gap-3">
        <Select value={configA} onValueChange={(v) => { if (v) setConfigA(v); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="基线构型">{nameA}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {configs.map(c => (<SelectItem key={c.id} value={c.id}>{c.version}</SelectItem>))}
          </SelectContent>
        </Select>
        <ArrowRight className="size-4 text-muted-foreground" />
        <Select value={configB} onValueChange={(v) => { if (v) setConfigB(v); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="对比构型">{nameB}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {configs.map(c => (<SelectItem key={c.id} value={c.id}>{c.version}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {loading && <div className="py-16 text-center text-sm text-muted-foreground">加载中...</div>}

      {!loading && diff && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-3">
            <Card size="sm">
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{diff.impact_summary.equipment_common}</div>
                <div className="text-xs text-muted-foreground">共有设备</div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-chart-1">{diff.added.length}</div>
                <div className="text-xs text-muted-foreground">仅 {nameB}</div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-status-danger">{diff.removed.length}</div>
                <div className="text-xs text-muted-foreground">仅 {nameA}</div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-status-warn">{diff.modified.length}</div>
                <div className="text-xs text-muted-foreground">有差异</div>
              </CardContent>
            </Card>
          </div>

          {/* Butterfly chart */}
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>按 ATA 系统对比</CardTitle>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-chart-1/25" /> 共有</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-status-danger" /> 仅{nameA}</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-chart-1" /> 仅{nameB}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Column headers */}
              <div className="flex items-center gap-1 mb-2 text-xs font-medium text-muted-foreground">
                <span className="w-8 shrink-0 text-right">{nameA}</span>
                <div className="flex-1" />
                <div className="w-24 shrink-0 text-center">ATA</div>
                <div className="flex-1" />
                <span className="w-8 shrink-0">{nameB}</span>
              </div>
              <Separator className="mb-2" />

              <div className="space-y-px">
                {ataGroups.map(g => {
                  const hasDiff = g.onlyA.length > 0 || g.onlyB.length > 0 || g.changed.length > 0;
                  const diffCount = g.onlyA.length + g.onlyB.length + g.changed.length;
                  const pctA = (g.countA / maxCount) * 100;
                  const pctB = (g.countB / maxCount) * 100;

                  return (
                    <div
                      key={g.ata}
                      className={cn(
                        "flex items-center gap-1 rounded px-1 py-[5px] transition-colors",
                        hasDiff && "cursor-pointer hover:bg-accent",
                      )}
                      onClick={() => hasDiff && setSelectedATA(g)}
                    >
                      {/* Count A */}
                      <span className={cn("w-8 shrink-0 text-right text-xs tabular-nums", hasDiff ? "text-foreground" : "text-muted-foreground/50")}>
                        {g.countA || ''}
                      </span>

                      {/* Bar A (grows right-to-left) */}
                      <div className="flex-1 flex justify-end">
                        <div className="h-[18px] rounded-l flex overflow-hidden" style={{ width: `${pctA}%`, minWidth: g.countA > 0 ? 3 : 0 }}>
                          {g.onlyA.length > 0 && (
                            <div className="h-full bg-status-danger" style={{ width: `${(g.onlyA.length / g.countA) * 100}%` }} />
                          )}
                          <div className={cn("h-full flex-1", hasDiff ? "bg-chart-1/25" : "bg-muted")} />
                        </div>
                      </div>

                      {/* ATA label */}
                      <div className="w-24 shrink-0 text-center flex items-center justify-center gap-1">
                        <span className={cn("text-xs", hasDiff ? "font-medium text-foreground" : "text-muted-foreground/50")}>
                          {g.name}
                        </span>
                        {diffCount > 0 && (
                          <Badge variant="secondary" className="h-4 px-1 text-xs tabular-nums">{diffCount}</Badge>
                        )}
                      </div>

                      {/* Bar B (grows left-to-right) */}
                      <div className="flex-1 flex justify-start">
                        <div className="h-[18px] rounded-r flex overflow-hidden" style={{ width: `${pctB}%`, minWidth: g.countB > 0 ? 3 : 0 }}>
                          <div className={cn("h-full flex-1", hasDiff ? "bg-chart-1/25" : "bg-muted")} />
                          {g.onlyB.length > 0 && (
                            <div className="h-full bg-chart-1" style={{ width: `${(g.onlyB.length / g.countB) * 100}%` }} />
                          )}
                        </div>
                      </div>

                      {/* Count B */}
                      <span className={cn("w-8 shrink-0 text-xs tabular-nums", hasDiff ? "text-foreground" : "text-muted-foreground/50")}>
                        {g.countB || ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ATA detail dialog */}
      <Dialog open={!!selectedATA} onOpenChange={(open) => !open && setSelectedATA(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          {selectedATA && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Badge variant="outline" className="tabular-nums">ATA-{selectedATA.ata}</Badge>
                  {selectedATA.name}
                  <span className="text-sm font-normal text-muted-foreground ml-auto">
                    {nameA} {selectedATA.countA}台 / {nameB} {selectedATA.countB}台
                  </span>
                </DialogTitle>
              </DialogHeader>
              <Separator />
              <ATADetailView group={selectedATA} nameA={nameA} nameB={nameB} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── ATA Detail: Side-by-side diff view ─── */

function ATADetailView({ group, nameA, nameB }: { group: ATAGroup; nameA: string; nameB: string }) {
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set());

  const toggleExpand = (name: string) => {
    setExpandedNames(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  type Row = { name: string; type: 'common' | 'modified' | 'only-a' | 'only-b'; changes?: Record<string, any> };
  const rows: Row[] = [
    ...group.changed.map(item => ({ name: item.name, type: 'modified' as const, changes: item.changes })),
    ...group.onlyA.map(name => ({ name, type: 'only-a' as const })),
    ...group.onlyB.map(name => ({ name, type: 'only-b' as const })),
    ...group.common.map(name => ({ name, type: 'common' as const })),
  ];

  return (
    <div className="flex-1 overflow-y-auto -mx-6 px-6">
      {/* Column headers */}
      <div className="sticky top-0 z-10 grid grid-cols-2 border-b bg-background">
        <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-r">{nameA}</div>
        <div className="px-4 py-2 text-xs font-medium text-muted-foreground">{nameB}</div>
      </div>

      {rows.map((row, i) => {
        const isExpanded = expandedNames.has(row.name);
        const stripe = i % 2 === 0 ? '' : 'bg-muted/20';

        if (row.type === 'common') {
          return (
            <div key={row.name} className={cn("grid grid-cols-2", stripe)}>
              <div className="px-4 py-1.5 text-[13px] text-muted-foreground/60 border-r">{row.name}</div>
              <div className="px-4 py-1.5 text-[13px] text-muted-foreground/60">{row.name}</div>
            </div>
          );
        }

        if (row.type === 'only-a') {
          return (
            <div key={row.name} className={cn("grid grid-cols-2", stripe)}>
              <div className="px-4 py-1.5 text-[13px] font-medium border-r border-l-2 border-l-status-danger">{row.name}</div>
              <div className="px-4 py-1.5 text-[13px] text-muted-foreground/30">—</div>
            </div>
          );
        }

        if (row.type === 'only-b') {
          return (
            <div key={row.name} className={cn("grid grid-cols-2", stripe)}>
              <div className="px-4 py-1.5 text-[13px] text-muted-foreground/30 border-r">—</div>
              <div className="px-4 py-1.5 text-[13px] font-medium border-l-2 border-l-chart-1">{row.name}</div>
            </div>
          );
        }

        return (
          <div key={row.name}>
            <div
              className={cn("grid grid-cols-2 cursor-pointer hover:bg-accent/50 transition-colors", stripe)}
              onClick={() => toggleExpand(row.name)}
            >
              <div className="px-4 py-1.5 text-[13px] font-medium border-r border-l-2 border-l-status-warn flex items-center gap-1.5">
                <ChevronDown className={cn("size-3 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                {row.name}
              </div>
              <div className="px-4 py-1.5 text-[13px] font-medium border-l-2 border-l-status-warn flex items-center justify-between">
                {row.name}
                <Badge variant="outline" className="text-xs h-4 tabular-nums">{Object.keys(row.changes || {}).length}</Badge>
              </div>
            </div>
            {isExpanded && row.changes && (
              <div className="grid grid-cols-2 bg-muted/30 border-y border-border/50">
                {Object.entries(row.changes).map(([field, vals]: [string, any]) => (
                  <div key={field} className="contents">
                    <div className="px-4 py-1 pl-9 text-xs border-r">
                      <span className="text-muted-foreground">{FIELD_LABELS[field] || field}: </span>
                      <span className="text-status-danger font-medium">{fmtVal(vals.from)}</span>
                    </div>
                    <div className="px-4 py-1 pl-4 text-xs">
                      <span className="text-muted-foreground">{FIELD_LABELS[field] || field}: </span>
                      <span className="text-chart-1 font-medium">{fmtVal(vals.to)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
