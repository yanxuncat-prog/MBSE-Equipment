import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useConfigStore } from '@/store/configStore';
import { getMICDStats, listMICD } from '@/api/micd';
import { listEquipment } from '@/api/equipment';
import type { MICDRecord, Equipment } from '@/types';

interface Stats {
  total: number;
  confirmed: number;
  unconfirmed: number;
  confirmed_in_range: number;
}

interface EquipmentBreakdown {
  equipment_id: string;
  equipment_name: string;
  total: number;
  confirmed: number;
  unconfirmed: number;
  rate: number;
}

export function MICDStatsPage() {
  const { activeConfigId } = useConfigStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [micdItems, setMicdItems] = useState<MICDRecord[]>([]);
  const [equipMap, setEquipMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Load stats
  useEffect(() => {
    if (!activeConfigId) return;
    const params: { config_id: string; start_date?: string; end_date?: string } = { config_id: activeConfigId };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    getMICDStats(params)
      .then(setStats)
      .catch(() => setStats(null));
  }, [activeConfigId, startDate, endDate]);

  // Load MICD records + equipment names
  useEffect(() => {
    if (!activeConfigId) return;
    setLoading(true);
    Promise.all([
      listMICD({ config_id: activeConfigId, limit: 1000 }),
      listEquipment({ config_id: activeConfigId, limit: 2000 }),
    ])
      .then(([micd, equip]) => {
        setMicdItems(micd.items);
        const map: Record<string, string> = {};
        (equip.items as Equipment[]).forEach((e: Equipment) => {
          map[e.id] = e.name;
        });
        setEquipMap(map);
      })
      .catch(() => {
        setMicdItems([]);
        setEquipMap({});
      })
      .finally(() => setLoading(false));
  }, [activeConfigId]);

  // Group by equipment
  const breakdown = useMemo<EquipmentBreakdown[]>(() => {
    const groups: Record<string, { total: number; confirmed: number }> = {};
    for (const item of micdItems) {
      if (!groups[item.equipment_id]) {
        groups[item.equipment_id] = { total: 0, confirmed: 0 };
      }
      groups[item.equipment_id].total++;
      if (item.is_confirmed) groups[item.equipment_id].confirmed++;
    }
    return Object.entries(groups).map(([eqId, g]) => ({
      equipment_id: eqId,
      equipment_name: equipMap[eqId] || eqId,
      total: g.total,
      confirmed: g.confirmed,
      unconfirmed: g.total - g.confirmed,
      rate: g.total > 0 ? (g.confirmed / g.total) * 100 : 0,
    })).sort((a, b) => b.total - a.total);
  }, [micdItems, equipMap]);

  if (!activeConfigId) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        请先在顶部选择构型
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const confirmRate =
    stats && stats.total > 0
      ? ((stats.confirmed / stats.total) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="size-5 text-primary" />
        <h2 className="text-lg font-bold">MICD 工作量统计</h2>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">
            起始日期
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">
            结束日期
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card size="sm">
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {stats?.total ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">总记录数</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-emerald-600">
              {startDate && endDate
                ? stats?.confirmed_in_range ?? 0
                : stats?.confirmed ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {startDate && endDate ? '期间已确认' : '已确认'}
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-amber-600">
              {stats?.unconfirmed ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">未确认</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {confirmRate}%
            </div>
            <div className="text-xs text-muted-foreground">确认率</div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown table */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-semibold mb-3">按设备统计</h3>
          {breakdown.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              暂无 MICD 记录
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">设备名称</th>
                    <th className="text-right py-2 px-3 font-medium">MICD 记录数</th>
                    <th className="text-right py-2 px-3 font-medium">已确认</th>
                    <th className="text-right py-2 px-3 font-medium">未确认</th>
                    <th className="text-right py-2 px-3 font-medium">确认率</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map(row => (
                    <tr
                      key={row.equipment_id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2 px-3">{row.equipment_name}</td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {row.total}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-emerald-600">
                        {row.confirmed}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-amber-600">
                        {row.unconfirmed}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Badge
                          variant={
                            row.rate >= 80
                              ? 'default'
                              : row.rate >= 50
                                ? 'secondary'
                                : 'outline'
                          }
                          className="tabular-nums"
                        >
                          {row.rate.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
