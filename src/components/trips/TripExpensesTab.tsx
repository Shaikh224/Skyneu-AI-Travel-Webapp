import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, Minus, Receipt, PieChart, Filter, Eye, X, FileText, Download } from 'lucide-react';
import { Trip, Expense, TripMember } from '../../types/trip';
import { tripService } from '../../services/tripService';
import { useAuth } from '../../contexts/AppwriteAuthContext';
import { userPreferencesService } from '../../lib/appwrite';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

interface TripExpensesTabProps {
  trip: Trip;
  expenses: Expense[];
  members: TripMember[];
  userRole: string;
  onRefresh: () => void;
}

interface ExpenseFormData {
  description: string;
  amount: number;
  category: 'food' | 'transport' | 'accommodation' | 'activity' | 'shopping' | 'business-meals' | 'client-entertainment' | 'business-transport' | 'business-accommodation' | 'other';
  participants: string[];
  splitType: 'equal' | 'custom' | 'percentage';
  customSplits: Record<string, number>;
  currency: string;
}

interface ExpenseSummary {
  totalExpenses: number;
  userOwed: number;
  userOwes: number;
  userBalance: number;
  categoryBreakdown: Record<string, number>;
  memberBalances: Record<string, number>;
  budgetUsage: number; // Percentage of budget used
  remainingBudget: number;
  overBudget: boolean;
}

const TripExpensesTab: React.FC<TripExpensesTabProps> = ({
  trip,
  expenses,
  members,
  userRole,
  onRefresh
}) => {
  const { user } = useAuth();
  const tripCurrency = trip.currency || 'USD'; // Default currency
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showExpenseDetail, setShowExpenseDetail] = useState<string | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'summary' | 'balances'>('list');
  const [budgetForm, setBudgetForm] = useState({
    totalBudget: trip.budget || 0,
    categoryBudgets: {
      food: 0,
      transport: 0,
      accommodation: 0,
      activity: 0,
      shopping: 0,
      other: 0
    }
  });
  
  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>({
    description: '',
    amount: 0,
    category: 'other',
    participants: [],
    splitType: 'equal',
    customSplits: {},
    currency: tripCurrency
  });

  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary>({
    totalExpenses: 0,
    userOwed: 0,
    userOwes: 0,
    userBalance: 0,
    categoryBreakdown: {},
    memberBalances: {},
    budgetUsage: 0,
    remainingBudget: 0,
    overBudget: false
  });

  const canEdit = ['owner', 'admin', 'co-admin', 'member'].includes(userRole);
  const canAddExpense = ['owner', 'admin', 'co-admin', 'member', 'viewer'].includes(userRole);

  // Function to identify and clean up AI-generated expenses
  const identifyAIGeneratedExpenses = () => {
    // Note: aiGenerated field is not available in database schema
    // All expenses are treated equally
    return [];
  };

  useEffect(() => {
    calculateExpenseSummary();
    // Identify AI-generated expenses on component mount
    identifyAIGeneratedExpenses();
  }, [expenses, members, user]);

  const calculateExpenseSummary = () => {
    if (!user) return;

    let totalExpenses = 0;
    let userOwed = 0;
    let userOwes = 0;
    const categoryBreakdown: Record<string, number> = {};
    const memberBalances: Record<string, number> = {};

    // Initialize member balances
    members.forEach(member => {
      memberBalances[member.userId] = 0;
    });

    expenses.forEach(expense => {
      // Include all expenses in budget calculations
      // Note: aiGenerated field is not available in database schema
      totalExpenses += expense.amount;
      
      // Category breakdown (include all expenses)
      const category = expense.category || 'other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + expense.amount;

      // Parse participants and splits
      const participants = JSON.parse(expense.participants || '[]');
      const splits = JSON.parse(expense.splits || '{}');

      // If user paid the expense
      if (expense.payerId === user.$id) {
        // User is owed the total amount minus their share
        const userShare = splits[user.$id] || 0;
        userOwed += (expense.amount - userShare);
        memberBalances[user.$id] += (expense.amount - userShare);
      }

      // Calculate what user owes
      if (participants.includes(user.$id)) {
        const userShare = splits[user.$id] || 0;
        if (expense.payerId !== user.$id) {
          userOwes += userShare;
          memberBalances[user.$id] -= userShare;
          memberBalances[expense.payerId] += userShare;
        }
      }
    });

    const userBalance = userOwed - userOwes;

    // Budget calculations
    const tripBudget = trip.budget || 0;
    const budgetUsage = tripBudget > 0 ? (totalExpenses / tripBudget) * 100 : 0;
    const remainingBudget = tripBudget - totalExpenses;
    const overBudget = totalExpenses > tripBudget && tripBudget > 0;

    setExpenseSummary({
      totalExpenses,
      userOwed,
      userOwes,
      userBalance,
      categoryBreakdown,
      memberBalances,
      budgetUsage,
      remainingBudget,
      overBudget
    });
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !['owner', 'admin'].includes(userRole)) return;

    try {
      await tripService.updateTrip(trip.$id!, {
        budget: budgetForm.totalBudget
      });
      toast.success('Budget updated successfully');
      setShowBudgetModal(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canAddExpense) return;

    if (expenseForm.participants.length === 0) {
      toast.error('Please select at least one participant');
      return;
    }

    try {
      let splits: Record<string, number> = {};

      if (expenseForm.splitType === 'equal') {
        const sharePerPerson = expenseForm.amount / expenseForm.participants.length;
        expenseForm.participants.forEach(participantId => {
          splits[participantId] = sharePerPerson;
        });
      } else if (expenseForm.splitType === 'custom') {
        splits = expenseForm.customSplits;
        const totalSplit = Object.values(splits).reduce((sum, amount) => sum + amount, 0);
        if (Math.abs(totalSplit - expenseForm.amount) > 0.01) {
          toast.error('Custom splits must equal the total amount');
          return;
        }
      }

      const payerId = user?.$id;
      if (!payerId) {
        toast.error('Unable to identify payer');
        return;
      }

      const expenseData = {
        tripId: trip.$id!,
        payerId: payerId,
        amount: expenseForm.amount,
        description: expenseForm.description,
        category: expenseForm.category,
        participants: JSON.stringify(expenseForm.participants),
        splits: JSON.stringify(splits),
        currency: expenseForm.currency
      };

      if (editingExpense) {
        // Update existing expense
        await tripService.updateExpense(editingExpense, expenseData);
        toast.success('Expense updated successfully');
      } else {
        // Create new expense
        await tripService.addExpense(expenseData);
        toast.success('Expense added successfully');
      }

      setShowAddExpense(false);
      setEditingExpense(null);
      setExpenseForm({
        description: '',
        amount: 0,
        category: 'other',
        participants: [],
        splitType: 'equal',
        customSplits: {},
        currency: tripCurrency
      });
      onRefresh();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!user || !canEdit) return;
    
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await tripService.deleteExpense(expenseId);
      toast.success('Expense deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    if (!user || !canEdit) return;
    
    const participants = JSON.parse(expense.participants || '[]');
    const splits = JSON.parse(expense.splits || '{}');
    
    setExpenseForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category || 'other',
      participants,
      splitType: 'equal', // Default to equal for simplicity
      customSplits: splits,
      currency: expense.currency || tripCurrency
    });
    
    setEditingExpense(expense.$id!);
    setShowAddExpense(true);
  };

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.userId === userId);
    return member?.name || member?.email || 'Unknown';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return '🍽️';
      case 'transport': return '🚗';
      case 'accommodation': return '🏨';
      case 'activity': return '🎯';
      case 'shopping': return '🛍️';
      case 'business-meals': return '🍽️💼';
      case 'client-entertainment': return '🎭💼';
      case 'business-transport': return '🚗💼';
      case 'business-accommodation': return '🏨💼';
      default: return '💰';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'transport': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'accommodation': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'activity': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'shopping': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'business-meals': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'client-entertainment': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
      case 'business-transport': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
      case 'business-accommodation': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    // Use the centralized currency utility
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback for custom currencies
      const symbol = currency === 'USD' ? '$' : currency;
      return `${symbol} ${amount.toFixed(2)}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredExpenses = expenses.filter(expense => {
    // Apply category filter
    if (filterCategory === 'all') return true;
    return expense.category === filterCategory;
  });

  const categories = ['all', 'food', 'transport', 'accommodation', 'activity', 'shopping', 'business-meals', 'client-entertainment', 'business-transport', 'business-accommodation', 'other'];

  const handleParticipantToggle = (userId: string) => {
    setExpenseForm(prev => {
      const participants = prev.participants.includes(userId)
        ? prev.participants.filter(id => id !== userId)
        : [...prev.participants, userId];

      // Reset custom splits when participants change
      const customSplits: Record<string, number> = {};
      if (prev.splitType === 'custom') {
        participants.forEach(id => {
          customSplits[id] = prev.customSplits[id] || 0;
        });
      }

      return {
        ...prev,
        participants,
        customSplits
      };
    });
  };


  const updateCustomSplit = (userId: string, amount: number) => {
    setExpenseForm(prev => ({
      ...prev,
      customSplits: {
        ...prev.customSplits,
        [userId]: amount
      }
    }));
  };

  const generateTripReport = async () => {
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
      doc.text('Trip Expense Report', 20, yPosition);
      
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
      doc.text(`${trip.destination} • ${trip.startDate} to ${trip.endDate}`, 20, yPosition);
      yPosition += 8;
      
      if (trip.budget && trip.budget > 0) {
        doc.text(`Budget: ${formatCurrency(trip.budget, trip.currency)}`, 20, yPosition);
        yPosition += 8;
      }
      
      ensureSpace(12);
      yPosition = addLine(yPosition, '#E2E8F0');

      // Expense Summary Section
      ensureSpace(48);
      yPosition = addSectionHeader('Expense Summary', yPosition);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#64748B');
      
      // Simple list format
      doc.text('Total Expenses:', 20, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#0EA5E9');
      doc.text(formatCurrency(expenseSummary.totalExpenses, trip.currency), pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#64748B');
      doc.text('You\'re Owed:', 20, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#10B981');
      doc.text(formatCurrency(expenseSummary.userOwed, trip.currency), pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#64748B');
      doc.text('You Owe:', 20, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#F59E0B');
      doc.text(formatCurrency(expenseSummary.userOwes, trip.currency), pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#64748B');
      doc.text('Your Balance:', 20, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(expenseSummary.userBalance >= 0 ? '#10B981' : '#EF4444');
      doc.text(formatCurrency(expenseSummary.userBalance, trip.currency), pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 15;
      
      ensureSpace(12);
      yPosition = addLine(yPosition, '#E2E8F0');

      // Category Breakdown Section
      ensureSpace(14);
      yPosition = addSectionHeader('Spending by Category', yPosition);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      Object.entries(expenseSummary.categoryBreakdown).forEach(([category, amount]) => {
        ensureSpace(12);
        const percentage = expenseSummary.totalExpenses > 0 ? (amount / expenseSummary.totalExpenses) * 100 : 0;
        const categoryName = category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        doc.setTextColor('#64748B');
        doc.text(`${categoryName}:`, 20, yPosition);
        
        doc.setTextColor('#1E293B');
        const amountText = `${formatCurrency(amount, trip.currency)} (${percentage.toFixed(1)}%)`;
        doc.text(amountText, pageWidth - 20, yPosition, { align: 'right' });
        
        yPosition += 10;
      });
      ensureSpace(12);
      yPosition = addLine(yPosition, '#E2E8F0');

      // Detailed Expenses Section
      ensureSpace(14);
      yPosition = addSectionHeader('Detailed Expenses', yPosition);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      expenses.forEach((expense, index) => {
        // Ensure space for each expense block
        ensureSpace(25);

        const participants = JSON.parse(expense.participants || '[]');
        const splits = JSON.parse(expense.splits || '{}');
        const payerName = getMemberName(expense.payerId);
        const categoryName = expense.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Other';
        
        // Expense item (simple list format)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#1E293B');
        doc.text(`${index + 1}. ${expense.description}`, 20, yPosition);
        
        // Amount (right aligned)
        doc.setTextColor('#0EA5E9');
        doc.text(formatCurrency(expense.amount, expense.currency), pageWidth - 20, yPosition, { align: 'right' });
        yPosition += 8;
        
        // Expense details
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#64748B');
        doc.text(`${categoryName} • Paid by: ${payerName} • ${formatDate(expense.createdAt!)}`, 25, yPosition);
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

      // Member Balances Section
      ensureSpace(12);
      yPosition = addLine(yPosition, '#E2E8F0');
      ensureSpace(14);
      yPosition = addSectionHeader('Member Balances', yPosition);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      members.forEach((member) => {
        ensureSpace(10);
        const balance = expenseSummary.memberBalances[member.userId] || 0;
        const memberName = member.name || member.email || 'Unknown';
        const isCurrentUser = member.userId === user.$id;
        
        // Member name
        doc.setTextColor('#1E293B');
        doc.text(memberName + (isCurrentUser ? ' (You)' : ''), 20, yPosition);
        
        // Balance
        const balanceText = balance > 0 ? `Is owed ${formatCurrency(balance, trip.currency)}` : 
                           balance < 0 ? `Owes ${formatCurrency(Math.abs(balance), trip.currency)}` : 
                           'Settled';
        const balanceColor = balance > 0 ? '#10B981' : balance < 0 ? '#EF4444' : '#64748B';
        
        doc.setTextColor(balanceColor);
        doc.text(balanceText, pageWidth - 20, yPosition, { align: 'right' });
        
        yPosition += 10;
      });

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
        doc.text('Business Expense Report', pageWidth / 2, pageHeight - 15, { align: 'center' });
      }

      // Save the PDF
      const fileName = `${trip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_expense_report.pdf`;
      doc.save(fileName);
      
      toast.success('Trip expense report generated successfully!');
    } catch (error) {
      console.error('Error generating trip report:', error);
      toast.error('Failed to generate trip report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Expenses Header */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Trip Expenses</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track and split expenses with your travel companions
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={generateTripReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Generate Report</span>
              <span className="sm:hidden">Report</span>
            </button>
            
            {canAddExpense && (
              <button
                onClick={() => setShowAddExpense(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Expense</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">Total</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(trip.budget || 0, tripCurrency)}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">You're Owed</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(expenseSummary.userOwed, tripCurrency)}
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">You Owe</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-orange-700 dark:text-orange-300">
              {formatCurrency(expenseSummary.userOwes, tripCurrency)}
            </div>
          </div>

          <div className={`p-3 sm:p-4 rounded-lg ${expenseSummary.userBalance >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              {expenseSummary.userBalance >= 0 ? (
                <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Minus className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span className={`text-xs sm:text-sm font-medium ${expenseSummary.userBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                Balance
              </span>
            </div>
            <div className={`text-lg sm:text-xl font-bold ${expenseSummary.userBalance >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {formatCurrency(Math.abs(expenseSummary.userBalance), tripCurrency)}
            </div>
          </div>
        </div>
      </div>

      {/* Budget Management - Hidden for viewers */}
      {userRole !== 'viewer' && (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budget Overview</h3>
            {['owner', 'admin'].includes(userRole) && (
              <button
                onClick={() => setShowBudgetModal(true)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Set Budget
              </button>
            )}
          </div>
        
        {trip.budget && trip.budget > 0 ? (
          <div className="space-y-4">
            {/* Budget Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Budget Progress</span>
                <span>{expenseSummary.budgetUsage.toFixed(1)}% used</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    expenseSummary.overBudget 
                      ? 'bg-red-500' 
                      : expenseSummary.budgetUsage > 80 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(expenseSummary.budgetUsage, 100)}%` }}
                ></div>
              </div>
            </div>
            
            {/* Budget Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(trip.budget, tripCurrency)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Budget</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(expenseSummary.totalExpenses, tripCurrency)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Spent</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold ${
                  expenseSummary.overBudget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {formatCurrency(Math.abs(expenseSummary.remainingBudget), tripCurrency)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {expenseSummary.overBudget ? 'Over Budget' : 'Remaining'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {expenseSummary.budgetUsage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Used</div>
              </div>
            </div>
            
            {expenseSummary.overBudget && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <span className="text-sm font-medium">⚠️ Budget Exceeded</span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  You've exceeded your budget by {formatCurrency(Math.abs(expenseSummary.remainingBudget), tripCurrency)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No budget set for this trip</p>
            {['owner', 'admin'].includes(userRole) && (
              <button
                onClick={() => setShowBudgetModal(true)}
                className="text-sm text-skyneu-blue hover:underline"
              >
                Set a budget to track spending
              </button>
            )}
          </div>
        )}
        </div>
      )}

      {/* View Controls */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Filter:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-dark-bg text-gray-700 dark:text-gray-300"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'list', label: 'List' },
              { id: 'summary', label: 'Summary' },
              { id: 'balances', label: 'Balances' }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setViewMode(view.id as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  viewMode === view.id
                    ? 'bg-skyneu-blue text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-skyneu-blue'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No expenses yet
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                Start tracking your trip expenses to split costs with your group
              </p>
              {canAddExpense && (
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add First Expense
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredExpenses.map((expense) => {
                const participants = JSON.parse(expense.participants || '[]');
                const splits = JSON.parse(expense.splits || '{}');
                const payerName = getMemberName(expense.payerId);
                
                return (
                  <div
                    key={expense.$id}
                    className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl">{getCategoryIcon(expense.category || 'other')}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {expense.description}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category || 'other')} whitespace-nowrap`}>
                              {expense.category}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <div>Paid by: <span className="font-medium">{payerName}</span></div>
                            <div>Split among: {participants.length} member{participants.length !== 1 ? 's' : ''}</div>
                            <div>Added: {formatDate(expense.createdAt!)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount, expense.currency)}
                        </div>
                        {expense.payerId === user?.$id ? (
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                            You paid
                          </div>
                        ) : participants.includes(user?.$id) ? (
                          <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                            You owe: {formatCurrency(splits[user?.$id || ''] || 0, expense.currency || tripCurrency)}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Not involved
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => setShowExpenseDetail(expense.$id!)}
                            className="inline-flex items-center gap-1 text-xs text-skyneu-blue hover:underline"
                          >
                            <Eye className="h-3 w-3" />
                            View Details
                          </button>
                          
                          {(expense.payerId === user?.$id || ['owner', 'admin'].includes(userRole)) && (
                            <>
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.$id!)}
                                className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                              >
                                🗑️ Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {viewMode === 'summary' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Spending by Category
            </h3>
            <div className="space-y-3">
              {Object.entries(expenseSummary.categoryBreakdown).map(([category, amount]) => {
                const percentage = expenseSummary.totalExpenses > 0 ? (amount / expenseSummary.totalExpenses) * 100 : 0;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryIcon(category)}</span>
                      <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                        {category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(amount, trip.currency)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget vs Spent - Hidden for viewers */}
          {userRole !== 'viewer' && (
            <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Budget Overview
            </h3>
            {trip.budget && trip.budget > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Budget:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(trip.budget, trip.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Spent:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(expenseSummary.totalExpenses, trip.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                  <span className={`font-bold ${
                    (trip.budget - expenseSummary.totalExpenses) >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(trip.budget - expenseSummary.totalExpenses, trip.currency)}
                  </span>
                </div>
                
                {/* Budget Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      expenseSummary.totalExpenses <= trip.budget
                        ? 'bg-gradient-to-r from-green-400 to-green-600'
                        : 'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{
                      width: `${Math.min((expenseSummary.totalExpenses / trip.budget) * 100, 100)}%`
                    }}
                  />
                </div>
                <div className="text-center text-sm text-gray-500">
                  {((expenseSummary.totalExpenses / trip.budget) * 100).toFixed(1)}% of budget used
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No budget set for this trip</p>
              </div>
            )}
            </div>
          )}
        </div>
      )}

      {viewMode === 'balances' && (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Member Balances
          </h3>
          <div className="space-y-3">
            {members.map((member) => {
              const balance = expenseSummary.memberBalances[member.userId] || 0;
              const isCurrentUser = member.userId === user?.$id;
              
              return (
                <div
                  key={member.userId}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-full flex items-center justify-center text-white font-medium">
                      {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {member.name || member.email}
                        {isCurrentUser && <span className="text-sm text-gray-500 ml-2">(You)</span>}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {member.role}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold ${
                      balance > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : balance < 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {balance > 0 ? '+' : ''}{formatCurrency(balance, trip.currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {balance > 0 ? 'Is owed' : balance < 0 ? 'Owes' : 'Settled'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add New Expense
              </h3>
              
              <form onSubmit={handleAddExpense} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                      required
                      placeholder="e.g., Dinner at restaurant"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      value={expenseForm.amount === 0 ? '' : expenseForm.amount}
                      onChange={(e) => setExpenseForm(prev => ({ 
                        ...prev, 
                        amount: e.target.value === '' ? 0 : Number(e.target.value) 
                      }))}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                    >
                      <optgroup label="Personal Expenses">
                        <option value="food">Food & Dining</option>
                        <option value="transport">Transportation</option>
                        <option value="accommodation">Accommodation</option>
                        <option value="activity">Activities</option>
                        <option value="shopping">Shopping</option>
                      </optgroup>
                      <optgroup label="Business Expenses">
                        <option value="business-meals">Business Meals</option>
                        <option value="client-entertainment">Client Entertainment</option>
                        <option value="business-transport">Business Transportation</option>
                        <option value="business-accommodation">Business Accommodation</option>
                      </optgroup>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Participants Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Who should split this expense? *
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {members.map((member) => (
                      <label
                        key={member.userId}
                        className="flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <input
                          type="checkbox"
                          checked={expenseForm.participants.includes(member.userId || '')}
                          onChange={() => handleParticipantToggle(member.userId || '')}
                          className="rounded border-gray-300"
                        />
                        <div className="w-8 h-8 bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.name || member.email}
                          {member.userId === user?.$id && <span className="text-gray-500"> (You)</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Split Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    How to split?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="equal"
                        checked={expenseForm.splitType === 'equal'}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, splitType: e.target.value as any }))}
                        className="text-skyneu-blue"
                      />
                      <span className="text-sm">Equal split</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="custom"
                        checked={expenseForm.splitType === 'custom'}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, splitType: e.target.value as any }))}
                        className="text-skyneu-blue"
                      />
                      <span className="text-sm">Custom amounts</span>
                    </label>
                  </div>
                </div>

                {/* Custom Split Inputs */}
                {expenseForm.splitType === 'custom' && expenseForm.participants.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom split amounts
                    </label>
                    <div className="space-y-2">
                      {expenseForm.participants.map((userId) => {
                        const member = members.find(m => m.userId === userId);
                        return (
                          <div key={userId} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {(member?.name || member?.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                              {member?.name || member?.email}
                            </span>
                            <input
                              type="number"
                              value={expenseForm.customSplits[userId] === 0 ? '' : expenseForm.customSplits[userId] || ''}
                              onChange={(e) => updateCustomSplit(userId, e.target.value === '' ? 0 : Number(e.target.value))}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                            />
                          </div>
                        );
                      })}
                      <div className="text-xs text-gray-500 mt-2">
                        Total: {formatCurrency(Object.values(expenseForm.customSplits).reduce((sum, amount) => sum + amount, 0), expenseForm.currency)} / {formatCurrency(expenseForm.amount, expenseForm.currency)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                  >
                    {editingExpense ? 'Update Expense' : 'Add Expense'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Expense Detail Modal */}
      {showExpenseDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              {(() => {
                const expense = expenses.find(e => e.$id === showExpenseDetail);
                if (!expense) return null;

                const participants = JSON.parse(expense.participants || '[]');
                const splits = JSON.parse(expense.splits || '{}');

                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Expense Details
                      </h3>
                      <button
                        onClick={() => setShowExpenseDetail(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getCategoryIcon(expense.category || 'other')}</div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {expense.description}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category || 'other')}`}>
                            {expense.category}
                          </span>
                        </div>
                      </div>

                      <div className="text-center py-4">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount, expense.currency)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Paid by {getMemberName(expense.payerId)} on {formatDate(expense.createdAt!)}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Split Details:</h5>
                        <div className="space-y-2">
                          {participants.map((userId: string) => (
                            <div key={userId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {getMemberName(userId)}
                                {userId === user?.$id && <span className="text-gray-500"> (You)</span>}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(splits[userId] || 0, expense.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Set Trip Budget</h3>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateBudget} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Budget ({tripCurrency})
                  </label>
                  <input
                    type="number"
                    value={budgetForm.totalBudget}
                    onChange={(e) => setBudgetForm(prev => ({ ...prev, totalBudget: Number(e.target.value) }))}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                    placeholder="Enter total budget"
                    required
                  />
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Budget Benefits</h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Track spending progress in real-time</li>
                    <li>• Get warnings when approaching budget limits</li>
                    <li>• Better expense planning and control</li>
                    <li>• Visual budget progress indicators</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripExpensesTab;
