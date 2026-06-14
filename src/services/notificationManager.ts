import { 
  AppNotification, 
  NotificationType, 
  NotificationCategory, 
  NotificationPriority,
  NotificationPreferences 
} from '@/types/notification';
import { notificationService, notificationPreferencesService } from '@/lib/appwrite';
import { flightChangeDetector } from './flightChangeDetector';
import { SavedFlight } from '@/lib/appwrite';

export class NotificationManager {
  private userId: string | null = null;
  private preferences: NotificationPreferences | null = null;
  private browserNotificationPermission: NotificationPermission = 'default';

  constructor() {
    // Don't request permission automatically - wait for user gesture
    this.checkBrowserNotificationSupport();
  }

  /**
   * Initialize the notification manager with user ID
   */
  async initialize(userId: string): Promise<void> {
    console.log('🔔 Initializing NotificationManager for user:', userId);
    this.userId = userId;
    await this.loadPreferences();
    console.log('🔔 NotificationManager initialized successfully');
  }

  /**
   * Check browser notification support without requesting permission
   */
  private checkBrowserNotificationSupport(): void {
    if ('Notification' in window) {
      this.browserNotificationPermission = Notification.permission;
    }
  }

  /**
   * Request browser notification permission (must be called from user gesture)
   */
  async requestBrowserNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      try {
        this.browserNotificationPermission = await Notification.requestPermission();
        return this.browserNotificationPermission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Load user notification preferences
   */
  private async loadPreferences(): Promise<void> {
    if (!this.userId) return;

    try {
      this.preferences = await notificationPreferencesService.getPreferences(this.userId);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }

  /**
   * Create a notification and save it to the database
   */
  async createNotification(notification: Omit<AppNotification, '$id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!this.userId) {
      console.warn('Cannot create notification: user not initialized');
      return;
    }

    try {
      console.log('🔔 Creating notification:', notification.title);
      
      // Check if user wants this type of notification
      if (!this.shouldCreateNotification(notification)) {
        console.log('🔔 Notification blocked by user preferences');
        return;
      }

      // Create notification in database
      await notificationService.createNotification({
        ...notification,
        userId: this.userId
      });
      console.log('🔔 Notification saved to database');

      // Show browser notification if enabled and permission granted
      if (this.shouldShowBrowserNotification(notification)) {
        this.showBrowserNotification(notification);
        console.log('🔔 Browser notification shown');
      } else {
        console.log('🔔 Browser notification not shown - check permission and preferences');
      }

    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  }

  /**
   * Create a notification for a specific user (used for trip collaboration)
   */
  async createNotificationForUser(userId: string, notification: Omit<AppNotification, '$id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<void> {
    try {
      console.log('🔔 Creating notification for user:', userId, notification.title);
      
      // Create notification in database for the specific user
      const result = await notificationService.createNotification({
        ...notification,
        userId: userId
      });
      
      console.log('✅ Notification created successfully:', result);
    } catch (error) {
      console.error('❌ Error creating notification for user:', error);
      throw error;
    }
  }

  /**
   * Check if notification should be created based on user preferences
   */
  private shouldCreateNotification(notification: Omit<AppNotification, '$id' | 'createdAt' | 'updatedAt'>): boolean {
    if (!this.preferences) return true; // Default to true if no preferences

    switch (notification.type) {
      case NotificationType.FLIGHT:
        return this.shouldCreateFlightNotification(notification);
      case NotificationType.TRIP:
        return this.shouldCreateTripNotification(notification);
      case NotificationType.VISA:
        return this.shouldCreateVisaNotification(notification);
      case NotificationType.SYSTEM:
        return true; // Always show system notifications
      default:
        return true;
    }
  }

  /**
   * Check if flight notification should be created
   */
  private shouldCreateFlightNotification(notification: Omit<AppNotification, '$id' | 'createdAt' | 'updatedAt'>): boolean {
    if (!this.preferences) return true;

    switch (notification.category) {
      case NotificationCategory.ALERT:
        if (notification.data?.changeType === 'delay') {
          return this.preferences.flightDelays && 
                 notification.data?.delayMinutes >= this.preferences.flightDelaysThreshold;
        }
        if (notification.data?.changeType === 'gate_change') {
          return this.preferences.gateChanges;
        }
        if (notification.data?.changeType === 'status_change') {
          return this.preferences.statusChanges;
        }
        if (notification.data?.changeType === 'cancellation') {
          return this.preferences.cancellations;
        }
        return true;
      default:
        return true;
    }
  }

  /**
   * Check if trip notification should be created
   */
  private shouldCreateTripNotification(notification: Omit<AppNotification, '$id' | 'createdAt' | 'updatedAt'>): boolean {
    if (!this.preferences) return true;

    switch (notification.category) {
      case NotificationCategory.REMINDER:
        return this.preferences.tripReminders;
      case NotificationCategory.UPDATE:
        // All trip updates use the general tripUpdates preference
        return this.preferences.tripUpdates;
      default:
        return true;
    }
  }

  /**
   * Check if visa notification should be created
   */
  private shouldCreateVisaNotification(notification: Omit<AppNotification, '$id' | 'createdAt' | 'updatedAt'>): boolean {
    if (!this.preferences) return true;

    switch (notification.category) {
      case NotificationCategory.ALERT:
        return this.preferences.visaDeadlines;
      case NotificationCategory.UPDATE:
        return this.preferences.visaUpdates;
      default:
        return true;
    }
  }

  /**
   * Check if browser notification should be shown
   */
  private shouldShowBrowserNotification(notification: Omit<AppNotification, '$id' | 'createdAt' | 'updatedAt'>): boolean {
    if (!this.preferences) return false;
    if (this.browserNotificationPermission !== 'granted') return false;
    if (!this.preferences.browserNotifications) return false;

    // Only show browser notifications for high/critical priority
    return notification.priority === NotificationPriority.HIGH || 
           notification.priority === NotificationPriority.CRITICAL;
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: Omit<AppNotification, '$id' | 'createdAt' | 'updatedAt'>): void {
    if (!('Notification' in window) || this.browserNotificationPermission !== 'granted') {
      return;
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/img/sknrm.png',
        badge: '/img/sknrm.png',
        tag: `notification-${notification.type}-${notification.flightNumber || notification.tripId || 'system'}`,
        requireInteraction: notification.priority === NotificationPriority.CRITICAL,
        silent: notification.priority === NotificationPriority.LOW
      });

      // Auto-close after 5 seconds for non-critical notifications
      if (notification.priority !== NotificationPriority.CRITICAL) {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

      // Handle click to focus window
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };

    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  /**
   * Check for flight updates and create notifications
   */
  async checkForFlightUpdates(savedFlights: SavedFlight[]): Promise<void> {
    if (!this.userId || !this.preferences) return;

    for (const flight of savedFlights) {
      try {
        // Convert SavedFlight to FlightData format for change detection
        const currentFlightData = this.convertSavedFlightToFlightData(flight);
        
        // Detect changes
        const changes = flightChangeDetector.detectChanges(flight.flightNumber, currentFlightData);
        
        // Create notifications for each change
        for (const change of changes) {
          await this.createNotification({
            type: NotificationType.FLIGHT,
            category: this.getCategoryFromChange(change),
            title: this.getTitleFromChange(change),
            message: change.message,
            priority: this.getPriorityFromChange(change),
            read: false,
            flightNumber: flight.flightNumber,
            actionUrl: `/flight-tracker?flight=${flight.flightNumber}`,
            data: {
              changeType: change.type,
              severity: change.severity,
              oldValue: change.oldValue,
              newValue: change.newValue,
              delayMinutes: change.type === 'delay' ? change.newValue : undefined
            }
          });
        }
      } catch (error) {
        console.error(`Error checking flight updates for ${flight.flightNumber}:`, error);
      }
    }
  }

  /**
   * Check for trip reminders
   */
  async checkForTripReminders(): Promise<void> {
    if (!this.userId || !this.preferences?.tripReminders) return;

    try {
      // This would integrate with trip service to get upcoming trips
      // For now, we'll create a placeholder implementation
      const upcomingTrips = await this.getUpcomingTrips();
      
      for (const trip of upcomingTrips) {
        const hoursUntilTrip = this.getHoursUntilTrip(trip.departureDate);
        
        if (hoursUntilTrip <= this.preferences.tripReminderHours && hoursUntilTrip > 0) {
          await this.createNotification({
            type: NotificationType.TRIP,
            category: NotificationCategory.REMINDER,
            title: 'Trip Reminder',
            message: `Your trip to ${trip.destination} departs in ${Math.round(hoursUntilTrip)} hours`,
            priority: hoursUntilTrip <= 2 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
            read: false,
            tripId: trip.id,
            actionUrl: `/trip-planner/${trip.id}`,
            data: {
              tripName: trip.name,
              destination: trip.destination,
              departureDate: trip.departureDate,
              hoursUntilTrip
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking trip reminders:', error);
    }
  }

  /**
   * Create notification for new trip member
   */
  async notifyNewTripMember(tripId: string, tripTitle: string, newMemberName: string, newMemberId: string): Promise<void> {
    if (!this.userId) return;

    // Get all trip members except the new member
    const { tripService } = await import('./tripService');
    const members = await tripService.getTripMembers(tripId);
    const otherMembers = members.filter(member => member.userId !== newMemberId);

    // Create notifications for all other members
    for (const member of otherMembers) {
      await this.createNotificationForUser(member.userId, {
        type: NotificationType.TRIP,
        category: NotificationCategory.UPDATE,
        title: 'New Member Joined',
        message: `${newMemberName} joined your trip "${tripTitle}"`,
        priority: NotificationPriority.MEDIUM,
        read: false,
        tripId: tripId,
        actionUrl: `/trip-planner/${tripId}`,
        data: {
          tripTitle,
          newMemberName,
          newMemberId,
          memberId: member.userId
        }
      });
    }
  }

  /**
   * Create notification for new expense
   */
  async notifyNewExpense(tripId: string, tripTitle: string, expenseDescription: string, amount: number, currency: string, payerName: string, participants: string[], payerId: string): Promise<void> {
    if (!this.userId) return;

    // Create notifications for all participants except the payer
    for (const participantId of participants) {
      if (participantId !== payerId) {
        await this.createNotificationForUser(participantId, {
          type: NotificationType.TRIP,
          category: NotificationCategory.UPDATE,
          title: 'New Expense Added',
          message: `${payerName} added "${expenseDescription}" (${currency} ${amount}) to "${tripTitle}"`,
          priority: NotificationPriority.MEDIUM,
          read: false,
          tripId: tripId,
          actionUrl: `/trip-planner/${tripId}?tab=expenses`,
          data: {
            tripTitle,
            expenseDescription,
            amount,
            currency,
            payerName,
            participantId
          }
        });
      }
    }
  }

  /**
   * Create notification for new activity
   */
  async notifyNewActivity(tripId: string, tripTitle: string, activityTitle: string, addedByName: string, activityDate: string, addedById: string): Promise<void> {
    if (!this.userId) return;

    // Get all trip members except the one who added the activity
    const { tripService } = await import('./tripService');
    const members = await tripService.getTripMembers(tripId);
    const otherMembers = members.filter(member => member.userId !== addedById);

    // Create notifications for all other members
    for (const member of otherMembers) {
      await this.createNotificationForUser(member.userId, {
        type: NotificationType.TRIP,
        category: NotificationCategory.UPDATE,
        title: 'New Activity Added',
        message: `${addedByName} added "${activityTitle}" to "${tripTitle}"`,
        priority: NotificationPriority.MEDIUM,
        read: false,
        tripId: tripId,
        actionUrl: `/trip-planner/${tripId}?tab=planning`,
        data: {
          tripTitle,
          activityTitle,
          addedByName,
          activityDate,
          memberId: member.userId
        }
      });
    }
  }

  /**
   * Create notification for checklist item changes
   */
  async notifyChecklistUpdate(tripId: string, tripTitle: string, itemTitle: string, action: 'added' | 'completed' | 'assigned', actorName: string, assignedToName?: string, actorId?: string): Promise<void> {
    if (!this.userId) return;

    let message = '';
    let title = '';

    switch (action) {
      case 'added':
        title = 'New Checklist Item';
        message = `${actorName} added "${itemTitle}" to "${tripTitle}"`;
        break;
      case 'completed':
        title = 'Checklist Item Completed';
        message = `${actorName} completed "${itemTitle}" in "${tripTitle}"`;
        break;
      case 'assigned':
        title = 'Checklist Item Assigned';
        message = `${actorName} assigned "${itemTitle}" to ${assignedToName} in "${tripTitle}"`;
        break;
    }

    // Get all trip members
    const { tripService } = await import('./tripService');
    const members = await tripService.getTripMembers(tripId);

    // Create notifications for all members except the actor (unless it's an assignment)
    const targetMembers = action === 'assigned' ? members : members.filter(member => member.userId !== actorId);
    
    for (const member of targetMembers) {
      await this.createNotificationForUser(member.userId, {
        type: NotificationType.TRIP,
        category: NotificationCategory.UPDATE,
        title,
        message,
        priority: action === 'assigned' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        read: false,
        tripId: tripId,
        actionUrl: `/trip-planner/${tripId}?tab=checklist`,
        data: {
          tripTitle,
          itemTitle,
          action,
          actorName,
          assignedToName,
          memberId: member.userId
        }
      });
    }
  }

  /**
   * Check for visa deadline reminders
   */
  async checkForVisaUpdates(): Promise<void> {
    if (!this.userId || !this.preferences?.visaDeadlines) return;

    try {
      // This would integrate with visa service to get visa deadlines
      // For now, we'll create a placeholder implementation
      const visaDeadlines = await this.getVisaDeadlines();
      
      for (const visa of visaDeadlines) {
        const daysUntilDeadline = this.getDaysUntilDeadline(visa.deadlineDate);
        
        if (daysUntilDeadline <= this.preferences.visaDeadlineDays && daysUntilDeadline > 0) {
          await this.createNotification({
            type: NotificationType.VISA,
            category: NotificationCategory.ALERT,
            title: 'Visa Deadline Reminder',
            message: `Your visa for ${visa.country} expires in ${daysUntilDeadline} days`,
            priority: daysUntilDeadline <= 7 ? NotificationPriority.CRITICAL : 
                     daysUntilDeadline <= 14 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
            read: false,
            visaId: visa.id,
            actionUrl: `/visa-checker`,
            data: {
              country: visa.country,
              deadlineDate: visa.deadlineDate,
              daysUntilDeadline,
              reminderType: visa.reminderType
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking visa updates:', error);
    }
  }

  /**
   * Convert SavedFlight to FlightData format
   */
  private convertSavedFlightToFlightData(flight: SavedFlight): any {
    return {
      flightNumber: flight.flightNumber,
      status: flight.status,
      departure: {
        scheduledTime: flight.departure?.scheduledTime,
        estimatedTime: flight.departure?.estimatedTime,
        actualTime: flight.departure?.actualTime,
        gate: flight.departure?.gate,
        terminal: flight.departure?.terminal,
        delay: flight.departure?.delay
      },
      arrival: {
        scheduledTime: flight.arrival?.scheduledTime,
        estimatedTime: flight.arrival?.estimatedTime,
        actualTime: flight.arrival?.actualTime,
        gate: flight.arrival?.gate,
        terminal: flight.arrival?.terminal,
        delay: flight.arrival?.delay
      },
      aircraft: flight.aircraft,
      airline: flight.airline
    };
  }

  /**
   * Get notification category from flight change
   */
  private getCategoryFromChange(change: any): NotificationCategory {
    switch (change.type) {
      case 'cancellation':
        return NotificationCategory.WARNING;
      case 'delay':
      case 'gate_change':
      case 'status_change':
        return NotificationCategory.ALERT;
      case 'departure':
      case 'arrival':
        return NotificationCategory.UPDATE;
      default:
        return NotificationCategory.ALERT;
    }
  }

  /**
   * Get notification title from flight change
   */
  private getTitleFromChange(change: any): string {
    switch (change.type) {
      case 'cancellation':
        return 'Flight Cancelled';
      case 'delay':
        return 'Flight Delay';
      case 'gate_change':
        return 'Gate Change';
      case 'status_change':
        return 'Flight Status Update';
      case 'departure':
        return 'Flight Departed';
      case 'arrival':
        return 'Flight Arrived';
      default:
        return 'Flight Update';
    }
  }

  /**
   * Get notification priority from flight change
   */
  private getPriorityFromChange(change: any): NotificationPriority {
    switch (change.severity) {
      case 'critical':
        return NotificationPriority.CRITICAL;
      case 'high':
        return NotificationPriority.HIGH;
      case 'medium':
        return NotificationPriority.MEDIUM;
      case 'low':
        return NotificationPriority.LOW;
      default:
        return NotificationPriority.MEDIUM;
    }
  }

  /**
   * Placeholder method to get upcoming trips
   */
  private async getUpcomingTrips(): Promise<any[]> {
    // This would integrate with the trip service
    // For now, return empty array
    return [];
  }

  /**
   * Placeholder method to get visa deadlines
   */
  private async getVisaDeadlines(): Promise<any[]> {
    // This would integrate with the visa service
    // For now, return empty array
    return [];
  }

  /**
   * Calculate hours until trip
   */
  private getHoursUntilTrip(departureDate: string): number {
    const now = new Date();
    const departure = new Date(departureDate);
    return (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Calculate days until deadline
   */
  private getDaysUntilDeadline(deadlineDate: string): number {
    const now = new Date();
    const deadline = new Date(deadlineDate);
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    if (!this.userId) return;

    try {
      await notificationPreferencesService.updatePreferences(this.userId, preferences);
      await this.loadPreferences(); // Reload preferences
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences | null {
    return this.preferences;
  }

  /**
   * Check if browser notifications are supported and enabled
   */
  isBrowserNotificationEnabled(): boolean {
    return 'Notification' in window && 
           this.browserNotificationPermission === 'granted' && 
           this.preferences?.browserNotifications === true;
  }

  /**
   * Get notification status for debugging
   */
  getNotificationStatus(): {
    supported: boolean;
    permission: string;
    preferencesEnabled: boolean;
    userId: string | null;
    preferencesLoaded: boolean;
  } {
    return {
      supported: 'Notification' in window,
      permission: this.browserNotificationPermission,
      preferencesEnabled: this.preferences?.browserNotifications || false,
      userId: this.userId,
      preferencesLoaded: !!this.preferences
    };
  }

  /**
   * Test notification (for debugging)
   */
  async testNotification(): Promise<void> {
    if (!this.userId) {
      console.warn('Cannot test notification: user not initialized');
      return;
    }

    try {
      await this.createNotification({
        type: NotificationType.SYSTEM,
        category: NotificationCategory.ALERT,
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working',
        priority: NotificationPriority.MEDIUM,
        read: false,
        data: { test: true }
      });
      console.log('✅ Test notification created successfully');
    } catch (error) {
      console.error('❌ Error creating test notification:', error);
    }
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
