import React from 'react';

interface RouteInfo {
  distance?: string;
  duration?: string;
  progress?: number;
  firstSeen?: string;
  lastSeen?: string;
  category?: string;
}

interface RouteProgressProps {
  route: RouteInfo;
  departureIata: string;
  arrivalIata: string;
}

const RouteProgress: React.FC<RouteProgressProps> = ({ route, departureIata, arrivalIata }) => {
  const getCategoryIcon = (category?: string) => {
    if (!category) return '✈️';
    const cat = category.toLowerCase();
    if (cat.includes('passenger')) return '👥';
    if (cat.includes('cargo')) return '📦';
    if (cat.includes('military')) return '🎖️';
    if (cat.includes('private')) return '🏠';
    if (cat.includes('charter')) return '🎫';
    return '✈️';
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-blue-500';
    const cat = category.toLowerCase();
    if (cat.includes('passenger')) return 'bg-green-500';
    if (cat.includes('cargo')) return 'bg-orange-500';
    if (cat.includes('military')) return 'bg-red-500';
    if (cat.includes('private')) return 'bg-purple-500';
    if (cat.includes('charter')) return 'bg-indigo-500';
    return 'bg-blue-500';
  };

  const formatProgress = (progress?: number) => {
    if (!progress || progress < 0) return 0;
    if (progress > 100) return 100;
    return progress;
  };

  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-orange-500';
    if (progress < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4 mb-6">
        <div className="text-4xl">🗺️</div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Route & Progress
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Flight path and journey details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Route Information */}
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Route</p>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {departureIata}
              </span>
              <span className="text-gray-400">→</span>
              <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {arrivalIata}
              </span>
            </div>
          </div>

          {route.distance && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Distance</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {route.distance}
              </p>
            </div>
          )}

          {route.duration && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {route.duration}
              </p>
            </div>
          )}

          {route.category && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Category</p>
              <span className={`${getCategoryColor(route.category)} text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 w-fit`}>
                <span>{getCategoryIcon(route.category)}</span>
                <span>{route.category}</span>
              </span>
            </div>
          )}
        </div>

        {/* Progress & Timeline */}
        <div className="space-y-4">
          {/* Progress Bar */}
          {route.progress !== undefined && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Flight Progress</p>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formatProgress(route.progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(formatProgress(route.progress))}`}
                  style={{ width: `${formatProgress(route.progress)}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            {route.firstSeen && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">First Seen</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {route.firstSeen}
                </p>
              </div>
            )}

            {route.lastSeen && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Seen</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {route.lastSeen}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mini Map Placeholder */}
      <div className="mt-6">
        <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-2">🗺️</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Flight Path Visualization
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {departureIata} → {arrivalIata}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
              (Map integration available)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteProgress;
