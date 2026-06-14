import { flightService, authService } from '../lib/appwrite';
import { SavedFlight } from '../lib/appwrite';
import unifiedFlightTracker from './flightTracking/unifiedFlightTracker';
import { notificationManager } from './notificationManager';
import { flightChangeDetector } from './flightChangeDetector';

export interface FlightUpdateResult {
  success: boolean;
  updatedFlight?: SavedFlight;
  error?: string;
  flightNumber: string;
}

export interface FlightUpdateProgress {
  total: number;
  completed: number;
  current: string;
  results: FlightUpdateResult[];
}

class FlightUpdaterService {
  private liveUpdateInterval: NodeJS.Timeout | null = null;
  private futureUpdateInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;
  private updateListeners: ((progress: FlightUpdateProgress) => void)[] = [];
  private lastUpdateTime: number = 0;
  private readonly MIN_UPDATE_INTERVAL = 30000; // 30 seconds minimum between updates

  /**
   * Add a listener for update progress
   */
  addUpdateListener(listener: (progress: FlightUpdateProgress) => void) {
    this.updateListeners.push(listener);
  }

  /**
   * Remove a listener for update progress
   */
  removeUpdateListener(listener: (progress: FlightUpdateProgress) => void) {
    this.updateListeners = this.updateListeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of update progress
   */
  private notifyListeners(progress: FlightUpdateProgress) {
    this.updateListeners.forEach(listener => listener(progress));
  }

  /**
   * Re-evaluate flight classification based on current time
   * This helps fix cases where flights were misclassified
   */
  private reclassifyFlight(flight: SavedFlight): SavedFlight {
    if (!flight.departure.scheduledTime) {
      return flight; // Cannot reclassify without scheduled time
    }
    
    const departureTime = new Date(flight.departure.scheduledTime);
    const now = new Date();
    const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // If flight was marked as live but is more than 2 hours before departure, it should be future
    if (flight.isLive && hoursUntilDeparture > 2) {
      return {
        ...flight,
        isLive: false,
        isFutureFlight: true
      };
    }
    
    // If flight was marked as future but is past departure time and has live indicators, it should be live
    if (flight.isFutureFlight && hoursUntilDeparture < -1 && (flight.status === 'en-route' || flight.status === 'active')) {
      return {
        ...flight,
        isLive: true,
        isFutureFlight: false
      };
    }
    
    return flight;
  }

  /**
   * Get saved flights that need updating (future or live flights)
   * Future flights only start updating 23 hours before departure
   */
  private async getFlightsToUpdate(): Promise<SavedFlight[]> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const savedFlights = await flightService.getSavedFlights(currentUser.$id);
      
      // Re-classify flights based on current time to fix misclassifications
      const reclassifiedFlights = savedFlights.map(flight => this.reclassifyFlight(flight));
      
      // Filter for flights that need updating
      const flightsToUpdate = reclassifiedFlights.filter(flight => {
        // Skip completed flights
        if (flight.status === 'arrived' || flight.status === 'cancelled') {
          return false;
        }

        // Live flights always need updating
        if (flight.isLive) {
          return true;
        }

        // Future flights only need updating if within 23 hours of departure
        if (flight.isFutureFlight) {
          if (!flight.departure.scheduledTime) {
            return false; // Cannot determine timing without scheduled time
          }
          const departureTime = new Date(flight.departure.scheduledTime);
          const now = new Date();
          const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          // Only update if within 23 hours of departure
          if (hoursUntilDeparture <= 23 && hoursUntilDeparture > 0) {
            return true;
          } else if (hoursUntilDeparture > 23) {
            return false;
          }
        }

        return false;
      });

      
      return flightsToUpdate;
    } catch (error) {
      console.error('Error getting flights to update:', error);
      throw error;
    }
  }

  /**
   * Update a single flight's data
   */
  private async updateSingleFlight(savedFlight: SavedFlight): Promise<FlightUpdateResult> {
    try {
      
      // Get fresh flight data using the original search date to maintain date context
      const searchParams: any = {
        flightNumber: savedFlight.flightNumber
      };
      
      // If we have a saved search date, use it to get the correct flight schedule
      if (savedFlight.searchDate) {
        searchParams.date = new Date(savedFlight.searchDate);
      }
      
      const freshFlightData = await unifiedFlightTracker.trackFlight(searchParams);
      
      if (!freshFlightData) {
        return {
          success: false,
          error: 'Flight data not found',
          flightNumber: savedFlight.flightNumber
        };
      }

      // Create updated saved flight data
      const updatedFlightData: Omit<SavedFlight, 'savedAt' | '$id'> = {
        userId: savedFlight.userId,
        flightNumber: freshFlightData.flightNumber,
        flight: {
          number: freshFlightData.flight.number,
          iataNumber: freshFlightData.flight.iataNumber,
          icaoNumber: freshFlightData.flight.icaoNumber
        },
        airline: {
          name: freshFlightData.airline.name,
          iataCode: freshFlightData.airline.iataCode,
          logoUrl: freshFlightData.logoUrl
        },
        departure: {
          airport: freshFlightData.schedule.departure.airport || '',
          airportName: freshFlightData.schedule.departure.airportName,
          airportCity: freshFlightData.schedule.departure.airportCity,
          airportCountry: freshFlightData.schedule.departure.airportCountry,
          scheduledTime: freshFlightData.schedule.departure.scheduledTime,
          actualTime: freshFlightData.schedule.departure.actualTime,
          estimatedTime: freshFlightData.schedule.departure.estimatedTime,
          gate: freshFlightData.schedule.departure.gate,
          terminal: freshFlightData.schedule.departure.terminal,
          delay: freshFlightData.schedule.departure.delay
        },
        arrival: {
          airport: freshFlightData.schedule.arrival.airport || '',
          airportName: freshFlightData.schedule.arrival.airportName,
          airportCity: freshFlightData.schedule.arrival.airportCity,
          airportCountry: freshFlightData.schedule.arrival.airportCountry,
          scheduledTime: freshFlightData.schedule.arrival.scheduledTime,
          actualTime: freshFlightData.schedule.arrival.actualTime,
          estimatedTime: freshFlightData.schedule.arrival.estimatedTime,
          gate: freshFlightData.schedule.arrival.gate,
          terminal: freshFlightData.schedule.arrival.terminal,
          baggage: freshFlightData.schedule.arrival.baggage,
          delay: freshFlightData.schedule.arrival.delay
        },
        status: freshFlightData.status,
        aircraft: freshFlightData.aircraft ? {
          type: freshFlightData.aircraft.type,
          registration: freshFlightData.aircraft.registration
        } : undefined,
        isFutureFlight: freshFlightData.isFutureFlight,
        isLive: freshFlightData.isLive,
        searchDate: savedFlight.searchDate // Keep original search date
      };

      // Update the flight in the database
      const updatedFlight = await flightService.updateSavedFlight(savedFlight.$id!, updatedFlightData);
      
      // Check for changes and create notifications
      try {
        const currentFlightData = {
          flightNumber: updatedFlight.flightNumber,
          status: updatedFlight.status,
          departure: {
            scheduledTime: updatedFlight.departure.scheduledTime,
            estimatedTime: updatedFlight.departure.estimatedTime,
            actualTime: updatedFlight.departure.actualTime,
            gate: updatedFlight.departure.gate,
            terminal: updatedFlight.departure.terminal,
            delay: updatedFlight.departure.delay
          },
          arrival: {
            scheduledTime: updatedFlight.arrival.scheduledTime,
            estimatedTime: updatedFlight.arrival.estimatedTime,
            actualTime: updatedFlight.arrival.actualTime,
            gate: updatedFlight.arrival.gate,
            terminal: updatedFlight.arrival.terminal,
            delay: updatedFlight.arrival.delay
          },
          aircraft: updatedFlight.aircraft,
          airline: updatedFlight.airline
        };

        // Detect changes
        const changes = flightChangeDetector.detectChanges(updatedFlight.flightNumber, currentFlightData);
        
        // Create notifications for each change
        for (const change of changes) {
          await notificationManager.createNotification({
            type: 'flight' as any,
            category: change.type === 'cancellation' ? 'warning' as any : 'alert' as any,
            title: this.getTitleFromChange(change),
            message: change.message,
            priority: this.getPriorityFromChange(change),
            read: false,
            flightNumber: updatedFlight.flightNumber,
            actionUrl: `/flight-tracker?flight=${updatedFlight.flightNumber}`,
            data: {
              changeType: change.type,
              severity: change.severity,
              oldValue: change.oldValue,
              newValue: change.newValue,
              delayMinutes: change.type === 'delay' ? change.newValue : undefined
            }
          });
        }
      } catch (notificationError) {
        // Don't fail the flight update if notification creation fails
        console.error('Error creating notifications for flight update:', notificationError);
      }
      
      return {
        success: true,
        updatedFlight,
        flightNumber: savedFlight.flightNumber
      };

    } catch (error) {
      console.error(`❌ Error updating flight ${savedFlight.flightNumber}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        flightNumber: savedFlight.flightNumber
      };
    }
  }

  /**
   * Update a specific flight by ID
   */
  async updateSelectedFlight(flightId: string): Promise<FlightUpdateResult> {
    if (this.isUpdating) {
      return {
        success: false,
        error: 'Update already in progress',
        flightNumber: ''
      };
    }

    // Check cooldown period to prevent excessive API calls
    const now = Date.now();
    if (now - this.lastUpdateTime < this.MIN_UPDATE_INTERVAL) {
      return {
        success: false,
        error: 'Cooldown active',
        flightNumber: ''
      };
    }

    this.isUpdating = true;
    this.lastUpdateTime = now;

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get the specific flight
      const savedFlight = await flightService.getSavedFlight(flightId);
      if (!savedFlight) {
        return {
          success: false,
          error: 'Flight not found',
          flightNumber: ''
        };
      }

      // Check if flight needs updating
      if (savedFlight.status === 'arrived' || savedFlight.status === 'cancelled') {
        return {
          success: false,
          error: 'Flight is completed',
          flightNumber: savedFlight.flightNumber
        };
      }

      // For future flights, check if within 23 hours of departure
      if (savedFlight.isFutureFlight && !savedFlight.isLive) {
        if (!savedFlight.departure.scheduledTime) {
          return {
            success: false,
            error: 'Flight has no scheduled departure time',
            flightNumber: savedFlight.flightNumber
          };
        }
        const departureTime = new Date(savedFlight.departure.scheduledTime);
        const now = new Date();
        const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilDeparture > 23) {
          return {
            success: false,
            error: `Flight is ${hoursUntilDeparture.toFixed(1)} hours from departure. Updates start 23 hours before departure.`,
            flightNumber: savedFlight.flightNumber
          };
        }
      }

      const result = await this.updateSingleFlight(savedFlight);
      return result;

    } catch (error) {
      console.error('❌ Error updating selected flight:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        flightNumber: ''
      };
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Get only live flights that need updating
   */
  private async getLiveFlightsToUpdate(): Promise<SavedFlight[]> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const savedFlights = await flightService.getSavedFlights(currentUser.$id);
      
      // Re-classify flights based on current time
      const reclassifiedFlights = savedFlights.map(flight => this.reclassifyFlight(flight));
      
      // Filter for live flights only
      const liveFlights = reclassifiedFlights.filter(flight => 
        flight.isLive && 
        flight.status !== 'arrived' && 
        flight.status !== 'cancelled'
      );
      return liveFlights;
    } catch (error) {
      console.error('Error getting live flights to update:', error);
      throw error;
    }
  }

  /**
   * Get only future flights that need updating (within 23 hours)
   */
  private async getFutureFlightsToUpdate(): Promise<SavedFlight[]> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const savedFlights = await flightService.getSavedFlights(currentUser.$id);
      
      // Re-classify flights based on current time
      const reclassifiedFlights = savedFlights.map(flight => this.reclassifyFlight(flight));
      
      // Filter for future flights within 23 hours of departure
      const futureFlights = reclassifiedFlights.filter(flight => {
        if (!flight.isFutureFlight || flight.isLive || flight.status === 'arrived' || flight.status === 'cancelled') {
          return false;
        }

        if (!flight.departure.scheduledTime) {
          return false; // Cannot determine timing without scheduled time
        }
        
        const departureTime = new Date(flight.departure.scheduledTime);
        const now = new Date();
        const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        return hoursUntilDeparture <= 23 && hoursUntilDeparture > 0;
      });

      return futureFlights;
    } catch (error) {
      console.error('Error getting future flights to update:', error);
      throw error;
    }
  }

  /**
   * Update live flights only
   */
  async updateLiveFlights(): Promise<FlightUpdateResult[]> {
    if (this.isUpdating) {
      return [];
    }

    // Check cooldown period to prevent excessive API calls
    const now = Date.now();
    if (now - this.lastUpdateTime < this.MIN_UPDATE_INTERVAL) {
      return [];
    }

    this.isUpdating = true;
    this.lastUpdateTime = now;
    const results: FlightUpdateResult[] = [];

    try {
      const liveFlights = await this.getLiveFlightsToUpdate();
      
      if (liveFlights.length === 0) {
        return results;
      }

      const progress: FlightUpdateProgress = {
        total: liveFlights.length,
        completed: 0,
        current: '',
        results: []
      };

      // Update live flights one by one
      for (const flight of liveFlights) {
        progress.current = flight.flightNumber;
        this.notifyListeners(progress);

        const result = await this.updateSingleFlight(flight);
        results.push(result);
        progress.results.push(result);
        progress.completed++;

        this.notifyListeners(progress);

        // Add a small delay between updates
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return results;

    } catch (error) {
      console.error('❌ Error during live flight update process:', error);
      throw error;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Update future flights only (within 23 hours of departure)
   */
  async updateFutureFlights(): Promise<FlightUpdateResult[]> {
    if (this.isUpdating) {
      return [];
    }

    // Check cooldown period to prevent excessive API calls
    const now = Date.now();
    if (now - this.lastUpdateTime < this.MIN_UPDATE_INTERVAL) {
      return [];
    }

    this.isUpdating = true;
    this.lastUpdateTime = now;
    const results: FlightUpdateResult[] = [];

    try {
      const futureFlights = await this.getFutureFlightsToUpdate();
      
      if (futureFlights.length === 0) {
        return results;
      }

      const progress: FlightUpdateProgress = {
        total: futureFlights.length,
        completed: 0,
        current: '',
        results: []
      };

      // Update future flights one by one
      for (const flight of futureFlights) {
        progress.current = flight.flightNumber;
        this.notifyListeners(progress);

        const result = await this.updateSingleFlight(flight);
        results.push(result);
        progress.results.push(result);
        progress.completed++;

        this.notifyListeners(progress);

        // Add a small delay between updates
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return results;

    } catch (error) {
      console.error('❌ Error during future flight update process:', error);
      throw error;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Update non-pinned flights (legacy method - now calls both live and future updates)
   */
  async updateNonPinnedFlights(): Promise<FlightUpdateResult[]> {
    
    // Run both live and future flight updates
    const [liveResults, futureResults] = await Promise.all([
      this.updateLiveFlights(),
      this.updateFutureFlights()
    ]);

    const allResults = [...liveResults, ...futureResults];
    
    return allResults;
  }

  /**
   * Update all saved flights that need updating
   */
  async updateAllFlights(): Promise<FlightUpdateResult[]> {
    if (this.isUpdating) {
      return [];
    }

    // Check cooldown period to prevent excessive API calls
    const now = Date.now();
    if (now - this.lastUpdateTime < this.MIN_UPDATE_INTERVAL) {
      return [];
    }

    this.isUpdating = true;
    this.lastUpdateTime = now;
    const results: FlightUpdateResult[] = [];

    try {
      const flightsToUpdate = await this.getFlightsToUpdate();
      
      if (flightsToUpdate.length === 0) {
        return results;
      }

      const progress: FlightUpdateProgress = {
        total: flightsToUpdate.length,
        completed: 0,
        current: '',
        results: []
      };

      // Update flights one by one to avoid rate limiting
      for (const flight of flightsToUpdate) {
        progress.current = flight.flightNumber;
        this.notifyListeners(progress);

        const result = await this.updateSingleFlight(flight);
        results.push(result);
        progress.results.push(result);
        progress.completed++;

        this.notifyListeners(progress);

        // Add a small delay between updates to be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return results;

    } catch (error) {
      console.error('❌ Error during flight update process:', error);
      throw error;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Start automatic updates with separate intervals for live and future flights
   */
  startAutoUpdates(liveIntervalMinutes: number = 12, futureIntervalMinutes: number = 30) {
    if (this.liveUpdateInterval || this.futureUpdateInterval) {
      return;
    }
    
    // Run initial updates
    this.updateLiveFlights().catch(error => {
      console.error('Error in initial live flight update:', error);
    });
    this.updateFutureFlights().catch(error => {
      console.error('Error in initial future flight update:', error);
    });

    // Set up live flight interval (more frequent)
    this.liveUpdateInterval = setInterval(() => {
      this.updateLiveFlights().catch(error => {
        console.error('Error in scheduled live flight update:', error);
      });
    }, liveIntervalMinutes * 60 * 1000);

    // Set up future flight interval (less frequent)
    this.futureUpdateInterval = setInterval(() => {
      this.updateFutureFlights().catch(error => {
        console.error('Error in scheduled future flight update:', error);
      });
    }, futureIntervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic updates
   */
  stopAutoUpdates() {
    if (this.liveUpdateInterval) {
      clearInterval(this.liveUpdateInterval);
      this.liveUpdateInterval = null;
    }
    
    if (this.futureUpdateInterval) {
      clearInterval(this.futureUpdateInterval);
      this.futureUpdateInterval = null;
    }
  }

  /**
   * Check if updates are currently running
   */
  isCurrentlyUpdating(): boolean {
    return this.isUpdating;
  }

  /**
   * Get update status
   */
  getUpdateStatus() {
    return {
      isUpdating: this.isUpdating,
      hasAutoUpdates: this.liveUpdateInterval !== null || this.futureUpdateInterval !== null,
      hasLiveUpdates: this.liveUpdateInterval !== null,
      hasFutureUpdates: this.futureUpdateInterval !== null
    };
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
  private getPriorityFromChange(change: any): string {
    switch (change.severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }
}

// Export singleton instance
export const flightUpdaterService = new FlightUpdaterService();
