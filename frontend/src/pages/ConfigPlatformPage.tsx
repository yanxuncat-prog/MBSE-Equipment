import { useState } from 'react';
import { Link2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ConfigPlatformPage() {
  const [selectedIds] = useState<string[]>([]);

  const handleFetchModels = () => {
    toast.error('外网环境无法连接配置平台，请在内网环境使用此功能');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2">
        <Link2 className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">配置平台对接</h2>
      </div>

      {/* Status card */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground">平台状态</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm">连接状态:</span>
          <Badge variant="destructive">未连接</Badge>
        </div>
      </div>

      {/* Equipment multi-select area */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-medium text-sm text-muted-foreground">设备选择</h3>
        <div className="min-h-[120px] rounded-md border border-dashed border-border bg-muted/30 p-4 flex items-center justify-center text-sm text-muted-foreground">
          {selectedIds.length === 0
            ? '暂无可选设备（需连接配置平台后加载）'
            : `已选 ${selectedIds.length} 项设备`}
        </div>
        <Button onClick={handleFetchModels}>
          获取数模
        </Button>
      </div>

      {/* Info card */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 p-5 flex gap-3">
        <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          此功能需要在内网环境下连接CATIA配置平台。当前处于外网环境，接口和UI已预留，待内网部署后打通实际对接。
        </p>
      </div>
    </div>
  );
}
