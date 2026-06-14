import React, { useState } from 'react';
import { Settings, Calendar, Plane, CheckCircle, XCircle, Clock, MapPin, Archive } from 'lucide-react';
import { Trip } from '../../types/trip';
import { tripService } from '../../services/tripService';
import toast from 'react-hot-toast';

interface TripStatusManagerProps {
  trip: Trip;
  userRole?: string;
  onRefresh?: () => void;
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onStatusUpdate?: (newStatus: Trip['status']) => void;
}

const TripStatusManager: React.FC<TripStatusManagerProps> = ({ 
  trip, 
  userRole = 'viewer', 
  onRefresh, 
  isModal = false,
  isOpen = false,
  onClose,
  onStatusUpdate
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const canManageStatus = ['owner', 'admin', 'co-admin'].includes(userRole);

  const statusConfig = {
    planning: {
      icon: <Settings className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      borderColor: 'border-blue-200 dark:border-blue-800',
      description: 'Trip is being planned and organized'
    },
    confirmed: {
      icon: <Calendar className="h-4 w-4" />,
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      borderColor: 'border-green-200 dark:border-green-800',
      description: 'Trip is confirmed and ready to go'
    },
    active: {
      icon: <Plane className="h-4 w-4" />,
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      borderColor: 'border-orange-200 dark:border-orange-800',
      description: 'Currently on trip'
    },
    completed: {
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      borderColor: 'border-purple-200 dark:border-purple-800',
      description: 'Trip has been completed'
    },
    cancelled: {
      icon: <XCircle className="h-4 w-4" />,
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      borderColor: 'border-red-200 dark:border-red-800',
      description: 'Trip has been cancelled'
    },
    over: {
      icon: <Archive className="h-4 w-4" />,
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
      borderColor: 'border-slate-200 dark:border-slate-800',
      description: 'Trip has ended'
    }
  };

  const handleStatusChange = async (newStatus: Trip['status']) => {
    if (!canManageStatus || !trip.$id || !newStatus) return;

    try {
      setUpdating(true);
      await tripService.updateTrip(trip.$id, { status: newStatus });
      toast.success(`Trip status updated to ${newStatus}`);
      
      if (onStatusUpdate) {
        onStatusUpdate(newStatus);
      }
      
      if (onRefresh) {
        onRefresh();
      }
      
      if (onClose) {
        onClose();
      }
      
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update trip status');
    } finally {
      setUpdating(false);
    }
  };

  const currentStatus = trip.status || 'planning';
  const currentConfig = statusConfig[currentStatus];

  // If used as modal and not open, return null
  if (isModal && !isOpen) return null;

  const content = (
    <>
      <div className="flex items-center gap-2">
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${currentConfig.color} ${currentConfig.borderColor} flex items-center gap-1`}>
          {currentConfig.icon}
          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </div>
        
        {canManageStatus && (
          <button
            onClick={() => setShowStatusModal(true)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Change Status"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Update Trip Status
              </h3>
              
              <div className="space-y-3">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status as Trip['status'])}
                    disabled={updating || status === currentStatus}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      status === currentStatus 
                        ? `${config.color} ${config.borderColor} ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-dark-surface`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-dark-bg hover:bg-gray-50 dark:hover:bg-gray-800'
                    } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        {config.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white capitalize">
                          {status}
                          {status === currentStatus && (
                            <span className="ml-2 text-xs text-gray-500">(Current)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {config.description}
                        </div>
                        {status === 'active' && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Live trip mode - real-time updates
                          </div>
                        )}
                        {status === 'completed' && (
                          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Generates trip summary & memories
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // If used as modal, wrap with modal container
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Trip Status Manager</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
};

export default TripStatusManager;
