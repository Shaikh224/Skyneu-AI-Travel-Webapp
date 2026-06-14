import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { flightService } from '../lib/appwrite';
import { authService } from '../lib/appwrite';
import { SavedFlight } from '../lib/appwrite';

interface PinnedFlightContextType {
  pinnedFlight: SavedFlight | null;
  setPinnedFlight: (flight: SavedFlight | null) => void;
  loadLatestFlight: () => Promise<void>;
  isPinnedFlightLoading: boolean;
  scheduleNextAvailableFlight: () => Promise<void>;
  resetUserClearedState: () => void;
}

const PinnedFlightContext = createContext<PinnedFlightContextType | undefined>(undefined);

interface PinnedFlightProviderProps {
  children: ReactNode;
}

export const PinnedFlightProvider: React.FC<PinnedFlightProviderProps> = ({ children }) => {
  const [pinnedFlight, setPinnedFlight] = useState<SavedFlight | null>(null);
  const [isPinnedFlightLoading, setIsPinnedFlightLoading] = useState(false);

  // Helper function to check if user has manually cleared pinned flight
  const isUserCleared = () => {
    return localStorage.getItem('pinnedFlightUserCleared') === 'true';
  };

  // Helper function to set user cleared state
  const setUserCleared = (cleared: boolean) => {
    if (cleared) {
      localStorage.setItem('pinnedFlightUserCleared', 'true');
    } else {
      localStorage.removeItem('pinnedFlightUserCleared');
    }
  };

  // Wrapper for setPinnedFlight to track user actions
  const setPinnedFlightWithTracking = (flight: SavedFlight | null) => {
    setPinnedFlight(flight);
    if (flight === null) {
      // User manually cleared the flight
      setUserCleared(true);
    } else {
      // User selected a new flight, reset cleared state
      setUserCleared(false);
    }
  };

  // Helper function to manually reset the user-cleared state
  const resetUserClearedState = () => {
    setUserCleared(false);
  };

  const loadLatestFlight = useCallback(async () => {
    
    // Don't auto-load if user has manually cleared the pinned flight
    if (isUserCleared()) {
      return;
    }

    // Prevent multiple simultaneous calls
    if (isPinnedFlightLoading) {
      return;
    }

    setIsPinnedFlightLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const savedFlights = await flightService.getSavedFlights(currentUser.$id);
        
        if (savedFlights.length > 0) {
          // Get the most recent live flight, or the most recent flight within 23 hours if no live flights
          const liveFlights = savedFlights.filter(flight => flight.isLive);
          
          let latestFlight;
          if (liveFlights.length > 0) {
            latestFlight = liveFlights.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())[0];
          } else {
            // Only consider flights within 23 hours of departure
            const now = new Date();
            const eligibleFlights = savedFlights.filter(flight => {
              if (flight.status === 'arrived' || flight.status === 'cancelled') {
                return false;
              }
              
              if (!flight.departure.scheduledTime) {
                return false;
              }
              
              const departureTime = new Date(flight.departure.scheduledTime);
              const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
              
              // Only include flights within 23 hours of departure
              return hoursUntilDeparture <= 23 && hoursUntilDeparture > -24; // Allow up to 24 hours past departure
            });
            
            if (eligibleFlights.length > 0) {
              latestFlight = eligibleFlights.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())[0];
            }
          }
          
          if (latestFlight) {
            setPinnedFlight(latestFlight);
            setUserCleared(false); // Auto-loaded flight, not user-cleared
          } else {
            // Fallback: Load the most recent flight regardless of time
            const mostRecentFlight = savedFlights.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())[0];
            if (mostRecentFlight) {
              setPinnedFlight(mostRecentFlight);
              setUserCleared(false);
            } else {
            }
          }
        } else {
        }
      } else {
      }
    } catch (error) {
      // silently ignore
    } finally {
      setIsPinnedFlightLoading(false);
    }
  }, [isPinnedFlightLoading, isUserCleared]);

  // Schedule next available flight when current one is completed
  const scheduleNextAvailableFlight = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return;
      }

      const savedFlights = await flightService.getSavedFlights(currentUser.$id);
      
      // Filter for future flights that haven't arrived or been cancelled
      const futureFlights = savedFlights.filter(flight => 
        flight.status !== 'arrived' &&
        flight.status !== 'cancelled' &&
        flight.departure.scheduledTime
      );

      if (futureFlights.length === 0) {
        setPinnedFlight(null);
        setUserCleared(false); // Auto-scheduled, not user action
        return;
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
        setPinnedFlight(nextFlight);
        setUserCleared(false); // Auto-scheduled, not user action
      } else {
        setPinnedFlight(null);
        setUserCleared(false); // Auto-scheduled, not user action
      }

    } catch (error) {
      // silently ignore
    }
  }, []);

  // Load latest flight on mount only once
  useEffect(() => {
    loadLatestFlight();
  }, []); // Empty dependency array - only run on mount

  return (
    <PinnedFlightContext.Provider value={{
      pinnedFlight,
      setPinnedFlight: setPinnedFlightWithTracking,
      loadLatestFlight,
      isPinnedFlightLoading,
      scheduleNextAvailableFlight,
      resetUserClearedState
    }}>
      {children}
    </PinnedFlightContext.Provider>
  );
};

export const usePinnedFlight = (): PinnedFlightContextType => {
  const context = useContext(PinnedFlightContext);
  if (context === undefined) {
    throw new Error('usePinnedFlight must be used within a PinnedFlightProvider');
  }
  return context;
};
