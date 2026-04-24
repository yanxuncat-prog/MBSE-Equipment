import { useState, useEffect } from 'react';
import { History, Loader2 } from 'lucide-react';
import { listAuditLogs, type AuditLogEntry } from '@/api/audit-logs';

const FORMAT_FIELD_NAME: Record<string, string> = {
  'name': '设备名称',
  'name_en': '英文名称',
  'part_number': '件号',
  'ata_chapter': 'ATA章节',
  'equipment_type': '类型',
  'status': '状态',
  'description': '描述',
  'mass_kg': '重量(kg)',
  'cg_x': '重心X',
  'cg_y': '重心Y',
  'cg_z': '重心Z',
  'sta': 'STA(mm)',
  'bl': 'BL(mm)',
  'wl': 'WL(mm)',
  'power_kva_normal': '正常功耗(kW)',
  'power_kva_emergency': '应急功耗(kW)',
  'power_kva_max': '峰值功耗(kW)',
  'power_voltage': '供电电压',
  'power_redundancy': '供电余度',
  'voltage_range': '电压范围',
  'dimensions_mm': '尺寸(mm)',
  'dal': 'DAL等级',
  'is_electrical': '是否电设备',
  'is_primary_electrical': '一级用电设备',
  'has_eicd': '是否有EICD',
  'first_flight_onboard': '首飞装机',
  'phase2_onboard': '二阶段装机',
  'is_optional': '是否选装',
  'responsible_person': '负责人',
  'bonding_method': '搭接方式',
  'bonding_type': '搭接类型',
  'bonding_resistance': '搭接阻值',
  'bonding_position': '搭接位置',
  'install_method': '安装方式',
  'in_pace_drawing': 'PACE图纸',
  'layout_adjustment': '布置调整需求',
  'do160_temp_design_level': 'DO-160设计等级',
  'do160_temp_qual_level': 'DO-160鉴定等级',
  'do160_temp_compliance': 'DO-160符合情况',
  'normal_operating_temp': '正常工作温度',
  'short_term_temp': '短时工作温度',
  'ground_storage_temp': '地面停放温度',
  'operating_altitude': '工作高度',
  'notes': '备注',
  'zone_id': '安装区域',
  'config_name': '构型名称',
  'procurement_status': '采购状态',
  'lin_number': 'LIN号',
};

function formatFieldName(key: string): string {
  return FORMAT_FIELD_NAME[key] || key;
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'boolean') return val ? '是' : '否';
  return String(val);
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts;
  }
}

const ACTION_LABELS: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  freeze: '冻结',
  unfreeze: '解冻',
};

interface Props {
  entityType: string;
  entityId: string;
}

export function ChangeLogViewer({ entityType, entityId }: Props) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityType || !entityId) return;
    setLoading(true);
    listAuditLogs({ entity_type: entityType, entity_id: entityId, limit: 50 })
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-2">暂无变更记录</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <History className="size-3.5" />
        变更记录
      </div>
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {logs.map((log) => {
          // Compute field diffs
          const diffs: { field: string; oldVal: any; newVal: any }[] = [];
          if (log.old_value && log.new_value) {
            const allKeys = new Set([
              ...Object.keys(log.old_value),
              ...Object.keys(log.new_value),
            ]);
            for (const key of allKeys) {
              const ov = log.old_value[key];
              const nv = log.new_value[key];
              if (JSON.stringify(ov) !== JSON.stringify(nv)) {
                diffs.push({ field: key, oldVal: ov, newVal: nv });
              }
            }
          } else if (log.new_value && !log.old_value) {
            for (const [key, nv] of Object.entries(log.new_value)) {
              if (nv !== null && nv !== undefined && nv !== '') {
                diffs.push({ field: key, oldVal: null, newVal: nv });
              }
            }
          }

          return (
            <div key={log.id} className="rounded-md border px-3 py-2 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium">{log.user_name || '系统'}</span>
                <span className="text-muted-foreground">
                  {ACTION_LABELS[log.action] || log.action}
                </span>
                <span className="ml-auto text-muted-foreground">{formatTime(log.timestamp)}</span>
              </div>
              {log.reason && (
                <div className="text-xs text-muted-foreground">
                  原因: {log.reason}
                </div>
              )}
              {diffs.length > 0 && (
                <div className="space-y-0.5">
                  {diffs.map((d) => (
                    <div key={d.field} className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground shrink-0">{formatFieldName(d.field)}:</span>
                      {d.oldVal != null && (
                        <span className="line-through text-red-500">{formatValue(d.oldVal)}</span>
                      )}
                      <span className="text-green-600">{formatValue(d.newVal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
