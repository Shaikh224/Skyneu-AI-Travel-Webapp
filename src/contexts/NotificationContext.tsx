import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthSafe } from './AppwriteAuthContext';
import { 
  AppNotification, 
  NotificationPreferences, 
  NotificationContextType 
} from '@/types/notification';
import { 
  notificationService, 
  notificationPreferencesService,
  appwriteClient,
  DATABASE_ID,
  NOTIFICATIONS_COLLECTION_ID
} from '@/lib/appwrite';
import { notificationManager } from '@/services/notificationManager';
import { notificationAutoChecker } from '@/services/notificationAutoChecker';
import { usePinnedFlight } from './PinnedFlightContext';

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  const authContext = useAuthSafe();
  
  // Get saved flights from PinnedFlight context (not used in this context, but kept for compatibility)
  // Note: PinnedFlightContext doesn't expose savedFlights, so we'll handle this differently
  const savedFlights: any[] = [];

  // Initialize notification manager when user changes
  useEffect(() => {
    if (authContext?.user?.$id) {
      // Delay initialization to prevent blocking the UI
      const initTimer = setTimeout(() => {
        try {
          console.log('🔔 NotificationContext: Initializing for user:', authContext.user.$id);
          notificationManager.initialize(authContext.user.$id);
          fetchPreferences();
          fetchNotifications();
          
          // Subscribe to realtime updates for this user's notifications
          // Using the correct Appwrite Realtime channel format
          // Note: We store unsubscribe to properly clean up the subscription
          let unsubscribeFunc: (() => void) | null = null;
          
          try {
            // Subscribe to all documents in the notifications collection
            // Channel format: databases.<databaseId>.collections.<collectionId>.documents
            const channel = `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`;
            
            console.log('🔌 Subscribing to realtime channel:', channel);
            
            unsubscribeFunc = appwriteClient.subscribe(channel, (response: any) => {
              console.log('📡 Realtime event received:', response);
              
              // Check if this is a create event
              const isCreateEvent = response.events?.some((event: string) => 
                event.includes('.create')
              );
              
              if (isCreateEvent) {
                // Check if the notification is for the current user
                const payload = response.payload;
                if (payload && payload.userId === authContext.user.$id) {
                  console.log('🔔 New notification for current user, refreshing...');
                  fetchNotifications();
                }
              }
            });
            
            console.log('✅ Realtime subscription established');
          } catch (subErr) {
            console.error('❌ Realtime subscribe error:', subErr);
          }
          
          console.log('🔔 NotificationContext: Initialization complete');
          
          // Cleanup function for the timer
          return () => {
            if (unsubscribeFunc) {
              try {
                unsubscribeFunc();
                console.log('🔌 Realtime subscription cleaned up');
              } catch (err) {
                console.error('Error unsubscribing:', err);
              }
            }
          };
        } catch (error) {
          console.error('❌ NotificationContext: Error initializing notification manager:', error);
          setError('Failed to initialize notifications');
        }
      }, 100);

      return () => {
        clearTimeout(initTimer);
      };
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
      try {
        notificationAutoChecker.stopAutoCheck();
      } catch (error) {
        console.error('Error stopping auto checker:', error);
      }
    }
  }, [authContext?.user?.$id]);

  // Start auto-checker when user is authenticated and has saved flights
  useEffect(() => {
    if (authContext?.user?.$id && savedFlights.length > 0) {
      // Delay auto-checker start to prevent blocking UI
      const autoCheckTimer = setTimeout(() => {
        try {
          notificationAutoChecker.startAutoCheck(savedFlights, (newCount) => {
            if (newCount > 0) {
              // Show toast notification for new notifications
              // This would integrate with a toast library like react-hot-toast
              console.log(`You have ${newCount} new notifications`);
              fetchNotifications(); // Refresh notifications
            }
          });
        } catch (error) {
          console.error('Error starting auto checker:', error);
        }
      }, 500);

      return () => {
        clearTimeout(autoCheckTimer);
        try {
          notificationAutoChecker.stopAutoCheck();
        } catch (error) {
          console.error('Error stopping auto checker in cleanup:', error);
        }
      };
    } else {
      try {
        notificationAutoChecker.stopAutoCheck();
      } catch (error) {
        console.error('Error stopping auto checker:', error);
      }
    }
  }, [authContext?.user?.$id, savedFlights]);

  // Update auto-checker when saved flights change
  useEffect(() => {
    if (authContext?.user?.$id && savedFlights.length > 0) {
      try {
        notificationAutoChecker.updateSavedFlights(savedFlights);
      } catch (error) {
        console.error('Error updating saved flights:', error);
      }
    }
  }, [savedFlights, authContext?.user?.$id]);

  // Run startup check if needed
  useEffect(() => {
    if (authContext?.user?.$id && notificationAutoChecker.needsStartupCheck()) {
      try {
        notificationAutoChecker.forceCheck().then(() => {
          fetchNotifications();
        }).catch((error) => {
          console.error('Error in startup check:', error);
        });
      } catch (error) {
        console.error('Error starting startup check:', error);
      }
    }
  }, [authContext?.user?.$id]);

  const fetchNotifications = useCallback(async () => {
    if (!authContext?.user?.$id) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedNotifications = await notificationService.getNotificationsByUser(authContext.user.$id);
      // Type assertion: the service returns documents with all AppNotification fields
      setNotifications(fetchedNotifications as any as AppNotification[]);
      
      // Calculate unread count
      const unread = fetchedNotifications.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
      // Set empty arrays on error to prevent crashes
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [authContext?.user?.$id]);

  const fetchPreferences = useCallback(async () => {
    if (!authContext?.user?.$id) return;

    try {
      const fetchedPreferences = await notificationPreferencesService.getPreferences(authContext.user.$id);
      setPreferences(fetchedPreferences);
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      // Set null on error to prevent crashes
      setPreferences(null);
    }
  }, [authContext?.user?.$id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Delete on read per requirement
      await notificationService.deleteNotification(notificationId);
      
      // Update local state: remove it
      setNotifications(prev => prev.filter(notification => notification.$id !== notificationId));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error deleting notification on read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!authContext?.user?.$id) return;

    try {
      await notificationService.markAllAsRead(authContext.user.$id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [authContext?.user?.$id]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.$id === notificationId);
      setNotifications(prev => prev.filter(notification => notification.$id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  const createNotification = useCallback(async (notification: Omit<AppNotification, '$id' | 'createdAt' | 'updatedAt'>) => {
    if (!authContext?.user?.$id) return;

    try {
      await notificationService.createNotification({
        ...notification,
        userId: authContext.user.$id
      });
      
      // Refresh notifications to show the new one
      fetchNotifications();
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  }, [authContext?.user?.$id, fetchNotifications]);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!authContext?.user?.$id) return;

    try {
      await notificationPreferencesService.updatePreferences(authContext.user.$id, newPreferences);
      
      // Update local state
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
      
      // Update notification manager preferences
      await notificationManager.updatePreferences(newPreferences);
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      throw err;
    }
  }, [authContext?.user?.$id]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    preferences,
    updatePreferences,
    fetchPreferences
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
