import React, { useEffect, useState } from 'react';
import { Select, Space, Button, Input, Divider } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { useConfigStore } from '../../store/configStore';
import { listPrograms, listSeries, listConfigs } from '../../api/configurations';
import type { Program, Series, Configuration } from '../../types';

// Workstation actions are exposed via a global callback so the header can trigger them
// without tight coupling to WorkstationPage state
export const workstationActions = {
  onAdd: null as (() => void) | null,
  onSearch: null as ((value: string) => void) | null,
  searchValue: '',
};

export function GlobalNav() {
  const { activeProgramId, activeSeriesId, activeConfigId, setActiveProgram, setActiveSeries, setActiveConfig } = useConfigStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const isWorkstation = location.pathname === '/workstation';

  useEffect(() => {
    listPrograms().then(setPrograms).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeProgramId) {
      listSeries(activeProgramId).then((s) => {
        setSeriesList(s);
        if (s.length > 0 && !activeSeriesId) setActiveSeries(s[0].id);
      }).catch(() => {});
    }
  }, [activeProgramId]);

  useEffect(() => {
    if (activeSeriesId) {
      listConfigs(activeSeriesId).then((c) => {
        setConfigs(c);
        if (c.length > 0 && !activeConfigId) setActiveConfig(c[0].id);
      }).catch(() => {});
    }
  }, [activeSeriesId]);

  useEffect(() => {
    if (programs.length > 0 && !activeProgramId) {
      setActiveProgram(programs[0].id);
    }
  }, [programs]);

  const handleSearch = (value: string) => {
    setSearch(value);
    workstationActions.onSearch?.(value);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
      <Space size={6}>
        <span style={{ color: '#999', fontSize: 12 }}>型号:</span>
        <Select
          value={activeProgramId || undefined}
          onChange={setActiveProgram}
          style={{ width: 140 }}
          placeholder="选择型号"
          size="small"
          options={programs.map((p) => ({ value: p.id, label: p.name }))}
        />
        <span style={{ color: '#999', fontSize: 12 }}>系列:</span>
        <Select
          value={activeSeriesId || undefined}
          onChange={setActiveSeries}
          style={{ width: 100 }}
          placeholder="选择系列"
          size="small"
          options={seriesList.map((s) => ({ value: s.id, label: s.variant_name }))}
        />
        <span style={{ color: '#999', fontSize: 12 }}>构型:</span>
        <Select
          value={activeConfigId || undefined}
          onChange={setActiveConfig}
          style={{ width: 160 }}
          placeholder="选择构型"
          size="small"
          options={configs.map((c) => ({ value: c.id, label: `${c.version} (${c.status})` }))}
        />
      </Space>

      {isWorkstation && (
        <>
          <Divider type="vertical" style={{ height: 24, margin: '0 8px' }} />
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => workstationActions.onAdd?.()}>
            添加设备
          </Button>
          <Input
            placeholder="搜索件号/名称"
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => handleSearch(e.target.value)}
            allowClear
            size="small"
            style={{ width: 200 }}
            onClear={() => handleSearch('')}
          />
        </>
      )}
    </div>
  );
}
