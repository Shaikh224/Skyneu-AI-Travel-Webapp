import { FlightChange } from '@/types/notification';

// Interface for flight data structure
interface FlightData {
  flightNumber: string;
  status?: string;
  departure?: {
    scheduledTime?: string;
    estimatedTime?: string;
    actualTime?: string;
    gate?: string;
    terminal?: string;
    delay?: number;
  };
  arrival?: {
    scheduledTime?: string;
    estimatedTime?: string;
    actualTime?: string;
    gate?: string;
    terminal?: string;
    delay?: number;
  };
  aircraft?: {
    type?: string;
    registration?: string;
  };
  airline?: {
    name?: string;
    iataCode?: string;
  };
}

export class FlightChangeDetector {
  private previousFlightData: Map<string, FlightData> = new Map();
  private readonly debounceTime = 5 * 60 * 1000; // 5 minutes
  private lastNotificationTime: Map<string, number> = new Map();

  /**
   * Detect changes in flight data and return array of changes
   */
  detectChanges(flightNumber: string, newData: FlightData): FlightChange[] {
    const changes: FlightChange[] = [];
    const previousData = this.previousFlightData.get(flightNumber);
    
    // If no previous data, store current data and return no changes
    if (!previousData) {
      this.previousFlightData.set(flightNumber, { ...newData });
      return changes;
    }

    // Check for status changes
    const statusChange = this.detectStatusChange(flightNumber, previousData, newData);
    if (statusChange) {
      changes.push(statusChange);
    }

    // Check for delays
    const delayChanges = this.detectDelays(flightNumber, previousData, newData);
    changes.push(...delayChanges);

    // Check for gate changes
    const gateChanges = this.detectGateChanges(flightNumber, previousData, newData);
    changes.push(...gateChanges);

    // Check for terminal changes
    const terminalChanges = this.detectTerminalChanges(flightNumber, previousData, newData);
    changes.push(...terminalChanges);

    // Check for departure/arrival events
    const departureChange = this.detectDepartureEvent(flightNumber, previousData, newData);
    if (departureChange) {
      changes.push(departureChange);
    }

    const arrivalChange = this.detectArrivalEvent(flightNumber, previousData, newData);
    if (arrivalChange) {
      changes.push(arrivalChange);
    }

    // Update stored data
    this.previousFlightData.set(flightNumber, { ...newData });

    // Filter out changes that were recently notified (debouncing)
    return this.filterRecentChanges(flightNumber, changes);
  }

  /**
   * Detect status changes (scheduled -> departed, departed -> arrived, etc.)
   */
  private detectStatusChange(flightNumber: string, previous: FlightData, current: FlightData): FlightChange | null {
    const prevStatus = previous.status?.toLowerCase() || '';
    const currStatus = current.status?.toLowerCase() || '';

    if (prevStatus === currStatus) {
      return null;
    }

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let message = `Flight ${flightNumber} status changed from ${prevStatus} to ${currStatus}`;

    // Determine severity based on status change
    if (currStatus.includes('cancelled') || currStatus.includes('canceled')) {
      severity = 'critical';
      message = `Flight ${flightNumber} has been cancelled`;
    } else if (currStatus.includes('delayed')) {
      severity = 'high';
      message = `Flight ${flightNumber} is delayed`;
    } else if (currStatus.includes('departed') || currStatus.includes('en-route')) {
      severity = 'medium';
      message = `Flight ${flightNumber} has departed`;
    } else if (currStatus.includes('arrived') || currStatus.includes('landed')) {
      severity = 'medium';
      message = `Flight ${flightNumber} has arrived`;
    } else if (currStatus.includes('boarding')) {
      severity = 'low';
      message = `Flight ${flightNumber} is now boarding`;
    }

    return {
      type: 'status_change',
      severity,
      message,
      oldValue: prevStatus,
      newValue: currStatus,
      flightNumber,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Detect delay changes
   */
  private detectDelays(flightNumber: string, previous: FlightData, current: FlightData): FlightChange[] {
    const changes: FlightChange[] = [];

    // Check departure delays
    const prevDepDelay = previous.departure?.delay || 0;
    const currDepDelay = current.departure?.delay || 0;
    
    if (currDepDelay > prevDepDelay && currDepDelay >= 15) {
      const delayIncrease = currDepDelay - prevDepDelay;
      changes.push({
        type: 'delay',
        severity: currDepDelay >= 60 ? 'high' : currDepDelay >= 30 ? 'medium' : 'low',
        message: `Flight ${flightNumber} departure delayed by ${currDepDelay} minutes (increased by ${delayIncrease} minutes)`,
        oldValue: prevDepDelay,
        newValue: currDepDelay,
        flightNumber,
        timestamp: new Date().toISOString()
      });
    }

    // Check arrival delays
    const prevArrDelay = previous.arrival?.delay || 0;
    const currArrDelay = current.arrival?.delay || 0;
    
    if (currArrDelay > prevArrDelay && currArrDelay >= 15) {
      const delayIncrease = currArrDelay - prevArrDelay;
      changes.push({
        type: 'delay',
        severity: currArrDelay >= 60 ? 'high' : currArrDelay >= 30 ? 'medium' : 'low',
        message: `Flight ${flightNumber} arrival delayed by ${currArrDelay} minutes (increased by ${delayIncrease} minutes)`,
        oldValue: prevArrDelay,
        newValue: currArrDelay,
        flightNumber,
        timestamp: new Date().toISOString()
      });
    }

    return changes;
  }

  /**
   * Detect gate changes
   */
  private detectGateChanges(flightNumber: string, previous: FlightData, current: FlightData): FlightChange[] {
    const changes: FlightChange[] = [];

    // Check departure gate changes
    const prevDepGate = previous.departure?.gate;
    const currDepGate = current.departure?.gate;
    
    if (prevDepGate && currDepGate && prevDepGate !== currDepGate) {
      changes.push({
        type: 'gate_change',
        severity: 'medium',
        message: `Flight ${flightNumber} departure gate changed from ${prevDepGate} to ${currDepGate}`,
        oldValue: prevDepGate,
        newValue: currDepGate,
        flightNumber,
        timestamp: new Date().toISOString()
      });
    }

    // Check arrival gate changes
    const prevArrGate = previous.arrival?.gate;
    const currArrGate = current.arrival?.gate;
    
    if (prevArrGate && currArrGate && prevArrGate !== currArrGate) {
      changes.push({
        type: 'gate_change',
        severity: 'medium',
        message: `Flight ${flightNumber} arrival gate changed from ${prevArrGate} to ${currArrGate}`,
        oldValue: prevArrGate,
        newValue: currArrGate,
        flightNumber,
        timestamp: new Date().toISOString()
      });
    }

    return changes;
  }

  /**
   * Detect terminal changes
   */
  private detectTerminalChanges(flightNumber: string, previous: FlightData, current: FlightData): FlightChange[] {
    const changes: FlightChange[] = [];

    // Check departure terminal changes
    const prevDepTerminal = previous.departure?.terminal;
    const currDepTerminal = current.departure?.terminal;
    
    if (prevDepTerminal && currDepTerminal && prevDepTerminal !== currDepTerminal) {
      changes.push({
        type: 'gate_change', // Using gate_change type for terminal changes too
        severity: 'high',
        message: `Flight ${flightNumber} departure terminal changed from ${prevDepTerminal} to ${currDepTerminal}`,
        oldValue: prevDepTerminal,
        newValue: currDepTerminal,
        flightNumber,
        timestamp: new Date().toISOString()
      });
    }

    // Check arrival terminal changes
    const prevArrTerminal = previous.arrival?.terminal;
    const currArrTerminal = current.arrival?.terminal;
    
    if (prevArrTerminal && currArrTerminal && prevArrTerminal !== currArrTerminal) {
      changes.push({
        type: 'gate_change', // Using gate_change type for terminal changes too
        severity: 'high',
        message: `Flight ${flightNumber} arrival terminal changed from ${prevArrTerminal} to ${currArrTerminal}`,
        oldValue: prevArrTerminal,
        newValue: currArrTerminal,
        flightNumber,
        timestamp: new Date().toISOString()
      });
    }

    return changes;
  }

  /**
   * Detect departure events (when flight actually departs)
   */
  private detectDepartureEvent(flightNumber: string, previous: FlightData, current: FlightData): FlightChange | null {
    const prevActualDep = previous.departure?.actualTime;
    const currActualDep = current.departure?.actualTime;
    
    // If actual departure time was added (flight departed)
    if (!prevActualDep && currActualDep) {
      return {
        type: 'departure',
        severity: 'medium',
        message: `Flight ${flightNumber} has departed at ${new Date(currActualDep).toLocaleTimeString()}`,
        oldValue: prevActualDep,
        newValue: currActualDep,
        flightNumber,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Detect arrival events (when flight actually arrives)
   */
  private detectArrivalEvent(flightNumber: string, previous: FlightData, current: FlightData): FlightChange | null {
    const prevActualArr = previous.arrival?.actualTime;
    const currActualArr = current.arrival?.actualTime;
    
    // If actual arrival time was added (flight arrived)
    if (!prevActualArr && currActualArr) {
      return {
        type: 'arrival',
        severity: 'medium',
        message: `Flight ${flightNumber} has arrived at ${new Date(currActualArr).toLocaleTimeString()}`,
        oldValue: prevActualArr,
        newValue: currActualArr,
        flightNumber,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Filter out changes that were recently notified to prevent spam
   */
  private filterRecentChanges(flightNumber: string, changes: FlightChange[]): FlightChange[] {
    const now = Date.now();
    const lastNotification = this.lastNotificationTime.get(flightNumber) || 0;
    
    // If last notification was within debounce time, filter out low/medium priority changes
    if (now - lastNotification < this.debounceTime) {
      return changes.filter(change => 
        change.severity === 'high' || change.severity === 'critical'
      );
    }

    // Update last notification time
    if (changes.length > 0) {
      this.lastNotificationTime.set(flightNumber, now);
    }

    return changes;
  }

  /**
   * Clear stored data for a specific flight (useful when flight is completed)
   */
  clearFlightData(flightNumber: string): void {
    this.previousFlightData.delete(flightNumber);
    this.lastNotificationTime.delete(flightNumber);
  }

  /**
   * Clear all stored data (useful for cleanup)
   */
  clearAllData(): void {
    this.previousFlightData.clear();
    this.lastNotificationTime.clear();
  }

  /**
   * Get stored data for a flight (useful for debugging)
   */
  getStoredData(flightNumber: string): FlightData | undefined {
    return this.previousFlightData.get(flightNumber);
  }

  /**
   * Get all stored flight numbers
   */
  getStoredFlightNumbers(): string[] {
    return Array.from(this.previousFlightData.keys());
  }
}

// Export singleton instance
export const flightChangeDetector = new FlightChangeDetector();
