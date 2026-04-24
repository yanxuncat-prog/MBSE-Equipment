import { useEffect, useState, useCallback } from 'react';
import { Plus, Copy, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useConfigStore } from '../store/configStore';
import { listConfigs, createConfig, cloneConfig, freezeConfig, unfreezeConfig } from '../api/configurations';
import type { Configuration } from '../types';
import { Badge } from '@/components/ui/badge';
import { ConfigDiff } from '../components/configuration/ConfigDiff';

export function ConfigPage() {
  const { activeSeriesId, activeConfigId } = useConfigStore();
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
      toast.error('加载构型列表失败');
    }
  }, [activeSeriesId]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const handleCreate = async () => {
    if (!activeSeriesId || !newVersion) return;
    try {
      const config = await createConfig({ series_id: activeSeriesId, version: newVersion });
      toast.success(`构型 ${config.version} 创建成功`);
      setCreateOpen(false);
      setNewVersion('');
      fetchConfigs();
    } catch {
      toast.error('创建失败');
    }
  };

  const handleClone = async () => {
    if (!activeConfigId || !newVersion) return;
    try {
      const config = await cloneConfig(activeConfigId, newVersion);
      toast.success(`从当前构型克隆为 ${config.version}`);
      setCloneOpen(false);
      setNewVersion('');
      fetchConfigs();
    } catch {
      toast.error('克隆失败');
    }
  };

  const handleFreeze = async (config: Configuration) => {
    try {
      if (config.is_frozen) {
        await unfreezeConfig(config.id);
        toast.success(`构型 ${config.version} 已解冻`);
      } else {
        await freezeConfig(config.id);
        toast.success(`构型 ${config.version} 已冻结基线`);
      }
      fetchConfigs();
    } catch {
      toast.error(config.is_frozen ? '解冻失败' : '冻结失败');
    }
  };

  return (
    <div>
      {/* Action buttons */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-1" />
          新建构型
        </Button>
        <Button variant="outline" onClick={() => setCloneOpen(true)} disabled={!activeConfigId}>
          <Copy className="size-4 mr-1" />
          克隆当前
        </Button>
      </div>

      {/* Config list with freeze controls */}
      {configs.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {configs.map((cfg) => (
            <div key={cfg.id} className="flex items-center justify-between rounded-md border px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{cfg.version}</span>
                {cfg.is_frozen && (
                  <Badge variant="secondary" className="text-xs">冻结</Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {cfg.equipment_count} 台设备
                </span>
              </div>
              <Button
                variant={cfg.is_frozen ? 'destructive' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleFreeze(cfg)}
              >
                {cfg.is_frozen ? (
                  <><Unlock className="size-3 mr-1" />解冻</>
                ) : (
                  <><Lock className="size-3 mr-1" />冻结基线</>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div>
        <ConfigDiff configs={configs} />
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建构型</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="版本号，如 V2.0"
            value={newVersion}
            onChange={e => setNewVersion(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!newVersion}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clone dialog */}
      <Dialog open={cloneOpen} onOpenChange={setCloneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>克隆构型</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">将当前构型的所有设备复制到新版本：</p>
          <Input
            placeholder="新版本号，如 V2.1"
            value={newVersion}
            onChange={e => setNewVersion(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneOpen(false)}>取消</Button>
            <Button onClick={handleClone} disabled={!newVersion}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
