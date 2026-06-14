import React, { useState } from 'react';
import { Plus, Check, X, AlertCircle, Calendar, Filter, CheckCircle, Circle, Star, Clock, Sparkles, Loader2 } from 'lucide-react';
import { Trip, ChecklistItem, TripMember } from '../../types/trip';
import { tripService } from '../../services/tripService';
import { useAuthSafe } from '../../contexts/AppwriteAuthContext';
import { aiChecklistService, ChecklistGenerationRequest } from '../../services/aiChecklistService';
import toast from 'react-hot-toast';

interface TripChecklistTabProps {
  trip: Trip;
  checklist: ChecklistItem[];
  userRole: string;
  members?: TripMember[];
  onRefresh: () => void;
}

interface ChecklistFormData {
  title: string;
  description: string;
  category: 'preparation' | 'packing' | 'travel' | 'accommodation' | 'activities' | 'documents' | 'health' | 'other';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
}

const TripChecklistTab: React.FC<TripChecklistTabProps> = ({
  trip,
  checklist,
  userRole,
  members = [],
  onRefresh
}) => {
  const authContext = useAuthSafe();
  const user = authContext?.user;
  const isPremium = authContext?.subscriptionStatus?.subscription === 'premium';
  const [showAddItem, setShowAddItem] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);

  const [checklistForm, setChecklistForm] = useState<ChecklistFormData>({
    title: '',
    description: '',
    category: 'preparation',
    priority: 'medium',
    dueDate: ''
  });

  const canEdit = ['owner', 'admin', 'co-admin'].includes(userRole);

  const handleGenerateAIChecklist = async () => {
    if (!user) {
      toast.error('Please log in to generate AI checklist');
      return;
    }

    if (!isPremium) {
      toast.error('AI Checklist generation is a Premium feature. Upgrade to unlock!', {
        duration: 4000,
        icon: '🔒',
      });
      return;
    }

    setIsGeneratingChecklist(true);
    
    try {
      // Prepare request data
      const request: ChecklistGenerationRequest = {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        travelers: trip.memberCount || 1,
        tripType: 'leisure', // Default since Trip doesn't have tripType
        activities: [], // Activities are separate, not part of Trip object
        accommodation: 'hotel', // Default since Trip doesn't have accommodation
        budget: trip.budget || 0,
        currency: trip.currency || 'USD'
      };


      
      const response = await aiChecklistService.generateChecklist(request);
      
      if (response.success && response.items) {

        
        // Save each item to the database
        let savedCount = 0;
        for (const item of response.items) {
          try {
            await tripService.createChecklistItem({
              tripId: trip.$id!,
              title: item.title,
              description: item.description,
              category: item.category,
              priority: item.priority,
              dueDate: item.dueDate,
              completed: false,
              assignedTo: user.$id
            });
            savedCount++;
          } catch (error) {

          }
        }
        
        toast.success(`Generated and added ${savedCount} checklist items!`);
        onRefresh();
      } else {
        toast.error(response.error || 'Failed to generate checklist');

      }
    } catch (error) {

      toast.error('Failed to generate AI checklist. Please try again.');
    } finally {
      setIsGeneratingChecklist(false);
    }
  };

  const categories = [
    { value: 'preparation', label: 'Preparation', icon: '📋', color: 'blue' },
    { value: 'packing', label: 'Packing', icon: '🎒', color: 'purple' },
    { value: 'travel', label: 'Travel', icon: '✈️', color: 'sky' },
    { value: 'accommodation', label: 'Accommodation', icon: '🏨', color: 'emerald' },
    { value: 'activities', label: 'Activities', icon: '🎯', color: 'orange' },
    { value: 'documents', label: 'Documents', icon: '📄', color: 'red' },
    { value: 'health', label: 'Health & Safety', icon: '🏥', color: 'pink' },
    { value: 'other', label: 'Other', icon: '📌', color: 'gray' }
  ];

  const priorityConfig = {
    high: { label: 'High', color: 'red', icon: AlertCircle },
    medium: { label: 'Medium', color: 'yellow', icon: Clock },
    low: { label: 'Low', color: 'green', icon: Circle }
  };

  const handleAddChecklistItem = async () => {
    if (!user || !checklistForm.title.trim()) {
      toast.error('Please fill in the required fields');
      return;
    }

    try {
      await tripService.createChecklistItem({
        tripId: trip.$id!,
        title: checklistForm.title,
        description: checklistForm.description,
        category: checklistForm.category,
        priority: checklistForm.priority,
        dueDate: checklistForm.dueDate || undefined,
        completed: false,
        assignedTo: user.$id
      });

      setChecklistForm({
        title: '',
        description: '',
        category: 'preparation',
        priority: 'medium',
        dueDate: ''
      });
      setShowAddItem(false);
      onRefresh();
      toast.success('Checklist item added successfully');
    } catch (error) {

      toast.error('Failed to add checklist item');
    }
  };

  const handleToggleChecklistItem = async (itemId: string, currentCompleted: boolean) => {
    if (!user) return;

    try {
      const newCompleted = !currentCompleted;
      await tripService.updateChecklistItem(itemId, {
        completed: newCompleted,
        assignedTo: newCompleted ? user.$id : undefined
      });
      onRefresh();
      toast.success(`Item marked as ${newCompleted ? 'completed' : 'pending'}`);
    } catch (error) {

      toast.error('Failed to update checklist item');
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!canEdit) return;

    try {
      await tripService.deleteChecklistItem(itemId);
      onRefresh();
      toast.success('Checklist item deleted');
    } catch (error) {

      toast.error('Failed to delete checklist item');
    }
  };

  // Filter checklist items
  const filteredChecklist = checklist.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'completed' && !item.completed) return false;
      if (filterStatus === 'pending' && item.completed) return false;
    }
    return true;
  });

  // Group checklist items by category
  const groupedChecklist = categories.reduce((acc, category) => {
    acc[category.value] = filteredChecklist.filter(item => item.category === category.value);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  // Calculate progress
  const totalItems = checklist.length;
  const completedItems = checklist.filter(item => item.completed).length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Trip Checklist</h2>
            <p className="text-gray-600 dark:text-gray-400">Keep track of everything you need for your trip</p>
          </div>
          {canEdit && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGenerateAIChecklist}
                disabled={isGeneratingChecklist}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  isPremium 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg' 
                    : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:shadow-md relative'
                }`}
              >
                {!isPremium && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500">🔒</span>
                  </span>
                )}
                {isGeneratingChecklist ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isGeneratingChecklist ? 'Generating...' : !isPremium ? 'AI Checklist (Premium)' : 'Generate with AI'}
                </span>
                <span className="sm:hidden">
                  {isGeneratingChecklist ? '...' : !isPremium ? '🔒 AI' : 'AI'}
                </span>
              </button>
              <button
                onClick={() => setShowAddItem(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress: {completedItems}/{totalItems} items completed
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="completed">✅ Completed</option>
          </select>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddItem && (
        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Checklist Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={checklistForm.title}
                onChange={(e) => setChecklistForm({ ...checklistForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white dark:bg-gray-800"
                placeholder="Enter checklist item title"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={checklistForm.description}
                onChange={(e) => setChecklistForm({ ...checklistForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white dark:bg-gray-800"
                rows={3}
                placeholder="Enter additional details"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={checklistForm.category}
                onChange={(e) => setChecklistForm({ ...checklistForm, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white dark:bg-gray-800"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={checklistForm.priority}
                onChange={(e) => setChecklistForm({ ...checklistForm, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white dark:bg-gray-800"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={checklistForm.dueDate}
                onChange={(e) => setChecklistForm({ ...checklistForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white dark:bg-gray-800"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddChecklistItem}
              className="px-4 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
            >
              Add Item
            </button>
            <button
              onClick={() => setShowAddItem(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Checklist Items by Category */}
      <div className="space-y-6">
        {categories.map(category => {
          const categoryItems = groupedChecklist[category.value];
          if (!categoryItems || categoryItems.length === 0) return null;

          return (
            <div key={category.value} className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{category.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {category.label}
                </h3>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                  {categoryItems.length}
                </span>
              </div>

              <div className="space-y-3">
                {categoryItems.map(item => {
                  const isCompleted = item.completed;
                  const priorityInfo = priorityConfig[item.priority];
                  const PriorityIcon = priorityInfo.icon;

                  return (
                    <div
                      key={item.$id}
                      className={`flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 ${
                        isCompleted
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleChecklistItem(item.$id!, item.completed)}
                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                        }`}
                      >
                        {isCompleted && <Check className="h-3 w-3" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              isCompleted 
                                ? 'text-green-800 dark:text-green-300 line-through' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className={`text-sm mt-1 ${
                                isCompleted 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              priorityInfo.color === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                              priorityInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              <PriorityIcon className="h-3 w-3" />
                              {priorityInfo.label}
                            </div>

                            {canEdit && (
                              <button
                                onClick={() => handleDeleteChecklistItem(item.$id!)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {item.dueDate && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="h-3 w-3" />
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </div>
                        )}

                        {isCompleted && item.updatedAt && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            Completed: {new Date(item.updatedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredChecklist.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">No Checklist Items</h3>
          <p className="text-gray-500 mb-4">
            {checklist.length === 0 
              ? "Start by adding items to your trip checklist"
              : "No items match your current filters"
            }
          </p>
          {canEdit && checklist.length === 0 && (
            <button
              onClick={() => setShowAddItem(true)}
              className="px-4 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
            >
              Add First Item
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TripChecklistTab;
