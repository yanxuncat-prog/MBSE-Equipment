import { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import client from '@/api/client';

interface Props {
  open: boolean;
  configId: string;
  onClose: () => void;
  onImported: () => void;
}

interface PreviewResult {
  preview_id: string;
  added: { name: string }[];
  modified: { name: string; changes: Record<string, { old: any; new: any }> }[];
  unchanged_count: number;
}

export function ImportDialog({ open, configId, onClose, onImported }: Props) {
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await client.post(`/configurations/${configId}/import-preview`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data);
    } catch {
      toast.error('文件解析失败');
    } finally {
      setUploading(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    setApplying(true);
    try {
      const { data } = await client.post(`/configurations/${configId}/import-apply`, {
        preview_id: preview.preview_id,
      });
      toast.success(`导入完成：成功 ${data.success_count} 条${data.error_count > 0 ? `，失败 ${data.error_count} 条` : ''}`);
      onImported();
      onClose();
      setPreview(null);
    } catch {
      toast.error('导入执行失败');
    } finally {
      setApplying(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>导入 Excel 数据</DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-4">
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-8 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
            >
              {uploading ? (
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">点击选择或拖拽 .xlsx 文件</p>
                  <p className="text-xs text-muted-foreground mt-1">按设备名称匹配现有记录</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-3">
              <div className="flex-1 rounded-lg border p-3 text-center">
                <div className="text-xl font-bold text-status-ok">{preview.added.length}</div>
                <div className="text-xs text-muted-foreground">新增</div>
              </div>
              <div className="flex-1 rounded-lg border p-3 text-center">
                <div className="text-xl font-bold text-status-warn">{preview.modified.length}</div>
                <div className="text-xs text-muted-foreground">修改</div>
              </div>
              <div className="flex-1 rounded-lg border p-3 text-center">
                <div className="text-xl font-bold text-muted-foreground">{preview.unchanged_count}</div>
                <div className="text-xs text-muted-foreground">无变化</div>
              </div>
            </div>

            {/* Details */}
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {preview.added.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">新增设备：</div>
                  {preview.added.map(a => (
                    <div key={a.name} className="flex items-center gap-2 py-0.5">
                      <Badge variant="default" className="text-xs">新增</Badge>
                      <span className="text-sm">{a.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {preview.modified.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">修改设备：</div>
                  {preview.modified.map(m => (
                    <div key={m.name} className="rounded border p-2 mb-1">
                      <div className="text-sm font-medium">{m.name}</div>
                      {Object.entries(m.changes).map(([field, vals]) => (
                        <div key={field} className="text-xs text-muted-foreground">
                          {field}: <span className="text-status-danger line-through">{String(vals.old)}</span>
                          {' \u2192 '}
                          <span className="text-status-ok">{String(vals.new)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>取消</Button>
          {preview && (
            <Button onClick={handleApply} disabled={applying || (preview.added.length === 0 && preview.modified.length === 0)}>
              {applying ? '导入中...' : `确认导入 (${preview.added.length + preview.modified.length} 项)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
