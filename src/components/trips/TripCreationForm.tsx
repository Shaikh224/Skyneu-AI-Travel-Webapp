import React, { useState } from 'react';
import { Calendar, MapPin, DollarSign, Users, ArrowLeft, Sparkles, Plane, Brain, FileText, Star } from 'lucide-react';
import { Trip } from '../../types/trip';
import { tripService } from '../../services/tripService';
import { useAuthSafe } from '../../contexts/AppwriteAuthContext';
import { TripTemplate } from '../../data/tripTemplates';
import TripTemplatePicker from './TripTemplatePicker';
import toast from 'react-hot-toast';

interface TripCreationFormProps {
  createMode?: boolean;
  onTripCreated?: () => void;
  onCancel?: () => void;
  trip?: Trip;
}

const TripCreationForm: React.FC<TripCreationFormProps> = ({ 
  createMode = false, 
  onTripCreated, 
  onCancel,
  trip 
}) => {
  const authContext = useAuthSafe();
  const user = authContext?.user;
  const userPreferences = authContext?.userPreferences;
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TripTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: trip?.title || '',
    destination: trip?.destination || '',
    startDate: trip?.startDate || '',
    endDate: trip?.endDate || '',
    budget: trip?.budget || '',
    description: trip?.description || '',
    memberCount: trip?.memberCount || 1,
    currency: trip?.currency || 'USD'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' || name === 'memberCount' ? (value ? Number(value) : '') : value
    }));
  };

  const handleTemplateSelect = (template: TripTemplate) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      title: template.name,
      destination: template.destination,
      budget: template.budget,
      currency: template.currency,
      description: template.description,
      memberCount: 1 // Default, user can change
    }));
    setShowTemplatePicker(false);
    toast.success(`Template "${template.name}" applied!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const tripData: Partial<Trip> = {
        title: formData.title,
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.budget ? Number(formData.budget) : undefined,
        description: formData.description,
        memberCount: formData.memberCount,
        // Note: Currency field removed temporarily - not in database schema yet
        // currency: formData.currency,
        ownerId: user.$id,
        status: 'planning'
      };

      if (createMode) {
        await tripService.createTripWithOwner(tripData as Trip, {
          userId: user.$id,
          email: user.email,
          name: user.name || 'Anonymous User'
        });
        toast.success('Trip created successfully!');
      } else if (trip?.$id) {
        await tripService.updateTrip(trip.$id, tripData);
        toast.success('Trip updated successfully!');
      }

      onTripCreated?.();
    } catch (error) {
      console.error('Error saving trip:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(`Failed to save trip: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getPersonalizedDestinationSuggestions = () => {
    if (!userPreferences) return [];
    
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

    const interests = parseStringArray(userPreferences.interests);
    const preferredDestinations = parseStringArray(userPreferences.preferredDestinations);
    
    const suggestions = [
      ...preferredDestinations.map(dest => ({ destination: dest, reason: 'From your preferred destinations' }))
    ];

    // Add interest-based suggestions
    if (interests.includes('culture') || interests.includes('history')) {
      suggestions.push(
        { destination: 'Rome, Italy', reason: 'Perfect for culture and history enthusiasts' },
        { destination: 'Kyoto, Japan', reason: 'Rich cultural heritage and traditions' }
      );
    }
    
    if (interests.includes('adventure') || interests.includes('nature')) {
      suggestions.push(
        { destination: 'Queenstown, New Zealand', reason: 'Adventure capital with stunning nature' },
        { destination: 'Costa Rica', reason: 'Perfect for eco-adventures and wildlife' }
      );
    }
    
    if (interests.includes('food')) {
      suggestions.push(
        { destination: 'Bangkok, Thailand', reason: 'Incredible street food and culinary experiences' },
        { destination: 'Lyon, France', reason: 'Gastronomic capital with world-class cuisine' }
      );
    }

    // Budget-based suggestions
    if (userPreferences.budgetRange === 'Budget' || userPreferences.budgetRange === 'Low') {
      suggestions.push(
        { destination: 'Prague, Czech Republic', reason: 'Beautiful city with affordable costs' },
        { destination: 'Vietnam', reason: 'Amazing value for money with rich experiences' }
      );
    } else if (userPreferences.budgetRange === 'Luxury') {
      suggestions.push(
        { destination: 'Maldives', reason: 'Ultimate luxury tropical destination' },
        { destination: 'Switzerland', reason: 'Premium alpine experiences and luxury' }
      );
    }

    return suggestions.slice(0, 6); // Limit to 6 suggestions
  };

  const destinationSuggestions = getPersonalizedDestinationSuggestions();

  const getBudgetSuggestion = () => {
    if (!userPreferences) return null;
    
    const days = formData.startDate && formData.endDate 
      ? Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 7; // Default to 7 days if no dates selected
      
    const memberCount = formData.memberCount || 1;
    
    let dailyBudgetPerPerson = 100; // Default moderate budget
    
    // Adjust based on budget preference
    switch (userPreferences.budgetRange) {
      case 'Budget':
      case 'Low':
        dailyBudgetPerPerson = 50;
        break;
      case 'Medium':
        dailyBudgetPerPerson = 150;
        break;
      case 'Luxury':
      case 'High':
        dailyBudgetPerPerson = 300;
        break;
    }
    
    // Adjust based on accommodation preference
    if (userPreferences.accommodationType === 'Resort' || userPreferences.accommodationType === 'Boutique Hotel') {
      dailyBudgetPerPerson *= 1.5;
    } else if (userPreferences.accommodationType === 'Hostel') {
      dailyBudgetPerPerson *= 0.7;
    }
    
    const totalBudget = Math.round(dailyBudgetPerPerson * days * memberCount);
    return {
      amount: totalBudget,
      breakdown: `$${dailyBudgetPerPerson}/day per person × ${days} days × ${memberCount} ${memberCount === 1 ? 'person' : 'people'}`
    };
  };

  const budgetSuggestion = getBudgetSuggestion();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-gray-200 dark:border-dark-border">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-dark-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-skyneu-blue/10 rounded-lg">
                <Plane className="h-6 w-6 text-skyneu-blue" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {createMode ? 'Plan New Trip' : 'Edit Trip'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {createMode ? 'Create your perfect travel experience' : 'Update your trip details'}
                </p>
              </div>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </div>
        </div>

        {/* Template Selection */}
        {createMode && (
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Quick Start with Templates</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose from pre-made templates to get started faster
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedTemplate && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-sm text-blue-700 dark:text-blue-300">
                    <Star className="h-4 w-4" />
                    <span>{selectedTemplate.name}</span>
                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      ×
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowTemplatePicker(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  {selectedTemplate ? 'Change Template' : 'Choose Template'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Trip Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trip Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g., Summer Vacation in Japan"
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white dark:bg-dark-surface text-gray-900 dark:text-white"
            />
          </div>

          {/* Destination */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <MapPin className="h-4 w-4 inline mr-1" />
                Destination
              </label>
              {userPreferences && destinationSuggestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="flex items-center gap-1 text-xs text-skyneu-blue hover:text-skyneu-blue-dark transition-colors"
                >
                  <Brain className="h-3 w-3" />
                  {showSuggestions ? 'Hide' : 'Show'} Personalized Suggestions
                </button>
              )}
            </div>
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              required
              placeholder="e.g., Tokyo, Japan"
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white dark:bg-dark-surface text-gray-900 dark:text-white"
            />
            
            {/* Personalized Destination Suggestions */}
            {showSuggestions && destinationSuggestions.length > 0 && (
              <div className="mt-3 p-4 bg-gradient-to-br from-skyneu-blue/5 to-skyneu-purple/5 rounded-lg border border-skyneu-blue/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-skyneu-blue" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Destinations picked for you
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {destinationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, destination: suggestion.destination }))}
                      className="text-left p-3 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border hover:border-skyneu-blue hover:bg-skyneu-blue/5 transition-all group"
                    >
                      <div className="font-medium text-gray-900 dark:text-white group-hover:text-skyneu-blue">
                        {suggestion.destination}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {suggestion.reason}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white dark:bg-dark-surface text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
                min={formData.startDate}
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white dark:bg-dark-surface text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Budget - Full Width for now (Currency field temporarily disabled) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Budget (Optional)
              </label>
              {budgetSuggestion && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, budget: budgetSuggestion.amount.toString() }))}
                  className="flex items-center gap-1 text-xs text-skyneu-blue hover:text-skyneu-blue-dark transition-colors"
                >
                  <Brain className="h-3 w-3" />
                  Use Suggested: ${budgetSuggestion.amount.toLocaleString()}
                </button>
              )}
            </div>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="e.g., 2500 (USD)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white dark:bg-dark-surface text-gray-900 dark:text-white"
            />
            {budgetSuggestion && (
              <p className="text-xs text-skyneu-blue mt-1">
                💡 Suggested based on your preferences: {budgetSuggestion.breakdown}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Currency selection will be available soon. Amounts are assumed to be in USD for now.
            </p>
          </div>

          {/* Member Count */}
          <div>
            <label htmlFor="memberCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users className="h-4 w-4 inline mr-1" />
              Number of Travelers
            </label>
            <input
              type="number"
              id="memberCount"
              name="memberCount"
              value={formData.memberCount}
              onChange={handleInputChange}
              min="1"
              max="20"
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white dark:bg-dark-surface text-gray-900 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Tell us about your trip plans, preferences, or special requirements..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-transparent bg-white dark:bg-dark-surface text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-surface-elevated transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-skyneu-blue hover:bg-skyneu-blue-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  {createMode ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {createMode ? 'Create Trip' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Template Picker Modal */}
      <TripTemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};

export default TripCreationForm;
