/**
 * Saved Flights Component
 * Displays user's saved flight history
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bookmark, Plane, Trash2, MapPin, Building2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { flightService, SavedFlight } from '@/lib/appwrite';
import { authService } from '@/lib/appwrite';
import { useSafeFlightUpdater } from '@/hooks/useSafeFlightUpdater';
import { usePinnedFlight } from '@/contexts/PinnedFlightContext';
import { ShareFlightButton } from './ShareFlightButton';
import aviationStackService from '@/services/aviationStackService';

import PinnedFlightTracker from './PinnedFlightTracker';

interface SavedFlightsProps {
  onFlightSelect?: (flight: SavedFlight) => void;
}

const SavedFlights: React.FC<SavedFlightsProps> = ({ onFlightSelect }) => {
  const [savedFlights, setSavedFlights] = useState<SavedFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [airlineNameMap, setAirlineNameMap] = useState<Record<string, string>>({});
  
  // Flight updater context
  const { 
    isUpdating, 
    lastUpdateTime
  } = useSafeFlightUpdater();

  // Pinned flight context
  const { pinnedFlight, setPinnedFlight } = usePinnedFlight();

  const loadSavedFlights = useCallback(async (forceReload = false) => {
    // Cache for 30 seconds to avoid unnecessary API calls
    const now = Date.now();
    if (!forceReload && now - lastLoadTime < 30000 && savedFlights.length > 0) {
      setLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        setSavedFlights([]);
        setLoading(false);
        return;
      }

      const flights = await flightService.getSavedFlights(currentUser.$id);
      setSavedFlights(flights);
      setLastLoadTime(now);
    } catch (error) {
      toast.error('Failed to load saved flights');
    } finally {
      setLoading(false);
    }
  }, [lastLoadTime, savedFlights.length]);

  useEffect(() => {
    loadSavedFlights(true); // Force initial load
    
    // Load current user for sharing functionality
    const loadCurrentUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {}
    };
    
    loadCurrentUser();
  }, [loadSavedFlights]);

  // Refresh saved flights when updates complete (only for manual updates)
  useEffect(() => {
    if (lastUpdateTime && !isUpdating) {
      loadSavedFlights(true); // Force reload after updates
    }
  }, [lastUpdateTime, isUpdating, loadSavedFlights]);

  // Backfill missing airline names for saved flights
  useEffect(() => {
    const fetchMissingAirlineNames = async () => {
      // Collect unique IATA codes that are missing names
      const codesToFetch = new Set<string>();
      savedFlights.forEach(f => {
        const currentName = f.airline?.name;
        const code = (f.airline?.iataCode || f.flight?.iataNumber?.match(/^([A-Z0-9]{2,3})/i)?.[1] || '').toUpperCase();
        if (code && (!currentName || currentName.toLowerCase() === 'unknown airline') && !airlineNameMap[code]) {
          codesToFetch.add(code);
        }
      });

      if (codesToFetch.size === 0) return;

      // Fetch in parallel and update map
      const updates: Record<string, string> = {};
      await Promise.all(Array.from(codesToFetch).map(async (code) => {
        try {
          const info = await aviationStackService.getAirlineByIataCode(code);
          if (info?.name) {
            updates[code] = info.name;
          }
        } catch (e) {
          // Ignore errors silently for UI
        }
      }));

      if (Object.keys(updates).length > 0) {
        setAirlineNameMap(prev => ({ ...prev, ...updates }));
      }
    };

    fetchMissingAirlineNames();
  }, [savedFlights, airlineNameMap]);

  const getAirlineDisplayName = (flight: SavedFlight): string => {
    const name = flight.airline?.name?.trim();
    if (name && name.toLowerCase() !== 'unknown airline') return name;
    const code = (flight.airline?.iataCode || flight.flight?.iataNumber?.match(/^([A-Z0-9]{2,3})/i)?.[1] || '').toUpperCase();
    if (code && airlineNameMap[code]) return airlineNameMap[code];
    return name || 'Unknown Airline';
  };

  // Memoize the latest live flight selection
  const latestLiveFlight = useMemo(() => {
    if (savedFlights.length === 0) return null;
    
    const liveFlights = savedFlights.filter(flight => flight.isLive);
    if (liveFlights.length > 0) {
      return liveFlights.sort((a, b) => 
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      )[0];
    }
    return savedFlights[0];
  }, [savedFlights]);

  // Calculate flight statistics
  const flightStats = useMemo(() => {
    if (savedFlights.length === 0) {
      return {
        totalFlights: 0,
        mostTravelledAircraft: null,
        mostTravelledDestination: null,
        mostTravelledAirline: null
      };
    }

    // Count aircraft types
    const aircraftCount: { [key: string]: number } = {};
    const destinationCount: { [key: string]: number } = {};
    const airlineCount: { [key: string]: { count: number; logoUrl?: string } } = {};

    savedFlights.forEach(flight => {
      // Count aircraft types
      if (flight.aircraft?.type) {
        aircraftCount[flight.aircraft.type] = (aircraftCount[flight.aircraft.type] || 0) + 1;
      }

      // Count destinations (arrival airports)
      if (flight.arrival.airport) {
        const destination = flight.arrival.airportCity && flight.arrival.airportCountry 
          ? `${flight.arrival.airportCity}, ${flight.arrival.airportCountry}`
          : flight.arrival.airport;
        destinationCount[destination] = (destinationCount[destination] || 0) + 1;
      }

      // Count airlines with logo
      if (flight.airline.name) {
        if (!airlineCount[flight.airline.name]) {
          airlineCount[flight.airline.name] = { count: 0 };
        }
        airlineCount[flight.airline.name].count += 1;
        // Store the logo URL from the first occurrence
        if (flight.airline.logoUrl && !airlineCount[flight.airline.name].logoUrl) {
          airlineCount[flight.airline.name].logoUrl = flight.airline.logoUrl;
        }
      }
    });

    // Find most frequent
    const mostTravelledAircraft = Object.keys(aircraftCount).length > 0 
      ? Object.keys(aircraftCount).reduce((a, b) => aircraftCount[a] > aircraftCount[b] ? a : b)
      : null;

    const mostTravelledDestination = Object.keys(destinationCount).length > 0
      ? Object.keys(destinationCount).reduce((a, b) => destinationCount[a] > destinationCount[b] ? a : b)
      : null;

    const mostTravelledAirline = Object.keys(airlineCount).length > 0
      ? Object.keys(airlineCount).reduce((a, b) => airlineCount[a].count > airlineCount[b].count ? a : b)
      : null;

    return {
      totalFlights: savedFlights.length,
      mostTravelledAircraft,
      mostTravelledDestination,
      mostTravelledAirline,
      mostTravelledAirlineLogo: mostTravelledAirline ? airlineCount[mostTravelledAirline].logoUrl : null,
      aircraftCount: aircraftCount[mostTravelledAircraft || ''] || 0,
      destinationCount: destinationCount[mostTravelledDestination || ''] || 0,
      airlineCount: mostTravelledAirline ? airlineCount[mostTravelledAirline].count : 0
    };
  }, [savedFlights]);

  // Auto-select latest live flight when flights are loaded
  useEffect(() => {
    if (latestLiveFlight && !selectedFlight) {
      setSelectedFlight(latestLiveFlight.$id!);
    }
  }, [latestLiveFlight, selectedFlight]);

  // Auto-select first flight if only one flight exists and none is selected
  useEffect(() => {
    if (savedFlights.length === 1 && !selectedFlight) {
      setSelectedFlight(savedFlights[0].$id!);
    }
  }, [savedFlights, selectedFlight]);

  // Update selected flight for viewing (without setting pinned flight)
  const handleFlightSelect = (flightId: string) => {
    setSelectedFlight(flightId);
    
    const selectedFlightData = savedFlights.find(flight => flight.$id === flightId);
    if (selectedFlightData) {
      
      // DON'T set pinned flight here - just viewing saved flights shouldn't pin them
      // setPinnedFlight(selectedFlightData);
      
      // Call the callback to notify parent component (FlightTracker)
      // But the callback is now empty, so this won't cause any redirects
      if (onFlightSelect) {
        onFlightSelect(selectedFlightData);
      }
    }
  };

  const removeFlight = useCallback(async (flightId: string) => {
    // Find the flight being removed to check if it's the pinned flight
    const flightToRemove = savedFlights.find(f => f.$id === flightId);
    
    // Optimistic update - remove from UI immediately
    const originalFlights = savedFlights;
    const updatedFlights = savedFlights.filter(f => f.$id !== flightId);
    setSavedFlights(updatedFlights);

    try {
      await flightService.deleteSavedFlight(flightId);
      
      // If the removed flight was the pinned flight, clear it
      if (flightToRemove && pinnedFlight && pinnedFlight.$id === flightId) {
        setPinnedFlight(null);
      }
      
      toast.success('Flight removed from saved flights');
    } catch (error) {
      // Revert optimistic update on error
      setSavedFlights(originalFlights);
      toast.error('Failed to remove flight');
    }
  }, [savedFlights, pinnedFlight, setPinnedFlight]);





  if (loading) {
    return (
      <div className="space-y-8">
        {/* Loading skeleton */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Saved Flights
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Your saved flight history and tracking information.
          </p>
        </div>
        
        {/* Skeleton cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
                    <div>
                      <div className="h-5 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>
                  <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-6 w-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-6 w-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (savedFlights.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bookmark className="w-10 h-10 text-sky-600 dark:text-sky-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No Saved Flights
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Search for flights and save them to keep track of your travel history.
        </p>
      </div>
    );
  }

  // Debug logging removed

  return (
    <div className="space-y-8">
      {/* Header - only show when there are NO saved flights */}
      {savedFlights.length === 0 && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8 text-sky-600 dark:text-sky-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Saved Flights ({savedFlights.length})
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-sm sm:text-base">
            Your saved flight history and tracking information.
          </p>
        </div>
      )}

      {/* Flight Statistics Bar - only show when there are saved flights */}
      {savedFlights.length > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-xl sm:rounded-2xl border border-sky-200/50 dark:border-sky-800/50 p-4 sm:p-6 shadow-lg">
          {/* Background decoration - hidden on mobile */}
          <div className="hidden sm:block absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-sky-200/20 to-blue-200/20 dark:from-sky-800/10 dark:to-blue-800/10 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
          <div className="hidden sm:block absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-tr from-indigo-200/20 to-purple-200/20 dark:from-indigo-800/10 dark:to-purple-800/10 rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    Your Flight Statistics
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Insights from your travel history
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {/* Total Flights */}
              <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 truncate">Total Flights</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      {flightStats.totalFlights}
                    </p>
                  </div>
                </div>
              </div>

              {/* Most Travelled Aircraft */}
              <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 truncate">Most Aircraft</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                      {flightStats.mostTravelledAircraft || 'N/A'}
                    </p>
                    {flightStats.aircraftCount && flightStats.aircraftCount > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                        {flightStats.aircraftCount} times
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Most Travelled Destination */}
              <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 truncate">Top Destination</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                      {flightStats.mostTravelledDestination || 'N/A'}
                    </p>
                    {flightStats.destinationCount && flightStats.destinationCount > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                        {flightStats.destinationCount} times
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Most Travelled Airline */}
              <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-white rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden flex-shrink-0">
                    {flightStats.mostTravelledAirlineLogo ? (
                      <img 
                        src={flightStats.mostTravelledAirlineLogo} 
                        alt={flightStats.mostTravelledAirline || 'Airline'}
                        className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const nextElement = target.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'block';
                          }
                        }}
                      />
                    ) : null}
                    <Plane className={`w-4 h-4 sm:w-5 sm:h-5 text-white ${flightStats.mostTravelledAirlineLogo ? 'hidden' : 'block'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 truncate">Top Airline</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                      {flightStats.mostTravelledAirline || 'N/A'}
                    </p>
                    {flightStats.airlineCount && flightStats.airlineCount > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                        {flightStats.airlineCount} times
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flight Selector (if multiple flights) */}
      {savedFlights.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-lg">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Select Flight to View
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedFlights.map((flight) => (
              <button
                key={flight.$id}
                onClick={() => handleFlightSelect(flight.$id!)}
                className={`group p-4 rounded-xl border text-left transition-all duration-200 hover:shadow-md ${
                  selectedFlight === flight.$id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {flight.airline.logoUrl ? (
                    <img 
                      src={flight.airline.logoUrl} 
                      alt={`${flight.airline.name} logo`}
                      className="w-8 h-8 rounded-lg bg-white p-1 shadow-sm flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {flight.airline.iataCode?.charAt(0) || flight.airline.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {flight.flightNumber}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {flight.airline.name}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {flight.departure.airport} → {flight.arrival.airport}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {flight.isLive && flight.status?.toLowerCase() !== 'arrived' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></div>
                      Live
                    </span>
                  )}
                  {flight.isFutureFlight && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      Future
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    flight.status === 'scheduled' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200' :
                    flight.status === 'delayed' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    flight.status === 'departed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                    flight.status === 'arrived' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200'
                  }`}>
                    {flight.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Flight Details */}
      {selectedFlight && (
        <div className="space-y-4">
          {(() => {
            return savedFlights
              .filter(flight => flight.$id === selectedFlight)
              .map((savedFlight) => (
              <div key={savedFlight.$id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 p-4 sm:p-6 md:p-8 text-white relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full translate-y-12 -translate-x-12"></div>
                  </div>
                  <div className="space-y-3 sm:space-y-4 relative z-10">
                    {/* Flight Number and Status Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
                          {savedFlight.flightNumber}
                        </h2>
                        {savedFlight.isLive && savedFlight.status?.toLowerCase() !== 'arrived' && (
                          <div className="flex items-center gap-1 text-xs sm:text-sm">
                            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                            <span className="hidden sm:inline">Live</span>
                          </div>
                        )}
                      </div>
                      
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm sm:text-base shadow-lg backdrop-blur-sm ${
                        savedFlight.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                        savedFlight.status === 'delayed' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                        savedFlight.status === 'departed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' :
                        savedFlight.status === 'arrived' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200'
                      }`}>
                        <span className="text-lg sm:text-xl">{
                          savedFlight.status === 'scheduled' ? '📅' :
                          savedFlight.status === 'delayed' ? '⏰' :
                          savedFlight.status === 'departed' ? '🛫' :
                          savedFlight.status === 'arrived' ? '🛬' :
                          '❓'
                        }</span>
                        <span className="capitalize hidden sm:inline">{savedFlight.status}</span>
                        <span className="capitalize sm:hidden">{savedFlight.status.slice(0, 4)}</span>
                      </div>
                    </div>

                    {/* Airline Info and Date Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {savedFlight.airline.logoUrl ? (
                          <div className="relative">
                            <img 
                              src={savedFlight.airline.logoUrl} 
                              alt={`${savedFlight.airline.name} logo`}
                              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-white p-2 flex-shrink-0 shadow-lg border-2 border-white/20"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                            <span className="text-sm sm:text-base font-bold text-white">
                              {savedFlight.airline.iataCode?.charAt(0) || savedFlight.airline.name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm sm:text-base md:text-lg font-semibold truncate">
                            {getAirlineDisplayName(savedFlight)}
                          </div>
                          <div className="text-xs sm:text-sm text-blue-100">
                            {savedFlight.airline.iataCode ? `(${savedFlight.airline.iataCode})` : ''}
                          </div>
                        </div>
                      </div>
                      
                      {/* Flight Date */}
                      <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex-shrink-0">
                        <span className="text-xs sm:text-sm font-medium">
                          Saved: {new Date(savedFlight.savedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Additional Status Indicators */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {savedFlight.isFutureFlight && (
                        <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded-full">
                          <span className="hidden sm:inline">Future Flight</span>
                          <span className="sm:hidden">Future</span>
                        </div>
                      )}
                      {savedFlight.searchDate && (
                        <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded-full">
                          <span className="hidden sm:inline">Date: {savedFlight.searchDate}</span>
                          <span className="sm:hidden">{savedFlight.searchDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Flight Route */}
                <div className="p-4 sm:p-6 md:p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
                  <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
                    {/* Departure */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-green-600 dark:text-green-400" />
                        </div>
                        Departure
                      </div>
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-white transform rotate-45" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                            {savedFlight.departure.airport}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {(savedFlight.departure.airportCity && savedFlight.departure.airportCountry) 
                              ? `${savedFlight.departure.airportCity}, ${savedFlight.departure.airportCountry}`
                              : savedFlight.departure.airport
                            }
                          </div>
                          
                          {/* Terminal and Gate Info */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {savedFlight.departure.terminal && (
                              <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                                <Building2 className="w-3 h-3 text-gray-500" />
                                <span className="text-xs font-medium">T{savedFlight.departure.terminal}</span>
                              </div>
                            )}
                            {savedFlight.departure.gate && (
                              <div className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                                <span className="text-xs font-medium">Gate {savedFlight.departure.gate}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Flight Times */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Scheduled:</span>
                          <span className="font-medium">
                            {savedFlight.departure.scheduledTime ? 
                              new Date(savedFlight.departure.scheduledTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              }) : '--:--'
                            }
                          </span>
                        </div>
                        {savedFlight.departure.estimatedTime && (
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Estimated:</span>
                            <span className="font-medium text-orange-600">
                              {new Date(savedFlight.departure.estimatedTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </span>
                          </div>
                        )}
                        {savedFlight.departure.actualTime && (
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-400">Actual:</span>
                            <span className="font-medium text-green-600">
                              {new Date(savedFlight.departure.actualTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </span>
                          </div>
                        )}
                        {savedFlight.departure.delay && savedFlight.departure.delay > 0 && (
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Delay:</span>
                            <span className="font-medium text-red-600">+{savedFlight.departure.delay}m</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Flight Status Center */}
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center mb-3 shadow-lg">
                        <Plane className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-600 dark:text-blue-400 transform rotate-45" />
                      </div>
                      <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
                        Route Information
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {savedFlight.departure.airport} → {savedFlight.arrival.airport}
                      </div>
                    </div>

                    {/* Arrival */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-red-600 dark:text-red-400" />
                        </div>
                        Arrival
                      </div>
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                            {savedFlight.arrival.airport}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {(savedFlight.arrival.airportCity && savedFlight.arrival.airportCountry) 
                              ? `${savedFlight.arrival.airportCity}, ${savedFlight.arrival.airportCountry}`
                              : savedFlight.arrival.airport
                            }
                          </div>
                          
                          {/* Terminal and Gate Info */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {savedFlight.arrival.terminal && (
                              <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                                <Building2 className="w-3 h-3 text-gray-500" />
                                <span className="text-xs font-medium">T{savedFlight.arrival.terminal}</span>
                              </div>
                            )}
                            {savedFlight.arrival.gate && (
                              <div className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                                <span className="text-xs font-medium">Gate {savedFlight.arrival.gate}</span>
                              </div>
                            )}
                            {savedFlight.arrival.baggage && (
                              <div className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md">
                                <span className="text-xs font-medium">Belt {savedFlight.arrival.baggage}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Flight Times */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Scheduled:</span>
                          <span className="font-medium">
                            {savedFlight.arrival.scheduledTime ? 
                              new Date(savedFlight.arrival.scheduledTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              }) : '--:--'
                            }
                          </span>
                        </div>
                        {savedFlight.arrival.estimatedTime && (
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Estimated:</span>
                            <span className="font-medium text-orange-600">
                              {new Date(savedFlight.arrival.estimatedTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </span>
                          </div>
                        )}
                        {savedFlight.arrival.actualTime && (
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Actual:</span>
                            <span className="font-medium text-green-600">
                              {new Date(savedFlight.arrival.actualTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </span>
                          </div>
                        )}
                        {savedFlight.arrival.delay && savedFlight.arrival.delay > 0 && (
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Delay:</span>
                            <span className="font-medium text-red-600">+{savedFlight.arrival.delay}m</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aircraft Information */}
                {savedFlight.aircraft && (
                  <div className="p-4 sm:p-6 md:p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-semibold uppercase tracking-wide flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Plane className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        </div>
                        Aircraft Details
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Type</span>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{savedFlight.aircraft?.type || 'Unknown'}</div>
                          </div>
                        </div>
                        {savedFlight.aircraft?.registration && (
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <Plane className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Registration</span>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{savedFlight.aircraft.registration}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="p-4 sm:p-6 md:p-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                        savedFlight.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        savedFlight.status === 'departed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        savedFlight.status === 'arrived' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {savedFlight.status}
                      </span>
                      {savedFlight.isFutureFlight && (
                        <span className="inline-flex items-center px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Future
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Share Button */}
                      {currentUser && (
                        <ShareFlightButton 
                          flight={savedFlight} 
                          userId={currentUser.$id} 
                        />
                      )}
                      
                      <button
                        onClick={() => savedFlight.$id && removeFlight(savedFlight.$id)}
                        className="inline-flex items-center gap-1 px-1.5 sm:px-3 py-1 sm:py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs sm:text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md sm:rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              ));
          })()}
        </div>
      )}

      {/* Pinned Flight Tracker */}
      <PinnedFlightTracker />
    </div>
  );
};

export default SavedFlights;
