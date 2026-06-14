/**
 * Live Flight Tracker Component
 * Clean, mobile-responsive live flight tracking with aviation theme
 */

import React, { useState, useEffect } from 'react';
import { Search, Plane, Loader2, Calendar, Edit3, Navigation, Building2, ChevronDown, AlertCircle, Bookmark, RefreshCw, Brain, Lightbulb, X, Trash2, Play, Pause } from 'lucide-react';
import unifiedFlightTracker, { UnifiedFlightData, FlightSearchParams } from '@/services/flightTracking/unifiedFlightTracker';
import FlightDetailsCard from './FlightDetailsCard';
import FlightMap from './FlightMap';
import AirportTimetable from './AirportTimetable';
import SavedFlights from './SavedFlights';
import FlightTrackerAIInsights from './FlightTrackerAIInsights';
import FlightIntelligenceTab from './FlightIntelligenceTab';
import { flightService, authService, SavedFlight } from '@/lib/appwrite';
import { usePinnedFlight } from '@/contexts/PinnedFlightContext';
import toast from 'react-hot-toast';

interface FlightTrackerProps {
  initialFlightNumber?: string;
  onFlightSelect?: (flight: UnifiedFlightData) => void;
}

const FlightTracker: React.FC<FlightTrackerProps> = ({ initialFlightNumber, onFlightSelect }) => {
  // State
  const [activeTab, setActiveTab] = useState<'tracker' | 'timetable' | 'history' | 'ai-insights' | 'intelligence'>('tracker');
  const [flightNumber, setFlightNumber] = useState(initialFlightNumber || '');
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [flightData, setFlightData] = useState<UnifiedFlightData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearchFormCollapsed, setIsSearchFormCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userClearedInput, setUserClearedInput] = useState(false); // Track user-initiated clears
  const [isAutoLoadingPinned, setIsAutoLoadingPinned] = useState(false); // Track auto-loading state
  const isSearching = loading || isAutoLoadingPinned;
  const [loadingProgress, setLoadingProgress] = useState(0);
  const loadingMessages = React.useMemo(() => [
    'Fetching live positions and recent flight activity...',
    'Enriching with airline and aircraft details...',
    'Looking up departure and arrival gate information...',
    'Analyzing time zones and schedule accuracy...',
    'Building flight timeline and events...',
    'Optimizing map view and route rendering...',
    'Almost there… preparing your results'
  ], []);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Animated loading progress and rotating helper messages
  useEffect(() => {
    if (isSearching && !flightData) {
      setLoadingProgress(0);
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 92) return prev; // avoid reaching 100% until complete
          const increment = 3 + Math.random() * 6; // smooth, variable progress
          return Math.min(prev + increment, 92);
        });
      }, 800);

      const messageInterval = setInterval(() => {
        setLoadingMessageIndex(i => (i + 1) % loadingMessages.length);
      }, 1800);

      return () => {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
      };
    } else {
      setLoadingProgress(0);
    }
  }, [isSearching, flightData, loadingMessages.length]);
  
  // Auto-search controls and rate limiting
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(() => {
    // Load from localStorage, default to true if not set
    const saved = localStorage.getItem('flightTracker_autoSearchEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [lastAutoSearchTime, setLastAutoSearchTime] = useState<number>(0);
  const [nextAutoSearchTime, setNextAutoSearchTime] = useState<number>(0);
  const [autoSearchInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Flight data caching
  const [flightDataCache, setFlightDataCache] = useState<Map<string, { data: UnifiedFlightData; timestamp: number }>>(new Map());
  const [nextFlightUpdate, setNextFlightUpdate] = useState<number>(0);
  
  // Rate limiting: 20 minutes = 1,200,000ms
  const AUTO_SEARCH_INTERVAL = 20 * 60 * 1000;
  const FLIGHT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const ARRIVED_FLIGHT_STOP_DURATION = 60 * 60 * 1000; // 1 hour
  
  // AI Tab data
  const [savedFlights, setSavedFlights] = useState<SavedFlight[]>([]);

  // Pinned flight context
  const { pinnedFlight, setPinnedFlight, loadLatestFlight, resetUserClearedState } = usePinnedFlight();

  // Load saved flights for AI tabs
  const loadSavedFlights = async () => {
    try {
      
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        setSavedFlights([]);
        return;
      }

      const flights = await flightService.getSavedFlights(currentUser.$id);
      setSavedFlights(flights || []);
    } catch (error) {
      setSavedFlights([]);
    }
  };

  // Load saved flights when component mounts or when switching to AI tabs
  useEffect(() => {
    if (activeTab === 'ai-insights' || activeTab === 'intelligence') {
      loadSavedFlights();
    }
  }, [activeTab]);

  // Reset user-cleared flag and load latest pinned flight on mount
  useEffect(() => {
    setUserClearedInput(false);
    resetUserClearedState();
    loadLatestFlight();
  }, [resetUserClearedState, loadLatestFlight]);

  // Ensure tracker tab is active when a pinned flight is provided
  useEffect(() => {
    if (initialFlightNumber) {
      setActiveTab('tracker');
    }
  }, [initialFlightNumber]);

  // Auto-search when initialFlightNumber changes (with rate limiting)
  useEffect(() => {
    // Don't auto-set if user has manually cleared the input, auto-search is disabled, not on tracker tab, or pinned flight has arrived
    if (initialFlightNumber && initialFlightNumber !== flightNumber && !userClearedInput && autoSearchEnabled && activeTab === 'tracker' && pinnedFlight?.status !== 'arrived') {
      const now = Date.now();
      
      // Check rate limiting - only allow auto-search if enough time has passed
      if (now - lastAutoSearchTime < AUTO_SEARCH_INTERVAL) {
        const timeUntilNext = AUTO_SEARCH_INTERVAL - (now - lastAutoSearchTime);
        setNextAutoSearchTime(now + timeUntilNext);
        return;
      }
      
      setFlightNumber(initialFlightNumber);
      setLastAutoSearchTime(now);
      setNextAutoSearchTime(now + AUTO_SEARCH_INTERVAL);
      
      // Auto-search the pinned flight
      const autoSearch = async () => {
        setLoading(true);
        setError(null);
        
        try {
          // Check cache first
          const cachedData = getCachedFlightData(initialFlightNumber);
          if (cachedData) {
            // Check if flight arrived too long ago
            if (isFlightArrivedTooLongAgo(cachedData)) {
              setError('Flight has arrived more than 1 hour ago. Tracking is no longer available.');
              setLoading(false);
              return;
            }
            
            setFlightData(cachedData);
            setIsSearchFormCollapsed(true);
            setActiveTab('tracker');
            onFlightSelect?.(cachedData);
            setLoading(false);
            return;
          }

          const params: FlightSearchParams = {
            flightNumber: initialFlightNumber
          };
          
          
          const result = await unifiedFlightTracker.trackFlight(params);
          
          if (result) {
            // Check if flight arrived too long ago
            if (isFlightArrivedTooLongAgo(result)) {
              setError('Flight has arrived more than 1 hour ago. Tracking is no longer available.');
              setLoading(false);
              return;
            }

            // Check if this is a future flight more than 23 hours away
            if (result.isFutureFlight && !result.isLive && result.schedule.departure.scheduledTime) {
              const departureTime = new Date(result.schedule.departure.scheduledTime);
              const now = new Date();
              const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
              
              if (hoursUntilDeparture > 23) {
                setError(`Flight is ${hoursUntilDeparture.toFixed(1)} hours from departure. Live tracking starts 23 hours before departure.`);
                setLoading(false);
                return;
              }
            }

            // Cache the result
            cacheFlightData(initialFlightNumber, result);
            
            setFlightData(result);
            setIsSearchFormCollapsed(true); // Collapse form for pinned flight auto-search
            setActiveTab('tracker'); // Ensure tracker tab is visible
            setNextFlightUpdate(Date.now() + FLIGHT_CACHE_DURATION);
            onFlightSelect?.(result);
          } else {
            setError('Flight not found');
          }
        } catch (err) {
          // Swallow console noise
          setError(err instanceof Error ? err.message : 'Failed to load pinned flight');
        } finally {
          setLoading(false);
        }
      };
      
      autoSearch();
    }
  }, [initialFlightNumber, flightNumber, onFlightSelect, userClearedInput, autoSearchEnabled, lastAutoSearchTime, activeTab]);

  // Reset userClearedInput when a new pinned flight becomes available
  useEffect(() => {
    if (pinnedFlight && userClearedInput) {
      setUserClearedInput(false);
    }
  }, [pinnedFlight, userClearedInput]);

  // Auto-search when a pinned flight exists and no flight is displayed yet (with rate limiting)
  // Only auto-search when on tracker tab, not when viewing saved flights in history tab
  useEffect(() => {
    if (pinnedFlight && !flightData && !loading && !userClearedInput && autoSearchEnabled && activeTab === 'tracker' && pinnedFlight.status !== 'arrived') {
      const pinnedNum = pinnedFlight.flightNumber;
      if (!pinnedNum) {
        return;
      }
      
      const now = Date.now();
      
      // Check rate limiting - only allow auto-search if enough time has passed
      if (now - lastAutoSearchTime < AUTO_SEARCH_INTERVAL) {
        const timeUntilNext = AUTO_SEARCH_INTERVAL - (now - lastAutoSearchTime);
        setNextAutoSearchTime(now + timeUntilNext);
        return;
      }
      
      setIsAutoLoadingPinned(true);
      setActiveTab('tracker');
      setFlightNumber(pinnedNum);
      setLastAutoSearchTime(now);
      setNextAutoSearchTime(now + AUTO_SEARCH_INTERVAL);

      const autoSearchPinned = async () => {
        setLoading(true);
        setError(null);
        try {
          // Check cache first
          const cachedData = getCachedFlightData(pinnedNum);
          if (cachedData) {
            // Check if flight arrived too long ago
            if (isFlightArrivedTooLongAgo(cachedData)) {
              setError('Flight has arrived more than 1 hour ago. Tracking is no longer available.');
              setLoading(false);
              setIsAutoLoadingPinned(false);
              return;
            }
            
            setFlightData(cachedData);
            setIsSearchFormCollapsed(true);
            onFlightSelect?.(cachedData);
            setLoading(false);
            setIsAutoLoadingPinned(false);
            return;
          }

          const params: FlightSearchParams = { flightNumber: pinnedNum };
          const result = await unifiedFlightTracker.trackFlight(params);
          if (result) {
            // Check if flight arrived too long ago
            if (isFlightArrivedTooLongAgo(result)) {
              setError('Flight has arrived more than 1 hour ago. Tracking is no longer available.');
              setLoading(false);
              setIsAutoLoadingPinned(false);
              return;
            }

            // Cache the result
            cacheFlightData(pinnedNum, result);
            
            setFlightData(result);
            setIsSearchFormCollapsed(true);
            setNextFlightUpdate(Date.now() + FLIGHT_CACHE_DURATION);
            onFlightSelect?.(result);
          }
        } catch (err) {
          // Swallow console noise; surface to UI if needed
        } finally {
          setLoading(false);
          setIsAutoLoadingPinned(false);
        }
      };

      autoSearchPinned();
    }
  }, [pinnedFlight, flightData, loading, userClearedInput, onFlightSelect, autoSearchEnabled, lastAutoSearchTime, activeTab]);

  /**
   * Handle flight search with date support and caching
   */
  const handleSearch = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setUserClearedInput(false); // Reset clear flag when starting a new search

    try {
      const searchFlightNumber = flightNumber || '';
      
      // Check cache first (unless force refresh)
      if (!forceRefresh && searchFlightNumber) {
        const cachedData = getCachedFlightData(searchFlightNumber);
        if (cachedData) {
          // Check if flight arrived too long ago
          if (isFlightArrivedTooLongAgo(cachedData)) {
            setError('Flight has arrived more than 1 hour ago. Tracking is no longer available.');
            setLoading(false);
            return;
          }
          
          setFlightData(cachedData);
          setIsSearchFormCollapsed(true);
          toast.success(`Flight ${cachedData.flightNumber} loaded from cache!`);
          
          if (onFlightSelect) {
            onFlightSelect(cachedData);
          }
          setLoading(false);
          return;
        }
      }

      const params: FlightSearchParams = {
        // Let the backend determine the tracking type automatically based on date
        flightNumber: searchFlightNumber || undefined,
        route: (searchDate && departure) ? { from: departure, to: arrival || undefined } : undefined,
        date: searchDate ? new Date(searchDate) : undefined
      };

      
      const result = await unifiedFlightTracker.trackFlight(params);
      
      if (result) {
        // Check if flight arrived too long ago
        if (isFlightArrivedTooLongAgo(result)) {
          setError('Flight has arrived more than 1 hour ago. Tracking is no longer available.');
          setLoading(false);
          return;
        }

        // Cache the result
        if (result.flightNumber) {
          cacheFlightData(result.flightNumber, result);
        }
        
        setFlightData(result);
        setIsSearchFormCollapsed(true); // Collapse form after successful search
        setNextFlightUpdate(Date.now() + FLIGHT_CACHE_DURATION);
        
        toast.success(`Flight ${result.flightNumber} found!`);
        
        // Update saved flights with new data
        await updateSavedFlightsWithNewData(result);
        
        if (onFlightSelect) {
          onFlightSelect(result);
        }
      } else {
        let errorMessage = 'Flight not found. Please check your search parameters.';
        
        // Provide specific error message for future flights with dates too close
        if (searchDate) {
          const selectedDate = new Date(searchDate);
          const now = new Date();
          const daysDiff = (selectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysDiff > 7) {
            errorMessage = `Future flight search for dates more than 7 days ahead requires route information. Please provide both departure and arrival airports.`;
          } else if (daysDiff >= 1 && daysDiff <= 7) {
            errorMessage = `Flight not found for the selected date. The flight may not operate on ${selectedDate.toLocaleDateString()} or route information may be needed.`;
          }
        }
        
        setError(errorMessage);
        toast.error('Flight not found');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred while searching';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle manual removal of current flight tracking
   */
  const handleRemoveFlight = () => {
    setFlightData(null);
    setFlightNumber('');
    setDeparture('');
    setArrival('');
    setSearchDate('');
    setError(null);
    setIsSearchFormCollapsed(false);
    setUserClearedInput(true); // Mark as user-initiated clear
    
    // Clear the pinned flight from context as well
    setPinnedFlight(null);
    
    toast.success('Flight tracking cleared');
    
    // Notify parent component
    if (onFlightSelect) {
      onFlightSelect(null as any);
    }
  };

  /**
   * Toggle auto-search functionality
   */
  const toggleAutoSearch = () => {
    const newValue = !autoSearchEnabled;
    setAutoSearchEnabled(newValue);
    
    // Persist the state to localStorage
    localStorage.setItem('flightTracker_autoSearchEnabled', JSON.stringify(newValue));
    
    if (!autoSearchEnabled) {
      toast.success('Auto-search enabled');
    } else {
      toast.success('Auto-search disabled');
    }
  };

  /**
   * Stop auto-search and clear any pending intervals
   */
  // const stopAutoSearch = () => {
  //   setAutoSearchEnabled(false);
  //   if (autoSearchInterval) {
  //     clearInterval(autoSearchInterval);
  //     setAutoSearchInterval(null);
  //   }
  //   toast.success('Auto-search stopped');
  // };

  // Previously exposed next-auto-search countdown; hidden for cleaner UI

  // Previously exposed next-flight-update countdown; removed to keep UI clean

  /**
   * Check if flight has arrived more than 1 hour ago
   */
  const isFlightArrivedTooLongAgo = (flight: UnifiedFlightData): boolean => {
    if (flight.status !== 'arrived' && flight.status !== 'landed') {
      return false;
    }

    const arrivalTime = flight.schedule.arrival.actualTime || flight.schedule.arrival.estimatedTime || flight.schedule.arrival.scheduledTime;
    if (!arrivalTime) {
      return false;
    }

    const arrivalDate = new Date(arrivalTime);
    const now = new Date();
    const timeSinceArrival = now.getTime() - arrivalDate.getTime();
    
    return timeSinceArrival > ARRIVED_FLIGHT_STOP_DURATION;
  };

  /**
   * Get cached flight data if available and not expired
   */
  const getCachedFlightData = (flightNumber: string): UnifiedFlightData | null => {
    const cached = flightDataCache.get(flightNumber);
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > FLIGHT_CACHE_DURATION;
    
    if (isExpired) {
      // Remove expired cache entry
      setFlightDataCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(flightNumber);
        return newCache;
      });
      return null;
    }

    return cached.data;
  };

  /**
   * Cache flight data
   */
  const cacheFlightData = (flightNumber: string, data: UnifiedFlightData) => {
    setFlightDataCache(prev => new Map(prev).set(flightNumber, {
      data,
      timestamp: Date.now()
    }));
  };


  /**
   * Handle keyboard events for flight number input
   */
  const handleFlightNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace for clearing input
    if (e.key === 'Backspace' && flightNumber.length === 1) {
      // When backspace is pressed and only one character left, clear all search data
      setFlightNumber('');
      setFlightData(null);
      setError(null);
      setIsSearchFormCollapsed(false);
      setUserClearedInput(true); // Mark as user-initiated clear
      setPinnedFlight(null); // Clear pinned flight as well
    }
    
    // Handle Enter key for search
    if (e.key === 'Enter' && flightNumber.trim()) {
      setUserClearedInput(false); // Reset clear flag when searching
      handleSearch();
    }
  };

  /**
   * Handle manual refresh of current flight data (bypasses rate limiting and cache)
   */
  const handleRefresh = async () => {
    if (!flightData) {
      toast.error('No flight data to refresh');
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      // Check if flight arrived too long ago
      if (isFlightArrivedTooLongAgo(flightData)) {
        setError('Flight has arrived more than 1 hour ago. Tracking is no longer available.');
        setIsRefreshing(false);
        return;
      }

      const params: FlightSearchParams = {
        flightNumber: flightData.flightNumber,
        route: (searchDate && departure) ? { from: departure, to: arrival || undefined } : undefined,
        date: searchDate ? new Date(searchDate) : undefined
      };

      
      const result = await unifiedFlightTracker.trackFlight(params);
      
      if (result) {
        // Check if flight arrived too long ago
        if (isFlightArrivedTooLongAgo(result)) {
          setError('Flight has arrived more than 1 hour ago. Tracking is no longer available.');
          setIsRefreshing(false);
          return;
        }

        // Cache the refreshed result
        if (result.flightNumber) {
          cacheFlightData(result.flightNumber, result);
        }
        
        setFlightData(result);
        toast.success(`Flight ${result.flightNumber} updated!`);
        
        // Update saved flights with new data
        await updateSavedFlightsWithNewData(result);
        
        // Update rate limiting timestamps for manual refresh
        const now = Date.now();
        setLastAutoSearchTime(now);
        setNextAutoSearchTime(now + AUTO_SEARCH_INTERVAL);
        setNextFlightUpdate(now + FLIGHT_CACHE_DURATION);
        
        if (onFlightSelect) {
          onFlightSelect(result);
        }
      } else {
        toast.error('Failed to refresh flight data');
      }
    } catch (error) {
      // Swallow console noise
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh flight';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Update saved flights with new flight data
   */
  const updateSavedFlightsWithNewData = async (flightData: UnifiedFlightData) => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return;

      // Get all saved flights for this user
      const userSavedFlights = await flightService.getSavedFlights(currentUser.$id);
      
      // Find matching saved flight by flight number
      const matchingSavedFlight = userSavedFlights?.find(saved => 
        saved.flightNumber === flightData.flightNumber ||
        saved.flight.iataNumber === flightData.flight.iataNumber ||
        saved.flight.icaoNumber === flightData.flight.icaoNumber
      );

      if (matchingSavedFlight) {
        
        // Convert UnifiedFlightData to SavedFlight format
        const updatedSavedFlight: Partial<SavedFlight> = {
          flightNumber: flightData.flightNumber,
          flight: flightData.flight,
          airline: {
            name: flightData.airline.name,
            iataCode: flightData.airline.iataCode,
            logoUrl: matchingSavedFlight.airline.logoUrl // Preserve existing logo
          },
          departure: {
            airport: flightData.schedule.departure.airport || matchingSavedFlight.departure.airport,
            airportName: flightData.schedule.departure.airportName || matchingSavedFlight.departure.airportName,
            airportCity: flightData.schedule.departure.airportCity || matchingSavedFlight.departure.airportCity,
            airportCountry: flightData.schedule.departure.airportCountry || matchingSavedFlight.departure.airportCountry,
            scheduledTime: flightData.schedule.departure.scheduledTime || matchingSavedFlight.departure.scheduledTime,
            actualTime: flightData.schedule.departure.actualTime,
            estimatedTime: flightData.schedule.departure.estimatedTime,
            gate: flightData.schedule.departure.gate,
            terminal: flightData.schedule.departure.terminal,
            delay: flightData.schedule.departure.delay
          },
          arrival: {
            airport: flightData.schedule.arrival.airport || matchingSavedFlight.arrival.airport,
            airportName: flightData.schedule.arrival.airportName || matchingSavedFlight.arrival.airportName,
            airportCity: flightData.schedule.arrival.airportCity || matchingSavedFlight.arrival.airportCity,
            airportCountry: flightData.schedule.arrival.airportCountry || matchingSavedFlight.arrival.airportCountry,
            scheduledTime: flightData.schedule.arrival.scheduledTime || matchingSavedFlight.arrival.scheduledTime,
            actualTime: flightData.schedule.arrival.actualTime,
            estimatedTime: flightData.schedule.arrival.estimatedTime,
            gate: flightData.schedule.arrival.gate,
            terminal: flightData.schedule.arrival.terminal,
            delay: flightData.schedule.arrival.delay
          },
          status: flightData.status,
          aircraft: flightData.aircraft || matchingSavedFlight.aircraft
        };

        await flightService.updateSavedFlight(matchingSavedFlight.$id!, updatedSavedFlight);
        
        // Reload saved flights for AI insights
        await loadSavedFlights();
        
      }
    } catch (error) {
      console.error('❌ Failed to update saved flights:', error);
      // Don't show error to user as this is background operation
    }
  };


  // Expand form when no flight data
  useEffect(() => {
    if (!flightData) {
      setIsSearchFormCollapsed(false);
    }
  }, [flightData]);

  // Update timer display every second when auto-search is enabled
  useEffect(() => {
    if (!autoSearchEnabled || nextAutoSearchTime === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= nextAutoSearchTime) {
        // Timer expired, clear the interval
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [autoSearchEnabled, nextAutoSearchTime]);

  // Update flight update timer display every second
  useEffect(() => {
    if (nextFlightUpdate === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= nextFlightUpdate) {
        // Timer expired, clear the interval
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextFlightUpdate]);

  // Clean up auto-search interval on unmount
  useEffect(() => {
    return () => {
      if (autoSearchInterval) {
        clearInterval(autoSearchInterval);
      }
    };
  }, [autoSearchInterval]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Main Content Container */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
          <div className="flex gap-2 sm:gap-3 lg:gap-4 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`group relative px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap flex-shrink-0 ${
                activeTab === 'tracker'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transform'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
                  activeTab === 'tracker' ? 'bg-white/20' : 'bg-sky-100 dark:bg-sky-900/30'
                }`}>
                  <Navigation className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                </div>
                <span className="hidden sm:inline">Flight Tracker</span>
                <span className="sm:hidden">Tracker</span>
              </div>
              {activeTab === 'tracker' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 sm:w-10 h-1 bg-white/40 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`group relative px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap flex-shrink-0 ${
                activeTab === 'timetable'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transform'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
                  activeTab === 'timetable' ? 'bg-white/20' : 'bg-sky-100 dark:bg-sky-900/30'
                }`}>
                  <Building2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                </div>
                <span className="hidden sm:inline">Airport Timetable</span>
                <span className="sm:hidden">Timetable</span>
              </div>
              {activeTab === 'timetable' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 sm:w-10 h-1 bg-white/40 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`group relative px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap flex-shrink-0 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transform'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
                  activeTab === 'history' ? 'bg-white/20' : 'bg-sky-100 dark:bg-sky-900/30'
                }`}>
                  <Bookmark className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                </div>
                <span className="hidden sm:inline">Saved Flights</span>
                <span className="sm:hidden">History</span>
              </div>
              {activeTab === 'history' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 sm:w-10 h-1 bg-white/40 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ai-insights')}
              className={`group relative px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap flex-shrink-0 ${
                activeTab === 'ai-insights'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transform'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
                  activeTab === 'ai-insights' ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/30'
                }`}>
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                </div>
                <span className="hidden sm:inline">AI Insights</span>
                <span className="sm:hidden">AI</span>
              </div>
              {activeTab === 'ai-insights' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 sm:w-10 h-1 bg-white/40 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('intelligence')}
              className={`group relative px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap flex-shrink-0 ${
                activeTab === 'intelligence'
                  ? 'bg-gradient-to-r from-blue-500 to-green-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transform'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
                  activeTab === 'intelligence' ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                </div>
                <span className="hidden sm:inline">Flight Intel</span>
                <span className="sm:hidden">Intel</span>
              </div>
              {activeTab === 'intelligence' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 sm:w-10 h-1 bg-white/40 rounded-full"></div>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">

        {/* Tab Content */}
        {activeTab === 'tracker' ? (
          <div className="space-y-8">
            {/* Collapsible Search Form */}
            {!isSearchFormCollapsed ? (
              <div className="space-y-8">
                

                {/* Date Input */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    Search Date
                  </h3>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 sm:p-8 border border-purple-200 dark:border-purple-800">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Flight Date (optional - leave empty for live flights)
                          </label>
                          <input
                            type="date"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            className="w-full px-5 py-4 border-2 border-purple-300 dark:border-purple-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white transition-all duration-200 text-lg"
                          />
                        </div>
                      </div>
                      
                      {searchDate && (
                        <div className={`p-5 rounded-xl border-2 border-dashed ${
                          (() => {
                            const selectedDate = new Date(searchDate);
                            const now = new Date();
                            const isFuture = selectedDate > now;
                            return isFuture 
                              ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700' 
                              : 'border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700';
                          })()
                        }`}>
                          <p className={`text-sm font-medium ${
                            (() => {
                              const selectedDate = new Date(searchDate);
                              const now = new Date();
                              const isFuture = selectedDate > now;
                              return isFuture 
                                ? 'text-blue-800 dark:text-blue-200' 
                                : 'text-purple-800 dark:text-purple-200';
                            })()
                          }`}>
                            {(() => {
                              const selectedDate = new Date(searchDate);
                              const now = new Date();
                              const isFuture = selectedDate > now;
                              return isFuture 
                                ? '🔮 Future flight search - Route information recommended for better results'
                                : '📅 Historical flight search - Route information recommended for better results';
                            })()}
                          </p>
                        </div>
                      )}
                      
                      {searchDate && (() => {
                        const selectedDate = new Date(searchDate);
                        const now = new Date();
                        const daysDiff = (selectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                        return daysDiff > 7;
                      })() && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <span className="text-white text-sm font-bold">i</span>
                            </div>
                            <div className="space-y-3">
                              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                                Future Flight Search Requirements
                              </p>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                Aviation Edge Future API requires dates to be at least 7 days ahead. 
                                For dates within the next week, we'll search current schedules instead.
                              </p>
                              {searchDate && (() => {
                                const selectedDate = new Date(searchDate);
                                const now = new Date();
                                const daysDiff = (selectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                                
                                if (daysDiff < 7) {
                                  return (
                                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                        ⚠️ Selected date is only {daysDiff.toFixed(1)} days ahead. 
                                        Please select a date at least 7 days in the future for optimal results.
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Route Fields for Future/Historical Flights */}
                {searchDate && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                      Route Information {(() => {
                        const selectedDate = new Date(searchDate);
                        const now = new Date();
                        const isFuture = selectedDate > now;
                        return isFuture ? '(Recommended for future flights)' : '(Recommended for historical flights)';
                      })()}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Departure Airport (e.g., JFK)"
                        value={departure}
                        onChange={(e) => setDeparture(e.target.value.toUpperCase())}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Arrival Airport (e.g., LAX) - Optional"
                        value={arrival}
                        onChange={(e) => setArrival(e.target.value.toUpperCase())}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Search Form */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <Search className="w-4 h-4 text-white" />
                    </div>
                    Flight Search
                  </h3>
                  
                  {/* Enhanced loading panel */}
                  {isSearching && (
                    <div className="mb-4 p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm sm:text-base text-blue-900 dark:text-blue-100 font-semibold">
                              Searching your flight…
                            </p>
                            {pinnedFlight && isAutoLoadingPinned && (
                              <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">Pinned: {pinnedFlight.flightNumber}</span>
                            )}
                          </div>
                          <div className="w-full h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-500 dark:to-indigo-400 transition-all duration-500"
                              style={{ width: `${Math.round(loadingProgress)}%` }}
                            />
                          </div>
                          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                            {loadingMessages[loadingMessageIndex]}
                          </p>
                          {/* Skeleton placeholders */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                            <div className="h-10 bg-white/70 dark:bg-white/5 rounded-lg animate-pulse" />
                            <div className="h-10 bg-white/70 dark:bg-white/5 rounded-lg animate-pulse" />
                            <div className="h-10 bg-white/70 dark:bg-white/5 rounded-lg animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Auto-Search Status Indicator */}
                  <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                    <div className="flex items-center justify-center gap-2">
                      {/* Next auto-search timer hidden for cleaner UI */}
                      <button
                        onClick={toggleAutoSearch}
                        disabled={pinnedFlight?.status === 'arrived'}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          pinnedFlight?.status === 'arrived'
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : autoSearchEnabled
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                        }`}
                        title={pinnedFlight?.status === 'arrived' ? 'Cannot enable auto-search for arrived flights' : undefined}
                      >
                        {pinnedFlight?.status === 'arrived' ? 'Auto-search: Arrived' : (autoSearchEnabled ? 'Auto-search: Disable' : 'Auto-search: Enable')}
                      </button>
                    </div>
                  </div>

                  {/* Debug: Manual pinned flight trigger */}
                  {!pinnedFlight && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">
                          No pinned flight found. Click to manually load latest flight.
                        </span>
                        <button
                          onClick={() => {
                            // Ensure user-cleared guard does not block manual load
                            resetUserClearedState();
                            loadLatestFlight();
                          }}
                          className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 transition-colors"
                        >
                          Load Latest
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 sm:p-8 border border-purple-200 dark:border-purple-800">
                    <div className="space-y-6">
                      {/* Flight Number Input */}
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Flight Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Plane className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Enter flight number (e.g., UA123, AI2718)"
                            value={flightNumber}
                            onChange={(e) => {
                              setFlightNumber(e.target.value.toUpperCase());
                              if (e.target.value.length > 0) {
                                setUserClearedInput(false); // Reset clear flag when user types
                              }
                            }}
                            onKeyDown={handleFlightNumberKeyDown}
                            className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white transition-colors text-lg font-mono"
                          />
                          {/* Clear button */}
                          {flightNumber && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setFlightNumber('');
                                  setFlightData(null);
                                  setError(null);
                                  setIsSearchFormCollapsed(false);
                                  setUserClearedInput(true); // Mark as user-initiated clear
                                  setPinnedFlight(null); // Clear pinned flight as well
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Clear flight number"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Search Button */}
                      <div className="pt-6">
                        <div className="space-y-3">
                          <button
                            onClick={() => handleSearch()}
                            disabled={isSearching}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
                          >
                            {isSearching ? (
                              <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>Searching...</span>
                              </>
                            ) : (
                              <>
                                <Search className="w-6 h-6" />
                                <span>
                                  {(() => {
                                    if (!searchDate) return 'Search Live Flight';
                                    const selectedDate = new Date(searchDate);
                                    const now = new Date();
                                    const isFuture = selectedDate > now;
                                    return isFuture ? 'Search Future Flight' : 'Search Historical Flight';
                                  })()}
                                </span>
                              </>
                            )}
                          </button>
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Collapsed Search Form - Show Summary */
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        Search Results Found
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {flightNumber && `Flight: ${flightNumber}`}
                        {searchDate && ` • Date: ${searchDate}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSearchFormCollapsed(false)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit Search</span>
                      <span className="sm:hidden">Edit</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRemoveFlight}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                      title="Clear flight tracking"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Flight Data Display */}
            {flightData && (
              <>
                {/* Flight Information Header with Refresh Button */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
                  <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Plane className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                            Flight {flightData.flightNumber}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {flightData.airline.name} • {flightData.status}
                          </p>
                        </div>
                      </div>
                      
                      {/* Auto-Search Controls and Manual Actions */}
                      <div className="flex items-center gap-2">
                        {/* Auto-Search Toggle */}
                        <button
                          onClick={toggleAutoSearch}
                          disabled={pinnedFlight?.status === 'arrived'}
                          className={`group relative px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                            pinnedFlight?.status === 'arrived'
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              : autoSearchEnabled
                                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                                : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          title={pinnedFlight?.status === 'arrived' ? 'Cannot enable auto-search for arrived flights' : (autoSearchEnabled ? 'Disable auto-search' : 'Enable auto-search')}
                        >
                          {pinnedFlight?.status === 'arrived' ? (
                            <Plane className="w-4 h-4" />
                          ) : autoSearchEnabled ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline text-sm">
                            {pinnedFlight?.status === 'arrived' ? 'Auto-search: Arrived' : (autoSearchEnabled ? 'Auto-search: ON' : 'Auto-search: OFF')}
                          </span>
                        </button>

                        {/* Next Auto-Search Timer */}
                        {/* Next auto-search timer hidden for cleaner UI */}

                        {/* Manual Remove Button */}
                        <button
                          onClick={handleRemoveFlight}
                          className="group relative px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:shadow-md"
                          title="Clear flight tracking"
                        >
                          <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                          <span className="hidden sm:inline text-sm">Clear</span>
                        </button>

                        {/* Manual Refresh Button */}
                        <button
                          onClick={handleRefresh}
                          disabled={isRefreshing}
                          className={`group relative px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                            isRefreshing
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 hover:shadow-md'
                          }`}
                          title="Manual refresh - always available regardless of auto-search settings"
                        >
                          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                          <span className="hidden sm:inline text-sm">
                            {isRefreshing ? 'Updating...' : 'Refresh'}
                          </span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Last updated info */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Real-time tracking • Click refresh for latest updates
                        </p>
                        
                        {/* Cache Status Indicator */}
                        {(() => {
                          // const timeUntilUpdate = getTimeUntilNextFlightUpdate();
                          // Previously showed cache and next update badges; returning clean UI now
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Flight Details */}
                {(() => {
                  return (
                    <FlightDetailsCard flight={flightData} searchDate={searchDate} />
                  );
                })()}

                {/* Flight Timeline */}
                {flightData.events && flightData.events.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          Flight Timeline
                        </h3>
                        
                        {/* Secondary refresh button for timeline */}
                        <button
                          onClick={handleRefresh}
                          disabled={isRefreshing}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            isRefreshing
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                          }`}
                          title="Refresh timeline data"
                        >
                          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : 'hover:rotate-180 transition-transform duration-300'}`} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 sm:p-4 lg:p-6">
                      <div className="relative">
                        {/* Main timeline line */}
                        <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 sm:w-1 bg-gradient-to-b from-blue-500 via-green-500 to-blue-600 rounded-full opacity-80"></div>
                        
                        {/* Timeline events */}
                        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                          {flightData.events.map((event, index) => {
                            const getEventIcon = (type: string) => {
                              switch (type) {
                                case 'gate_departure': return '🚪';
                                case 'takeoff': return '🛫';
                                case 'cruising': return '✈️';
                                case 'airspace_transition': return '🌐';
                                case 'descent': return '⬇️';
                                case 'landing': return '🛬';
                                case 'landed': return '🛬';
                                case 'gate_arrival': return '🏁';
                                default: return '📍';
                              }
                            };
                            
                            const getEventColor = (type: string) => {
                              switch (type) {
                                case 'gate_departure': return 'from-blue-500 to-blue-600';
                                case 'takeoff': return 'from-green-500 to-green-600';
                                case 'cruising': return 'from-sky-500 to-sky-600';
                                case 'airspace_transition': return 'from-purple-500 to-purple-600';
                                case 'descent': return 'from-orange-500 to-orange-600';
                                case 'landing': return 'from-emerald-500 to-emerald-600';
                                case 'landed': return 'from-emerald-500 to-emerald-600';
                                case 'gate_arrival': return 'from-red-500 to-red-600';
                                default: return 'from-gray-500 to-gray-600';
                              }
                            };

                            const formatTime = (timeStr: string) => {
                              try {
                                return new Date(timeStr).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                });
                              } catch {
                                return '--:--';
                              }
                            };

                            return (
                              <div key={index} className="relative flex items-start">
                                {/* Event marker */}
                                <div className={`relative z-10 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${getEventColor(event.type)} rounded-full flex items-center justify-center shadow-lg border-2 sm:border-4 border-white dark:border-gray-800`}>
                                  <span className="text-sm sm:text-base lg:text-lg">{getEventIcon(event.type)}</span>
                                </div>
                                
                                {/* Event content */}
                                <div className="ml-3 sm:ml-4 lg:ml-6 flex-1 min-w-0">
                                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-start justify-between mb-1 sm:mb-2">
                                      <div className="flex-1 min-w-0 pr-2">
                                        <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white capitalize truncate">
                                          {event.type.replace('_', ' ')}
                                        </h4>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                          {event.description}
                                        </p>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <div className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                                          {formatTime(event.time)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {event.type.replace('_', ' ').toUpperCase()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Flight Map (if live) */}
                {flightData.isLive && flightData.position && (
                  <FlightMap flight={flightData} />
                )}


              </>
            )}
          </div>
        ) : activeTab === 'timetable' ? (
          /* Airport Timetable Tab */
          <AirportTimetable />
        ) : activeTab === 'history' ? (
          /* History Tab */
          <SavedFlights 
            onFlightSelect={() => {
              // The SavedFlights component will handle showing the flight details
            }}
          />
        ) : activeTab === 'ai-insights' ? (
          /* AI Insights Tab */
          <FlightTrackerAIInsights 
            flights={savedFlights}
            selectedFlight={flightData ? {
              $id: `temp_${flightData.flightNumber}_${Date.now()}`,
              userId: 'temp_user',
              flightNumber: flightData.flightNumber,
              flight: {
                number: flightData.flight?.number || flightData.flightNumber,
                iataNumber: flightData.flight?.iataNumber || flightData.flightNumber,
                icaoNumber: flightData.flight?.icaoNumber || ''
              },
              airline: {
                name: flightData.airline?.name || 'Unknown',
                iataCode: flightData.airline?.iataCode || '',
                logoUrl: undefined
              },
              departure: {
                airport: flightData.schedule?.departure?.airport || '',
                airportName: flightData.schedule?.departure?.airportName || '',
                airportCity: flightData.schedule?.departure?.airportCity || '',
                airportCountry: flightData.schedule?.departure?.airportCountry || '',
                scheduledTime: flightData.schedule?.departure?.scheduledTime || '',
                estimatedTime: flightData.schedule?.departure?.estimatedTime || '',
                actualTime: flightData.schedule?.departure?.actualTime || '',
                terminal: flightData.schedule?.departure?.terminal || '',
                gate: flightData.schedule?.departure?.gate || ''
              },
              arrival: {
                airport: flightData.schedule?.arrival?.airport || '',
                airportName: flightData.schedule?.arrival?.airportName || '',
                airportCity: flightData.schedule?.arrival?.airportCity || '',
                airportCountry: flightData.schedule?.arrival?.airportCountry || '',
                scheduledTime: flightData.schedule?.arrival?.scheduledTime || '',
                estimatedTime: flightData.schedule?.arrival?.estimatedTime || '',
                actualTime: flightData.schedule?.arrival?.actualTime || '',
                terminal: flightData.schedule?.arrival?.terminal || '',
                gate: flightData.schedule?.arrival?.gate || ''
              },
              status: flightData.status || 'Unknown',
              savedAt: new Date().toISOString()
            } : undefined}
            onRefresh={loadSavedFlights}
          />
        ) : activeTab === 'intelligence' ? (
          /* Flight Intelligence Tab */
          <FlightIntelligenceTab 
            currentFlight={flightData ? {
              flightNumber: flightData.flightNumber,
              airline: flightData.airline?.name || 'Unknown Airline',
              departure: { 
                airport: flightData.schedule?.departure?.airport || 'Unknown',
                city: flightData.schedule?.departure?.airportCity
              },
              arrival: { 
                airport: flightData.schedule?.arrival?.airport || 'Unknown',
                city: flightData.schedule?.arrival?.airportCity
              },
              status: flightData.status || 'Unknown'
            } : undefined}
            savedFlights={savedFlights}
          />
        ) : null}
        </div>
      </div>
    </div>
  );
};

export default FlightTracker;
