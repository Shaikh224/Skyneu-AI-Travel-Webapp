/**
 * Public Shared Flight Page
 * Displays real-time flight status for shared links
 */

import React from 'react';
import { Plane, MapPin, Clock, Wifi, WifiOff, User, Armchair, RefreshCw, MessageCircle } from 'lucide-react';
import { useSharedFlight } from '@/hooks/useSharedFlight';

const SharedFlightPage: React.FC = () => {
  // Extract slug from URL path
  const slug = window.location.pathname.replace('/s/', '');
  const { flightData, loading, error, lastUpdated, refetch } = useSharedFlight(slug);

  if (loading && !flightData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Plane className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading Flight Status
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Fetching real-time flight information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {error.includes('expired') || error.includes('revoked') ? 'Link Expired' : 'Connection Error'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            {!error.includes('expired') && !error.includes('revoked') && (
              <button
                onClick={refetch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!flightData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Flight Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This flight link may have expired or been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('on time') || normalizedStatus.includes('scheduled')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    } else if (normalizedStatus.includes('delayed')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    } else if (normalizedStatus.includes('cancelled') || normalizedStatus.includes('canceled')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    } else if (normalizedStatus.includes('boarding') || normalizedStatus.includes('departed')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    } else if (normalizedStatus.includes('arrived') || normalizedStatus.includes('landed')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    try {
      return new Date(timeString).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Plane className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Live Flight Status
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time tracking for {flightData.flightNumber}
          </p>
        </div>

        {/* Main Flight Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Flight Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">{flightData.flightNumber}</h2>
                <p className="text-blue-100">
                  {flightData.route.departure.city || flightData.route.departure.airport} → {flightData.route.arrival.city || flightData.route.arrival.airport}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(flightData.status)}`}>
                  {flightData.status}
                </span>
              </div>
            </div>
          </div>

          {/* Flight Details */}
          <div className="p-6">
            {/* Custom Message */}
            {flightData.customMessage && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Personal Message
                    </h4>
                    <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                      {flightData.customMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Departure */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Departure</h3>
                </div>
                <div className="space-y-2 ml-10">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {flightData.route.departure.airport}
                    </p>
                    {flightData.route.departure.city && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {flightData.route.departure.city}
                        {flightData.route.departure.country && `, ${flightData.route.departure.country}`}
                      </p>
                    )}
                  </div>
                  {(flightData.route.departure.estimatedTime || flightData.route.departure.actualTime || flightData.route.departure.scheduledTime) && (
                    <div className="space-y-1">
                      {flightData.route.departure.actualTime && (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-green-500" />
                          <span className="text-gray-900 dark:text-white font-medium">
                            Actual: {formatTime(flightData.route.departure.actualTime)}
                          </span>
                        </div>
                      )}
                      {flightData.route.departure.estimatedTime && !flightData.route.departure.actualTime && (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-gray-900 dark:text-white font-medium">
                            Estimated: {formatTime(flightData.route.departure.estimatedTime)}
                          </span>
                        </div>
                      )}
                      {flightData.route.departure.scheduledTime && (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Scheduled: {formatTime(flightData.route.departure.scheduledTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {flightData.route.departure.gate && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gate: <span className="font-medium">{flightData.route.departure.gate}</span>
                    </p>
                  )}
                  {flightData.route.departure.terminal && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Terminal: <span className="font-medium">{flightData.route.departure.terminal}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Arrival */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Arrival</h3>
                </div>
                <div className="space-y-2 ml-10">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {flightData.route.arrival.airport}
                    </p>
                    {flightData.route.arrival.city && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {flightData.route.arrival.city}
                        {flightData.route.arrival.country && `, ${flightData.route.arrival.country}`}
                      </p>
                    )}
                  </div>
                  {(flightData.route.arrival.estimatedTime || flightData.route.arrival.actualTime || flightData.route.arrival.scheduledTime) && (
                    <div className="space-y-1">
                      {flightData.route.arrival.actualTime && (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-green-500" />
                          <span className="text-gray-900 dark:text-white font-medium">
                            Actual: {formatTime(flightData.route.arrival.actualTime)}
                          </span>
                        </div>
                      )}
                      {flightData.route.arrival.estimatedTime && !flightData.route.arrival.actualTime && (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-gray-900 dark:text-white font-medium">
                            Estimated: {formatTime(flightData.route.arrival.estimatedTime)}
                          </span>
                        </div>
                      )}
                      {flightData.route.arrival.scheduledTime && (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Scheduled: {formatTime(flightData.route.arrival.scheduledTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {flightData.route.arrival.gate && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gate: <span className="font-medium">{flightData.route.arrival.gate}</span>
                    </p>
                  )}
                  {flightData.route.arrival.terminal && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Terminal: <span className="font-medium">{flightData.route.arrival.terminal}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Passenger Info (if allowed) */}
            {(flightData.passengerInitials || flightData.seat) && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Passenger Information</h3>
                <div className="flex items-center gap-4 text-sm">
                  {flightData.passengerInitials && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white font-medium">
                        {flightData.passengerInitials}
                      </span>
                    </div>
                  )}
                  {flightData.seat && (
                    <div className="flex items-center gap-2">
                      <Armchair className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white font-medium">
                        Seat {flightData.seat}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Footer */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Wifi className="w-4 h-4 text-green-500" />
              <span>Live updates every 60 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refetch}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {lastUpdated && (
                <span className="text-gray-500 dark:text-gray-500">
                  Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Brand */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            <span className="font-semibold">Skynfull</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedFlightPage;
