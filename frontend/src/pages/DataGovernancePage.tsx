import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProfessionalTable, type Column } from '@/components/workstation/shared/ProfessionalTable';
import { useConfigStore } from '@/store/configStore';
import client from '@/api/client';

interface TableStats {
  table_name: string;
  display_name: string;
  row_count: number;
  column_count: number;
  columns: { name: string; type: string; nullable: boolean }[];
}

export function DataGovernancePage() {
  const { activeConfigId } = useConfigStore();
  const [tables, setTables] = useState<TableStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  useEffect(() => {
    if (!activeConfigId) return;
    setLoading(true);
    client.get('/data-governance/tables', { params: { config_id: activeConfigId } })
      .then(r => setTables(r.data))
      .catch(() => setTables([]))
      .finally(() => setLoading(false));
  }, [activeConfigId]);

  if (!activeConfigId) {
    return <div className="py-20 text-center text-muted-foreground">请先在顶部选择构型</div>;
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  const totalRows = tables.reduce((s, t) => s + t.row_count, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">数据治理</h2>
        <p className="text-sm text-muted-foreground">当前构型下所有数据表的结构与数据量，用于平台构建初期的数据治理</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card size="sm"><CardContent>
          <div className="text-2xl font-bold tabular-nums">{tables.length}</div>
          <div className="text-xs text-muted-foreground">数据表</div>
        </CardContent></Card>
        <Card size="sm"><CardContent>
          <div className="text-2xl font-bold tabular-nums">{totalRows}</div>
          <div className="text-xs text-muted-foreground">总记录数</div>
        </CardContent></Card>
        <Card size="sm"><CardContent>
          <div className="text-2xl font-bold tabular-nums">
            {tables.reduce((s, t) => s + t.column_count, 0)}
          </div>
          <div className="text-xs text-muted-foreground">总字段数</div>
        </CardContent></Card>
      </div>

      {/* Table cards */}
      {tables.map(t => {
        const isExpanded = expandedTable === t.table_name;
        const colColumns: Column<{ name: string; type: string; nullable: boolean }>[] = [
          { title: '字段名', dataIndex: 'name', key: 'name', width: 200 },
          { title: '类型', dataIndex: 'type', key: 'type', width: 150 },
          { title: '可空', key: 'nullable', width: 80,
            render: (_: any, r: any) => r.nullable ? <span className="text-muted-foreground">是</span> : <span className="text-status-danger">否</span> },
        ];

        return (
          <Card key={t.table_name} size="sm">
            <CardHeader
              className="cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedTable(isExpanded ? null : t.table_name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>{t.display_name}</CardTitle>
                  <Badge variant="outline" className="tabular-nums">{t.table_name}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{t.row_count} 行</span>
                  <span>{t.column_count} 列</span>
                </div>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent>
                <ProfessionalTable columns={colColumns} dataSource={t.columns} rowKey="name" />
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
