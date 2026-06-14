import React, { createContext, useContext, ReactNode } from 'react';
import { useFlightUpdater, UseFlightUpdaterOptions } from '../hooks/useFlightUpdater';
import { FlightUpdateResult } from '../services/flightUpdater';

interface FlightUpdaterContextType {
  isUpdating: boolean;
  progress: any;
  lastUpdateTime: Date | null;
  hasAutoUpdates: boolean;
  hasLiveUpdates: boolean;
  hasFutureUpdates: boolean;
  error: string | null;
  updateFlights: () => Promise<FlightUpdateResult[]>;
  updateSelectedFlight: (flightId: string) => Promise<FlightUpdateResult>;
  startAutoUpdates: (liveInterval?: number, futureInterval?: number) => void;
  stopAutoUpdates: () => void;
}

export const FlightUpdaterContext = createContext<FlightUpdaterContextType | undefined>(undefined);

interface FlightUpdaterProviderProps {
  children: ReactNode;
  options?: UseFlightUpdaterOptions;
}

export const FlightUpdaterProvider: React.FC<FlightUpdaterProviderProps> = ({ 
  children, 
  options = {} 
}) => {
  const flightUpdater = useFlightUpdater({
    autoStart: true,
    liveUpdateInterval: 12, // 12 minutes for live flights
    futureUpdateInterval: 30, // 30 minutes for future flights
    showToastNotifications: true,
    ...options
  });

  return (
    <FlightUpdaterContext.Provider value={flightUpdater}>
      {children}
    </FlightUpdaterContext.Provider>
  );
};

export const useFlightUpdaterContext = (): FlightUpdaterContextType => {
  const context = useContext(FlightUpdaterContext);
  if (context === undefined) {
    throw new Error('useFlightUpdaterContext must be used within a FlightUpdaterProvider');
  }
  return context;
};
