import React, { useEffect, useState } from 'react';
import { Select, Table, Tag, Space, Typography, Switch, Statistic, Row, Col } from 'antd';
import { PlusOutlined, MinusOutlined, SwapOutlined } from '@ant-design/icons';
import type { Configuration, ConfigDiffResponse, DiffItem } from '../../types';
import { diffConfigs } from '../../api/configurations';

const { Text } = Typography;

interface Props {
  configs: Configuration[];
  defaultA?: string;
  defaultB?: string;
}

export function ConfigDiff({ configs, defaultA, defaultB }: Props) {
  const [configA, setConfigA] = useState<string | undefined>(defaultA);
  const [configB, setConfigB] = useState<string | undefined>(defaultB);
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

  const options = configs.map(c => ({ value: c.id, label: `${c.version} (${c.status})` }));

  const allItems: (DiffItem & { _type: string })[] = [
    ...(diff?.added || []).map(i => ({ ...i, _type: 'added' })),
    ...(diff?.removed || []).map(i => ({ ...i, _type: 'removed' })),
    ...(diff?.modified || []).map(i => ({ ...i, _type: 'modified' })),
  ];

  const columns = [
    {
      title: '变更', dataIndex: '_type', key: 'type', width: 70,
      render: (t: string) => {
        const cfg = {
          added: { color: '#34C759', icon: <PlusOutlined />, text: '新增' },
          removed: { color: '#FF3B30', icon: <MinusOutlined />, text: '移除' },
          modified: { color: '#FF9500', icon: <SwapOutlined />, text: '变更' },
        }[t] || { color: '#999', icon: null, text: t };
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag>;
      },
    },
    { title: '件号', dataIndex: 'part_number', key: 'pn', width: 120 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
    {
      title: '变更详情', dataIndex: 'changes', key: 'changes',
      render: (changes: Record<string, any> | null) => {
        if (!changes) return '-';
        return Object.entries(changes).map(([field, vals]: [string, any]) => (
          <div key={field} style={{ fontSize: 12 }}>
            <Text type="secondary">{field}:</Text>{' '}
            <Text delete type="danger">{String(vals.old)}</Text>{' \u2192 '}
            <Text type="success">{String(vals.new)}</Text>
          </div>
        ));
      },
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Text>基线:</Text>
        <Select value={configA} onChange={setConfigA} style={{ width: 200 }} options={options} placeholder="选择构型 A" />
        <Text>对比:</Text>
        <Select value={configB} onChange={setConfigB} style={{ width: 200 }} options={options} placeholder="选择构型 B" />
        <Switch checked={showOnlyDiff} onChange={setShowOnlyDiff} checkedChildren="仅差异" unCheckedChildren="全部" />
      </Space>

      {diff && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}><Statistic title="新增" value={diff.added.length} valueStyle={{ color: '#34C759' }} prefix={<PlusOutlined />} /></Col>
          <Col span={6}><Statistic title="移除" value={diff.removed.length} valueStyle={{ color: '#FF3B30' }} prefix={<MinusOutlined />} /></Col>
          <Col span={6}><Statistic title="变更" value={diff.modified.length} valueStyle={{ color: '#FF9500' }} prefix={<SwapOutlined />} /></Col>
          <Col span={6}>
            <Statistic
              title="净重量变化"
              value={diff.impact_summary?.net_mass_change_kg || 0}
              precision={1}
              suffix="kg"
              valueStyle={{ color: (diff.impact_summary?.net_mass_change_kg || 0) > 0 ? '#FF9500' : '#34C759' }}
            />
          </Col>
        </Row>
      )}

      <Table
        columns={columns}
        dataSource={allItems}
        rowKey="equipment_id"
        loading={loading}
        size="small"
        pagination={false}
        locale={{ emptyText: configA && configB ? '两个构型完全相同' : '请选择两个构型进行对比' }}
      />
    </div>
  );
}
