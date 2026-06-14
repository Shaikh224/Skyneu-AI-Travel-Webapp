import React, { useState, useEffect } from 'react';
import { useAuthSafe } from '@/contexts/AppwriteAuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { 
  User, Settings,
  Save, Edit3, Camera,
  Check, Bell, CreditCard
} from 'lucide-react';
import NotificationSettings from './notifications/NotificationSettings';
import SubscriptionManagement from './SubscriptionManagement';

const AccountProfile: React.FC = () => {
  const authContext = useAuthSafe();
  
  // Handle case where auth context is not available during hot reload
  if (!authContext) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg p-6 border border-gray-200 dark:border-dark-border">
          <div className="text-center">
            <div className="text-lg font-semibold text-skyneu-dark dark:text-dark-text">Loading...</div>
          </div>
        </div>
      </div>
    );
  }
  
  const { user, userPreferences, updateUserPreferences, needsOnboarding, completeOnboarding } = authContext;
  
  // Get notification context (with fallback for when not available)
  let notificationContext = null;
  try {
    notificationContext = useNotification();
  } catch (error) {
    console.warn('Notification context not available:', error);
  }
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'subscription' | 'advanced'>('profile');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Profile state - Updated to match existing Appwrite structure
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Demo User',
    email: user?.email || 'demo@example.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    bio: 'Passionate traveler exploring the world one destination at a time.',
    avatar: '',
    dateOfBirth: '1990-01-01',
    preferences: {
      // Existing attributes (matching your Appwrite structure)
      preferredDestinations: ['Paris', 'Tokyo', 'London'] as string[],
      frequentAirlines: ['Delta', 'United'] as string[],
      homeAirport: 'JFK',
      travelClass: 'economy',
      travelPurpose: 'leisure',
      defaultCurrency: 'USD',
      interests: ['History', 'Food'] as string[],
      timeZone: 'America/New_York',
      language: 'en',
      
      // New enhanced attributes for hyperpersonalization
      travelStyle: 'Mixed',
      budgetRange: 'Medium',
      accommodationType: 'Hotel',
      groupTravelPreference: 'Solo',
      
      // Activity & Fitness
      activityTypes: ['Sightseeing', 'Cultural'] as string[],
      fitnessLevel: 'Moderate',
      riskTolerance: 'Medium',
      
      // Health & Accessibility
      mobility: 'Full',
      dietaryRestrictions: [] as string[],
      weatherPreference: 'Mild',
      
      // Advanced preferences (Phase 2)
      seatPreference: 'Window',
      carRentalPreference: 'Compact',
      planningStyle: 'Detailed',
      bookingLeadTime: '1-3 months',
      flexibilityLevel: 'Moderate',
      experiencePriority: 'Culture',
      luxuryLevel: 'Moderate',
      authenticityPreference: 'High',
      techComfort: 'High',
      socialPreference: 'Moderate',
      culturalSensitivity: 'High'
    },
  });

  // Load user preferences when available
  useEffect(() => {
    if (userPreferences) {
      setProfileData({
        name: userPreferences.name || user?.name || 'Demo User',
        email: userPreferences.email || user?.email || 'demo@example.com',
        phone: userPreferences.phone || '+1 (555) 123-4567',
        location: userPreferences.location || 'New York, NY',
        bio: userPreferences.bio || 'Passionate traveler exploring the world one destination at a time.',
        avatar: userPreferences.avatar || '',
        dateOfBirth: userPreferences.dateOfBirth || '1990-01-01',
        preferences: {
          // Existing attributes from Appwrite - Parse JSON strings to arrays
          preferredDestinations: Array.isArray(userPreferences.preferredDestinations) 
            ? userPreferences.preferredDestinations 
            : (typeof userPreferences.preferredDestinations === 'string' && userPreferences.preferredDestinations)
              ? JSON.parse(userPreferences.preferredDestinations) 
              : [],
          frequentAirlines: Array.isArray(userPreferences.frequentAirlines)
            ? userPreferences.frequentAirlines
            : (typeof userPreferences.frequentAirlines === 'string' && userPreferences.frequentAirlines)
              ? JSON.parse(userPreferences.frequentAirlines)
              : [],
          homeAirport: userPreferences.homeAirport || 'JFK',
          travelClass: userPreferences.travelClass || 'economy',
          travelPurpose: userPreferences.travelPurpose || 'leisure',
          defaultCurrency: userPreferences.defaultCurrency || 'USD',
          interests: Array.isArray(userPreferences.interests)
            ? userPreferences.interests
            : (typeof userPreferences.interests === 'string' && userPreferences.interests)
              ? JSON.parse(userPreferences.interests)
              : [],
          timeZone: userPreferences.timeZone || 'America/New_York',
          language: userPreferences.language || 'en',
          
          // New enhanced attributes
          travelStyle: userPreferences.travelStyle || 'Mixed',
          budgetRange: userPreferences.budgetRange || 'Medium',
          accommodationType: userPreferences.accommodationType || 'Hotel',
          groupTravelPreference: userPreferences.groupTravelPreference || 'Solo',
          activityTypes: Array.isArray(userPreferences.activityTypes)
            ? userPreferences.activityTypes
            : (typeof userPreferences.activityTypes === 'string' && userPreferences.activityTypes)
              ? JSON.parse(userPreferences.activityTypes)
              : ['Sightseeing', 'Cultural'],
          fitnessLevel: userPreferences.fitnessLevel || 'Moderate',
          riskTolerance: userPreferences.riskTolerance || 'Medium',
          mobility: userPreferences.mobility || 'Full',
          dietaryRestrictions: Array.isArray(userPreferences.dietaryRestrictions)
            ? userPreferences.dietaryRestrictions
            : (typeof userPreferences.dietaryRestrictions === 'string' && userPreferences.dietaryRestrictions)
              ? JSON.parse(userPreferences.dietaryRestrictions)
              : [],
          weatherPreference: userPreferences.weatherPreference || 'Mild',
          seatPreference: userPreferences.seatPreference || 'Window',
          carRentalPreference: userPreferences.carRentalPreference || 'Compact',
          planningStyle: userPreferences.planningStyle || 'Detailed',
          bookingLeadTime: userPreferences.bookingLeadTime || '1-3 months',
          flexibilityLevel: userPreferences.flexibilityLevel || 'Moderate',
          experiencePriority: userPreferences.experiencePriority || 'Culture',
          luxuryLevel: userPreferences.luxuryLevel || 'Moderate',
          authenticityPreference: userPreferences.authenticityPreference || 'High',
          techComfort: userPreferences.techComfort || 'High',
          socialPreference: userPreferences.socialPreference || 'Moderate',
          culturalSensitivity: userPreferences.culturalSensitivity || 'High'
        },
        notifications: {
          // Existing notification attributes
          newsAlerts: userPreferences.newsAlerts !== undefined ? userPreferences.newsAlerts : false,
          flightAlerts: userPreferences.flightAlerts !== undefined ? userPreferences.flightAlerts : true,
          weatherAlerts: userPreferences.weatherAlerts !== undefined ? userPreferences.weatherAlerts : true,
          priceAlerts: userPreferences.priceAlerts !== undefined ? userPreferences.priceAlerts : true,
          
          // New notification attributes
          destinationInsights: userPreferences.destinationInsights !== undefined ? userPreferences.destinationInsights : true,
          personalizedTips: userPreferences.personalizedTips !== undefined ? userPreferences.personalizedTips : true,
          communityUpdates: userPreferences.communityUpdates !== undefined ? userPreferences.communityUpdates : false,
          weeklyDigest: userPreferences.weeklyDigest !== undefined ? userPreferences.weeklyDigest : true
        }
      });
    }
  }, [userPreferences, user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare the preferences data for saving (convert arrays to JSON strings)
      const preferencesToSave: any = {
        // Basic info
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        location: profileData.location,
        bio: profileData.bio,
        dateOfBirth: profileData.dateOfBirth,
        avatar: profileData.avatar,
        
        // Travel preferences (existing structure) - Convert arrays to JSON strings
        preferredDestinations: JSON.stringify(profileData.preferences.preferredDestinations),
        frequentAirlines: JSON.stringify(profileData.preferences.frequentAirlines),
        homeAirport: profileData.preferences.homeAirport,
        travelClass: profileData.preferences.travelClass,
        travelPurpose: profileData.preferences.travelPurpose,
        defaultCurrency: profileData.preferences.defaultCurrency,
        interests: JSON.stringify(profileData.preferences.interests),
        timeZone: profileData.preferences.timeZone,
        language: profileData.preferences.language,
        
        // New enhanced preferences - Convert arrays to JSON strings
        travelStyle: profileData.preferences.travelStyle,
        budgetRange: profileData.preferences.budgetRange,
        accommodationType: profileData.preferences.accommodationType,
        groupTravelPreference: profileData.preferences.groupTravelPreference,
        activityTypes: JSON.stringify(profileData.preferences.activityTypes),
        fitnessLevel: profileData.preferences.fitnessLevel,
        riskTolerance: profileData.preferences.riskTolerance,
        mobility: profileData.preferences.mobility,
        dietaryRestrictions: JSON.stringify(profileData.preferences.dietaryRestrictions),
        weatherPreference: profileData.preferences.weatherPreference,
        seatPreference: profileData.preferences.seatPreference,
        carRentalPreference: profileData.preferences.carRentalPreference,
        planningStyle: profileData.preferences.planningStyle,
        bookingLeadTime: profileData.preferences.bookingLeadTime,
        flexibilityLevel: profileData.preferences.flexibilityLevel,
        experiencePriority: profileData.preferences.experiencePriority,
        luxuryLevel: profileData.preferences.luxuryLevel,
        authenticityPreference: profileData.preferences.authenticityPreference,
        techComfort: profileData.preferences.techComfort,
        socialPreference: profileData.preferences.socialPreference,
        culturalSensitivity: profileData.preferences.culturalSensitivity,
        
      };

      // Save to Appwrite database
      await updateUserPreferences(preferencesToSave);
      
      // Complete onboarding if this is a new user
      if (needsOnboarding) {
        completeOnboarding();
      }
      
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      // Show error message to user
      setSuccessMessage('Error saving profile. Please try again.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Travel Preferences', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'advanced', label: 'Advanced Preferences', icon: Settings }
  ];

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200 dark:border-dark-border">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-skyneu-blue to-indigo-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                {profileData.name?.charAt(0) || 'U'}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-skyneu-blue text-white rounded-full flex items-center justify-center hover:bg-skyneu-blue/90 transition-colors">
                <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-skyneu-dark dark:text-dark-text truncate">{profileData.name}</h2>
              <p className="text-sm sm:text-base text-skyneu-text dark:text-dark-text-secondary truncate">{profileData.email}</p>
              <p className="text-xs sm:text-sm text-skyneu-text dark:text-dark-text-secondary">Member since {new Date().getFullYear()}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 bg-skyneu-blue text-white rounded-lg hover:bg-skyneu-blue/90 transition-colors text-sm w-full sm:w-auto"
          >
            <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">{isEditing ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 dark:bg-dark-border rounded-lg p-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md transition-colors whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-dark-surface text-skyneu-blue shadow-sm'
                  : 'text-skyneu-text dark:text-dark-text-secondary hover:text-skyneu-dark dark:hover:text-dark-text'
              }`}
            >
              <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-dark-border">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold text-skyneu-dark dark:text-dark-text mb-3 sm:mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Full Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Phone</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Location</label>
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  disabled={!isEditing}
                  placeholder="City, Country"
                  className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                disabled={!isEditing}
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
              />
            </div>
          </div>
        )}

        {/* Travel Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold text-skyneu-dark dark:text-dark-text mb-3 sm:mb-4">Basic Travel Preferences</h3>
            
            {/* Basic Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Preferred Currency</label>
                <div className="space-y-2">
                  <select
                    value={profileData.preferences.defaultCurrency}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM') {
                        // Don't change the currency, just show the input
                        return;
                      }
                      setProfileData({ 
                        ...profileData, 
                        preferences: { ...profileData.preferences, defaultCurrency: e.target.value }
                      });
                    }}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="CNY">CNY - Chinese Yuan</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                    <option value="BRL">BRL - Brazilian Real</option>
                    <option value="MXN">MXN - Mexican Peso</option>
                    <option value="KRW">KRW - South Korean Won</option>
                    <option value="THB">THB - Thai Baht</option>
                    <option value="CUSTOM">+ Add Custom Currency</option>
                  </select>
                  
                  {/* Custom currency input - show when custom is selected or when current currency is not in the list */}
                  {(profileData.preferences.defaultCurrency === 'CUSTOM' || 
                    !['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'AED', 'SAR', 'SGD', 'BRL', 'MXN', 'KRW', 'THB'].includes(profileData.preferences.defaultCurrency)) && (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={profileData.preferences.defaultCurrency === 'CUSTOM' ? '' : profileData.preferences.defaultCurrency}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          setProfileData({ 
                            ...profileData, 
                            preferences: { ...profileData.preferences, defaultCurrency: value || 'USD' }
                          });
                        }}
                        disabled={!isEditing}
                        placeholder="Enter currency code (e.g., BTC, ETH, XRP)"
                        className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                        maxLength={10}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Enter a 3-letter currency code (e.g., USD, EUR) or custom currency symbol
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Travel Class</label>
                <select
                  value={profileData.preferences.travelClass}
                  onChange={(e) => setProfileData({ 
                    ...profileData, 
                    preferences: { ...profileData.preferences, travelClass: e.target.value }
                  })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                >
                  <option value="Economy">Economy</option>
                  <option value="Premium Economy">Premium Economy</option>
                  <option value="Business">Business</option>
                  <option value="First">First Class</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Home Airport</label>
                <input
                  type="text"
                  value={profileData.preferences.homeAirport}
                  onChange={(e) => setProfileData({ 
                    ...profileData, 
                    preferences: { ...profileData.preferences, homeAirport: e.target.value }
                  })}
                  disabled={!isEditing}
                  placeholder="e.g., JFK, LAX, LHR"
                  className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Language</label>
                <select
                  value={profileData.preferences.language}
                  onChange={(e) => setProfileData({ 
                    ...profileData, 
                    preferences: { ...profileData.preferences, language: e.target.value }
                  })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Mandarin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Travel Style</label>
                <select
                  value={profileData.preferences.travelStyle}
                  onChange={(e) => setProfileData({ 
                    ...profileData, 
                    preferences: { ...profileData.preferences, travelStyle: e.target.value }
                  })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                >
                  <option value="Luxury">Luxury</option>
                  <option value="Premium">Premium</option>
                  <option value="Comfort">Comfort</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Budget">Budget</option>
                  <option value="Backpacker">Backpacker</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Budget Range</label>
                <select
                  value={profileData.preferences.budgetRange}
                  onChange={(e) => setProfileData({ 
                    ...profileData, 
                    preferences: { ...profileData.preferences, budgetRange: e.target.value }
                  })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                >
                  <option value="Budget">Budget ($0-50/day)</option>
                  <option value="Low">Low ($50-100/day)</option>
                  <option value="Medium">Medium ($100-200/day)</option>
                  <option value="High">High ($200-500/day)</option>
                  <option value="Luxury">Luxury ($500+/day)</option>
                </select>
              </div>
            </div>

            {/* Activity Preferences */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-2">Preferred Activities (Select multiple)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-2">
                {['Sightseeing', 'Cultural', 'Adventure', 'Relaxation', 'Food Tours', 'Museums', 'Nature', 'Nightlife', 'Shopping', 'Sports', 'Photography', 'Art'].map((activity) => (
                  <label key={activity} className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.preferences.activityTypes.includes(activity)}
                      onChange={(e) => {
                        const updatedActivities = e.target.checked
                          ? [...profileData.preferences.activityTypes, activity]
                          : profileData.preferences.activityTypes.filter(a => a !== activity);
                        setProfileData({
                          ...profileData,
                          preferences: { ...profileData.preferences, activityTypes: updatedActivities }
                        });
                      }}
                      disabled={!isEditing}
                      className="rounded text-skyneu-blue focus:ring-skyneu-blue w-3 h-3 sm:w-4 sm:h-4"
                    />
                    <span className="text-xs sm:text-sm text-skyneu-dark dark:text-dark-text truncate">{activity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Business Travel Toggle */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900 dark:text-blue-100">Business Traveler</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Enable business-focused features and preferences</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileData.preferences.businessTraveler || false}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      preferences: { ...profileData.preferences, businessTraveler: e.target.checked }
                    })}
                    disabled={!isEditing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Accommodation Preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Accommodation Type</label>
                <select
                  value={profileData.preferences.accommodationType}
                  onChange={(e) => setProfileData({ 
                    ...profileData, 
                    preferences: { ...profileData.preferences, accommodationType: e.target.value }
                  })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                >
                  <option value="Hotel">Hotel</option>
                  <option value="Resort">Resort</option>
                  <option value="Boutique Hotel">Boutique Hotel</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Airbnb">Airbnb/Vacation Rental</option>
                  <option value="Bed & Breakfast">Bed & Breakfast</option>
                  <option value="Apartment">Apartment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Group Travel Preference</label>
                <select
                  value={profileData.preferences.groupTravelPreference}
                  onChange={(e) => setProfileData({ 
                    ...profileData, 
                    preferences: { ...profileData.preferences, groupTravelPreference: e.target.value }
                  })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                >
                  <option value="Solo">Solo Travel</option>
                  <option value="Couple">Couple</option>
                  <option value="Family">Family with Kids</option>
                  <option value="Friends">Friends Group</option>
                  <option value="Business">Business Travel</option>
                  <option value="Mixed">Mixed/Flexible</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold text-skyneu-dark dark:text-dark-text mb-3 sm:mb-4">Notification Settings</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg">
              <NotificationSettings 
                preferences={notificationContext?.preferences || null} 
                onUpdatePreferences={async (preferences) => {
                  if (notificationContext?.updatePreferences) {
                    try {
                      await notificationContext.updatePreferences(preferences);
                      console.log('✅ Notification preferences saved successfully');
                    } catch (error) {
                      console.error('❌ Failed to save notification preferences:', error);
                    }
                  } else {
                    console.warn('⚠️ Notification context not available - cannot save preferences');
                  }
                }}
                loading={notificationContext?.loading || false}
              />
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div>
            <SubscriptionManagement />
          </div>
        )}

        {/* Advanced Preferences Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-6 sm:space-y-8">
            <h3 className="text-lg sm:text-xl font-semibold text-skyneu-dark dark:text-dark-text mb-3 sm:mb-4">Advanced Personalization</h3>
            
            {/* Personal Considerations */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg">
              <h4 className="text-base sm:text-lg font-medium text-skyneu-dark dark:text-dark-text mb-3 sm:mb-4">Personal Considerations</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Fitness Level</label>
                  <select
                    value={profileData.preferences.fitnessLevel}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      preferences: { ...profileData.preferences, fitnessLevel: e.target.value }
                    })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                  >
                    <option value="Low">Low - Prefer minimal walking</option>
                    <option value="Moderate">Moderate - Average activity level</option>
                    <option value="High">High - Enjoy active adventures</option>
                    <option value="Very High">Very High - Extreme activities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Mobility</label>
                  <select
                    value={profileData.preferences.mobility}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      preferences: { ...profileData.preferences, mobility: e.target.value }
                    })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                  >
                    <option value="Full">Full Mobility</option>
                    <option value="Limited">Limited Mobility</option>
                    <option value="Wheelchair">Wheelchair User</option>
                    <option value="Assistance">Requires Assistance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Risk Tolerance</label>
                  <select
                    value={profileData.preferences.riskTolerance}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      preferences: { ...profileData.preferences, riskTolerance: e.target.value }
                    })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                  >
                    <option value="Low">Low - Stick to safe destinations</option>
                    <option value="Medium">Medium - Some adventure is fine</option>
                    <option value="High">High - Enjoy calculated risks</option>
                    <option value="Very High">Very High - Thrill seeker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Weather Preference</label>
                  <select
                    value={profileData.preferences.weatherPreference}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      preferences: { ...profileData.preferences, weatherPreference: e.target.value }
                    })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                  >
                    <option value="Hot">Hot & Tropical</option>
                    <option value="Warm">Warm & Sunny</option>
                    <option value="Mild">Mild & Comfortable</option>
                    <option value="Cool">Cool & Fresh</option>
                    <option value="Cold">Cold & Snowy</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-2">Dietary Restrictions (Select all that apply)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-2">
                  {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Dairy-Free', 'Nut Allergy', 'Shellfish Allergy'].map((diet) => (
                    <label key={diet} className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.preferences.dietaryRestrictions.includes(diet)}
                        onChange={(e) => {
                          const updatedDiets = e.target.checked
                            ? [...profileData.preferences.dietaryRestrictions, diet]
                            : profileData.preferences.dietaryRestrictions.filter(d => d !== diet);
                          setProfileData({
                            ...profileData,
                            preferences: { ...profileData.preferences, dietaryRestrictions: updatedDiets }
                          });
                        }}
                        disabled={!isEditing}
                        className="rounded text-skyneu-blue focus:ring-skyneu-blue w-3 h-3 sm:w-4 sm:h-4"
                      />
                      <span className="text-xs sm:text-sm text-skyneu-dark dark:text-dark-text truncate">{diet}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Travel Planning Style */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg">
              <h4 className="text-base sm:text-lg font-medium text-skyneu-dark dark:text-dark-text mb-3 sm:mb-4">Travel Planning Style</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Planning Style</label>
                  <select
                    value={profileData.preferences.planningStyle}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      preferences: { ...profileData.preferences, planningStyle: e.target.value }
                    })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                  >
                    <option value="Detailed">Detailed Planner</option>
                    <option value="Structured">Structured with Flexibility</option>
                    <option value="Loose">Loose Framework</option>
                    <option value="Spontaneous">Spontaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Booking Lead Time</label>
                  <select
                    value={profileData.preferences.bookingLeadTime}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      preferences: { ...profileData.preferences, bookingLeadTime: e.target.value }
                    })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                  >
                    <option value="Last Minute">Last Minute (0-2 weeks)</option>
                    <option value="Short Term">Short Term (2-4 weeks)</option>
                    <option value="1-3 months">1-3 months ahead</option>
                    <option value="3-6 months">3-6 months ahead</option>
                    <option value="6+ months">6+ months ahead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Experience Priority</label>
                  <select
                    value={profileData.preferences.experiencePriority}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      preferences: { ...profileData.preferences, experiencePriority: e.target.value }
                    })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                  >
                    <option value="Culture">Cultural Immersion</option>
                    <option value="Adventure">Adventure & Activities</option>
                    <option value="Relaxation">Relaxation & Wellness</option>
                    <option value="Food">Food & Culinary</option>
                    <option value="Nature">Nature & Wildlife</option>
                    <option value="History">History & Heritage</option>
                    <option value="Photography">Photography</option>
                    <option value="Socializing">Meeting People</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Tech Comfort Level</label>
                  <select
                    value={profileData.preferences.techComfort}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      preferences: { ...profileData.preferences, techComfort: e.target.value }
                    })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                  >
                    <option value="Low">Low - Prefer traditional methods</option>
                    <option value="Medium">Medium - Basic app usage</option>
                    <option value="High">High - Tech-savvy traveler</option>
                    <option value="Expert">Expert - Early adopter</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Transportation Preferences */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 rounded-lg">
              <h4 className="text-base sm:text-lg font-medium text-skyneu-dark dark:text-dark-text mb-3 sm:mb-4">Transportation Preferences</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Seat Preference</label>
                  <select
                    value={profileData.preferences.seatPreference}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      preferences: { ...profileData.preferences, seatPreference: e.target.value }
                    })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                  >
                    <option value="Window">Window</option>
                    <option value="Aisle">Aisle</option>
                    <option value="Middle">Middle (No preference)</option>
                    <option value="Exit Row">Exit Row</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-1 sm:mb-2">Car Rental Preference</label>
                  <select
                    value={profileData.preferences.carRentalPreference}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      preferences: { ...profileData.preferences, carRentalPreference: e.target.value }
                    })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 sm:px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-skyneu-dark dark:text-dark-text disabled:bg-gray-50 dark:disabled:bg-gray-800 text-sm"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Compact">Compact</option>
                    <option value="Midsize">Midsize</option>
                    <option value="SUV">SUV</option>
                    <option value="Luxury">Luxury</option>
                    <option value="No Car">Prefer not to rent</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                <label className="block text-xs sm:text-sm font-medium text-skyneu-dark dark:text-dark-text mb-2">Preferred Airlines (Select up to 5)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-2">
                  {['Delta', 'United', 'American', 'Southwest', 'JetBlue', 'Alaska', 'British Airways', 'Lufthansa', 'Emirates', 'Singapore Airlines', 'Air France', 'KLM'].map((airline) => (
                    <label key={airline} className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.preferences.frequentAirlines.includes(airline)}
                        onChange={(e) => {
                          const updatedAirlines = e.target.checked
                            ? [...profileData.preferences.frequentAirlines, airline].slice(0, 5)
                            : profileData.preferences.frequentAirlines.filter((a: string) => a !== airline);
                          setProfileData({
                            ...profileData,
                            preferences: { ...profileData.preferences, frequentAirlines: updatedAirlines }
                          });
                        }}
                        disabled={!isEditing || (profileData.preferences.frequentAirlines.length >= 5 && !profileData.preferences.frequentAirlines.includes(airline))}
                        className="rounded text-skyneu-blue focus:ring-skyneu-blue w-3 h-3 sm:w-4 sm:h-4"
                      />
                      <span className="text-xs sm:text-sm text-skyneu-dark dark:text-dark-text truncate">{airline}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Save Button */}
        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-dark-border mt-4 sm:mt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 bg-skyneu-blue text-white rounded-lg hover:bg-skyneu-blue/90 transition-colors disabled:opacity-50 text-sm order-2 sm:order-1"
            >
              <Save className="h-3 w-3 sm:h-4 sm:w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 sm:px-6 border border-gray-300 dark:border-dark-border text-skyneu-dark dark:text-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm order-1 sm:order-2"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountProfile;