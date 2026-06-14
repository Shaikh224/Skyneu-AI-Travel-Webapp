import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Cache structure for flight insights data
 * Stores all AI-generated data per flight until a new search is initiated
 */
interface FlightInsightsCacheData {
  // AI Insights data
  aiInsights?: any;
  
  // Baggage policy data
  baggagePolicy?: any;
  
  // Price breakdown data
  priceBreakdown?: any;
  
  // Carbon/Sustainability data
  sustainabilityData?: any;
  
  // Timestamp when data was cached
  cachedAt: number;
}

interface FlightInsightsCacheContextType {
  // Get cached data for a flight
  getFlightCache: (flightId: string) => FlightInsightsCacheData | null;
  
  // Set AI insights for a flight
  setAIInsights: (flightId: string, data: any) => void;
  
  // Set baggage policy for a flight
  setBaggagePolicy: (flightId: string, data: any) => void;
  
  // Set price breakdown for a flight
  setPriceBreakdown: (flightId: string, data: any) => void;
  
  // Set sustainability data for a flight
  setSustainabilityData: (flightId: string, data: any) => void;
  
  // Clear all cache (when new search is performed)
  clearCache: () => void;
  
  // Clear cache for specific flight
  clearFlightCache: (flightId: string) => void;
  
  // Check if specific data type is cached for a flight
  hasCachedAIInsights: (flightId: string) => boolean;
  hasCachedBaggagePolicy: (flightId: string) => boolean;
  hasCachedPriceBreakdown: (flightId: string) => boolean;
  hasCachedSustainabilityData: (flightId: string) => boolean;
}

const FlightInsightsCacheContext = createContext<FlightInsightsCacheContextType | undefined>(undefined);

export const FlightInsightsCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<Map<string, FlightInsightsCacheData>>(new Map());

  const getFlightCache = useCallback((flightId: string): FlightInsightsCacheData | null => {
    return cache.get(flightId) || null;
  }, [cache]);

  const updateCache = useCallback((flightId: string, updateFn: (existing: FlightInsightsCacheData) => FlightInsightsCacheData) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      const existing = newCache.get(flightId) || { cachedAt: Date.now() };
      newCache.set(flightId, updateFn(existing));
      return newCache;
    });
  }, []);

  const setAIInsights = useCallback((flightId: string, data: any) => {
    console.log(`💾 Caching AI Insights for flight ${flightId}`);
    updateCache(flightId, (existing) => ({
      ...existing,
      aiInsights: data,
      cachedAt: Date.now()
    }));
  }, [updateCache]);

  const setBaggagePolicy = useCallback((flightId: string, data: any) => {
    console.log(`💾 Caching Baggage Policy for flight ${flightId}`);
    updateCache(flightId, (existing) => ({
      ...existing,
      baggagePolicy: data,
      cachedAt: Date.now()
    }));
  }, [updateCache]);

  const setPriceBreakdown = useCallback((flightId: string, data: any) => {
    console.log(`💾 Caching Price Breakdown for flight ${flightId}`);
    updateCache(flightId, (existing) => ({
      ...existing,
      priceBreakdown: data,
      cachedAt: Date.now()
    }));
  }, [updateCache]);

  const setSustainabilityData = useCallback((flightId: string, data: any) => {
    console.log(`💾 Caching Sustainability Data for flight ${flightId}`);
    updateCache(flightId, (existing) => ({
      ...existing,
      sustainabilityData: data,
      cachedAt: Date.now()
    }));
  }, [updateCache]);

  const clearCache = useCallback(() => {
    console.log('🗑️ Clearing all flight insights cache');
    setCache(new Map());
  }, []);

  const clearFlightCache = useCallback((flightId: string) => {
    console.log(`🗑️ Clearing cache for flight ${flightId}`);
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.delete(flightId);
      return newCache;
    });
  }, []);

  const hasCachedAIInsights = useCallback((flightId: string): boolean => {
    return !!cache.get(flightId)?.aiInsights;
  }, [cache]);

  const hasCachedBaggagePolicy = useCallback((flightId: string): boolean => {
    return !!cache.get(flightId)?.baggagePolicy;
  }, [cache]);

  const hasCachedPriceBreakdown = useCallback((flightId: string): boolean => {
    return !!cache.get(flightId)?.priceBreakdown;
  }, [cache]);

  const hasCachedSustainabilityData = useCallback((flightId: string): boolean => {
    return !!cache.get(flightId)?.sustainabilityData;
  }, [cache]);

  const value: FlightInsightsCacheContextType = {
    getFlightCache,
    setAIInsights,
    setBaggagePolicy,
    setPriceBreakdown,
    setSustainabilityData,
    clearCache,
    clearFlightCache,
    hasCachedAIInsights,
    hasCachedBaggagePolicy,
    hasCachedPriceBreakdown,
    hasCachedSustainabilityData
  };

  return (
    <FlightInsightsCacheContext.Provider value={value}>
      {children}
    </FlightInsightsCacheContext.Provider>
  );
};

export const useFlightInsightsCache = () => {
  const context = useContext(FlightInsightsCacheContext);
  if (!context) {
    throw new Error('useFlightInsightsCache must be used within FlightInsightsCacheProvider');
  }
  return context;
};
