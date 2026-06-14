import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, BarChart3, DollarSign, CheckCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useAuthSafe } from '@/contexts/AppwriteAuthContext';
import { UserPreferences } from '@/lib/appwrite';
import { tripService } from '@/services/tripService';
import { Trip, TripMember, TripActivity, ChecklistItem, Expense } from '@/types/trip';
import toast from 'react-hot-toast';

// Enhanced Components
import TripPlanningTab from '@/components/trips/TripPlanningTab';
import TripChecklistTab from '@/components/trips/TripChecklistTab';
import TripExpensesTab from '@/components/trips/TripExpensesTab';
import TripMembersTab from '@/components/trips/TripMembersTab';
import TripOverviewTab from '@/components/trips/TripOverviewTab';

interface TripDetailPageProps {
  tripId: string;
  onBack: () => void;
}

type TabType = 'overview' | 'planning' | 'checklist' | 'expenses' | 'members';

const TripDetailPage: React.FC<TripDetailPageProps> = ({ tripId, onBack }) => {
  const authContext = useAuthSafe();
  const user = authContext?.user;

  // Redirect if user is not authenticated
  useEffect(() => {
    if (authContext && !authContext.loading && !user) {
      console.log('User not authenticated, redirecting to trip planner');
      onBack();
    }
  }, [authContext, user, onBack]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [memberPreferences] = useState<{ [userId: string]: UserPreferences }>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [userRole, setUserRole] = useState<string>('member');

  // Trip calculations
  const [tripStats, setTripStats] = useState({
    totalDays: 0,
    remainingDays: 0,
    completedActivities: 0,
    totalBudget: 0,
    spentAmount: 0,
    checklistProgress: 0
  });

  useEffect(() => {
    // Force refresh on initial load to ensure we get the latest data
    loadTripData();
    
    // Set up automatic refresh with performance optimization
    const refreshInterval = setInterval(() => {
      if (!loading && document.visibilityState === 'visible') {
        // Use requestIdleCallback to avoid blocking main thread
        requestIdleCallback(() => {
          loadTripData(true); // Silent refresh to avoid loading spinners
        }, { timeout: 5000 });
      }
    }, Math.max(30000, 20000)); // Minimum 20s interval

    return () => clearInterval(refreshInterval);
  }, [tripId, user]);

  useEffect(() => {
    if (trip) {
      calculateTripStats();
    }
  }, [trip, activities, checklist, expenses]);

  // Enhanced loadTripData with optimistic updates support
  const loadTripData = async (silent = false) => {
    if (!user) {
      console.log('No user found, redirecting to trip planner');
      onBack();
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      
      // Load all trip data in parallel
      const [tripData, membersData, activitiesData, checklistData, expensesData] = await Promise.all([
        tripService.getTrip(tripId),
        tripService.getTripMembers(tripId),
        tripService.getTripActivities(tripId),
        tripService.getTripChecklist(tripId),
        tripService.getTripExpenses(tripId)
      ]);

      setTrip(tripData);
      setMembers(membersData);
      setActivities(activitiesData);
      setChecklist(checklistData);
      setExpenses(expensesData);
      
      // Debug logging for activities
      console.log(`📋 Loaded ${activitiesData.length} activities for trip ${tripId}:`, activitiesData);
      activitiesData.forEach((activity, index) => {
        console.log(`Activity ${index + 1}: ${activity.title} (${activity.date})`);
      });

      // Determine user role
      const userMember = membersData.find((m: any) => m.userId === user.$id);
      setUserRole(userMember?.role || 'member');

    } catch (error) {
      console.error('Error loading trip data:', error);
      if (!silent) {
        toast.error('Failed to load trip details');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const calculateTripStats = () => {
    if (!trip) return;

    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const now = new Date();

    // Calculate total days
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate remaining days
    const remainingDays = Math.max(0, Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Calculate completed activities
    const completedActivities = activities.filter(a => a.status === 'completed').length;

    // Calculate budget and expenses
    const totalBudget = trip.budget || 0;
    const spentAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate checklist progress
    const completedItems = checklist.filter(item => item.completed).length;
    const checklistProgress = checklist.length > 0 ? (completedItems / checklist.length) * 100 : 0;

    setTripStats({
      totalDays,
      remainingDays,
      completedActivities,
      totalBudget,
      spentAmount,
      checklistProgress
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'active': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'over': return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'checklist', label: 'Checklist', icon: CheckCircle },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'members', label: 'Members', icon: Users },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
        <Header />
        <main className="pt-20 sm:pt-24 pb-8 sm:pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-skyneu-blue"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
        <Header />
        <main className="pt-20 sm:pt-24 pb-8 sm:pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Trip not found</h2>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-4 py-2 bg-skyneu-blue text-white rounded-lg hover:bg-skyneu-blue/90 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Trips
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/10 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
      <Header />
      
      <main className="pt-20 sm:pt-24 pb-8 sm:pb-16 mt-4 sm:mt-6">
        <div className="container mx-auto px-4">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-skyneu-blue dark:hover:text-skyneu-blue transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Trips</span>
            </button>
          </div>

          {/* Trip Header */}
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {trip.title}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status || 'planning')}`}>
                    {(trip.status || 'planning').charAt(0).toUpperCase() + (trip.status || 'planning').slice(1)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(trip.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {trip.description && (
                  <p className="mt-3 text-gray-600 dark:text-gray-400">
                    {trip.description}
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:min-w-[400px]">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{tripStats.totalDays}</div>
                  <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Total Days</div>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{tripStats.remainingDays}</div>
                  <div className="text-xs text-orange-600/70 dark:text-orange-400/70">Days Left</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{tripStats.checklistProgress.toFixed(0)}%</div>
                  <div className="text-xs text-green-600/70 dark:text-green-400/70">Checklist</div>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    ${tripStats.spentAmount.toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-600/70 dark:text-purple-400/70">Spent</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
            <div className="flex overflow-x-auto scrollbar-hide tab-container">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-skyneu-blue text-skyneu-blue'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-skyneu-blue dark:hover:text-skyneu-blue'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {activeTab === 'overview' && (
              <TripOverviewTab
                trip={trip}
                members={members}
                activities={activities}
                checklist={checklist}
                expenses={expenses}
                stats={tripStats}
                userRole={userRole}
                onRefresh={loadTripData}
              />
            )}

            {activeTab === 'planning' && (
              <TripPlanningTab
                trip={trip}
                activities={activities}
                userRole={userRole}
                members={members}
                memberPreferences={memberPreferences}
                onRefresh={loadTripData}
              />
            )}

            {activeTab === 'checklist' && (
              <TripChecklistTab
                trip={trip}
                checklist={checklist}
                userRole={userRole}
                members={members}
                onRefresh={loadTripData}
              />
            )}

            {activeTab === 'expenses' && (
              <TripExpensesTab
                trip={trip}
                expenses={expenses}
                members={members}
                userRole={userRole}
                onRefresh={loadTripData}
              />
            )}

            {activeTab === 'members' && (
              <TripMembersTab
                trip={trip}
                members={members}
                userRole={userRole}
                memberPreferences={memberPreferences}
                onRefresh={loadTripData}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TripDetailPage;
