import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Lightbulb, Clock, DollarSign, Users, Cloud, 
  Utensils, Car, Hotel, Activity as ActivityIcon, Brain, RefreshCw, Plus, Check
} from 'lucide-react';
import { Trip, TripActivity, TripMember } from '../../types/trip';
import { generateSmartSuggestions } from '../../lib/gemini';
import { tripService } from '../../services/tripService';
import { useAuthSafe } from '../../contexts/AppwriteAuthContext';
import toast from 'react-hot-toast';

interface SmartSuggestionsProps {
  trip: Trip;
  activities: TripActivity[];
  members: TripMember[];
  geminiApiKey?: string;
  onRefresh?: () => void;
}

interface Suggestion {
  id: string;
  type: 'activity' | 'optimization' | 'budget' | 'timing' | 'safety' | 'weather' | 'transport' | 'accommodation' | 'food';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  estimatedSavings?: number;
  timeImpact?: string;
}

// Cache for suggestions to avoid unnecessary API calls
const suggestionsCache = new Map<string, { data: Suggestion[], timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const API_RATE_LIMIT = new Map<string, number>();
const RATE_LIMIT_DURATION = 5 * 60 * 1000; // 5 minutes between API calls

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ trip, activities, members, geminiApiKey, onRefresh }) => {
  const authContext = useAuthSafe();
  const user = authContext?.user;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(new Set());
  const [useAI] = useState(!!geminiApiKey);
  const [showScheduleModal, setShowScheduleModal] = useState<Suggestion | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '09:00',
    cost: 0,
    notes: ''
  });

  // Generate cache key based on trip data
  const cacheKey = useMemo(() => {
    return `${trip.title}-${trip.destination}-${activities.length}-${members.length}-${trip.budget}`;
  }, [trip.title, trip.destination, activities.length, members.length, trip.budget]);

  // Check if we can use cached data
  const getCachedSuggestions = useCallback(() => {
    const cached = suggestionsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, [cacheKey]);

  // Check rate limiting
  const canMakeAPICall = useCallback(() => {
    const lastCall = API_RATE_LIMIT.get(cacheKey);
    return !lastCall || (Date.now() - lastCall) > RATE_LIMIT_DURATION;
  }, [cacheKey]);

  useEffect(() => {
    generateSuggestionsAsync();
  }, [cacheKey, useAI]);

  const generateSuggestionsAsync = async (forceRefresh = false) => {
    // Skip cache if force refresh is requested
    if (!forceRefresh) {
      const cached = getCachedSuggestions();
      if (cached) {
        setSuggestions(cached.filter(s => !dismissedSuggestions.includes(s.id)));
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    
    try {
      let newSuggestions: Suggestion[] = [];

      if (useAI && geminiApiKey && (forceRefresh || canMakeAPICall())) {
        // Record API call time
        API_RATE_LIMIT.set(cacheKey, Date.now());

        // Use Gemini AI for smart suggestions
        const aiSuggestions = await generateSmartSuggestions(
          trip.destination,
          trip.startDate,
          trip.endDate,
          trip.budget || 0,
          members.length,
          activities.map(a => ({
            title: a.title,
            category: a.category,
            date: a.date,
            cost: a.cost || 0,
            weatherDependent: a.weatherDependent
          })),
          geminiApiKey
        );

        // Transform AI suggestions to our format
        newSuggestions = aiSuggestions.map(aiSugg => ({
          id: aiSugg.id || Math.random().toString(36).substr(2, 9),
          type: aiSugg.type || 'activity',
          title: aiSugg.title,
          description: aiSugg.description,
          action: aiSugg.action,
          priority: aiSugg.priority || 'medium',
          icon: getIconForType(aiSugg.type || 'activity'),
          estimatedSavings: aiSugg.estimatedSavings,
          timeImpact: aiSugg.timeImpact
        }));

        // Cache the results
        suggestionsCache.set(cacheKey, { data: newSuggestions, timestamp: Date.now() });
        setSuggestions(newSuggestions.filter(s => !dismissedSuggestions.includes(s.id)));
      } else {
        // Use rule-based suggestions as fallback
        newSuggestions = generateRuleBasedSuggestions();
        setSuggestions(newSuggestions.filter(s => !dismissedSuggestions.includes(s.id)));
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback to rule-based suggestions
      const fallbackSuggestions = generateRuleBasedSuggestions();
      setSuggestions(fallbackSuggestions.filter(s => !dismissedSuggestions.includes(s.id)));
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'activity': return <ActivityIcon className="h-4 w-4" />;
      case 'optimization': return <Brain className="h-4 w-4" />;
      case 'budget': return <DollarSign className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      case 'weather': return <Cloud className="h-4 w-4" />;
      case 'transport': return <Car className="h-4 w-4" />;
      case 'accommodation': return <Hotel className="h-4 w-4" />;
      case 'food': return <Utensils className="h-4 w-4" />;
      case 'safety': return <Users className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const generateRuleBasedSuggestions = (): Suggestion[] => {
    const newSuggestions: Suggestion[] = [];

    // Activity gap analysis
    const categories = activities.map(a => a.category);
    const missingCategories = ['food', 'activity', 'transport', 'stay'].filter(cat => !categories.includes(cat as any));
    
    missingCategories.forEach(category => {
      newSuggestions.push({
        id: `missing-${category}`,
        type: 'activity',
        title: `Add ${category} activities`,
        description: `Your trip is missing ${category} planning. Add activities to make your trip more complete.`,
        action: `Add ${category} activity`,
        priority: 'medium',
        icon: category === 'food' ? <Utensils className="h-4 w-4" /> :
              category === 'transport' ? <Car className="h-4 w-4" /> :
              category === 'stay' ? <Hotel className="h-4 w-4" /> :
              <ActivityIcon className="h-4 w-4" />
      });
    });

    // Budget optimization
    if (trip.budget) {
      const totalEstimatedCost = activities.reduce((sum, activity) => sum + (activity.cost || 0), 0);
      if (totalEstimatedCost > trip.budget * 0.8) {
        newSuggestions.push({
          id: 'budget-warning',
          type: 'budget',
          title: 'Budget optimization needed',
          description: `Your planned activities cost $${totalEstimatedCost}, which is ${Math.round((totalEstimatedCost / trip.budget) * 100)}% of your budget.`,
          priority: 'high',
          icon: <DollarSign className="h-4 w-4" />,
          estimatedSavings: totalEstimatedCost - trip.budget
        });
      } else if (totalEstimatedCost < trip.budget * 0.6) {
        newSuggestions.push({
          id: 'budget-opportunity',
          type: 'budget',
          title: 'Budget surplus available',
          description: `You have $${trip.budget - totalEstimatedCost} remaining in your budget. Consider adding more activities.`,
          priority: 'low',
          icon: <DollarSign className="h-4 w-4" />
        });
      }
    }

    // Group size optimization
    if (members.length > 6) {
      newSuggestions.push({
        id: 'large-group',
        type: 'optimization',
        title: 'Large group considerations',
        description: 'With a large group, consider splitting into smaller teams for some activities to improve experience.',
        priority: 'medium',
        icon: <Users className="h-4 w-4" />
      });
    }

    return newSuggestions;
  };

  const dismissSuggestion = (id: string) => {
    setDismissedSuggestions(prev => [...prev, id]);
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleAddSuggestionToTrip = async (suggestion: Suggestion) => {
    if (!user || addedSuggestions.has(suggestion.id)) return;

    // Open scheduling modal
    setScheduleForm({
      date: trip.startDate.split('T')[0],
      time: getOptimalTimeForSuggestion(suggestion),
      cost: getEstimatedCostForSuggestion(suggestion),
      notes: ''
    });
    setShowScheduleModal(suggestion);
  };

  const getOptimalTimeForSuggestion = (suggestion: Suggestion): string => {
    switch (suggestion.type) {
      case 'food':
        return '12:30';
      case 'accommodation':
        return '15:00';
      case 'transport':
        return '09:00';
      case 'activity':
        return '10:00';
      default:
        return '09:00';
    }
  };

  const getEstimatedCostForSuggestion = (suggestion: Suggestion): number => {
    if (suggestion.estimatedSavings) return 0; // Free if it saves money
    
    switch (suggestion.type) {
      case 'food': return 35;
      case 'accommodation': return 150;
      case 'transport': return 25;
      case 'activity': return 40;
      default: return 30;
    }
  };

  const confirmAddSuggestion = async () => {
    if (!showScheduleModal || !user) return;

    try {
      const suggestion = showScheduleModal;
      const activityData: Omit<TripActivity, '$id' | 'createdAt' | 'updatedAt'> = {
        tripId: trip.$id!,
        title: suggestion.title,
        description: suggestion.description + 
          (suggestion.action ? `\n\n🎯 Action: ${suggestion.action}` : '') +
          (scheduleForm.notes ? `\n\n📝 Notes: ${scheduleForm.notes}` : ''),
        category: suggestion.type === 'food' ? 'food' : 
                 suggestion.type === 'accommodation' ? 'stay' :
                 suggestion.type === 'transport' ? 'transport' : 'activity',
        date: `${scheduleForm.date}T${scheduleForm.time}:00`,
        location: trip.destination,
        cost: scheduleForm.cost,
        duration: suggestion.timeImpact || '2 hours',
        status: 'pending',
        addedBy: user.$id,
        weatherDependent: suggestion.type === 'weather' || false,
        tags: JSON.stringify([
          'AI Suggested',
          'Smart Recommendation',
          suggestion.type,
          suggestion.priority
        ]),
        popularity: 0
      };

      await tripService.createActivity(activityData);

      // Create expense if there's a cost
      if (scheduleForm.cost > 0) {
        try {
          const expenseData = {
            tripId: trip.$id!,
            payerId: user.$id,
            amount: scheduleForm.cost,
            description: `${suggestion.title} - AI Smart Suggestion`,
            participants: JSON.stringify([user.$id]),
            splits: JSON.stringify({ [user.$id]: scheduleForm.cost }),
            category: (suggestion.type === 'food' ? 'food' : 
                      suggestion.type === 'transport' ? 'transport' :
                      suggestion.type === 'accommodation' ? 'accommodation' : 'activity') as 'food' | 'transport' | 'accommodation' | 'activity' | 'shopping' | 'other',
            currency: trip.currency || 'USD'
          };
          
          await tripService.addExpense(expenseData);
        } catch (expenseError) {
          console.error('Error creating expense for smart suggestion:', expenseError);
        }
      }
      
      setAddedSuggestions(prev => new Set([...prev, suggestion.id]));
      toast.success(`Added "${suggestion.title}" to your trip!`);
      
      setShowScheduleModal(null);
      onRefresh?.();
      
    } catch (error) {
      console.error('Error adding suggestion to trip:', error);
      toast.error('Failed to add suggestion to trip');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-skyneu-blue/10 rounded-lg">
            <Brain className="h-5 w-5 text-skyneu-blue" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Smart Suggestions
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-skyneu-blue" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Generating intelligent suggestions...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-3 sm:p-6 max-w-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-1.5 sm:p-2 bg-skyneu-blue/10 rounded-lg flex-shrink-0">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-skyneu-blue" />
          </div>
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
            Smart Suggestions
          </h3>
        </div>
        <button
          onClick={() => generateSuggestionsAsync(true)}
          className="p-1.5 sm:p-2 text-gray-500 hover:text-skyneu-blue transition-colors flex-shrink-0"
          title="Refresh suggestions"
        >
          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
            <Brain className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm sm:text-base">No suggestions available at the moment.</p>
            <p className="text-xs sm:text-sm">Add more details to your trip for personalized recommendations.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 ${getPriorityColor(suggestion.priority)} transition-all duration-200 hover:shadow-md max-w-full overflow-hidden`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-white dark:bg-dark-surface rounded-lg shadow-sm flex-shrink-0">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                          {suggestion.title}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full self-start ${getPriorityBadgeColor(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {suggestion.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                        {suggestion.estimatedSavings && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Save ${suggestion.estimatedSavings}
                          </span>
                        )}
                        {suggestion.timeImpact && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {suggestion.timeImpact}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleAddSuggestionToTrip(suggestion)}
                      disabled={addedSuggestions.has(suggestion.id)}
                      className={`flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all w-full sm:w-auto ${
                        addedSuggestions.has(suggestion.id)
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm hover:shadow-md transform hover:scale-105'
                      }`}
                    >
                      {addedSuggestions.has(suggestion.id) ? (
                        <>
                          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Add to Trip</span>
                          <span className="sm:hidden">Add</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => dismissSuggestion(suggestion.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs sm:text-sm font-medium px-2 py-1 rounded"
                    >
                      <span className="hidden sm:inline">Dismiss</span>
                      <span className="sm:hidden">×</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cache Status Indicator */}
        <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {useAI ? 
              `🤖 AI-powered suggestions ${getCachedSuggestions() ? '(cached)' : '(fresh)'}` : 
              '📋 Rule-based suggestions'
            }
          </p>
        </div>
      </div>

      {/* Schedule Activity Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-dark-surface rounded-lg sm:rounded-xl shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                <span className="truncate">Schedule: {showScheduleModal.title}</span>
              </h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                    min={trip.startDate.split('T')[0]}
                    max={trip.endDate.split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estimated Cost ($)
                  </label>
                  <input
                    type="number"
                    value={scheduleForm.cost}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm"
                  />
                  {showScheduleModal.estimatedSavings && (
                    <p className="text-xs text-green-600 mt-1">
                      💰 This suggestion could save you ${showScheduleModal.estimatedSavings}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white resize-none text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                <button
                  onClick={confirmAddSuggestion}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg transition-all duration-300 font-medium text-sm sm:text-base"
                >
                  Add to Trip
                </button>
                <button
                  onClick={() => setShowScheduleModal(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { SmartSuggestions };
export default SmartSuggestions;