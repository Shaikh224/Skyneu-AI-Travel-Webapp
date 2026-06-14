import { notificationManager } from './notificationManager';
import { SavedFlight } from '@/lib/appwrite';

export class NotificationAutoChecker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkInterval = 5 * 60 * 1000; // 5 minutes
  private lastCheckTime: number = 0;
  private startupCheckThreshold = 10 * 60 * 1000; // 10 minutes
  private savedFlights: SavedFlight[] = [];
  private onNewNotifications?: (count: number) => void;

  constructor() {
    this.setupPageVisibilityListener();
  }

  /**
   * Start the auto-checker
   */
  startAutoCheck(savedFlights: SavedFlight[], onNewNotifications?: (count: number) => void): void {
    if (this.isRunning) {
      this.stopAutoCheck();
    }

    this.savedFlights = savedFlights;
    this.onNewNotifications = onNewNotifications;
    this.isRunning = true;

    // Run startup check if needed
    this.runStartupCheck();

    // Start regular interval
    this.intervalId = setInterval(() => {
      this.runNotificationCheck();
    }, this.checkInterval);

    console.log('Notification auto-checker started');
  }

  /**
   * Stop the auto-checker
   */
  stopAutoCheck(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Notification auto-checker stopped');
  }

  /**
   * Update saved flights data
   */
  updateSavedFlights(savedFlights: SavedFlight[]): void {
    this.savedFlights = savedFlights;
  }

  /**
   * Run startup check if last check was more than threshold ago
   */
  private async runStartupCheck(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastCheckTime;

    if (timeSinceLastCheck > this.startupCheckThreshold) {
      console.log('Running startup notification check');
      await this.runNotificationCheck();
    }
  }

  /**
   * Run the main notification check
   */
  private async runNotificationCheck(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const startTime = Date.now();
      let newNotificationCount = 0;

      // Check for flight updates
      const previousUnreadCount = await this.getUnreadCount();
      await notificationManager.checkForFlightUpdates(this.savedFlights);
      
      // Check for trip reminders
      await notificationManager.checkForTripReminders();
      
      // Check for visa updates
      await notificationManager.checkForVisaUpdates();

      // Check if new notifications were created
      const currentUnreadCount = await this.getUnreadCount();
      newNotificationCount = currentUnreadCount - previousUnreadCount;

      this.lastCheckTime = Date.now();
      const checkDuration = this.lastCheckTime - startTime;

      console.log(`Notification check completed in ${checkDuration}ms. New notifications: ${newNotificationCount}`);

      // Notify about new notifications
      if (newNotificationCount > 0 && this.onNewNotifications) {
        this.onNewNotifications(newNotificationCount);
      }

    } catch (error) {
      console.error('Error during notification check:', error);
    }
  }

  /**
   * Get current unread notification count
   */
  private async getUnreadCount(): Promise<number> {
    try {
      // This would use the notification service to get unread count
      // For now, return 0 as placeholder
      return 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Setup page visibility listener to pause/resume checking
   */
  private setupPageVisibilityListener(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAutoCheck();
      } else {
        this.resumeAutoCheck();
      }
    });
  }

  /**
   * Pause auto-check when page is hidden
   */
  private pauseAutoCheck(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Notification auto-checker paused (page hidden)');
  }

  /**
   * Resume auto-check when page becomes visible
   */
  private resumeAutoCheck(): void {
    if (this.isRunning && !this.intervalId) {
      // Run immediate check when page becomes visible
      this.runNotificationCheck();
      
      // Resume interval
      this.intervalId = setInterval(() => {
        this.runNotificationCheck();
      }, this.checkInterval);
      
      console.log('Notification auto-checker resumed (page visible)');
    }
  }

  /**
   * Force run a notification check (useful for manual triggers)
   */
  async forceCheck(): Promise<void> {
    console.log('Force running notification check');
    await this.runNotificationCheck();
  }

  /**
   * Update check interval
   */
  setCheckInterval(intervalMs: number): void {
    this.checkInterval = intervalMs;
    
    // Restart with new interval if currently running
    if (this.isRunning) {
      this.stopAutoCheck();
      this.startAutoCheck(this.savedFlights, this.onNewNotifications);
    }
  }

  /**
   * Get current status
   */
  getStatus(): {
    isRunning: boolean;
    checkInterval: number;
    lastCheckTime: number;
    timeSinceLastCheck: number;
  } {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      lastCheckTime: this.lastCheckTime,
      timeSinceLastCheck: Date.now() - this.lastCheckTime
    };
  }

  /**
   * Check if startup check is needed
   */
  needsStartupCheck(): boolean {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastCheckTime;
    return timeSinceLastCheck > this.startupCheckThreshold;
  }

  /**
   * Get time until next check
   */
  getTimeUntilNextCheck(): number {
    if (!this.isRunning || !this.intervalId) {
      return 0;
    }

    const now = Date.now();
    const timeSinceLastCheck = now - this.lastCheckTime;
    return Math.max(0, this.checkInterval - timeSinceLastCheck);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoCheck();
    this.savedFlights = [];
    this.onNewNotifications = undefined;
  }
}

// Export singleton instance
export const notificationAutoChecker = new NotificationAutoChecker();
