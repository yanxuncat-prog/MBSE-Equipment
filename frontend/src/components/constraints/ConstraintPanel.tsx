import React from 'react';
import { Card, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, WarningOutlined, StopOutlined } from '@ant-design/icons';
import type { ValidationReport } from '../../types';
import { CGIndicator } from './CGIndicator';
import { BusLoadBar } from './BusLoadBar';

const { Text } = Typography;

const STATUS_CONFIG = {
  pass: { color: '#34C759', icon: <CheckCircleOutlined />, text: '正常' },
  warning: { color: '#FF9500', icon: <WarningOutlined />, text: '注意' },
  blocked: { color: '#FF3B30', icon: <StopOutlined />, text: '超限' },
};

interface Props {
  report: ValidationReport | null;
}

export function ConstraintPanel({ report }: Props) {
  if (!report) {
    return (
      <div style={{ width: 280, padding: 16, background: '#fafafa', borderLeft: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text type="secondary">选择构型后显示约束状态</Text>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[report.overall_status] || STATUS_CONFIG.pass;
  const wbEngine = report.engines.find(e => e.engine_name === 'weight_balance');
  const elEngine = report.engines.find(e => e.engine_name === 'electrical_load');

  return (
    <div style={{ width: 280, padding: 16, background: '#fafafa', borderLeft: '1px solid #f0f0f0', overflowY: 'auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Tag color={statusCfg.color} icon={statusCfg.icon} style={{ fontSize: 14, padding: '4px 12px' }}>
          {statusCfg.text}
        </Tag>
      </div>

      {wbEngine && (
        <Card size="small" title="重量 / CG" style={{ marginBottom: 12 }}>
          <CGIndicator details={wbEngine.details} status={wbEngine.status} />
        </Card>
      )}

      {elEngine && elEngine.details.buses && (
        <Card size="small" title="电气负荷" style={{ marginBottom: 12 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {Object.entries(elEngine.details.buses as Record<string, any>).map(([busId, bus]: [string, any]) => (
              <BusLoadBar key={busId} busName={bus.bus_name} loadKva={bus.load_kva} capacityKva={bus.capacity_kva} loadRatioPct={bus.load_ratio_pct} />
            ))}
          </Space>
        </Card>
      )}
    </div>
  );
}
