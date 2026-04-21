import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Statistic, Tag, Space, Typography, Spin, Timeline } from 'antd';
import {
  CheckCircleOutlined, WarningOutlined, StopOutlined,
  ToolOutlined, DashboardOutlined, BranchesOutlined,
} from '@ant-design/icons';
import { useConfigStore } from '../store/configStore';
import { validateConfig } from '../api/constraints';
import { listConfigs } from '../api/configurations';
import client from '../api/client';
import type { ValidationReport, EngineResult, Configuration } from '../types';
import { CGEnvelopeChart } from '../components/charts/CGEnvelopeChart';
import { BusStatusDots } from '../components/charts/BusStatusDots';
import { ATADistributionBar } from '../components/charts/ATADistributionBar';
import { ZoneDonutChart } from '../components/charts/ZoneDonutChart';

const { Title, Text } = Typography;

const STATUS_CFG = {
  pass: { color: '#34C759', bg: '#f0fff4', border: '#b7eb8f', icon: <CheckCircleOutlined />, text: '全机约束状态：正常' },
  warning: { color: '#FF9500', bg: '#fffbe6', border: '#ffe58f', icon: <WarningOutlined />, text: '全机约束状态：注意' },
  blocked: { color: '#FF3B30', bg: '#fff2f0', border: '#ffa39e', icon: <StopOutlined />, text: '全机约束状态：超限' },
};

export function DashboardPage() {
  const { activeConfigId, activeSeriesId } = useConfigStore();
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!activeConfigId) return;
    setLoading(true);
    try {
      const [rpt, statsResp, cfgList] = await Promise.all([
        validateConfig({ config_id: activeConfigId }),
        client.get('/dashboard/stats', { params: { config_id: activeConfigId } }).then(r => r.data),
        activeSeriesId ? listConfigs(activeSeriesId) : Promise.resolve([]),
      ]);
      setReport(rpt);
      setStats(statsResp);
      setConfigs(cfgList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeConfigId, activeSeriesId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!activeConfigId) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Text type="secondary">请先在顶部选择构型</Text></div>;
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  const overallStatus = (report?.overall_status || 'pass') as keyof typeof STATUS_CFG;
  const sc = STATUS_CFG[overallStatus];
  const wbEngine = report?.engines.find(e => e.engine_name === 'weight_balance');
  const elEngine = report?.engines.find(e => e.engine_name === 'electrical_load');
  const wbDetails = wbEngine?.details || {};
  const buses = (elEngine?.details?.buses || {}) as Record<string, any>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Row 0: Overall Status Banner */}
      <div style={{
        padding: '16px 24px', marginBottom: 16, borderRadius: 8,
        background: sc.bg, border: `1px solid ${sc.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 24, color: sc.color }}>{sc.icon}</span>
        <div>
          <Text strong style={{ fontSize: 16, color: sc.color }}>{sc.text}</Text>
          <br />
          <Text style={{ fontSize: 12, color: '#888' }}>
            CG {wbDetails.cg_pct_mac?.toFixed(1) || '-'}% MAC 包线内 |
            最高母线负荷 {Math.max(...Object.values(buses).map((b: any) => b.load_ratio_pct || 0), 0).toFixed(0)}% |
            总重量 {wbDetails.total_mass_kg?.toFixed(0) || '-'} kg
          </Text>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Card size="small"><Statistic title="设备总数" value={stats?.equipment_count || 0} suffix="台" valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col span={5}>
          <Card size="small"><Statistic title="总重量" value={wbDetails.total_mass_kg?.toFixed(1) || 0} suffix="kg" valueStyle={{ color: '#333' }} /></Card>
        </Col>
        <Col span={5}>
          <Card size="small"><Statistic title="CG 位置" value={wbDetails.cg_pct_mac?.toFixed(1) || 0} suffix="% MAC" valueStyle={{ color: sc.color }} /></Card>
        </Col>
        <Col span={5}>
          <Card size="small"><Statistic title="有重量数据" value={stats?.weight_equipped_count || 0} suffix={`/ ${stats?.equipment_count || 0}`} valueStyle={{ color: '#888' }} /></Card>
        </Col>
        <Col span={4}>
          <Card size="small"><Statistic title="构型版本" value={stats?.config_count || 0} suffix="个" valueStyle={{ color: '#5ac8fa' }} /></Card>
        </Col>
      </Row>

      {/* Row 2: CG Envelope + Bus Status */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={14}>
          <Card size="small" title="CG 包线图">
            <CGEnvelopeChart
              cgPctMac={wbDetails.cg_pct_mac || 0}
              totalMassKg={wbDetails.total_mass_kg || 0}
              mtowKg={100000}
              fwdLimitPct={20}
              aftLimitPct={40}
              status={wbEngine?.status as any || 'pass'}
              width={500}
              height={220}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card size="small" title="母线状态" style={{ marginBottom: 12 }}>
            <BusStatusDots buses={buses} />
          </Card>
          <Card size="small" title="约束健康度">
            {report?.engines.map(eng => {
              const eColor = eng.status === 'pass' ? '#34C759' : eng.status === 'warning' ? '#FF9500' : '#FF3B30';
              const eIcon = eng.status === 'pass' ? '\u2713' : eng.status === 'warning' ? '\u26A0' : '\u2717';
              return (
                <div key={eng.engine_name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <Text style={{ fontSize: 13 }}>{eng.engine_name === 'weight_balance' ? '重量/CG' : '电气负荷'}</Text>
                  <Text style={{ fontSize: 13, color: eColor, fontWeight: 600 }}>{eIcon} {eng.summary.slice(0, 30)}</Text>
                </div>
              );
            })}
          </Card>
        </Col>
      </Row>

      {/* Row 3: Distribution Charts */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small" title="ATA 系统分布">
            {stats?.ata_distribution && <ATADistributionBar data={stats.ata_distribution} total={stats.equipment_count} />}
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title="区域分布">
            {stats?.zone_distribution && <ZoneDonutChart data={stats.zone_distribution} total={stats.equipment_count} />}
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title="重量分布 (按ATA)">
            {stats?.weight_distribution && (
              <div>
                {stats.weight_distribution.map((item: any, i: number) => (
                  <div key={item.ata} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ width: 52, fontSize: 11, textAlign: 'right', marginRight: 8, color: '#999' }}>ATA-{item.ata}</Text>
                    <div style={{ flex: 1, height: 16, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${(item.weight_kg / (stats.weight_distribution[0]?.weight_kg || 1)) * 100}%`,
                        height: '100%',
                        background: ['#ff6b6b', '#ff9500', '#ffcc00', '#34c759', '#5ac8fa', '#007aff', '#af52de', '#30b0c7', '#a2845e', '#636366'][i % 10],
                        borderRadius: 3,
                      }} />
                    </div>
                    <Text style={{ width: 55, fontSize: 11, marginLeft: 8, color: '#666' }}>{item.weight_kg}kg</Text>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 4: Timeline + Info */}
      <Row gutter={12}>
        <Col span={16}>
          <Card size="small" title="构型变更时间线">
            <Timeline
              items={configs.map(c => ({
                color: c.status === 'baseline' ? 'green' : 'blue',
                children: (
                  <div>
                    <Text strong>{c.version}</Text>
                    <Tag color={c.status === 'baseline' ? 'green' : 'blue'} style={{ marginLeft: 8 }}>
                      {c.status === 'baseline' ? '基线' : '草稿'}
                    </Tag>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {c.equipment_count} 台设备 {c.description ? `\u00B7 ${c.description}` : ''}
                    </Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title="待办提醒" style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>评审流程模块（待开发）</Text>
          </Card>
          <Card size="small" title="供应商状态">
            <Text type="secondary" style={{ fontSize: 12 }}>供应商协同模块（待开发）</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
