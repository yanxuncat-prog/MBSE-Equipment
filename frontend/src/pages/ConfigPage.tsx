import { useEffect, useState, useCallback } from 'react';
import { Plus, Copy, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useConfigStore } from '../store/configStore';
import { listConfigs, createConfig, cloneConfig, lockBaseline } from '../api/configurations';
import type { Configuration } from '../types';
import { ConfigTimeline } from '../components/configuration/ConfigTimeline';
import { ConfigDiff } from '../components/configuration/ConfigDiff';

export function ConfigPage() {
  const { activeSeriesId, activeConfigId, setActiveConfig } = useConfigStore();
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
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

  const handleLock = async () => {
    if (!activeConfigId) return;
    try {
      await lockBaseline(activeConfigId);
      toast.success('已锁定为基线');
      fetchConfigs();
    } catch {
      toast.error('锁定失败（可能已锁定）');
    }
  };

  const currentConfig = configs.find(c => c.id === activeConfigId);

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
        <Button
          variant="outline"
          onClick={() => setLockOpen(true)}
          disabled={!activeConfigId || currentConfig?.status === 'baseline'}
        >
          <Lock className="size-4 mr-1" />
          锁定基线
        </Button>
      </div>

      {/* Main content */}
      <div className="flex gap-4">
        <div className="w-80 shrink-0">
          <h3 className="text-sm font-semibold mb-3">版本历史</h3>
          <ConfigTimeline configs={configs} activeId={activeConfigId} onSelect={setActiveConfig} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-3">构型对比</h3>
          <ConfigDiff configs={configs} />
        </div>
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

      {/* Lock baseline confirm */}
      <ConfirmDialog
        open={lockOpen}
        onOpenChange={setLockOpen}
        title="锁定基线"
        description="锁定后此构型将不可修改。确认锁定为基线？"
        confirmLabel="锁定"
        onConfirm={handleLock}
      />
    </div>
  );
}
