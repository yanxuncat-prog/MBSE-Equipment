import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { StatsRow } from '@/components/workstation/shared/StatsRow';
import { StatsCard } from '@/components/workstation/shared/StatsCard';
import { ProfessionalTable, type Column } from '../shared/ProfessionalTable';
import { useConfigStore } from '@/store/configStore';
import { listDO160Categories, listDO160, getDO160Summary } from '@/api/do160';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Equipment, DO160Record, DO160Category, DO160Summary } from '@/types';

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
interface Props {
  equipment: Equipment[];
  onSelect: (e: Equipment) => void;
  onEdit?: (e: Equipment) => void;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
function complianceLabel(status: string): string {
  if (status === 'compliant') return '符合';
  if (status === 'non_compliant') return '不符合';
  if (status === 'pending') return '待确认';
  return status;
}

function flowColor(status: string): string {
  if (status === 'compliant' || status === '符合') return 'var(--status-ok)';
  if (status === 'non_compliant' || status === '不符合') return 'var(--status-danger)';
  if (status === 'pending' || status === '待确认') return 'var(--status-warn)';
  return 'var(--chart-1)';
}

function flowOpacity(status: string): number {
  if (['compliant', 'non_compliant', 'pending'].includes(status)) return 0.3;
  return 0.2;
}

function nodeColor(label: string, side: 'left' | 'right'): string {
  if (side === 'right') {
    if (label === '符合') return 'var(--status-ok)';
    if (label === '不符合') return 'var(--status-danger)';
    if (label === '待确认') return 'var(--status-warn)';
  }
  return 'var(--chart-1)';
}

function complianceBadge(status: string) {
  const label = complianceLabel(status);
  if (status === 'compliant')
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">{label}</Badge>;
  if (status === 'non_compliant')
    return <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400">{label}</Badge>;
  if (status === 'pending')
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">{label}</Badge>;
  return <Badge variant="secondary">{label}</Badge>;
}

/* ------------------------------------------------------------------ */
/* Sankey layout engine (pure geometry)                                */
/* ------------------------------------------------------------------ */
interface SankeyFlow {
  from: string;
  to: string;
  count: number;
}

interface SankeyNode {
  label: string;
  count: number;
  y: number;
  height: number;
}

interface LayoutResult {
  leftNodes: SankeyNode[];
  rightNodes: SankeyNode[];
  flows: Array<SankeyFlow & {
    srcY: number;
    srcH: number;
    dstY: number;
    dstH: number;
  }>;
  width: number;
  height: number;
}

function computeSankeyLayout(
  records: DO160Record[],
  svgWidth: number,
): LayoutResult {
  // 1. Build flows: design_level -> compliance_status
  const flowMap = new Map<string, number>();
  for (const r of records) {
    const from = r.design_level?.trim() || '无数据';
    const to = complianceLabel(r.compliance_status);
    const key = `${from}|||${to}`;
    flowMap.set(key, (flowMap.get(key) ?? 0) + 1);
  }

  const flows: SankeyFlow[] = [];
  for (const [key, count] of flowMap) {
    const [from, to] = key.split('|||');
    flows.push({ from, to, count });
  }

  // 2. Aggregate nodes
  const leftMap = new Map<string, number>();
  const rightMap = new Map<string, number>();
  for (const f of flows) {
    leftMap.set(f.from, (leftMap.get(f.from) ?? 0) + f.count);
    rightMap.set(f.to, (rightMap.get(f.to) ?? 0) + f.count);
  }

  const sortNodes = (entries: [string, number][]) =>
    entries.sort((a, b) => {
      if (a[0] === '无数据') return 1;
      if (b[0] === '无数据') return -1;
      return b[1] - a[1];
    });

  const leftEntries = sortNodes([...leftMap.entries()]);
  const rightEntries = sortNodes([...rightMap.entries()]);

  // 3. Vertical layout
  const total = records.length || 1;
  const nodePadding = 12;
  const nodeMinHeight = 28;
  const availableHeight = Math.max(
    280,
    Math.max(leftEntries.length, rightEntries.length) * (nodeMinHeight + nodePadding) + 40,
  );

  const layoutNodes = (entries: [string, number][]): SankeyNode[] => {
    const totalPad = (entries.length - 1) * nodePadding;
    const usable = availableHeight - totalPad;
    let y = 0;
    return entries.map(([label, count]) => {
      const rawH = (count / total) * usable;
      const height = Math.max(nodeMinHeight, rawH);
      const node: SankeyNode = { label, count, y, height };
      y += height + nodePadding;
      return node;
    });
  };

  const leftNodes = layoutNodes(leftEntries);
  const rightNodes = layoutNodes(rightEntries);

  const colHeight = (nodes: SankeyNode[]) => {
    if (nodes.length === 0) return 0;
    const last = nodes[nodes.length - 1];
    return last.y + last.height;
  };
  const svgHeight = Math.max(colHeight(leftNodes), colHeight(rightNodes)) + 20;

  // 4. Map flows to pixel positions
  const leftConsumed = new Map<string, number>();
  const rightConsumed = new Map<string, number>();
  const leftNodeMap = new Map(leftNodes.map(n => [n.label, n]));
  const rightNodeMap = new Map(rightNodes.map(n => [n.label, n]));

  const leftOrder = new Map(leftEntries.map(([l], i) => [l, i]));
  const rightOrder = new Map(rightEntries.map(([l], i) => [l, i]));
  flows.sort((a, b) => {
    const la = leftOrder.get(a.from) ?? 99;
    const lb = leftOrder.get(b.from) ?? 99;
    if (la !== lb) return la - lb;
    return (rightOrder.get(a.to) ?? 99) - (rightOrder.get(b.to) ?? 99);
  });

  const mappedFlows = flows.map(f => {
    const srcNode = leftNodeMap.get(f.from)!;
    const dstNode = rightNodeMap.get(f.to)!;
    const srcOffset = leftConsumed.get(f.from) ?? 0;
    const dstOffset = rightConsumed.get(f.to) ?? 0;

    const srcH = (f.count / srcNode.count) * srcNode.height;
    const dstH = (f.count / dstNode.count) * dstNode.height;

    const result = {
      ...f,
      srcY: srcNode.y + srcOffset,
      srcH,
      dstY: dstNode.y + dstOffset,
      dstH,
    };
    leftConsumed.set(f.from, srcOffset + srcH);
    rightConsumed.set(f.to, dstOffset + dstH);
    return result;
  });

  return { leftNodes, rightNodes, flows: mappedFlows, width: svgWidth, height: svgHeight };
}

/* ------------------------------------------------------------------ */
/* SVG Sankey Component                                                */
/* ------------------------------------------------------------------ */
const NODE_WIDTH = 18;
const NODE_RADIUS = 4;

function SankeyDiagram({ records, categoryLabel }: { records: DO160Record[]; categoryLabel: string }) {
  const layout = useMemo(() => computeSankeyLayout(records, 600), [records]);

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        暂无数据
      </div>
    );
  }

  const { leftNodes, rightNodes, flows, width, height } = layout;

  const leftX = 110;
  const rightX = width - 110;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ maxHeight: Math.min(height, 500) }}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`DO-160 ${categoryLabel} 鉴定流向图`}
    >
      <title>DO-160 {categoryLabel} 鉴定流向图</title>
      {/* Flows */}
      {flows.map((f, i) => {
        const x0 = leftX + NODE_WIDTH;
        const x1 = rightX;
        const cpx = (x0 + x1) / 2;

        const y0Top = f.srcY;
        const y0Bot = f.srcY + f.srcH;
        const y1Top = f.dstY;
        const y1Bot = f.dstY + f.dstH;

        const d = [
          `M ${x0} ${y0Top}`,
          `C ${cpx} ${y0Top}, ${cpx} ${y1Top}, ${x1} ${y1Top}`,
          `L ${x1} ${y1Bot}`,
          `C ${cpx} ${y1Bot}, ${cpx} ${y0Bot}, ${x0} ${y0Bot}`,
          'Z',
        ].join(' ');

        const color = flowColor(f.to === '符合' ? 'compliant' : f.to === '不符合' ? 'non_compliant' : f.to === '待确认' ? 'pending' : f.to);
        const opacity = flowOpacity(f.to === '符合' ? 'compliant' : f.to === '不符合' ? 'non_compliant' : f.to === '待确认' ? 'pending' : f.to);

        return (
          <g key={i}>
            <path
              d={d}
              fill={color}
              opacity={opacity}
              stroke={color}
              strokeWidth={0.5}
              strokeOpacity={0.4}
            />
            {f.count > 0 && (
              <text
                x={(x0 + x1) / 2}
                y={(f.srcY + f.srcH / 2 + f.dstY + f.dstH / 2) / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-muted-foreground"
                fontSize={11}
                fontWeight={500}
              >
                {f.count}
              </text>
            )}
          </g>
        );
      })}

      {/* Left nodes */}
      {leftNodes.map(node => (
        <g key={`L-${node.label}`}>
          <rect
            x={leftX}
            y={node.y}
            width={NODE_WIDTH}
            height={node.height}
            rx={NODE_RADIUS}
            ry={NODE_RADIUS}
            fill={nodeColor(node.label, 'left')}
            opacity={0.85}
          />
          <text
            x={leftX - 6}
            y={node.y + node.height / 2}
            textAnchor="end"
            dominantBaseline="central"
            className="fill-foreground"
            fontSize={12}
            fontWeight={600}
          >
            {node.label}
          </text>
          <text
            x={leftX - 6}
            y={node.y + node.height / 2 + 14}
            textAnchor="end"
            dominantBaseline="central"
            className="fill-muted-foreground"
            fontSize={10}
          >
            {node.count} 台
          </text>
        </g>
      ))}

      {/* Right nodes */}
      {rightNodes.map(node => (
        <g key={`R-${node.label}`}>
          <rect
            x={rightX}
            y={node.y}
            width={NODE_WIDTH}
            height={node.height}
            rx={NODE_RADIUS}
            ry={NODE_RADIUS}
            fill={nodeColor(node.label, 'right')}
            opacity={0.85}
          />
          <text
            x={rightX + NODE_WIDTH + 6}
            y={node.y + node.height / 2}
            textAnchor="start"
            dominantBaseline="central"
            className="fill-foreground"
            fontSize={12}
            fontWeight={600}
          >
            {node.label}
          </text>
          <text
            x={rightX + NODE_WIDTH + 6}
            y={node.y + node.height / 2 + 14}
            textAnchor="start"
            dominantBaseline="central"
            className="fill-muted-foreground"
            fontSize={10}
          >
            {node.count} 台
          </text>
        </g>
      ))}

      {/* Column headers */}
      <text
        x={leftX + NODE_WIDTH / 2}
        y={-6}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={11}
        fontWeight={500}
      >
        设计等级
      </text>
      <text
        x={rightX + NODE_WIDTH / 2}
        y={-6}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={11}
        fontWeight={500}
      >
        鉴定状态
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Compliance Summary Table (all categories view)                      */
/* ------------------------------------------------------------------ */
function ComplianceSummaryTable({ summary }: { summary: DO160Summary }) {
  const columns: Column<DO160Summary['categories'][0]>[] = useMemo(() => [
    {
      title: '类别名称',
      dataIndex: 'label',
      key: 'label',
      width: 180,
    },
    {
      title: '总数',
      dataIndex: 'total',
      key: 'total',
      width: 80,
      align: 'right',
    },
    {
      title: '符合',
      dataIndex: 'compliant',
      key: 'compliant',
      width: 80,
      align: 'right',
      render: (v: number) =>
        v > 0 ? (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
            {v}
          </Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        ),
    },
    {
      title: '不符合',
      dataIndex: 'non_compliant',
      key: 'non_compliant',
      width: 80,
      align: 'right',
      render: (v: number) =>
        v > 0 ? (
          <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400">
            {v}
          </Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        ),
    },
    {
      title: '待确认',
      dataIndex: 'pending',
      key: 'pending',
      width: 80,
      align: 'right',
      render: (v: number) =>
        v > 0 ? (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
            {v}
          </Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        ),
    },
    {
      title: '符合率',
      key: 'compliance_rate',
      width: 100,
      align: 'right',
      render: (_: any, record: DO160Summary['categories'][0]) => {
        const rate = record.total > 0
          ? ((record.compliant / record.total) * 100).toFixed(1)
          : '0.0';
        return (
          <span className={cn(
            "font-medium",
            Number(rate) >= 80 ? "text-[color:var(--status-ok)]" : Number(rate) >= 50 ? "text-[color:var(--status-warn)]" : "text-[color:var(--status-danger)]",
          )}>
            {rate}%
          </span>
        );
      },
    },
  ], []);

  return (
    <ProfessionalTable
      columns={columns}
      dataSource={summary.categories}
      rowKey="key"
      hideATA
    />
  );
}

/* ------------------------------------------------------------------ */
/* Device List Table (per-category view)                               */
/* ------------------------------------------------------------------ */
function DeviceListTable({
  records,
  equipment,
}: {
  records: DO160Record[];
  equipment: Equipment[];
}) {
  const equipName = useCallback(
    (equipId: string) => equipment.find(e => e.id === equipId)?.name ?? equipId,
    [equipment],
  );

  const columns: Column<DO160Record>[] = useMemo(() => [
    {
      title: 'LIN号',
      dataIndex: 'lin_number',
      key: 'lin_number',
      width: 120,
    },
    {
      title: '设计等级',
      dataIndex: 'design_level',
      key: 'design_level',
      width: 100,
      render: (v: string | null) => v ?? '-',
    },
    {
      title: '鉴定等级',
      dataIndex: 'qual_level',
      key: 'qual_level',
      width: 100,
      render: (v: string | null) => v ?? '-',
    },
    {
      title: '鉴定状态',
      dataIndex: 'compliance_status',
      key: 'compliance_status',
      width: 100,
      render: (v: string) => complianceBadge(v),
    },
    {
      title: '鉴定报告编号',
      dataIndex: 'qual_report_number',
      key: 'qual_report_number',
      width: 160,
      render: (v: string | null) => v ?? '-',
    },
  ], [equipName]);

  return (
    <ProfessionalTable
      columns={columns}
      dataSource={records}
      rowKey="id"
      maxHeight="400px"
      hideATA
    />
  );
}

/* ------------------------------------------------------------------ */
/* DO160Tab Component                                                  */
/* ------------------------------------------------------------------ */
export function DO160Tab({ equipment, onSelect: _onSelect, onEdit: _onEdit }: Props) {
  const { activeConfigId } = useConfigStore();
  const [categories, setCategories] = useState<DO160Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('__all__');
  const [records, setRecords] = useState<DO160Record[]>([]);
  const [summary, setSummary] = useState<DO160Summary | null>(null);

  /* ---------- Load categories ---------- */
  useEffect(() => {
    listDO160Categories()
      .then(setCategories)
      .catch(() => toast.error('DO-160 类别加载失败'));
  }, []);

  /* ---------- Load records ---------- */
  const loadRecords = useCallback(async () => {
    if (!activeConfigId) { setRecords([]); return; }
    try {
      const result = await listDO160({
        config_id: activeConfigId,
        test_category: selectedCategory !== '__all__' ? selectedCategory : undefined,
        limit: 5000,
      });
      setRecords(result.items);
    } catch {
      toast.error('DO-160 数据加载失败');
    }
  }, [activeConfigId, selectedCategory]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  /* ---------- Load summary ---------- */
  const loadSummary = useCallback(async () => {
    if (!activeConfigId) { setSummary(null); return; }
    try {
      const result = await getDO160Summary(activeConfigId);
      setSummary(result);
    } catch {
      // summary endpoint may not exist yet — silently fail
      setSummary(null);
    }
  }, [activeConfigId]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  /* ---------- KPI stats ---------- */
  const stats = useMemo(() => {
    const source = selectedCategory === '__all__' && summary
      ? {
          total: summary.total_records,
          compliant: summary.categories.reduce((s, c) => s + c.compliant, 0),
          nonCompliant: summary.categories.reduce((s, c) => s + c.non_compliant, 0),
          pending: summary.categories.reduce((s, c) => s + c.pending, 0),
        }
      : {
          total: records.length,
          compliant: records.filter(r => r.compliance_status === 'compliant').length,
          nonCompliant: records.filter(r => r.compliance_status === 'non_compliant').length,
          pending: records.filter(r => r.compliance_status === 'pending').length,
        };
    const compliancePct = source.total > 0
      ? ((source.compliant / source.total) * 100).toFixed(1)
      : '0.0';
    return { ...source, compliancePct };
  }, [records, summary, selectedCategory]);

  /* ---------- Selected category label ---------- */
  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategory === '__all__') return '全部类别';
    return categories.find(c => c.key === selectedCategory)?.label ?? selectedCategory;
  }, [selectedCategory, categories]);

  /* ---------- Render ---------- */
  if (!activeConfigId) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        请先选择一个构型
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">DO-160 环境鉴定</span>
        <Select value={selectedCategory} onValueChange={(v) => { if (v) setSelectedCategory(v); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue>{selectedCategoryLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部类别</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Row */}
      <StatsRow>
        <StatsCard label="总鉴定记录" value={stats.total} />
        <StatsCard
          label="符合数/率"
          value={
            <span>
              {stats.compliant}
              <span className="ml-1.5 text-sm font-medium text-[color:var(--status-ok)]">
                ({stats.compliancePct}%)
              </span>
            </span>
          }
        />
        <StatsCard
          label="不符合数"
          value={
            <span className="text-[color:var(--status-danger)]">{stats.nonCompliant}</span>
          }
        />
        <StatsCard
          label="待确认数"
          value={
            <span className="text-[color:var(--status-warn)]">{stats.pending}</span>
          }
        />
      </StatsRow>

      {/* Content: all-categories summary OR per-category Sankey + device table */}
      {selectedCategory === '__all__' ? (
        /* ---- All categories: compliance summary table ---- */
        summary && summary.categories.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>各类别鉴定符合性总览</CardTitle>
            </CardHeader>
            <CardContent>
              <ComplianceSummaryTable summary={summary} />
            </CardContent>
          </Card>
        ) : (
          <div className="py-12 text-center text-muted-foreground text-sm">
            暂无鉴定数据
          </div>
        )
      ) : (
        /* ---- Specific category: Sankey + device list ---- */
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                DO-160 {selectedCategoryLabel} — 设计等级 → 鉴定状态
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-4">
              <SankeyDiagram records={records} categoryLabel={selectedCategoryLabel} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>设备鉴定详情</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceListTable records={records} equipment={equipment} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
