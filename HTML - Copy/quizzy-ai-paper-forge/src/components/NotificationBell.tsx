// Feature 9: Notification Bell component
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { getNotifications, markAllRead, clearNotifications, getUnreadCount, type AppNotification } from '@/lib/notifications';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = () => {
    setNotifications(getNotifications());
    setUnread(getUnreadCount());
  };

  useEffect(() => {
    refresh();
    window.addEventListener('notifications-updated', refresh);
    return () => window.removeEventListener('notifications-updated', refresh);
  }, []);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      markAllRead();
      setUnread(0);
    }
  };

  const typeColors: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => { clearNotifications(); refresh(); }}>
              Clear all
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No notifications
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`px-4 py-3 border-b last:border-0 text-sm ${typeColors[n.type] || ''} ${!n.read ? 'font-medium' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-xs">{n.title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{n.message}</p>
                  </div>
                  {!n.read && <Badge variant="secondary" className="text-xs shrink-0">New</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
