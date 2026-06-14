/**
 * Enhanced AI Trip Planner Page - Modern Ulysse.com & Hero-Inspired Design
 * Clean, minimal interface with SkyNeu colors and mobile-first approach
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, Send, User, Bot, Loader2, Settings, MapPin, X
} from 'lucide-react';
import { authService, userPreferencesService, UserPreferences } from '@/lib/appwrite';
import toast from 'react-hot-toast';
import aiTripPlanningService from '@/services/aiTripPlanningService';
import TripPlanModal from '@/components/TripPlanModal';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import InlineDatePicker from '@/components/common/InlineDatePicker';
import InlineTravelerPicker from '@/components/common/InlineTravelerPicker';
import SEOHead from '@/components/seo/SEOHead';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
  cost?: number;
  tripPlan?: any;
  conversationState?: {
    destination?: string;
    dates?: string;
    travelers?: string;
    duration?: string;
    hasAllDetails: boolean;
  };
  redirectUrl?: string;
  serviceType?: string;
}

interface SimpleUserPreferences {
  budget?: string;
  homeAirport?: string;
  travelStyle?: string;
  passport?: string;
}

const EnhancedAITripPlannerPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState<SimpleUserPreferences>({
    budget: 'Medium',
    homeAirport: '',
    travelStyle: 'Mixed',
    passport: 'US'
  });
  const [fullUserPreferences, setFullUserPreferences] = useState<UserPreferences | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [apiUsage, setApiUsage] = useState({ tokens: 0, calls: 0, estimatedCost: 0 });
  const [selectedTripPlan, setSelectedTripPlan] = useState<any>(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [hasCachedData, setHasCachedData] = useState(false);
  const [currentDestination, setCurrentDestination] = useState<string>('');
  const [currentConversationState, setCurrentConversationState] = useState<{
    destination?: string;
    dates?: string;
    travelers?: string;
    duration?: string;
    hasAllDetails: boolean;
  } | null>(null);
  const [showChangeDestination, setShowChangeDestination] = useState(false);
  const [changeDestinationValue, setChangeDestinationValue] = useState('');
  const [isChangingDates, setIsChangingDates] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [, setShowInlineDatePicker] = useState(false);
  const [, setShowInlineTravelerPicker] = useState(false);
  const [isRestoringFromCache, setIsRestoringFromCache] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cache key for sessionStorage only (clears when browser is closed)
  const SESSION_CACHE_KEY = 'skynfull_ai_trip_planner_session_cache';

  // Session-based cache management functions
  const saveToCache = (data: any) => {
    try {
      const cacheData = {
        ...data,
        timestamp: Date.now()
      };
      
      // Save only to sessionStorage (clears when browser is closed)
      sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save to cache:', error);
    }
  };

  const loadFromCache = () => {
    try {
      // Load only from sessionStorage (clears when browser is closed)
      const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      return cacheData;
    } catch (error) {
      console.warn('Failed to load from cache:', error);
      // Try to clear corrupted cache
      try {
        sessionStorage.removeItem(SESSION_CACHE_KEY);
      } catch (clearError) {
        console.warn('Failed to clear corrupted cache:', clearError);
      }
      return null;
    }
  };

  const clearCache = () => {
    try {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
      setHasCachedData(false);
      setMessages([]);
      setApiUsage({ tokens: 0, calls: 0, estimatedCost: 0 });
      setCurrentConversationState(null);
      toast.success('Cache cleared! Starting fresh conversation.');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  };


  // Load user preferences from Appwrite
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          const preferences = await userPreferencesService.getUserPreferences(currentUser.$id);
          
          if (preferences) {
            setFullUserPreferences(preferences);
            // Map to simple preferences for UI
            setUserPreferences({
              budget: preferences.budgetRange || 'Medium',
              homeAirport: preferences.homeAirport || '',
              travelStyle: preferences.travelStyle || 'Mixed',
              passport: preferences.location || 'US'
            });
          } else {
            // Create default preferences if none exist
            const defaultPrefs: Omit<UserPreferences, 'createdAt' | 'updatedAt'> = {
              userId: currentUser.$id,
              email: currentUser.email,
              name: currentUser.name,
              preferredDestinations: [],
              frequentAirlines: [],
              homeAirport: '',
              travelClass: 'economy',
              travelPurpose: 'leisure',
              defaultCurrency: 'USD',
              interests: [],
              newsAlerts: false,
              flightAlerts: false,
              weatherAlerts: false,
              priceAlerts: false,
              language: 'en',
              budgetRange: 'Medium',
              travelStyle: 'Mixed',
              location: 'US'
            };
            
            const createdPrefs = await userPreferencesService.createUserPreferences(defaultPrefs);
            setFullUserPreferences(createdPrefs);
          }
        }
      } catch (error) {
        console.error('Failed to load user preferences:', error);
        toast.error('Failed to load preferences');
      }
    };

    loadUserPreferences();
  }, []);

  // Load initial welcome message or restore from cache
  useEffect(() => {
    const loadInitialData = () => {
      // Try to load from cache first
      const cachedData = loadFromCache();
      
      if (cachedData && cachedData.messages && cachedData.messages.length > 0) {
        // Set flag to prevent cache saving during restoration
        setIsRestoringFromCache(true);
        
        // Restore messages from cache
        const restoredMessages = cachedData.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(restoredMessages);
        
        // Restore API usage if available
        if (cachedData.apiUsage) {
          setApiUsage(cachedData.apiUsage);
        }
        
        // Restore conversation state if available
        if (cachedData.currentConversationState) {
          setCurrentConversationState(cachedData.currentConversationState);
        }
        
        // Set cached data flag
        setHasCachedData(true);
        
        // Clear the restoration flag after a short delay
        setTimeout(() => {
          setIsRestoringFromCache(false);
        }, 1000);
        
        return;
      }
      // If no cache, show welcome message
      const welcomeMessage: Message = {
        id: '1',
        type: 'assistant',
        content: `🌍 **Welcome to SkyNeu AI Trip Planner!**

I'm your intelligent travel companion, ready to help you plan the perfect trip! Here's what I can do:

✈️ **Plan Complete Trips** - Tell me your destination, dates, and preferences
🏨 **Find Accommodations** - Get personalized hotel recommendations  
🍽️ **Discover Local Cuisine** - Find the best restaurants and local dishes
🎯 **Create Itineraries** - Get day-by-day activity suggestions
💰 **Budget Planning** - Estimate costs and find deals
🗺️ **Local Insights** - Cultural tips, customs, and hidden gems

**To get started, just tell me:**
- Where would you like to go?
- When are you planning to travel?
- What's your budget range?
- What are you most interested in? (adventure, culture, relaxation, food, etc.)

Let's plan your amazing trip! ✨`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    };

    loadInitialData();
  }, []);

  // Additional effect to handle page visibility changes (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, try to restore from cache
        const cachedData = loadFromCache();
        if (cachedData && cachedData.messages && cachedData.messages.length > 0) {
          const restoredMessages = cachedData.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          
          // Only restore if we don't already have messages or if cache has more messages
          if (messages.length === 0 || cachedData.messages.length > messages.length) {
            // Set flag to prevent cache saving during restoration
            setIsRestoringFromCache(true);
            
            setMessages(restoredMessages);
            
            if (cachedData.apiUsage) {
              setApiUsage(cachedData.apiUsage);
            }
            
            if (cachedData.currentConversationState) {
              setCurrentConversationState(cachedData.currentConversationState);
            }
            
            setHasCachedData(true);
            
            // Clear the restoration flag after a short delay
            setTimeout(() => {
              setIsRestoringFromCache(false);
            }, 1000);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [messages.length]);

  // Force cache restoration on component mount (in case initial load missed it)
  useEffect(() => {
    const forceRestore = () => {
      const cachedData = loadFromCache();
      if (cachedData && cachedData.messages && cachedData.messages.length > 0 && messages.length === 0) {
        // Set flag to prevent cache saving during restoration
        setIsRestoringFromCache(true);
        
        const restoredMessages = cachedData.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(restoredMessages);
        
        if (cachedData.apiUsage) {
          setApiUsage(cachedData.apiUsage);
        }
        
        if (cachedData.currentConversationState) {
          setCurrentConversationState(cachedData.currentConversationState);
        }
        
        setHasCachedData(true);
        
        // Clear the restoration flag after a short delay
        setTimeout(() => {
          setIsRestoringFromCache(false);
        }, 1000);
      }
    };

    // Small delay to ensure component is fully mounted
    const timeoutId = setTimeout(forceRestore, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Additional restoration attempt on every component mount
  useEffect(() => {
    const attemptRestore = () => {
      const cachedData = loadFromCache();
      if (cachedData && cachedData.messages && cachedData.messages.length > 0) {
        // Only restore if we have fewer messages than in cache
        if (messages.length < cachedData.messages.length) {
          // Set flag to prevent cache saving during restoration
          setIsRestoringFromCache(true);
          
          const restoredMessages = cachedData.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(restoredMessages);
          
          if (cachedData.apiUsage) {
            setApiUsage(cachedData.apiUsage);
          }
          
          if (cachedData.currentConversationState) {
            setCurrentConversationState(cachedData.currentConversationState);
          }
          
          setHasCachedData(true);
          
          // Clear the restoration flag after a short delay
          setTimeout(() => {
            setIsRestoringFromCache(false);
          }, 1000);
        }
      }
    };

    // Run immediately and also after a delay
    attemptRestore();
    const timeoutId = setTimeout(attemptRestore, 500);
    
    return () => clearTimeout(timeoutId);
  }, [messages.length]);

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom and not actively scrolling)
  useEffect(() => {
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer && messages.length > 0 && !isUserScrolling) {
      const isNearBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 50;
      // Only auto-scroll if user is very close to bottom (within 50px) or if it's the first message
      if (isNearBottom || messages.length === 1) {
        setTimeout(() => {
          // Scroll just enough to show the new message, not all the way to bottom
          const allMessages = messagesContainer.querySelectorAll('[data-message-id]');
          const lastMessage = allMessages[allMessages.length - 1];
          
          if (lastMessage) {
            // Get the current scroll position
            const currentScrollTop = messagesContainer.scrollTop;
            const containerHeight = messagesContainer.clientHeight;
            const messageTop = (lastMessage as HTMLElement).offsetTop;
            const messageHeight = (lastMessage as HTMLElement).offsetHeight;
            
            // Only scroll if the message is not fully visible
            if (messageTop + messageHeight > currentScrollTop + containerHeight) {
              // Scroll just enough to show the message with some padding
              const targetScroll = messageTop + messageHeight - containerHeight + 80;
              messagesContainer.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
              });
            }
          } else {
            // Fallback to minimal scroll
            messagesContainer.scrollTop += 60;
          }
        }, 100);
      }
    }
  }, [messages, isUserScrolling]);

  // Handle scroll to show/hide scroll button
  const handleScroll = () => {
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      const isNearBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 50;
      setShowScrollButton(!isNearBottom && messages.length > 1);
      
      // Track user scrolling
      setIsUserScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000);
    }
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Save to cache whenever messages, API usage, or conversation state changes
  useEffect(() => {
    // Don't save while restoring from cache to prevent race conditions
    if (isRestoringFromCache) {
      return;
    }
    
    // Don't save the initial welcome message to cache
    if (messages.length === 1 && messages[0].id === '1') {
      return;
    }
    
    // Don't save empty message arrays - this prevents overwriting good cache with empty data
    if (messages.length === 0) {
      return;
    }
    
    // Save current state to cache
    saveToCache({
      messages,
      apiUsage,
      userPreferences,
      currentConversationState
    });
  }, [messages, apiUsage, userPreferences, currentConversationState, isRestoringFromCache]);

  // Save preferences to Appwrite when they change
  const updateUserPreferences = async (newPrefs: SimpleUserPreferences) => {
    setUserPreferences(newPrefs);
    
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser && fullUserPreferences?.$id) {
        const updatedPrefs = {
          budgetRange: newPrefs.budget as 'Budget' | 'Medium' | 'High' | 'Luxury',
          homeAirport: newPrefs.homeAirport,
          travelStyle: newPrefs.travelStyle as 'Mixed' | 'Luxury' | 'Premium' | 'Comfort' | 'Budget' | 'Backpacker',
          location: newPrefs.passport
        };
        
        await userPreferencesService.updateUserPreferences(fullUserPreferences.$id, updatedPrefs);
        
        // Update the full preferences state
        setFullUserPreferences(prev => prev ? { ...prev, ...updatedPrefs } : null);
        
        toast.success('Preferences saved!');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const handleDateSelect = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Format dates for the AI
    const startFormatted = start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    const endFormatted = end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    // Build message text
    const dateText = `${startFormatted} - ${endFormatted}`;
    const messageText = isChangingDates ? `change dates to ${dateText}` : dateText;
    
    // Close picker and reset state
    setShowInlineDatePicker(false);
    setIsChangingDates(false);
    
    // Send directly without showing in input
    sendDirectMessage(messageText);
  };

  const handleTravelerSelect = (count: number) => {
    const travelerText = count === 1 ? 'solo' : `${count} people`;
    
    // Close picker
    setShowInlineTravelerPicker(false);
    
    // Send directly without showing in input
    sendDirectMessage(travelerText);
  };

  // Send a message programmatically without requiring manual Send
  const sendDirectMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    if (!fullUserPreferences) {
      toast.error('User preferences not loaded');
      return;
    }
    setIsLoading(true);
    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: messageText,
        timestamp: new Date()
      };
      // Immediately show user's message
      setMessages(prev => [...prev, userMessage]);

      // Build conversation history including this new message
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.type as 'user' | 'assistant',
        content: msg.content
      }));

      const response = await aiTripPlanningService.generateResponse(
        messageText,
        fullUserPreferences,
        conversationHistory
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        tokens: 0,
        cost: 0,
        tripPlan: response.tripPlan,
        conversationState: response.conversationState,
        redirectUrl: response.redirectUrl,
        serviceType: response.serviceType
      };
      setMessages(prev => [...prev, aiMessage]);
      if (response.conversationState) setCurrentConversationState(response.conversationState);
      if (response.tripPlan) {
        setSelectedTripPlan(response.tripPlan);
        setShowTripModal(true);
      }

      setApiUsage(prev => ({
        tokens: prev.tokens + 100,
        calls: prev.calls + 1,
        estimatedCost: prev.estimatedCost + 0.01
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to process your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToProcess = input;
    setInput('');
    setIsLoading(true);

    try {
      // Use full user preferences from Appwrite if available
      if (!fullUserPreferences) {
        throw new Error('User preferences not loaded');
      }
      
      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.type as 'user' | 'assistant',
        content: msg.content
      }));
      
      // Extract destination from current message for inline pickers
      const destinationMatch = messageToProcess.match(/(?:plan a trip to|travel to|visit|go to)\s+([^,\n]+)/i);
      if (destinationMatch) {
        setCurrentDestination(destinationMatch[1].trim());
      }

      // Call AI service with conversation history
      const response = await aiTripPlanningService.generateResponse(
        messageToProcess, 
        fullUserPreferences,
        conversationHistory
      );
      

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        tokens: 0, // Will be updated if available
        cost: 0,   // Will be updated if available
        tripPlan: response.tripPlan,
        conversationState: response.conversationState,
        redirectUrl: response.redirectUrl,
        serviceType: response.serviceType
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update conversation state if provided
      if (response.conversationState) {
        setCurrentConversationState(response.conversationState);
      }
      
      // If a trip plan was generated, automatically show the modal
      if (response.tripPlan) {
        setSelectedTripPlan(response.tripPlan);
        setShowTripModal(true);
      }
      
      // Update API usage (simplified for now)
      setApiUsage(prev => ({
        tokens: prev.tokens + 100, // Estimate
        calls: prev.calls + 1,
        estimatedCost: prev.estimatedCost + 0.01 // Estimate
      }));

      // Don't auto-open modal - let user choose when to view details
      
      // Cache will be automatically saved by the useEffect hook

    } catch (error) {
      console.error('Failed to generate trip plan:', error);
      toast.error('Failed to generate trip plan. Please try again.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '🚨 **Oops! Something went wrong.**\n\nI encountered an error while planning your trip. This could be due to:\n\n• API connectivity issues\n• High server load\n• Invalid request format\n\nPlease try again with your request, or contact support if the issue persists.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden flex flex-col">
      <SEOHead
        title="AI Trip Planner - Chat with an AI Travel Assistant | SkyNeu"
        description="Chat with SkyNeu's AI to plan trips instantly. Get personalized suggestions, itineraries, budgets, and travel insights in a conversational interface."
        canonical="https://skyneu.com/ai-chat"
        keywords="ai trip planner, travel assistant, plan trips with ai, itinerary ai, skyneu"
      />
      {/* Background Elements - Hero Style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-skyneu-blue/5 dark:bg-skyneu-blue/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-skyneu-green/5 dark:bg-skyneu-green/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-skyneu-blue/5 dark:bg-skyneu-blue/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col mt-8 sm:mt-12 lg:mt-16">
        {/* Modern Header - Ulysse Style */}
        <div className="text-center mb-2 sm:mb-3 lg:mb-4 px-4 sm:px-6 flex-shrink-0">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-skyneu-blue/20 dark:border-skyneu-blue/30 text-skyneu-blue dark:text-skyneu-blue rounded-full text-xs sm:text-sm font-semibold mb-2 sm:mb-4 lg:mb-6 shadow-sm">
            <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">AI-POWERED TRIP PLANNING</span>
            <span className="sm:hidden">AI PLANNER</span>
            <div className="w-2 h-2 bg-skyneu-green rounded-full animate-pulse"></div>
            {hasCachedData && (
              <div className="flex items-center gap-1 text-xs text-skyneu-green">
                <span className="w-1.5 h-1.5 bg-skyneu-green rounded-full"></span>
                <span className="hidden sm:inline">CACHED</span>
              </div>
            )}
          </div>
          
          {/* Main Heading - Hero Style */}
          <h1 className="font-bold text-xl sm:text-3xl lg:text-4xl xl:text-5xl text-skyneu-dark dark:text-white leading-tight mb-2 sm:mb-4 lg:mb-6">
            Plan your trips
            <span className="block text-transparent bg-gradient-to-r from-skyneu-blue to-skyneu-green bg-clip-text">
              simply, smartly, happily
            </span>
          </h1>
          
          {/* Subheading - Clean and Minimal */}
          <p className="text-xs sm:text-base lg:text-lg text-skyneu-text dark:text-gray-300 mb-3 sm:mb-4 lg:mb-6 max-w-2xl mx-auto leading-relaxed">
            Your intelligent travel companion. Get personalized recommendations, instant answers, and smart planning assistance.
          </p>
        </div>

        {/* Main Content - Full Width */}
        <div className="w-full px-2 sm:px-4 lg:px-8 max-w-6xl mx-auto flex-1 flex flex-col min-h-0 mt-6 sm:mt-8 lg:mt-6">
          {/* Main Chat Interface - Mobile Optimized */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden flex-1 flex flex-col min-h-0">
              
              {/* Conversation State Indicator */}
              {currentConversationState && (
                <div className="bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 border border-skyneu-blue/20 rounded-lg p-3 m-2 sm:m-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-skyneu-blue" />
                    <span className="text-sm font-medium text-skyneu-dark dark:text-white">Trip Planning Progress</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className={`flex items-center gap-1 ${currentConversationState.destination ? 'text-skyneu-green' : 'text-gray-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${currentConversationState.destination ? 'bg-skyneu-green' : 'bg-gray-300'}`}></div>
                      <span>Destination</span>
                    </div>
                    <div className={`flex items-center gap-1 ${currentConversationState.dates ? 'text-skyneu-green' : 'text-gray-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${currentConversationState.dates ? 'bg-skyneu-green' : 'bg-gray-300'}`}></div>
                      <span>Dates</span>
                    </div>
                    <div className={`flex items-center gap-1 ${currentConversationState.travelers ? 'text-skyneu-green' : 'text-gray-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${currentConversationState.travelers ? 'bg-skyneu-green' : 'bg-gray-300'}`}></div>
                      <span>Travelers</span>
                    </div>
                    <div className={`flex items-center gap-1 ${currentConversationState.duration ? 'text-skyneu-green' : 'text-gray-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${currentConversationState.duration ? 'bg-skyneu-green' : 'bg-gray-300'}`}></div>
                      <span>Duration</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages - Optimized Heights */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 sm:space-y-3 min-h-0 relative" onScroll={handleScroll}>
                {messages.map((message) => (
                  <div key={message.id} data-message-id={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-r from-skyneu-blue to-skyneu-blue/90 text-white' 
                        : 'bg-gray-50 dark:bg-gray-700 text-skyneu-dark dark:text-white border border-gray-200 dark:border-gray-600'
                    }`}>
                      <div className="flex items-start gap-2 mb-1">
                        {message.type === 'assistant' && <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-skyneu-blue mt-0.5 flex-shrink-0" />}
                        {message.type === 'user' && <User className="h-3 w-3 sm:h-4 sm:w-4 text-white/80 mt-0.5 flex-shrink-0" />}
                        <div className="text-xs font-medium opacity-70">
                          {message.type === 'assistant' ? 'AI Assistant' : 'You'}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm leading-relaxed">
                        {message.type === 'assistant' ? (
                          <div className="prose prose-sm max-w-none">
                            <MarkdownRenderer 
                              content={message.content} 
                              className="text-skyneu-dark dark:text-white"
                              quickActions={message.tripPlan?.quickActions}
                            />
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap text-white">{message.content}</div>
                        )}
                      </div>

                      {/* Service Redirect Button */}
                      {message.type === 'assistant' && message.redirectUrl && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              window.location.href = message.redirectUrl!;
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <MapPin className="h-4 w-4" />
                            Go to {message.serviceType?.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Service
                          </button>
                          <button
                            onClick={() => {
                              // Copy URL to clipboard
                              navigator.clipboard.writeText(window.location.origin + message.redirectUrl!);
                              toast.success('Service URL copied to clipboard!');
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            📋 Copy Link
                          </button>
                        </div>
                      )}

                      {/* Inline Date Picker - shown when AI asks for dates */}
                      {message.type === 'assistant' && message.content.includes('📅') && !message.tripPlan && (
                        <div className="mt-3">
                          <InlineDatePicker
                            onDateSelect={handleDateSelect}
                            onCancel={() => setShowInlineDatePicker(false)}
                            destination={currentDestination}
                          />
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                              onClick={() => sendDirectMessage('best time to visit for these dates')}
                            >
                              Ask Best Time
                            </button>
                            <button
                              className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                              onClick={() => sendDirectMessage('plan full trip')}
                            >
                              Plan Now
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Inline Traveler Picker - shown when AI asks for traveler count */}
                      {message.type === 'assistant' && message.content.includes('👥') && !message.tripPlan && (
                        <div className="mt-3">
                          <InlineTravelerPicker
                            onTravelerSelect={handleTravelerSelect}
                            onCancel={() => setShowInlineTravelerPicker(false)}
                            destination={currentDestination}
                          />
                        </div>
                      )}

                      {/* Mid-plan change controls: Destination & Dates */}
                      {message.type === 'assistant' && message.conversationState && (
                        <div className="mt-3 flex flex-col sm:flex-row gap-2">
                          <button
                            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => {
                              setShowChangeDestination(true);
                              setChangeDestinationValue('');
                            }}
                          >
                            Change Destination
                          </button>
                          <button
                            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => {
                              setIsChangingDates(true);
                              setShowInlineDatePicker(true);
                            }}
                          >
                            Change Dates
                          </button>
                        </div>
                      )}

                      {showChangeDestination && (
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="text"
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-surface text-gray-900 dark:text-white"
                            placeholder="Enter new destination (e.g., Dubai)"
                            value={changeDestinationValue}
                            onChange={(e) => setChangeDestinationValue(e.target.value)}
                          />
                          <button
                            className="px-3 py-2 text-sm rounded-md bg-skyneu-blue text-white hover:opacity-90"
                            onClick={() => {
                              if (!changeDestinationValue.trim()) return;
                              setShowChangeDestination(false);
                              sendDirectMessage(`change destination to ${changeDestinationValue.trim()}`);
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => setShowChangeDestination(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      
                      {/* Trip Plan Button */}
                      {message.tripPlan && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() => {
                              setSelectedTripPlan(message.tripPlan);
                              setShowTripModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white text-xs sm:text-sm font-medium rounded-lg hover:from-skyneu-blue/90 hover:to-skyneu-green/90 transition-all duration-300 shadow-sm hover:shadow-md"
                          >
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                            View Full Trip Plan
                          </button>
                        </div>
                      )}

                      {/* Create Trip Plan Button - shown when AI has confirmed all details */}
                      {(() => {
                        const hasConversationState = message.conversationState?.hasAllDetails;
                        const hasConfirmationText = message.content.includes('✅ **Destination:**') || 
                                                  message.content.includes('I have all the details I need') || 
                                                  message.content.includes('Perfect! I have all the details') ||
                                                  message.content.includes('I\'m ready to create your personalized trip plan');
                        
                        const shouldShowButton = message.type === 'assistant' && 
                                                !message.tripPlan && 
                                                (hasConversationState || hasConfirmationText);
                        
                        return shouldShowButton;
                      })() && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() => sendDirectMessage('plan full trip')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-green to-skyneu-blue text-white text-sm font-medium rounded-lg hover:from-skyneu-green/90 hover:to-skyneu-blue/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            <MapPin className="h-4 w-4" />
                            🚀 Generate Trip Plan
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] sm:max-w-[75%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 border border-skyneu-blue/20 dark:border-skyneu-blue/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-skyneu-blue animate-pulse" />
                        <div className="text-xs font-medium text-skyneu-dark dark:text-white">AI Assistant</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-skyneu-blue" />
                        <span className="text-xs sm:text-sm text-skyneu-dark dark:text-white font-medium">
                          <span className="inline-block animate-bounce">✨</span> Crafting your personalized travel response...
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <div className="w-2 h-2 bg-skyneu-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-skyneu-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-skyneu-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        <span className="text-xs text-skyneu-dark/70 dark:text-white/70 ml-2">Analyzing your preferences...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
                
                {/* Scroll to Bottom Button */}
                {showScrollButton && (
                  <button
                    onClick={scrollToBottom}
                    className="fixed bottom-20 right-4 sm:right-6 z-10 bg-skyneu-blue text-white p-2 rounded-full shadow-lg hover:bg-skyneu-blue/90 transition-colors"
                    title="Scroll to bottom"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Input Area - Mobile Optimized */}
              <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-2 sm:p-3 flex-shrink-0">
                <div className="flex gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={isLoading ? "AI is crafting your response... ✨" : "✨ Tell me about your dream trip..."}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-8 sm:pr-12 border rounded-xl focus:ring-2 focus:ring-skyneu-blue focus:border-skyneu-blue dark:bg-gray-700 dark:text-white resize-none text-xs sm:text-sm leading-relaxed bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                        isLoading 
                          ? 'border-skyneu-blue/50 bg-skyneu-blue/5 dark:bg-skyneu-blue/10' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      rows={2}
                      disabled={isLoading}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      {input.length}/500
                    </div>
                  </div>
                  
                    <div className="flex flex-col gap-1 sm:gap-2">
                    <button
                      onClick={() => setShowPreferences(!showPreferences)}
                      className="px-2 sm:px-3 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center gap-1 font-medium text-xs sm:text-sm"
                      title="Preferences"
                    >
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Prefs</span>
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isLoading}
                      className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-skyneu-blue to-skyneu-blue/90 text-white rounded-xl hover:from-skyneu-blue/90 hover:to-skyneu-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 font-medium shadow-lg text-xs sm:text-sm"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          <span className="hidden sm:inline">Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Send</span>
                        </>
                      )}
                    </button>
                    
                  </div>
                </div>
                
                {/* Quick Actions - Mobile Friendly */}
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                  <button 
                    onClick={() => sendDirectMessage("Plan a 7-day trip to Japan for 2 people, budget $3000")}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-skyneu-blue/10 dark:bg-skyneu-blue/20 text-skyneu-blue rounded-lg text-xs hover:bg-skyneu-blue/20 transition-colors"
                  >
                    🗾 Japan Trip
                  </button>
                  <button 
                    onClick={() => sendDirectMessage("Suggest a romantic weekend getaway in Europe")}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-skyneu-green/10 dark:bg-skyneu-green/20 text-skyneu-green rounded-lg text-xs hover:bg-skyneu-green/20 transition-colors"
                  >
                    💕 Romantic Trip
                  </button>
                  <button 
                    onClick={() => sendDirectMessage("Adventure backpacking in Southeast Asia")}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg text-xs hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    🎒 Adventure
                  </button>
                  <button 
                    onClick={clearCache}
                    className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                    title="Clear Conversation"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-skyneu-dark dark:text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-skyneu-blue" />
                  Smart Preferences
                </h3>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-skyneu-text dark:text-gray-300 mb-2">
                    💰 Budget
                  </label>
                  <select
                    value={userPreferences.budget}
                    onChange={(e) => updateUserPreferences({ ...userPreferences, budget: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-skyneu-blue dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Budget">Budget</option>
                    <option value="Medium">Medium</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-skyneu-text dark:text-gray-300 mb-2">
                    ✈️ Home Airport
                  </label>
                  <input
                    type="text"
                    value={userPreferences.homeAirport}
                    onChange={(e) => updateUserPreferences({ ...userPreferences, homeAirport: e.target.value })}
                    placeholder="e.g., JFK, LAX"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-skyneu-blue dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-skyneu-text dark:text-gray-300 mb-2">
                    🎯 Travel Style
                  </label>
                  <select
                    value={userPreferences.travelStyle}
                    onChange={(e) => updateUserPreferences({ ...userPreferences, travelStyle: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-skyneu-blue dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Adventure">Adventure</option>
                    <option value="Relaxation">Relaxation</option>
                    <option value="Culture">Culture</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-skyneu-text dark:text-gray-300 mb-2">
                    🌍 Passport/Location
                  </label>
                  <input
                    type="text"
                    list="countries"
                    value={userPreferences.passport}
                    onChange={(e) => updateUserPreferences({ ...userPreferences, passport: e.target.value })}
                    placeholder="Type your country or select from suggestions"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-skyneu-blue focus:border-skyneu-blue dark:bg-gray-700 dark:text-white"
                  />
                  <datalist id="countries">
                    <option value="United States" />
                    <option value="United Kingdom" />
                    <option value="Canada" />
                    <option value="Australia" />
                    <option value="Germany" />
                    <option value="France" />
                    <option value="Spain" />
                    <option value="Italy" />
                    <option value="Japan" />
                    <option value="China" />
                    <option value="India" />
                    <option value="Brazil" />
                    <option value="Mexico" />
                    <option value="Netherlands" />
                    <option value="Switzerland" />
                    <option value="Sweden" />
                    <option value="Norway" />
                    <option value="Denmark" />
                    <option value="Singapore" />
                    <option value="UAE" />
                    <option value="Russia" />
                    <option value="South Korea" />
                    <option value="Thailand" />
                    <option value="Indonesia" />
                    <option value="Malaysia" />
                    <option value="Philippines" />
                    <option value="Vietnam" />
                    <option value="Egypt" />
                    <option value="South Africa" />
                    <option value="Nigeria" />
                    <option value="Argentina" />
                    <option value="Chile" />
                    <option value="Colombia" />
                    <option value="Peru" />
                    <option value="Turkey" />
                    <option value="Saudi Arabia" />
                    <option value="Israel" />
                    <option value="Pakistan" />
                    <option value="Bangladesh" />
                    <option value="Sri Lanka" />
                    <option value="Nepal" />
                    <option value="New Zealand" />
                    <option value="Belgium" />
                    <option value="Austria" />
                    <option value="Portugal" />
                    <option value="Greece" />
                    <option value="Poland" />
                    <option value="Czech Republic" />
                    <option value="Hungary" />
                    <option value="Finland" />
                    <option value="Ireland" />
                    <option value="Croatia" />
                    <option value="Slovenia" />
                    <option value="Estonia" />
                    <option value="Latvia" />
                    <option value="Lithuania" />
                    <option value="Ukraine" />
                    <option value="Romania" />
                    <option value="Bulgaria" />
                    <option value="Serbia" />
                    <option value="Montenegro" />
                    <option value="Bosnia and Herzegovina" />
                    <option value="North Macedonia" />
                    <option value="Albania" />
                    <option value="Kosovo" />
                    <option value="Moldova" />
                    <option value="Belarus" />
                    <option value="Georgia" />
                    <option value="Armenia" />
                    <option value="Azerbaijan" />
                    <option value="Kazakhstan" />
                    <option value="Uzbekistan" />
                    <option value="Kyrgyzstan" />
                    <option value="Tajikistan" />
                    <option value="Turkmenistan" />
                    <option value="Mongolia" />
                    <option value="North Korea" />
                    <option value="Taiwan" />
                    <option value="Hong Kong" />
                    <option value="Macau" />
                    <option value="Myanmar" />
                    <option value="Cambodia" />
                    <option value="Laos" />
                    <option value="Brunei" />
                    <option value="East Timor" />
                    <option value="Papua New Guinea" />
                    <option value="Fiji" />
                    <option value="Vanuatu" />
                    <option value="Solomon Islands" />
                    <option value="Samoa" />
                    <option value="Tonga" />
                    <option value="Palau" />
                    <option value="Marshall Islands" />
                    <option value="Micronesia" />
                    <option value="Kiribati" />
                    <option value="Nauru" />
                    <option value="Tuvalu" />
                  </datalist>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    updateUserPreferences(userPreferences);
                    setShowPreferences(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-skyneu-blue to-skyneu-green rounded-lg hover:from-skyneu-blue/90 hover:to-skyneu-green/90 transition-all duration-200"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip Plan Modal */}
      {showTripModal && selectedTripPlan && (
        <TripPlanModal
          tripPlan={selectedTripPlan}
          onClose={() => {
            setShowTripModal(false);
            setSelectedTripPlan(null);
          }}
          userPreferredCurrency={fullUserPreferences?.defaultCurrency || 'USD'}
          onTripCreated={() => {
            toast.success('Trip created successfully! You can now manage it in your trips section.');
            setShowTripModal(false);
            setSelectedTripPlan(null);
            // No redirect - user stays on AI trip planner page
          }}
        />
      )}

    </div>
  );
};

export default EnhancedAITripPlannerPage;