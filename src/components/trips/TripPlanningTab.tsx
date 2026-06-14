import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, Filter, Check, X, Star, AlertCircle, ExternalLink, TrendingUp, Shield, ChevronDown, ChevronUp, Bot, Sparkles, Brain, Edit3, Trash2, Lock } from 'lucide-react';
import { Trip, TripActivity, TripMember } from '../../types/trip';
import { UserPreferences } from '../../lib/appwrite';
import { tripService } from '../../services/tripService';
import { useAuthSafe } from '../../contexts/AppwriteAuthContext';
import { useNavigate } from 'react-router-dom';
import PersonalizedSuggestions from './PersonalizedSuggestions';
import SmartSuggestions from './SmartSuggestions';
import toast from 'react-hot-toast';

interface TripPlanningTabProps {
  trip: Trip;
  activities: TripActivity[];
  userRole: string;
  members?: TripMember[]; // Trip members for split calculation
  onRefresh: () => void;
  memberPreferences?: { [userId: string]: UserPreferences };
}

interface ActivityFormData {
  title: string;
  description: string;
  category: 'flight' | 'stay' | 'transport' | 'activity' | 'food' | 'other';
  date: string;
  time: string;
  location: string;
  cost: number;
  duration: string;
  maxParticipants?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
  bookingUrl?: string;
  bookingRequired: boolean;
  weatherDependent: boolean;
  tags: string[];
  pollType?: 'simple' | 'ranked' | 'multiple';
  pollOptions?: string[];
  splitCost: boolean;
}

const TripPlanningTab: React.FC<TripPlanningTabProps> = ({
  trip,
  activities,
  userRole,
  members = [],
  onRefresh,
  memberPreferences = {}
}) => {
  const authContext = useAuthSafe();
  const user = authContext?.user;
  const isPremium = authContext?.subscriptionStatus?.subscription === 'premium';
  const navigate = useNavigate();
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [showPersonalizedSuggestions, setShowPersonalizedSuggestions] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const [editingActivity, setEditingActivity] = useState<TripActivity | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleUpgradeClick = () => {
    navigate('/flight-search');
    toast.success('Visit Flight Search to upgrade to Premium!');
  };

  const [activityForm, setActivityForm] = useState<ActivityFormData>({
    title: '',
    description: '',
    category: 'activity',
    date: trip.startDate.split('T')[0],
    time: '09:00',
    location: '',
    cost: 0,
    duration: '2 hours',
    maxParticipants: undefined,
    difficulty: undefined,
    bookingUrl: '',
    bookingRequired: false,
    weatherDependent: false,
    tags: [],
    pollType: undefined,
    pollOptions: [],
    splitCost: false
  });


  // Calculate trip date range
  const tripStartDate = new Date(trip.startDate);
  const tripEndDate = new Date(trip.endDate);
  const today = new Date();
  
  // Generate array of trip dates
  const tripDates = [];
  for (let date = new Date(tripStartDate); date <= tripEndDate; date.setDate(date.getDate() + 1)) {
    tripDates.push(new Date(date));
  }

  const canEdit = ['owner', 'admin', 'co-admin'].includes(userRole);
  const canAddActivities = ['owner', 'admin', 'co-admin'].includes(userRole);
  const canVote = ['owner', 'admin', 'co-admin', 'member', 'viewer'].includes(userRole);

  // Vote on poll function
  const voteOnPoll = async (activityId: string, optionIndex: number, pollType: string) => {
    try {
      const activity = activities.find(a => a.$id === activityId);
      if (!activity) return;

      let currentVotes: { [key: string]: number[] } = {};
      try {
        currentVotes = activity.votes ? JSON.parse(activity.votes) : {};
      } catch (e) {
        currentVotes = {};
      }

      // Get user's current votes for this poll
      const voterId = user?.$id || '';
      const userVotes = currentVotes[voterId] || [];
      let newUserVotes = [...userVotes];

      if (pollType === 'simple') {
        // Simple poll: only one vote allowed
        newUserVotes = [optionIndex];
      } else if (pollType === 'multiple') {
        // Multiple choice: toggle vote
        if (newUserVotes.includes(optionIndex)) {
          newUserVotes = newUserVotes.filter(v => v !== optionIndex);
        } else {
          newUserVotes.push(optionIndex);
        }
      } else if (pollType === 'ranked') {
        // Ranked choice: cycle through rankings (1-3)
        const currentRank = newUserVotes.indexOf(optionIndex);
        if (currentRank === -1) {
          newUserVotes.push(optionIndex);
        } else {
          newUserVotes.splice(currentRank, 1);
        }
      }

      // Update votes object
      const updatedVotes = {
        ...currentVotes,
        [voterId]: newUserVotes
      };

          // Update activity with new votes
          await tripService.updateActivity(activityId, {
            votes: JSON.stringify(updatedVotes)
          });

      toast.success('Vote recorded!');
      onRefresh(); // Refresh to show updated votes
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to record vote');
    }
  };

  // Calculate vote counts for an option
  const getVoteCount = (activity: TripActivity, optionIndex: number): number => {
    if (!activity.votes) return 0;
    try {
      const votes: { [key: string]: number[] } = JSON.parse(activity.votes);
      return Object.values(votes).filter(userVotes => userVotes.includes(optionIndex)).length;
    } catch {
      return 0;
    }
  };

  // Check if current user has voted for an option
  const hasUserVoted = (activity: TripActivity, optionIndex: number): boolean => {
    if (!activity.votes) return false;

    try {
      const votes = JSON.parse(activity.votes);
      const voterId = user?.$id || '';
      const userVotes = votes[voterId] || [];
      return Array.isArray(userVotes) && userVotes.includes(optionIndex);
    } catch (e) {
      return false;
    }
  };

  // Get total votes for an activity
  const getTotalVotes = (activity: TripActivity): number => {
    if (!activity.votes) return 0;
    try {
      const votes: { [key: string]: number[] } = JSON.parse(activity.votes);
      return Object.keys(votes).length;
    } catch {
      return 0;
    }
  };


  useEffect(() => {
    // Set default date to trip start date
    setActivityForm(prev => ({
      ...prev,
      date: trip.startDate.split('T')[0]
    }));
  }, [trip.startDate]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canEdit) return;

    // Validate date is within trip range
    const activityDate = new Date(activityForm.date);
    if (activityDate < tripStartDate || activityDate > tripEndDate) {
      toast.error(`Activity date must be between ${tripStartDate.toDateString()} and ${tripEndDate.toDateString()}`);
      return;
    }

    // Validate poll options if poll type is selected
    if (activityForm.pollType && (!activityForm.pollOptions || activityForm.pollOptions.filter(opt => opt.trim().length > 0).length < 2)) {
      toast.error('Poll must have at least 2 options');
      return;
    }

    try {
      const activityData: Omit<TripActivity, '$id' | 'createdAt' | 'updatedAt'> = {
        tripId: trip.$id!,
        title: activityForm.title,
        description: activityForm.description,
        category: activityForm.category,
        date: `${activityForm.date}T${activityForm.time}:00`,
        location: activityForm.location,
        cost: activityForm.cost,
        duration: activityForm.duration,
        status: 'pending',
        addedBy: user.$id,
        // Note: aiGenerated field removed as it's not in database schema
        maxParticipants: activityForm.maxParticipants,
        difficulty: activityForm.difficulty,
        bookingUrl: activityForm.bookingUrl,
        bookingRequired: activityForm.bookingRequired,
        weatherDependent: activityForm.weatherDependent,
        tags: JSON.stringify(activityForm.tags),
        pollType: activityForm.pollType,
        pollOptions: activityForm.pollOptions && activityForm.pollOptions.filter(opt => opt.trim().length > 0).length > 0 ? JSON.stringify(activityForm.pollOptions.filter(opt => opt.trim().length > 0)) : undefined,
        votes: '{}', // Initialize empty votes object
        popularity: 0
      };

      await tripService.createActivity(activityData);

      // Only create expenses for activities added through the UI form (user-created)
      // AI-generated activities should not automatically create expenses
      if (activityForm.cost > 0) {
        try {
          const memberIds = members.map((member: any) => member.userId);
          const participantIds = activityForm.splitCost ? memberIds : [user.$id];
          const splitAmount = activityForm.splitCost ? activityForm.cost / memberIds.length : activityForm.cost;
          
          const expenseData = {
            tripId: trip.$id!,
            payerId: user.$id,
            amount: activityForm.cost,
            description: `${activityForm.title} - Activity Cost`,
            participants: JSON.stringify(participantIds),
            splits: JSON.stringify(Object.fromEntries(
              participantIds.map((id: string) => [id, splitAmount])
            )),
            category: (activityForm.category === 'food' ? 'food' : 
                      activityForm.category === 'transport' ? 'transport' :
                      activityForm.category === 'stay' ? 'accommodation' : 'activity') as 'food' | 'transport' | 'accommodation' | 'activity' | 'shopping' | 'other',
            currency: trip.currency || 'USD',
            // Note: aiGenerated field removed as it's not in database schema
          };
          
          await tripService.addExpense(expenseData);
          toast.success(`Activity added and expense ${activityForm.splitCost ? 'split among members' : 'assigned to you'}`);
        } catch (expenseError) {
          console.error('Error creating expense for activity:', expenseError);
          toast.success('Activity added (expense creation failed)');
        }
      } else {
        toast.success('Activity added successfully');
      }
      setShowAddActivity(false);
      setActivityForm({
        title: '',
        description: '',
        category: 'activity',
        date: trip.startDate.split('T')[0],
        time: '09:00',
        location: '',
        cost: 0,
        duration: '2 hours',
        maxParticipants: undefined,
        difficulty: undefined,
        bookingUrl: '',
        bookingRequired: false,
        weatherDependent: false,
        tags: [],
        pollType: undefined,
        pollOptions: [],
        splitCost: false
      });
      onRefresh();
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error('Failed to add activity');
    }
  };


  const updateActivityStatus = async (activityId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    if (!canEdit) return;

    try {
      await tripService.updateActivity(activityId, { status });
      toast.success(`Activity ${status}`);
      onRefresh();
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Failed to update activity');
    }
  };

  const handleEditActivity = (activity: TripActivity) => {
    if (!canEdit) return;
    
    const tags = activity.tags ? JSON.parse(activity.tags) : [];
    const pollOptions = activity.pollOptions ? JSON.parse(activity.pollOptions) : [];
    
    setActivityForm({
      title: activity.title,
      description: activity.description || '',
      category: activity.category,
      date: activity.date.split('T')[0],
      time: activity.date.split('T')[1]?.substring(0, 5) || '09:00',
      location: activity.location || '',
      cost: activity.cost || 0,
      duration: activity.duration || '2 hours',
      maxParticipants: activity.maxParticipants,
      difficulty: activity.difficulty,
      bookingUrl: activity.bookingUrl || '',
      bookingRequired: activity.bookingRequired || false,
      weatherDependent: activity.weatherDependent || false,
      tags: tags,
      pollType: activity.pollType,
      pollOptions: pollOptions,
      splitCost: false
    });
    
    setEditingActivity(activity);
    setShowAddActivity(true);
  };

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canEdit || !editingActivity) return;

    // Validate date is within trip range
    const activityDate = new Date(activityForm.date);
    if (activityDate < tripStartDate || activityDate > tripEndDate) {
      toast.error(`Activity date must be between ${tripStartDate.toDateString()} and ${tripEndDate.toDateString()}`);
      return;
    }

    try {
      const updateData: Partial<TripActivity> = {
        title: activityForm.title,
        description: activityForm.description,
        category: activityForm.category,
        date: `${activityForm.date}T${activityForm.time}:00`,
        location: activityForm.location,
        cost: activityForm.cost,
        duration: activityForm.duration,
        maxParticipants: activityForm.maxParticipants,
        difficulty: activityForm.difficulty,
        bookingUrl: activityForm.bookingUrl,
        bookingRequired: activityForm.bookingRequired,
        weatherDependent: activityForm.weatherDependent,
        tags: JSON.stringify(activityForm.tags),
        pollType: activityForm.pollType,
        pollOptions: activityForm.pollOptions && activityForm.pollOptions.filter(opt => opt.trim().length > 0).length > 0 ? JSON.stringify(activityForm.pollOptions.filter(opt => opt.trim().length > 0)) : undefined,
      };

      await tripService.updateActivity(editingActivity.$id!, updateData);

      toast.success('Activity updated successfully');
      setShowAddActivity(false);
      setEditingActivity(null);
      setActivityForm({
        title: '',
        description: '',
        category: 'activity',
        date: trip.startDate.split('T')[0],
        time: '09:00',
        location: '',
        cost: 0,
        duration: '2 hours',
        maxParticipants: undefined,
        difficulty: undefined,
        bookingUrl: '',
        bookingRequired: false,
        weatherDependent: false,
        tags: [],
        pollType: undefined,
        pollOptions: [],
        splitCost: false
      });
      onRefresh();
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Failed to update activity');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!canEdit) return;

    try {
      await tripService.deleteActivity(activityId);
      toast.success('Activity deleted successfully');
      setShowDeleteConfirm(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    }
  };

  const confirmDeleteActivity = (activityId: string) => {
    setShowDeleteConfirm(activityId);
  };

  const getActivityIcon = (category: string) => {
    switch (category) {
      case 'flight': return '✈️';
      case 'stay': return '🏨';
      case 'transport': return '🚗';
      case 'activity': return '🎯';
      case 'food': return '🍽️';
      default: return '📍';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'flight': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'stay': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'transport': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'activity': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'food': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };


  const filteredActivities = activities.filter(activity => {
    if (filterCategory === 'all') return true;
    return activity.category === filterCategory;
  });

  const activitiesByDate = filteredActivities.reduce((acc, activity) => {
    const date = activity.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, TripActivity[]>);

  // Sort activities by time within each date
  Object.keys(activitiesByDate).forEach(date => {
    activitiesByDate[date].sort((a, b) => a.date.localeCompare(b.date));
  });

  const isDateInPast = (dateString: string) => {
    const date = new Date(dateString);
    return date < today;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Role Permissions Info */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Your Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </span>
        </div>
        <div className="text-sm text-blue-700 dark:text-blue-300">
          {userRole === 'owner' && "You have full control over this trip's planning and management."}
          {userRole === 'admin' && "You can manage activities, tasks, and voting but cannot change trip ownership."}
          {userRole === 'co-admin' && "You can add activities, create tasks, and participate in voting."}
          {userRole === 'member' && "You can view all details and participate in voting on activities."}
        </div>
      </div>

      {/* Planning Header */}
      <div className="bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 rounded-xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          {/* Title and Description */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              🎯 Trip Planning
              <span className="text-base sm:text-lg font-normal text-gray-600 dark:text-gray-400 truncate">
                - {trip.title}
              </span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">
              📅 Plan activities within your trip dates: {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-gray-600 dark:text-gray-400">{activities.length} Activities</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span className="text-gray-600 dark:text-gray-400">
                  {Math.max(0, Math.ceil((new Date(trip.endDate).getTime() - Date.now()) / (1000*60*60*24)))} Days Remaining
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons - Stack on mobile */}
          {canAddActivities && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowAddActivity(true)}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium text-sm sm:text-base"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                Add Activity
              </button>
            </div>
          )}

          {/* Quick Stats Bar - Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white/50 dark:bg-dark-surface/50 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-center">
              <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                {activities.filter(a => a.status === 'pending').length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
            </div>
            <div className="bg-white/50 dark:bg-dark-surface/50 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-center">
              <div className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                {activities.filter(a => a.status === 'confirmed').length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Confirmed</div>
            </div>
            <div className="bg-white/50 dark:bg-dark-surface/50 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-center">
              <div className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400">
                {activities.filter(a => a.pollType).length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">With Polls</div>
            </div>
          </div>
        </div>

        {/* Trip Date Validation Alert */}
        {activities.some(a => {
          const activityDate = new Date(a.date);
          return activityDate < tripStartDate || activityDate > tripEndDate;
        }) && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                Some activities are scheduled outside your trip dates and may need to be adjusted.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Personalized Suggestions Section - Collapsible - Hidden for viewers */}
      {userRole !== 'viewer' && (
        <div className="space-y-4">
          {/* AI Suggestions Controls */}
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-purple/10 rounded-lg flex-shrink-0">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-skyneu-blue" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  AI Trip Suggestions
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Smart recommendations for your trip planning
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  if (!isPremium) {
                    handleUpgradeClick();
                  } else {
                    setShowPersonalizedSuggestions(!showPersonalizedSuggestions);
                  }
                }}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm relative ${
                  isPremium
                    ? 'bg-gradient-to-r from-skyneu-blue/10 to-skyneu-purple/10 hover:from-skyneu-blue/20 hover:to-skyneu-purple/20 border border-skyneu-blue/20 text-skyneu-blue'
                    : 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-400/20 text-gray-600 dark:text-gray-400'
                }`}
              >
                {!isPremium && (
                  <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 absolute -top-1 -right-1" />
                )}
                <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-medium">{isPremium ? 'Personalized' : 'Personalized (Premium)'}</span>
                {isPremium && (showPersonalizedSuggestions ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />)}
              </button>
              
              <button
                onClick={() => {
                  if (!isPremium) {
                    handleUpgradeClick();
                  } else {
                    setShowSmartSuggestions(!showSmartSuggestions);
                  }
                }}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm relative ${
                  isPremium
                    ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-400/20 text-gray-600 dark:text-gray-400'
                }`}
              >
                {!isPremium && (
                  <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 absolute -top-1 -right-1" />
                )}
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-medium">{isPremium ? 'AI Smart' : 'AI Smart (Premium)'}</span>
                {isPremium && (showSmartSuggestions ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />)}
              </button>
            </div>
          </div>
          
          {/* Suggestions Status Bar */}
          <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${showPersonalizedSuggestions ? 'bg-skyneu-blue' : 'bg-gray-300'}`}></div>
              <span>Personalized: {showPersonalizedSuggestions ? 'Expanded' : 'Collapsed'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${showSmartSuggestions ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
              <span>AI Smart: {showSmartSuggestions ? 'Expanded' : 'Collapsed'}</span>
            </div>
          </div>
        </div>

        {/* Collapsible Suggestions - Full width on mobile */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Personalized Suggestions */}
          <div className={`transition-all duration-300 ${showPersonalizedSuggestions && isPremium ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}`}>
            {showPersonalizedSuggestions && isPremium && (
              <PersonalizedSuggestions
                trip={trip}
                activities={activities}
                members={members}
                memberPreferences={memberPreferences}
                onRefresh={onRefresh}
              />
            )}
          </div>
          
          {/* Smart AI Suggestions */}
          <div className={`transition-all duration-300 ${showSmartSuggestions && isPremium ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}`}>
            {showSmartSuggestions && isPremium && (
              <SmartSuggestions
                trip={trip}
                activities={activities}
                members={members}
                geminiApiKey={import.meta.env.VITE_GEMINI_API_KEY}
                onRefresh={onRefresh}
              />
            )}
          </div>
        </div>
        </div>
      )}

      {/* Enhanced View Controls */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex flex-col space-y-4">
          {/* Top Row - Filter and Results */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Filter by:</span>
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-dark-bg text-gray-700 dark:text-gray-300 min-w-0"
              >
                <option value="all">All Categories ({activities.length})</option>
                <option value="flight">✈️ Flights ({activities.filter(a => a.category === 'flight').length})</option>
                <option value="stay">🏨 Accommodation ({activities.filter(a => a.category === 'stay').length})</option>
                <option value="transport">🚗 Transport ({activities.filter(a => a.category === 'transport').length})</option>
                <option value="activity">🎯 Activities ({activities.filter(a => a.category === 'activity').length})</option>
                <option value="food">🍽️ Food ({activities.filter(a => a.category === 'food').length})</option>
                <option value="other">📍 Other ({activities.filter(a => a.category === 'other').length})</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Showing:</span>
              <span className="font-medium text-skyneu-blue">
                {filteredActivities.length} of {activities.length} activities
              </span>
            </div>
          </div>

          {/* Bottom Row - View Mode and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'timeline'
                      ? 'bg-white dark:bg-dark-surface text-skyneu-blue shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-skyneu-blue'
                  }`}
                >
                  📅 Timeline
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'calendar'
                      ? 'bg-white dark:bg-dark-surface text-skyneu-blue shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-skyneu-blue'
                  }`}
                >
                  📊 Calendar
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
            </div>
          </div>
        </div>
      </div>

      {/* Activities Timeline/Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Activities Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Activities ({filteredActivities.length})
            </h3>
            {/* Mobile-friendly activity count */}
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {filteredActivities.length > 0 && (
                <span>{viewMode === 'timeline' ? 'Timeline View' : 'Calendar View'}</span>
              )}
            </div>
          </div>

          {viewMode === 'timeline' ? (
            // Timeline View
            tripDates.map(date => {
              const dateString = date.toISOString().split('T')[0];
              const dayActivities = activitiesByDate[dateString] || [];
              const isPastDate = isDateInPast(dateString);

              return (
                <div
                  key={dateString}
                  className={`bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden ${
                    isPastDate ? 'opacity-75' : ''
                  }`}
                >
                <div className={`p-4 border-b border-gray-100 dark:border-gray-800 ${
                  isPastDate ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-gradient-to-r from-skyneu-blue/5 to-skyneu-green/5'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {formatDate(dateString)}
                      {isPastDate && <span className="text-sm text-gray-500 ml-2">(Past)</span>}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {dayActivities.length} activity{dayActivities.length !== 1 ? 'ies' : ''}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {dayActivities.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm">No activities planned for this day</p>
                      {canEdit && !isPastDate && (
                        <button
                          onClick={() => {
                            setActivityForm(prev => ({ ...prev, date: dateString }));
                            setShowAddActivity(true);
                          }}
                          className="mt-2 text-xs text-skyneu-blue hover:underline"
                        >
                          Add activity
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayActivities.map((activity) => {
                        const tags = activity.tags ? JSON.parse(activity.tags) : [];
                        
                        return (
                          <div
                            key={activity.$id}
                            className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 space-y-3"
                          >
                            {/* Activity Header */}
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="text-base sm:text-lg flex-shrink-0">{getActivityIcon(activity.category)}</div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                  <div className="min-w-0 flex-1">
                                    <h5 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                                      {activity.title}
                                    </h5>
                                    {activity.description && (
                                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                        {activity.description}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(activity.category)}`}>
                                      {activity.category}
                                    </span>
                                    {activity.status === 'confirmed' && (
                                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
                                        Confirmed
                                      </span>
                                    )}
                                    {activity.status === 'completed' && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
                                        Completed
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Activity Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    <span>{formatTime(activity.date)}</span>
                                  </div>
                                  
                                  {activity.location && (
                                    <div className="flex items-center gap-1 min-w-0">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{activity.location}</span>
                                    </div>
                                  )}
                                  
                                  {activity.duration && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs">⏱️</span>
                                      <span>{activity.duration}</span>
                                    </div>
                                  )}
                                  
                                  {activity.cost && activity.cost > 0 && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs">💰</span>
                                      <span className="text-green-600 dark:text-green-400 font-medium">
                                        ${activity.cost}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Additional Details */}
                                {(activity.difficulty || activity.maxParticipants || activity.weatherDependent || tags.length > 0) && (
                                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    {activity.difficulty && (
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        activity.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                        activity.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                        activity.difficulty === 'hard' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                      }`}>
                                        {activity.difficulty}
                                      </span>
                                    )}
                                    
                                    {activity.maxParticipants && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs">
                                        Max: {activity.maxParticipants}
                                      </span>
                                    )}
                                    
                                    {activity.weatherDependent && (
                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded text-xs">
                                        Weather Dependent
                                      </span>
                                    )}
                                    
                                    {tags.map((tag: string, index: number) => (
                                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Booking Link */}
                                {activity.bookingUrl && (
                                  <div className="pt-2">
                                    <a
                                      href={activity.bookingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-sm text-skyneu-blue hover:underline"
                                    >
                                      <span>View Booking</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                )}

                                {/* Poll Section */}
                                {activity.pollType && activity.pollOptions && canVote && (
                                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="mb-2">
                                      <h6 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                        {activity.pollType === 'simple' ? '📊 Quick Poll' :
                                         activity.pollType === 'multiple' ? '🔘 Multiple Choice Poll' :
                                         activity.pollType === 'ranked' ? '🏆 Ranked Choice Poll' : '📋 Poll'}
                                      </h6>
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {activity.pollType === 'simple' ? 'Vote for your preference' :
                                           activity.pollType === 'multiple' ? 'Choose multiple options' :
                                           activity.pollType === 'ranked' ? 'Rank your preferences' :
                                           'Cast your vote'}
                                        </p>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {getTotalVotes(activity)} total votes
                                        </span>
                                      </div>
                                    </div>
                                    <div className="grid gap-2">
                                      {JSON.parse(activity.pollOptions).map((option: string, index: number) => {
                                        const voteCount = getVoteCount(activity, index);
                                        const totalVotes = getTotalVotes(activity);
                                        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                                        const userVoted = hasUserVoted(activity, index);
                                        
                                        return (
                                          <div
                                            key={index}
                                            className={`flex items-center justify-between p-2 rounded-md transition-all cursor-pointer border ${
                                              userVoted 
                                                ? 'bg-skyneu-blue/10 border-skyneu-blue/30 dark:bg-skyneu-blue/20' 
                                                : 'bg-gray-50 dark:bg-gray-800/50 border-transparent hover:border-skyneu-blue/20 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                            onClick={() => {
                                              if (activity.$id && activity.pollType) {
                                                voteOnPoll(activity.$id, index, activity.pollType);
                                              }
                                            }}
                                          >
                                            <div className="flex items-center gap-2">
                                              <div className={`w-2 h-2 rounded-full ${
                                                userVoted ? 'bg-skyneu-blue' : 'bg-gray-400'
                                              }`}></div>
                                              <span className={`text-sm ${
                                                userVoted 
                                                  ? 'text-skyneu-blue dark:text-skyneu-blue font-medium' 
                                                  : 'text-gray-700 dark:text-gray-300'
                                              }`}>
                                                {option}
                                                {activity.pollType === 'ranked' && userVoted && (
                                                  <span className="ml-1 text-xs opacity-75">
                                                    (Ranked)
                                                  </span>
                                                )}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-gray-500 min-w-[45px] text-right">
                                                {voteCount} vote{voteCount !== 1 ? 's' : ''}
                                              </span>
                                              <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                  className="h-full bg-skyneu-blue rounded-full transition-all duration-300" 
                                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                                ></div>
                                              </div>
                                              <span className="text-xs text-gray-400 min-w-[30px]">
                                                {Math.round(percentage)}%
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {activity.pollType === 'multiple' && (
                                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        💡 Click options to toggle your votes
                                      </div>
                                    )}
                                    {activity.pollType === 'ranked' && (
                                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        💡 Click to add/remove from your rankings
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                              {/* Activity Status */}
                              <div className="flex items-center gap-2">
                                {activity.popularity !== undefined && activity.popularity > 0 && (
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-orange-500" />
                                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                      Popular
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Status Controls for Admins */}
                              {canEdit && (
                                <div className="flex items-center gap-1">
                                  {/* Edit Button */}
                                  <button
                                    onClick={() => handleEditActivity(activity)}
                                    className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                    title="Edit Activity"
                                  >
                                    <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </button>
                                  
                                  {/* Delete Button */}
                                  <button
                                    onClick={() => confirmDeleteActivity(activity.$id!)}
                                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                    title="Delete Activity"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </button>
                                  
                                  {/* Status Controls */}
                                  {activity.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => updateActivityStatus(activity.$id!, 'confirmed')}
                                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                                        title="Confirm Activity"
                                      >
                                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </button>
                                      <button
                                        onClick={() => updateActivityStatus(activity.$id!, 'cancelled')}
                                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                        title="Cancel Activity"
                                      >
                                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </button>
                                    </>
                                  )}
                                  {activity.status === 'confirmed' && !isPastDate && (
                                    <button
                                      onClick={() => updateActivityStatus(activity.$id!, 'completed')}
                                      className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                      title="Mark as Completed"
                                    >
                                      <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
          ) : (
            // Calendar View
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const startDate = new Date(trip.startDate);
                  const endDate = new Date(trip.endDate);
                  const calendarStart = new Date(startDate);
                  calendarStart.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
                  
                  const calendarEnd = new Date(endDate);
                  calendarEnd.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday
                  
                  const calendarDays = [];
                  const currentDate = new Date(calendarStart);
                  
                  while (currentDate <= calendarEnd) {
                    const dateString = currentDate.toISOString().split('T')[0];
                    const dayActivities = activitiesByDate[dateString] || [];
                    const isInTripRange = currentDate >= startDate && currentDate <= endDate;
                    const isPast = currentDate < today;
                    
                    calendarDays.push(
                      <div
                        key={dateString}
                        className={`min-h-[80px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg ${
                          isInTripRange 
                            ? isPast 
                              ? 'bg-gray-50 dark:bg-gray-800' 
                              : 'bg-blue-50 dark:bg-blue-900/20'
                            : 'bg-gray-100 dark:bg-gray-900 opacity-50'
                        }`}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isInTripRange ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                        }`}>
                          {currentDate.getDate()}
                        </div>
                        {dayActivities.length > 0 && (
                          <div className="space-y-1">
                            {dayActivities.slice(0, 2).map((activity) => (
                              <div
                                key={activity.$id}
                                className="text-xs p-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded truncate"
                                title={activity.title}
                              >
                                {activity.title}
                              </div>
                            ))}
                            {dayActivities.length > 2 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                +{dayActivities.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                    
                    currentDate.setDate(currentDate.getDate() + 1);
                  }
                  
                  return calendarDays;
                })()}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Add/Edit Activity Modal */}
      {showAddActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-dark-surface rounded-lg sm:rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingActivity ? 'Edit Activity' : 'Add New Activity'}
              </h3>
              
              <form onSubmit={editingActivity ? handleUpdateActivity : handleAddActivity} className="space-y-3 sm:space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={activityForm.title}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={activityForm.category}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                    >
                      <option value="activity">Activity</option>
                      <option value="flight">Flight</option>
                      <option value="stay">Accommodation</option>
                      <option value="transport">Transport</option>
                      <option value="food">Food</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={activityForm.difficulty || ''}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, difficulty: e.target.value as any || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                    >
                      <option value="">Not specified</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="extreme">Extreme</option>
                    </select>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={activityForm.date}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, date: e.target.value }))}
                      min={trip.startDate.split('T')[0]}
                      max={trip.endDate.split('T')[0]}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={activityForm.time}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Location and Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={activityForm.location}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={activityForm.duration}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="2 hours"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Cost and Participants */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cost ($)
                    </label>
                    <input
                      type="number"
                      value={activityForm.cost === 0 ? '' : activityForm.cost}
                      onChange={(e) => setActivityForm(prev => ({ 
                        ...prev, 
                        cost: e.target.value === '' ? 0 : Number(e.target.value) 
                      }))}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={activityForm.maxParticipants || ''}
                      onChange={(e) => setActivityForm(prev => ({ 
                        ...prev, 
                        maxParticipants: e.target.value === '' ? undefined : Number(e.target.value) 
                      }))}
                      min="1"
                      placeholder="No limit"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Split Cost Option - Only show if cost > 0 */}
                {activityForm.cost > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="splitCost"
                        checked={activityForm.splitCost}
                        onChange={(e) => setActivityForm(prev => ({ ...prev, splitCost: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600"
                      />
                      <div>
                        <label htmlFor="splitCost" className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer">
                          Split cost among all trip members
                        </label>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          {activityForm.splitCost 
                            ? `Each member will pay $${members.length > 0 ? (activityForm.cost / members.length).toFixed(2) : activityForm.cost}` 
                            : 'Only you will be responsible for this expense'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Booking URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Booking URL
                  </label>
                  <input
                    type="url"
                    value={activityForm.bookingUrl}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, bookingUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={activityForm.tags.join(', ')}
                    onChange={(e) => setActivityForm(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                    }))}
                    placeholder="outdoor, adventure, family-friendly"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                  />
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="bookingRequired"
                      checked={activityForm.bookingRequired}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, bookingRequired: e.target.checked }))}
                      className="h-4 w-4 text-skyneu-blue focus:ring-skyneu-blue border-gray-300 rounded"
                    />
                    <label htmlFor="bookingRequired" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Booking Required
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="weatherDependent"
                      checked={activityForm.weatherDependent}
                      onChange={(e) => setActivityForm(prev => ({ ...prev, weatherDependent: e.target.checked }))}
                      className="h-4 w-4 text-skyneu-blue focus:ring-skyneu-blue border-gray-300 rounded"
                    />
                    <label htmlFor="weatherDependent" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Weather Dependent
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={activityForm.description}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                  />
                </div>

                {/* Poll Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Create Poll (Optional)
                  </label>
                  <select
                    value={activityForm.pollType || ''}
                    onChange={(e) => {
                      const pollType = e.target.value as any || undefined;
                      let defaultOptions: string[] = [];
                      
                      if (pollType) {
                        // Generate default options based on activity category and poll type
                        if (activityForm.category === 'food') {
                          defaultOptions = ['Italian Restaurant', 'Local Street Food', 'Fine Dining', 'Casual Cafe'];
                        } else if (activityForm.category === 'activity') {
                          defaultOptions = ['Morning Time', 'Afternoon Time', 'Evening Time'];
                        } else if (activityForm.category === 'transport') {
                          defaultOptions = ['Public Transport', 'Taxi/Uber', 'Rental Car', 'Walking'];
                        } else if (activityForm.category === 'stay') {
                          defaultOptions = ['Hotel Option A', 'Hotel Option B', 'Airbnb', 'Hostel'];
                        } else {
                          defaultOptions = ['Option A', 'Option B', 'Option C'];
                        }
                      }
                      
                      setActivityForm(prev => ({ 
                        ...prev, 
                        pollType,
                        pollOptions: pollType ? defaultOptions : []
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                  >
                    <option value="">No Poll</option>
                    <option value="simple">📊 Simple Vote (Choose one)</option>
                    <option value="multiple">🔘 Multiple Choice (Choose many)</option>
                    <option value="ranked">🏆 Ranked Choice (Rank preferences)</option>
                  </select>
                  
                  {activityForm.pollType && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Poll Options
                        </span>
                        <span className="text-xs text-gray-500">
                          {activityForm.pollType === 'simple' ? 'Members will choose one option' :
                           activityForm.pollType === 'multiple' ? 'Members can choose multiple options' :
                           'Members will rank options by preference'}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <textarea
                          value={activityForm.pollOptions?.join('\n') || ''}
                          onChange={(e) => {
                            // Store the raw value and split into lines, but don't filter yet
                            // This allows users to type on new lines and see their input
                            const lines = e.target.value.split('\n');
                            setActivityForm(prev => ({ 
                              ...prev, 
                              pollOptions: lines
                            }));
                          }}
                          onKeyDown={(e) => {
                            // Prevent form submission when Enter is pressed in textarea
                            if (e.key === 'Enter') {
                              e.stopPropagation();
                            }
                          }}
                          onBlur={() => {
                            // When user finishes editing, filter out empty lines
                            setActivityForm(prev => ({ 
                              ...prev, 
                              pollOptions: prev.pollOptions?.filter(line => line.trim().length > 0) || []
                            }));
                          }}
                          placeholder={`Enter poll options (one per line):\n\nExample for ${activityForm.category}:\n${
                            activityForm.category === 'food' ? 'Italian Restaurant\nLocal Street Food\nFine Dining\nCasual Cafe' :
                            activityForm.category === 'activity' ? 'Morning Time (9-12 PM)\nAfternoon Time (1-5 PM)\nEvening Time (6-9 PM)' :
                            activityForm.category === 'transport' ? 'Public Transport\nTaxi/Uber\nRental Car\nWalking' :
                            activityForm.category === 'stay' ? 'Hotel Option A\nHotel Option B\nAirbnb\nHostel' :
                            'Option A - Description\nOption B - Description\nOption C - Description'
                          }`}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white text-sm resize-none"
                        />
                        
                        {/* Option counter and validation */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-4">
                            <span className={`${
                              (activityForm.pollOptions?.filter(opt => opt.trim().length > 0).length || 0) >= 2 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {activityForm.pollOptions?.filter(opt => opt.trim().length > 0).length || 0} options
                              {(activityForm.pollOptions?.filter(opt => opt.trim().length > 0).length || 0) < 2 && ' (minimum 2 required)'}
                            </span>
                            {activityForm.pollType === 'ranked' && (activityForm.pollOptions?.filter(opt => opt.trim().length > 0).length || 0) > 5 && (
                              <span className="text-amber-600 dark:text-amber-400">
                                Consider limiting to 5 options for better ranking
                              </span>
                            )}
                          </div>
                          <span className="text-gray-500">
                            Press Enter for new option
                          </span>
                        </div>
                        
                        {/* Quick add buttons for common options */}
                        {activityForm.category === 'activity' && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-gray-500 mr-2">Quick add:</span>
                            {['Morning', 'Afternoon', 'Evening', 'Anytime'].map(time => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => {
                                  const newOption = `${time} Time`;
                                  const currentOptions = activityForm.pollOptions || [];
                                  if (!currentOptions.includes(newOption)) {
                                    setActivityForm(prev => ({
                                      ...prev,
                                      pollOptions: [...currentOptions, newOption]
                                    }));
                                  }
                                }}
                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 transition-colors"
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {activityForm.category === 'food' && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-gray-500 mr-2">Quick add:</span>
                            {['Local Cuisine', 'International', 'Street Food', 'Fine Dining', 'Casual'].map(type => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  const currentOptions = activityForm.pollOptions || [];
                                  if (!currentOptions.includes(type)) {
                                    setActivityForm(prev => ({
                                      ...prev,
                                      pollOptions: [...currentOptions, type]
                                    }));
                                  }
                                }}
                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 transition-colors"
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          <div className="font-medium mb-1">💡 Polling Tips:</div>
                          <ul className="space-y-1 text-xs">
                            <li>• Be specific with options (e.g., "Italian Restaurant on Main St" vs "Restaurant")</li>
                            <li>• Include relevant details like time, location, or price range</li>
                            <li>• {activityForm.pollType === 'simple' ? 'Keep it simple with 2-4 clear choices' :
                                 activityForm.pollType === 'multiple' ? 'Multiple options work well for preferences' :
                                 'Limit to 3-5 options for effective ranking'}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium text-sm sm:text-base"
                  >
                    {editingActivity ? 'Update Activity' : 'Add Activity'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddActivity(false);
                      setEditingActivity(null);
                      setActivityForm({
                        title: '',
                        description: '',
                        category: 'activity',
                        date: trip.startDate.split('T')[0],
                        time: '09:00',
                        location: '',
                        cost: 0,
                        duration: '2 hours',
                        maxParticipants: undefined,
                        difficulty: undefined,
                        bookingUrl: '',
                        bookingRequired: false,
                        weatherDependent: false,
                        tags: [],
                        pollType: undefined,
                        pollOptions: [],
                        splitCost: false
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Delete Activity
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this activity? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteActivity(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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

export default TripPlanningTab;
