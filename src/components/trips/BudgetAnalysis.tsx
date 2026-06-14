import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, PieChart, RefreshCw, Target } from 'lucide-react';
import { Trip, TripActivity, Expense } from '../../types/trip';
import aiTripPlanningService from '../../services/aiTripPlanningService';

interface BudgetAnalysisProps {
  trip: Trip;
  activities: TripActivity[];
  expenses: Expense[];
  sonarApiKey?: string;
}

interface BudgetData {
  utilizationPercentage: number;
  categoryBreakdown: Record<string, number>;
  recommendations: string[];
}

// Cache for budget analysis
const budgetCache = new Map<string, { data: BudgetData, timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for budget data
const BUDGET_RATE_LIMIT = new Map<string, number>();
const RATE_LIMIT_DURATION = 3 * 60 * 1000; // 3 minutes between budget API calls

const BudgetAnalysis: React.FC<BudgetAnalysisProps> = ({ trip, activities, expenses, sonarApiKey }) => {
  const [budgetData, setBudgetData] = useState<BudgetData>({
    utilizationPercentage: 0,
    categoryBreakdown: {},
    recommendations: []
  });
  const [loading, setLoading] = useState(true);
  const [useAI] = useState(!!sonarApiKey);

  // Generate cache key for budget analysis
  const cacheKey = useMemo(() => {
    // Include all activities and expenses in cost calculation
    // Note: Since aiGenerated field is not available in database schema,
    // we'll include all activities and expenses in the budget analysis
    const userActivityCost = activities
      .reduce((sum, a) => sum + (a.cost || 0), 0);
    const userExpenseCost = expenses
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalUserCost = userActivityCost + userExpenseCost;
    return `${trip.destination}-${trip.budget}-${activities.length}-${expenses.length}-${totalUserCost}`;
  }, [trip.destination, trip.budget, activities, expenses]);

  // Check if we can use cached budget data
  const getCachedBudget = useCallback(() => {
    const cached = budgetCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, [cacheKey]);

  // Check rate limiting for budget API
  const canMakeBudgetCall = useCallback(() => {
    const lastCall = BUDGET_RATE_LIMIT.get(cacheKey);
    return !lastCall || (Date.now() - lastCall) > RATE_LIMIT_DURATION;
  }, [cacheKey]);

  useEffect(() => {
    loadBudgetAnalysis();
  }, [cacheKey, useAI]);

  const loadBudgetAnalysis = async (forceRefresh = false) => {
    // Skip cache if force refresh is requested
    if (!forceRefresh) {
      const cached = getCachedBudget();
      if (cached) {
        setBudgetData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    
    try {
      if (useAI && sonarApiKey && trip.budget && (forceRefresh || canMakeBudgetCall())) {
        // Record API call time
        BUDGET_RATE_LIMIT.set(cacheKey, Date.now());

        const analysis = await aiTripPlanningService.analyzeBudgetWithSonar(
          trip.budget,
          activities,
          expenses,
          trip.destination
        );

        // Cache the budget analysis
        budgetCache.set(cacheKey, { data: analysis, timestamp: Date.now() });
        setBudgetData(analysis);
      } else {
        // Fallback to basic analysis - include all activities and expenses
        const userActivitySpent = activities
          .reduce((sum, a) => sum + (a.cost || 0), 0);
        const userExpenseSpent = expenses
          .reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalUserSpent = userActivitySpent + userExpenseSpent;
        const utilizationPercentage = trip.budget ? (totalUserSpent / trip.budget) * 100 : 0;
        
        // Combine activity and expense categories (include all)
        const categoryBreakdown = activities
          .reduce((acc, a) => {
            acc[a.category] = (acc[a.category] || 0) + (a.cost || 0);
            return acc;
          }, {} as Record<string, number>);

        // Add expenses to category breakdown
        expenses
          .forEach(e => {
            const category = e.category || 'Other';
            categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (e.amount || 0);
          });

        const fallbackData = {
          utilizationPercentage,
          categoryBreakdown,
          recommendations: [
            'Track expenses to stay on budget',
            'Compare prices before booking',
            'Keep emergency fund reserve',
            'Look for free local activities'
          ]
        };

        setBudgetData(fallbackData);
      }
    } catch (error) {
      console.error('Error loading budget analysis:', error);
      // Fallback data
      setBudgetData({
        utilizationPercentage: 0,
        categoryBreakdown: {},
        recommendations: ['Unable to load budget analysis']
      });
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage <= 70) return 'text-green-600';
    if (percentage <= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUtilizationBgColor = (percentage: number) => {
    if (percentage <= 70) return 'bg-green-500';
    if (percentage <= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatCurrency = (amount: number) => {
    // Use the centralized currency utility
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    } catch (error) {
      // Fallback for custom currencies
      return `$ ${amount.toFixed(2)}`;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food': return '🍽️';
      case 'transport': return '🚗';
      case 'stay': return '🏨';
      case 'activity': return '🎯';
      case 'flight': return '✈️';
      default: return '💰';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Budget Analysis
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Analyzing your budget...
          </span>
        </div>
      </div>
    );
  }

  if (!trip.budget) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Budget Analysis
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No budget set for this trip.</p>
          <p className="text-sm">Add a budget to get AI-powered spending insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Budget Analysis
          </h3>
        </div>
        <button
          onClick={() => loadBudgetAnalysis(true)}
          className="p-2 text-gray-500 hover:text-green-600 transition-colors"
          title="Refresh analysis"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Budget</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(trip.budget)}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount Spent</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(Object.values(budgetData.categoryBreakdown).reduce((sum, amount) => sum + amount, 0))}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Budget Used</span>
            </div>
            <p className={`text-2xl font-bold ${getUtilizationColor(budgetData.utilizationPercentage)}`}>
              {budgetData.utilizationPercentage.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Budget Utilization</span>
            <span className={`font-medium ${getUtilizationColor(budgetData.utilizationPercentage)}`}>
              {budgetData.utilizationPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getUtilizationBgColor(budgetData.utilizationPercentage)}`}
              style={{ width: `${Math.min(budgetData.utilizationPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>$0</span>
            <span>{formatCurrency(trip.budget)}</span>
          </div>
        </div>

        {/* Activities vs Expenses Breakdown */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Spending Sources</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎯</span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Activities</span>
              </div>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(activities.reduce((sum, a) => sum + (a.cost || 0), 0))}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💳</span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Other Expenses</span>
              </div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(expenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(budgetData.categoryBreakdown).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Spending by Category</h4>
            <div className="space-y-3">
              {Object.entries(budgetData.categoryBreakdown).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getCategoryIcon(category)}</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(amount)}</span>
                    <div className="text-xs text-gray-500">
                      {trip.budget ? ((amount / trip.budget) * 100).toFixed(1) : 0}% of budget
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {budgetData.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              💡 Budget Optimization Tips
            </h4>
            <div className="space-y-2">
              {budgetData.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  {budgetData.utilizationPercentage > 90 ? (
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : budgetData.utilizationPercentage > 70 ? (
                    <TrendingUp className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Status Indicator */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {useAI ? 
              `💰 Sonar AI budget analysis ${getCachedBudget() ? '(cached)' : '(fresh)'}` : 
              '📊 Basic budget tracking'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default BudgetAnalysis;
