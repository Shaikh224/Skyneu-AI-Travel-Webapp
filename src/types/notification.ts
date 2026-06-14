// Notification types and interfaces for the notification center

export enum NotificationType {
  FLIGHT = 'flight',
  TRIP = 'trip',
  VISA = 'visa',
  SYSTEM = 'system'
}

export enum NotificationCategory {
  ALERT = 'alert',
  REMINDER = 'reminder',
  UPDATE = 'update',
  WARNING = 'warning'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AppNotification {
  $id?: string; // Appwrite document ID
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>; // JSON data for additional context
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Optional fields for specific notification types
  flightNumber?: string;
  tripId?: string;
  visaId?: string;
  actionUrl?: string; // URL to navigate to when clicked
}

// Helper type for saving to Appwrite (ensures proper typing)
export interface NotificationForSave extends Omit<AppNotification, 'data'> {
  data?: string; // JSON string for Appwrite storage
}

export interface NotificationPreferences {
  $id?: string; // Appwrite document ID
  userId: string;
  
  // Flight notification preferences
  flightDelays: boolean;
  flightDelaysThreshold: number; // minutes
  gateChanges: boolean;
  statusChanges: boolean;
  cancellations: boolean;
  
  // Trip notification preferences
  tripReminders: boolean;
  tripReminderHours: number; // hours before trip
  tripUpdates: boolean;
  
  // Visa notification preferences
  visaDeadlines: boolean;
  visaDeadlineDays: number; // days before deadline
  visaUpdates: boolean;
  
  // System preferences
  browserNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  
  createdAt: string;
  updatedAt: string;
}

// Flight change detection types
export interface FlightChange {
  type: 'delay' | 'gate_change' | 'status_change' | 'cancellation' | 'departure' | 'arrival';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  oldValue?: any;
  newValue?: any;
  flightNumber: string;
  timestamp: string;
}

// Trip reminder types
export interface TripReminder {
  tripId: string;
  tripName: string;
  departureDate: string;
  reminderType: 'departure' | 'check_in' | 'packing' | 'documents';
  hoursUntilTrip: number;
}

// Visa deadline types
export interface VisaDeadline {
  visaId: string;
  country: string;
  deadlineDate: string;
  daysUntilDeadline: number;
  reminderType: 'application' | 'renewal' | 'expiry';
}

// Notification context types
export interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  createNotification: (notification: Omit<AppNotification, '$id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  
  // Preferences
  preferences: NotificationPreferences | null;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  fetchPreferences: () => Promise<void>;
}

// Helper functions for notification display
export const getNotificationIcon = (type: NotificationType, category: NotificationCategory): string => {
  if (type === NotificationType.FLIGHT) {
    switch (category) {
      case NotificationCategory.ALERT:
        return '⚠️';
      case NotificationCategory.UPDATE:
        return '✈️';
      case NotificationCategory.WARNING:
        return '🚨';
      default:
        return '📢';
    }
  }
  
  if (type === NotificationType.TRIP) {
    switch (category) {
      case NotificationCategory.REMINDER:
        return '⏰';
      case NotificationCategory.UPDATE:
        return '🗺️';
      default:
        return '✈️';
    }
  }
  
  if (type === NotificationType.VISA) {
    switch (category) {
      case NotificationCategory.ALERT:
        return '📋';
      case NotificationCategory.WARNING:
        return '⚠️';
      default:
        return '📄';
    }
  }
  
  return '🔔';
};

export const getPriorityColor = (priority: NotificationPriority): string => {
  switch (priority) {
    case NotificationPriority.LOW:
      return 'text-blue-600 dark:text-blue-400';
    case NotificationPriority.MEDIUM:
      return 'text-yellow-600 dark:text-yellow-400';
    case NotificationPriority.HIGH:
      return 'text-orange-600 dark:text-orange-400';
    case NotificationPriority.CRITICAL:
      return 'text-red-600 dark:text-red-400 font-bold';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

export const getPriorityBgColor = (priority: NotificationPriority): string => {
  switch (priority) {
    case NotificationPriority.LOW:
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    case NotificationPriority.MEDIUM:
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    case NotificationPriority.HIGH:
      return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    case NotificationPriority.CRITICAL:
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    default:
      return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  }
};

export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString();
};

export const groupNotificationsByDate = (notifications: AppNotification[]): Record<string, AppNotification[]> => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const groups: Record<string, Notification[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'Older': []
  };
  
  notifications.forEach(notification => {
    const notificationDate = new Date(notification.createdAt);
    
    if (notificationDate >= today) {
      groups['Today'].push(notification);
    } else if (notificationDate >= yesterday) {
      groups['Yesterday'].push(notification);
    } else if (notificationDate >= thisWeek) {
      groups['This Week'].push(notification);
    } else {
      groups['Older'].push(notification);
    }
  });
  
  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });
  
  return groups;
};
