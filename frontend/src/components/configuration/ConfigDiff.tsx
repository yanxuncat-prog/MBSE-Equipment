import { useEffect, useState } from 'react';
import { Plus, Minus, ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { ProfessionalTable, type Column } from '@/components/workstation/shared/ProfessionalTable';
import type { Configuration, ConfigDiffResponse, DiffItem } from '../../types';
import { diffConfigs } from '../../api/configurations';

interface Props {
  configs: Configuration[];
  defaultA?: string;
  defaultB?: string;
}

const CHANGE_CONFIG: Record<string, {
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  icon: React.ReactNode;
  text: string;
  color: string;
}> = {
  added: { variant: 'default', icon: <Plus className="size-3" />, text: '新增', color: 'text-green-600' },
  removed: { variant: 'destructive', icon: <Minus className="size-3" />, text: '移除', color: 'text-red-600' },
  modified: { variant: 'outline', icon: <ArrowLeftRight className="size-3" />, text: '变更', color: 'text-amber-600' },
};

export function ConfigDiff({ configs, defaultA, defaultB }: Props) {
  const [configA, setConfigA] = useState<string>(defaultA ?? '');
  const [configB, setConfigB] = useState<string>(defaultB ?? '');
  const [diff, setDiff] = useState<ConfigDiffResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOnlyDiff, setShowOnlyDiff] = useState(true);

  useEffect(() => {
    if (configA && configB && configA !== configB) {
      setLoading(true);
      diffConfigs(configA, configB)
        .then(setDiff)
        .catch(() => setDiff(null))
        .finally(() => setLoading(false));
    }
  }, [configA, configB]);

  const allItems: (DiffItem & { _type: string })[] = [
    ...(diff?.added || []).map(i => ({ ...i, _type: 'added' })),
    ...(diff?.removed || []).map(i => ({ ...i, _type: 'removed' })),
    ...(diff?.modified || []).map(i => ({ ...i, _type: 'modified' })),
  ];

  const columns: Column<DiffItem & { _type: string }>[] = [
    {
      title: '变更', dataIndex: '_type', key: 'type', width: 80,
      render: (t: string) => {
        const cfg = CHANGE_CONFIG[t] || { variant: 'secondary' as const, icon: null, text: t, color: '' };
        return (
          <Badge variant={cfg.variant} className="gap-1">
            {cfg.icon}{cfg.text}
          </Badge>
        );
      },
    },
    { title: '件号', dataIndex: 'part_number', key: 'pn', width: 120 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
    {
      title: '变更详情', dataIndex: 'changes', key: 'changes',
      render: (changes: Record<string, any> | null) => {
        if (!changes) return <span className="text-muted-foreground">-</span>;
        return Object.entries(changes).map(([field, vals]: [string, any]) => (
          <div key={field} className="text-xs">
            <span className="text-muted-foreground">{field}:</span>{' '}
            <span className="text-red-500 line-through">{String(vals.old)}</span>
            {' \u2192 '}
            <span className="text-green-600">{String(vals.new)}</span>
          </div>
        ));
      },
    },
  ];

  const netMass = diff?.impact_summary?.net_mass_change_kg || 0;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">基线:</span>
        <Select value={configA} onValueChange={(v) => { if (v) setConfigA(v); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="选择构型 A" />
          </SelectTrigger>
          <SelectContent>
            {configs.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.version} ({c.status})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">对比:</span>
        <Select value={configB} onValueChange={(v) => { if (v) setConfigB(v); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="选择构型 B" />
          </SelectTrigger>
          <SelectContent>
            {configs.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.version} ({c.status})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Checkbox
            id="only-diff"
            checked={showOnlyDiff}
            onCheckedChange={(checked) => setShowOnlyDiff(checked === true)}
          />
          <Label htmlFor="only-diff" className="text-sm cursor-pointer">
            仅差异
          </Label>
        </div>
      </div>

      {/* Statistics */}
      {diff && (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">新增</p>
            <div className="flex items-center gap-1.5">
              <Plus className="size-4 text-green-600" />
              <span className="text-2xl font-semibold text-green-600">{diff.added.length}</span>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">移除</p>
            <div className="flex items-center gap-1.5">
              <Minus className="size-4 text-red-600" />
              <span className="text-2xl font-semibold text-red-600">{diff.removed.length}</span>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">变更</p>
            <div className="flex items-center gap-1.5">
              <ArrowLeftRight className="size-4 text-amber-600" />
              <span className="text-2xl font-semibold text-amber-600">{diff.modified.length}</span>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">净重量变化</p>
            <span className={`text-2xl font-semibold ${netMass > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {netMass.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground ml-1">kg</span>
          </div>
        </div>
      )}

      {/* Diff table */}
      {loading ? (
        <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
          加载中...
        </div>
      ) : allItems.length > 0 ? (
        <ProfessionalTable
          columns={columns}
          dataSource={allItems}
          rowKey="equipment_id"
          maxHeight="calc(100vh - 400px)"
        />
      ) : (
        <div className="flex items-center justify-center h-24 rounded-lg border text-muted-foreground text-sm">
          {configA && configB ? '两个构型完全相同' : '请选择两个构型进行对比'}
        </div>
      )}
    </div>
  );
}
