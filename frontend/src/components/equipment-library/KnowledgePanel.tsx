import { KNOWLEDGE } from './knowledge-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  fieldKey: string | null;
  open: boolean;
  onClose: () => void;
}

export function KnowledgePanel({ fieldKey, open, onClose }: Props) {
  const entry = fieldKey ? KNOWLEDGE[fieldKey] : null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">{entry?.label ?? fieldKey}</DialogTitle>
        </DialogHeader>
        {entry ? (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">{entry.definition}</p>
            {entry.values && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">取值范围：</span>
                <span className="text-xs">{entry.values}</span>
              </div>
            )}
            {entry.standard && (
              <div className="text-xs text-blue-600">参考标准：{entry.standard}</div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无该属性的说明信息。</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
