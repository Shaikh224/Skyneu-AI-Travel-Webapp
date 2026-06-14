import { useContext } from 'react';
import { FlightUpdaterContext } from '../contexts/FlightUpdaterContext';

/**
 * Safely use the FlightUpdaterContext with fallback handling
 * This prevents crashes when the context is not available
 */
export const useSafeFlightUpdater = () => {
  const context = useContext(FlightUpdaterContext);
  
  if (context === undefined) {
    console.warn('FlightUpdaterContext not available: useFlightUpdaterContext must be used within a FlightUpdaterProvider');
    // Return a fallback object with no-op functions
    return {
      isUpdating: false,
      progress: null,
      lastUpdateTime: null,
      hasAutoUpdates: false,
      hasLiveUpdates: false,
      hasFutureUpdates: false,
      error: null,
      updateFlights: async () => [],
      updateSelectedFlight: async () => ({ success: false, error: 'Context not available', flightNumber: '' }),
      startAutoUpdates: () => {},
      stopAutoUpdates: () => {}
    };
  }
  
  return context;
};
