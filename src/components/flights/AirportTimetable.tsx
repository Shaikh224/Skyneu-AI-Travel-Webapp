/**
 * Airport Timetable Component
 * Displays airport departure and arrival schedules like airport screens
 */

import React, { useState, useEffect } from 'react';
import { 
  Plane, Calendar, Clock, MapPin, Building2, 
  DoorOpen, Hash, Loader2, RefreshCw, Filter,
  ChevronLeft, ChevronRight, Search, AlertCircle
} from 'lucide-react';
import unifiedFlightTracker from '@/services/flightTracking/unifiedFlightTracker';
import { UnifiedFlightData } from '@/services/flightTracking/unifiedFlightTracker';

interface AirportTimetableProps {}

interface TimetableFilters {
  airline?: string;
  status?: string;
}

const AirportTimetable: React.FC<AirportTimetableProps> = () => {
  // State
  const [airport, setAirport] = useState('');
  const [type, setType] = useState<'departure' | 'arrival'>('departure');
  const [filters, setFilters] = useState<TimetableFilters>({});
  
  const [flights, setFlights] = useState<UnifiedFlightData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(20);
  const [totalFlights, setTotalFlights] = useState(0);

  // Debounced timetable loading
  useEffect(() => {
    if (airport && airport.trim().length >= 3) {
      // Debounce API calls by 500ms
      const timeoutId = setTimeout(() => {
        loadTimetable();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [airport, type, filters]);

  /**
   * Load airport timetable
   */
  const loadTimetable = async () => {
    if (!airport || airport.trim().length < 3) {
      setError('Please enter a valid 3-letter airport code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const timetableData = await unifiedFlightTracker.getAirportTimetable({
        airport: airport.toUpperCase(),
        type,
        airline: filters.airline,
        status: filters.status
      });

      setFlights(timetableData);
      setTotalFlights(timetableData.length);
    } catch (err) {
      let message = 'Failed to load timetable';
      
      if (err instanceof Error) {
        if (err.message.includes('429') || err.message.includes('rate limit')) {
          message = 'API rate limit reached. Please wait a moment and try again.';
        } else if (err.message.includes('CORS')) {
          message = 'Network error. Please check your connection and try again.';
        } else {
          message = err.message;
        }
      }
      
      setError(message);
      console.error('Timetable loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh timetable
   */
  const handleRefresh = () => {
    if (airport && airport.trim().length > 0) {
      loadTimetable();
    }
  };


  /**
   * Filter flights by search term and apply display limit
   */
  const filteredFlights = flights.filter(flight => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      flight.flightNumber.toLowerCase().includes(searchLower) ||
      flight.airline.name.toLowerCase().includes(searchLower) ||
      flight.schedule.departure.airport?.iata?.toLowerCase().includes(searchLower) ||
      flight.schedule.departure.airport?.name?.toLowerCase().includes(searchLower) ||
      flight.schedule.arrival.airport?.iata?.toLowerCase().includes(searchLower) ||
      flight.schedule.arrival.airport?.name?.toLowerCase().includes(searchLower)
    );
  });

  const displayedFlights = filteredFlights.slice(0, displayLimit);
  const hasMoreFlights = filteredFlights.length > displayLimit;

  /**
   * Load more flights
   */
  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 20);
  };

  /**
   * Format time for display
   */
  const formatTime = (dateStr: string | Date | undefined): string => {
    if (!dateStr) return '--:--';
    
    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      if (isNaN(date.getTime())) return '--:--';
      
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return '--:--';
    }
  };

  /**
   * Get status color and styling with improved future flight statuses
   */
  const getStatusStyle = (status: string): { textColor: string; bgColor: string; borderColor: string } => {
    switch (status) {
      case 'scheduled':
        return { 
          textColor: 'text-blue-700 dark:text-blue-300', 
          bgColor: 'bg-blue-50 dark:bg-blue-900/20', 
          borderColor: 'border-blue-200 dark:border-blue-800' 
        };
      case 'active':
        return { 
          textColor: 'text-green-700 dark:text-green-300', 
          bgColor: 'bg-green-50 dark:bg-green-900/20', 
          borderColor: 'border-green-200 dark:border-green-800' 
        };
      case 'landed':
        return { 
          textColor: 'text-emerald-700 dark:text-emerald-300', 
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', 
          borderColor: 'border-emerald-200 dark:border-emerald-800' 
        };
      case 'cancelled':
        return { 
          textColor: 'text-red-700 dark:text-red-300', 
          bgColor: 'bg-red-50 dark:bg-red-900/20', 
          borderColor: 'border-red-200 dark:border-red-800' 
        };
      case 'incident':
        return { 
          textColor: 'text-orange-700 dark:text-orange-300', 
          bgColor: 'bg-orange-50 dark:bg-orange-900/20', 
          borderColor: 'border-orange-200 dark:border-orange-800' 
        };
      case 'diverted':
        return { 
          textColor: 'text-purple-700 dark:text-purple-300', 
          bgColor: 'bg-purple-50 dark:bg-purple-900/20', 
          borderColor: 'border-purple-200 dark:border-purple-800' 
        };
      case 'redirected':
        return { 
          textColor: 'text-indigo-700 dark:text-indigo-300', 
          bgColor: 'bg-indigo-50 dark:bg-indigo-900/20', 
          borderColor: 'border-indigo-200 dark:border-indigo-800' 
        };
      case 'unknown':
        return { 
          textColor: 'text-gray-700 dark:text-gray-300', 
          bgColor: 'bg-gray-50 dark:bg-gray-900/20', 
          borderColor: 'border-gray-200 dark:border-gray-800' 
        };
      case 'delayed':
        return { 
          textColor: 'text-orange-700 dark:text-orange-300', 
          bgColor: 'bg-orange-50 dark:bg-orange-900/20', 
          borderColor: 'border-orange-200 dark:border-orange-800' 
        };
      default:
        return { 
          textColor: 'text-gray-700 dark:text-gray-300', 
          bgColor: 'bg-gray-50 dark:bg-gray-900/20', 
          borderColor: 'border-gray-200 dark:border-gray-800' 
        };
    }
  };

  /**
   * Get delay display with color coding
   */
  const getDelayDisplay = (delay?: number): { text: string; color: string } => {
    if (!delay || delay === 0) return { text: 'On time', color: 'text-green-600 dark:text-green-400' };
    if (delay > 0) return { text: `+${delay}m`, color: 'text-orange-600 dark:text-orange-400' };
    return { text: `${delay}m`, color: 'text-blue-600 dark:text-blue-400' };
  };

  /**
   * Get time status indicator
   */
  const getTimeStatus = (scheduled?: string, estimated?: string, actual?: string): { status: string; color: string } => {
    if (actual) return { status: 'Actual', color: 'text-green-600 dark:text-green-400' };
    if (estimated) return { status: 'Estimated', color: 'text-orange-600 dark:text-orange-400' };
    if (scheduled) return { status: 'Scheduled', color: 'text-blue-600 dark:text-blue-400' };
    return { status: 'Unknown', color: 'text-gray-500 dark:text-gray-400' };
  };

  /**
   * Get display text for flight status
   */
  const getStatusDisplayText = (status: string): string => {
    switch (status) {
      case 'scheduled': return 'SCHEDULED';
      case 'active': return 'ACTIVE';
      case 'landed': return 'LANDED';
      case 'cancelled': return 'CANCELLED';
      case 'incident': return 'INCIDENT';
      case 'diverted': return 'DIVERTED';
      case 'redirected': return 'REDIRECTED';
      case 'unknown': return 'UNKNOWN';
      case 'delayed': return 'DELAYED';
      default: return status.toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg p-6 border border-blue-200 dark:border-gray-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                Live Airport Timetable
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Current departure and arrival schedules
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading || !airport}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Airport and Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Airport Code *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={airport}
                onChange={(e) => setAirport(e.target.value.toUpperCase())}
                placeholder="e.g., LHR, CDG, DEL"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Schedule Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'departure' | 'arrival')}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
            >
              <option value="departure">✈️ Departures</option>
              <option value="arrival">🛬 Arrivals</option>
            </select>
          </div>
        </div>

        {/* Filters Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide' : 'Show'} Advanced Filters
          </button>

          {airport && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">{displayedFlights.length}</span> of{' '}
              <span className="font-semibold">{filteredFlights.length}</span> flights shown for{' '}
              <span className="font-bold text-blue-600 dark:text-blue-400">{airport}</span>
              {filteredFlights.length !== totalFlights && (
                <span className="text-xs text-gray-500"> (filtered from {totalFlights})</span>
              )}
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Airline Filter
                </label>
                <input
                  type="text"
                  value={filters.airline || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, airline: e.target.value || undefined }))}
                  placeholder="e.g., AA, BA, EK"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Flight Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="check-in">Check-in Open</option>
                  <option value="boarding">Boarding</option>
                  <option value="final-call">Final Call</option>
                  <option value="gate-closed">Gate Closed</option>
                  <option value="delayed">Delayed</option>
                  <option value="departed">Departed</option>
                  <option value="en-route">En-route</option>
                  <option value="descending">Descending</option>
                  <option value="arrived">Arrived</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="diverted">Diverted</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search flights, airlines, or airports..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Airport Required Message */}
      {!airport && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Airport Code Required
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300">
            Please enter an airport code (e.g., LHR, CDG, DEL) to view the timetable.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Timetable */}
      {airport && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Mobile Card View */}
          <div className="block md:hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                      Loading timetable for {airport}...
                    </span>
                  </div>
                </div>
              ) : displayedFlights.length === 0 ? (
                <div className="p-6 text-center">
                  <Plane className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">
                    No flights found
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Try adjusting your filters or check the airport code
                  </p>
                </div>
              ) : (
                displayedFlights.map((flight, index) => {
                  const statusStyle = getStatusStyle(flight.status);
                  const delayDisplay = getDelayDisplay(
                    type === 'departure' ? flight.schedule.departure.delay : flight.schedule.arrival.delay
                  );
                  const timeStatus = getTimeStatus(
                    type === 'departure' ? flight.schedule.departure.scheduledTime : flight.schedule.arrival.scheduledTime,
                    type === 'departure' ? flight.schedule.departure.estimatedTime : flight.schedule.arrival.estimatedTime,
                    type === 'departure' ? flight.schedule.departure.actualTime : flight.schedule.arrival.actualTime
                  );

                  return (
                    <div key={`mobile-${flight.flightNumber}-${index}`} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {/* Flight Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {flight.airline.iataCode && (
                            <img 
                              src={`http://img.wway.io/pics/root/${flight.airline.iataCode.toUpperCase()}@png?exar=1&rs=fit:40:40`} 
                              alt={`${flight.airline.name} logo`}
                              className="w-10 h-10 rounded-md bg-white p-1 border border-gray-200 dark:border-gray-600"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="font-bold text-lg text-gray-900 dark:text-white">
                              {flight.flightNumber}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {flight.airline.name}
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ${statusStyle.textColor} ${statusStyle.bgColor} ${statusStyle.borderColor}`}>
                          {getStatusDisplayText(flight.status)}
                        </span>
                      </div>

                      {/* Route & Times */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                            {type === 'departure' ? 'To' : 'From'}
                          </div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {type === 'departure' ? flight.schedule.arrival.airport : flight.schedule.departure.airport}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {type === 'departure' ? flight.schedule.arrival.airportName : flight.schedule.departure.airportName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                            {type === 'departure' ? 'ETD' : 'ETA'}
                          </div>
                          <div className="font-bold text-lg text-gray-900 dark:text-white">
                            {formatTime(
                              type === 'departure' ? 
                                (flight.schedule.departure.estimatedTime || flight.schedule.departure.actualTime || flight.schedule.departure.scheduledTime) : 
                                (flight.schedule.arrival.estimatedTime || flight.schedule.arrival.actualTime || flight.schedule.arrival.scheduledTime)
                            )}
                          </div>
                          <div className="flex items-center justify-end gap-1 text-xs">
                            <span className={delayDisplay.color}>
                              {delayDisplay.text}
                            </span>
                            <span className={timeStatus.color}>
                              ({timeStatus.status})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Gate/Terminal Info */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            {type === 'departure' ? (
                              <DoorOpen className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Hash className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-gray-600 dark:text-gray-400">
                              {type === 'departure' ? 'Gate' : 'Belt'}: 
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {type === 'departure' ? 
                                (flight.schedule.departure.gate || 'TBA') : 
                                (flight.schedule.arrival.baggage || flight.schedule.arrival.gate || 'TBA')
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Term:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {type === 'departure' ? flight.schedule.departure.terminal : flight.schedule.arrival.terminal || 'TBA'}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Sched: {formatTime(type === 'departure' ? flight.schedule.departure.scheduledTime : flight.schedule.arrival.scheduledTime)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Load More Button - Mobile */}
            {hasMoreFlights && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  Load More ({filteredFlights.length - displayLimit} remaining)
                </button>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    ✈️ Flight
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    🏢 Airline
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    {type === 'departure' ? '🎯 To' : '📍 From'}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    🕐 Scheduled
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    {type === 'departure' ? '🚀 ETD' : '🛬 ETA'}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    {type === 'departure' ? '🚪 Gate' : '👜 Belt'}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    🏛️ Terminal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    📊 Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                          Loading timetable for {airport}...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : displayedFlights.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-center">
                        <Plane className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">
                          No flights found
                        </h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Try adjusting your filters or check the airport code
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedFlights.map((flight, index) => {
                    const statusStyle = getStatusStyle(flight.status);
                    const delayDisplay = getDelayDisplay(
                      type === 'departure' ? flight.schedule.departure.delay : flight.schedule.arrival.delay
                    );
                    const timeStatus = getTimeStatus(
                      type === 'departure' ? flight.schedule.departure.scheduledTime : flight.schedule.arrival.scheduledTime,
                      type === 'departure' ? flight.schedule.departure.estimatedTime : flight.schedule.arrival.estimatedTime,
                      type === 'departure' ? flight.schedule.departure.actualTime : flight.schedule.arrival.actualTime
                    );

                    return (
                      <tr key={`${flight.flightNumber}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-3">
                {flight.airline.iataCode && (
                  <img 
                    src={`http://img.wway.io/pics/root/${flight.airline.iataCode.toUpperCase()}@png?exar=1&rs=fit:56:56`} 
                    alt={`${flight.airline.name} logo`}
                    className="w-14 h-14 rounded-md bg-white p-1 border border-gray-200 dark:border-gray-600"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    {flight.flightNumber}
                  </span>
                </div>
              </div>
            </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {flight.airline.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {flight.airline.iataCode}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {type === 'departure' ? flight.schedule.arrival.airport : flight.schedule.departure.airport}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {type === 'departure' ? flight.schedule.arrival.airportName : flight.schedule.departure.airportName}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatTime(type === 'departure' ? flight.schedule.departure.scheduledTime : flight.schedule.arrival.scheduledTime)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatTime(
                              type === 'departure' ? 
                                (flight.schedule.departure.estimatedTime || flight.schedule.departure.actualTime || flight.schedule.departure.scheduledTime) : 
                                (flight.schedule.arrival.estimatedTime || flight.schedule.arrival.actualTime || flight.schedule.arrival.scheduledTime)
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-medium ${delayDisplay.color}`}>
                              {delayDisplay.text}
                            </span>
                            <span className={`text-xs ${timeStatus.color}`}>
                              ({timeStatus.status})
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {type === 'departure' ? (
                              <DoorOpen className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Hash className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {type === 'departure' ? 
                                (flight.schedule.departure.gate || 'TBA') : 
                                (flight.schedule.arrival.baggage || flight.schedule.arrival.gate || 'TBA')
                              }
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {type === 'departure' ? flight.schedule.departure.terminal : flight.schedule.arrival.terminal || 'TBA'}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${statusStyle.textColor} ${statusStyle.bgColor} ${statusStyle.borderColor}`}>
                            {getStatusDisplayText(flight.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            
            {/* Load More Button - Desktop */}
            {hasMoreFlights && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 text-center">
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  Load More Flights ({filteredFlights.length - displayLimit} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AirportTimetable;
