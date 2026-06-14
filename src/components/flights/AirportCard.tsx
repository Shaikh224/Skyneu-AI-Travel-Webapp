import React from 'react';

interface AirportInfo {
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
}

interface AirportCardProps {
  departure: AirportInfo;
  arrival: AirportInfo;
}

const AirportCard: React.FC<AirportCardProps> = ({ departure, arrival }) => {
  const formatTime = (time: string) => {
    if (!time || time === '--:--' || time === 'N/A') return '--:--';
    return time;
  };

  const getTimeColor = (scheduled: string, actual?: string, estimated?: string) => {
    if (!actual && !estimated) return 'text-gray-600 dark:text-gray-400';
    if (actual && actual !== scheduled) return 'text-red-600 dark:text-red-400';
    if (estimated && estimated !== scheduled) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getDelayIcon = (scheduled: string, actual?: string, estimated?: string) => {
    if (!actual && !estimated) return null;
    if (actual && actual !== scheduled) return '⚠️';
    if (estimated && estimated !== scheduled) return '⏰';
    return null;
  };

  const renderAirportSection = (airport: AirportInfo, type: 'departure' | 'arrival') => (
    <div className="flex-1">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">
          {type === 'departure' ? '🛫' : '🛬'}
        </div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 capitalize">
          {type}
        </h3>
      </div>

      {/* Airport Details */}
      <div className="space-y-3">
        <div className="text-center">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {airport.airport}
          </h4>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {airport.iataCode}
            </span>
            {airport.icaoCode && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({airport.icaoCode})
              </span>
            )}
          </div>
          {(airport.city || airport.country) && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {airport.city && airport.city !== 'Unknown City' ? airport.city : ''}
              {airport.city && airport.city !== 'Unknown City' && airport.country && airport.country !== 'Unknown' ? ', ' : ''}
              {airport.country && airport.country !== 'Unknown' ? airport.country : ''}
            </p>
          )}
        </div>

        {/* Times */}
        <div className="space-y-2">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Scheduled</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatTime(airport.scheduledTime)}
            </p>
          </div>

          {airport.estimatedTime && (
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estimated</p>
              <p className={`text-sm font-medium ${getTimeColor(airport.scheduledTime, undefined, airport.estimatedTime)}`}>
                {formatTime(airport.estimatedTime)}
                {getDelayIcon(airport.scheduledTime, undefined, airport.estimatedTime)}
              </p>
            </div>
          )}

          {airport.actualTime && (
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Actual</p>
              <p className={`text-sm font-medium ${getTimeColor(airport.scheduledTime, airport.actualTime)}`}>
                {formatTime(airport.actualTime)}
                {getDelayIcon(airport.scheduledTime, airport.actualTime)}
              </p>
            </div>
          )}
        </div>

        {/* Terminal, Gate, Runway */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Terminal</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {airport.terminal && airport.terminal !== 'TBD' ? airport.terminal : '–'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gate</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {airport.gate && airport.gate !== 'TBD' ? airport.gate : '–'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Runway</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {airport.runway && airport.runway !== 'TBD' ? airport.runway : '–'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex space-x-8">
        {renderAirportSection(departure, 'departure')}
        
        {/* Route Line */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-0.5 h-32 bg-gradient-to-b from-blue-500 to-purple-600"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full -mt-2"></div>
          <div className="w-0.5 h-32 bg-gradient-to-b from-purple-600 to-blue-500"></div>
        </div>
        
        {renderAirportSection(arrival, 'arrival')}
      </div>
    </div>
  );
};

export default AirportCard;
