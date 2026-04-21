import React from 'react';
import { Timeline, Tag, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import type { Configuration } from '../../types';

const { Text } = Typography;

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  draft: { color: 'blue', label: '草稿' },
  baseline: { color: 'green', label: '基线' },
  frozen: { color: 'orange', label: '冻结' },
  archived: { color: 'default', label: '归档' },
};

interface Props {
  configs: Configuration[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ConfigTimeline({ configs, activeId, onSelect }: Props) {
  return (
    <Timeline
      mode="left"
      items={configs.map((c) => {
        const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
        const isActive = c.id === activeId;
        return {
          key: c.id,
          color: isActive ? '#1677ff' : '#d9d9d9',
          children: (
            <div
              onClick={() => onSelect(c.id)}
              style={{
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 6,
                background: isActive ? '#e6f4ff' : 'transparent',
                border: isActive ? '1px solid #91caff' : '1px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text strong={isActive}>{c.version}</Text>
                <Tag color={sc.color}>{sc.label}</Tag>
                {c.status === 'baseline' && <LockOutlined style={{ color: '#52c41a' }} />}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {c.equipment_count} 台设备 {c.description ? `· ${c.description}` : ''}
              </Text>
            </div>
          ),
        };
      })}
    />
  );
}
