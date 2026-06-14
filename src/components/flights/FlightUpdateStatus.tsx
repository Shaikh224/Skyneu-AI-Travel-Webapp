import React from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { FlightUpdateProgress } from '../../services/flightUpdater';

interface FlightUpdateStatusProps {
  isUpdating: boolean;
  progress: FlightUpdateProgress | null;
  lastUpdateTime: Date | null;
  hasAutoUpdates: boolean;
  onManualUpdate?: () => void;
  className?: string;
}

const FlightUpdateStatus: React.FC<FlightUpdateStatusProps> = ({
  isUpdating,
  progress,
  lastUpdateTime,
  hasAutoUpdates,
  onManualUpdate,
  className = ''
}) => {
  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusIcon = () => {
    if (isUpdating) {
      return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
    }
    
    if (hasAutoUpdates) {
      return <Wifi className="w-4 h-4 text-green-500" />;
    }
    
    return <WifiOff className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isUpdating) {
      if (progress) {
        return `Updating ${progress.current} (${progress.completed}/${progress.total})`;
      }
      return 'Updating flights...';
    }
    
    if (hasAutoUpdates) {
      return 'Auto-updates enabled';
    }
    
    return 'Auto-updates disabled';
  };

  const getStatusColor = () => {
    if (isUpdating) return 'text-blue-600 dark:text-blue-400';
    if (hasAutoUpdates) return 'text-green-600 dark:text-green-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <div className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </div>
            {lastUpdateTime && !isUpdating && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last updated: {formatLastUpdate(lastUpdateTime)}
              </div>
            )}
          </div>
        </div>
        
        {onManualUpdate && (
          <button
            onClick={onManualUpdate}
            disabled={isUpdating}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            Update Now
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {progress && progress.total > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{progress.completed}/{progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results Summary */}
      {progress && progress.results.length > 0 && (
        <div className="mt-3 space-y-1">
          {progress.results.map((result, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              {result.success ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <XCircle className="w-3 h-3 text-red-500" />
              )}
              <span className="text-gray-600 dark:text-gray-400">
                {result.flightNumber}: {result.success ? 'Updated' : result.error}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlightUpdateStatus;
