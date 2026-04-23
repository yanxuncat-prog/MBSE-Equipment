import { useMemo, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StatsCard } from '@/components/workstation/shared/StatsCard';
import { StatsRow } from '@/components/workstation/shared/StatsRow';
import { ProfessionalTable } from '@/components/workstation/shared/ProfessionalTable';
import type { Column } from '@/components/workstation/shared/ProfessionalTable';
import { ProfessionalPanel } from '@/components/workstation/shared/ProfessionalPanel';
import { SimpleDonut } from '@/components/workstation/charts/SimpleDonut';
import { HorizontalBar } from '@/components/workstation/charts/HorizontalBar';
import type { Equipment, ValidationReport } from '@/types';

interface Props {
  equipment: Equipment[];
  report?: ValidationReport | null;
  onSelect: (equip: Equipment) => void;
}

const GROUP_META: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  '面搭接': { color: '#34C759', bg: 'bg-green-50', border: 'border-green-200', icon: '■' },
  '线搭接': { color: '#1E40AF', bg: 'bg-blue-50', border: 'border-blue-200', icon: '━' },
  '无接地/TBD': { color: '#FF9500', bg: 'bg-orange-50', border: 'border-orange-200', icon: '○' },
  '缺搭接数据': { color: '#FF3B30', bg: 'bg-red-50', border: 'border-red-200', icon: '⚠' },
};

/* ------------------------------------------------------------------ */
/* BondingTab Component                                                */
/* ------------------------------------------------------------------ */
export function BondingTab({ equipment, onSelect }: Props) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['缺搭接数据']));

  const toggleGroup = useCallback((key: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  /* ---- Group equipment ---- */
  const surfaceBond = useMemo(() => equipment.filter(e => e.shell_grounding_method === '面搭接'), [equipment]);
  const wireBond = useMemo(() => equipment.filter(e => e.shell_grounding_method === '线搭接'), [equipment]);
  const noGround = useMemo(
    () => equipment.filter(e => e.shell_grounding_method != null && e.shell_grounding_method !== '' && ['无', 'TBD'].includes(e.shell_grounding_method)),
    [equipment],
  );
  const missingBond = useMemo(
    () => equipment.filter(e => !e.shell_grounding_method || e.shell_grounding_method === ''),
    [equipment],
  );

  /* ---- Shell material stats ---- */
  const metalShell = useMemo(() => equipment.filter(e => e.is_metal_shell === true).length, [equipment]);
  const nonMetalShell = useMemo(() => equipment.filter(e => e.is_metal_shell === false).length, [equipment]);
  const unknownShell = useMemo(() => equipment.filter(e => e.is_metal_shell == null).length, [equipment]);

  /* ---- Non-metal on composite count (simulated) ---- */
  const nonMetalOnComposite = useMemo(() => equipment.filter(e => e.is_metal_shell === false).length, [equipment]);

  /* ---- Donut: grounding method distribution ---- */
  const groundingSegments = useMemo(() => {
    return [
      { label: '面搭接', value: surfaceBond.length, color: '#34C759' },
      { label: '线搭接', value: wireBond.length, color: '#1E40AF' },
      { label: '无/TBD', value: noGround.length, color: '#FF9500' },
      { label: '未知', value: missingBond.length, color: '#d1d1d6' },
    ].filter(s => s.value > 0);
  }, [surfaceBond, wireBond, noGround, missingBond]);

  /* ---- Donut: shell material ---- */
  const shellSegments = useMemo(() => {
    return [
      { label: '金属壳体', value: metalShell, color: '#5ac8fa' },
      { label: '非金属壳体', value: nonMetalShell, color: '#ff9500' },
      { label: '未知', value: unknownShell, color: '#d1d1d6' },
    ].filter(s => s.value > 0);
  }, [metalShell, nonMetalShell, unknownShell]);

  /* ---- Bar: bonding type distribution ---- */
  const bondingTypeItems = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const e of equipment) {
      const key = e.config_data?.bonding_type || '未知';
      groups[key] = (groups[key] || 0) + 1;
    }
    return Object.entries(groups)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [equipment]);

  /* ---- Table columns ---- */
  const columns: Column<Equipment>[] = [
    { title: 'LIN号', dataIndex: 'lin_number', key: 'lin_number', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
    {
      title: '壳体金属', key: 'metal_shell', width: 80,
      render: (_, r) => {
        if (r.is_metal_shell === true) return <Badge className="bg-blue-500 text-white">是</Badge>;
        if (r.is_metal_shell === false) return <Badge className="bg-orange-500 text-white">否</Badge>;
        return <span className="text-muted-foreground/50">-</span>;
      },
    },
    {
      title: '接地方式', key: 'grounding', width: 85,
      render: (_, r) => {
        const m = r.shell_grounding_method;
        if (!m) return <span className="text-muted-foreground/50">-</span>;
        const colorMap: Record<string, string> = {
          '面搭接': 'bg-green-500 text-white',
          '线搭接': 'bg-blue-700 text-white',
          '无': 'bg-muted text-muted-foreground',
          'TBD': 'bg-muted text-muted-foreground',
        };
        return <Badge className={colorMap[m] || 'bg-muted text-muted-foreground'}>{m}</Badge>;
      },
    },
    { title: '搭接类型', key: 'bonding_type', width: 90, render: (_, r) => r.config_data?.bonding_type || '-' },
    { title: '阻值(mΩ)', key: 'resistance', width: 80, render: (_, r) => r.config_data?.bonding_resistance || '-' },
    { title: '搭接位置', key: 'bonding_pos', width: 120, render: (_, r) => r.config_data?.bonding_position || '-' },
    { title: '故障路径', key: 'fault_path', width: 100, render: (_, r) => r.shell_grounding_fault_path || '-' },
    {
      title: 'PACE图纸', key: 'pace', width: 75,
      render: (_, r) => {
        if (r.config_data?.in_pace_drawing === true) return <Badge className="bg-green-500 text-white">有</Badge>;
        if (r.config_data?.in_pace_drawing === false) return <Badge variant="secondary">无</Badge>;
        return <span className="text-muted-foreground/50">-</span>;
      },
    },
    { title: '物理特性', key: 'physical', width: 150, render: (_, r) => r.physical_characteristics || '-' },
  ];

  /* ---- Group data for collapsible panels ---- */
  const groups = useMemo(() => [
    { key: '面搭接', label: '面搭接', data: surfaceBond },
    { key: '线搭接', label: '线搭接', data: wireBond },
    { key: '无接地/TBD', label: '无接地/TBD', data: noGround },
    { key: '缺搭接数据', label: '缺搭接数据', data: missingBond },
  ], [surfaceBond, wireBond, noGround, missingBond]);

  /* ---- Banner ---- */
  const bannerStyle = missingBond.length > 20
    ? { dot: 'bg-red-500', bg: 'bg-red-50 border-red-200', text: 'text-red-600' }
    : missingBond.length > 5
      ? { dot: 'bg-orange-500', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-600' }
      : { dot: 'bg-green-500', bg: 'bg-green-50 border-green-200', text: 'text-green-600' };

  const summaryText: Record<string, string> = {
    '面搭接': '标准搭接方式',
    '线搭接': '线性搭接连接',
    '无接地/TBD': '需确认接地方案',
    '缺搭接数据': '需补充搭接信息',
  };

  return (
    <div className="flex h-[calc(100vh-180px)]">
      <div className="flex-1 overflow-auto pr-4">
        {/* Hook Banner */}
        <div className={cn('flex items-center gap-2 rounded-md border px-4 py-2.5 mb-3', bannerStyle.bg)}>
          <div className={cn('size-2 shrink-0 rounded-full', bannerStyle.dot)} />
          <span className="text-[13px] text-foreground">
            <strong>{nonMetalOnComposite}</strong> 台非金属壳体设备安装在复材结构上。
            <span className="font-bold text-red-500">{missingBond.length} 台</span>设备缺少搭接数据。
          </span>
        </div>

        {/* Stats Row */}
        <StatsRow>
          <StatsCard label="面搭接数" value={surfaceBond.length} color="#34C759" />
          <StatsCard label="线搭接数" value={wireBond.length} color="#1E40AF" />
          <StatsCard label="无接地" value={noGround.length} color="#FF9500" />
          <StatsCard label="缺数据" value={missingBond.length} color="#FF3B30" />
        </StatsRow>

        {/* Grouped Collapsible Tables */}
        <div className="mt-3 space-y-2">
          {groups.map(group => {
            const meta = GROUP_META[group.key] || GROUP_META['缺搭接数据'];
            const isOpen = openGroups.has(group.key);
            return (
              <div key={group.key} className={cn('rounded-lg border', meta.bg, meta.border)}>
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-center justify-between p-3 text-sm font-semibold hover:bg-muted/50"
                >
                  <span className="flex items-center gap-2">
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                    <span>{group.label}</span>
                    <span
                      className="inline-flex min-w-[28px] items-center justify-center rounded-full px-2 text-[11px] font-bold text-white"
                      style={{ background: meta.color }}
                    >
                      {group.data.length}
                    </span>
                    {group.data.length > 0 && (
                      <span className="text-[11px] font-normal text-muted-foreground">
                        {summaryText[group.key]}
                      </span>
                    )}
                  </span>
                  <ChevronDown className={cn('size-4 transition-transform', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div className="border-t p-0">
                    {group.data.length > 0 ? (
                      <ProfessionalTable
                        columns={columns}
                        dataSource={group.data}
                        onRow={(record) => ({ onClick: () => onSelect(record) })}
                      />
                    ) : (
                      <div className="py-4 text-center text-xs text-muted-foreground">此分组无设备</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel */}
      <ProfessionalPanel>
        <Card size="sm">
          <CardHeader>
            <CardTitle>接地方式分布</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleDonut segments={groundingSegments} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>壳体材质</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleDonut segments={shellSegments} />
            <div className="mt-2 rounded border border-orange-200 bg-orange-50 px-2 py-1 text-center text-[10px] text-orange-500">
              非金属壳体设备需额外接地处理
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>搭接类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBar items={bondingTypeItems} />
          </CardContent>
        </Card>
      </ProfessionalPanel>
    </div>
  );
}
