import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Users, 
  Calendar, Target, Award, Zap, Activity, MessageSquare 
} from 'lucide-react';
import { Trip, TripActivity, TripMember, Expense } from '../../types/trip';

interface TripAnalyticsProps {
  trip: Trip;
  activities: TripActivity[];
  members: TripMember[];
  expenses: Expense[];
}

const TripAnalytics: React.FC<TripAnalyticsProps> = ({ trip, activities, members, expenses }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'engagement' | 'insights'>('overview');

  // Calculate various analytics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const avgExpensePerMember = members.length > 0 ? totalExpenses / members.length : 0;
  const budgetUtilization = trip.budget ? (totalExpenses / trip.budget) * 100 : 0;
  
  const activitiesByCategory = activities.reduce((acc, activity) => {
    acc[activity.category] = (acc[activity.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const completedActivities = activities.filter(a => a.status === 'completed').length;
  const completionRate = activities.length > 0 ? (completedActivities / activities.length) * 100 : 0;

  const tripProgress = () => {
    const now = new Date();
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    
    if (now < start) return { phase: 'Planning', progress: 0, daysRemaining: Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) };
    if (now > end) return { phase: 'Completed', progress: 100, daysRemaining: 0 };
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const progress = (elapsed / totalDuration) * 100;
    const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return { phase: 'Active', progress, daysRemaining };
  };

  const progress = tripProgress();

  const getEngagementScore = () => {
    const pollActivities = activities.filter(a => a.pollType).length;
    const totalVotes = activities.reduce((sum, activity) => {
      if (activity.votes) {
        try {
          const votes = JSON.parse(activity.votes);
          return sum + Object.keys(votes).length;
        } catch {
          return sum;
        }
      }
      return sum;
    }, 0);
    
    const avgVotesPerPoll = pollActivities > 0 ? totalVotes / pollActivities : 0;
    const memberParticipation = avgVotesPerPoll / members.length * 100;
    
    return Math.min(memberParticipation, 100);
  };

  const getPopularActivities = () => {
    return activities
      .filter(a => a.votes)
      .map(activity => {
        try {
          const votes = JSON.parse(activity.votes || '{}');
          const voteCount = Object.keys(votes).length;
          return { ...activity, voteCount };
        } catch {
          return { ...activity, voteCount: 0 };
        }
      })
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 5);
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Trip Progress</p>
              <p className="text-2xl font-bold">{Math.round(progress.progress)}%</p>
              <p className="text-blue-100 text-xs">{progress.phase}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Budget Used</p>
              <p className="text-2xl font-bold">{Math.round(budgetUtilization)}%</p>
              <p className="text-green-100 text-xs">${totalExpenses.toFixed(0)} spent</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Activities</p>
              <p className="text-2xl font-bold">{activities.length}</p>
              <p className="text-purple-100 text-xs">{completedActivities} completed</p>
            </div>
            <Activity className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Team Size</p>
              <p className="text-2xl font-bold">{members.length}</p>
              <p className="text-orange-100 text-xs">{getEngagementScore().toFixed(0)}% engaged</p>
            </div>
            <Users className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Trip Timeline
        </h3>
        
        <div className="relative">
          <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
          <div 
            className="absolute left-4 top-8 w-0.5 bg-gradient-to-b from-skyneu-blue to-skyneu-green transition-all duration-1000"
            style={{ height: `${progress.progress}%` }}
          ></div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                progress.phase !== 'Planning' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600'
              }`}>
                <Target className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Planning Phase</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Trip created and activities planned</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                progress.phase === 'Active' || progress.phase === 'Completed' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600'
              }`}>
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Active Trip</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {progress.phase === 'Active' ? `${progress.daysRemaining} days remaining` : 
                   progress.phase === 'Completed' ? 'Trip completed' : 
                   `Starts in ${progress.daysRemaining} days`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                progress.phase === 'Completed' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600'
              }`}>
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Trip Complete</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Memories created and shared</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const BudgetTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Budget Breakdown</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total Budget</span>
            <span className="font-semibold text-gray-900 dark:text-white">${trip.budget?.toFixed(2) || 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total Spent</span>
            <span className="font-semibold text-red-600">${totalExpenses.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Remaining</span>
            <span className={`font-semibold ${(trip.budget || 0) - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${((trip.budget || 0) - totalExpenses).toFixed(2)}
            </span>
          </div>
          
          {trip.budget && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  budgetUtilization > 100 ? 'bg-red-500' : 
                  budgetUtilization > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Per-Member Analysis</h3>
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">${avgExpensePerMember.toFixed(2)}</div>
          <div className="text-gray-600 dark:text-gray-400">Average per member</div>
        </div>
      </div>
    </div>
  );

  const EngagementTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Activities</h3>
        <div className="space-y-3">
          {getPopularActivities().map((activity, index) => (
            <div key={activity.$id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{activity.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{activity.category}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">{activity.voteCount} votes</div>
                <div className="text-xs text-gray-500">{Math.round((activity.voteCount / members.length) * 100)}% participation</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Engagement Score</h3>
        <div className="text-center">
          <div className="text-4xl font-bold text-skyneu-blue">{getEngagementScore().toFixed(0)}%</div>
          <div className="text-gray-600 dark:text-gray-400 mb-4">Team participation in polls</div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-full transition-all duration-500"
              style={{ width: `${getEngagementScore()}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );

  const InsightsTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Distribution</h3>
        <div className="space-y-3">
          {Object.entries(activitiesByCategory).map(([category, count]) => {
            const percentage = (count / activities.length) * 100;
            return (
              <div key={category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize text-gray-600 dark:text-gray-400">{category}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{count} activities</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Completion Rate</h3>
        <div className="text-center">
          <div className="text-4xl font-bold text-green-600">{completionRate.toFixed(0)}%</div>
          <div className="text-gray-600 dark:text-gray-400">{completedActivities} of {activities.length} activities completed</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Trip Analytics
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Insights and performance metrics for your trip
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'budget', label: 'Budget', icon: DollarSign },
            { id: 'engagement', label: 'Engagement', icon: MessageSquare },
            { id: 'insights', label: 'Insights', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-skyneu-blue border-b-2 border-skyneu-blue bg-skyneu-blue/5'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'budget' && <BudgetTab />}
          {activeTab === 'engagement' && <EngagementTab />}
          {activeTab === 'insights' && <InsightsTab />}
        </div>
      </div>
    </div>
  );
};

export default TripAnalytics;
