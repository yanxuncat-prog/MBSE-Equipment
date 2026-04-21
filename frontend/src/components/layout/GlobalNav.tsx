import React, { useEffect, useState } from 'react';
import { Select, Space, Tag } from 'antd';
import { useConfigStore } from '../../store/configStore';
import { listPrograms, listSeries, listConfigs } from '../../api/configurations';
import type { Program, Series, Configuration } from '../../types';

export function GlobalNav() {
  const { activeProgramId, activeSeriesId, activeConfigId, setActiveProgram, setActiveSeries, setActiveConfig } = useConfigStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [configs, setConfigs] = useState<Configuration[]>([]);

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

  // Auto-select first program
  useEffect(() => {
    if (programs.length > 0 && !activeProgramId) {
      setActiveProgram(programs[0].id);
    }
  }, [programs]);

  return (
    <Space size="middle">
      <span style={{ color: '#999', fontSize: 12 }}>型号:</span>
      <Select
        value={activeProgramId || undefined}
        onChange={setActiveProgram}
        style={{ width: 160 }}
        placeholder="选择型号"
        options={programs.map((p) => ({ value: p.id, label: p.name }))}
      />
      <span style={{ color: '#999', fontSize: 12 }}>系列:</span>
      <Select
        value={activeSeriesId || undefined}
        onChange={setActiveSeries}
        style={{ width: 120 }}
        placeholder="选择系列"
        options={seriesList.map((s) => ({ value: s.id, label: s.variant_name }))}
      />
      <span style={{ color: '#999', fontSize: 12 }}>构型:</span>
      <Select
        value={activeConfigId || undefined}
        onChange={setActiveConfig}
        style={{ width: 160 }}
        placeholder="选择构型"
        options={configs.map((c) => ({ value: c.id, label: `${c.version} (${c.status})` }))}
      />
    </Space>
  );
}
