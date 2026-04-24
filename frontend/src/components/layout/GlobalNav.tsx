import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useConfigStore } from '@/store/configStore';
import { listPrograms, listSeries, listConfigs } from '@/api/configurations';
import type { Program, Series, Configuration } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { NotificationCenter } from './NotificationCenter';

export const workstationActions = {
  onAdd: null as (() => void) | null,
  onSearch: null as ((value: string) => void) | null,
  searchValue: '',
};

const ATA_OPTIONS = [
  { value: '21', label: 'ATA21 空调' }, { value: '23', label: 'ATA23 通信' },
  { value: '24', label: 'ATA24 电源' }, { value: '25', label: 'ATA25 设备/装饰' },
  { value: '26', label: 'ATA26 防火' }, { value: '27', label: 'ATA27 飞控' },
  { value: '30', label: 'ATA30 防除冰' }, { value: '31', label: 'ATA31 指示/记录' },
  { value: '32', label: 'ATA32 起落架' }, { value: '33', label: 'ATA33 照明' },
  { value: '34', label: 'ATA34 导航' }, { value: '35', label: 'ATA35 氧气' },
  { value: '38', label: 'ATA38 水/废水' }, { value: '42', label: 'ATA42 机载网络' },
  { value: '44', label: 'ATA44 客舱' }, { value: '46', label: 'ATA46 信息系统' },
  { value: '52', label: 'ATA52 舱门' }, { value: '86', label: 'ATA86 电推进' },
  { value: '87', label: 'ATA87 试飞改装' }, { value: '90', label: 'ATA90 自主飞行' },
  { value: '92', label: 'ATA92 地面网联' },
];

export function GlobalNav() {
  const { activeProgramId, activeSeriesId, activeConfigId, activeATA, setActiveProgram, setActiveSeries, setActiveConfig, setActiveATA } = useConfigStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [, setSeriesList] = useState<Series[]>([]);
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const isWorkstation = location.pathname === '/workstation';
  const needsConfig = location.pathname !== '/login';

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

  const handleConfigChange = (value: string | null) => {
    if (value) setActiveConfig(value);
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap">
      {needsConfig && (
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">型号:</span>
          <Select value={activeProgramId ?? ''} onValueChange={handleProgramChange}>
            <SelectTrigger size="sm" className="w-full md:w-[140px]">
              <SelectValue placeholder="选择型号">
                {programs.find(p => p.id === activeProgramId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground">构型:</span>
          <Select value={activeConfigId ?? ''} onValueChange={handleConfigChange}>
            <SelectTrigger size="sm" className="w-full md:w-[140px]">
              <SelectValue placeholder="选择构型">
                {configs.find(c => c.id === activeConfigId)?.version}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {configs.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.version}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeConfigId && configs.find(c => c.id === activeConfigId)?.is_frozen && (
            <Badge variant="secondary" className="text-xs shrink-0">冻结</Badge>
          )}
        </div>
      )}

      {isWorkstation && (
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">ATA:</span>
          <Select value={activeATA ?? '__all__'} onValueChange={(v) => { if (v) setActiveATA(v === '__all__' ? null : v); }}>
            <SelectTrigger size="sm" className="w-full md:w-[160px]">
              <SelectValue>
                {activeATA ? ATA_OPTIONS.find(a => a.value === activeATA)?.label || `ATA-${activeATA}` : '全部系统'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全部系统</SelectItem>
              {ATA_OPTIONS.map(a => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button size="sm" className="shrink-0" onClick={() => workstationActions.onAdd?.()}>
            <Plus className="size-3.5" />
            添加设备
          </Button>
          <div className="relative w-[200px] shrink-0">
            <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索件号/名称"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="h-7 pl-7 text-sm"
            />
          </div>
        </div>
      )}

      {/* Spacer + Notification Center */}
      <div className="flex-1" />
      <NotificationCenter />
    </div>
  );
}
