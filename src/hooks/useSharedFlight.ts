/**
 * Hook for fetching and managing shared flight data
 * Includes polling mechanism for real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { shareCardService, PublicFlightData } from '@/services/shareCardService';

interface UseSharedFlightReturn {
  flightData: PublicFlightData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

export const useSharedFlight = (slug: string): UseSharedFlightReturn => {
  const [flightData, setFlightData] = useState<PublicFlightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchFlightData = useCallback(async () => {
    if (!slug) return;

    try {
      setError(null);
      const data = await shareCardService.getPublicFlightData(slug);
      
      if (isMountedRef.current) {
        setFlightData(data);
        setLastUpdated(new Date());
        setLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch flight data';
        setError(errorMessage);
        setLoading(false);
        
        // Stop polling if link is expired/revoked
        if (errorMessage.includes('expired') || errorMessage.includes('revoked')) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    }
  }, [slug]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchFlightData();
  }, [fetchFlightData]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch
    fetchFlightData();

    // Set up polling every 60 seconds
    intervalRef.current = setInterval(() => {
      fetchFlightData();
    }, 60000); // 60 seconds

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchFlightData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    flightData,
    loading,
    error,
    lastUpdated,
    refetch,
  };
};
