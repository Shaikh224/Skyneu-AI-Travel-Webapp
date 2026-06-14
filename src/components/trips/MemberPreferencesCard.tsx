import React from 'react';
import { 
  User, Heart, MapPin, DollarSign, 
  Utensils, Car, Hotel, Activity,
  Mountain, Waves, TreePine, Camera,
  Sun, Coffee, Music, ShoppingBag,
  Clock, Users, Shield
} from 'lucide-react';
import { UserPreferences } from '../../lib/appwrite';

interface MemberPreferencesCardProps {
  preferences: UserPreferences;
  isCurrentUser?: boolean;
  compact?: boolean;
}

const MemberPreferencesCard: React.FC<MemberPreferencesCardProps> = ({ 
  preferences, 
  isCurrentUser = false,
  compact = false 
}) => {
  const parseStringArray = (value: string | string[] | undefined): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return typeof value === 'string' ? [value] : [];
    }
  };

  const getInterestIcon = (interest: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'culture': <Camera className="h-3 w-3" />,
      'adventure': <Mountain className="h-3 w-3" />,
      'relaxation': <Waves className="h-3 w-3" />,
      'food': <Utensils className="h-3 w-3" />,
      'nature': <TreePine className="h-3 w-3" />,
      'photography': <Camera className="h-3 w-3" />,
      'music': <Music className="h-3 w-3" />,
      'shopping': <ShoppingBag className="h-3 w-3" />,
      'history': <Shield className="h-3 w-3" />,
      'socializing': <Users className="h-3 w-3" />,
      'coffee': <Coffee className="h-3 w-3" />
    };
    return iconMap[interest.toLowerCase()] || <Activity className="h-3 w-3" />;
  };

  const getTravelStyleColor = (style: string) => {
    const colorMap: { [key: string]: string } = {
      'Luxury': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Premium': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Comfort': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Mixed': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Budget': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'Backpacker': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colorMap[style] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const interests = parseStringArray(preferences.interests);
  const dietaryRestrictions = parseStringArray(preferences.dietaryRestrictions);
  const activityTypes = parseStringArray(preferences.activityTypes);

  if (compact) {
    return (
      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg border border-blue-200 dark:border-blue-800/30">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-900 dark:text-white text-sm">
            Travel Preferences {isCurrentUser && '(You)'}
          </span>
        </div>
        
        <div className="space-y-2 text-xs">
          {preferences.travelStyle && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">Style:</span>
              <span className={`px-2 py-1 rounded-full text-xs ${getTravelStyleColor(preferences.travelStyle)}`}>
                {preferences.travelStyle}
              </span>
            </div>
          )}
          
          {interests.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-gray-600 dark:text-gray-400 mt-0.5">Interests:</span>
              <div className="flex flex-wrap gap-1">
                {interests.slice(0, 3).map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-dark-surface rounded-md text-xs border border-gray-200 dark:border-gray-700"
                  >
                    {getInterestIcon(interest)}
                    {interest}
                  </span>
                ))}
                {interests.length > 3 && (
                  <span className="text-gray-500 text-xs">+{interests.length - 3} more</span>
                )}
              </div>
            </div>
          )}

          {dietaryRestrictions.length > 0 && (
            <div className="flex items-center gap-2">
              <Utensils className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Diet:</span>
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                {dietaryRestrictions.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg">
          <Heart className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Travel Preferences {isCurrentUser && '(You)'}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Personalization profile for trip planning
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Travel Style & Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {preferences.travelStyle && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Travel Style
              </label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTravelStyleColor(preferences.travelStyle)}`}>
                {preferences.travelStyle}
              </span>
            </div>
          )}
          
          {preferences.budgetRange && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Budget Range
              </label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {preferences.budgetRange}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Interests */}
        {interests.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Interests & Activities
            </label>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800/30"
                >
                  {getInterestIcon(interest)}
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Activity Types */}
        {activityTypes.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Preferred Activity Types
            </label>
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((type, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md text-xs border border-green-200 dark:border-green-800/30"
                >
                  <Activity className="h-3 w-3" />
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Accommodation & Transport */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {preferences.accommodationType && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Accommodation
              </label>
              <div className="flex items-center gap-2">
                <Hotel className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {preferences.accommodationType}
                </span>
              </div>
            </div>
          )}

          {preferences.travelClass && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Travel Class
              </label>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {preferences.travelClass.replace('-', ' ')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Health & Dietary */}
        <div className="space-y-3">
          {dietaryRestrictions.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Dietary Restrictions
              </label>
              <div className="flex flex-wrap gap-2">
                {dietaryRestrictions.map((restriction, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-md text-xs border border-orange-200 dark:border-orange-800/30"
                  >
                    <Utensils className="h-3 w-3" />
                    {restriction}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {preferences.fitnessLevel && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Fitness Level
                </label>
                <div className="flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {preferences.fitnessLevel}
                  </span>
                </div>
              </div>
            )}

            {preferences.mobility && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Mobility
                </label>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {preferences.mobility}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Experience Preferences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {preferences.experiencePriority && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Experience Priority
              </label>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {preferences.experiencePriority}
                </span>
              </div>
            </div>
          )}

          {preferences.planningStyle && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Planning Style
              </label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {preferences.planningStyle}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Weather & Location */}
        {(preferences.weatherPreference || preferences.homeAirport) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {preferences.weatherPreference && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Weather Preference
                </label>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {preferences.weatherPreference}
                  </span>
                </div>
              </div>
            )}

            {preferences.homeAirport && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Home Airport
                </label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {preferences.homeAirport}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Group Preferences */}
        {preferences.groupTravelPreference && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Group Travel Preference
            </label>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {preferences.groupTravelPreference}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberPreferencesCard;
