
import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "standard" | "critical";
  criticalPhrase?: string;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "删除",
  variant = "standard",
  criticalPhrase,
  onConfirm,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const isCritical = variant === "critical" && criticalPhrase;
  const canConfirm = isCritical ? inputValue === criticalPhrase : true;

  const handleConfirm = useCallback(async () => {
    try {
      setLoading(true);
      await onConfirm();
      onOpenChange(false);
    } catch {
      // caller handles errors
    } finally {
      setLoading(false);
    }
  }, [onConfirm, onOpenChange]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setInputValue("");
      onOpenChange(next);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="size-4 text-red-600" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="whitespace-pre-line pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        {isCritical && (
          <div className="space-y-2 pt-1">
            <p className="text-sm text-muted-foreground">
              请输入 <span className="font-semibold text-foreground">{criticalPhrase}</span> 以确认操作
            </p>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={criticalPhrase}
              autoFocus
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
          >
            {loading ? "处理中…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
