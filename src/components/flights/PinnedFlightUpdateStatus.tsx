import React from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useFlightUpdaterContext } from '../../contexts/FlightUpdaterContext';

interface PinnedFlightUpdateStatusProps {
  selectedFlightId: string | null;
  onUpdateSelectedFlight: (flightId: string) => void;
  className?: string;
}

const PinnedFlightUpdateStatus: React.FC<PinnedFlightUpdateStatusProps> = ({
  selectedFlightId,
  onUpdateSelectedFlight,
  className = ''
}) => {
  const { 
    isUpdating, 
    lastUpdateTime, 
    hasAutoUpdates 
  } = useFlightUpdaterContext();

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

  const handleUpdate = () => {
    if (selectedFlightId && !isUpdating) {
      onUpdateSelectedFlight(selectedFlightId);
    }
  };

  // Don't show if no flight is selected
  if (!selectedFlightId) {
    return null;
  }

  return (
    <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl p-3 min-w-[280px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isUpdating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            ) : hasAutoUpdates ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Clock className="w-4 h-4 text-gray-400" />
            )}
            
            <div className="text-xs">
              <div className={`font-medium ${
                isUpdating ? 'text-blue-600 dark:text-blue-400' :
                hasAutoUpdates ? 'text-green-600 dark:text-green-400' :
                'text-gray-500 dark:text-gray-400'
              }`}>
                {isUpdating ? 'Updating...' : 'Flight Tracker'}
              </div>
              {lastUpdateTime && !isUpdating && (
                <div className="text-gray-400 dark:text-gray-500">
                  Updated {formatLastUpdate(lastUpdateTime)}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinnedFlightUpdateStatus;
