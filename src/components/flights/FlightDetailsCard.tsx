/**
 * Flight Details Card Component
 * Clean, mobile-responsive flight information display
 */

import React, { useState, useEffect } from 'react';
import { 
  Plane, MapPin, 
  Building2, Luggage, DoorOpen,
  Navigation, Hash, Calendar} from 'lucide-react';

import { UnifiedFlightData } from '@/services/flightTracking/unifiedFlightTracker';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { flightService, SavedFlight } from '@/lib/appwrite';
import { authService } from '@/lib/appwrite';

interface FlightDetailsCardProps {
  flight: UnifiedFlightData;
  searchDate?: string; // Added searchDate prop
}



// Custom hook to fetch aircraft photo from Planespotters API
const useAircraftPhoto = (apiUrl: string | undefined) => {
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!apiUrl) {
      setPhotoUrl(undefined);
      return;
    }

    const fetchPhoto = async () => {
      setLoading(true);
      try {
        // console.log(`🖼️ Fetching aircraft photo from: ${apiUrl}`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          setPhotoUrl(undefined);
          return;
        }

        const data = await response.json();
        // console.log('📸 Planespotters API response:', data);

        if (data.photos && data.photos.length > 0) {
          // Use thumbnail_large for better quality, fallback to thumbnail
          const photo = data.photos[0];
          const imageUrl = photo.thumbnail_large?.src || photo.thumbnail?.src;
          
          if (imageUrl) {
            // console.log(`✅ Aircraft photo found: ${imageUrl}`);
            setPhotoUrl(imageUrl);
          } else {
            // console.log('⚠️ No photo URLs in API response');
            setPhotoUrl(undefined);
          }
        } else {
          // console.log('📷 No photos found for this aircraft');
          setPhotoUrl(undefined);
        }
      } catch (error) {
        setPhotoUrl(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchPhoto();
  }, [apiUrl]);

  return { photoUrl, loading };
};

const FlightDetailsCard: React.FC<FlightDetailsCardProps> = ({ flight, searchDate }) => {
  const isFutureFlight = flight.isFutureFlight || false;

  // (debug logs removed)
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if flight is already saved on component mount
  useEffect(() => {
    const checkIfSaved = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          setIsSaved(false);
          return;
        }

        const isAlreadySaved = await flightService.isFlightSaved(
          currentUser.$id,
          flight.flightNumber,
          searchDate
        );
        setIsSaved(isAlreadySaved);
      } catch (error) {
        setIsSaved(false);
      }
    };

    checkIfSaved();
  }, [flight.flightNumber, searchDate]);

  const handleSaveFlight = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        toast.error('Please log in to save flights');
        return;
      }

      // Convert full flight data to simplified saved flight structure
      const savedFlight: Omit<SavedFlight, 'savedAt' | '$id'> = {
        userId: currentUser.$id,
        flightNumber: flight.flightNumber,
        flight: {
          number: flight.flight.number,
          iataNumber: flight.flight.iataNumber,
          icaoNumber: flight.flight.icaoNumber
        },
        airline: {
          name: flight.airline.name,
          iataCode: flight.airline.iataCode,
          logoUrl: flight.logoUrl
        },
        departure: {
          airport: flight.schedule.departure.airport || '',
          airportName: flight.schedule.departure.airportName,
          airportCity: flight.schedule.departure.airportCity,
          airportCountry: flight.schedule.departure.airportCountry,
          scheduledTime: flight.schedule.departure.scheduledTime,
          actualTime: flight.schedule.departure.actualTime,
          estimatedTime: flight.schedule.departure.estimatedTime,
          gate: flight.schedule.departure.gate,
          terminal: flight.schedule.departure.terminal,
          delay: flight.schedule.departure.delay
        },
        arrival: {
          airport: flight.schedule.arrival.airport || '',
          airportName: flight.schedule.arrival.airportName,
          airportCity: flight.schedule.arrival.airportCity,
          airportCountry: flight.schedule.arrival.airportCountry,
          scheduledTime: flight.schedule.arrival.scheduledTime,
          actualTime: flight.schedule.arrival.actualTime,
          estimatedTime: flight.schedule.arrival.estimatedTime,
          gate: flight.schedule.arrival.gate,
          terminal: flight.schedule.arrival.terminal,
          baggage: flight.schedule.arrival.baggage,
          delay: flight.schedule.arrival.delay
        },
        status: flight.status,
        aircraft: flight.aircraft ? {
          type: flight.aircraft.type,
          registration: flight.aircraft.registration
        } : undefined,
        isFutureFlight: flight.isFutureFlight,
        isLive: flight.isLive,
        searchDate: searchDate
      };

      await flightService.saveFlight(savedFlight);
      setIsSaved(true);
      toast.success('Flight saved successfully!');
    } catch (error) {
      toast.error('Failed to save flight');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsaveFlight = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        toast.error('Please log in to manage saved flights');
        return;
      }

      // Get the saved flight to find its document ID
      const savedFlights = await flightService.getSavedFlights(currentUser.$id);
      const savedFlight = savedFlights.find(f => 
        f.flightNumber === flight.flightNumber && 
        (!searchDate || f.searchDate === searchDate)
      );

      if (savedFlight && savedFlight.$id) {
        await flightService.deleteSavedFlight(savedFlight.$id);
        setIsSaved(false);
        toast.success('Flight removed from saved flights');
      } else {
        toast.error('Flight not found in saved flights');
      }
    } catch (error) {
      toast.error('Failed to remove flight');
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch aircraft photo using the API URL
  const { photoUrl: aircraftPhotoUrl, loading: photoLoading } = useAircraftPhoto(flight.photoUrl);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on-time': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'delayed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'boarding': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'gate-closed': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'departed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'arrived': case 'landed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'scheduled': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'approaching': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'descending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'en-route': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'live': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on-time': return '✅';
      case 'delayed': return '⏰';
      case 'boarding': return '🚶';
      case 'gate-closed': return '🚪';
      case 'departed': return '🛫';
      case 'arrived': case 'landed': return '🛬';
      case 'cancelled': return '❌';
      case 'scheduled': return '📅';
      case 'approaching': return '🛬';
      case 'descending': return '↘️';
      case 'en-route': return '✈️';
      case 'live': return '🔴';
      default: return '❓';
    }
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return '--:--';
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return '--:--';
      return format(date, 'HH:mm');
    } catch (error) {
      return '--:--';
    }
  };

  const formatDelay = (delay: number | undefined) => {
    if (!delay || delay <= 0) return null;
    return `${delay > 0 ? '+' : ''}${delay}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* Debug Info - Remove this in production */}
      
      
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 p-4 sm:p-6 md:p-8 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {/* Flight Number and Status Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
                {flight.flightNumber || flight.flight?.iataNumber || flight.flight?.number}
              </h2>
              {flight.live && (
                <div className="flex items-center gap-1 text-xs sm:text-sm">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                  <span className="hidden sm:inline">Live</span>
                </div>
              )}
            </div>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm sm:text-base shadow-lg backdrop-blur-sm ${getStatusColor(flight.status)}`}>
              <span className="text-lg sm:text-xl">{getStatusIcon(flight.status)}</span>
              <span className="capitalize hidden sm:inline">{flight.status}</span>
              <span className="capitalize sm:hidden">{flight.status.slice(0, 4)}</span>
            </div>
          </div>

          {/* Airline Info and Date Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {flight.logoUrl ? (
                <div className="relative">
                  <img 
                    src={flight.logoUrl} 
                    alt={`${flight.airline.name} logo`}
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-white p-2 flex-shrink-0 shadow-lg border-2 border-white/20"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.src.includes('img.wway.io/pics/root')) {
                        const correctedCode = flight.airline.iataCode?.length > 2 ? 
                          flight.flightNumber.match(/^([A-Z]{2}|[0-9][A-Z]|[A-Z][0-9])/i)?.[1] || flight.airline.iataCode :
                          flight.airline.iataCode;
                        img.src = `https://cdn.worldvectorlogo.com/logos/${correctedCode?.toLowerCase()}-1.svg`;
                        img.onerror = () => {
                          img.style.display = 'none';
                        };
                      } else {
                        img.style.display = 'none';
                      }
                    }}
                  />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                  <span className="text-sm sm:text-base font-bold text-white">
                    {(() => {
                      const correctedCode = flight.airline.iataCode?.length > 2 ? 
                        flight.flightNumber.match(/^([A-Z]{2}|[0-9][A-Z]|[A-Z][0-9])/i)?.[1] || flight.airline.iataCode :
                        flight.airline.iataCode;
                      return correctedCode?.charAt(0) || flight.airline.name?.charAt(0) || '?';
                    })()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm sm:text-base md:text-lg font-semibold truncate">
                  {flight.airline.name || 'Unknown Airline'}
                </div>
                <div className="text-xs sm:text-sm text-blue-100">
                  {flight.airline.iataCode ? `(${flight.airline.iataCode})` : ''}
                </div>
              </div>
            </div>
            
            {/* Flight Date */}
            {flight.schedule.departure.scheduledTime && (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex-shrink-0">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">
                  {(() => {
                    try {
                      const date = new Date(flight.schedule.departure.scheduledTime);
                      return isNaN(date.getTime()) ? 'Date unavailable' : format(date, 'MMM dd');
                    } catch (error) {
                      return 'Date unavailable';
                    }
                  })()}
                </span>
              </div>
            )}
          </div>

          {/* Additional Status Indicators */}
          <div className="flex flex-wrap gap-2 text-xs">
            {flight.schedule.arrival.baggage && !flight.schedule.departure.gate && (
              <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full">
                <Luggage className="w-3 h-3" />
                <span className="hidden sm:inline">Arrival</span>
              </div>
            )}
            {isFutureFlight && (
              <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded-full">
                <Calendar className="w-3 h-3" />
                <span className="hidden sm:inline">Future</span>
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
                <MapPin className="w-5 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  {flight.schedule.departure.airportName || flight.schedule.departure.airport}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {flight.schedule.departure.airportCity && flight.schedule.departure.airportCountry 
                    ? `${flight.schedule.departure.airportCity}, ${flight.schedule.departure.airportCountry}`
                    : flight.schedule.departure.airport
                  }
                </div>
                
                {/* Terminal and Gate Info */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {flight.schedule.departure.terminal && (
                    <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                      <Building2 className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium">T{flight.schedule.departure.terminal}</span>
                    </div>
                  )}
                  {flight.schedule.departure.gate && (
                    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg shadow-md border border-blue-400">
                      <DoorOpen className="w-3 h-3" />
                      <span className="text-xs font-bold">Gate {flight.schedule.departure.gate}</span>
                    </div>
                  )}
                  {flight.schedule.departure.runway && (
                    <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                      <Navigation className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium">{flight.schedule.departure.runway}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Flight Times */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-500 dark:text-gray-400">Scheduled:</span>
                <span className="font-medium">{formatTime(flight.schedule.departure.scheduledTime)}</span>
              </div>

              {flight.schedule.departure.estimatedTime && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Estimated:</span>
                  <span className="font-medium text-orange-600">
                    {formatTime(flight.schedule.departure.estimatedTime)}
                  </span>
                </div>
              )}
              {flight.schedule.departure.actualTime && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-400">Actual:</span>
                  <span className="font-medium text-green-600">
                    {formatTime(flight.schedule.departure.actualTime)}
                  </span>
                </div>
              )}
              {formatDelay(flight.schedule.departure.delay) && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Delay:</span>
                  <span className="font-medium text-red-600">
                    {formatDelay(flight.schedule.departure.delay)}
                  </span>
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
              {flight.schedule.departure.airport} → {flight.schedule.arrival.airport}
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
                <MapPin className="w-5 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  {flight.schedule.arrival.airportName || flight.schedule.arrival.airport}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {flight.schedule.arrival.airportCity && flight.schedule.arrival.airportCountry 
                    ? `${flight.schedule.arrival.airportCity}, ${flight.schedule.arrival.airportCountry}`
                    : flight.schedule.arrival.airport
                  }
                </div>
                
                {/* Terminal and Gate Info */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {flight.schedule.arrival.terminal && (
                    <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                      <Building2 className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium">T{flight.schedule.arrival.terminal}</span>
                    </div>
                  )}
                  {flight.schedule.arrival.gate && (
                    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg shadow-md border border-blue-400">
                      <DoorOpen className="w-3 h-3" />
                      <span className="text-xs font-bold">Gate {flight.schedule.arrival.gate}</span>
                    </div>
                  )}
                  {flight.schedule.arrival.baggage && (
                    <div className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md">
                      <Luggage className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-medium">Belt {flight.schedule.arrival.baggage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Flight Times */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-500 dark:text-gray-400">Scheduled:</span>
                <span className="font-medium">{formatTime(flight.schedule.arrival.scheduledTime)}</span>
              </div>

              {flight.schedule.arrival.estimatedTime && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Estimated:</span>
                  <span className="font-medium text-orange-600">
                    {formatTime(flight.schedule.arrival.estimatedTime)}
                  </span>
                </div>
              )}
              {flight.schedule.arrival.actualTime && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Actual:</span>
                  <span className="font-medium text-green-600">
                    {formatTime(flight.schedule.arrival.actualTime)}
                  </span>
                </div>
              )}
              {formatDelay(flight.schedule.arrival.delay) && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Delay:</span>
                  <span className="font-medium text-red-600">
                    {formatDelay(flight.schedule.arrival.delay)}
                </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Aircraft Information */}
      {flight.aircraft?.type && (
        <div className="p-4 sm:p-6 md:p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
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
                    <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Type</span>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{flight.aircraft?.type || 'Unknown'}</div>
                  </div>
                </div>
                {flight.aircraft?.registration && (
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Plane className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Registration</span>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{flight.aircraft.registration}</div>
                    </div>
                  </div>
                )}
                {flight.aircraft?.manufacturer && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">Manufacturer</span>
                      <div className="text-sm sm:text-base">{flight.aircraft.manufacturer}</div>
                    </div>
                  </div>
                )}
                {flight.aircraft?.year && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">Age</span>
                      <div className="text-sm sm:text-base">{new Date().getFullYear() - flight.aircraft.year} years old ({flight.aircraft.year})</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Aircraft Photo */}
            {flight.aircraft?.registration && (
              <div className="flex-shrink-0">
                {photoLoading ? (
                  <div className="w-full md:w-48 h-32 md:h-36 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-md flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : aircraftPhotoUrl ? (
                  <img 
                    src={aircraftPhotoUrl} 
                    alt={`${flight.aircraft?.type || 'Aircraft'} aircraft`}
                    className="w-full md:w-48 h-32 md:h-36 object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full md:w-48 h-32 md:h-36 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <Plane className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No photo available</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save/Unsave Button */}
      <div className="p-4 sm:p-6 md:p-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-end gap-3">
          {isSaved ? (
            <button
              onClick={handleUnsaveFlight}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 rounded-full font-bold text-sm sm:text-base shadow-lg backdrop-blur-sm bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 transition-colors duration-200"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart-off"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M16 6v12"/><path d="M12 6v12"/><path d="M8 6v12"/></svg>
              )}
              <span className="hidden sm:inline">Unsave Flight</span>
              <span className="sm:hidden">Unsave</span>
            </button>
          ) : (
            <button
              onClick={handleSaveFlight}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 rounded-full font-bold text-sm sm:text-base shadow-lg backdrop-blur-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 transition-colors duration-200"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M16 6v12"/><path d="M12 6v12"/><path d="M8 6v12"/></svg>
              )}
              <span className="hidden sm:inline">Save Flight</span>
              <span className="sm:hidden">Save</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightDetailsCard;