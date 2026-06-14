import React, { useState, useEffect } from 'react';
import { 
  Heart, DollarSign, Clock, 
  Utensils, Car, Hotel, Activity, 
  User, Sparkles, Globe,
  Camera, Mountain, Waves, TreePine,
  Sun, Music, ShoppingBag, Plus, Check
} from 'lucide-react';
import { Trip, TripActivity, TripMember } from '../../types/trip';
import { UserPreferences } from '../../lib/appwrite';
import { useAuthSafe } from '../../contexts/AppwriteAuthContext';
import { tripService } from '../../services/tripService';
import toast from 'react-hot-toast';

interface PersonalizedSuggestionsProps {
  trip: Trip;
  activities: TripActivity[];
  members: TripMember[];
  memberPreferences?: { [userId: string]: UserPreferences };
  onRefresh?: () => void;
}

interface PersonalizedSuggestion {
  id: string;
  category: 'activity' | 'restaurant' | 'accommodation' | 'transport' | 'budget' | 'timing';
  title: string;
  description: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  personalizedFor: string[]; // User IDs this suggestion is personalized for
  matchedPreferences: string[];
  estimatedCost?: number;
  duration?: string;
  weatherDependent?: boolean;
  icon: React.ReactNode;
}

const PersonalizedSuggestions: React.FC<PersonalizedSuggestionsProps> = ({ 
  trip, 
  activities, 
  members, 
  memberPreferences = {},
  onRefresh
}) => {
  const authContext = useAuthSafe();
  const user = authContext?.user;
  const userPreferences = authContext?.userPreferences;
  const [suggestions, setSuggestions] = useState<PersonalizedSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(new Set());
  const [bulkAdding, setBulkAdding] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState<PersonalizedSuggestion | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '09:00',
    cost: 0,
    notes: ''
  });

  // Collect all user preferences for analysis
  const allPreferences = React.useMemo(() => {
    const prefs = userPreferences ? [userPreferences] : [];
    Object.values(memberPreferences).forEach(memberPrefs => {
      if (memberPrefs) prefs.push(memberPrefs);
    });
    return prefs;
  }, [userPreferences, memberPreferences]);

  const handleBulkAddSuggestions = async () => {
    if (!user || bulkAdding) return;

    setBulkAdding(true);
    const highPrioritySuggestions = filteredSuggestions.filter(
      s => s.priority === 'high' && !addedSuggestions.has(s.id)
    ).slice(0, 3); // Limit to top 3 high priority suggestions

    let addedCount = 0;
    
    for (const suggestion of highPrioritySuggestions) {
      try {
        await handleAddSuggestionToTrip(suggestion);
        addedCount++;
      } catch (error) {
        console.error('Error in bulk add:', error);
      }
    }

    setBulkAdding(false);
    
    if (addedCount > 0) {
      toast.success(`Added ${addedCount} top suggestions to your trip!`);
    }
  };

  useEffect(() => {
    generatePersonalizedSuggestions();
  }, [trip, activities, members, memberPreferences, userPreferences]);

  const getActivityIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'culture': return <Globe className="h-4 w-4" />;
      case 'adventure': return <Mountain className="h-4 w-4" />;
      case 'relaxation': return <Waves className="h-4 w-4" />;
      case 'food': return <Utensils className="h-4 w-4" />;
      case 'nature': return <TreePine className="h-4 w-4" />;
      case 'photography': return <Camera className="h-4 w-4" />;
      case 'music': return <Music className="h-4 w-4" />;
      case 'shopping': return <ShoppingBag className="h-4 w-4" />;
      case 'restaurant': return <Utensils className="h-4 w-4" />;
      case 'accommodation': return <Hotel className="h-4 w-4" />;
      case 'transport': return <Car className="h-4 w-4" />;
      case 'budget': return <DollarSign className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

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

  const handleAddSuggestionToTrip = async (suggestion: PersonalizedSuggestion) => {
    if (!user || addedSuggestions.has(suggestion.id)) return;

    // Open scheduling modal instead of immediately adding
    setScheduleForm({
      date: trip.startDate.split('T')[0],
      time: getOptimalTime(suggestion),
      cost: suggestion.estimatedCost || getEstimatedCost(suggestion),
      notes: ''
    });
    setShowScheduleModal(suggestion);
  };

  const getOptimalTime = (suggestion: PersonalizedSuggestion): string => {
    // Suggest optimal times based on activity type
    switch (suggestion.category) {
      case 'activity':
        if (suggestion.title.toLowerCase().includes('museum') || suggestion.title.toLowerCase().includes('gallery')) {
          return '10:00'; // Museums often open at 10 AM
        }
        if (suggestion.title.toLowerCase().includes('hiking') || suggestion.title.toLowerCase().includes('nature')) {
          return '08:00'; // Early morning for outdoor activities
        }
        if (suggestion.title.toLowerCase().includes('market') || suggestion.title.toLowerCase().includes('shopping')) {
          return '11:00'; // Markets are active mid-morning
        }
        return '09:00';
      case 'restaurant':
        if (suggestion.title.toLowerCase().includes('breakfast') || suggestion.title.toLowerCase().includes('cafe')) {
          return '08:30';
        }
        if (suggestion.title.toLowerCase().includes('lunch')) {
          return '12:30';
        }
        if (suggestion.title.toLowerCase().includes('dinner') || suggestion.title.toLowerCase().includes('fine dining')) {
          return '19:00';
        }
        return '12:00';
      case 'accommodation':
        return '15:00'; // Standard check-in time
      case 'transport':
        return '09:00';
      default:
        return '09:00';
    }
  };

  const getEstimatedCost = (suggestion: PersonalizedSuggestion): number => {
    if (suggestion.estimatedCost) return suggestion.estimatedCost;
    
    // Better cost estimation based on category and destination
    switch (suggestion.category) {
      case 'restaurant':
        if (suggestion.title.toLowerCase().includes('fine dining') || suggestion.title.toLowerCase().includes('michelin')) {
          return 150;
        }
        if (suggestion.title.toLowerCase().includes('street food') || suggestion.title.toLowerCase().includes('local')) {
          return 15;
        }
        return 45;
      case 'activity':
        if (suggestion.title.toLowerCase().includes('museum') || suggestion.title.toLowerCase().includes('gallery')) {
          return 25;
        }
        if (suggestion.title.toLowerCase().includes('tour') || suggestion.title.toLowerCase().includes('guide')) {
          return 75;
        }
        if (suggestion.title.toLowerCase().includes('spa') || suggestion.title.toLowerCase().includes('wellness')) {
          return 120;
        }
        return 50;
      case 'accommodation':
        return 200; // Per night estimate
      case 'transport':
        return 30;
      default:
        return 25;
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
          (suggestion.reasoning ? `\n\n💡 Personalized because: ${suggestion.reasoning}` : '') +
          (scheduleForm.notes ? `\n\n📝 Notes: ${scheduleForm.notes}` : ''),
        category: suggestion.category === 'restaurant' ? 'food' : 
                 suggestion.category === 'accommodation' ? 'stay' :
                 suggestion.category === 'transport' ? 'transport' : 'activity',
        date: `${scheduleForm.date}T${scheduleForm.time}:00`,
        location: trip.destination,
        cost: scheduleForm.cost,
        duration: suggestion.duration || getDurationByCategory(suggestion.category),
        status: 'pending',
        addedBy: user.$id,
        weatherDependent: suggestion.weatherDependent || false,
        tags: JSON.stringify([
          'AI Suggested',
          'Personalized',
          ...suggestion.matchedPreferences.slice(0, 3)
        ]),
        popularity: 0
      };

      await tripService.createActivity(activityData);

      // If activity has a cost, automatically create an expense
      if (scheduleForm.cost > 0) {
        try {
          const expenseData = {
            tripId: trip.$id!,
            payerId: user.$id,
            amount: scheduleForm.cost,
            description: `${suggestion.title} - AI Suggested Activity`,
            participants: JSON.stringify([user.$id]), // Only assign to current user initially
            splits: JSON.stringify({ [user.$id]: scheduleForm.cost }),
            category: (suggestion.category === 'restaurant' ? 'food' : 
                      suggestion.category === 'transport' ? 'transport' :
                      suggestion.category === 'accommodation' ? 'accommodation' : 'activity') as 'food' | 'transport' | 'accommodation' | 'activity' | 'shopping' | 'other',
            currency: trip.currency || 'USD'
          };
          
          await tripService.addExpense(expenseData);
        } catch (expenseError) {
          console.error('Error creating expense for suggestion:', expenseError);
          // Don't fail the activity creation if expense fails
        }
      }
      
      // Mark as added
      setAddedSuggestions(prev => new Set([...prev, suggestion.id]));
      
      toast.success(`Added "${suggestion.title}" to your trip!`);
      
      // Close modal and refresh
      setShowScheduleModal(null);
      onRefresh?.();
      
    } catch (error) {
      console.error('Error adding suggestion to trip:', error);
      toast.error('Failed to add suggestion to trip');
    }
  };

  const getDurationByCategory = (category: string): string => {
    switch (category) {
      case 'restaurant': return '1.5 hours';
      case 'activity': return '2-3 hours';
      case 'accommodation': return 'Overnight';
      case 'transport': return '30 minutes';
      default: return '2 hours';
    }
  };

  const generatePersonalizedSuggestions = () => {
    setLoading(true);
    const newSuggestions: PersonalizedSuggestion[] = [];

    // Collect all user preferences
    const allPreferences = userPreferences ? [userPreferences] : [];
    Object.values(memberPreferences).forEach(prefs => {
      if (prefs) allPreferences.push(prefs);
    });

    if (allPreferences.length === 0) {
      setLoading(false);
      return;
    }

    // Analyze group preferences
    const groupAnalysis = analyzeGroupPreferences(allPreferences);
    
    // Generate activity suggestions based on interests
    generateActivitySuggestions(newSuggestions, groupAnalysis, allPreferences);
    
    // Generate restaurant suggestions based on dietary restrictions and food preferences
    generateRestaurantSuggestions(newSuggestions, groupAnalysis, allPreferences);
    
    // Generate accommodation suggestions based on travel style and group preferences
    generateAccommodationSuggestions(newSuggestions, groupAnalysis, allPreferences);
    
    // Generate budget optimization suggestions
    generateBudgetSuggestions(newSuggestions, groupAnalysis, allPreferences);
    
    // Generate timing and planning suggestions
    generateTimingSuggestions(newSuggestions, groupAnalysis, allPreferences);

    setSuggestions(newSuggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }));
    setLoading(false);
  };

  const analyzeGroupPreferences = (preferences: UserPreferences[]) => {
    const analysis = {
      commonInterests: new Set<string>(),
      travelStyles: new Map<string, number>(),
      budgetRanges: new Map<string, number>(),
      accommodationTypes: new Map<string, number>(),
      activityTypes: new Set<string>(),
      dietaryRestrictions: new Set<string>(),
      mobility: new Map<string, number>(),
      weatherPreferences: new Map<string, number>(),
      experiencePriorities: new Map<string, number>(),
      riskTolerances: new Map<string, number>(),
      fitnessLevels: new Map<string, number>()
    };

    preferences.forEach(prefs => {
      // Interests
      const interests = parseStringArray(prefs.interests);
      interests.forEach(interest => analysis.commonInterests.add(interest.toLowerCase()));

      // Travel styles
      if (prefs.travelStyle) {
        analysis.travelStyles.set(prefs.travelStyle, (analysis.travelStyles.get(prefs.travelStyle) || 0) + 1);
      }

      // Budget ranges
      if (prefs.budgetRange) {
        analysis.budgetRanges.set(prefs.budgetRange, (analysis.budgetRanges.get(prefs.budgetRange) || 0) + 1);
      }

      // Accommodation types
      if (prefs.accommodationType) {
        analysis.accommodationTypes.set(prefs.accommodationType, (analysis.accommodationTypes.get(prefs.accommodationType) || 0) + 1);
      }

      // Activity types
      const activityTypes = parseStringArray(prefs.activityTypes);
      activityTypes.forEach(type => analysis.activityTypes.add(type.toLowerCase()));

      // Dietary restrictions
      const dietary = parseStringArray(prefs.dietaryRestrictions);
      dietary.forEach(restriction => analysis.dietaryRestrictions.add(restriction.toLowerCase()));

      // Other preferences
      if (prefs.mobility) analysis.mobility.set(prefs.mobility, (analysis.mobility.get(prefs.mobility) || 0) + 1);
      if (prefs.weatherPreference) analysis.weatherPreferences.set(prefs.weatherPreference, (analysis.weatherPreferences.get(prefs.weatherPreference) || 0) + 1);
      if (prefs.experiencePriority) analysis.experiencePriorities.set(prefs.experiencePriority, (analysis.experiencePriorities.get(prefs.experiencePriority) || 0) + 1);
      if (prefs.riskTolerance) analysis.riskTolerances.set(prefs.riskTolerance, (analysis.riskTolerances.get(prefs.riskTolerance) || 0) + 1);
      if (prefs.fitnessLevel) analysis.fitnessLevels.set(prefs.fitnessLevel, (analysis.fitnessLevels.get(prefs.fitnessLevel) || 0) + 1);
    });

    return analysis;
  };

  const generateActivitySuggestions = (suggestions: PersonalizedSuggestion[], groupAnalysis: any, allPreferences: UserPreferences[]) => {
    // Suggest activities based on common interests
    Array.from(groupAnalysis.commonInterests).forEach((interest: unknown) => {
      const interestStr = String(interest);
      const matchedUsers = allPreferences
        .filter(prefs => parseStringArray(prefs.interests).some(i => i.toLowerCase() === interestStr))
        .map(prefs => prefs.userId);

      if (matchedUsers.length >= Math.ceil(allPreferences.length * 0.5)) { // If at least 50% share this interest
        suggestions.push({
          id: `activity-${interestStr}`,
          category: 'activity',
          title: `${interestStr.charAt(0).toUpperCase() + interestStr.slice(1)} Experience`,
          description: `Explore ${interestStr} activities in ${trip.destination} that match your group's shared interests.`,
          reasoning: `${matchedUsers.length} of ${allPreferences.length} group members are interested in ${interestStr}.`,
          priority: matchedUsers.length === allPreferences.length ? 'high' : 'medium',
          personalizedFor: matchedUsers,
          matchedPreferences: ['interests'],
          icon: getActivityIcon(interestStr),
          estimatedCost: getEstimatedCostForActivity(interestStr),
          duration: '2-4 hours'
        });
      }
    });

    // Suggest activities based on experience priorities
    const experiencePriorityEntries = Array.from(groupAnalysis.experiencePriorities.entries()) as [string, number][];
    const topExperiencePriority = experiencePriorityEntries.sort((a, b) => b[1] - a[1])[0];

    if (topExperiencePriority) {
      const [priority, count] = topExperiencePriority;
      const matchedUsers = allPreferences
        .filter(prefs => prefs.experiencePriority === priority)
        .map(prefs => prefs.userId);

      suggestions.push({
        id: `experience-${priority}`,
        category: 'activity',
        title: `${priority.charAt(0).toUpperCase() + priority.slice(1)}-Focused Activities`,
        description: `Discover ${priority.toLowerCase()}-oriented experiences in ${trip.destination}.`,
        reasoning: `${count} group members prioritize ${priority.toLowerCase()} experiences.`,
        priority: count >= Math.ceil(allPreferences.length * 0.7) ? 'high' : 'medium',
        personalizedFor: matchedUsers,
        matchedPreferences: ['experiencePriority'],
        icon: getActivityIcon(priority),
        estimatedCost: getEstimatedCostForActivity(priority),
        duration: 'Half day'
      });
    }

    // Fitness-level appropriate activities
    const avgFitnessLevel = calculateAverageFitnessLevel(groupAnalysis.fitnessLevels);
    if (avgFitnessLevel) {
      suggestions.push({
        id: 'fitness-appropriate',
        category: 'activity',
        title: `${avgFitnessLevel} Fitness Level Activities`,
        description: `Activities suited for ${avgFitnessLevel.toLowerCase()} fitness levels in your group.`,
        reasoning: `Matched to your group's average fitness level: ${avgFitnessLevel.toLowerCase()}.`,
        priority: 'medium',
        personalizedFor: allPreferences.map(p => p.userId),
        matchedPreferences: ['fitnessLevel'],
        icon: <Mountain className="h-4 w-4" />,
        duration: 'Varies'
      });
    }
  };

  const generateRestaurantSuggestions = (suggestions: PersonalizedSuggestion[], groupAnalysis: any, allPreferences: UserPreferences[]) => {
    // Handle dietary restrictions
    if (groupAnalysis.dietaryRestrictions.size > 0) {
      const restrictions = Array.from(groupAnalysis.dietaryRestrictions);
      const matchedUsers = allPreferences
        .filter(prefs => {
          const userRestrictions = parseStringArray(prefs.dietaryRestrictions);
          return userRestrictions.some(r => restrictions.includes(r.toLowerCase()));
        })
        .map(prefs => prefs.userId);

      suggestions.push({
        id: 'dietary-restaurants',
        category: 'restaurant',
        title: 'Dietary-Friendly Restaurants',
        description: `Find restaurants in ${trip.destination} that accommodate ${restrictions.join(', ')} dietary needs.`,
        reasoning: `${matchedUsers.length} group members have specific dietary requirements.`,
        priority: 'high',
        personalizedFor: matchedUsers,
        matchedPreferences: ['dietaryRestrictions'],
        icon: <Utensils className="h-4 w-4" />,
        estimatedCost: 50
      });
    }

    // Budget-appropriate dining
    const budgetLevel = getMostCommonBudgetLevel(groupAnalysis.budgetRanges);
    if (budgetLevel) {
      suggestions.push({
        id: 'budget-dining',
        category: 'restaurant',
        title: `${budgetLevel} Budget Dining`,
        description: `Restaurant recommendations that fit your ${budgetLevel.toLowerCase()} budget preferences.`,
        reasoning: `Matched to your group's ${budgetLevel.toLowerCase()} budget preference.`,
        priority: 'medium',
        personalizedFor: allPreferences.map(p => p.userId),
        matchedPreferences: ['budgetRange'],
        icon: <Utensils className="h-4 w-4" />,
        estimatedCost: getBudgetEstimate(budgetLevel, 'dining')
      });
    }
  };

  const generateAccommodationSuggestions = (suggestions: PersonalizedSuggestion[], groupAnalysis: any, allPreferences: UserPreferences[]) => {
    const preferredAccommodation = getMostCommonAccommodationType(groupAnalysis.accommodationTypes);
    if (preferredAccommodation) {
      const matchedUsers = allPreferences
        .filter(prefs => prefs.accommodationType === preferredAccommodation)
        .map(prefs => prefs.userId);

      suggestions.push({
        id: 'accommodation-style',
        category: 'accommodation',
        title: `${preferredAccommodation} Recommendations`,
        description: `${preferredAccommodation} options in ${trip.destination} that match your group's preferences.`,
        reasoning: `${matchedUsers.length} group members prefer ${preferredAccommodation.toLowerCase()} accommodations.`,
        priority: 'high',
        personalizedFor: matchedUsers,
        matchedPreferences: ['accommodationType'],
        icon: <Hotel className="h-4 w-4" />,
        estimatedCost: getBudgetEstimate(getMostCommonBudgetLevel(groupAnalysis.budgetRanges) || 'Medium', 'accommodation')
      });
    }

    // Group size accommodation
    if (members.length > 4) {
      suggestions.push({
        id: 'group-accommodation',
        category: 'accommodation',
        title: 'Large Group Accommodations',
        description: `Spacious accommodations perfect for groups of ${members.length} people.`,
        reasoning: `Optimized for your group size of ${members.length} members.`,
        priority: 'medium',
        personalizedFor: allPreferences.map(p => p.userId),
        matchedPreferences: ['groupSize'],
        icon: <Hotel className="h-4 w-4" />
      });
    }
  };

  const generateBudgetSuggestions = (suggestions: PersonalizedSuggestion[], groupAnalysis: any, allPreferences: UserPreferences[]) => {
    const budgetLevel = getMostCommonBudgetLevel(groupAnalysis.budgetRanges);
    
    if (trip.budget && budgetLevel) {
      const perPersonBudget = trip.budget / members.length;
      const recommendedAllocation = getBudgetAllocation(budgetLevel);

      suggestions.push({
        id: 'budget-allocation',
        category: 'budget',
        title: 'Personalized Budget Breakdown',
        description: `Suggested budget allocation based on your ${budgetLevel.toLowerCase()} preferences: ${recommendedAllocation}`,
        reasoning: `Optimized for ${budgetLevel.toLowerCase()} travel style with $${perPersonBudget.toFixed(0)} per person.`,
        priority: 'medium',
        personalizedFor: allPreferences.map(p => p.userId),
        matchedPreferences: ['budgetRange'],
        icon: <DollarSign className="h-4 w-4" />
      });
    }
  };

  const generateTimingSuggestions = (suggestions: PersonalizedSuggestion[], _groupAnalysis: any, allPreferences: UserPreferences[]) => {
    // Planning style suggestions
    const planningStyles = allPreferences
      .map(p => p.planningStyle)
      .filter((style): style is NonNullable<typeof style> => Boolean(style));
    
    if (planningStyles.length > 0) {
      const mostCommonStyle = getMostCommon(planningStyles);
      const matchedUsers = allPreferences
        .filter(prefs => prefs.planningStyle === mostCommonStyle)
        .map(prefs => prefs.userId);

      const advice = getPlanningAdvice(mostCommonStyle);
      
      suggestions.push({
        id: 'planning-style',
        category: 'timing',
        title: `${mostCommonStyle} Planning Approach`,
        description: advice,
        reasoning: `${matchedUsers.length} group members prefer ${mostCommonStyle.toLowerCase()} planning.`,
        priority: 'low',
        personalizedFor: matchedUsers,
        matchedPreferences: ['planningStyle'],
        icon: <Clock className="h-4 w-4" />
      });
    }
  };

  // Helper functions
  const getEstimatedCostForActivity = (activityType: string): number => {
    const costMap: { [key: string]: number } = {
      'culture': 25, 'adventure': 75, 'relaxation': 40, 'food': 30, 
      'nature': 20, 'photography': 15, 'music': 35, 'shopping': 50,
      'history': 20, 'socializing': 40
    };
    return costMap[activityType.toLowerCase()] || 35;
  };

  const calculateAverageFitnessLevel = (fitnessLevels: Map<string, number>): string | null => {
    if (fitnessLevels.size === 0) return null;
    const entries = Array.from(fitnessLevels.entries());
    const mostCommon = entries.sort((a, b) => b[1] - a[1])[0];
    return mostCommon ? mostCommon[0] : null;
  };

  const getMostCommonBudgetLevel = (budgetRanges: Map<string, number>): string | null => {
    if (budgetRanges.size === 0) return null;
    const entries = Array.from(budgetRanges.entries());
    const mostCommon = entries.sort((a, b) => b[1] - a[1])[0];
    return mostCommon ? mostCommon[0] : null;
  };

  const getMostCommonAccommodationType = (accommodationTypes: Map<string, number>): string | null => {
    if (accommodationTypes.size === 0) return null;
    const entries = Array.from(accommodationTypes.entries());
    const mostCommon = entries.sort((a, b) => b[1] - a[1])[0];
    return mostCommon ? mostCommon[0] : null;
  };

  const getMostCommon = (items: string[]): string => {
    const frequency = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    return Object.entries(frequency).sort((a, b) => b[1] - a[1])[0][0];
  };

  const getBudgetEstimate = (budgetLevel: string, category: string): number => {
    const multipliers = {
      'Budget': { dining: 15, accommodation: 50 },
      'Low': { dining: 25, accommodation: 80 },
      'Medium': { dining: 40, accommodation: 120 },
      'High': { dining: 70, accommodation: 200 },
      'Luxury': { dining: 120, accommodation: 350 }
    };
    
    return multipliers[budgetLevel as keyof typeof multipliers]?.[category as keyof typeof multipliers.Budget] || 50;
  };

  const getBudgetAllocation = (budgetLevel: string): string => {
    const allocations = {
      'Budget': '40% accommodation, 30% food, 20% activities, 10% transport',
      'Low': '35% accommodation, 30% food, 25% activities, 10% transport',
      'Medium': '30% accommodation, 25% food, 30% activities, 15% transport',
      'High': '25% accommodation, 20% food, 40% activities, 15% transport',
      'Luxury': '20% accommodation, 15% food, 50% activities, 15% transport'
    };
    
    return allocations[budgetLevel as keyof typeof allocations] || 'Balanced allocation recommended';
  };

  const getPlanningAdvice = (planningStyle: string): string => {
    const advice = {
      'Detailed': 'Create detailed day-by-day itineraries with backup plans and reservations.',
      'Structured': 'Plan main activities but leave room for spontaneous discoveries.',
      'Loose': 'Set general goals but keep schedule flexible for unexpected opportunities.',
      'Spontaneous': 'Embrace the journey! Book essentials only and explore as you go.'
    };
    
    return advice[planningStyle as keyof typeof advice] || 'Plan according to your comfort level.';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'low': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const filteredSuggestions = selectedFilter === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedFilter);

  const categories = ['all', ...Array.from(new Set(suggestions.map(s => s.category)))];

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg">
            <Heart className="h-5 w-5 text-pink-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Personalized Recommendations
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Sparkles className="h-5 w-5 animate-pulse text-pink-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Creating personalized suggestions...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden max-w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 p-3 sm:p-6 border-b border-gray-200 dark:border-dark-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg flex-shrink-0">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                🎯 Hyperpersonalized Recommendations
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                Tailored suggestions based on your group's preferences
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {allPreferences.length} profiles
              </span>
            </div>
            
            {/* Bulk Add Button */}
            {filteredSuggestions.filter(s => s.priority === 'high' && !addedSuggestions.has(s.id)).length > 0 && (
              <button
                onClick={handleBulkAddSuggestions}
                disabled={bulkAdding}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all hover:shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkAdding ? (
                  <>
                    <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span className="hidden sm:inline">Adding...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Add Top 3</span>
                    <span className="sm:hidden">Add</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedFilter(category)}
              className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                selectedFilter === category
                  ? 'bg-pink-500 text-white'
                  : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-pink-900/10'
              }`}
            >
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="p-3 sm:p-6">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
            <Heart className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-sm sm:text-base">No personalized suggestions available</p>
            <p className="text-xs sm:text-sm">Add member preferences to get customized recommendations!</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 ${getPriorityColor(suggestion.priority)} transition-all hover:shadow-md max-w-full overflow-hidden`}
              >
                <div className="flex items-start gap-2 sm:gap-4">
                  <div className="p-1.5 sm:p-2 bg-white dark:bg-dark-surface rounded-lg shadow-sm flex-shrink-0">
                    {suggestion.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
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

                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <strong>Why this suggestion:</strong> {suggestion.reasoning}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {suggestion.personalizedFor.length} member{suggestion.personalizedFor.length > 1 ? 's' : ''}
                      </span>
                      {suggestion.estimatedCost && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${suggestion.estimatedCost}
                        </span>
                      )}
                      {suggestion.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {suggestion.duration}
                        </span>
                      )}
                      {suggestion.weatherDependent && (
                        <span className="flex items-center gap-1">
                          <Sun className="h-3 w-3" />
                          Weather dependent
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {suggestion.matchedPreferences.map(pref => (
                        <span
                          key={pref}
                          className="px-2 py-1 bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 text-xs rounded-md"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>

                    {/* Add to Trip Button */}
                    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        💡 Personalized for your group's preferences
                      </div>
                      <button
                        onClick={() => handleAddSuggestionToTrip(suggestion)}
                        disabled={addedSuggestions.has(suggestion.id)}
                        className={`flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all w-full sm:w-auto ${
                          addedSuggestions.has(suggestion.id)
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-sm hover:shadow-md transform hover:scale-105'
                        }`}
                      >
                        {addedSuggestions.has(suggestion.id) ? (
                          <>
                            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                            Added to Trip
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            Add to Trip
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Activity Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-dark-surface rounded-lg sm:rounded-xl shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
                <span className="truncate">Schedule: {showScheduleModal.title}</span>
              </h3>
              
              <div className="space-y-3 sm:space-y-4">
                {/* Date Selection */}
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

                {/* Time Selection */}
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
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Suggested optimal time based on activity type
                  </p>
                </div>

                {/* Cost Adjustment */}
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
                  <p className="text-xs text-gray-500 mt-1">
                    This will be added to your trip expenses
                  </p>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Any special requirements, booking notes, or preferences..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white resize-none text-sm"
                  />
                </div>

                {/* Activity Preview */}
                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-700">
                  <h4 className="text-sm font-medium text-pink-900 dark:text-pink-100 mb-2">
                    📋 Activity Preview
                  </h4>
                  <div className="text-xs space-y-1 text-pink-800 dark:text-pink-200">
                    <div><strong>Category:</strong> {showScheduleModal.category}</div>
                    <div><strong>Duration:</strong> {getDurationByCategory(showScheduleModal.category)}</div>
                    <div className="truncate"><strong>Matched Preferences:</strong> {showScheduleModal.matchedPreferences.slice(0, 3).join(', ')}</div>
                    {showScheduleModal.weatherDependent && (
                      <div className="flex items-center gap-1">
                        <Sun className="h-3 w-3" />
                        <span>Weather dependent activity</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                <button
                  onClick={confirmAddSuggestion}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300 font-medium text-sm"
                >
                  Add to Trip
                </button>
                <button
                  onClick={() => setShowScheduleModal(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
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

export default PersonalizedSuggestions;
