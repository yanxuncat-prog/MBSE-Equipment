import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from '@/api/notifications';
import type { NotificationItem } from '@/api/notifications';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

export function NotificationCenter() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silent
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listNotifications({ limit: 20 });
      setNotifications(data);
    } catch {
      toast.error('加载通知失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCount]);

  const handleOpen = (open: boolean) => {
    if (open) {
      fetchNotifications();
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      toast.error('标记已读失败');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('已全部标记为已读');
    } catch {
      toast.error('操作失败');
    }
  };

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger
        render={
          <button className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">通知中心</span>
          {unreadCount > 0 && (
            <Button size="xs" variant="ghost" onClick={handleMarkAllRead}>
              <Check className="size-3" />
              全部已读
            </Button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-80 overflow-y-auto">
          {loading && notifications.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>
          )}
          {!loading && notifications.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">暂无通知</div>
          )}
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={cn(
                "flex cursor-pointer gap-2.5 border-b border-border/50 px-3 py-2.5 transition-colors hover:bg-muted/50",
                !n.is_read && "bg-primary/[0.03]"
              )}
            >
              {/* Unread indicator */}
              <div className="mt-1.5 shrink-0">
                {!n.is_read ? (
                  <span className="block size-2 rounded-full bg-primary" />
                ) : (
                  <span className="block size-2" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm leading-tight", !n.is_read && "font-medium")}>
                  {n.title}
                </p>
                {n.message && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {n.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground/60">
                  {timeAgo(n.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
