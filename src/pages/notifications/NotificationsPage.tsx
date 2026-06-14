import React, { useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import NotificationItem from '@/components/notifications/NotificationItem';
import { Link } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
  const notificationContext = useNotification();

  useEffect(() => {
    notificationContext.fetchNotifications();
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-skyneu-dark dark:text-dark-text">Notifications</h1>
        <div className="flex items-center gap-2">
          {notificationContext.unreadCount > 0 && (
            <button
              onClick={() => notificationContext.markAllAsRead()}
              className="px-3 py-2 text-sm bg-skyneu-blue text-white rounded-lg hover:bg-skyneu-blue/90 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {notificationContext.loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading notifications...</div>
        </div>
      ) : notificationContext.notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            No notifications yet
          </div>
          <Link to="/" className="text-skyneu-blue hover:text-skyneu-blue/80 transition-colors">
            Go back to home
          </Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {notificationContext.notifications.map((n) => (
            <NotificationItem
              key={n.$id}
              notification={n}
              onMarkAsRead={(id) => notificationContext.markAsRead(id)}
              onDelete={(id) => notificationContext.deleteNotification(id)}
              onClick={(notif) => {
                if (notif.actionUrl) window.location.href = notif.actionUrl;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;


