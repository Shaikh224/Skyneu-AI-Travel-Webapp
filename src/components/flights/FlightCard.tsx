import React from 'react';

interface FlightCardProps {
  flightNumber: string;
  airlineName: string;
  airlineLogo?: string;
  airlineCountry?: string;
  status: string;
  statusColor?: string;
  dataQuality?: string;
  confidenceScore?: number;
}

const FlightCard: React.FC<FlightCardProps> = ({
  flightNumber,
  airlineName,
  airlineLogo,
  airlineCountry,
  status,
  dataQuality,
  confidenceScore
}) => {
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    let badgeColor = 'bg-gray-500';
    let statusIcon = '✈️';
    
    if (statusLower.includes('landed') || statusLower.includes('arrived')) {
      badgeColor = 'bg-green-500';
      statusIcon = '🟢';
    } else if (statusLower.includes('delayed') || statusLower.includes('late')) {
      badgeColor = 'bg-orange-500';
      statusIcon = '🟡';
    } else if (statusLower.includes('cancelled') || statusLower.includes('cancelled')) {
      badgeColor = 'bg-red-500';
      statusIcon = '🔴';
    } else if (statusLower.includes('active') || statusLower.includes('en-route')) {
      badgeColor = 'bg-blue-500';
      statusIcon = '🔵';
    } else if (statusLower.includes('scheduled')) {
      badgeColor = 'bg-purple-500';
      statusIcon = '🟣';
    }
    
    return { badgeColor, statusIcon };
  };

  const { badgeColor, statusIcon } = getStatusBadge(status);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        {/* Airline Logo */}
        <div className="flex-shrink-0">
          {airlineLogo ? (
            <img 
              src={airlineLogo} 
              alt={`${airlineName} logo`}
              className="w-16 h-16 object-contain rounded-lg bg-gray-50 dark:bg-gray-700 p-2"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {airlineName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Flight Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {flightNumber}
            </h1>
            <span className={`${badgeColor} text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1`}>
              <span>{statusIcon}</span>
              <span>{status}</span>
            </span>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {airlineName}
            </h2>
            {airlineCountry && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {airlineCountry}
              </p>
            )}
            
            {/* Data Quality Indicator */}
            {dataQuality && (
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Data Quality:</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  dataQuality === 'HIGH' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                  dataQuality === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                  dataQuality === 'LOW' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                  'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }`}>
                  {dataQuality}
                </span>
                {confidenceScore && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({Math.round(confidenceScore * 100)}% confidence)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightCard;
