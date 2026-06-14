import React from 'react';
import { RefreshCw, CheckCircle, Clock, Plane } from 'lucide-react';
import { usePinnedFlight } from '../../contexts/PinnedFlightContext';
import { useSafeFlightUpdater } from '../../hooks/useSafeFlightUpdater';
import unifiedFlightTracker from '../../services/flightTracking/unifiedFlightTracker';
import { flightService } from '../../lib/appwrite';
import toast from 'react-hot-toast';

const PinnedFlightTracker: React.FC = () => {
  const { pinnedFlight, setPinnedFlight } = usePinnedFlight();
  const { updateSelectedFlight, isUpdating: contextIsUpdating } = useSafeFlightUpdater();
  
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [lastUpdateTime, setLastUpdateTime] = React.useState<Date | null>(null);

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

  const handleUpdatePinnedFlight = async () => {
    if (!pinnedFlight || isUpdating || contextIsUpdating) return;

    setIsUpdating(true);
    try {
      // Use the flight updater service to update the pinned flight
      const result = await updateSelectedFlight(pinnedFlight.$id!);
      
      if (result.success) {
        setLastUpdateTime(new Date());
        toast.success(`Updated flight ${pinnedFlight.flightNumber}`);
      } else {
        toast.error(`Failed to update flight: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating pinned flight:', error);
      toast.error('Failed to update flight');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!pinnedFlight) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl p-3 min-w-[320px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-blue-500" />
              <div className="text-xs">
                <div className="font-medium text-gray-900 dark:text-white">
                  {pinnedFlight.flightNumber}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {pinnedFlight.airline.name}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {(isUpdating || contextIsUpdating) ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              
              <div className="text-xs">
                <div className={`font-medium ${
                  (isUpdating || contextIsUpdating) ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {(isUpdating || contextIsUpdating) ? 'Updating...' : 'Pinned'}
                </div>
                {lastUpdateTime && !isUpdating && (
                  <div className="text-gray-400 dark:text-gray-500">
                    Updated {formatLastUpdate(lastUpdateTime)}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleUpdatePinnedFlight}
            disabled={isUpdating || contextIsUpdating}
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

export default PinnedFlightTracker;
