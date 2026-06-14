import React from 'react';
import { Calendar, MapPin, Users, DollarSign, CheckSquare, Star, TrendingUp, Clock, Target, FileText, Lock } from 'lucide-react';
import { Trip, TripMember, TripActivity, ChecklistItem, Expense } from '../../types/trip';
import { useAuth } from '../../contexts/AppwriteAuthContext';
import { useNavigate } from 'react-router-dom';
import { userPreferencesService } from '../../lib/appwrite';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import SmartSuggestions from './SmartSuggestions';
import WeatherInsights from './WeatherInsights';
import BudgetAnalysis from './BudgetAnalysis';

interface TripOverviewTabProps {
  trip: Trip;
  members: TripMember[];
  activities: TripActivity[];
  checklist: ChecklistItem[];
  expenses: Expense[];
  stats: {
    totalDays: number;
    remainingDays: number;
    completedActivities: number;
    totalBudget: number;
    spentAmount: number;
    checklistProgress: number;
  };
  userRole: string;
  onRefresh: () => void;
}

const TripOverviewTab: React.FC<TripOverviewTabProps> = ({
  trip,
  members,
  activities,
  checklist,
  expenses,
  stats,
  userRole}) => {
  const { user, subscriptionStatus } = useAuth();
  const isPremium = subscriptionStatus?.subscription === 'premium';
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    navigate('/flight-search');
    toast.success('Visit Flight Search to upgrade to Premium!');
  };

  const generateFullTripReport = async () => {
    if (!user) return;

    try {
      // Get user preferences to check if business traveler
      const userPrefs = await userPreferencesService.getUserPreferences(user.$id);
      const isBusinessTraveler = userPrefs?.businessTraveler || false;

      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to add text with word wrap
      const addText = (text: string, x: number, y: number, maxWidth?: number, fontSize: number = 12, color: string = '#000000') => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color);
        if (maxWidth) {
          const lines = doc.splitTextToSize(text, maxWidth);
          doc.text(lines, x, y);
          return y + (lines.length * (fontSize * 0.4));
        } else {
          doc.text(text, x, y);
          return y + (fontSize * 0.4);
        }
      };

      // Helper function to add line with Skyneu colors
      const addLine = (y: number, color: string = '#0EA5E9') => {
        doc.setLineWidth(1);
        doc.setDrawColor(color);
        doc.line(20, y, pageWidth - 20, y);
        return y + 8;
      };

      // Helper function to add section header
      const addSectionHeader = (text: string, y: number) => {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0EA5E9'); // Skyneu blue
        y = addText(text, 20, y);
        doc.setTextColor('#000000');
        return y + 5;
      };

      // Pagination helper - ensures there is vertical space, otherwise starts a new page
      const pageTop = 20;
      const pageBottom = 20;
      const ensureSpace = (requiredHeight: number = 10) => {
        if (yPosition + requiredHeight > pageHeight - pageBottom) {
          doc.addPage();
          yPosition = pageTop;
        }
      };

      // Add Skyneu Logo Header
      try {
        const logoResponse = await fetch('/img/skin2.png');
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });
        
        // Add logo - smaller and to the left
        const logoWidth = 30;
        const logoHeight = 30;
        doc.addImage(logoBase64 as string, 'PNG', 20, yPosition - 5, logoWidth, logoHeight);
        
        // Add text next to logo
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0EA5E9');
        doc.text('SKYNEU', 55, yPosition + 8);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#64748B');
        doc.text('AI Copilot for Travel', 55, yPosition + 18);
        
        yPosition += 35;
      } catch (error) {
        console.warn('Could not load logo:', error);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0EA5E9');
        doc.text('SKYNEU', 20, yPosition);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#64748B');
        doc.text('AI Copilot for Travel', 20, yPosition + 8);
        
        yPosition += 20;
      }

      // Title and business badge
      ensureSpace(18);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#1E293B');
      doc.text('Complete Trip Report', 20, yPosition);
      
      // Business badge on same line
      if (isBusinessTraveler) {
        doc.setFillColor('#0EA5E9');
        doc.roundedRect(140, yPosition - 5, 50, 10, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#FFFFFF');
        doc.text('BUSINESS', 143, yPosition + 2);
      }
      
      yPosition += 15;

      // Trip Information Section
      ensureSpace(30);
      yPosition = addSectionHeader('Trip Information', yPosition);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#1E293B');
      doc.text(`${trip.title}`, 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setTextColor('#64748B');
      doc.text(`${trip.destination} • ${formatDate(trip.startDate)} to ${formatDate(trip.endDate)}`, 20, yPosition);
      yPosition += 8;
      
      if (trip.budget && trip.budget > 0) {
        doc.text(`Budget: ${formatCurrency(trip.budget, trip.currency)}`, 20, yPosition);
        yPosition += 8;
      }
      
      if (trip.description) {
        doc.text(`Description: ${trip.description}`, 20, yPosition);
        yPosition += 8;
      }
      
      ensureSpace(12);
      yPosition = addLine(yPosition, '#E2E8F0');

      // Trip Members Section
      ensureSpace(14);
      yPosition = addSectionHeader('Trip Members', yPosition);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      members.forEach((member) => {
        ensureSpace(10);
        const isCurrentUser = member.userId === user.$id;
        doc.setTextColor('#1E293B');
        doc.text(`${member.name || member.email}${isCurrentUser ? ' (You)' : ''}`, 20, yPosition);
        doc.setTextColor('#64748B');
        doc.text(`Role: ${member.role}`, pageWidth - 20, yPosition, { align: 'right' });
        yPosition += 10;
      });
      
      ensureSpace(12);
      yPosition = addLine(yPosition, '#E2E8F0');

      // Trip Statistics Section
      ensureSpace(14);
      yPosition = addSectionHeader('Trip Statistics', yPosition);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#64748B');
      
      doc.text(`Total Days: ${stats.totalDays}`, 20, yPosition);
      doc.text(`Remaining Days: ${stats.remainingDays}`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 10;
      
      doc.text(`Activities: ${activities.length}`, 20, yPosition);
      doc.text(`Completed: ${stats.completedActivities}`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 10;
      
      doc.text(`Checklist Items: ${checklist.length}`, 20, yPosition);
      doc.text(`Progress: ${stats.checklistProgress.toFixed(0)}%`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 10;
      
      if (trip.budget) {
        doc.text(`Budget Used: ${formatCurrency(stats.spentAmount, trip.currency)}`, 20, yPosition);
        doc.text(`Remaining: ${formatCurrency(trip.budget - stats.spentAmount, trip.currency)}`, pageWidth - 20, yPosition, { align: 'right' });
        yPosition += 10;
      }
      
      ensureSpace(12);
      yPosition = addLine(yPosition, '#E2E8F0');

      // Activities Section
      ensureSpace(14);
      yPosition = addSectionHeader('Trip Activities', yPosition);

      if (activities.length === 0) {
        ensureSpace(10);
        doc.setFontSize(10);
        doc.setTextColor('#64748B');
        doc.text('No activities planned', 20, yPosition);
        yPosition += 10;
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        activities.forEach((activity, index) => {
          ensureSpace(20);
          const activityDate = new Date(activity.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          // Activity title
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor('#1E293B');
          doc.text(`${index + 1}. ${activity.title}`, 20, yPosition);
          
          // Activity date and status
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor('#64748B');
          doc.text(`${activityDate} • ${activity.status}`, 25, yPosition + 8);
          
          // Activity category and location
          if (activity.category) {
            doc.text(`Category: ${activity.category}`, 25, yPosition + 16);
          }
          if (activity.location) {
            doc.text(`Location: ${activity.location}`, 25, yPosition + 24);
          }
          
          yPosition += 30;
        });
      }
      
      ensureSpace(12);
      yPosition = addLine(yPosition, '#E2E8F0');

      // Checklist Section
      ensureSpace(14);
      yPosition = addSectionHeader('Trip Checklist', yPosition);

      if (checklist.length === 0) {
        ensureSpace(10);
        doc.setFontSize(10);
        doc.setTextColor('#64748B');
        doc.text('No checklist items', 20, yPosition);
        yPosition += 10;
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        checklist.forEach((item, index) => {
          ensureSpace(15);
          const status = item.completed ? '✓ Completed' : '○ Pending';
          const statusColor = item.completed ? '#10B981' : '#64748B';
          
          // Checklist item title
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor('#1E293B');
          doc.text(`${index + 1}. ${item.title}`, 20, yPosition);
          
          // Status and priority
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(statusColor);
          doc.text(status, 25, yPosition + 8);
          
          if (item.priority) {
            doc.setTextColor('#64748B');
            doc.text(`Priority: ${item.priority.toUpperCase()}`, pageWidth - 20, yPosition + 8, { align: 'right' });
          }
          
          if (item.dueDate) {
            doc.setTextColor('#64748B');
            doc.text(`Due: ${new Date(item.dueDate).toLocaleDateString()}`, 25, yPosition + 16);
          }
          
          yPosition += 20;
        });
      }
      
      ensureSpace(12);
      yPosition = addLine(yPosition, '#E2E8F0');

      // Expenses Section
      ensureSpace(14);
      yPosition = addSectionHeader('Trip Expenses', yPosition);

      if (expenses.length === 0) {
        ensureSpace(10);
        doc.setFontSize(10);
        doc.setTextColor('#64748B');
        doc.text('No expenses recorded', 20, yPosition);
        yPosition += 10;
      } else {
        // Calculate expense summary
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const userExpenses = expenses.filter(expense => {
          const participants = JSON.parse(expense.participants || '[]');
          return participants.includes(user.$id);
        });
        const userTotal = userExpenses.reduce((sum, expense) => {
          const splits = JSON.parse(expense.splits || '{}');
          return sum + (splits[user.$id] || 0);
        }, 0);

        // Expense summary
        ensureSpace(20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#64748B');
        
        doc.text('Total Expenses:', 20, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0EA5E9');
        doc.text(formatCurrency(totalExpenses, trip.currency), pageWidth - 20, yPosition, { align: 'right' });
        yPosition += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#64748B');
        doc.text('Your Share:', 20, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#10B981');
        doc.text(formatCurrency(userTotal, trip.currency), pageWidth - 20, yPosition, { align: 'right' });
        yPosition += 15;

        // Detailed expenses
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        expenses.forEach((expense, index) => {
          ensureSpace(20);
          const participants = JSON.parse(expense.participants || '[]');
          const splits = JSON.parse(expense.splits || '{}');
          const payerName = members.find(m => m.userId === expense.payerId)?.name || 'Unknown';
          const categoryName = expense.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Other';
          
          // Expense item
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor('#1E293B');
          doc.text(`${index + 1}. ${expense.description}`, 20, yPosition);
          
          // Amount
          doc.setTextColor('#0EA5E9');
          doc.text(formatCurrency(expense.amount, expense.currency), pageWidth - 20, yPosition, { align: 'right' });
          yPosition += 8;
          
          // Expense details
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor('#64748B');
          doc.text(`${categoryName} • Paid by: ${payerName} • ${new Date(expense.createdAt!).toLocaleDateString()}`, 25, yPosition);
          yPosition += 8;
          
          // Show user's share if they participated
          if (participants.includes(user.$id)) {
            const userShare = splits[user.$id] || 0;
            doc.setTextColor('#10B981');
            doc.text(`Your share: ${formatCurrency(userShare, expense.currency)}`, 25, yPosition);
            yPosition += 8;
          }
          
          yPosition += 5;
        });
      }

      // Footer Section
      ensureSpace(20);
      yPosition = addLine(yPosition, '#E2E8F0');
      
      // Simple footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#64748B');
      const reportDate = new Date().toLocaleDateString();
      const reportTime = new Date().toLocaleTimeString();
      doc.text(`Generated on ${reportDate} at ${reportTime}`, 20, pageHeight - 15);
      
      doc.setTextColor('#0EA5E9');
      doc.text('SKYNEU • AI Copilot for Travel', pageWidth - 20, pageHeight - 15, { align: 'right' });
      
      if (isBusinessTraveler) {
        doc.setFont('helvetica', 'italic');
        doc.text('Business Trip Report', pageWidth / 2, pageHeight - 15, { align: 'center' });
      }

      // Save the PDF
      const fileName = `${trip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_complete_trip_report.pdf`;
      doc.save(fileName);
      
      toast.success('Complete trip report generated successfully!');
    } catch (error) {
      console.error('Error generating complete trip report:', error);
      toast.error('Failed to generate complete trip report');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    // Use the centralized currency utility
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      // Fallback for custom currencies
      const symbol = currency === 'USD' ? '$' : currency;
      return `${symbol} ${amount.toFixed(2)}`;
    }
  };

  const getUpcomingActivities = () => {
    const now = new Date();
    return activities
      .filter(activity => new Date(activity.date) > now && activity.status !== 'cancelled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  };

  const getPendingChecklistItems = () => {
    return checklist
      .filter(item => !item.completed)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          const priorities = { high: 3, medium: 2, low: 1 };
          return (priorities[b.priority!] || 0) - (priorities[a.priority!] || 0);
        }
        return a.dueDate && b.dueDate ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : 0;
      })
      .slice(0, 5);
  };

  const getRecentExpenses = () => {
    return expenses
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 3);
  };

  const upcomingActivities = getUpcomingActivities();
  const pendingItems = getPendingChecklistItems();
  const recentExpenses = getRecentExpenses();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flight': return '✈️';
      case 'stay': return '🏨';
      case 'transport': return '🚗';
      case 'activity': return '🎯';
      case 'food': return '🍽️';
      default: return '💰';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Trip Progress Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDays}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Days</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {stats.remainingDays > 0 ? `${stats.remainingDays} days remaining` : 'Trip in progress'}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.checklistProgress.toFixed(0)}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Checklist</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.checklistProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{activities.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Activities</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {stats.completedActivities} completed
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.spentAmount, trip.currency)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Spent</div>
            </div>
          </div>
          {trip.budget && (
            <div className="text-xs text-gray-500">
              of {formatCurrency(trip.budget, trip.currency)} budget
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Activities */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Activities</h3>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>

          {upcomingActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming activities</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingActivities.map((activity) => (
                <div key={activity.$id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="text-lg">{getCategoryIcon(activity.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {activity.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(activity.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Checklist Items */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Tasks</h3>
            <CheckSquare className="h-5 w-5 text-green-500" />
          </div>

          {pendingItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">All tasks completed!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingItems.map((item) => (
                <div key={item.$id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    item.priority === 'high' ? 'bg-red-500' :
                    item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium ${getPriorityColor(item.priority!)}`}>
                        {item.priority?.toUpperCase()}
                      </span>
                      {item.dueDate && (
                        <span className="text-xs text-gray-500">
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Expenses</h3>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>

          {recentExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No expenses yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div key={expense.$id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">{getCategoryIcon(expense.category || '')}</div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {expense.description}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(expense.createdAt!).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(expense.amount, expense.currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trip Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Trip Information */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trip Information</h3>
            <button
              onClick={generateFullTripReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium text-sm"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Full Report</span>
              <span className="sm:hidden">Report</span>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Destination</div>
                <div className="font-medium text-gray-900 dark:text-white">{trip.destination}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Group Size</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {trip.budget && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Budget</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(trip.budget, trip.currency)}
                  </div>
                </div>
              </div>
            )}

            {trip.description && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description</div>
                <div className="text-gray-900 dark:text-white">{trip.description}</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Tips */}
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trip Progress</h3>
          
          <div className="space-y-4">
            {/* Days Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Days Progress</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.max(0, stats.totalDays - stats.remainingDays)}/{stats.totalDays}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(((stats.totalDays - stats.remainingDays) / stats.totalDays) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>

            {/* Activities Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Activities</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.completedActivities}/{activities.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${activities.length > 0 ? (stats.completedActivities / activities.length) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>

            {/* Budget Progress */}
            {trip.budget && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Budget Used</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {((stats.spentAmount / trip.budget) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      stats.spentAmount <= trip.budget 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min((stats.spentAmount / trip.budget) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}

            {/* Trip Status Indicator */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.remainingDays > 0 
                    ? `Trip starts in ${stats.remainingDays} day${stats.remainingDays !== 1 ? 's' : ''}`
                    : stats.remainingDays === 0
                    ? 'Trip starts today!'
                    : 'Trip is active'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Powered Smart Suggestions - Premium Feature */}
      {userRole !== 'viewer' && (
        <div className="mt-6">
          {isPremium ? (
            <SmartSuggestions 
              trip={trip}
              activities={activities}
              members={members}
              geminiApiKey={import.meta.env.VITE_GEMINI_API_KEY}
            />
          ) : (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 p-8">
              <div className="text-center">
                <Lock className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  AI Smart Suggestions - Premium Feature
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                  Get personalized AI-powered recommendations for activities, restaurants, and attractions based on your trip details.
                </p>
                <button 
                  onClick={handleUpgradeClick}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                >
                  <Lock className="h-4 w-4" />
                  Upgrade to Premium
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weather Insights - Premium Feature */}
      {userRole !== 'viewer' && (
        <div className="mt-6">
          {isPremium ? (
            <WeatherInsights 
              trip={trip}
              geminiApiKey={import.meta.env.VITE_GEMINI_API_KEY}
            />
          ) : (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 p-8">
              <div className="text-center">
                <Lock className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Weather Insights - Premium Feature
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                  Get detailed weather forecasts and AI-powered packing recommendations based on weather conditions at your destination.
                </p>
                <button 
                  onClick={handleUpgradeClick}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                >
                  <Lock className="h-4 w-4" />
                  Upgrade to Premium
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Budget Analysis - Premium Feature */}
      {userRole !== 'viewer' && (
        <div className="mt-6">
          {isPremium ? (
            <BudgetAnalysis 
              trip={trip}
              activities={activities}
              expenses={expenses}
              sonarApiKey={import.meta.env.VITE_SONAR_API_KEY}
            />
          ) : (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-dashed border-green-300 dark:border-green-700 p-8">
              <div className="text-center">
                <Lock className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Budget Analysis - Premium Feature
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                  Get AI-powered budget insights, spending patterns, and cost-saving recommendations for your trip.
                </p>
                <button 
                  onClick={handleUpgradeClick}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                >
                  <Lock className="h-4 w-4" />
                  Upgrade to Premium
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TripOverviewTab;
