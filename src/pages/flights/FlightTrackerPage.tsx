/**
 * Flight Tracker Page
 * Clean and professional flight tracking interface
 */

import React, { useState, useEffect } from 'react';
import FlightTracker from '@/components/flights/FlightTracker';


import { usePinnedFlight } from '@/contexts/PinnedFlightContext';
import PinnedFlightTracker from '@/components/flights/PinnedFlightTracker';
import { Plane } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';

const FlightTrackerPage: React.FC = () => {
  const [pinnedFlightNumber, setPinnedFlightNumber] = useState<string>('');
  
  // Get contexts
  const { pinnedFlight } = usePinnedFlight();

  // Auto-fill pinned flight when it changes
  useEffect(() => {
    if (pinnedFlight) {
      setPinnedFlightNumber(pinnedFlight.flightNumber);
    } else {
      // Clear the flight number when pinned flight is removed
      setPinnedFlightNumber('');
    }
  }, [pinnedFlight]);

  // Note: Auto-updates for non-pinned flights happen every 30 minutes via the context
  // No need to trigger updates when tracker page opens

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead
        title="Flight Tracker - Live Flight Status & Schedules | SkyNeu"
        description="Track flights in real-time with SkyNeu. Get live flight status, schedules, gate changes, and detailed flight information."
        canonical="https://skyneu.com/flight-tracker"
        keywords="flight tracker, live flight status, flight schedules, track flights, skyneu"
      />
      <div className="container mx-auto px-4 py-8">
        {/* Compact Aviation Header */}
        <div className="mb-6">
          <div className="relative">
            {/* Background with subtle patterns */}
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 rounded-2xl blur-2xl opacity-20"></div>
            
            {/* Main header container */}
            <div className="relative bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-6 text-white overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full -translate-y-8 -translate-x-8 sm:-translate-y-12 sm:-translate-x-12"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full translate-y-6 -translate-x-6 sm:translate-y-8 sm:-translate-x-8"></div>
        </div>

              {/* Header content */}
              <div className="relative z-10 text-center space-y-3 sm:space-y-4">
                {/* Icon and title row */}
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-white transform rotate-45" />
                  </div>
                  <div className="text-left">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      Flight Tracker
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-100 text-xs sm:text-sm font-medium">Live Updates</span>
                    </div>
          </div>
            </div>
                
                {/* Description */}
                <p className="text-sm sm:text-base lg:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed px-2">
                  Track flights in real-time with live updates, detailed schedules, and comprehensive flight information.
                </p>
                
                {/* Feature highlights */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full backdrop-blur-sm border border-white/20">
                    <span className="text-sm sm:text-base">✈️</span>
                    <span className="text-xs sm:text-sm font-medium">Real-time</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full backdrop-blur-sm border border-white/20">
                    <span className="text-sm sm:text-base">📅</span>
                    <span className="text-xs sm:text-sm font-medium">Schedules</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full backdrop-blur-sm border border-white/20">
                    <span className="text-sm sm:text-base">🛫</span>
                    <span className="text-xs sm:text-sm font-medium">Details</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full backdrop-blur-sm border border-white/20">
                    <span className="text-sm sm:text-base">🗺️</span>
                    <span className="text-xs sm:text-sm font-medium">Maps</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Flight Tracker Component */}
        <FlightTracker 
          onFlightSelect={() => {}}
          initialFlightNumber={pinnedFlightNumber}
        />

        {/* Pinned Flight Tracker */}
        <PinnedFlightTracker />
      </div>
    </div>
  );
};

export default FlightTrackerPage;