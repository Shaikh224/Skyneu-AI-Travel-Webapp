import { useState, useEffect, useCallback, useRef } from 'react';
import { flightUpdaterService, FlightUpdateProgress, FlightUpdateResult } from '../services/flightUpdater';
import { authService } from '../lib/appwrite';
import toast from 'react-hot-toast';

export interface UseFlightUpdaterOptions {
  autoStart?: boolean;
  liveUpdateInterval?: number; // in minutes for live flights
  futureUpdateInterval?: number; // in minutes for future flights
  showToastNotifications?: boolean;
  onUpdateComplete?: (results: FlightUpdateResult[]) => void;
}

export interface FlightUpdaterState {
  isUpdating: boolean;
  progress: FlightUpdateProgress | null;
  lastUpdateTime: Date | null;
  hasAutoUpdates: boolean;
  hasLiveUpdates: boolean;
  hasFutureUpdates: boolean;
  error: string | null;
}

export const useFlightUpdater = (options: UseFlightUpdaterOptions = {}) => {
  const {
    autoStart = true,
    liveUpdateInterval = 12, // 12 minutes for live flights
    futureUpdateInterval = 30, // 30 minutes for future flights
    showToastNotifications = true,
    onUpdateComplete
  } = options;

  const [state, setState] = useState<FlightUpdaterState>({
    isUpdating: false,
    progress: null,
    lastUpdateTime: null,
    hasAutoUpdates: false,
    hasLiveUpdates: false,
    hasFutureUpdates: false,
    error: null
  });

  const isInitialized = useRef(false);
  const progressListener = useRef<(progress: FlightUpdateProgress) => void>();

  // Progress listener function
  const handleProgress = useCallback((progress: FlightUpdateProgress) => {
    setState(prev => ({
      ...prev,
      progress,
      isUpdating: true,
      error: null
    }));
  }, []);

  // Initialize the updater
  const initialize = useCallback(async () => {
    if (isInitialized.current) return;

    try {
      // Check if user is authenticated
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        console.log('User not authenticated, skipping flight updater initialization');
        return;
      }
    } catch (error: any) {
      // Suppress expected authentication errors for guests
      if (error.code === 401 || error.message?.includes('missing scopes') || error.message?.includes('Unauthorized')) {
        // User is not authenticated, which is expected for guests
        return;
      } else {
        console.error('Flight updater auth check failed:', error);
        return;
      }
    }

    try {

      // Set up progress listener
      progressListener.current = handleProgress;
      flightUpdaterService.addUpdateListener(handleProgress);

      // Start auto-updates if enabled
      if (autoStart) {
        flightUpdaterService.startAutoUpdates(liveUpdateInterval, futureUpdateInterval);
        setState(prev => ({
          ...prev,
          hasAutoUpdates: true
        }));
      }

      isInitialized.current = true;
    } catch (error) {
      console.error('Error initializing flight updater:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize updater'
      }));
    }
  }, [autoStart, liveUpdateInterval, futureUpdateInterval, handleProgress]);

  // Update selected flight function
  const updateSelectedFlight = useCallback(async (flightId: string) => {
    try {
      setState(prev => ({
        ...prev,
        isUpdating: true,
        error: null,
        progress: null
      }));

      const result = await flightUpdaterService.updateSelectedFlight(flightId);
      
      setState(prev => ({
        ...prev,
        isUpdating: false,
        lastUpdateTime: new Date(),
        progress: null
      }));

      // Show toast notifications
      if (showToastNotifications) {
        if (result.success) {
          toast.success(`Updated flight ${result.flightNumber}`);
        } else {
          toast.error(`Failed to update flight: ${result.error}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Error updating selected flight:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update flight';
      
      setState(prev => ({
        ...prev,
        isUpdating: false,
        error: errorMessage,
        progress: null
      }));

      if (showToastNotifications) {
        toast.error(errorMessage);
      }

      throw error;
    }
  }, [showToastNotifications]);

  // Manual update function
  const updateFlights = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        isUpdating: true,
        error: null,
        progress: null
      }));

      const results = await flightUpdaterService.updateAllFlights();
      
      setState(prev => ({
        ...prev,
        isUpdating: false,
        lastUpdateTime: new Date(),
        progress: null
      }));

      // Show toast notifications
      if (showToastNotifications) {
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        if (successCount > 0) {
          toast.success(`Updated ${successCount} flight${successCount > 1 ? 's' : ''}`);
        }
        
        if (failureCount > 0) {
          toast.error(`Failed to update ${failureCount} flight${failureCount > 1 ? 's' : ''}`);
        }
        
        if (successCount === 0 && failureCount === 0) {
          toast.success('No flights needed updating');
        }
      }

      // Call completion callback
      if (onUpdateComplete) {
        onUpdateComplete(results);
      }

      return results;
    } catch (error) {
      console.error('Error updating flights:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update flights';
      
      setState(prev => ({
        ...prev,
        isUpdating: false,
        error: errorMessage,
        progress: null
      }));

      if (showToastNotifications) {
        toast.error(errorMessage);
      }

      throw error;
    }
  }, [showToastNotifications, onUpdateComplete]);

  // Start auto-updates
  const startAutoUpdates = useCallback((liveInterval?: number, futureInterval?: number) => {
    flightUpdaterService.startAutoUpdates(
      liveInterval || liveUpdateInterval, 
      futureInterval || futureUpdateInterval
    );
    setState(prev => ({
      ...prev,
      hasAutoUpdates: true
    }));
  }, [liveUpdateInterval, futureUpdateInterval]);

  // Stop auto-updates
  const stopAutoUpdates = useCallback(() => {
    flightUpdaterService.stopAutoUpdates();
    setState(prev => ({
      ...prev,
      hasAutoUpdates: false
    }));
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressListener.current) {
        flightUpdaterService.removeUpdateListener(progressListener.current);
      }
      flightUpdaterService.stopAutoUpdates();
    };
  }, []);

  // Update state when service status changes
  useEffect(() => {
    const checkStatus = () => {
      const serviceStatus = flightUpdaterService.getUpdateStatus();
      setState(prev => ({
        ...prev,
        isUpdating: serviceStatus.isUpdating,
        hasAutoUpdates: serviceStatus.hasAutoUpdates,
        hasLiveUpdates: serviceStatus.hasLiveUpdates,
        hasFutureUpdates: serviceStatus.hasFutureUpdates
      }));
    };

    // Check status periodically (every 30 seconds to reduce noise)
    const statusInterval = setInterval(checkStatus, 30000);
    checkStatus(); // Initial check

    return () => clearInterval(statusInterval);
  }, []);

  return {
    ...state,
    updateFlights,
    updateSelectedFlight,
    startAutoUpdates,
    stopAutoUpdates,
    initialize
  };
};
