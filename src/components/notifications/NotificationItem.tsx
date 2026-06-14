import React from 'react';
import { Trash2, ExternalLink } from 'lucide-react';
import { 
  AppNotification, 
  getNotificationIcon, 
  getPriorityColor, 
  getPriorityBgColor, 
  formatTimeAgo 
} from '@/types/notification';

interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
  onClick: (notification: AppNotification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick
}) => {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.$id!);
    }
    onClick(notification);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.$id!);
  };

  const icon = getNotificationIcon(notification.type, notification.category);
  const priorityColor = getPriorityColor(notification.priority);
  const priorityBgColor = getPriorityBgColor(notification.priority);

  return (
    <div 
      className={`
        relative p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 group
        ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-500' : ''}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg
          ${priorityBgColor}
        `}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className={`
                text-sm font-medium truncate
                ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}
              `}>
                {notification.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {notification.message}
              </p>
            </div>

            {/* Unread indicator */}
            {!notification.read && (
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${priorityColor}`}>
                {notification.priority.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimeAgo(notification.createdAt)}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {notification.actionUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(notification.actionUrl, '_blank');
                  }}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                </button>
              )}
              <button
                onClick={handleDelete}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                title="Delete notification"
              >
                <Trash2 className="h-3 w-3 text-red-500 dark:text-red-400" />
              </button>
            </div>
          </div>

          {/* Additional data display */}
          {notification.data && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {notification.flightNumber && (
                <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2">
                  Flight {notification.flightNumber}
                </span>
              )}
              {notification.tripId && (
                <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2">
                  Trip
                </span>
              )}
              {notification.visaId && (
                <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2">
                  Visa
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
