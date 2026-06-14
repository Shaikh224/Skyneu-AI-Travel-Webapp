import { flightService, authService } from '../lib/appwrite';
import { SavedFlight } from '../lib/appwrite';

// Dynamic import to avoid circular dependencies
let showFlightCleanupToast: ((removedFlight: SavedFlight, nextFlight: SavedFlight | null) => void) | null = null;

export interface FlightCleanupConfig {
  arrivalCleanupDelayMinutes: number; // Minutes after arrival to auto-remove
  enableAutoCleanup: boolean;
  enableNextFlightScheduling: boolean;
}

export interface CleanupResult {
  removedFlights: string[];
  nextFlightScheduled: SavedFlight | null;
  error?: string;
}

// Callback type for pinned flight updates
export type PinnedFlightUpdateCallback = (nextFlight: SavedFlight | null) => void;

class FlightCleanupService {
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();
  private pinnedFlightCallbacks: Set<PinnedFlightUpdateCallback> = new Set();
  private pinnedFlightId: string | null = null;
  private config: FlightCleanupConfig = {
    arrivalCleanupDelayMinutes: 20,
    enableAutoCleanup: true,
    enableNextFlightScheduling: true,
  };

  /**
   * Set the notification function for showing cleanup toasts
   */
  setNotificationFunction(notificationFn: (removedFlight: SavedFlight, nextFlight: SavedFlight | null) => void) {
    showFlightCleanupToast = notificationFn;
  }

  /**
   * Update configuration for cleanup behavior
   */
  updateConfig(config: Partial<FlightCleanupConfig>) {
    this.config = { ...this.config, ...config };
    console.log('🧹 Flight cleanup config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): FlightCleanupConfig {
    return { ...this.config };
  }

  /**
   * Register a callback for when pinned flight needs to be updated
   */
  onPinnedFlightUpdate(callback: PinnedFlightUpdateCallback) {
    this.pinnedFlightCallbacks.add(callback);
  }

  /**
   * Unregister a pinned flight update callback
   */
  offPinnedFlightUpdate(callback: PinnedFlightUpdateCallback) {
    this.pinnedFlightCallbacks.delete(callback);
  }

  /**
   * Notify all callbacks about pinned flight updates
   */
  private notifyPinnedFlightUpdate(nextFlight: SavedFlight | null) {
    this.pinnedFlightCallbacks.forEach(callback => {
      try {
        callback(nextFlight);
      } catch (error) {
        console.error('Error in pinned flight callback:', error);
      }
    });
  }

  /**
   * Schedule automatic cleanup for a specific flight when it arrives
   */
  scheduleCleanupForFlight(flightId: string, arrivalTime: Date) {
    if (!this.config.enableAutoCleanup) {
      return;
    }

    // Clear any existing timer for this flight
    this.cancelCleanupForFlight(flightId);

    const cleanupTime = new Date(arrivalTime.getTime() + (this.config.arrivalCleanupDelayMinutes * 60 * 1000));
    const delayMs = cleanupTime.getTime() - Date.now();

    if (delayMs <= 0) {
      // Flight arrived more than the delay period ago, cleanup immediately
      this.performCleanupForFlight(flightId);
      return;
    }

    console.log(`⏰ Scheduling cleanup for flight ${flightId} in ${Math.round(delayMs / 60000)} minutes`);

    const timer = setTimeout(() => {
      this.performCleanupForFlight(flightId);
    }, delayMs);

    this.cleanupTimers.set(flightId, timer);
  }

  /**
   * Cancel scheduled cleanup for a specific flight
   */
  cancelCleanupForFlight(flightId: string) {
    const timer = this.cleanupTimers.get(flightId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(flightId);
      console.log(`❌ Cancelled cleanup timer for flight ${flightId}`);
    }
  }

  /**
   * Remove flight from tracker (not from saved flights) for a specific flight
   */
  private async performCleanupForFlight(flightId: string) {
    try {
      console.log(`🧹 Removing arrived flight from tracker: ${flightId}`);

      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        console.error('❌ User not authenticated for cleanup');
        return;
      }

      // Get the flight to be removed from tracker
      const flightToRemove = await flightService.getSavedFlight(flightId);
      if (!flightToRemove) {
        console.log(`⚠️ Flight ${flightId} not found for cleanup`);
        return;
      }

      // Verify the flight has actually arrived
      if (flightToRemove.status !== 'arrived') {
        console.log(`⚠️ Flight ${flightId} status is ${flightToRemove.status}, not arrived. Skipping cleanup.`);
        return;
      }

      // Check if this is the currently pinned flight
      const isPinned = await this.isFlightPinned(flightId);

      // Only proceed if this is the pinned flight (we only remove from tracker, not saved flights)
      if (isPinned) {
        console.log(`✅ Removing arrived flight from tracker: ${flightToRemove.flightNumber}`);
        
        // Try to schedule the next available flight
        if (this.config.enableNextFlightScheduling) {
          const nextFlight = await this.scheduleNextFlight(currentUser.$id, flightToRemove);
          this.notifyPinnedFlightUpdate(nextFlight);
          
          // Show notification if available
          if (showFlightCleanupToast) {
            showFlightCleanupToast(flightToRemove, nextFlight);
          }
        } else {
          // Just clear the pinned flight without scheduling next
          this.notifyPinnedFlightUpdate(null);
          
          // Show notification
          if (showFlightCleanupToast) {
            showFlightCleanupToast(flightToRemove, null);
          }
        }
      } else {
        console.log(`⚠️ Flight ${flightId} is not currently pinned, skipping tracker cleanup`);
      }

      // Clean up the timer
      this.cleanupTimers.delete(flightId);

    } catch (error) {
      console.error(`❌ Error during tracker cleanup for flight ${flightId}:`, error);
    }
  }

  /**
   * Set the currently pinned flight ID for cleanup detection
   */
  setPinnedFlightId(flightId: string | null) {
    this.pinnedFlightId = flightId;
  }

  /**
   * Check if a flight is currently pinned
   */
  private async isFlightPinned(flightId: string): Promise<boolean> {
    try {
      // Check against the stored pinned flight ID
      return this.pinnedFlightId === flightId;
    } catch (error) {
      console.error('Error checking if flight is pinned:', error);
      return false;
    }
  }

  /**
   * Schedule the next available flight for auto-fill
   */
  private async scheduleNextFlight(userId: string, removedFlight: SavedFlight) {
    try {
      console.log(`🔍 Looking for next scheduled flight after ${removedFlight.flightNumber}`);

      // Get all user's saved flights
      const allFlights = await flightService.getSavedFlights(userId);

      // Filter for future flights that haven't arrived or been cancelled
      const futureFlights = allFlights.filter(flight => 
        flight.$id !== removedFlight.$id && // Exclude the removed flight
        flight.status !== 'arrived' &&
        flight.status !== 'cancelled' &&
        flight.departure.scheduledTime
      );

      if (futureFlights.length === 0) {
        console.log('📭 No future flights available to schedule');
        return null;
      }

      // Sort by departure time to get the next chronological flight
      const sortedFlights = futureFlights.sort((a, b) => {
        const timeA = new Date(a.departure.scheduledTime!).getTime();
        const timeB = new Date(b.departure.scheduledTime!).getTime();
        return timeA - timeB;
      });

      const nextFlight = sortedFlights[0];
      const departureTime = new Date(nextFlight.departure.scheduledTime!);
      const now = new Date();
      const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Only auto-schedule flights that are within reasonable tracking range (e.g., within 48 hours)
      if (hoursUntilDeparture <= 48 && hoursUntilDeparture > 0) {
        console.log(`✅ Next flight scheduled: ${nextFlight.flightNumber} (${hoursUntilDeparture.toFixed(1)}h from now)`);
        
        // You can emit an event here or update the pinned flight context
        // For now, we'll return the flight information
        return nextFlight;
      } else {
        console.log(`⏰ Next flight ${nextFlight.flightNumber} is ${hoursUntilDeparture.toFixed(1)}h away, not auto-scheduling`);
        return null;
      }

    } catch (error) {
      console.error('❌ Error scheduling next flight:', error);
      return null;
    }
  }

  /**
   * Check all saved flights and schedule cleanup for any that have arrived
   */
  async checkAndScheduleCleanups(userId?: string) {
    try {
      const currentUser = userId ? { $id: userId } : await authService.getCurrentUser();
      if (!currentUser) {
        return;
      }

      const savedFlights = await flightService.getSavedFlights(currentUser.$id);
      const arrivedFlights = savedFlights.filter(flight => 
        flight.status === 'arrived' && 
        flight.arrival.actualTime &&
        flight.$id
      );

      console.log(`🔍 Found ${arrivedFlights.length} arrived flights to check for cleanup`);

      for (const flight of arrivedFlights) {
        if (!flight.$id || !flight.arrival.actualTime) continue;

        const arrivalTime = new Date(flight.arrival.actualTime);
        const timeSinceArrival = Date.now() - arrivalTime.getTime();
        const minutesSinceArrival = timeSinceArrival / (1000 * 60);

        if (minutesSinceArrival >= this.config.arrivalCleanupDelayMinutes) {
          // Flight arrived long enough ago, cleanup immediately
          await this.performCleanupForFlight(flight.$id);
        } else {
          // Schedule cleanup for the remaining time
          this.scheduleCleanupForFlight(flight.$id, arrivalTime);
        }
      }

    } catch (error) {
      console.error('❌ Error checking and scheduling cleanups:', error);
    }
  }

  /**
   * Manual cleanup of arrived flights from tracker (not from saved flights)
   */
  async cleanupArrivedFlights(userId?: string): Promise<CleanupResult> {
    const result: CleanupResult = {
      removedFlights: [],
      nextFlightScheduled: null
    };

    try {
      const currentUser = userId ? { $id: userId } : await authService.getCurrentUser();
      if (!currentUser) {
        result.error = 'User not authenticated';
        return result;
      }

      const savedFlights = await flightService.getSavedFlights(currentUser.$id);
      const arrivedFlights = savedFlights.filter(flight => 
        flight.status === 'arrived' && 
        flight.arrival.actualTime &&
        flight.$id
      );

      const cutoffTime = Date.now() - (this.config.arrivalCleanupDelayMinutes * 60 * 1000);

      for (const flight of arrivedFlights) {
        if (!flight.$id || !flight.arrival.actualTime) continue;

        const arrivalTime = new Date(flight.arrival.actualTime).getTime();
        
        if (arrivalTime <= cutoffTime) {
          // Check if this is the currently pinned flight
          const isPinned = await this.isFlightPinned(flight.$id);
          
          if (isPinned) {
            // Only clear from tracker if it's pinned, don't delete from saved flights
            result.removedFlights.push(flight.flightNumber);
            console.log(`🧹 Removed arrived flight from tracker: ${flight.flightNumber}`);
            
            // Try to schedule next flight
            if (this.config.enableNextFlightScheduling) {
              const nextFlight = await this.scheduleNextFlight(currentUser.$id, flight);
              result.nextFlightScheduled = nextFlight;
              this.notifyPinnedFlightUpdate(nextFlight);
            } else {
              this.notifyPinnedFlightUpdate(null);
            }
          }
        }
      }

      console.log(`✅ Tracker cleanup completed: ${result.removedFlights.length} flights removed from tracker`);
      
    } catch (error) {
      console.error('❌ Error during manual tracker cleanup:', error);
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  /**
   * Cancel all pending cleanup timers
   */
  cancelAllCleanups() {
    console.log(`🛑 Cancelling ${this.cleanupTimers.size} pending cleanup timers`);
    
    for (const timer of this.cleanupTimers.values()) {
      clearTimeout(timer);
    }
    
    this.cleanupTimers.clear();
  }

  /**
   * Get status of pending cleanups
   */
  getCleanupStatus() {
    return {
      pendingCleanups: this.cleanupTimers.size,
      config: this.config,
      scheduledFlights: Array.from(this.cleanupTimers.keys())
    };
  }
}

// Export singleton instance
export const flightCleanupService = new FlightCleanupService();
