/**
 * Flight Tracker AI Insights - Real-time Intelligence for Tracked Flights
 * Real-time flight monitoring insights
 * Distinct from FlightResults AIInsights which is for flight search
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Brain, 
  Loader2, 
  RefreshCw, 
  Clock, 
  Plane, 
  CloudSnow, 
  Navigation,
  BarChart3,
  Shield,
  Zap,
  Info,
  Car,
  Wrench,
  FileText} from 'lucide-react';
import { SavedFlight } from '@/lib/appwrite';

interface TrackerAIInsight {
  id: string;
  type: 'delay' | 'reliability' | 'route' | 'aircraft' | 'weather' | 'general';
  title: string;
  content: string;
  confidence: number;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  cached?: boolean;
  flightSpecific?: string; // Flight number this insight is specific to
}

interface TrackerAIAlert {
  id: string;
  type: 'weather' | 'airport' | 'airline' | 'government' | 'security';
  title: string;
  content: string;
  source: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  affectedFlights?: string[];
  cached?: boolean;
}

interface TrackerAIPrediction {
  id: string;
  type: 'delay' | 'cancellation' | 'gate_change' | 'diversion' | 'on_time';
  flightNumber: string;
  probability: number;
  reason: string;
  timeframe: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  estimatedDelay?: string;
  recommendation?: string;
  cached?: boolean;
}

interface AircraftInfo {
  model: string;
  manufacturer: string;
  capacity: number;
  range: number;
  description: string;
  amenities: string[];
  safetyRating: string;
}

interface WeatherInsight {
  departure: {
    current: string;
    forecast: string;
    impact: 'low' | 'medium' | 'high';
  };
  arrival: {
    current: string;
    forecast: string;
    impact: 'low' | 'medium' | 'high';
  };
  route: {
    conditions: string;
    turbulence: 'low' | 'medium' | 'high';
  };
}

interface DelayPolicy {
  airline: string;
  oneHourPlus: {
    compensation: string;
    vouchers: string;
    rebooking: string;
  };
  cancellation: {
    refund: string;
    rebooking: string;
    accommodation: string;
  };
  alternatives: string[];
}

interface AirportTransport {
  airport: string;
  fullName?: string;
  city?: string;
  country?: string;
  currency?: string;
  options: {
    type: 'taxi' | 'train' | 'bus' | 'metro' | 'car_rental' | 'rideshare' | 'shuttle';
    name: string;
    cost: string;
    duration: string;
    availability: string;
    route?: string;
    distance?: string;
  }[];
}

interface AlternativeFlight {
  flightNumber: string;
  airline: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  route: string;
  price?: string;
  aircraft?: string;
  status: 'available' | 'limited' | 'full';
}

interface FlightTrackerAIInsightsProps {
  flights: SavedFlight[];
  selectedFlight?: SavedFlight;
  onRefresh?: () => void;
}

const FlightTrackerAIInsights: React.FC<FlightTrackerAIInsightsProps> = ({ 
  flights, 
  selectedFlight,
  onRefresh 
}) => {
  // Get the most relevant flight (live flight or nearest upcoming flight)
  const mostRelevantFlight = React.useMemo(() => {
    const flightsList = [...flights];
    
    // Add selected flight if it's not already in the saved flights list
    if (selectedFlight && !flights.find(f => f.flightNumber === selectedFlight.flightNumber)) {
      flightsList.unshift(selectedFlight); // Add at beginning to prioritize
    }
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    const sixHoursFromNow = new Date(now.getTime() + (6 * 60 * 60 * 1000));
    
    // Get all relevant flights (en-route, departing soon, or recently arrived)
    const relevantFlights = flightsList.filter(flight => {
      const status = flight.status?.toLowerCase() || '';
      
      // Priority 1: Live/Active flights (en-route, departed, in-flight)
      const isLive = status.includes('en-route') || 
                    status.includes('departed') || 
                    status.includes('in-flight') ||
                    status.includes('in flight') ||
                    status.includes('active');
      
      if (isLive) return true;
      
      // Priority 2: Recently arrived (within last 1 hour)
      const isRecentlyArrived = status.includes('arrived') || status.includes('landed');
      if (isRecentlyArrived) {
        const arrivalTime = flight.arrival?.actualTime || flight.arrival?.estimatedTime || flight.arrival?.scheduledTime;
        if (arrivalTime) {
          const arrivalDate = new Date(arrivalTime);
          return arrivalDate >= oneHourAgo && arrivalDate <= now;
        }
      }
      
      // Priority 3: Departing soon (within next 6 hours)
      const departureTime = flight.departure?.scheduledTime || flight.departure?.estimatedTime;
      if (departureTime) {
        const departureDate = new Date(departureTime);
        return departureDate >= now && departureDate <= sixHoursFromNow;
      }
      
      return false;
    });
    
    if (relevantFlights.length > 0) {
      // Sort by priority: live flights first, then departing soon, then recently arrived
      const sorted = relevantFlights.sort((a, b) => {
        const statusA = a.status?.toLowerCase() || '';
        const statusB = b.status?.toLowerCase() || '';
        
        // Live flights get highest priority
        const isLiveA = statusA.includes('en-route') || statusA.includes('departed') || statusA.includes('in-flight');
        const isLiveB = statusB.includes('en-route') || statusB.includes('departed') || statusB.includes('in-flight');
        
        if (isLiveA && !isLiveB) return -1;
        if (!isLiveA && isLiveB) return 1;
        
        // Then by nearest departure/arrival time
        const timeA = new Date(a.departure?.scheduledTime || a.arrival?.actualTime || 0).getTime();
        const timeB = new Date(b.departure?.scheduledTime || b.arrival?.actualTime || 0).getTime();
        return Math.abs(timeA - now.getTime()) - Math.abs(timeB - now.getTime());
      });
      
      console.log(`✅ [AI INSIGHTS] Found ${relevantFlights.length} relevant flights:`, sorted.map(f => ({
        flightNumber: f.flightNumber,
        status: f.status,
        departure: f.departure?.scheduledTime
      })));
      
      return sorted; // Return ALL relevant flights, not just one
    }
    
    console.log(`⚠️ [AI INSIGHTS] No relevant flights found (need: en-route, departing within 6h, or arrived within 1h)`);
    return [];
  }, [flights, selectedFlight]);

  // State
  const [insights, setInsights] = useState<TrackerAIInsight[]>([]);
  const [alerts, setAlerts] = useState<TrackerAIAlert[]>([]);
  const [predictions, setPredictions] = useState<TrackerAIPrediction[]>([]);
  const [aircraftInfo, setAircraftInfo] = useState<Record<string, AircraftInfo>>({});
  const [weatherInsights, setWeatherInsights] = useState<Record<string, WeatherInsight>>({});
  const [delayPolicies, setDelayPolicies] = useState<Record<string, DelayPolicy>>({});
  const [transportInfo, setTransportInfo] = useState<Record<string, AirportTransport>>({});
  const [alternativeFlights, setAlternativeFlights] = useState<Record<string, AlternativeFlight[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'insights' | 'alerts' | 'predictions' | 'aircraft' | 'weather' | 'policies' | 'transport' | 'alternatives'>('insights');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    insights: false,
    alerts: false,
    predictions: false,
    aircraft: false,
    weather: false,
    policies: false,
    transport: false,
    alternatives: false
  });
  
  // Rate limiting state - per component instance
  const [dailyCallCount, setDailyCallCount] = useState(0);
  const [apiCredits, setApiCredits] = useState(15); // Increased for better usability
  const MAX_DAILY_CALLS = 25; // Increased to allow more usage across tabs
  const CACHE_DURATION = 45 * 60 * 1000; // Reduced to 45 minutes for fresher data

  // Flight hash for cache key generation
  const flightHash = useMemo(() => {
    return mostRelevantFlight.map(f => `${f.flightNumber}_${f.departure?.scheduledTime}_${f.status}`).sort().join('|');
  }, [mostRelevantFlight]);

  // Cache management functions
  const getCacheKey = useCallback((type: string) => {
    return `tracker_ai_${type}_${flightHash}`;
  }, [flightHash]);

  const getCachedData = useCallback((type: string) => {
    try {
      const cached = localStorage.getItem(getCacheKey(type));
      if (cached) {
        const data = JSON.parse(cached);
        const isExpired = Date.now() - data.timestamp > CACHE_DURATION;
        if (!isExpired) {
          // console.log(`📦 [TRACKER] Using cached ${type} data`);
          return data.content;
        } else {
          localStorage.removeItem(getCacheKey(type));
        }
      }
    } catch (error) {}
    return null;
  }, [getCacheKey, CACHE_DURATION]);

  const setCachedData = useCallback((type: string, content: any) => {
    try {
      const cacheData = {
        content,
        timestamp: Date.now(),
        flightHash
      };
      localStorage.setItem(getCacheKey(type), JSON.stringify(cacheData));
      // console.log(`💾 [TRACKER] Cached ${type} data`);
    } catch (error) {}
  }, [getCacheKey, flightHash]);

  // Initialize rate limiting from localStorage - using global but more generous limits
  useEffect(() => {
    if (!flightHash) return; // Wait for flight hash to be ready
    
    const today = new Date().toDateString();
    const dateKey = `tracker_ai_insights_date_${flightHash}`;
    const countKey = `tracker_ai_insights_count_${flightHash}`;
    const creditsKey = `tracker_ai_insights_credits_${flightHash}`;
    
    const storedDate = localStorage.getItem(dateKey);
    const storedCount = parseInt(localStorage.getItem(countKey) || '0');
    const storedCredits = parseInt(localStorage.getItem(creditsKey) || '15');
    
    if (storedDate === today) {
      setDailyCallCount(storedCount);
      setApiCredits(storedCredits);
    } else {
      // Reset for new day with more generous limits
      setDailyCallCount(0);
      setApiCredits(15);
      localStorage.setItem(dateKey, today);
      localStorage.setItem(countKey, '0');
      localStorage.setItem(creditsKey, '15');
    }
  }, [flightHash]);

  // Check if we can make an API call - very permissive for tab data
  const canMakeCall = useCallback((priority: 'high' | 'medium' | 'low' = 'medium') => {
    // Always allow essential tab data (aircraft, weather, policies, transport, alternatives)
    if (priority === 'low') {
      return dailyCallCount < (MAX_DAILY_CALLS + 10); // Extra allowance for tab data
    }
    
    // High priority calls (insights, alerts, predictions) 
    if (priority === 'high') {
      return dailyCallCount < MAX_DAILY_CALLS && apiCredits > 0;
    }
    
    // Medium priority requires some credits left
    return dailyCallCount < MAX_DAILY_CALLS && apiCredits > 1;
  }, [dailyCallCount, apiCredits]);

  // Update rate limiting counters
  const updateCallCount = useCallback(() => {
    const newCount = dailyCallCount + 1;
    const newCredits = Math.max(0, apiCredits - 1);
    
    setDailyCallCount(newCount);
    setApiCredits(newCredits);
    
    const countKey = `tracker_ai_insights_count_${flightHash}`;
    const creditsKey = `tracker_ai_insights_credits_${flightHash}`;
    
    localStorage.setItem(countKey, newCount.toString());
    localStorage.setItem(creditsKey, newCredits.toString());
  }, [dailyCallCount, apiCredits, flightHash]);

  // Make Perplexity API call with priority-based rate limiting
  const makePerplexityCall = useCallback(async (_callId: string, prompt: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<string> => {
    // Rate limit check with detailed logging
    console.log(`⚡ [TRACKER] Checking API limits - Daily: ${dailyCallCount}/${MAX_DAILY_CALLS}, Credits: ${apiCredits}, Priority: ${priority}`);
    
    if (!canMakeCall(priority)) {
      const priorityMsg = priority === 'low' ? ' (low priority - try core features first)' : '';
      const error = `Rate limit reached: ${dailyCallCount}/${MAX_DAILY_CALLS} daily calls used, ${apiCredits} credits left${priorityMsg}`;
      console.error(`❌ [TRACKER] ${error}`);
      throw new Error(error);
    }

    console.log(`🚀 [TRACKER] Making Sonar API call (priority: ${priority}) (${dailyCallCount + 1}/${MAX_DAILY_CALLS})`);
    console.log(`📝 [TRACKER] Prompt preview: "${prompt.substring(0, 100)}..."`);

    try {
      // Direct Perplexity API call like FlightIntelligenceTab
      const apiKey = import.meta.env.VITE_SONAR_API_KEY;
      if (!apiKey) {
        console.error('❌ [TRACKER] API key missing');
        throw new Error('Sonar API key not configured');
      }

      console.log('📝 [TRACKER] API key found, making request...');

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
              role: 'system', 
              content: 'You are a professional aviation analyst specializing in real-time flight tracking and monitoring. Analyze tracked flights for operational insights, delay predictions, and travel advisories.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      console.log(`📡 [TRACKER] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [TRACKER] API Error ${response.status}:`, errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [TRACKER] Response received:', data);
      
      const content = data.choices?.[0]?.message?.content || '';
      
      if (!content) {
        console.error('❌ [TRACKER] No content in response:', data);
        throw new Error('No content in API response');
      }
      
      console.log(`✅ [TRACKER] Sonar API success, content length: ${content.length}`);
      
      // Update rate limiting counter
      updateCallCount();
      
      return content;
    } catch (error) { 
      console.error('❌ [TRACKER] Exception:', error);
      throw error; 
    }
  }, [canMakeCall, dailyCallCount, updateCallCount]);

  // Direct Sonar API call function with priority support
  const callSonarAPI = useCallback(async (prompt: string, callId: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<string> => {
    return makePerplexityCall(callId, prompt, priority);
  }, [makePerplexityCall]);

  // Generate insights for tracked flights
  // Generate insights with caching and optimization
  const generateInsights = useCallback(async (forceRefresh = false) => {
    if (mostRelevantFlight.length === 0) return [];

    // Check cache first (skip if forcing refresh)
    if (!forceRefresh) {
      const cached = getCachedData('insights');
      if (cached) {
        return cached.map((item: any) => ({ ...item, cached: true }));
      }
    }

    const flightDetails = mostRelevantFlight.map(flight => 
      `${flight.flightNumber} (${flight.airline.name}): ${flight.departure.airport} → ${flight.arrival.airport} at ${flight.departure.scheduledTime}. Status: ${flight.status}`
    ).join('\n');

    const prompt = `Analyze these tracked flights for aviation-specific operational insights ONLY:

${flightDetails}

STRICT REQUIREMENTS - Only provide insights related to:
1. Flight delay patterns and operational efficiency
2. Aircraft performance and reliability data
3. Airport operational status and traffic management
4. Weather impact on flight operations
5. Route optimization and air traffic conditions

DO NOT include general travel advice, booking suggestions, or non-aviation content.

Format response as JSON array:
[
  {
    "type": "delay|reliability|route|aircraft|weather",
    "title": "Aviation-specific insight title",
    "content": "Technical operational analysis only",
    "confidence": 85,
    "severity": "low|medium|high",
    "flightSpecific": "flight_number_if_specific_to_one_flight"
  }
]`;

      try {
        const response = await callSonarAPI(prompt, `tracker_insights_${mostRelevantFlight.length}_${Date.now()}`, 'high');
        const parsedInsights = parseInsightsResponse(response);
        
        // Only cache if we have real insights
        if (parsedInsights && parsedInsights.length > 0) {
          console.log(`💾 [TRACKER] Caching ${parsedInsights.length} insights`);
          setCachedData('insights', parsedInsights);
        } else {
          console.warn('⚠️ [TRACKER] No insights to cache');
        }
        
        return parsedInsights;
      } catch (error) {
        console.error('❌ [TRACKER] Failed to generate insights:', error);
        if (error instanceof Error) {
          console.error('  Details:', error.message);
          console.error('  Stack:', error.stack);
        }
        return []; // Return empty array instead of fallback data
      }
    }, [mostRelevantFlight, callSonarAPI, getCachedData, setCachedData]);  // Generate alerts for tracked flights
  const generateAlerts = useCallback(async (forceRefresh = false) => {
    if (mostRelevantFlight.length === 0) return [];

    // Check cache first (skip if forcing refresh)
    if (!forceRefresh) {
      const cached = getCachedData('alerts');
      if (cached) {
        return cached.map((item: any) => ({ ...item, cached: true }));
      }
    }

    const airports = [...new Set([
      ...mostRelevantFlight.map(f => f.departure.airport),
      ...mostRelevantFlight.map(f => f.arrival.airport)
    ])].join(', ');

    const airlines = [...new Set(mostRelevantFlight.map(f => f.airline.name))].join(', ');

    const prompt = `Monitor real-time alerts for tracked flights at airports: ${airports} and airlines: ${airlines}.

Check for:
1. Live weather conditions and warnings
2. Current airport operational alerts
3. Airline operational disruptions
4. Security or government travel advisories
5. Real-time ground stops or traffic management

Format as JSON array:
[
  {
    "type": "weather|airport|airline|government|security",
    "title": "Alert title", 
    "content": "Real-time alert details",
    "source": "Data source",
    "priority": "low|medium|high|critical",
    "affectedFlights": ["FL123", "FL456"]
  }
]`;

    try {
      const response = await callSonarAPI(prompt, `tracker_alerts_${airports.length}_${Date.now()}`, 'high');
      const parsedAlerts = parseAlertsResponse(response);
      
      // Cache the results
      setCachedData('alerts', parsedAlerts);
      
      return parsedAlerts;
    } catch (error) {
      console.error('[TRACKER] Failed to generate alerts:', error);
      return []; // Return empty array instead of fallback data
    }
  }, [mostRelevantFlight, callSonarAPI, getCachedData, setCachedData]);

  // Generate predictions for tracked flights
  const generatePredictions = useCallback(async (forceRefresh = false) => {
    if (mostRelevantFlight.length === 0) {
      // console.log('[TRACKER] No flights provided for predictions');
      return [];
    }

    // console.log(`[TRACKER] Checking ${mostRelevantFlight.length} flights for predictions:`, mostRelevantFlight.map(f => ({
    //   flightNumber: f.flightNumber,
    //   status: f.status,
    //   departure: f.departure?.scheduledTime
    // })));

    // Check cache first (skip if forcing refresh)
    if (!forceRefresh) {
      const cached = getCachedData('predictions');
      if (cached) {
        return cached.map((item: any) => ({ ...item, cached: true }));
      }
    }

    // Include flights that are relevant for predictions - expand criteria
    const relevantFlights = mostRelevantFlight.filter(f => {
      const status = f.status?.toLowerCase() || '';
      
      // Check if flight is upcoming (future departure)
      const departureTime = f.departure?.scheduledTime || f.departure?.estimatedTime;
      const isUpcoming = departureTime && new Date(departureTime) > new Date();
      
      // Include:
      // 1. Active flights (not landed/arrived)
      // 2. Upcoming scheduled flights 
      // 3. Flights with unclear status but have departure time
      const isRelevant = !status.includes('landed') && 
                        !status.includes('arrived') && 
                        !status.includes('completed') &&
                        !status.includes('cancelled') &&
                        (isUpcoming || !status.includes('departed') || departureTime);
      
      // console.log(`[TRACKER] Flight ${f.flightNumber}: status="${status}", upcoming=${isUpcoming}, relevant=${isRelevant}`);
      return isRelevant;
    });

    // console.log(`[TRACKER] Found ${relevantFlights.length} relevant flights for predictions:`, 
    //   relevantFlights.map(f => f.flightNumber));

    if (relevantFlights.length === 0) {
      // console.log('[TRACKER] No relevant flights found for predictions - returning empty array');
      return [];
    }

    // Build detailed flight context for better predictions
    const flightDetails = relevantFlights.map(f => {
      const departureTime = f.departure?.scheduledTime || f.departure?.estimatedTime || 'TBD';
      const currentStatus = f.status || 'Scheduled';
      
      return `${f.flightNumber} (${f.airline.name}): ${f.departure?.airport} → ${f.arrival?.airport}
      Scheduled: ${departureTime}
      Current Status: ${currentStatus}
      Aircraft: ${f.aircraft?.type || 'TBD'}`;
    }).join('\n\n');

    const prompt = `Analyze these tracked flights and predict outcomes based on real-time aviation data:

${flightDetails}

For EACH flight, provide predictions considering:
1. Real-time weather conditions at departure/arrival airports
2. Current airport operational status and delays
3. Airline operational performance today
4. Historical delay patterns for this route/time
5. Air traffic control constraints
6. Aircraft availability and maintenance schedules

For scheduled flights: Check online for current estimated departure times and any pre-departure delays.
For active flights: Predict arrival delays, gate changes, diversions.

Format as JSON array:
[
  {
    "flightNumber": "AA123",
    "type": "delay|on_time|cancellation|gate_change|diversion",
    "probability": 75,
    "reason": "Specific operational reason based on current conditions",
    "timeframe": "Next 2-4 hours",
    "confidence": 85,
    "impact": "low|medium|high",
    "estimatedDelay": "45 minutes",
    "recommendation": "Action passenger should take"
  }
]

Ensure each tracked flight has a prediction entry.`;

    try {
      const response = await callSonarAPI(prompt, `tracker_predictions_${relevantFlights.length}_${Date.now()}`, 'high');
      const parsedPredictions = parsePredictionsResponse(response, relevantFlights);
      
      // Cache the results
      setCachedData('predictions', parsedPredictions);
      
      return parsedPredictions;
    } catch (error) {
      console.error('[TRACKER] Failed to generate predictions:', error);
      return []; // Return empty array instead of fallback data
    }
  }, [mostRelevantFlight, callSonarAPI, getCachedData, setCachedData]);

  // Generate aircraft information with caching - cost optimized
  const generateAircraftInfo = useCallback(async (aircraftTypes: string[]) => {
    const uniqueAircraft = [...new Set(aircraftTypes)].filter(Boolean);
    if (uniqueAircraft.length === 0) return {};

    setLoadingStates(prev => ({ ...prev, aircraft: true }));

    const results: Record<string, AircraftInfo> = {};
    const uncachedAircraft: string[] = [];
    
    // First, load all cached data
    for (const aircraft of uniqueAircraft) {
      const cached = getCachedData(`aircraft_${aircraft}`);
      if (cached) {
        results[aircraft] = cached;
      } else {
        uncachedAircraft.push(aircraft);
      }
    }

    // Handle flights with missing aircraft info by checking flight data for aircraft type
    const flightBasedAircraft = mostRelevantFlight.filter(f => !f.aircraft?.type || f.aircraft.type.trim() === '')
      .map(f => {
        // Try to derive aircraft from flight number pattern or airline
        const flightNum = f.flightNumber || '';
        const airline = f.airline?.name || '';
        
        // Common patterns for aircraft identification
        if (airline.toLowerCase().includes('american') && flightNum.match(/^\d{1,4}$/)) {
          return 'Boeing 737'; // Common for domestic American flights
        } else if (airline.toLowerCase().includes('united') && flightNum.match(/^\d{1,4}$/)) {
          return 'Airbus A320'; // Common for United domestic
        } else if (airline.toLowerCase().includes('delta') && flightNum.match(/^\d{1,4}$/)) {
          return 'Boeing 737';
        }
        return `${airline} Aircraft`; // Generic fallback
      });

    // Add flight-based aircraft to uncached list
    flightBasedAircraft.forEach(aircraft => {
      if (aircraft && !uncachedAircraft.includes(aircraft)) {
        uncachedAircraft.push(aircraft);
      }
    });

    // Only make API calls for uncached aircraft, and limit to 2 calls max for cost efficiency
    for (const aircraft of uncachedAircraft.slice(0, 2)) {
      if (!canMakeCall('low')) {
        console.warn(`⚠️ [TRACKER] Skipping aircraft ${aircraft} - rate limit reached (try refreshing core insights first)`);
        continue;
      }

      try {
        const prompt = `Provide detailed aircraft information for: ${aircraft}

AVIATION TECHNICAL SPECS ONLY:
1. Manufacturer and exact model designation
2. Passenger capacity and cargo capacity
3. Range and fuel efficiency
4. Engine specifications and performance
5. Safety features and certifications
6. Cabin amenities and configuration options

If the aircraft type is generic (like "American Aircraft"), provide information about the most common aircraft type used by that airline for domestic routes.

Format as JSON: {
  "model": "A320neo",
  "manufacturer": "Airbus",
  "capacity": 180,
  "range": 6500,
  "description": "Technical description",
  "amenities": ["WiFi", "IFE"],
  "safetyRating": "Excellent"
}`;

        const response = await callSonarAPI(prompt, `aircraft_${aircraft}_${Date.now()}`, 'low');
        const aircraftData = parseAircraftResponse(response, aircraft);
        
        setCachedData(`aircraft_${aircraft}`, aircraftData);
        results[aircraft] = aircraftData;
      } catch (error) {
        console.error(`[TRACKER] Failed to get aircraft info for ${aircraft}:`, error);
        // Skip this aircraft - no fallback data
      }
    }
    
    setLoadingStates(prev => ({ ...prev, aircraft: false }));
    return results;
  }, [callSonarAPI, getCachedData, setCachedData, canMakeCall, mostRelevantFlight]);

  // Generate weather insights with caching - cost optimized
  const generateWeatherInsights = useCallback(async (airports: string[]) => {
    const uniqueAirports = [...new Set(airports)].filter(Boolean);
    if (uniqueAirports.length === 0) return {};

    setLoadingStates(prev => ({ ...prev, weather: true }));

    const results: Record<string, WeatherInsight> = {};
    const uncachedAirports: string[] = [];
    
    // First, load all cached data
    for (const airport of uniqueAirports) {
      const cached = getCachedData(`weather_${airport}`);
      if (cached) {
        results[airport] = cached;
      } else {
        uncachedAirports.push(airport);
      }
    }

    // Only make API calls for uncached airports, limit to 2 calls max for cost efficiency
    for (const airport of uncachedAirports.slice(0, 2)) {
      if (!canMakeCall('low')) {
        console.warn(`⚠️ [TRACKER] Skipping weather for ${airport} - rate limit reached (try refreshing core insights first)`);
        continue;
      }

      try {
        const prompt = `Current weather and aviation impact for ${airport} airport:

AVIATION WEATHER FOCUS ONLY:
1. Current weather conditions affecting flight operations
2. Visibility, wind conditions, precipitation
3. Short-term forecast impact on departures/arrivals
4. Potential operational delays due to weather
5. Turbulence and wind shear conditions

Format as JSON: {
  "departure": {
    "current": "Clear, 15°C, Wind 10kt",
    "forecast": "Deteriorating to rain",
    "impact": "medium"
  },
  "arrival": { ... },
  "route": {
    "conditions": "Moderate turbulence expected",
    "turbulence": "medium"
  }
}`;

        const response = await callSonarAPI(prompt, `weather_${airport}_${Date.now()}`, 'low');
        const weatherData = parseWeatherResponse(response);
        
        setCachedData(`weather_${airport}`, weatherData);
        results[airport] = weatherData;
      } catch (error) {
        console.error(`[TRACKER] Failed to get weather for ${airport}:`, error);
        // Skip this airport - no fallback data
      }
    }
    
    setLoadingStates(prev => ({ ...prev, weather: false }));
    return results;
  }, [callSonarAPI, getCachedData, setCachedData, canMakeCall]);

  // Generate delay policies with caching - cost optimized
  const generateDelayPolicies = useCallback(async (airlines: string[]) => {
    const uniqueAirlines = [...new Set(airlines)].filter(Boolean);
    if (uniqueAirlines.length === 0) return {};

    setLoadingStates(prev => ({ ...prev, policies: true }));

    const results: Record<string, DelayPolicy> = {};
    const uncachedAirlines: string[] = [];
    
    // First, load all cached data
    for (const airline of uniqueAirlines) {
      const cached = getCachedData(`policy_${airline}`);
      if (cached) {
        results[airline] = cached;
      } else {
        uncachedAirlines.push(airline);
      }
    }

    // Only make API calls for uncached airlines, limit to 1 call max for cost efficiency
    for (const airline of uncachedAirlines.slice(0, 1)) {
      if (!canMakeCall('low')) {
        console.warn(`⚠️ [TRACKER] Skipping policies for ${airline} - rate limit reached (try refreshing core insights first)`);
        continue;
      }

      try {
        const prompt = `${airline} airline delay and cancellation policies:

PASSENGER RIGHTS AND POLICIES ONLY:
1. Compensation for delays over 1 hour
2. Meal vouchers and accommodation policies
3. Rebooking options and flexibility
4. Cancellation refund policies
5. Alternative flight arrangements
6. Contact information for claims

Format as JSON: {
  "airline": "${airline}",
  "oneHourPlus": {
    "compensation": "Amount or description",
    "vouchers": "Meal/hotel voucher policy",
    "rebooking": "Free rebooking policy"
  },
  "cancellation": { ... },
  "alternatives": ["Option 1", "Option 2"]
}`;

        const response = await callSonarAPI(prompt, `policy_${airline}_${Date.now()}`, 'low');
        const policyData = parsePolicyResponse(response, airline);
        
        setCachedData(`policy_${airline}`, policyData);
        results[airline] = policyData;
      } catch (error) {
        console.error(`[TRACKER] Failed to get policies for ${airline}:`, error);
        // Skip this airline - no fallback data
      }
    }
    
    setLoadingStates(prev => ({ ...prev, policies: false }));
    return results;
  }, [callSonarAPI, getCachedData, setCachedData, canMakeCall]);

  // Generate airport transport with caching - cost optimized with proper airport details
  const generateTransportInfo = useCallback(async (airports: string[]) => {
    const uniqueAirports = [...new Set(airports)].filter(Boolean);
    if (uniqueAirports.length === 0) return {};

    setLoadingStates(prev => ({ ...prev, transport: true }));

    const results: Record<string, AirportTransport> = {};
    const uncachedAirports: string[] = [];
    
    // Import airport data to get full names and countries, with AI fallback
    let airportsData: any = {};
    try {
      const airportsModule = await import('@/data/airports.json');
      airportsData = airportsModule.default?.airports || airportsModule.airports || {};
    } catch (error) {
      console.warn('[TRACKER] Could not load airports data:', error);
    }
    
    // First, load all cached data
    for (const airport of uniqueAirports) {
      const cached = getCachedData(`transport_${airport}`);
      if (cached) {
        results[airport] = cached;
      } else {
        uncachedAirports.push(airport);
      }
    }

    // Determine if airport is departure or arrival for better context
    const departureAirports = [...new Set(mostRelevantFlight.map(f => f.departure?.airport))].filter(Boolean);
    const arrivalAirports = [...new Set(mostRelevantFlight.map(f => f.arrival?.airport))].filter(Boolean);

    // Only make API calls for uncached airports, limit to 2 calls max for cost efficiency
    for (const airport of uncachedAirports.slice(0, 2)) {
      if (!canMakeCall('low')) {
        console.warn(`⚠️ [TRACKER] Skipping transport for ${airport} - rate limit reached (try refreshing core insights first)`);
        continue;
      }

      try {
        const isDeparture = departureAirports.includes(airport);
        const isArrival = arrivalAirports.includes(airport);
        
        // Get airport details with AI fallback for accuracy
        let airportName, cityName, countryName;
        const localAirport = airportsData[airport];
        
        if (localAirport && localAirport.country && localAirport.country !== 'Country') {
          // Use local data if it exists and has valid country info
          airportName = localAirport.name || `${airport} Airport`;
          cityName = localAirport.city || 'City';
          countryName = localAirport.country;
          // console.log(`[TRACKER] Using local data for ${airport}: ${cityName}, ${countryName}`);
        } else {
          // Use AI search for accurate information
          try {
            // console.log(`[TRACKER] Using AI search for accurate airport info: ${airport}`);
            const aiInfo = await searchAirportDetailsAI(airport);
            airportName = aiInfo.name || `${airport} Airport`;
            cityName = aiInfo.city || airport;
            countryName = aiInfo.country || 'Unknown';
            // console.log(`[TRACKER] AI search result for ${airport}: ${cityName}, ${countryName}`);
    } catch (error) {
            airportName = localAirport?.name || `${airport} Airport`;
            cityName = localAirport?.city || airport;
            countryName = localAirport?.country || 'Unknown';
          }
        }
        
        // Get currency for the country
        const currencyMap: Record<string, string> = {
          'India': 'INR (₹)',
          'United States': 'USD ($)',
          'United Kingdom': 'GBP (£)',
          'Germany': 'EUR (€)',
          'France': 'EUR (€)',
          'Japan': 'JPY (¥)',
          'China': 'CNY (¥)',
          'Australia': 'AUD ($)',
          'Canada': 'CAD ($)',
          'Singapore': 'SGD ($)',
          'UAE': 'AED (AED)',
          'Thailand': 'THB (฿)',
          'South Korea': 'KRW (₩)',
          'Malaysia': 'MYR (RM)',
          'Indonesia': 'IDR (Rp)',
          'Philippines': 'PHP (₱)',
          'Turkey': 'TRY (₺)',
          'Saudi Arabia': 'SAR (SAR)',
          'Qatar': 'QAR (QAR)',
          'Kuwait': 'KWD (KWD)',
          'Brazil': 'BRL (R$)',
          'Mexico': 'MXN ($)',
          'South Africa': 'ZAR (R)',
          'Egypt': 'EGP (EGP)',
          'Israel': 'ILS (₪)',
          'Russia': 'RUB (₽)',
          'Netherlands': 'EUR (€)',
          'Italy': 'EUR (€)',
          'Spain': 'EUR (€)',
          'Switzerland': 'CHF (CHF)',
          'Sweden': 'SEK (kr)',
          'Norway': 'NOK (kr)',
          'Denmark': 'DKK (kr)',
          'Poland': 'PLN (zł)',
          'Czech Republic': 'CZK (Kč)',
          'Hungary': 'HUF (Ft)',
          'Greece': 'EUR (€)',
          'Portugal': 'EUR (€)',
          'Austria': 'EUR (€)',
          'Belgium': 'EUR (€)',
          'Ireland': 'EUR (€)',
          'Finland': 'EUR (€)',
          'Lithuania': 'EUR (€)',
          'Latvia': 'EUR (€)',
          'Estonia': 'EUR (€)',
          'Croatia': 'EUR (€)',
          'Slovenia': 'EUR (€)',
          'Slovakia': 'EUR (€)',
          'Bulgaria': 'BGN (лв)',
          'Romania': 'RON (lei)',
          'Serbia': 'RSD (RSD)',
          'Bosnia and Herzegovina': 'BAM (KM)',
          'Montenegro': 'EUR (€)',
          'North Macedonia': 'MKD (ден)',
          'Albania': 'ALL (L)',
          'Moldova': 'MDL (L)',
          'Ukraine': 'UAH (₴)',
          'Belarus': 'BYN (Br)',
          'Georgia': 'GEL (₾)',
          'Armenia': 'AMD (֏)',
          'Azerbaijan': 'AZN (₼)',
          'Kazakhstan': 'KZT (₸)',
          'Uzbekistan': 'UZS (so\'m)',
          'Kyrgyzstan': 'KGS (с)',
          'Tajikistan': 'TJS (ЅМ)',
          'Turkmenistan': 'TMT (T)',
          'Mongolia': 'MNT (₮)',
          'North Korea': 'KPW (₩)',
          'Vietnam': 'VND (₫)',
          'Cambodia': 'KHR (៛)',
          'Laos': 'LAK (₭)',
          'Myanmar': 'MMK (K)',
          'Bangladesh': 'BDT (৳)',
          'Sri Lanka': 'LKR (Rs)',
          'Pakistan': 'PKR (Rs)',
          'Afghanistan': 'AFN (؋)',
          'Iran': 'IRR (﷼)',
          'Iraq': 'IQD (ع.د)',
          'Syria': 'SYP (£)',
          'Lebanon': 'LBP (£)',
          'Jordan': 'JOD (JD)',
          'Yemen': 'YER (﷼)',
          'Oman': 'OMR (﷼)',
          'Bahrain': 'BHD (BD)',
          'Morocco': 'MAD (د.م.)',
          'Algeria': 'DZD (د.ج)',
          'Tunisia': 'TND (د.ت)',
          'Libya': 'LYD (ل.د)',
          'Sudan': 'SDG (ج.س.)',
          'Ethiopia': 'ETB (Br)',
          'Kenya': 'KES (KSh)',
          'Tanzania': 'TZS (TSh)',
          'Uganda': 'UGX (USh)',
          'Rwanda': 'RWF (FRw)',
          'Ghana': 'GHS (₵)',
          'Nigeria': 'NGN (₦)',
          'Senegal': 'XOF (F)',
          'Ivory Coast': 'XOF (F)',
          'Mali': 'XOF (F)',
          'Burkina Faso': 'XOF (F)',
          'Niger': 'XOF (F)',
          'Guinea': 'GNF (FG)',
          'Sierra Leone': 'SLL (Le)',
          'Liberia': 'LRD ($)',
          'Gambia': 'GMD (D)',
          'Cape Verde': 'CVE ($)',
          'Mauritania': 'MRU (UM)',
          'Chad': 'XAF (F)',
          'Central African Republic': 'XAF (F)',
          'Cameroon': 'XAF (F)',
          'Equatorial Guinea': 'XAF (F)',
          'Gabon': 'XAF (F)',
          'Republic of the Congo': 'XAF (F)',
          'Democratic Republic of the Congo': 'CDF (FC)',
          'Angola': 'AOA (Kz)',
          'Zambia': 'ZMW (K)',
          'Zimbabwe': 'ZWL ($)',
          'Botswana': 'BWP (P)',
          'Namibia': 'NAD ($)',
          'Lesotho': 'LSL (L)',
          'Swaziland': 'SZL (L)',
          'Madagascar': 'MGA (Ar)',
          'Mauritius': 'MUR (Rs)',
          'Seychelles': 'SCR (Sr)',
          'Comoros': 'KMF (CF)',
          'Djibouti': 'DJF (Fdj)',
          'Eritrea': 'ERN (Nfk)',
          'Somalia': 'SOS (S)',
          'Maldives': 'MVR (Rf)',
          'Bhutan': 'BTN (Nu)',
          'Nepal': 'NPR (Rs)',
          'Brunei': 'BND ($)',
          'East Timor': 'USD ($)',
          'Papua New Guinea': 'PGK (K)',
          'Fiji': 'FJD ($)',
          'Solomon Islands': 'SBD ($)',
          'Vanuatu': 'VUV (Vt)',
          'Samoa': 'WST (T)',
          'Tonga': 'TOP (T$)',
          'Palau': 'USD ($)',
          'Micronesia': 'USD ($)',
          'Marshall Islands': 'USD ($)',
          'Kiribati': 'AUD ($)',
          'Tuvalu': 'AUD ($)',
          'Nauru': 'AUD ($)',
          'New Zealand': 'NZD ($)',
          'Cook Islands': 'NZD ($)',
          'Niue': 'NZD ($)',
          'Tokelau': 'NZD ($)',
          'American Samoa': 'USD ($)',
          'Guam': 'USD ($)',
          'Northern Mariana Islands': 'USD ($)',
          'Puerto Rico': 'USD ($)',
          'US Virgin Islands': 'USD ($)',
          'British Virgin Islands': 'USD ($)',
          'Anguilla': 'XCD ($)',
          'Antigua and Barbuda': 'XCD ($)',
          'Dominica': 'XCD ($)',
          'Grenada': 'XCD ($)',
          'Montserrat': 'XCD ($)',
          'Saint Kitts and Nevis': 'XCD ($)',
          'Saint Lucia': 'XCD ($)',
          'Saint Vincent and the Grenadines': 'XCD ($)',
          'Barbados': 'BBD ($)',
          'Trinidad and Tobago': 'TTD ($)',
          'Jamaica': 'JMD ($)',
          'Bahamas': 'BSD ($)',
          'Cuba': 'CUP ($)',
          'Haiti': 'HTG (G)',
          'Dominican Republic': 'DOP ($)',
          'Belize': 'BZD ($)',
          'Guatemala': 'GTQ (Q)',
          'El Salvador': 'USD ($)',
          'Honduras': 'HNL (L)',
          'Nicaragua': 'NIO (C$)',
          'Costa Rica': 'CRC (₡)',
          'Panama': 'PAB (B/.)',
          'Colombia': 'COP ($)',
          'Venezuela': 'VED (Bs)',
          'Guyana': 'GYD ($)',
          'Suriname': 'SRD ($)',
          'French Guiana': 'EUR (€)',
          'Ecuador': 'USD ($)',
          'Peru': 'PEN (S/.)',
          'Bolivia': 'BOB (Bs)',
          'Paraguay': 'PYG (₲)',
          'Uruguay': 'UYU ($)',
          'Argentina': 'ARS ($)',
          'Chile': 'CLP ($)',
          'Falkland Islands': 'FKP (£)'
        };
        
        const localCurrency = currencyMap[countryName] || 'Local Currency';
        
        let contextInfo = '';
        let transportDirection = '';
        if (isDeparture && isArrival) {
          contextInfo = 'This airport serves as both departure and arrival - provide comprehensive transport options for both directions (to/from city center).';
          transportDirection = 'bidirectional';
        } else if (isDeparture) {
          contextInfo = 'This is a departure airport - focus on transport options TO the airport from city center and popular areas.';
          transportDirection = 'to_airport';
        } else if (isArrival) {
          contextInfo = 'This is an arrival airport - focus on transport options FROM the airport to city center and popular destinations.';
          transportDirection = 'from_airport';
        }

        const prompt = `Ground transport options for ${airportName} (${airport}) in ${cityName}, ${countryName}:

${contextInfo}

COMPREHENSIVE TRANSPORT INFORMATION:
1. Full airport name: ${airportName}
2. City: ${cityName}, ${countryName}
3. Local Currency: ${localCurrency}
4. Transport direction: ${transportDirection}

Provide detailed transport options with LOCAL CURRENCY pricing:
1. Taxi services with estimated costs in ${localCurrency} (${transportDirection === 'to_airport' ? 'to airport from city center' : transportDirection === 'from_airport' ? 'from airport to city center' : 'both directions'})
2. Public transportation (train, metro, bus) with fares in ${localCurrency} and exact routes/stops
3. Car rental availability with daily rates in ${localCurrency}
4. Ride-sharing services (Uber, Lyft, local apps) with approximate costs in ${localCurrency}
5. Airport shuttles and express services with pricing in ${localCurrency}
6. Operating hours, frequency, and accurate travel time estimates
7. Specific terminals/stops and best access routes
8. Distance from city center and major landmarks

Format as JSON: {
  "airport": "${airport}",
  "fullName": "${airportName}",
  "city": "${cityName}",
  "country": "${countryName}",
  "currency": "${localCurrency}",
  "options": [
    {
      "type": "taxi|train|bus|metro|car_rental|rideshare|shuttle",
      "name": "Exact service name",
      "cost": "Price in ${localCurrency}",
      "duration": "Accurate travel time",
      "availability": "Detailed operating hours",
      "route": "Specific route/stops",
      "distance": "Distance from city center"
    }
  ]
}`;

        const response = await callSonarAPI(prompt, `transport_${airport}_${Date.now()}`, 'low');
        const transportData = parseTransportResponse(response, airport);
        
        // Only cache and use if we got valid data (not the fallback)
        if (transportData.options.length > 0 && !transportData.options[0].name.includes('Configure API key')) {
          setCachedData(`transport_${airport}`, transportData);
          results[airport] = transportData;
        } else {
          console.warn(`⚠️ [TRACKER] Invalid transport data for ${airport}, skipping...`);
        }
    } catch (error) {
        console.warn(`⚠️ [TRACKER] Failed to fetch transport for ${airport}:`, error);
        // Skip this airport - don't add fallback data
      }
    }
    
    setLoadingStates(prev => ({ ...prev, transport: false }));
    return results;
  }, [callSonarAPI, getCachedData, setCachedData, canMakeCall, mostRelevantFlight]);

  // Real-time airport search using AI when local data is missing or incorrect
  const searchAirportDetailsAI = useCallback(async (airportCode: string): Promise<{
    name: string;
    city: string;
    country: string;
    currency: string;
  }> => {
    try {
      const prompt = `Find EXACT airport information for IATA code "${airportCode}":

CRITICAL: Match the airport using its IATA code "${airportCode}" ONLY. Do not confuse city codes with airport codes.

REQUIRED INFORMATION:
1. Full official airport name (e.g., "Indira Gandhi International Airport" for DEL)
2. Exact city where THIS SPECIFIC airport is located
3. Country where THIS airport is located
4. Local currency with symbol

EXAMPLES OF CORRECT MATCHES:
- DEL (IATA) = Indira Gandhi International Airport, Delhi (not New Delhi city), India, INR (₹)
- JFK (IATA) = John F. Kennedy International Airport, New York (Queens), United States, USD ($)
- LHR (IATA) = Heathrow Airport, London, United Kingdom, GBP (£)
- DXB (IATA) = Dubai International Airport, Dubai, United Arab Emirates, AED (AED)
- CDG (IATA) = Charles de Gaulle Airport, Paris, France, EUR (€)
- SIN (IATA) = Singapore Changi Airport, Singapore, Singapore, SGD ($)

VERIFY: The IATA code "${airportCode}" must match the airport code, NOT the city code.

Format as JSON: {
  "name": "Full Official Airport Name",
  "city": "City Name (where airport is physically located)",
  "country": "Country Name", 
  "currency": "Currency Code (Symbol)"
}`;

      const response = await callSonarAPI(prompt, `airport_search_${airportCode}_${Date.now()}`, 'low');
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            name: parsed.name || `${airportCode} Airport`,
            city: parsed.city || 'Unknown City',
            country: parsed.country || 'Unknown Country',
            currency: parsed.currency || 'Local Currency'
          };
        }
      } catch (parseError) {
      }

      // Fallback: Extract information from text response
      const lines = response.split('\n').filter(line => line.trim());
      let name = `${airportCode} Airport`;
      let city = 'Unknown City';
      let country = 'Unknown Country';
      let currency = 'Local Currency';

      for (const line of lines) {
        if (line.toLowerCase().includes('airport') && line.toLowerCase().includes(airportCode.toLowerCase())) {
          const match = line.match(/([^,]+)/);
          if (match) name = match[1].trim();
        }
        if (line.toLowerCase().includes('city') || line.toLowerCase().includes('located')) {
          const cityMatch = line.match(/(?:city|located|in)\s*:?\s*([^,\n]+)/i);
          if (cityMatch) city = cityMatch[1].trim();
        }
        if (line.toLowerCase().includes('country')) {
          const countryMatch = line.match(/country\s*:?\s*([^,\n]+)/i);
          if (countryMatch) country = countryMatch[1].trim();
        }
        if (line.toLowerCase().includes('currency')) {
          const currencyMatch = line.match(/currency\s*:?\s*([^,\n]+)/i);
          if (currencyMatch) currency = currencyMatch[1].trim();
        }
      }

      return { name, city, country, currency };
    } catch (error) {
      return {
        name: `${airportCode} Airport`,
        city: 'Unknown City',
        country: 'Unknown Country',
        currency: 'Local Currency'
      };
    }
  }, [callSonarAPI]);
  const generateAlternativeFlights = useCallback(async (routes: string[]) => {
    if (!canMakeCall('low') || routes.length === 0) return {};

    setLoadingStates(prev => ({ ...prev, alternatives: true }));
    
    const results: Record<string, AlternativeFlight[]> = {};
    
    for (const route of routes) {
      const cacheKey = `alternatives_${route}`;
      const cached = getCachedData(cacheKey);
      
      if (cached) {
        results[route] = cached;
        continue;
      }

      try {
        const response = await callSonarAPI(
          `Find alternative flights for route ${route}. Provide real flight options from major airlines for this route with current availability, pricing, and schedules. Focus on flights departing within the next 6-12 hours.`,
          'low'
        );

        if (response) {
          const alternativeList = parseAlternativeFlightsResponse(response, route);
          results[route] = alternativeList;
          setCachedData(cacheKey, alternativeList);
        }
      } catch (error) {
        // Skip this route - no fallback alternatives
      }
    }
    
    setLoadingStates(prev => ({ ...prev, alternatives: false }));
    return results;
  }, [callSonarAPI, getCachedData, setCachedData, canMakeCall]);

  // Helper function to detect delayed or cancelled flights
  const getProblematicFlights = useCallback(() => {
    return mostRelevantFlight.filter(flight => {
      const status = flight.status?.toLowerCase() || '';
      const isDelayed = status.includes('delayed') || status.includes('late');
      const isCancelled = status.includes('cancelled') || status.includes('canceled');
      
      // Check for significant delays (more than 2 hours)
      const hasSignificantDelay = flight.departure?.estimatedTime && flight.departure?.scheduledTime && 
        new Date(flight.departure.estimatedTime).getTime() - new Date(flight.departure.scheduledTime).getTime() > 2 * 60 * 60 * 1000;
      
      return isDelayed || isCancelled || hasSignificantDelay;
    });
  }, [mostRelevantFlight]);

  // Parse alternative flights response
  const parseAlternativeFlightsResponse = (response: string, route: string): AlternativeFlight[] => {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((flight: any) => ({
          flightNumber: flight.flightNumber || 'N/A',
          airline: flight.airline || 'Unknown',
          departureTime: flight.departureTime || 'TBD',
          arrivalTime: flight.arrivalTime || 'TBD',
          duration: flight.duration || 'N/A',
          route: route,
          price: flight.price || 'Check airline',
          aircraft: flight.aircraft || 'TBD',
          status: flight.status || 'available'
        }));
      }
    } catch (error) {
    }
    
    return []; // Return empty array instead of fallback data
  };

  // Load data on demand for specific panels - with intelligent caching
  const loadPanelData = useCallback(async (panelType: string) => {
    if (mostRelevantFlight.length === 0) {
      return; // Don't load any mock data, just return
    }

    // Include both explicit aircraft types and derive missing ones from saved flights
    const aircraftTypes = mostRelevantFlight.map(f => f.aircraft?.type).filter((type): type is string => Boolean(type));
    
    // Also check if saved flights have aircraft info that current flights are missing
    const aircraftFromSaved = mostRelevantFlight.map(f => {
      // If flight has aircraft type, use it
      if (f.aircraft?.type) return f.aircraft.type;
      
      // Otherwise try to get aircraft info from the actual flight data
      return f.aircraft?.registration ? `Aircraft ${f.aircraft.registration}` : null;
    }).filter((type): type is string => Boolean(type));
    
    const missingAircraftFlights = mostRelevantFlight.filter(f => !f.aircraft?.type || f.aircraft.type.trim() === '');
    
    // Add derived aircraft types for flights missing aircraft info
    const derivedAircraft = missingAircraftFlights.map(f => {
      const airline = f.airline?.name || '';
      const flightNum = f.flightNumber || '';
      
      // Use common aircraft patterns based on airline and route
      if (airline.toLowerCase().includes('american')) {
        if (flightNum.match(/^[0-9]{1,3}$/)) return 'Boeing 737-800'; // Domestic
        if (flightNum.match(/^[0-9]{4}$/)) return 'Airbus A321'; // Transcon
        return 'Boeing 737';
      }
      if (airline.toLowerCase().includes('united')) {
        if (flightNum.match(/^[0-9]{1,3}$/)) return 'Airbus A320'; // Domestic
        if (flightNum.match(/^[0-9]{4}$/)) return 'Boeing 787'; // International
        return 'Airbus A320';
      }
      if (airline.toLowerCase().includes('delta')) {
        if (flightNum.match(/^[0-9]{1,3}$/)) return 'Boeing 737-900'; // Domestic
        if (flightNum.match(/^[0-9]{4}$/)) return 'Airbus A350'; // International
        return 'Boeing 737';
      }
      if (airline.toLowerCase().includes('southwest')) return 'Boeing 737-800';
      if (airline.toLowerCase().includes('jetblue')) return 'Airbus A320';
      if (airline.toLowerCase().includes('alaska')) return 'Boeing 737-900';
      if (airline.toLowerCase().includes('frontier')) return 'Airbus A320neo';
      if (airline.toLowerCase().includes('spirit')) return 'Airbus A320';
      
      // International airlines
      if (airline.toLowerCase().includes('lufthansa')) return 'Airbus A320';
      if (airline.toLowerCase().includes('british airways')) return 'Boeing 777';
      if (airline.toLowerCase().includes('air france')) return 'Airbus A350';
      if (airline.toLowerCase().includes('emirates')) return 'Boeing 777';
      if (airline.toLowerCase().includes('qatar')) return 'Airbus A350';
      if (airline.toLowerCase().includes('singapore')) return 'Boeing 787';
      if (airline.toLowerCase().includes('air india')) return 'Boeing 737-800';
      if (airline.toLowerCase().includes('indigo')) return 'Airbus A320neo';
      if (airline.toLowerCase().includes('spicejet')) return 'Boeing 737-800';
      if (airline.toLowerCase().includes('vistara')) return 'Airbus A320neo';
      
      // Generic fallback with airline context
      return `${airline} Standard Aircraft`;
    });
    
    const allAircraftTypes = [...aircraftTypes, ...aircraftFromSaved, ...derivedAircraft].filter((type): type is string => Boolean(type));
    
    // console.log(`[TRACKER] Aircraft types for ${panelType}:`, allAircraftTypes);
    
    const airports = [...new Set([
      ...mostRelevantFlight.map(f => f.departure?.airport),
      ...mostRelevantFlight.map(f => f.arrival?.airport)
    ].filter(Boolean))].filter((airport): airport is string => Boolean(airport));
    const airlines = [...new Set(mostRelevantFlight.map(f => f.airline?.name).filter(Boolean))].filter((airline): airline is string => Boolean(airline));

    switch (panelType) {
      case 'aircraft':
        if (Object.keys(aircraftInfo).length === 0 && allAircraftTypes.length > 0) {
          // ONLY show aircraft for the selected/tracked flight, not all flights
          const trackedFlightAircraft = selectedFlight?.aircraft?.type || 
                                       mostRelevantFlight.find(f => f.flightNumber === selectedFlight?.flightNumber)?.aircraft?.type;
          
          // Filter to only include the tracked flight's aircraft
          const trackedAircraftTypes = trackedFlightAircraft 
            ? [trackedFlightAircraft] 
            : allAircraftTypes.slice(0, 1); // Fallback to first aircraft if no specific one found
          
          // Check if we have cached data for the tracked aircraft
          const cachedCount = trackedAircraftTypes.filter(type => getCachedData(`aircraft_${type}`)).length;
          if (cachedCount === 0 || cachedCount < trackedAircraftTypes.length) {
            try {
              const data = await generateAircraftInfo(trackedAircraftTypes);
              setAircraftInfo(prev => ({ ...prev, ...data }));
              } catch (error) {
              // No fallback data - just let it remain empty
            }
          } else {
            // Load from cache
            const cachedData: Record<string, AircraftInfo> = {};
            trackedAircraftTypes.forEach(type => {
              const cached = getCachedData(`aircraft_${type}`);
              if (cached && type) cachedData[type] = cached;
            });
            setAircraftInfo(cachedData);
          }
        }
        break;
      case 'weather':
        if (Object.keys(weatherInsights).length === 0 && airports.length > 0) {
          const cachedCount = airports.filter(airport => getCachedData(`weather_${airport}`)).length;
          if (cachedCount === 0 || cachedCount < airports.length) {
            try {
              const data = await generateWeatherInsights(airports);
              setWeatherInsights(prev => ({ ...prev, ...data }));
              } catch (error) {
              // No fallback data - just let it remain empty
            }
          } else {
            const cachedData: Record<string, WeatherInsight> = {};
            airports.forEach(airport => {
              const cached = getCachedData(`weather_${airport}`);
              if (cached && airport) cachedData[airport] = cached;
            });
            setWeatherInsights(cachedData);
          }
        }
        break;
      case 'policies':
        if (Object.keys(delayPolicies).length === 0 && airlines.length > 0) {
          const cachedCount = airlines.filter(airline => getCachedData(`policy_${airline}`)).length;
          if (cachedCount === 0 || cachedCount < airlines.length) {
            try {
              const data = await generateDelayPolicies(airlines);
              setDelayPolicies(prev => ({ ...prev, ...data }));
              } catch (error) {
              // No fallback data - just let it remain empty
            }
          } else {
            const cachedData: Record<string, DelayPolicy> = {};
            airlines.forEach(airline => {
              const cached = getCachedData(`policy_${airline}`);
              if (cached && airline) cachedData[airline] = cached;
            });
            setDelayPolicies(cachedData);
          }
        }
        break;
      case 'transport':
        if (Object.keys(transportInfo).length === 0 && airports.length > 0) {
          const cachedCount = airports.filter(airport => getCachedData(`transport_${airport}`)).length;
          if (cachedCount === 0 || cachedCount < airports.length) {
            try {
              const data = await generateTransportInfo(airports);
              setTransportInfo(prev => ({ ...prev, ...data }));
              } catch (error) {
              // No fallback data - just let it remain empty
            }
          } else {
            const cachedData: Record<string, AirportTransport> = {};
            airports.forEach(airport => {
              const cached = getCachedData(`transport_${airport}`);
              if (cached && airport) cachedData[airport] = cached;
            });
            setTransportInfo(cachedData);
          }
        }
        break;
      case 'alternatives':
        const problematicFlights = getProblematicFlights();
        if (Object.keys(alternativeFlights).length === 0) {
          // Only load alternatives if there are problematic flights
          if (problematicFlights.length > 0) {
            const routes = problematicFlights.map(f => {
              const departure = f.departure?.airport || 'Unknown';
              const arrival = f.arrival?.airport || 'Unknown';
              return `${departure} → ${arrival}`;
            }).filter((route, index, arr) => arr.indexOf(route) === index); // Remove duplicates
            
            if (routes.length > 0) {
              const cachedCount = routes.filter(route => getCachedData(`alternatives_${route}`)).length;
              if (cachedCount === 0 || cachedCount < routes.length) {
                try {
                  const data = await generateAlternativeFlights(routes);
                  setAlternativeFlights(prev => ({ ...prev, ...data }));
                } catch (error) {
                  console.warn('[TRACKER] Alternatives API failed:', error);
                  // No fallback data - just let it remain empty
                }
              } else {
                const cachedData: Record<string, AlternativeFlight[]> = {};
                routes.forEach(route => {
                  const cached = getCachedData(`alternatives_${route}`);
                  if (cached && route) cachedData[route] = cached;
                });
                setAlternativeFlights(cachedData);
              }
            }
          }
          // No fallback data for when there are no problematic flights
        }
        break;
    }
  }, [mostRelevantFlight, aircraftInfo, weatherInsights, delayPolicies, transportInfo, alternativeFlights, generateAircraftInfo, generateWeatherInsights, generateDelayPolicies, generateTransportInfo, generateAlternativeFlights, getProblematicFlights, getCachedData]);

  // Handle panel switching with on-demand loading
  const handlePanelSwitch = useCallback(async (panel: typeof activePanel) => {
    setActivePanel(panel);
    
    // Load data on demand for non-core panels
    if (['aircraft', 'weather', 'policies', 'transport', 'alternatives'].includes(panel)) {
      await loadPanelData(panel);
    }
  }, [loadPanelData]);

  // Parse response functions
  const parseInsightsResponse = (response: string): TrackerAIInsight[] => {
    console.log('📝 [TRACKER] Parsing insights response:', response.substring(0, 200));
    
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        console.log('✨ [TRACKER] Found JSON match:', jsonMatch[0].substring(0, 200));
        const parsed = JSON.parse(jsonMatch[0]);
        const insights = parsed.map((item: any, index: number) => ({
          id: `tracker_insight_${Date.now()}_${index}`,
          type: item.type || 'general',
          title: item.title || `Tracking Insight ${index + 1}`,
          content: item.content || '',
          confidence: item.confidence || 75,
          timestamp: new Date(),
          severity: item.severity || 'medium'
        }));
        console.log(`✅ [TRACKER] Successfully parsed ${insights.length} insights`);
        return insights;
      } else {
        console.warn('⚠️ [TRACKER] No JSON array found in response');
      }
    } catch (e) {
      console.error('❌ [TRACKER] JSON parsing failed:', e);
    }

    // Fallback: extract insights from text
    console.log('🔄 [TRACKER] Attempting fallback text parsing');
    const insights = response.split('\n').filter(line => 
      line.includes('delay') || line.includes('reliability') || line.includes('route') || 
      line.includes('airport') || line.includes('weather')
    ).slice(0, 4);

    const fallbackInsights = insights.map((content, index) => ({
      id: `tracker_insight_${Date.now()}_${index}`,
      type: 'general' as const,
      title: `Tracking Analysis ${index + 1}`,
      content: content.trim(),
      confidence: 80,
      timestamp: new Date(),
      severity: 'medium' as const
    }));

    console.log(`✅ [TRACKER] Generated ${fallbackInsights.length} fallback insights`);
    return fallbackInsights;
  };

  const parseAlertsResponse = (response: string): TrackerAIAlert[] => {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any, index: number) => ({
          id: `tracker_alert_${Date.now()}_${index}`,
          type: item.type || 'general',
          title: item.title || 'Flight Tracking Alert',
          content: item.content || item.description || '',
          source: item.source || 'Real-time Monitoring',
          timestamp: new Date(),
          priority: item.priority || 'medium',
          affectedFlights: item.affectedFlights || []
        }));
      }
    } catch (e) {
    }

    return [];
  };

  // Helper function to ensure timestamps are Date objects
  const ensureTimestamp = (timestamp: any): Date => {
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'string') return new Date(timestamp);
    if (typeof timestamp === 'number') return new Date(timestamp);
    return new Date();
  };

  const parsePredictionsResponse = (response: string, flights: SavedFlight[]): TrackerAIPrediction[] => {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any, index: number) => {
          // Find matching flight by number, or use fallback
          const matchingFlight = flights.find(f => 
            item.flightNumber && f.flightNumber.includes(item.flightNumber.replace(/[^A-Z0-9]/g, ''))
          ) || flights[index];
          
          return {
            id: `tracker_prediction_${Date.now()}_${index}`,
            type: item.type || 'delay',
            flightNumber: matchingFlight?.flightNumber || item.flightNumber || 'Unknown',
            probability: Math.min(100, Math.max(0, Math.round((item.probability || 0) * (item.probability > 1 ? 1 : 100)))), // Handle both decimal and percentage
            reason: item.reason || 'Real-time operational factors',
            timeframe: item.timeframe || 'Next 2 hours',
            confidence: item.confidence || 75,
            impact: item.impact || 'medium',
            estimatedDelay: item.estimatedDelay || 'TBD',
            recommendation: item.recommendation || 'Monitor flight status'
          };
        });
      }
    } catch (e) {
    }

    return [];
  };

  // Parse aircraft response
  const parseAircraftResponse = (response: string, aircraft: string): AircraftInfo => {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Handle capacity as either number or object
        let capacity = 0;
        if (typeof parsed.capacity === 'number') {
          capacity = parsed.capacity;
        } else if (typeof parsed.capacity === 'object' && parsed.capacity !== null) {
          // If capacity is an object like {passengers: 180, cargo: 1000}, use passengers
          capacity = parsed.capacity.passengers || parsed.capacity.passenger || 0;
        }
        
        return {
          model: parsed.model || aircraft,
          manufacturer: parsed.manufacturer || 'Unknown',
          capacity: capacity,
          range: parsed.range || 0,
          description: parsed.description || 'Aircraft information pending',
          amenities: Array.isArray(parsed.amenities) ? parsed.amenities : [],
          safetyRating: parsed.safetyRating || 'Standard'
        };
      }
    } catch (e) {
    }

    return {
      model: aircraft,
      manufacturer: 'Unknown',
      capacity: 0,
      range: 0,
      description: 'Configure API key for detailed aircraft information',
      amenities: [],
      safetyRating: 'Standard'
    };
  };

  // Parse weather response
  const parseWeatherResponse = (response: string): WeatherInsight => {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          departure: parsed.departure || {
            current: 'Weather data pending',
            forecast: 'Forecast pending',
            impact: 'low' as const
          },
          arrival: parsed.arrival || {
            current: 'Weather data pending', 
            forecast: 'Forecast pending',
            impact: 'low' as const
          },
          route: parsed.route || {
            conditions: 'Route conditions pending',
            turbulence: 'low' as const
          }
        };
      }
    } catch (e) {
    }

    return {
      departure: { current: 'Configure API key', forecast: 'Weather data pending', impact: 'low' },
      arrival: { current: 'Configure API key', forecast: 'Weather data pending', impact: 'low' },
      route: { conditions: 'Route data pending', turbulence: 'low' }
    };
  };

  // Parse policy response
  const parsePolicyResponse = (response: string, airline: string): DelayPolicy => {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          airline: parsed.airline || airline,
          oneHourPlus: parsed.oneHourPlus || {
            compensation: 'Policy information pending',
            vouchers: 'Voucher policy pending',
            rebooking: 'Rebooking policy pending'
          },
          cancellation: parsed.cancellation || {
            refund: 'Refund policy pending',
            rebooking: 'Rebooking policy pending', 
            accommodation: 'Accommodation policy pending'
          },
          alternatives: parsed.alternatives || []
        };
      }
    } catch (e) {
    }

    return {
      airline,
      oneHourPlus: {
        compensation: 'Configure API key for policy details',
        vouchers: 'Policy information pending',
        rebooking: 'Policy information pending'
      },
      cancellation: {
        refund: 'Policy information pending',
        rebooking: 'Policy information pending',
        accommodation: 'Policy information pending'
      },
      alternatives: []
    };
  };

  // Parse transport response
  const parseTransportResponse = (response: string, airport: string): AirportTransport => {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          airport: parsed.airport || airport,
          fullName: parsed.fullName || `${airport} Airport`,
          city: parsed.city || 'City',
          country: parsed.country || 'Country',
          currency: parsed.currency || 'Local Currency',
          options: (parsed.options || []).map((option: any) => ({
            type: option.type || 'taxi',
            name: option.name || 'Transport Service',
            cost: option.cost || 'Price pending',
            duration: option.duration || 'Duration pending',
            availability: option.availability || 'Availability pending',
            route: option.route || '',
            distance: option.distance || ''
          }))
        };
      }
    } catch (e) {
      console.warn(`⚠️ [TRACKER] Failed to parse transport response for ${airport}`);
    }

    // Return minimal fallback that indicates loading/pending state
    return {
      airport,
      fullName: `${airport} Airport`,
      city: 'Loading...',
      country: 'Loading...',
      currency: 'Local Currency',
      options: [{
        type: 'taxi',
        name: 'Transport information loading...',
        cost: 'Fetching pricing...',
        duration: 'Calculating duration...',
        availability: 'Checking availability...',
        route: '',
        distance: ''
      }]
    };
  };

  // Main refresh function
  // Main refresh function - can load from cache or force fresh data
  const refreshData = useCallback(async (forceRefresh = false) => {
    const refreshType = forceRefresh ? 'FORCE REFRESH (clearing cache)' : 'REFRESH (using cache if available)';
    console.log(`[TRACKER] ====== Starting ${refreshType} ======`);
    console.log(`📊 [TRACKER] State: ${flights.length} flights, Loading: ${loading}, API Credits: ${apiCredits}`);

    if (flights.length === 0 || loading) {
      console.warn('⚠️ [TRACKER] Refresh skipped - No flights or already loading');
      return;
    }

    // Only check API credits if forcing refresh
    if (forceRefresh) {
      const hasApiCredits = canMakeCall('high');
      if (!hasApiCredits) {
        setError('Daily API limit reached (25 calls per flight). Please try again tomorrow.');
        console.warn('⚠️ [TRACKER] API limit reached - cannot refresh');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Only clear cache if forcing refresh
      if (forceRefresh) {
        console.log(`🚀 [TRACKER] Clearing cached data for flight: ${flightHash}`);
        
        // Clear all cached data for core features using per-flight keys
        localStorage.removeItem(getCacheKey('insights'));
        localStorage.removeItem(getCacheKey('alerts'));
        localStorage.removeItem(getCacheKey('predictions'));
        
        // Clear state immediately
        setInsights([]);
        setAlerts([]);
        setPredictions([]);
      }
      
      console.log('📋 [TRACKER] Flight details:', flights.map(f => ({
        number: f.flightNumber,
        status: f.status,
        from: f.departure?.airport,
        to: f.arrival?.airport,
        time: f.departure?.scheduledTime
      })));
      
      // Fetch data in parallel
      const promises: Promise<any>[] = [];
      
      console.log(`📊 [TRACKER] Fetching insights (forceRefresh: ${forceRefresh})...`);
      promises.push(generateInsights(forceRefresh));
      
      console.log(`⚠️ [TRACKER] Fetching alerts (forceRefresh: ${forceRefresh})...`);
      promises.push(generateAlerts(forceRefresh));
      
      console.log(`🔮 [TRACKER] Fetching predictions (forceRefresh: ${forceRefresh})...`);
      promises.push(generatePredictions(forceRefresh));
      

      // Wait for all to complete
      const results = await Promise.allSettled(promises);
      
      // Process insights
      if (results[0].status === 'fulfilled') {
        setInsights((results[0] as PromiseFulfilledResult<any>).value);
        console.log(`✅ [TRACKER] Generated ${(results[0] as PromiseFulfilledResult<any>).value.length} insights`);
      } else {
        console.error('❌ [TRACKER] Failed to generate insights:', (results[0] as PromiseRejectedResult).reason);
        setInsights([]);
      }
      
      // Process alerts
      if (results[1].status === 'fulfilled') {
        setAlerts((results[1] as PromiseFulfilledResult<any>).value);
        console.log(`✅ [TRACKER] Generated ${(results[1] as PromiseFulfilledResult<any>).value.length} alerts`);
      } else {
        console.error('❌ [TRACKER] Failed to generate alerts:', (results[1] as PromiseRejectedResult).reason);
        setAlerts([]);
      }
      
      // Process predictions
      if (results[2].status === 'fulfilled') {
        setPredictions((results[2] as PromiseFulfilledResult<any>).value);
        console.log(`✅ [TRACKER] Generated ${(results[2] as PromiseFulfilledResult<any>).value.length} predictions`);
      } else {
        console.error('❌ [TRACKER] Failed to generate predictions:', (results[2] as PromiseRejectedResult).reason);
        setPredictions([]);
      }

      setLastUpdate(new Date());
      onRefresh?.();
      const dataSource = forceRefresh ? 'fresh data' : 'cache/fresh data';
      console.log(`✅ [TRACKER] Refresh complete with ${dataSource}`);
    } catch (err) {
      console.error('❌ [TRACKER] Refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh tracking insights');
    } finally {
      setLoading(false);
    }
  }, [flights, apiCredits, dailyCallCount, canMakeCall, generateInsights, generateAlerts, generatePredictions, onRefresh, flightHash, getCacheKey]);

  // Auto-refresh on flight changes - with debouncing
  useEffect(() => {
    if (flights.length > 0 && !loading) {
      // Add small delay to prevent rapid consecutive calls
      const timeoutId = setTimeout(() => {
        refreshData(false); // Use cache if available
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [flightHash]); // Use flightHash instead of flights.length for better change detection

  // Get severity/priority colors
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      default:
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'text-red-600 bg-red-100';
    if (probability >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  // Early return if no relevant flights found
  if (mostRelevantFlight.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="text-center py-12">
          <Plane className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Active Flights Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            All tracked flights have arrived, completed, or been cancelled
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Add upcoming or live flights to get AI insights and predictions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6">
      {/* Header - Mobile Optimized */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Flight Tracker AI
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Real-time intelligence for tracked flights
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            {/* API Usage Indicator with Cost Warning - Mobile Optimized */}
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Zap className={`w-3 h-3 sm:w-4 sm:h-4 ${apiCredits <= 3 ? 'text-red-500' : apiCredits <= 8 ? 'text-orange-500' : 'text-green-600'}`} />
              <span className={`${apiCredits <= 3 ? 'text-red-600 font-bold' : apiCredits <= 8 ? 'text-orange-600 font-medium' : 'text-green-600'}`}>
                {dailyCallCount}/{MAX_DAILY_CALLS} calls
              </span>
              {apiCredits <= 5 && (
                <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  {apiCredits <= 3 ? '⚠ Core Only' : '📊 Priority'}
                </span>
              )}
            </div>
            
            
            {/* Refresh Button - Mobile Optimized */}
            <button
              onClick={() => refreshData(true)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              title={!canMakeCall('high') ? 'Daily API limit reached (25 calls). Try again tomorrow.' : 'Clear cache and fetch fresh data'}
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">↻</span>
            </button>
          </div>
        </div>

        {/* Last Update Info */}
        {lastUpdate && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Panel Navigation - Mobile Optimized */}
      <div className="mb-6 sm:mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1 sm:p-2">
        <div className="grid grid-cols-2 sm:flex gap-1 sm:gap-2 flex-wrap">
          <button
            onClick={() => handlePanelSwitch('insights')}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              activePanel === 'insights'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">📊 Insights</span>
            <span className="sm:hidden">📊</span>
            {insights.length > 0 && (
              <span className="bg-white/20 text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded-full">
                {insights.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => handlePanelSwitch('alerts')}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              activePanel === 'alerts'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">⚠ Alerts</span>
            <span className="sm:hidden">⚠</span>
            {alerts.length > 0 && (
              <span className="bg-white/20 text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded-full">
                {alerts.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => handlePanelSwitch('predictions')}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              activePanel === 'predictions'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">📈 Predictions</span>
            <span className="sm:hidden">📈</span>
            {predictions.length > 0 && (
              <span className="bg-white/20 text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded-full">
                {predictions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handlePanelSwitch('aircraft')}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              activePanel === 'aircraft'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">✈ Aircraft</span>
            <span className="sm:hidden">✈</span>
            {Object.keys(aircraftInfo).length > 0 && (
              <span className="bg-white/20 text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded-full">
                {Object.keys(aircraftInfo).length}
              </span>
            )}
          </button>

          <button
            onClick={() => handlePanelSwitch('weather')}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              activePanel === 'weather'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <CloudSnow className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">🌤 Weather</span>
            <span className="sm:hidden">🌤</span>
            {Object.keys(weatherInsights).length > 0 && (
              <span className="bg-white/20 text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded-full">
                {Object.keys(weatherInsights).length}
              </span>
            )}
          </button>

          <button
            onClick={() => handlePanelSwitch('policies')}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              activePanel === 'policies'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">📋 Policies</span>
            <span className="sm:hidden">📋</span>
            {Object.keys(delayPolicies).length > 0 && (
              <span className="bg-white/20 text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded-full">
                {Object.keys(delayPolicies).length}
              </span>
            )}
          </button>

          <button
            onClick={() => handlePanelSwitch('transport')}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              activePanel === 'transport'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Car className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">🚗 Transport</span>
            <span className="sm:hidden">🚗</span>
            {Object.keys(transportInfo).length > 0 && (
              <span className="bg-white/20 text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded-full">
                {Object.keys(transportInfo).length}
              </span>
            )}
          </button>

          <button
            onClick={() => handlePanelSwitch('alternatives')}
            className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              activePanel === 'alternatives'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">✈️ Alternatives</span>
            <span className="sm:hidden">🔄</span>
            {getProblematicFlights().length > 0 && (
              <span className="bg-white/20 text-xs px-1 py-0.5 sm:px-2 sm:py-1 rounded-full">
                {getProblematicFlights().length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="min-h-[400px]">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">
                Analyzing tracked flight data...
              </p>
            </div>
          </div>
        )}

        {!loading && flights.length === 0 && (
          <div className="text-center py-12">
            <Plane className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Tracked Flights
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Add flights to your tracker to get AI-powered real-time insights, alerts, and predictions.
            </p>
          </div>
        )}

        {!loading && flights.length > 0 && (
          <>
            {/* Insights Panel - Mobile Optimized */}
            {activePanel === 'insights' && (
              <div className="space-y-4 sm:space-y-6">
                {loadingStates.insights && (
                  <div className="grid gap-3 sm:gap-6 sm:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-pulse">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          </div>
                          <div className="w-12 h-5 sm:w-16 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                          <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!loadingStates.insights && (
                  <div className="grid gap-3 sm:gap-6 sm:grid-cols-2">
                    {insights.map((insight) => (
                      <div
                        key={insight.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
                      >
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${getSeverityColor(insight.severity)}`}>
                              {insight.type === 'delay' && <Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
                              {insight.type === 'reliability' && <Shield className="w-4 h-4 sm:w-5 sm:h-5" />}
                              {insight.type === 'route' && <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />}
                              {insight.type === 'aircraft' && <Plane className="w-4 h-4 sm:w-5 sm:h-5" />}
                              {insight.type === 'general' && <Info className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                                {insight.title}
                              </h3>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                <span>Confidence: {insight.confidence}%</span>
                              </div>
                            </div>
                          </div>
                          <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${getSeverityColor(insight.severity)}`}>
                            {insight.severity}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                          {insight.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {!loadingStates.insights && insights.length === 0 && (
                  <div className="text-center py-6 sm:py-8">
                    <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                      No tracking insights available. Click refresh to analyze your tracked flights.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Alerts Panel */}
            {activePanel === 'alerts' && (
              <div className="space-y-4">
                {loadingStates.alerts && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          </div>
                          <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                          <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!loadingStates.alerts && alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getSeverityColor(alert.priority)}`}>
                          {alert.type === 'weather' && <CloudSnow className="w-5 h-5" />}
                          {alert.type === 'airport' && <Plane className="w-5 h-5" />}
                          {alert.type === 'airline' && <Navigation className="w-5 h-5" />}
                          {alert.type === 'government' && <Shield className="w-5 h-5" />}
                          {alert.type === 'security' && <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {alert.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {alert.source} • {ensureTimestamp(alert.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.priority)}`}>
                        {alert.priority}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                      {alert.content}
                    </p>
                    {alert.affectedFlights && alert.affectedFlights.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {alert.affectedFlights.map((flightNumber) => (
                          <span
                            key={flightNumber}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                          >
                            {flightNumber}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {!loadingStates.alerts && alerts.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No real-time alerts at this time. We'll monitor your tracked flights for updates.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Predictions Panel */}
            {activePanel === 'predictions' && (
              <div className="space-y-4">
                {loadingStates.predictions && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="mt-4 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!loadingStates.predictions && predictions.map((prediction) => (
                  <div
                    key={prediction.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getProbabilityColor(prediction.probability)}`}>
                          <span className="font-bold text-lg">
                            {prediction.probability}%
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {prediction.flightNumber} - {prediction.type.toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {prediction.timeframe} • Confidence: {prediction.confidence}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          prediction.impact === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                          prediction.impact === 'medium' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                        }`}>
                          {prediction.impact.toUpperCase()} IMPACT
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Prediction Analysis:
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                        {prediction.reason}
                      </p>
                      
                      {(prediction.estimatedDelay || prediction.recommendation) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {prediction.estimatedDelay && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-orange-500" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  ESTIMATED DELAY
                                </span>
                              </div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {prediction.estimatedDelay}
                              </p>
                            </div>
                          )}
                          
                          {prediction.recommendation && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Info className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  RECOMMENDATION
                                </span>
                              </div>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                {prediction.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {!loadingStates.predictions && predictions.length === 0 && (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No active tracked flights to predict. Add some in-flight or upcoming flights to see real-time predictions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Aircraft Panel */}
            {activePanel === 'aircraft' && (
              <div className="space-y-6">
                {loadingStates.aircraft && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!loadingStates.aircraft && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {Object.entries(aircraftInfo).map(([aircraft, info]) => (
                      <div
                        key={aircraft}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                            <Plane className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {info.model}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {info.manufacturer}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {typeof info.capacity === 'number' && info.capacity > 0 ? info.capacity : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Passengers</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {typeof info.range === 'number' && info.range > 0 ? `${info.range}km` : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Range</div>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                          {info.description}
                        </p>
                        
                        {info.amenities && info.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {info.amenities.map((amenity, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Safety Rating
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            {info.safetyRating}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!loadingStates.aircraft && Object.keys(aircraftInfo).length === 0 && (
                  <div className="text-center py-8">
                    <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No aircraft information available. Aircraft data will load when you switch to this panel.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Weather Panel */}
            {activePanel === 'weather' && (
              <div className="space-y-6">
                {loadingStates.weather && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                        <div className="space-y-4">
                          <div className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
                          <div className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
                          <div className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!loadingStates.weather && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {Object.entries(weatherInsights).map(([airport, weather]) => (
                      <div
                        key={airport}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center">
                            <CloudSnow className="w-6 h-6 text-cyan-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {airport} Airport Weather
                          </h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Departure</h4>
                            <p className="text-sm text-blue-800 dark:text-blue-300 mb-1">
                              Current: {weather.departure.current}
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                              Forecast: {weather.departure.forecast}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              weather.departure.impact === 'high' ? 'bg-red-100 text-red-700' :
                              weather.departure.impact === 'medium' ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {weather.departure.impact.toUpperCase()} IMPACT
                            </span>
                          </div>
                          
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">Arrival</h4>
                            <p className="text-sm text-green-800 dark:text-green-300 mb-1">
                              Current: {weather.arrival.current}
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-400 mb-2">
                              Forecast: {weather.arrival.forecast}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              weather.arrival.impact === 'high' ? 'bg-red-100 text-red-700' :
                              weather.arrival.impact === 'medium' ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {weather.arrival.impact.toUpperCase()} IMPACT
                            </span>
                          </div>
                          
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <h4 className="font-medium text-purple-900 dark:text-purple-200 mb-2">Route Conditions</h4>
                            <p className="text-sm text-purple-800 dark:text-purple-300 mb-2">
                              {weather.route.conditions}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              weather.route.turbulence === 'high' ? 'bg-red-100 text-red-700' :
                              weather.route.turbulence === 'medium' ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {weather.route.turbulence.toUpperCase()} TURBULENCE
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!loadingStates.weather && Object.keys(weatherInsights).length === 0 && (
                  <div className="text-center py-8">
                    <CloudSnow className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No weather insights available. Weather data will load when you switch to this panel.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Policies Panel */}
            {activePanel === 'policies' && (
              <div className="space-y-6">
                {loadingStates.policies && (
                  <div className="space-y-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="h-24 bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
                          <div className="h-24 bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!loadingStates.policies && (
                  <div className="space-y-6">
                    {Object.entries(delayPolicies).map(([airline, policy]) => (
                      <div
                        key={airline}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-red-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {policy.airline} Policies
                          </h3>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <h4 className="font-medium text-orange-900 dark:text-orange-200 mb-3">1+ Hour Delays</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-orange-800 dark:text-orange-300">Compensation:</span>
                                <p className="text-orange-700 dark:text-orange-400">{policy.oneHourPlus.compensation}</p>
                              </div>
                              <div>
                                <span className="font-medium text-orange-800 dark:text-orange-300">Vouchers:</span>
                                <p className="text-orange-700 dark:text-orange-400">{policy.oneHourPlus.vouchers}</p>
                              </div>
                              <div>
                                <span className="font-medium text-orange-800 dark:text-orange-300">Rebooking:</span>
                                <p className="text-orange-700 dark:text-orange-400">{policy.oneHourPlus.rebooking}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <h4 className="font-medium text-red-900 dark:text-red-200 mb-3">Cancellations</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-red-800 dark:text-red-300">Refund:</span>
                                <p className="text-red-700 dark:text-red-400">{policy.cancellation.refund}</p>
                              </div>
                              <div>
                                <span className="font-medium text-red-800 dark:text-red-300">Rebooking:</span>
                                <p className="text-red-700 dark:text-red-400">{policy.cancellation.rebooking}</p>
                              </div>
                              <div>
                                <span className="font-medium text-red-800 dark:text-red-300">Accommodation:</span>
                                <p className="text-red-700 dark:text-red-400">{policy.cancellation.accommodation}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {policy.alternatives && policy.alternatives.length > 0 && (
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Alternative Options</h4>
                            <div className="flex flex-wrap gap-2">
                              {policy.alternatives.map((alternative, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                                >
                                  {alternative}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!loadingStates.policies && Object.keys(delayPolicies).length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No airline policies available. Policy data will load when you switch to this panel.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Transport Panel */}
            {activePanel === 'transport' && (
              <div className="space-y-6">
                {loadingStates.transport && (
                  <div className="space-y-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {[1, 2, 3].map((j) => (
                            <div key={j} className="h-20 bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!loadingStates.transport && (
                  <div className="space-y-8">
                    {/* Check if we have any valid transport data */}
                    {(() => {
                      const departureAirports = [...new Set(flights.map(f => f.departure?.airport))].filter(Boolean);
                      const arrivalAirports = [...new Set(flights.map(f => f.arrival?.airport))].filter(Boolean);
                      
                      // Filter out transport data that has loading/error states
                      const hasValidTransportData = Object.values(transportInfo).some(t => 
                        t && t.options && t.options.length > 0 && 
                        !t.options[0].name.includes('loading') && 
                        !t.options[0].name.includes('Configure API key')
                      );
                      
                      // Show empty state if no valid data
                      if (!hasValidTransportData && Object.keys(transportInfo).length === 0) {
                        return (
                          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              Transport Information Unavailable
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              Transport options will load automatically when you refresh the page or switch to this tab.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              {!canMakeCall('low') 
                                ? 'Daily API limit reached. Please try again tomorrow or wait for cached data to refresh.'
                                : 'Click the refresh button above to load transport options.'}
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <>
                          {/* Departure Airports Transport */}
                          {departureAirports.length > 0 && (
                            <div className="space-y-6">
                              <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                  <Plane className="w-4 h-4 text-blue-600 transform -rotate-45" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                  Departure Airport Transport
                                </h2>
                              </div>
                              
                              {departureAirports.map((airport) => {
                                const transport = transportInfo[airport];
                                // Skip if no transport or if it's showing loading/error state
                                if (!transport || 
                                    (transport.options[0]?.name.includes('loading') || 
                                     transport.options[0]?.name.includes('Configure API key'))) {
                                  return null;
                                }
                                
                                return (
                                  <div
                                    key={`departure-${airport}`}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                                  >
                                    <div className="flex items-center gap-3 mb-6">
                                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                        <Car className="w-6 h-6 text-blue-600" />
                                      </div>
                                      <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                          {transport.fullName || transport.airport} (Departure)
                                        </h3>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">
                                          {transport.city}, {transport.country} • {transport.currency}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          Transport options to the airport
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                      {transport.options.map((option, index) => (
                                        <div
                                          key={index}
                                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-blue-50/50 dark:bg-blue-900/10"
                                        >
                                          <div className="flex items-center gap-2 mb-3">
                                            {option.type === 'taxi' && <Car className="w-5 h-5 text-yellow-600" />}
                                            {option.type === 'train' && <Navigation className="w-5 h-5 text-green-600" />}
                                            {option.type === 'bus' && <Navigation className="w-5 h-5 text-blue-600" />}
                                            {option.type === 'metro' && <Navigation className="w-5 h-5 text-purple-600" />}
                                            {option.type === 'car_rental' && <Car className="w-5 h-5 text-red-600" />}
                                            {option.type === 'rideshare' && <Car className="w-5 h-5 text-indigo-600" />}
                                            {option.type === 'shuttle' && <Navigation className="w-5 h-5 text-orange-600" />}
                                            <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                                              {option.type.replace('_', ' ')}
                                            </h4>
                                          </div>
                                          
                                          <div className="space-y-2 text-sm">
                                            <div>
                                              <span className="font-medium text-gray-700 dark:text-gray-300">Service:</span>
                                              <p className="text-gray-600 dark:text-gray-400">{option.name}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-700 dark:text-gray-300">Cost:</span>
                                              <p className="text-gray-600 dark:text-gray-400">{option.cost}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-700 dark:text-gray-300">Duration:</span>
                                              <p className="text-gray-600 dark:text-gray-400">{option.duration}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-700 dark:text-gray-300">Available:</span>
                                              <p className="text-gray-600 dark:text-gray-400">{option.availability}</p>
                                            </div>
                                            {option.route && (
                                              <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Route:</span>
                                                <p className="text-gray-600 dark:text-gray-400">{option.route}</p>
                                              </div>
                                            )}
                                            {option.distance && (
                                              <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Distance:</span>
                                                <p className="text-gray-600 dark:text-gray-400">{option.distance}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Arrival Airports Transport */}
                          {arrivalAirports.length > 0 && (
                            <div className="space-y-6">
                              <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                  <Plane className="w-4 h-4 text-green-600 transform rotate-45" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                  Arrival Airport Transport
                                </h2>
                              </div>
                              
                              {arrivalAirports.map((airport) => {
                                const transport = transportInfo[airport];
                                // Skip if no transport or if it's showing loading/error state
                                if (!transport || 
                                    (transport.options[0]?.name.includes('loading') || 
                                     transport.options[0]?.name.includes('Configure API key'))) {
                                  return null;
                                }
                                
                                return (
                                  <div
                                    key={`arrival-${airport}`}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                                  >
                                    <div className="flex items-center gap-3 mb-6">
                                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                        <Car className="w-6 h-6 text-green-600" />
                                      </div>
                                      <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                          {transport.fullName || transport.airport} (Arrival)
                                        </h3>
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                          {transport.city}, {transport.country} • {transport.currency}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          Transport options from the airport
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                      {transport.options.map((option, index) => (
                                        <div
                                          key={index}
                                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-green-50/50 dark:bg-green-900/10"
                                        >
                                          <div className="flex items-center gap-2 mb-3">
                                            {option.type === 'taxi' && <Car className="w-5 h-5 text-yellow-600" />}
                                            {option.type === 'train' && <Navigation className="w-5 h-5 text-green-600" />}
                                            {option.type === 'bus' && <Navigation className="w-5 h-5 text-blue-600" />}
                                            {option.type === 'metro' && <Navigation className="w-5 h-5 text-purple-600" />}
                                            {option.type === 'car_rental' && <Car className="w-5 h-5 text-red-600" />}
                                            {option.type === 'rideshare' && <Car className="w-5 h-5 text-indigo-600" />}
                                            {option.type === 'shuttle' && <Navigation className="w-5 h-5 text-orange-600" />}
                                            <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                                              {option.type.replace('_', ' ')}
                                            </h4>
                                          </div>
                                          
                                          <div className="space-y-2 text-sm">
                                            <div>
                                              <span className="font-medium text-gray-700 dark:text-gray-300">Service:</span>
                                              <p className="text-gray-600 dark:text-gray-400">{option.name}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-700 dark:text-gray-300">Cost:</span>
                                              <p className="text-gray-600 dark:text-gray-400">{option.cost}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-700 dark:text-gray-300">Duration:</span>
                                              <p className="text-gray-600 dark:text-gray-400">{option.duration}</p>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-700 dark:text-gray-300">Available:</span>
                                              <p className="text-gray-600 dark:text-gray-400">{option.availability}</p>
                                            </div>
                                            {option.route && (
                                              <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Route:</span>
                                                <p className="text-gray-600 dark:text-gray-400">{option.route}</p>
                                              </div>
                                            )}
                                            {option.distance && (
                                              <div>
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Distance:</span>
                                                <p className="text-gray-600 dark:text-gray-400">{option.distance}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {!loadingStates.transport && Object.keys(transportInfo).length === 0 && (
                  <div className="text-center py-8">
                    <Car className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No transport information available. Transport data will load when you switch to this panel.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activePanel === 'alternatives' && (
              <div className="space-y-6">
                {loadingStates.alternatives && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Finding alternative flights...</p>
                    </div>
                  </div>
                )}

                {!loadingStates.alternatives && (
                  <div className="space-y-6">
                    {(() => {
                      const problematicFlights = getProblematicFlights();
                      
                      if (problematicFlights.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              All Flights On Track
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              No delays or cancellations detected. Your flights appear to be operating normally.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-red-900 dark:text-red-100 text-lg">
                                  Flights Needing Attention
                                </h3>
                                <p className="text-red-700 dark:text-red-300 text-sm">
                                  {problematicFlights.length} flight{problematicFlights.length > 1 ? 's' : ''} with delays or cancellations
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-4">
                              {problematicFlights.map((flight, index) => {
                                const status = flight.status?.toLowerCase() || '';
                                const isCancelled = status.includes('cancelled') || status.includes('canceled');
                                
                                return (
                                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
                                    <div className="flex items-center justify-between mb-3">
                                      <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                          {flight.flightNumber} - {flight.airline?.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {flight.departure?.airport} → {flight.arrival?.airport}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                          isCancelled 
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                        }`}>
                                          {isCancelled ? 'Cancelled' : 'Delayed'}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      <p>Status: {flight.status}</p>
                                      {flight.departure?.scheduledTime && (
                                        <p>Scheduled: {new Date(flight.departure.scheduledTime).toLocaleString()}</p>
                                      )}
                                      {flight.departure?.estimatedTime && (
                                        <p>Estimated: {new Date(flight.departure.estimatedTime).toLocaleString()}</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {Object.keys(alternativeFlights).length > 0 && (
                            <div className="space-y-6">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                  <Navigation className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Alternative Flight Options
                                  </h2>
                                  <p className="text-sm text-blue-600 dark:text-blue-400">
                                    Available alternatives for affected routes
                                  </p>
                                </div>
                              </div>
                              
                              {Object.entries(alternativeFlights).map(([route, alternatives]) => (
                                <div key={route} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                  <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                      <Navigation className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                        {route}
                                      </h3>
                                      <p className="text-sm text-blue-600 dark:text-blue-400">
                                        {alternatives.length} alternative{alternatives.length > 1 ? 's' : ''} available
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {alternatives.map((alt, index) => (
                                      <div
                                        key={index}
                                        className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                                          alt.status === 'available' 
                                            ? 'border-green-200 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
                                            : alt.status === 'limited'
                                            ? 'border-yellow-200 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10'
                                            : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/10'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                              {alt.flightNumber}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                              {alt.airline}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              alt.status === 'available' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                : alt.status === 'limited'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                            }`}>
                                              {alt.status}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Departure:</span>
                                            <span className="text-gray-600 dark:text-gray-400">{alt.departureTime}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Arrival:</span>
                                            <span className="text-gray-600 dark:text-gray-400">{alt.arrivalTime}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Duration:</span>
                                            <span className="text-gray-600 dark:text-gray-400">{alt.duration}</span>
                                          </div>
                                          {alt.aircraft && (
                                            <div className="flex justify-between">
                                              <span className="font-medium text-gray-700 dark:text-gray-300">Aircraft:</span>
                                              <span className="text-gray-600 dark:text-gray-400">{alt.aircraft}</span>
                                            </div>
                                          )}
                                          {alt.price && (
                                            <div className="flex justify-between">
                                              <span className="font-medium text-gray-700 dark:text-gray-300">Price:</span>
                                              <span className="text-gray-600 dark:text-gray-400 font-semibold">{alt.price}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {Object.keys(alternativeFlights).length === 0 && problematicFlights.length > 0 && (
                            <div className="text-center py-8">
                              <Navigation className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                              <p className="text-gray-600 dark:text-gray-400">
                                No alternative flights loaded yet. Switch to this panel to fetch alternatives.
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FlightTrackerAIInsights;
