import { useEffect, useCallback } from 'react';
import { flightCleanupService, FlightCleanupConfig } from '../services/flightCleanupService';
import { SavedFlight } from '../lib/appwrite';

export interface UseFlightCleanupOptions {
  onNextFlightScheduled?: (flight: SavedFlight | null) => void;
  onFlightRemoved?: (removedFlight: SavedFlight, nextFlight: SavedFlight | null) => void;
  config?: Partial<FlightCleanupConfig>;
}

/**
 * Hook to integrate automatic flight cleanup functionality
 */
export function useFlightCleanup(options: UseFlightCleanupOptions = {}) {
  const { onNextFlightScheduled, onFlightRemoved, config } = options;

  // Update configuration if provided
  useEffect(() => {
    if (config) {
      flightCleanupService.updateConfig(config);
    }
  }, [config]);

  // Register callback for flight removal notifications
  useEffect(() => {
    if (onFlightRemoved) {
      flightCleanupService.setNotificationFunction(onFlightRemoved);
    }
  }, [onFlightRemoved]);

  // Register callback for pinned flight updates
  useEffect(() => {
    if (onNextFlightScheduled) {
      flightCleanupService.onPinnedFlightUpdate(onNextFlightScheduled);
      
      return () => {
        flightCleanupService.offPinnedFlightUpdate(onNextFlightScheduled);
      };
    }
  }, [onNextFlightScheduled]);

  // Manual cleanup function
  const cleanupArrivedFlights = useCallback(async () => {
    return await flightCleanupService.cleanupArrivedFlights();
  }, []);

  // Check and schedule cleanups
  const checkAndScheduleCleanups = useCallback(async (userId?: string) => {
    await flightCleanupService.checkAndScheduleCleanups(userId);
  }, []);

  // Get cleanup status
  const getCleanupStatus = useCallback(() => {
    return flightCleanupService.getCleanupStatus();
  }, []);

  // Cancel all cleanups (useful for cleanup on unmount)
  const cancelAllCleanups = useCallback(() => {
    flightCleanupService.cancelAllCleanups();
  }, []);

  return {
    cleanupArrivedFlights,
    checkAndScheduleCleanups,
    getCleanupStatus,
    cancelAllCleanups,
    config: flightCleanupService.getConfig()
  };
}
