/**
 * Flight Timeline Component
 * Displays flight events in a timeline format
 */

import React from 'react';
import { Clock, MapPin, Plane, Navigation, CheckCircle, AlertCircle } from 'lucide-react';
import { FR24FlightEvent } from '@/services/flightTracking/fr24Service';
import { format } from 'date-fns';

interface FlightTimelineProps {
  events: FR24FlightEvent[];
}

const FlightTimeline: React.FC<FlightTimelineProps> = ({ events }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'gate_departure':
        return <MapPin className="w-5 h-5" />;
      case 'takeoff':
        return <Plane className="w-5 h-5" />;
      case 'cruising':
        return <Navigation className="w-5 h-5" />;
      case 'airspace_transition':
        return <AlertCircle className="w-5 h-5" />;
      case 'descent':
        return <Plane className="w-5 h-5 rotate-45" />;
      case 'landed':
        return <Plane className="w-5 h-5 rotate-90" />;
      case 'gate_arrival':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'gate_departure':
        return 'bg-blue-500';
      case 'takeoff':
        return 'bg-indigo-500';
      case 'cruising':
        return 'bg-sky-500';
      case 'airspace_transition':
        return 'bg-yellow-500';
      case 'descent':
        return 'bg-orange-500';
      case 'landed':
        return 'bg-green-500';
      case 'gate_arrival':
        return 'bg-green-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventTitle = (type: string) => {
    switch (type) {
      case 'gate_departure':
        return 'Gate Departure';
      case 'takeoff':
        return 'Takeoff';
      case 'cruising':
        return 'Cruising';
      case 'airspace_transition':
        return 'Airspace Transition';
      case 'descent':
        return 'Descent';
      case 'landed':
        return 'Landed';
      case 'gate_arrival':
        return 'Gate Arrival';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    }
  };

  const formatEventTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm:ss');
    } catch {
      return '--:--:--';
    }
  };

  const formatEventDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy');
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Flight Timeline
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        {/* Events */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="relative flex items-start gap-4">
              {/* Event marker */}
              <div className={`relative z-10 w-12 h-12 rounded-full ${getEventColor(event.type)} flex items-center justify-center text-white shadow-lg`}>
                {getEventIcon(event.type)}
              </div>

              {/* Event content */}
              <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {getEventTitle(event.type)}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span>{formatEventTime(event.timestamp)}</span>
                      <span>{formatEventDate(event.timestamp)}</span>
                    </div>
                  </div>
                  
                  {/* Position data if available */}
                  {(event.lat !== undefined && event.lon !== undefined) && (
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      {event.alt && <div>Alt: {event.alt.toLocaleString()} ft</div>}
                      {event.gspeed && <div>Speed: {event.gspeed} kts</div>}
                    </div>
                  )}
                </div>

                {/* Event details */}
                {event.details && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {event.details.takeoff_runway && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Runway:</span>
                          <span className="font-medium">{event.details.takeoff_runway}</span>
                        </div>
                      )}
                      {event.details.landed_runway && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Runway:</span>
                          <span className="font-medium">{event.details.landed_runway}</span>
                        </div>
                      )}
                      {event.details.landed_icao && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Airport:</span>
                          <span className="font-medium">{event.details.landed_icao}</span>
                        </div>
                      )}
                      {event.details.gate_ident && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Gate:</span>
                          <span className="font-medium">{event.details.gate_ident}</span>
                        </div>
                      )}
                      {event.details.exited_airspace && event.details.entered_airspace && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">From:</span>
                            <span className="font-medium">{event.details.exited_airspace}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">To:</span>
                            <span className="font-medium">{event.details.entered_airspace}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* If no events */}
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No timeline events available for this flight
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightTimeline;
