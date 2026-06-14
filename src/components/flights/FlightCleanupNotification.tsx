import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Plane, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { SavedFlight } from '../../lib/appwrite';

interface FlightCleanupNotificationProps {
  removedFlight: SavedFlight;
  nextFlight: SavedFlight | null;
  onDismiss?: () => void;
}

const FlightCleanupNotification: React.FC<FlightCleanupNotificationProps> = ({
  removedFlight,
  nextFlight,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
              Flight Tracker Updated
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              20 minutes after arrival
            </p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              onDismiss?.();
            }}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        {/* Removed Flight */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <Plane className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              {removedFlight.flightNumber}
            </span>
            <span className="text-gray-500 dark:text-gray-400">removed from tracker</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {removedFlight.departure.airport} → {removedFlight.arrival.airport}
          </div>
        </div>

        {/* Next Flight */}
        {nextFlight && (
          <>
            <div className="flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-blue-500" />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {nextFlight.flightNumber}
                </span>
                <span className="text-blue-600 dark:text-blue-400">now tracking</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {nextFlight.departure.airport} → {nextFlight.arrival.airport}
              </div>
              {nextFlight.departure.scheduledTime && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Departs: {new Date(nextFlight.departure.scheduledTime).toLocaleString()}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Helper function to show cleanup notification as toast
export const showFlightCleanupToast = (removedFlight: SavedFlight, nextFlight: SavedFlight | null) => {
  toast.custom(
    (t) => (
      <FlightCleanupNotification
        removedFlight={removedFlight}
        nextFlight={nextFlight}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    {
      duration: 10000,
      position: 'bottom-right'
    }
  );
};

export default FlightCleanupNotification;
