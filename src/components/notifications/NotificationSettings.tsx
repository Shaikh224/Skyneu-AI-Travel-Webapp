import React, { useState, useEffect } from 'react';
import { Bell, Plane, MapPin, FileText, Settings, Save, AlertTriangle } from 'lucide-react';
import { NotificationPreferences } from '@/types/notification';

interface NotificationSettingsProps {
  preferences: NotificationPreferences | null;
  onUpdatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  loading?: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  preferences,
  onUpdatePreferences,
  loading = false
}) => {
  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferences>>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  useEffect(() => {
    if (preferences) {
      const hasChanges = Object.keys(localPreferences).some(key => 
        localPreferences[key as keyof NotificationPreferences] !== preferences[key as keyof NotificationPreferences]
      );
      setHasChanges(hasChanges);
    }
  }, [localPreferences, preferences]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };


  const handleSave = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    try {
      console.log('🔔 Saving notification preferences:', localPreferences);
      await onUpdatePreferences(localPreferences);
      setHasChanges(false);
      console.log('✅ Notification preferences saved successfully');
    } catch (error) {
      console.error('❌ Error saving notification preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Bell className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notification Settings</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Customize your notification preferences</p>
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-200">You have unsaved changes</span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Flight Notifications */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Plane className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Flight Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Flight Delays</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Get notified when your flights are delayed</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.flightDelays || false}
                  onChange={() => handleToggle('flightDelays')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {localPreferences.flightDelays && (
              <div className="ml-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Delay Threshold:</strong> 15 minutes (fixed)
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Only notify for delays longer than 15 minutes
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Gate Changes</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Get notified when departure or arrival gates change</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.gateChanges || false}
                  onChange={() => handleToggle('gateChanges')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Status Changes</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Get notified when flight status changes (departed, arrived, etc.)</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.statusChanges || false}
                  onChange={() => handleToggle('statusChanges')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Cancellations</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Get notified when flights are cancelled</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.cancellations || false}
                  onChange={() => handleToggle('cancellations')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Trip Notifications */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trip Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Trip Reminders</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Get reminded before your trips</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.tripReminders || false}
                  onChange={() => handleToggle('tripReminders')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {localPreferences.tripReminders && (
              <div className="ml-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Reminder Time:</strong> 24 hours before trip (fixed)
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You'll be reminded 24 hours before your trip departure
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Trip Updates</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Get notified about changes to your trips</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.tripUpdates || false}
                  onChange={() => handleToggle('tripUpdates')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p><strong>Note:</strong> Trip collaboration notifications (new members, expenses, activities, checklist) are controlled by the "Trip Updates" setting above.</p>
                <p>When enabled, you'll receive notifications for all trip-related changes including member joins, expense additions, activity updates, and checklist changes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visa Notifications */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visa Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Visa Deadlines</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Get reminded about visa application deadlines</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.visaDeadlines || false}
                  onChange={() => handleToggle('visaDeadlines')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {localPreferences.visaDeadlines && (
              <div className="ml-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Deadline Reminder:</strong> 30 days before (fixed)
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You'll be reminded 30 days before visa deadlines
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Visa Updates</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Get notified about visa status changes</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.visaUpdates || false}
                  onChange={() => handleToggle('visaUpdates')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* System Notifications */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Browser Notifications</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Show notifications in your browser</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.browserNotifications || false}
                  onChange={() => handleToggle('browserNotifications')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Notification Permission Request */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900 dark:text-blue-100">Browser Permission</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {typeof window !== 'undefined' && 'Notification' in window 
                      ? `Status: ${Notification.permission}` 
                      : 'Notifications not supported in this browser'
                    }
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const { notificationManager } = await import('../../services/notificationManager');
                      await notificationManager.requestBrowserNotificationPermission();
                    } catch (error) {
                      console.error('Error requesting notification permission:', error);
                    }
                  }}
                  disabled={typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' 
                    ? 'Enabled' 
                    : 'Request Permission'
                  }
                </button>
              </div>
            </div>


            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Email Notifications</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Send notifications via email (coming soon)</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.emailNotifications || false}
                  onChange={() => handleToggle('emailNotifications')}
                  disabled
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Push Notifications</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Send push notifications to your device (coming soon)</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPreferences.pushNotifications || false}
                  onChange={() => handleToggle('pushNotifications')}
                  disabled
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 opacity-50"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
