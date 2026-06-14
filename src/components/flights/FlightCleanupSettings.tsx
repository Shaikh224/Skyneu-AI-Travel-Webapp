import React, { useState, useEffect } from 'react';
import { Settings, Clock, Trash2, RotateCcw, CheckCircle } from 'lucide-react';
import { useFlightCleanup } from '../../hooks/useFlightCleanup';
import { FlightCleanupConfig } from '../../services/flightCleanupService';
import toast from 'react-hot-toast';

interface FlightCleanupSettingsProps {
  className?: string;
}

const FlightCleanupSettings: React.FC<FlightCleanupSettingsProps> = ({ className = '' }) => {
  const [config, setConfig] = useState<FlightCleanupConfig>({
    arrivalCleanupDelayMinutes: 20,
    enableAutoCleanup: true,
    enableNextFlightScheduling: true,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { 
    cleanupArrivedFlights, 
    getCleanupStatus,
    config: currentConfig 
  } = useFlightCleanup({ config });

  // Load current configuration
  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  const handleConfigChange = (key: keyof FlightCleanupConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleManualCleanup = async () => {
    setIsLoading(true);
    try {
      const result = await cleanupArrivedFlights();
      
      if (result.error) {
        toast.error(`Tracker cleanup failed: ${result.error}`);
      } else if (result.removedFlights.length > 0) {
        toast.success(`Removed ${result.removedFlights.length} arrived flights from tracker`);
        if (result.nextFlightScheduled) {
          toast.success(`Next flight scheduled: ${result.nextFlightScheduled.flightNumber}`);
        }
      } else {
        toast.success('No arrived flights found in tracker to cleanup');
      }
    } catch (error) {
      console.error('Manual cleanup error:', error);
      toast.error('Cleanup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const status = getCleanupStatus();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors ${className}`}
        title="Flight Cleanup Settings"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Auto-Cleanup</span>
        {status.pendingCleanups > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
            {status.pendingCleanups}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-4 min-w-[320px] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Flight Auto-Cleanup</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ×
        </button>
      </div>

      {/* Status */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="font-medium text-gray-900 dark:text-white">Status</span>
        </div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          {status.pendingCleanups > 0 
            ? `${status.pendingCleanups} flights scheduled for cleanup`
            : 'No pending cleanups'
          }
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        {/* Enable Auto-Cleanup */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Auto-Remove from Tracker
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableAutoCleanup}
              onChange={(e) => handleConfigChange('enableAutoCleanup', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        {/* Cleanup Delay */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Remove After
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="120"
              value={config.arrivalCleanupDelayMinutes}
              onChange={(e) => handleConfigChange('arrivalCleanupDelayMinutes', parseInt(e.target.value))}
              className="w-16 px-2 py-1 text-sm text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={!config.enableAutoCleanup}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">min</span>
          </div>
        </div>

        {/* Auto-Schedule Next */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Auto-Schedule Next
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableNextFlightScheduling}
              onChange={(e) => handleConfigChange('enableNextFlightScheduling', e.target.checked)}
              className="sr-only peer"
              disabled={!config.enableAutoCleanup}
            />
            <div className={`w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 ${!config.enableAutoCleanup ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
          </label>
        </div>
      </div>

      {/* Manual Cleanup Button */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleManualCleanup}
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 rounded-lg transition-colors"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Removing from tracker...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Remove from Tracker
            </>
          )}
        </button>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Remove arrived flights from tracker (keeps in saved flights)
        </p>
      </div>
    </div>
  );
};

export default FlightCleanupSettings;
