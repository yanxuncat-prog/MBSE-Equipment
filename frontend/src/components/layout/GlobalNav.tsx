import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useConfigStore } from '@/store/configStore';
import { listPrograms, listSeries, listConfigs } from '@/api/configurations';
import type { Program, Series, Configuration } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

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
  const isEquipmentDef = location.pathname === '/equipment-def';
  const needsConfig = !isEquipmentDef && location.pathname !== '/guide';

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

  const handleProgramChange = (value: string | null) => {
    if (value) setActiveProgram(value);
  };

  const handleSeriesChange = (value: string | null) => {
    if (value) setActiveSeries(value);
  };

  const handleConfigChange = (value: string | null) => {
    if (value) setActiveConfig(value);
  };

  return (
    <div className="flex w-full items-center gap-2">
      {isEquipmentDef && (
        <span className="text-sm text-muted-foreground">设备定义 — 管理设备固有属性（不依赖构型）</span>
      )}

      {needsConfig && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">型号:</span>
          <Select value={activeProgramId || undefined} onValueChange={handleProgramChange}>
            <SelectTrigger size="sm" className="w-[140px]">
              <SelectValue placeholder="选择型号" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground">系列:</span>
          <Select value={activeSeriesId || undefined} onValueChange={handleSeriesChange}>
            <SelectTrigger size="sm" className="w-[100px]">
              <SelectValue placeholder="选择系列" />
            </SelectTrigger>
            <SelectContent>
              {seriesList.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.variant_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground">构型:</span>
          <Select value={activeConfigId || undefined} onValueChange={handleConfigChange}>
            <SelectTrigger size="sm" className="w-[160px]">
              <SelectValue placeholder="选择构型" />
            </SelectTrigger>
            <SelectContent>
              {configs.map((c) => (
                <SelectItem key={c.id} value={c.id}>{`${c.version} (${c.status})`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isWorkstation && (
        <>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button size="sm" onClick={() => workstationActions.onAdd?.()}>
            <Plus className="size-3.5" />
            添加设备
          </Button>
          <div className="relative w-[200px]">
            <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索件号/名称"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="h-7 pl-7 text-sm"
            />
          </div>
        </>
      )}
    </div>
  );
}
