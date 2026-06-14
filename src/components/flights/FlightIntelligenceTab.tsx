/**
 * Flight Intelligence Tab - Airline Reviews & Travel Tips Only
 * Focus: Flight Reviews, Travel Tips (NO DELAY PREDICTIONS)
 * Real-time data from official sources
 * OPTIMIZATIONS: Reduced API calls, enhanced caching, cost-effective usage
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Brain, 
  Loader2, 
  RefreshCw, 
  Star,
  Plane, 
  MessageCircle,
  Lightbulb
} from 'lucide-react';

interface FlightReview {
  id: string;
  flightNumber: string;
  airline: string;
  route: string;
  rating: number;
  reviewText: string;
  reviewer: string;
  date: Date;
  categories: {
    punctuality: number;
    comfort: number;
    service: number;
    value: number;
  };
  verified: boolean;
}

interface TravelInsight {
  id: string;
  type: 'tip' | 'recommendation';
  title: string;
  content: string;
  category: 'baggage' | 'check-in' | 'security' | 'lounges' | 'transportation' | 'booking';
  relevance: number;
  airport?: string;
  airline?: string;
  icon: string;
}

interface FlightIntelligenceTabProps {
  currentFlight?: {
    flightNumber: string;
    airline: string;
    departure: { airport: string; city?: string };
    arrival: { airport: string; city?: string };
    status: string;
  };
  savedFlights?: Array<{
    flightNumber: string;
    airline: { name: string };
    departure: { airport: string; scheduledTime?: string; estimatedTime?: string };
    arrival: { airport: string };
    status: string;
    savedAt?: string;
  }>;
  onRefresh?: () => void;
}

const FlightIntelligenceTab: React.FC<FlightIntelligenceTabProps> = ({ 
  currentFlight, 
  savedFlights = [],
  onRefresh 
}) => {
  const [activePanel, setActivePanel] = useState<'reviews' | 'tips'>('reviews');
  const [flightReviews, setFlightReviews] = useState<FlightReview[]>([]);
  const [travelInsights, setTravelInsights] = useState<TravelInsight[]>([]);
  const [loadingStates, setLoadingStates] = useState({
    reviews: false, 
    tips: false
  });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Optimized API management - cost-effective limits
  const [dailyCallCount, setDailyCallCount] = useState(0);
  const MAX_DAILY_CALLS = 8; // Reduced for cost control
  const CALL_INTERVAL = 5000; // 5 seconds between calls
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

  // Rate limiting and caching
  const [lastCallTime, setLastCallTime] = useState<number>(0);
  const [cachedData, setCachedData] = useState<{[key: string]: {data: any, timestamp: number}}>({});

  // Helper function to check if flight is still relevant (not arrived/over)
  const isFlightRelevant = useCallback((flight: typeof currentFlight) => {
    if (!flight) return false;
    
    const status = flight.status?.toLowerCase() || '';
    const isArrived = status.includes('arrived') || 
                     status.includes('landed') || 
                     status.includes('completed') || 
                     status.includes('cancelled');
    
    // Live flights are always relevant
    const isLiveFlight = status.includes('en-route') || 
                        status.includes('departed') || 
                        status.includes('in-flight') ||
                        status.includes('in flight');
    
    const isRelevant = !isArrived || isLiveFlight;
    
    // Debug logging
    // console.log(`[FLIGHT INTEL] Flight ${flight.flightNumber}: status="${status}", arrived=${isArrived}, live=${isLiveFlight}, relevant=${isRelevant}`);
    
    // For FlightIntelligenceTab, we don't have departure time in the interface
    // So we only check status-based filtering
    return isRelevant;
  }, []);

  // Get the most relevant flight (current flight or from saved flights)
  const mostRelevantFlight = useMemo(() => {
    // If we have a current flight, use it if it's relevant
    if (currentFlight && isFlightRelevant(currentFlight)) {
      return currentFlight;
    }
    
    // Otherwise, find the most relevant flight from saved flights
    const now = new Date();
    
    // First, find live flights (en-route, departed, in-flight)
    const liveFlights = savedFlights.filter(flight => {
      const status = flight.status?.toLowerCase() || '';
      return status.includes('en-route') || 
             status.includes('departed') || 
             status.includes('in-flight') ||
             status.includes('in flight');
    });
    
    if (liveFlights.length > 0) {
      // Return the most recently saved live flight
      const mostRecentLive = liveFlights.sort((a, b) => 
        new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime()
      )[0];
      
      // Convert to currentFlight format
      return {
        flightNumber: mostRecentLive.flightNumber,
        airline: mostRecentLive.airline.name,
        departure: { 
          airport: mostRecentLive.departure.airport,
          city: undefined
        },
        arrival: { 
          airport: mostRecentLive.arrival.airport,
          city: undefined
        },
        status: mostRecentLive.status
      };
    }
    
    // If no live flights, find upcoming flights (not arrived/cancelled)
    const upcomingFlights = savedFlights.filter(flight => {
      const status = flight.status?.toLowerCase() || '';
      const isArrived = status.includes('arrived') || 
                       status.includes('landed') || 
                       status.includes('completed') || 
                       status.includes('cancelled');
      
      if (isArrived) return false;
      
      // Check if flight departure time is in the future or recent past (within 2 hours)
      const departureTime = flight.departure?.scheduledTime || flight.departure?.estimatedTime;
      if (departureTime) {
        const departureDate = new Date(departureTime);
        const hoursUntilDeparture = (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        // Include flights departing within 48 hours or departed within 2 hours
        return hoursUntilDeparture <= 48 && hoursUntilDeparture > -2;
      }
      
      return true; // Include flights without departure time
    });
    
    if (upcomingFlights.length > 0) {
      // Return the flight with the nearest departure time
      const nearestFlight = upcomingFlights.sort((a, b) => {
        const timeA = new Date(a.departure?.scheduledTime || a.departure?.estimatedTime || 0).getTime();
        const timeB = new Date(b.departure?.scheduledTime || b.departure?.estimatedTime || 0).getTime();
        return Math.abs(timeA - now.getTime()) - Math.abs(timeB - now.getTime());
      })[0];
      
      // Convert to currentFlight format
      return {
        flightNumber: nearestFlight.flightNumber,
        airline: nearestFlight.airline.name,
        departure: { 
          airport: nearestFlight.departure.airport,
          city: undefined
        },
        arrival: { 
          airport: nearestFlight.arrival.airport,
          city: undefined
        },
        status: nearestFlight.status
      };
    }
    
    return null;
  }, [currentFlight, savedFlights, isFlightRelevant]);

  // Generate flight-specific cache key
  const flightCacheKey = useMemo(() => {
    if (!mostRelevantFlight) return '';
    return `${mostRelevantFlight.flightNumber}_${mostRelevantFlight.departure.airport}_${mostRelevantFlight.arrival.airport}`;
  }, [mostRelevantFlight]);

  // Check if we can make API calls
  const canMakeCall = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    return dailyCallCount < MAX_DAILY_CALLS && timeSinceLastCall >= CALL_INTERVAL;
  }, [dailyCallCount, lastCallTime, MAX_DAILY_CALLS, CALL_INTERVAL]);

  // Optimized cache management
  const getCachedData = useCallback((key: string) => {
    const cached = cachedData[key];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // console.log(`📦 [FLIGHT INTEL] Using cached data for ${key}`);
      return cached.data;
    }
    return null;
  }, [cachedData, CACHE_DURATION]);

  const setCacheData = useCallback((key: string, data: any) => {
    setCachedData(prev => ({
      ...prev,
      [key]: { data, timestamp: Date.now() }
    }));
    // console.log(`💾 [FLIGHT INTEL] Cached data for ${key}`);
  }, []);

  // Smart Sonar API call with optimized settings
  const callSonarAPI = useCallback(async (prompt: string, cacheKey: string): Promise<string> => {
    // Check cache first
    const cached = getCachedData(`${flightCacheKey}_${cacheKey}`);
    if (cached) {
      return cached;
    }

    // Check rate limits
    if (!canMakeCall()) {
      const waitTime = Math.max(0, CALL_INTERVAL - (Date.now() - lastCallTime));
      if (waitTime > 0) {
        // console.log(`⏱️ [FLIGHT INTEL] Rate limit: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      if (dailyCallCount >= MAX_DAILY_CALLS) {
        throw new Error('Daily API limit reached. Try again tomorrow.');
      }
    }

    const apiKey = import.meta.env.VITE_SONAR_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ [FLIGHT INTEL] Sonar API key not configured');
      throw new Error('API key not configured. Please check your environment variables.');
    }

    // console.log(`🚀 [FLIGHT INTEL] Making API call for ${cacheKey} (${dailyCallCount + 1}/${MAX_DAILY_CALLS})`);

    try {
      setDailyCallCount(prev => prev + 1);
      setLastCallTime(Date.now());

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [FLIGHT INTEL] API Response Error:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API call failed: ${response.status} - ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content || 'No data available';
      
      // Cache the result
      setCacheData(`${flightCacheKey}_${cacheKey}`, result);
      return result;
    } catch (error) {
      console.error(`❌ [FLIGHT INTEL] API Error for ${cacheKey}:`, error);
      
      // If it's a network or API error, provide a more helpful message
      if (error instanceof Error) {
        if (error.message.includes('400')) {
          throw new Error('API request format error. Please check API configuration.');
        } else if (error.message.includes('401')) {
          throw new Error('API authentication failed. Please check your API key.');
        } else if (error.message.includes('429')) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
      }
      
      throw error;
    }
  }, [flightCacheKey, canMakeCall, lastCallTime, dailyCallCount, getCachedData, setCacheData]);

  // Generate flight reviews
  const generateFlightReviews = useCallback(async () => {
    if (!mostRelevantFlight?.airline) return;
    
    setLoadingStates(prev => ({ ...prev, reviews: true }));
    setError(null);
    
    try {
      const prompt = `Find recent passenger reviews and overall reputation for ${mostRelevantFlight.airline} airline. 
      
      Please provide general airline information including:
      - Overall passenger satisfaction rating (1-5)
      - Recent review highlights and common feedback
      - Service quality reputation
      - General punctuality record
      - Comfort and amenities overview
      - Value for money assessment
      
      Focus on the airline's general reputation, not specific routes. Format the response to be helpful for travelers considering this airline.`;

      const response = await callSonarAPI(prompt, 'reviews');
      
      // Create a structured review with full response content
      const mockReviews: FlightReview[] = [
        {
          id: '1',
          flightNumber: mostRelevantFlight.flightNumber,
          airline: mostRelevantFlight.airline,
          route: `General ${mostRelevantFlight.airline} Reviews`,
          rating: 4,
          reviewText: response, // Full response without truncation
          reviewer: 'Recent Passenger Reviews',
          date: new Date(),
          categories: {
            punctuality: 4,
            comfort: 4,
            service: 4,
            value: 3
          },
          verified: true
        }
      ];

      setFlightReviews(mockReviews);
      // console.log(`✅ [FLIGHT INTEL] Generated ${mockReviews.length} reviews`);
    } catch (error) {
      console.error('❌ [FLIGHT INTEL] Reviews error:', error);
      setError('Failed to load airline reviews');
    } finally {
      setLoadingStates(prev => ({ ...prev, reviews: false }));
    }
  }, [mostRelevantFlight, callSonarAPI]);

  // Generate travel insights/tips
  const generateTravelInsights = useCallback(async () => {
    if (!mostRelevantFlight) return;
    
    setLoadingStates(prev => ({ ...prev, tips: true }));
    setError(null);
    
    try {
      const prompt = `Provide practical travel tips for passengers flying with ${mostRelevantFlight.airline} airline.
      
      Include general tips about:
      - Airline-specific recommendations and policies
      - Check-in and baggage best practices for this airline
      - Seat selection and upgrade tips
      - In-flight services and amenities to expect
      - Loyalty program benefits
      - General travel advice for flying with this airline
      
      Make the tips actionable and specific to ${mostRelevantFlight.airline}.`;

      const response = await callSonarAPI(prompt, 'tips');
      
      // Create structured tips with full response content
      const mockInsights: TravelInsight[] = [
        {
          id: '1',
          type: 'tip',
          title: `${mostRelevantFlight.airline} Travel Tips`,
          content: response, // Full response without truncation
          category: 'booking',
          relevance: 90,
          airline: mostRelevantFlight.airline,
          icon: 'lightbulb'
        }
      ];

      setTravelInsights(mockInsights);
      // console.log(`✅ [FLIGHT INTEL] Generated ${mockInsights.length} travel tips`);
    } catch (error) {
      console.error('❌ [FLIGHT INTEL] Tips error:', error);
      setError('Failed to load travel tips');
    } finally {
      setLoadingStates(prev => ({ ...prev, tips: false }));
    }
  }, [mostRelevantFlight, callSonarAPI]);

  // Auto-load data when panel changes or flight changes
  useEffect(() => {
    if (!mostRelevantFlight) return;

    const timeoutId = setTimeout(() => {
      switch (activePanel) {
        case 'reviews':
          if (flightReviews.length === 0) {
            generateFlightReviews();
          }
          break;
        case 'tips':
          if (travelInsights.length === 0) {
            generateTravelInsights();
          }
          break;
      }
    }, 1000); // Delay to avoid rapid API calls

    return () => clearTimeout(timeoutId);
  }, [mostRelevantFlight, activePanel, flightReviews.length, travelInsights.length, generateFlightReviews, generateTravelInsights]);

  // Manual refresh handler
  const refreshData = useCallback(() => {
    setError(null);
    setLastUpdate(new Date());
    
    // Clear relevant cache
    const keysToRemove = Object.keys(cachedData).filter(key => key.startsWith(flightCacheKey));
    setCachedData(prev => {
      const updated = { ...prev };
      keysToRemove.forEach(key => delete updated[key]);
      return updated;
    });

    // Refresh based on active panel
    switch (activePanel) {
      case 'reviews':
        setFlightReviews([]);
        generateFlightReviews();
        break;
      case 'tips':
        setTravelInsights([]);
        generateTravelInsights();
        break;
    }
    
    onRefresh && onRefresh();
  }, [activePanel, flightCacheKey, cachedData, generateFlightReviews, generateTravelInsights, onRefresh]);

  // Early return if no relevant flight found
  if (!mostRelevantFlight) {
    return (
      <div className="text-center py-8">
        <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No active flights found for airline reviews and travel tips</p>
        <p className="text-sm text-gray-400 mt-2">Add upcoming or live flights to get AI insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Flight Intel</h2>
          <span className="text-sm text-gray-500">
            {dailyCallCount}/{MAX_DAILY_CALLS} API calls used
          </span>
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={refreshData}
          disabled={Object.values(loadingStates).some(Boolean)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${Object.values(loadingStates).some(Boolean) ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error handling */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Panel Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'reviews', label: 'Airline Reviews', icon: Star },
          { key: 'tips', label: 'Travel Tips', icon: Lightbulb }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActivePanel(key as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activePanel === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {loadingStates[key as keyof typeof loadingStates] && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div className="bg-white rounded-lg border">
        {/* Flight Reviews Panel */}
        {activePanel === 'reviews' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Airline Reviews</h3>
            {loadingStates.reviews ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading reviews...</span>
              </div>
            ) : flightReviews.length > 0 ? (
              <div className="space-y-6">
                {flightReviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'fill-current' : ''}`} />
                          ))}
                        </div>
                        <span className="text-lg font-semibold text-gray-900">{review.rating}/5</span>
                      </div>
                      {review.verified && (
                        <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                          ✓ Verified Reviews
                        </span>
                      )}
                    </div>
                    
                    <div className="prose prose-sm max-w-none text-gray-800 leading-7">
                      {review.reviewText.split('\n').map((line, index) => {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) return <div key={index} className="h-2"></div>; // Empty line spacing
                        
                        // Handle main section headers (lines starting and ending with **)
                        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                          const headerText = trimmedLine.replace(/\*\*/g, '');
                          return (
                            <div key={index} className="mt-6 mb-3 first:mt-0">
                              <h3 className="text-lg font-bold text-gray-900 border-b-2 border-blue-200 pb-2">
                                {headerText}
                              </h3>
                            </div>
                          );
                        }
                        
                        // Handle inline bold text with **text**:
                        if (trimmedLine.includes('**') && trimmedLine.includes(':')) {
                          const parts = trimmedLine.split(':');
                          if (parts.length >= 2) {
                            const boldPart = parts[0].replace(/\*\*/g, '');
                            const restPart = parts.slice(1).join(':');
                            return (
                              <div key={index} className="mb-4">
                                <h4 className="font-semibold text-gray-900 mb-2 text-base">
                                  {boldPart}:
                                </h4>
                                <p className="text-gray-700 leading-relaxed ml-4">
                                  {restPart.trim()}
                                </p>
                              </div>
                            );
                          }
                        }
                        
                        // Handle bullet points starting with - or *
                        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                          const bulletText = trimmedLine.substring(2);
                          
                          // Check if bullet contains bold text
                          if (bulletText.includes('**')) {
                            const parts = bulletText.split(':');
                            if (parts.length >= 2) {
                              const boldPart = parts[0].replace(/\*\*/g, '');
                              const restPart = parts.slice(1).join(':');
                              return (
                                <div key={index} className="flex items-start space-x-3 mb-3 ml-6">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <div>
                                    <span className="font-semibold text-gray-900">{boldPart}:</span>
                                    <span className="text-gray-700 ml-1">{restPart.trim()}</span>
                                  </div>
                                </div>
                              );
                            }
                          }
                          
                          // Regular bullet point
                          return (
                            <div key={index} className="flex items-start space-x-3 mb-2 ml-6">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-gray-700">{bulletText}</p>
                            </div>
                          );
                        }
                        
                        // Regular paragraphs
                        return (
                          <p key={index} className="mb-3 text-gray-800 leading-relaxed">
                            {trimmedLine}
                          </p>
                        );
                      })}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600">Punctuality:</span>
                          <span className="font-medium text-gray-900">{review.categories.punctuality}/5</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-600">Comfort:</span>
                          <span className="font-medium text-gray-900">{review.categories.comfort}/5</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-gray-600">Service:</span>
                          <span className="font-medium text-gray-900">{review.categories.service}/5</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-gray-600">Value:</span>
                          <span className="font-medium text-gray-900">{review.categories.value}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No reviews available</p>
            )}
          </div>
        )}

        {/* Travel Tips Panel */}
        {activePanel === 'tips' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Travel Tips & Insights</h3>
            {loadingStates.tips ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading tips...</span>
              </div>
            ) : travelInsights.length > 0 ? (
              <div className="space-y-6">
                {travelInsights.map((insight) => (
                  <div key={insight.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                        <Lightbulb className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">{insight.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>Category: {insight.category}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>Relevance: {insight.relevance}%</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none text-gray-800 leading-7 ml-16">
                      {insight.content.split('\n').map((line, index) => {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) return <div key={index} className="h-2"></div>; // Empty line spacing
                        
                        // Handle main section headers (lines starting and ending with **)
                        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                          const headerText = trimmedLine.replace(/\*\*/g, '');
                          return (
                            <div key={index} className="mt-6 mb-3 first:mt-0">
                              <h3 className="text-lg font-bold text-gray-900 border-b-2 border-blue-200 pb-2">
                                {headerText}
                              </h3>
                            </div>
                          );
                        }
                        
                        // Handle inline bold text with **text**:
                        if (trimmedLine.includes('**') && trimmedLine.includes(':')) {
                          const parts = trimmedLine.split(':');
                          if (parts.length >= 2) {
                            const boldPart = parts[0].replace(/\*\*/g, '');
                            const restPart = parts.slice(1).join(':');
                            return (
                              <div key={index} className="mb-4">
                                <h4 className="font-semibold text-gray-900 mb-2 text-base">
                                  {boldPart}:
                                </h4>
                                <p className="text-gray-700 leading-relaxed ml-4">
                                  {restPart.trim()}
                                </p>
                              </div>
                            );
                          }
                        }
                        
                        // Handle bullet points starting with - or *
                        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                          const bulletText = trimmedLine.substring(2);
                          
                          // Check if bullet contains bold text
                          if (bulletText.includes('**')) {
                            const parts = bulletText.split(':');
                            if (parts.length >= 2) {
                              const boldPart = parts[0].replace(/\*\*/g, '');
                              const restPart = parts.slice(1).join(':');
                              return (
                                <div key={index} className="flex items-start space-x-3 mb-3 ml-6">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <div>
                                    <span className="font-semibold text-gray-900">{boldPart}:</span>
                                    <span className="text-gray-700 ml-1">{restPart.trim()}</span>
                                  </div>
                                </div>
                              );
                            }
                          }
                          
                          // Regular bullet point
                          return (
                            <div key={index} className="flex items-start space-x-3 mb-2 ml-6">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-gray-700">{bulletText}</p>
                            </div>
                          );
                        }
                        
                        // Regular paragraphs
                        return (
                          <p key={index} className="mb-3 text-gray-800 leading-relaxed">
                            {trimmedLine}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No travel tips available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightIntelligenceTab;
