import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { socket } = useWebSocket();

  useEffect(() => {
    if (socket) {
      socket.on('trade_alert', (data) => {
        showNotification('success', 'Trade Executed', data.message);
      });

      socket.on('notification', (data) => {
        showNotification(data.type, data.title, data.message);
      });

      socket.on('emergency_stop', () => {
        showNotification('danger', 'Emergency Stop', 'All positions have been closed');
      });

      return () => {
        socket.off('trade_alert');
        socket.off('notification');
        socket.off('emergency_stop');
      };
    }
  }, [socket]);

  const showNotification = (type: Notification['type'], title: string, message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep max 5 notifications

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-900 border-green-500',
          iconColor: 'text-green-400',
          icon: CheckCircle,
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-900 border-yellow-500',
          iconColor: 'text-yellow-400',
          icon: AlertTriangle,
        };
      case 'danger':
        return {
          bgColor: 'bg-red-900 border-red-500',
          iconColor: 'text-red-400',
          icon: XCircle,
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-900 border-blue-500',
          iconColor: 'text-blue-400',
          icon: Info,
        };
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => {
        const styles = getNotificationStyles(notification.type);
        const IconComponent = styles.icon;

        return (
          <Card
            key={notification.id}
            className={`${styles.bgColor} border-l-4 p-4 shadow-lg animate-in slide-in-from-right duration-300`}
          >
            <div className="flex items-start space-x-3">
              <IconComponent className={`${styles.iconColor} mt-1 flex-shrink-0`} size={20} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white">{notification.title}</div>
                <div className="text-sm text-gray-300 mt-1">{notification.message}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-1 h-auto"
                onClick={() => removeNotification(notification.id)}
              >
                <X size={16} />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
