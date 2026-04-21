import React, { useEffect, useState, useCallback } from 'react';
import { Button, Space, Modal, Input, message, Typography } from 'antd';
import { PlusOutlined, CopyOutlined, LockOutlined } from '@ant-design/icons';
import { useConfigStore } from '../store/configStore';
import { listConfigs, createConfig, cloneConfig, lockBaseline } from '../api/configurations';
import type { Configuration } from '../types';
import { ConfigTimeline } from '../components/configuration/ConfigTimeline';
import { ConfigDiff } from '../components/configuration/ConfigDiff';

const { Title } = Typography;

export function ConfigPage() {
  const { activeSeriesId, activeConfigId, setActiveConfig } = useConfigStore();
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [newVersion, setNewVersion] = useState('');

  const fetchConfigs = useCallback(async () => {
    if (!activeSeriesId) return;
    try {
      const data = await listConfigs(activeSeriesId);
      setConfigs(data);
    } catch {
      message.error('加载构型列表失败');
    }
  }, [activeSeriesId]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const handleCreate = async () => {
    if (!activeSeriesId || !newVersion) return;
    try {
      const config = await createConfig({ series_id: activeSeriesId, version: newVersion });
      message.success(`构型 ${config.version} 创建成功`);
      setCreateOpen(false);
      setNewVersion('');
      fetchConfigs();
    } catch {
      message.error('创建失败');
    }
  };

  const handleClone = async () => {
    if (!activeConfigId || !newVersion) return;
    try {
      const config = await cloneConfig(activeConfigId, newVersion);
      message.success(`从当前构型克隆为 ${config.version}`);
      setCloneOpen(false);
      setNewVersion('');
      fetchConfigs();
    } catch {
      message.error('克隆失败');
    }
  };

  const handleLock = async () => {
    if (!activeConfigId) return;
    Modal.confirm({
      title: '锁定基线',
      content: '锁定后此构型将不可修改。确认锁定为基线？',
      onOk: async () => {
        try {
          await lockBaseline(activeConfigId);
          message.success('已锁定为基线');
          fetchConfigs();
        } catch {
          message.error('锁定失败（可能已锁定）');
        }
      },
    });
  };

  const currentConfig = configs.find(c => c.id === activeConfigId);

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建构型</Button>
        <Button icon={<CopyOutlined />} onClick={() => setCloneOpen(true)} disabled={!activeConfigId}>克隆当前</Button>
        <Button icon={<LockOutlined />} onClick={handleLock} disabled={!activeConfigId || currentConfig?.status === 'baseline'}>
          锁定基线
        </Button>
      </Space>

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ width: 320, flexShrink: 0 }}>
          <Title level={5}>版本历史</Title>
          <ConfigTimeline configs={configs} activeId={activeConfigId} onSelect={setActiveConfig} />
        </div>
        <div style={{ flex: 1 }}>
          <Title level={5}>构型对比</Title>
          <ConfigDiff configs={configs} />
        </div>
      </div>

      <Modal title="新建构型" open={createOpen} onOk={handleCreate} onCancel={() => setCreateOpen(false)}>
        <Input placeholder="版本号，如 V2.0" value={newVersion} onChange={e => setNewVersion(e.target.value)} />
      </Modal>

      <Modal title="克隆构型" open={cloneOpen} onOk={handleClone} onCancel={() => setCloneOpen(false)}>
        <p>将当前构型的所有设备复制到新版本：</p>
        <Input placeholder="新版本号，如 V2.1" value={newVersion} onChange={e => setNewVersion(e.target.value)} />
      </Modal>
    </div>
  );
}
