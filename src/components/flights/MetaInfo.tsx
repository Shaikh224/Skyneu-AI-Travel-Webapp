import React from 'react';

interface MetaInfoProps {
  dataSources: string[];
  lastUpdated: string;
  reliability: 'LOW' | 'MEDIUM' | 'HIGH';
  flightId?: string;
  callsign?: string;
}

const MetaInfo: React.FC<MetaInfoProps> = ({
  dataSources,
  lastUpdated,
  reliability,
  flightId,
  callsign
}) => {
  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'HIGH':
        return 'bg-green-500 text-green-100';
      case 'MEDIUM':
        return 'bg-yellow-500 text-yellow-100';
      case 'LOW':
        return 'bg-red-500 text-red-100';
      default:
        return 'bg-gray-500 text-gray-100';
    }
  };

  const getReliabilityIcon = (reliability: string) => {
    switch (reliability) {
      case 'HIGH':
        return '✅';
      case 'MEDIUM':
        return '⚠️';
      case 'LOW':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatLastUpdated = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return timestamp;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4 mb-6">
        <div className="text-4xl">ℹ️</div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Flight Metadata
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Data sources and reliability information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Sources & Reliability */}
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Data Sources</p>
            <div className="flex flex-wrap gap-2">
              {dataSources.map((source, index) => (
                <span
                  key={index}
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-medium"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Data Reliability</p>
            <span className={`${getReliabilityColor(reliability)} px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 w-fit`}>
              <span>{getReliabilityIcon(reliability)}</span>
              <span>{reliability}</span>
            </span>
          </div>

          {flightId && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">FR24 Flight ID</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">
                {flightId}
              </p>
            </div>
          )}

          {callsign && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Callsign</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">
                {callsign}
              </p>
            </div>
          )}
        </div>

        {/* Last Updated & Actions */}
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatLastUpdated(lastUpdated)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {lastUpdated}
            </p>
          </div>

          <div className="space-y-2">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
              <span>🔄</span>
              <span>Refresh Data</span>
            </button>
            
            <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
              <span>📊</span>
              <span>View on FR24</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Data accuracy depends on real-time updates from multiple aviation sources. 
          Times are displayed in local airport timezones where available.
        </p>
      </div>
    </div>
  );
};

export default MetaInfo;
