// Feature 9: Notification store using localStorage

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'app_notifications';

export function getNotifications(): AppNotification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addNotification(n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): AppNotification {
  const notifications = getNotifications();
  const newN: AppNotification = {
    ...n,
    id: Date.now().toString(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(newN);
  // Keep only last 50
  const trimmed = notifications.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  window.dispatchEvent(new Event('notifications-updated'));
  return newN;
}

export function markAllRead(): void {
  const notifications = getNotifications().map(n => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new Event('notifications-updated'));
}

export function markRead(id: string): void {
  const notifications = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new Event('notifications-updated'));
}

export function clearNotifications(): void {
  localStorage.setItem(STORAGE_KEY, '[]');
  window.dispatchEvent(new Event('notifications-updated'));
}

export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length;
}
