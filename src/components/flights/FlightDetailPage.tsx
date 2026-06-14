import React from 'react';
import FlightCard from './FlightCard';
import AirportCard from './AirportCard';
import AircraftCard from './AircraftCard';
import RouteProgress from './RouteProgress';

interface FlightDetailData {
  flightNumber: string;
  airlineName: string;
  airlineLogo?: string;
  airlineCountry?: string;
  status: string;
  dataQuality?: string;
  confidenceScore?: number;
  departure: {
    airport: string;
    iataCode: string;
    icaoCode?: string;
    city?: string;
    country?: string;
    terminal?: string;
    gate?: string;
    runway?: string;
    scheduledTime: string;
    estimatedTime?: string;
    actualTime?: string;
    status?: string;
  };
  arrival: {
    airport: string;
    iataCode: string;
    icaoCode?: string;
    city?: string;
    country?: string;
    terminal?: string;
    gate?: string;
    runway?: string;
    scheduledTime: string;
    estimatedTime?: string;
    actualTime?: string;
    status?: string;
  };
  aircraft: {
    type: string;
    manufacturer?: string;
    registration?: string;
    hexCode?: string;
    iataCode?: string;
    icaoCode?: string;
    source?: string;
    age?: string;
    msn?: string;
    firstFlight?: string;
  };
  route: {
    distance?: string;
    duration?: string;
    progress?: number;
    firstSeen?: string;
    lastSeen?: string;
    category?: string;
  };
}

interface FlightDetailPageProps {
  flightData: FlightDetailData;
  onRefresh?: () => void;
}

const FlightDetailPage: React.FC<FlightDetailPageProps> = ({
  flightData,
  onRefresh
}) => {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-8 mt-4 sm:mt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Flight Details
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive flight information and tracking
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>

            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-6">
          {/* Top Card - Hero Section */}
          <FlightCard
            flightNumber={flightData.flightNumber}
            airlineName={flightData.airlineName}
            airlineLogo={flightData.airlineLogo}
            airlineCountry={flightData.airlineCountry}
            status={flightData.status}
            dataQuality={flightData.dataQuality}
            confidenceScore={flightData.confidenceScore}
          />

          {/* Two Columns: Departure | Arrival */}
          <AirportCard
            departure={flightData.departure}
            arrival={flightData.arrival}
          />

          {/* Aircraft Details Card */}
          <AircraftCard aircraft={flightData.aircraft} />

          {/* Route / Map Section */}
          <RouteProgress
            route={flightData.route}
            departureIata={flightData.departure.iataCode}
            arrivalIata={flightData.arrival.iataCode}
          />


        </div>

        {/* Additional Information Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-6">
            <div className="text-4xl">📋</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Additional Information
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Extended flight details and notes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Flight Notes */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Flight Notes</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Real-time tracking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500">📡</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">ADS-B data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-500">🛫</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Flight plan data</span>
                </div>
              </div>
            </div>

            {/* Weather Conditions */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Weather</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-500">🌤️</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Good visibility</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500">💨</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Light winds</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">🌡️</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Standard conditions</span>
                </div>
              </div>
            </div>

            {/* Technical Status */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Technical Status</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">🟢</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">All systems normal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500">📡</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Transponder active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-purple-500">🛰️</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">GPS tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDetailPage;
