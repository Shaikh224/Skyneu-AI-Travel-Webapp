import React from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { AppNotification, groupNotificationsByDate, formatTimeAgo } from '@/types/notification';
import NotificationItem from './NotificationItem';
import { Link } from 'react-router-dom';

interface NotificationPanelProps {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onNotificationClick: (notification: AppNotification) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onNotificationClick
}) => {
  const groupedNotifications = groupNotificationsByDate(notifications);

  if (loading) {
    return (
      <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border py-4 z-50">
        <div className="px-4 pb-3 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-skyneu-dark dark:text-dark-text">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={onMarkAllAsRead}
                className="text-sm text-skyneu-blue hover:text-skyneu-blue/80 transition-colors flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Mark all as read
              </button>
            )}
          </div>
        </div>
        <div className="px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-skyneu-blue mx-auto mb-3"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border py-4 z-50">
        <div className="px-4 pb-3 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-skyneu-dark dark:text-dark-text">Notifications</h3>
          </div>
        </div>
        <div className="px-4 py-8 text-center">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            We'll notify you about flight updates, trip reminders, and more
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border py-4 z-50 max-h-96 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 pb-3 border-b border-gray-100 dark:border-dark-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-skyneu-dark dark:text-dark-text">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={onMarkAllAsRead}
              className="text-sm text-skyneu-blue hover:text-skyneu-blue/80 transition-colors flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedNotifications).map(([groupName, groupNotifications]) => (
          <div key={groupName} className="px-4 py-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {groupName}
            </div>
            <div className="space-y-1">
              {groupNotifications.map((notification) => (
                <NotificationItem
                  key={notification.$id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDeleteNotification}
                  onClick={onNotificationClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 pt-3 border-t border-gray-100 dark:border-dark-border flex-shrink-0">
        <Link 
          to="/notifications"
          className="w-full block text-center text-sm text-skyneu-blue hover:text-skyneu-blue/80 transition-colors py-2"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationPanel;
